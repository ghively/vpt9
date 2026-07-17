import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { execFile } from "node:child_process";

// Animated-gif frame extraction for render clients WITHOUT WebCodecs.
//
// The render-client's GifPlayer decodes gif frames with ImageDecoder — but WebCodecs is
// [SecureContext]-only, and this stack is deliberately served over plain http on a LAN IP
// (see the runbook: it's a LAN instrument). On http://<lan-ip> EVERY browser hides
// ImageDecoder, so gifs froze on their first frame on every projector while localhost
// (a "trustworthy origin") — and therefore the e2e suite — animated fine.
//
// Fix: the server (which already ships ffmpeg for import-by-link) decodes the gif ONCE
// into a spritesheet PNG + a JSON manifest of per-frame delays, cached next to the media
// dir. GifPlayer falls back to fetching these and animating from the sheet — pixel-exact,
// alpha-preserving, and dependent on nothing the insecure context takes away.
//
//   GET /media/<file>.gif/frames      -> manifest JSON (frame count/size, grid, delaysMs)
//   GET /media/<file>.gif/frames.png  -> the spritesheet
//
// Both are generated together on first request and cached on disk; concurrent requests
// for the same gif share one in-flight generation.

const MAX_SHEET_DIM = 8192; // stay well under canvas/texture limits on modest hardware
// Per-frame longest-side cap (px). The old sheet used FULL frame resolution, so a
// 1280x1024 gif became a ~7680x1024 multi-MB PNG the render-client re-fetched per player —
// a big cause of "gifs take forever". A projector composites at output res, not source
// res, so capping frames to 480px shrinks the sheet ~10x with no visible loss. Never
// upscales (min with the source dimension below).
const MAX_FRAME_DIM = 480;

function run(bin, args) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      if (err) reject(new Error(`${bin} failed: ${err.message}`));
      else resolve(stdout);
    });
  });
}

// Frame delays + dimensions via ffprobe. Newer ffmpeg reports `duration_time` per frame,
// older builds `pkt_duration_time` — read whichever exists; a missing/zero delay falls
// back to the GifPlayer's own <20ms -> 100ms convention on the client.
async function probeGif(filePath) {
  const raw = await run("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-show_entries", "frame=duration_time,pkt_duration_time",
    "-of", "json", filePath,
  ]);
  const parsed = JSON.parse(raw);
  const stream = parsed.streams?.[0];
  const frames = parsed.frames ?? [];
  if (!stream?.width || !stream?.height || frames.length === 0) throw new Error("unreadable gif");
  const delaysMs = frames.map((f) => {
    const s = Number(f.duration_time ?? f.pkt_duration_time ?? 0);
    return Number.isFinite(s) && s > 0 ? Math.round(s * 1000) : 0;
  });
  return { width: stream.width, height: stream.height, delaysMs };
}

// Grid layout: pack N frames into a sheet whose sides stay under MAX_SHEET_DIM, scaling
// frames down (never up) if even the best grid would overflow.
function layoutSheet(n, w, h) {
  // First clamp each frame to MAX_FRAME_DIM on its longest side (never upscale), THEN pack.
  const frameScale = Math.min(1, MAX_FRAME_DIM / Math.max(w, h));
  let frameWidth = Math.max(2, Math.round(w * frameScale));
  let frameHeight = Math.max(2, Math.round(h * frameScale));
  // The MAX_SHEET_DIM guard remains as a backstop for pathological frame counts.
  const rowsMax = Math.max(1, Math.floor(MAX_SHEET_DIM / frameHeight));
  let cols = Math.ceil(n / rowsMax);
  if (cols * frameWidth > MAX_SHEET_DIM) {
    const shrink = MAX_SHEET_DIM / (cols * frameWidth);
    frameWidth = Math.max(2, Math.floor(frameWidth * shrink));
    frameHeight = Math.max(2, Math.floor(frameHeight * shrink));
  }
  cols = Math.min(n, Math.max(1, Math.floor(MAX_SHEET_DIM / frameWidth)));
  const rows = Math.ceil(n / cols);
  return { cols, rows, frameWidth, frameHeight };
}

export function createFramesProvider({ mediaDir }) {
  const cacheDir = join(mediaDir, ".frames");
  const inflight = new Map(); // filename -> Promise<manifest>

  async function generate(filename) {
    const filePath = join(mediaDir, filename);
    const { width, height, delaysMs } = await probeGif(filePath);
    const n = delaysMs.length;
    const { cols, rows, frameWidth, frameHeight } = layoutSheet(n, width, height);
    mkdirSync(cacheDir, { recursive: true });
    const sheetPath = join(cacheDir, `${filename}.png`);
    const tmpPath = join(cacheDir, `${filename}.tmp-${randomBytes(6).toString("hex")}.png`);
    // scale first (no-op at scale 1), then tile the full grid into one RGBA png. ffmpeg's
    // gif decoder pre-composites disposal/patch frames, so every cell is a complete image.
    await run("ffmpeg", [
      "-y", "-v", "error", "-i", filePath,
      "-vf", `scale=${frameWidth}:${frameHeight},tile=${cols}x${rows}`,
      "-frames:v", "1", tmpPath,
    ]);
    renameSync(tmpPath, sheetPath);
    const manifest = { frameCount: n, frameWidth, frameHeight, cols, rows, delaysMs };
    // Write the manifest atomically (tmp + rename), like the sheet above. A direct
    // writeFileSync could leave a TRUNCATED .json if the process is killed mid-write, and
    // get() below would then JSON.parse it into a throw → a permanent 500 for that gif that
    // never self-heals (the existence check keeps finding the corrupt file).
    const manifestPath = join(cacheDir, `${filename}.json`);
    const manifestTmp = join(cacheDir, `${filename}.tmp-${randomBytes(6).toString("hex")}.json`);
    writeFileSync(manifestTmp, JSON.stringify(manifest));
    renameSync(manifestTmp, manifestPath);
    return manifest;
  }

  // Returns { manifest, sheetPath }. Generation errors propagate to the caller (mapped to
  // a 500 by the route) and are not cached, so a transient failure can be retried.
  async function get(filename) {
    const manifestPath = join(cacheDir, `${filename}.json`);
    const sheetPath = join(cacheDir, `${filename}.png`);
    if (existsSync(manifestPath) && existsSync(sheetPath)) {
      // A manifest corrupted by an older non-atomic write (or any external cause) must not
      // 500 forever — fall through to regeneration instead of letting the parse throw.
      try {
        return { manifest: JSON.parse(readFileSync(manifestPath, "utf8")), sheetPath };
      } catch { /* corrupt manifest — regenerate below */ }
    }
    if (!inflight.has(filename)) {
      inflight.set(filename, generate(filename).finally(() => inflight.delete(filename)));
    }
    const manifest = await inflight.get(filename);
    return { manifest, sheetPath };
  }

  // Uploaded gif deleted from the library: drop its cached sheet too.
  function evict(filename) {
    for (const suffix of [".json", ".png"]) {
      try { unlinkSync(join(cacheDir, `${filename}${suffix}`)); } catch { /* not cached */ }
    }
  }

  return { get, evict };
}
