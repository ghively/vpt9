import { test, expect } from "@playwright/test";
// Reuse the exact server/static-serve bootstrap from media-compositing.spec.js —
// extracted here inline for test independence (Playwright test files don't share
// module-level state across files by default); see that file for the fuller comments.
//
// A dedicated spec file (rather than appending to layer-warp.spec.js's mask section, as
// task A4a's brief suggested as one option) so this test's own server/state starts from
// a clean two-demo-layer baseline — the invert assertions below sample the SAME two
// content-uv points before and after a single "invert" flip, and proved flaky-to-failing
// when run in the same file/server as layer-warp.spec.js's rotation test (its
// fx.rotationDeg=45 layer, still present in that shared server's state by the time this
// test's page loaded, left the headless GL context in a state where a later mask-only
// re-render stopped picking up new uniform values — a pre-existing render-client/GL
// interaction this task doesn't own or fix). Isolated ports (8190/8191): none of
// 8080/8081/8082, and distinct from every other e2e spec's ports.
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
const WS_PORT = 8190;
const RENDER_PORT = 8191;
let serverProc, staticServer;

// Unique per spec + per process so parallel/repeated runs never share (and pollute)
// the real control-panel/server/state.json or server/media used by dev/other specs.
const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-layer-mask-polygon-${process.pid}`);
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
    serverProc.on("exit", (code) => reject(new Error(`server exited early (${code})`)));
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

test("mask.shape=\"polygon\" gates a layer by point-in-polygon, and mask.invert flips the visible side (VPT8 parity: code/pointmask01.js's draggable mask + layermask.maxpat's pattr inv)", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  // Remove the two seeded demo layers: this spec's masked-out assertions expect the
  // near-black GROUND to show through, and since 8e44ed6 (demo layer-1 became a visible
  // color placeholder instead of a broken/black video) the demo pair composites a
  // brownish wash (~84 red) exactly where "masked out" is asserted <60.
  await wsSend(socket, { type: "delete", path: "layers.layer-1" });
  await wsSend(socket, { type: "delete", path: "layers.layer-2" });
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      // order: 500 — above the two seeded demo layers (order 1, 2), so it's
      // unambiguously the topmost and fully occludes them wherever it's visible.
      id: "layer-poly", name: "polygon mask test", order: 500,
      source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "normal",
      // mask/fx/warp all omitted so the server's ensureLayerDefaults backfill on create
      // fills in a full defaultMask() (disabled, ellipse, empty points) / defaultFx() /
      // defaultWarp() (identity corner-pin) — leaving "layers.layer-poly.mask.shape",
      // ".points", ".enabled", and ".invert" all valid, pre-existing patch paths for the
      // WS "update" messages below, exactly like an operator dragging vertices in the
      // (future, task A4b) on-canvas editor would.
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(500);
  const canvas = page.locator("canvas");

  const readPixel = (xFrac, yFrac) =>
    canvas.evaluate(
      (el, [xf, yf]) => {
        const gl = el.getContext("webgl2");
        const px = new Uint8Array(4);
        gl.readPixels(Math.round(el.width * xf), Math.round(el.height * yf), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        return Array.from(px);
      },
      [xFrac, yFrac],
    );

  // A square well inside the frame, content-uv [0.3,0.7] x [0.3,0.7] — far enough from
  // its own edges that the default 0.08 feather band never reaches either sample point
  // below (center 0.5,0.5 and corner 0.05,0.05 are both >0.2 uv units from any edge).
  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.layer-poly.mask.shape", value: "polygon" });
  await wsSend(socket2, {
    type: "update",
    path: "layers.layer-poly.mask.points",
    value: [{ x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 }, { x: 0.7, y: 0.7 }, { x: 0.3, y: 0.7 }],
  });
  await wsSend(socket2, { type: "update", path: "layers.layer-poly.mask.enabled", value: true });
  socket2.close();
  await page.waitForTimeout(500);

  // Center (0.5, 0.5) sits inside the polygon: the layer's opaque red fill shows through.
  const inside = await readPixel(0.5, 0.5);
  expect(inside[0]).toBeGreaterThan(180);
  // (0.05, 0.05) sits well outside the polygon: masked out, reads the near-black ground.
  const outside = await readPixel(0.05, 0.05);
  expect(outside[0]).toBeLessThan(60);

  // Invert: flips which side of the shape is visible, for every mask shape.
  const socket3 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket3.once("open", resolve));
  await wsSend(socket3, { type: "update", path: "layers.layer-poly.mask.invert", value: true });
  socket3.close();
  await page.waitForTimeout(500);

  const insideAfterInvert = await readPixel(0.5, 0.5);
  expect(insideAfterInvert[0]).toBeLessThan(60);
  const outsideAfterInvert = await readPixel(0.05, 0.05);
  expect(outsideAfterInvert[0]).toBeGreaterThan(180);
});
