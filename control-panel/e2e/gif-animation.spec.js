import { test, expect } from "@playwright/test";
// Same server/static-serve bootstrap as source-bank-media-kind.spec.js (inlined per
// file for test independence — see media-compositing.spec.js for the fuller comments).
import { spawn, execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import os from "node:os";
import { mkdirSync, copyFileSync, rmSync } from "node:fs";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8288;
const RENDER_PORT = 8289;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-gif-animation-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;
const FIXTURES_DIR = path.join(__dirname, "fixtures");
const FIXTURE_FILE = "media-fixture-blink.gif"; // 10 frames, 40ms each (~400ms cycle)

// The ImageDecoder-unavailable FALLBACK path (test below) animates a gif from a server-built
// PNG spritesheet, which the server extracts with ffmpeg (see render-client/src/gif.js +
// server media routes). Where ffmpeg is absent the sheet can't be built and the fallback has
// nothing to animate — the same gate the server's media-frames/media-thumbs tests use.
function ffmpegAvailable() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const HAVE_FFMPEG = ffmpegAvailable();

async function startServer() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  copyFileSync(path.join(FIXTURES_DIR, FIXTURE_FILE), path.join(MEDIA_DIR, FIXTURE_FILE));
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), STATE_FILE, MEDIA_DIR, OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (buf) => { if (buf.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); } };
    serverProc.stdout.on("data", onData);
    serverProc.on("exit", (code) => reject(new Error(`server exited early (${code})`)));
    setTimeout(() => reject(new Error("server did not start")), 10_000);
  });
}
async function startStatic() {
  staticServer = http.createServer((req, res) =>
    handler(req, res, { public: path.join(REPO_ROOT, "render-client"), cleanUrls: false }),
  );
  await new Promise((resolve) => staticServer.listen(RENDER_PORT, resolve));
}
function wsSend(socket, message) { return new Promise((resolve) => socket.send(JSON.stringify(message), resolve)); }

test.beforeAll(async () => { await startServer(); await startStatic(); });
test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(STATE_FILE, { force: true });
  rmSync(MEDIA_DIR, { recursive: true, force: true });
});

// Regression test for the frozen-gif-on-the-projector bug: the gif upload path
// re-uploaded an off-screen <img> to the GL texture every frame, but texImage2D of an
// animated image always takes its FIRST frame — so the wall showed a static gif while
// the panel's native <img> thumbnails animated. The fix (render-client/src/gif.js)
// decodes frames with WebCodecs' ImageDecoder into a canvas the upload samples.
//
// NOTE this does NOT hit the auto-memory `headless-webgl-flaky-gpu` gif caveat: that
// note is about native <img> animation never advancing in headless Chromium. The
// GifPlayer advances frames itself via explicit ImageDecoder.decode() calls on a
// setTimeout clock, which works headless — that's what makes the animation testable
// here at all. (GPU-death flakes still apply: re-run this spec if WebGL dies.)
test("an animated gif layer actually changes pixels over time on the render output", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      // order 100: above the two seeded demo layers, same pattern as the other specs.
      id: "layer-gif-anim", name: "gif anim test", order: 100,
      source: { type: "video", url: `/media/${FIXTURE_FILE}` }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 },
      fx: null,
      warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
    },
  });
  socket.close();

  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(1500); // let the gif fetch + first decoded frame land

  // Sample the center pixel repeatedly across ~1.5 gif cycles. The 10-frame/40ms
  // fixture cycles every ~400ms, so 8 samples 150ms apart MUST see at least two
  // distinct colors if frames advance — and exactly one if the texture is frozen.
  const canvas = page.locator("canvas");
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    const px = await canvas.evaluate((el) => {
      const gl = el.getContext("webgl2");
      const data = new Uint8Array(4);
      gl.readPixels(el.width >> 1, el.height >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return Array.from(data);
    });
    seen.add(px.join(","));
    await page.waitForTimeout(150);
  }

  expect(pageErrors).toEqual([]);
  // Not the background (a never-uploaded texture composites the ground color), and
  // not a single frozen frame.
  expect(seen.has("10,12,17,255")).toBe(false);
  expect(seen.size).toBeGreaterThan(1);
});

// Same assertion, but with WebCodecs ImageDecoder REMOVED — simulating a real projector
// reached over plain http on a LAN IP, where the insecure context hides ImageDecoder in
// every browser (localhost is a "trustworthy origin", which is why only this simulation
// can catch it from an e2e run). GifPlayer must fall back to the server's ffmpeg-extracted
// spritesheet (/media/<file>/frames) and still animate. Requires ffmpeg on the machine
// running the control server (the deployment image ships it).
test("an animated gif still animates when ImageDecoder is unavailable (insecure-context fallback)", async ({ page }) => {
  // The fallback animates from a server-built ffmpeg spritesheet; with no ffmpeg the sheet
  // can't be built, so skip cleanly (documented environment gate, like the server's
  // media-frames tests) rather than red-fail. Runs for real where ffmpeg is installed.
  test.skip(!HAVE_FFMPEG, "ffmpeg not installed — the gif-fallback spritesheet can't be extracted; documented environment gate, not an app bug");
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      id: "layer-gif-fallback", name: "gif fallback test", order: 101,
      source: { type: "video", url: `/media/${FIXTURE_FILE}` }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 },
      fx: null,
      warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
    },
  });
  socket.close();

  // Hide the platform API before any module runs — the exact condition of an
  // insecure-context (http LAN IP) page.
  await page.addInitScript(() => {
    try { delete window.ImageDecoder; } catch { /* not configurable in this engine */ }
    if ("ImageDecoder" in window) Object.defineProperty(window, "ImageDecoder", { get: () => undefined });
  });

  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  const hasDecoder = await page.evaluate(() => typeof window.ImageDecoder !== "undefined" && window.ImageDecoder !== undefined);
  expect(hasDecoder).toBe(false); // the simulation must actually hold, or this test proves nothing
  await page.waitForTimeout(2500); // server-side ffmpeg extraction + sheet fetch on first request

  const canvas = page.locator("canvas");
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    const px = await canvas.evaluate((el) => {
      const gl = el.getContext("webgl2");
      const data = new Uint8Array(4);
      gl.readPixels(el.width >> 1, el.height >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return Array.from(data);
    });
    seen.add(px.join(","));
    await page.waitForTimeout(150);
  }

  expect(pageErrors).toEqual([]);
  expect(seen.has("10,12,17,255")).toBe(false);
  expect(seen.size).toBeGreaterThan(1);
});
