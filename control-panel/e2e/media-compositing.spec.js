import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import os from "node:os";
import { mkdirSync, copyFileSync, rmSync } from "node:fs";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8180;
const RENDER_PORT = 8181;

// Unique per spec + per process so parallel/repeated runs never share (and pollute)
// the real control-panel/server/state.json or server/media used by dev/other specs.
const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-media-compositing-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;
const FIXTURES_DIR = path.join(__dirname, "fixtures");
// The server only serves filenames matching its server-generated `media-<token>.<ext>`
// pattern (server/src/media.js's SAFE_FILENAME allowlist) — see media-helpers.test.js's
// "sample.mp4" rejection case. Fixtures are named to satisfy that allowlist and are
// copied into MEDIA_DIR before the server starts, rather than hand-editing the allowlist.
const FIXTURE_FILES = ["media-fixture-red.jpg", "media-fixture-blink.gif"];

let serverProc;
let staticServer;

async function startServer() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  for (const name of FIXTURE_FILES) {
    copyFileSync(path.join(FIXTURES_DIR, name), path.join(MEDIA_DIR, name));
  }
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), STATE_FILE, MEDIA_DIR, OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (buf) => {
      if (buf.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); }
    };
    serverProc.stdout.on("data", onData);
    serverProc.on("exit", (code) => reject(new Error(`server exited early (${code})`)));
    setTimeout(() => reject(new Error("server did not start within 10s")), 10_000);
  });
}

async function startStatic() {
  staticServer = http.createServer((req, res) =>
    // cleanUrls: false — serve-handler's default "cleanUrls" behavior 301-redirects
    // /index.html to / and drops the query string in the process, which silently
    // strips the ?screen=&ws= params the render client depends on to find its
    // control-plane. Discovered while debugging this test: the page would load with
    // location.search === "" and silently fall back to the default ws://host:8080,
    // never receiving the test's layer state.
    handler(req, res, { public: path.join(REPO_ROOT, "render-client"), cleanUrls: false }),
  );
  await new Promise((resolve) => staticServer.listen(RENDER_PORT, resolve));
}

function wsSend(socket, message) {
  return new Promise((resolve) => socket.send(JSON.stringify(message), resolve));
}

test.beforeAll(async () => {
  await startServer();
  await startStatic();
});

test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(STATE_FILE, { force: true });
  rmSync(MEDIA_DIR, { recursive: true, force: true });
});

// Creates the two fixture layers (jpg at full opacity, gif hidden) used by both tests
// below. Each test gets its own socket/page, but `applyCreate` in server/src/state.js
// upserts by `value.id`, so re-running this against the shared beforeAll server between
// tests is safe (no "already exists" conflict).
async function createFixtureLayers() {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  // Two solid-color-distinguishable fixture files already exist for this purpose;
  // see Step 3 for how they're generated if missing.
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: { id: "layer-jpg", name: "jpg test", order: 10, source: { type: "video", url: "/media/media-fixture-red.jpg" }, opacity: 1, blendMode: "normal", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null },
  });
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: { id: "layer-gif", name: "gif test", order: 20, source: { type: "video", url: "/media/media-fixture-blink.gif" }, opacity: 0, blendMode: "normal", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null },
  });
  socket.close();
}

test("a jpg source composites correctly", async ({ page }) => {
  await createFixtureLayers();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(1500); // let the jpg decode + first composite land

  const canvas = page.locator("canvas");
  const redPixel = await canvas.evaluate((el) => {
    const gl = el.getContext("webgl2");
    const px = new Uint8Array(4);
    gl.readPixels(el.width >> 1, el.height >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return Array.from(px);
  });
  expect(redPixel[0]).toBeGreaterThan(180); // fixture-red.jpg center should read back strongly red
  expect(redPixel[1]).toBeLessThan(80);
});

// Re-enabled: this was test.fixme() while gif playback relied on the browser's native
// <img> animation timer, which (a) never advances a JS-created, DOM-appended <img> in
// this sandbox's headless Chromium (see project memory `headless-webgl-flaky-gpu.md`)
// and (b) doesn't feed GL uploads anyway — texImage2D of an animated image always
// takes the FIRST frame per spec, which is why the projector showed frozen gifs even
// in real desktop browsers. The render client now decodes gif frames itself
// (render-client/src/gif.js, WebCodecs ImageDecoder on an explicit setTimeout clock),
// which both fixes the frozen wall and makes the animation testable headless — the
// exact re-enable condition the old fixme note called out. See also
// gif-animation.spec.js for the pixel-level regression test.
test("a gif source animates over time", async ({ page }) => {
  await createFixtureLayers();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(1500); // let sources decode + first composite land

  const canvas = page.locator("canvas");

  // Bring the gif layer forward, jpg out of the way.
  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.layer-jpg.opacity", value: 0 });
  await wsSend(socket2, { type: "update", path: "layers.layer-gif.opacity", value: 1 });
  socket2.close();
  await page.waitForTimeout(300);

  // Confirm the gif is animating. Not a single before/after screenshot pair: the
  // fixture cycles every ~400ms, so two captures a fixed beat apart can land on the
  // same blink phase and compare equal (observed flake). Sample repeatedly across
  // several cycles and require at least two distinct frames.
  const seen = new Set();
  for (let i = 0; i < 8 && seen.size < 2; i++) {
    seen.add((await canvas.screenshot()).toString("base64"));
    await page.waitForTimeout(150);
  }
  expect(seen.size).toBeGreaterThan(1);
});
