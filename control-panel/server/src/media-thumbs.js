import { existsSync, mkdirSync, renameSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { extOf } from "./media.js";

// Small poster thumbnails for the media bin (perf fix 2026-07-16). The bin used to point
// every cell at the FULL-resolution source file (a multi-MB gif/mp4 downloaded + decoded
// per cell) — the reason "gifs take forever to load". Instead the server extracts a tiny
// JPEG poster ONCE per file with its bundled ffmpeg and the bin loads that.
//
//   GET /media/<file>/thumb  ->  a <=THUMB_MAX-px-long-side JPEG (first frame for
//   video/gif, downscaled for jpg).
//
// Cached on disk next to the media dir (mirrors media-frames.js): first request (or the
// proactive call at upload/import finish) generates; later requests stream the cache;
// concurrent requests share one in-flight job; deleting the media evicts the thumb.
// Degrades gracefully when ffmpeg is missing (the caller then falls back to the source).

const THUMB_MAX = 320; // longest side, px — plenty for a rail cell, ~10-40 KB per thumb

function run(bin, args) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { timeout: 20_000, maxBuffer: 8 * 1024 * 1024 }, (err) => {
      if (err) reject(new Error(`${bin} failed: ${err.message}`));
      else resolve();
    });
  });
}

export function createThumbProvider({ mediaDir }) {
  const cacheDir = join(mediaDir, ".thumbs");
  const inflight = new Map(); // filename -> Promise<thumbPath>

  async function generate(filename) {
    const src = join(mediaDir, filename);
    mkdirSync(cacheDir, { recursive: true });
    const out = join(cacheDir, `${filename}.jpg`);
    const tmp = join(cacheDir, `${filename}.tmp.jpg`);
    // First frame (`-frames:v 1`) scaled so the LONGEST side is THUMB_MAX, never upscaled
    // (the min() guard), preserving aspect. `force_original_aspect_ratio=decrease` +
    // the min() keep small sources untouched. Works for mp4/webm/gif/jpg alike.
    const vf = `scale='min(${THUMB_MAX},iw)':'min(${THUMB_MAX},ih)':force_original_aspect_ratio=decrease`;
    await run("ffmpeg", ["-y", "-v", "error", "-i", src, "-frames:v", "1", "-vf", vf, "-q:v", "4", tmp]);
    renameSync(tmp, out);
    return out;
  }

  // Resolves the cached thumb path, generating it if absent. Throws (mapped to a 500 /
  // source fallback by the route) if ffmpeg is unavailable or the file is unreadable —
  // never caches a failure, so a transient error retries.
  async function get(filename) {
    const out = join(cacheDir, `${filename}.jpg`);
    if (existsSync(out)) return out;
    if (!inflight.has(filename)) {
      inflight.set(filename, generate(filename).finally(() => inflight.delete(filename)));
    }
    return inflight.get(filename);
  }

  // Fire-and-forget warm-up at upload/import finish so the first bin view isn't blocked on
  // extraction. Swallows errors (missing ffmpeg / odd file) — the route regenerates lazily.
  function warm(filename) {
    if (![".mp4", "mp4", "webm", "gif", "jpg", "jpeg"].includes(extOf(filename))) return;
    get(filename).catch(() => {});
  }

  function evict(filename) {
    try { unlinkSync(join(cacheDir, `${filename}.jpg`)); } catch { /* not cached */ }
  }

  return { get, warm, evict, cacheDir, statSync };
}
