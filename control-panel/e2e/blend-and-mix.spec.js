import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import os from "node:os";
import { rmSync } from "node:fs";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8184;
const RENDER_PORT = 8185;
let serverProc, staticServer;

// Unique per spec + per process so parallel/repeated runs never share (and pollute)
// the real control-panel/server/state.json or server/media used by dev/other specs.
const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-blend-and-mix-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;

async function startServer() {
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), STATE_FILE, MEDIA_DIR, OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (buf) => { if (buf.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); } };
    serverProc.stdout.on("data", onData);
    setTimeout(() => reject(new Error("server did not start")), 10_000);
  });
}
async function startStatic() {
  staticServer = http.createServer((req, res) =>
    // cleanUrls: false — see media-compositing.spec.js: serve-handler's default
    // behavior strips the ?screen=&ws= query string off /index.html requests.
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

async function readCenterPixel(page) {
  return page.locator("canvas").evaluate((el) => {
    const gl = el.getContext("webgl2");
    const px = new Uint8Array(4);
    gl.readPixels(el.width >> 1, el.height >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return Array.from(px);
  });
}

test("darken blend mode: min(base,top) — white base + red top over black ground reads red-only", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  // order: 100/101 (not 1/2) — server/src/state.js seeds two demo layers at startup
  // (layer-1 order 1, layer-2 order 2, the latter a purple `multiply`-blend color layer
  // at opacity 0.46); see layer-warp.spec.js's identical note. Colliding with those
  // orders lets the demo purple layer composite between l-base and l-top (ties are
  // broken by insertion order, so layer-2 would land after l-base but before l-top),
  // tinting the result to ~(179,0,0) and failing the >200 assertion below even though
  // the darken formula itself is correct. Order both test layers above the demo pair.
  await wsSend(socket, { type: "create", path: "layers", value: { id: "l-base", name: "base", order: 100, source: { type: "color", color: [1, 1, 1] }, opacity: 1, blendMode: "normal", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null, warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } } } });
  await wsSend(socket, { type: "create", path: "layers", value: { id: "l-top", name: "top", order: 101, source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "darken", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null, warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } } } });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(500);
  const px = await readCenterPixel(page);
  // min(1,1)=1 (R), min(1,0)=0 (G), min(1,0)=0 (B) -> pure red.
  expect(px[0]).toBeGreaterThan(200);
  expect(px[1]).toBeLessThan(30);
  expect(px[2]).toBeLessThan(30);
});

test("a mix slot screen-blends two solid-color inputs (screen(red,green)=yellow), proving the mix blend stage ran", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  // Originally skipped: it needed a second fixture uploaded via HTTP multipart because a
  // SourceRef was media/slot only. Task A13 added `color` as a valid mix A/B input, so the
  // mix path is now exercisable with two solid-color inputs — no fixture upload needed.
  // Screen blend of pure red (1,0,0) and pure green (0,1,0) is (1,1,0) yellow — distinct
  // from BOTH inputs (and from any plain crossfade of them), unambiguously proving the mix
  // slot's blend stage actually ran. mix=1.0 takes the fully-blended result (the shader does
  // output = lerp(a, blend(a,b), mix); see MIX_FRAG), so this asserts on the blend formula
  // itself rather than the crossfade — complementing source-bank-inputs.spec.js's normal-
  // blend color-mix crossfade test.
  await wsSend(socket, {
    type: "update", path: "sourceBank.0.content",
    value: { type: "mix", a: { type: "color", color: [1, 0, 0] }, b: { type: "color", color: [0, 1, 0] }, blendMode: "screen", mix: 1.0 },
  });
  // order: 200 — above the two demo layers (see the darken test's note) so the mix slot's
  // output is what lands at the center, not the demo purple layer.
  await wsSend(socket, { type: "create", path: "layers", value: { id: "l-mix", name: "mix", order: 200, source: { type: "slot", slotId: "slot-1" }, opacity: 1, blendMode: "normal", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null, warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } } } });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(800); // let the two color inputs decode + the mix FBO composite
  const px = await readCenterPixel(page);
  // screen(red, green) = (1,1,0): R and G high, B ~0. Neither input is yellow, so this can
  // only be the screen formula having run over both decoded inputs.
  expect(px[0]).toBeGreaterThan(200);
  expect(px[1]).toBeGreaterThan(200);
  expect(px[2]).toBeLessThan(40);
});
