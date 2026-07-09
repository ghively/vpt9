import { test, expect } from "@playwright/test";
// Reuse the exact server/static-serve bootstrap from media-compositing.spec.js —
// extracted here inline for test independence (Playwright test files don't share
// module-level state across files by default); see that file for the fuller comments.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8182;
const RENDER_PORT = 8183;
let serverProc, staticServer;

async function startServer() {
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), MEDIA_DIR: path.join(REPO_ROOT, "server", "media"), OSC_PORT: "0" },
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
test.afterAll(async () => { staticServer?.close(); serverProc?.kill(); });

test("a layer's own warp moves it independently of screen warp, mask follows the deformation", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      // order: 100 — server/src/state.js seeds two demo layers at startup (layer-1
      // order 1, layer-2 order 2, the latter a purple `multiply`-blend color layer);
      // a low order here would let that demo layer composite on top and tint the
      // red we're testing for. Order it above both so it's the topmost layer, same
      // pattern media-compositing.spec.js uses (orders 10/20).
      id: "layer-w", name: "warp test", order: 100,
      source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "normal",
      mask: { enabled: true, shape: "rect", cx: 0.5, cy: 0.5, rx: 0.5, ry: 0.5, feather: 0 },
      fx: null,
      warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(500);
  const canvas = page.locator("canvas");

  const readCorner = () => canvas.evaluate((el) => {
    const gl = el.getContext("webgl2");
    const px = new Uint8Array(4);
    // Top-left 10% x 10% region: identity-warped full-frame red should be red here.
    gl.readPixels(Math.round(el.width * 0.05), Math.round(el.height * 0.95), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return Array.from(px);
  });
  const before = await readCorner();
  expect(before[0]).toBeGreaterThan(180); // identity warp: red fills the whole frame, corner included

  // Shrink the layer's own warp to the right half only (top-left corner moves to x=0.5).
  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.layer-w.warp.corners.0", value: { x: 0.5, y: 0 } });
  await wsSend(socket2, { type: "update", path: "layers.layer-w.warp.corners.3", value: { x: 0.5, y: 1 } });
  socket2.close();
  await page.waitForTimeout(500);

  const after = await readCorner();
  // The top-left corner should now be background (ground color), not red — both because
  // the layer's own warp moved its content away from that corner, AND because the mask
  // (rect, full-cover) must still be tracking the layer post-warp, not staying pinned to
  // pre-warp screen space (which would still show red there).
  expect(after[0]).toBeLessThan(60);
});
