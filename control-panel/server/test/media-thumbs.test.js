import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createMediaRouter } from "../src/media.js";

// Poster-thumbnail endpoint (media-thumbs.js) + immutable cache headers (perf 2026-07-16).
// Uses the real e2e fixtures so ffmpeg actually runs; skips if ffmpeg is absent.

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "..", "e2e", "fixtures");

function ffmpegAvailable() {
  try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); return true; } catch { return false; }
}
const HAVE_FFMPEG = ffmpegAvailable();

function withServer(run) {
  return async () => {
    const dir = mkdtempSync(join(tmpdir(), "vpt-thumb-test-"));
    copyFileSync(join(FIXTURES, "media-fixture-blink.gif"), join(dir, "media-poster.gif"));
    copyFileSync(join(FIXTURES, "media-fixture-clip.mp4"), join(dir, "media-clip.mp4"));
    const state = { media: { "media-poster": { id: "media-poster", filename: "media-poster.gif", kind: "gif", tags: [] } } };
    const router = createMediaRouter({ mediaDir: dir, state, broadcast: () => {}, scheduleSave: () => {} });
    const server = createServer(async (req, res) => { if (await router.handle(req, res)) return; res.writeHead(404); res.end(); });
    await new Promise((r) => server.listen(0, r));
    const base = `http://127.0.0.1:${server.address().port}`;
    try { await run({ base, dir }); } finally { server.close(); rmSync(dir, { recursive: true, force: true }); }
  };
}

test("GET /media/<file>/thumb returns a small JPEG poster with immutable cache", { skip: !HAVE_FFMPEG }, withServer(async ({ base, dir }) => {
  for (const file of ["media-poster.gif", "media-clip.mp4"]) {
    const res = await fetch(`${base}/media/${file}/thumb`);
    assert.equal(res.status, 200, `${file} thumb`);
    assert.equal(res.headers.get("content-type"), "image/jpeg");
    assert.match(res.headers.get("cache-control") ?? "", /immutable/);
    const bytes = new Uint8Array(await res.arrayBuffer());
    assert.deepEqual([...bytes.slice(0, 2)], [0xff, 0xd8], "JPEG SOI marker");
    assert.ok(bytes.length < 200_000, "poster is small");
  }
  assert.ok(existsSync(join(dir, ".thumbs", "media-poster.gif.jpg")), "thumb cached on disk");
}));

test("/thumb 404s for unknown/unsafe names", { skip: !HAVE_FFMPEG }, withServer(async ({ base }) => {
  for (const p of ["/media/media-nope.gif/thumb", "/media/..%2Fescape.gif/thumb"]) {
    assert.equal((await fetch(`${base}${p}`)).status, 404, p);
  }
}));

test("full media files serve with immutable cache + ETag", withServer(async ({ base }) => {
  const res = await fetch(`${base}/media/media-poster.gif`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control") ?? "", /immutable/);
  assert.equal(res.headers.get("etag"), '"media-poster.gif"');
}));

test("deleting media evicts its thumb cache", { skip: !HAVE_FFMPEG }, withServer(async ({ base, dir }) => {
  await fetch(`${base}/media/media-poster.gif/thumb`); // generate
  assert.ok(existsSync(join(dir, ".thumbs", "media-poster.gif.jpg")));
  const del = await fetch(`${base}/api/media/media-poster`, { method: "DELETE" });
  assert.equal(del.status, 200);
  assert.ok(!existsSync(join(dir, ".thumbs", "media-poster.gif.jpg")), "thumb evicted");
}));

test("Range: suffix bytes=-N returns the LAST N bytes; over-EOF end clamps to 206", { skip: !HAVE_FFMPEG }, withServer(async ({ base, dir }) => {
  const { statSync } = await import("node:fs");
  const size = statSync(join(dir, "media-clip.mp4")).size;
  // suffix range → last 10 bytes
  const suffix = await fetch(`${base}/media/media-clip.mp4`, { headers: { Range: "bytes=-10" } });
  assert.equal(suffix.status, 206);
  assert.equal(suffix.headers.get("content-range"), `bytes ${size - 10}-${size - 1}/${size}`);
  assert.equal((await suffix.arrayBuffer()).byteLength, 10);
  // explicit end beyond EOF → clamp, still 206 (not 416)
  const over = await fetch(`${base}/media/media-clip.mp4`, { headers: { Range: `bytes=0-${size + 5000}` } });
  assert.equal(over.status, 206);
  assert.equal(over.headers.get("content-range"), `bytes 0-${size - 1}/${size}`);
  // genuinely unsatisfiable (start >= size) → 416
  const bad = await fetch(`${base}/media/media-clip.mp4`, { headers: { Range: `bytes=${size + 1}-` } });
  assert.equal(bad.status, 416);
}));
