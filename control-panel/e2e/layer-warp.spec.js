import { test, expect } from "@playwright/test";
// Reuse the exact server/static-serve bootstrap from media-compositing.spec.js —
// extracted here inline for test independence (Playwright test files don't share
// module-level state across files by default); see that file for the fuller comments.
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
const WS_PORT = 8182;
const RENDER_PORT = 8183;
let serverProc, staticServer;

// Unique per spec + per process so parallel/repeated runs never share (and pollute)
// the real control-panel/server/state.json or server/media used by dev/other specs.
const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-layer-warp-${process.pid}`);
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
      // Covers content-UV x in [0.5, 1] only (the layer's own RIGHT half) — deliberately
      // NOT a full-cover mask. fx.js's MASK_FRAG samples v_uv (content space) BEFORE the
      // per-layer warp stage runs, so a correct implementation bakes this cut into the
      // content prior to warping: the visible strip must track wherever the warp sends
      // content-uv x in [0.5,1], not stay pinned to raw screen-space x in [0.5,1]. A
      // full-cover mask (the previous version of this test) can't distinguish "mask
      // deforms with warp" from "mask ignored" or "mask applied in the wrong space" —
      // this half-cover mask can.
      mask: { enabled: true, shape: "rect", cx: 0.75, cy: 0.5, rx: 0.25, ry: 0.5, feather: 0 },
      fx: null,
      warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
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

  // Baseline, identity warp: screen space == content space, so the mask's visible half
  // (content x in [0.5,1]) sits at screen x in [0.5,1] too. x=0.75 is comfortably inside it.
  const baseline = await readPixel(0.75, 0.5);
  expect(baseline[0]).toBeGreaterThan(180);

  // Corner-pin the layer's own content entirely into the LEFT half of the screen: only
  // corners 1 (TR) and 2 (BR) move, from x=1 to x=0.5 (TL/BL are already x=0, unchanged).
  // With this warp, content-uv x maps linearly to screen x via screen_x = uv_x * 0.5, so:
  //   - content x in [0.5,1] (the unmasked strip)  -> screen x in [0.25, 0.5]
  //   - content x in [0,0.5] (the masked-out strip) -> screen x in [0,    0.25]
  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.layer-w.warp.corners.1", value: { x: 0.5, y: 0 } });
  await wsSend(socket2, { type: "update", path: "layers.layer-w.warp.corners.2", value: { x: 0.5, y: 1 } });
  socket2.close();
  await page.waitForTimeout(500);

  // x=0.35 sits inside the warped-and-still-visible strip [0.25, 0.5]. This only reads red
  // if the mask was baked into content BEFORE the warp (correct, matching VPT8's vlayer
  // order); if the mask were instead applied in raw post-warp screen space using the same
  // numeric params (cx=0.75 etc. as a screen-space rect), nothing warped content lives in
  // screen x in [0.5,1] at all (all content is squeezed into [0,0.5]), so this point would
  // wrongly read background.
  const visibleAfterWarp = await readPixel(0.35, 0.5);
  expect(visibleAfterWarp[0]).toBeGreaterThan(180);

  // x=0.10 sits inside the warped-but-masked-out strip [0, 0.25]. This must read background,
  // not red — ruling out the mask being ignored/disabled outright (which would make the
  // entire warped quad, including this point, solid red).
  const maskedAfterWarp = await readPixel(0.1, 0.5);
  expect(maskedAfterWarp[0]).toBeLessThan(60);

  // x=0.75 was red at baseline (identity warp); after squeezing all content into screen
  // x in [0,0.5], nothing the layer draws reaches x=0.75 any more. Confirms the layer's
  // own warp actually moved its content, independently of screen-level warp/mask position.
  const movedAway = await readPixel(0.75, 0.5);
  expect(movedAway[0]).toBeLessThan(60);
});
