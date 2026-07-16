import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createMediaRouter } from "../src/media.js";

// The /media/<file>.gif/frames spritesheet endpoint (media-frames.js): the render
// client's fallback for insecure (plain-http LAN) contexts where WebCodecs
// ImageDecoder doesn't exist. Uses the e2e blink-gif fixture (10 frames, 40ms each)
// as a real multi-frame input, extracted with the server's ffmpeg.

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "..", "..", "e2e", "fixtures", "media-fixture-blink.gif");

function ffmpegAvailable() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const HAVE_FFMPEG = ffmpegAvailable();
const HAVE_FIXTURE = existsSync(FIXTURE);

function withServer(run) {
  return async () => {
    const dir = mkdtempSync(join(tmpdir(), "vpt-frames-test-"));
    copyFileSync(FIXTURE, join(dir, "media-blinktest.gif"));
    const router = createMediaRouter({ mediaDir: dir, state: { media: {} }, broadcast: () => {}, scheduleSave: () => {} });
    const server = createServer(async (req, res) => {
      if (await router.handle(req, res)) return;
      res.writeHead(404);
      res.end();
    });
    await new Promise((r) => server.listen(0, r));
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
      await run({ base, dir });
    } finally {
      server.close();
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

test("frames manifest reports the gif's real frame grid and delays", { skip: !HAVE_FFMPEG || !HAVE_FIXTURE }, withServer(async ({ base }) => {
  const resp = await fetch(`${base}/media/media-blinktest.gif/frames`);
  assert.equal(resp.status, 200);
  assert.equal(resp.headers.get("access-control-allow-origin"), "*");
  const m = await resp.json();
  assert.equal(m.frameCount, 10); // the blink fixture is 10 frames
  assert.equal(m.delaysMs.length, m.frameCount);
  assert.ok(m.delaysMs.every((d) => Number.isInteger(d) && d >= 0));
  assert.ok(m.frameWidth > 0 && m.frameHeight > 0);
  assert.ok(m.cols * m.rows >= m.frameCount, "grid holds every frame");
}));

test("frames.png serves a real PNG spritesheet with CORS, and it is cached on disk", { skip: !HAVE_FFMPEG || !HAVE_FIXTURE }, withServer(async ({ base, dir }) => {
  const resp = await fetch(`${base}/media/media-blinktest.gif/frames.png`);
  assert.equal(resp.status, 200);
  assert.equal(resp.headers.get("content-type"), "image/png");
  assert.equal(resp.headers.get("access-control-allow-origin"), "*");
  const bytes = new Uint8Array(await resp.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 4)], [0x89, 0x50, 0x4e, 0x47], "PNG signature");
  assert.ok(existsSync(join(dir, ".frames", "media-blinktest.gif.png")), "sheet cached");
  assert.ok(existsSync(join(dir, ".frames", "media-blinktest.gif.json")), "manifest cached");
}));

test("frames endpoint 404s for missing files, non-gifs, and unsafe names", { skip: !HAVE_FFMPEG || !HAVE_FIXTURE }, withServer(async ({ base }) => {
  for (const path of [
    "/media/media-nonexistent.gif/frames",
    "/media/media-blinktest.mp4/frames", // wrong extension
    "/media/..%2Fescape.gif/frames", // path traversal shape fails SAFE_FILENAME
  ]) {
    const resp = await fetch(`${base}${path}`);
    assert.equal(resp.status, 404, `${path} should 404`);
  }
}));
