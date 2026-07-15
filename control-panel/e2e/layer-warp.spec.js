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

test("warp vertical orientation matches the panel: corner y=0 lands at the DISPLAYED top (layer AND screen warp)", async ({ page }) => {
  // Regression test for the "warping felt upside down / mirrored" bug: the per-layer
  // warp pass rendered into its FBO without the dest/uv Y-flip the on-screen pass uses,
  // so a corner dragged at the TOP of the panel stage moved content at the BOTTOM of the
  // display. The older test above only asserts horizontal direction (x), which the bug
  // didn't touch — this one pins the vertical axis for both warp levels.
  //
  // readPixels' origin is BOTTOM-left, so "displayed top half" = window yFrac near 1.
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  // This spec file shares one server across tests — remember what we mutate (seeded
  // demo-layer opacities) so the cleanup below can restore it for the tests after us.
  const stateBefore = await (await fetch(`http://localhost:${WS_PORT}/state`)).json();
  const demoOpacities = [stateBefore.layers["layer-1"]?.opacity, stateBefore.layers["layer-2"]?.opacity];

  // Silence the two seeded demo layers so the background is the flat dark ground color.
  await wsSend(socket, { type: "update", path: "layers.layer-1.opacity", value: 0 });
  await wsSend(socket, { type: "update", path: "layers.layer-2.opacity", value: 0 });
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      id: "layer-vert", name: "vertical orientation", order: 200,
      source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 },
      fx: null,
      // Squeeze the layer's content into the TOP half of panel space: TL/TR stay at
      // y=0, BR/BL move up to y=0.5. Panel y=0 is the top of the stage, so a correct
      // pipeline shows red in the displayed TOP half and background below it.
      warp: {
        mode: "corner",
        corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.5 }, { x: 0, y: 0.5 }],
        mesh: { size: 4, points: [] },
      },
    },
  });

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(700);
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

  // LAYER warp: displayed top half (window yFrac 0.75) red, bottom half background.
  const layerTop = await readPixel(0.5, 0.75);
  const layerBottom = await readPixel(0.5, 0.25);
  expect(layerTop[0]).toBeGreaterThan(180);
  expect(layerBottom[0]).toBeLessThan(60);

  // SCREEN warp, same squeeze: reset the layer to identity, then warp the projector's
  // own corners into the top half — the whole (red-filled) scene must land up top.
  await wsSend(socket, {
    type: "update",
    path: "layers.layer-vert.warp.corners",
    value: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
  });
  await wsSend(socket, {
    type: "update",
    path: "screens.screen-1.warp.corners",
    value: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.5 }, { x: 0, y: 0.5 }],
  });
  await page.waitForTimeout(700);

  const screenTop = await readPixel(0.5, 0.75);
  const screenBottom = await readPixel(0.5, 0.25);
  expect(screenTop[0]).toBeGreaterThan(180);
  expect(screenBottom[0]).toBeLessThan(60);

  // Cleanup: this server is shared with the tests that run after this one — put back
  // the screen warp, remove our layer, and restore the demo layers' opacities.
  await wsSend(socket, {
    type: "update",
    path: "screens.screen-1.warp.corners",
    value: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
  });
  await wsSend(socket, { type: "delete", path: "layers.layer-vert" });
  if (demoOpacities[0] != null) await wsSend(socket, { type: "update", path: "layers.layer-1.opacity", value: demoOpacities[0] });
  if (demoOpacities[1] != null) await wsSend(socket, { type: "update", path: "layers.layer-2.opacity", value: demoOpacities[1] });
  socket.close();
});

test("mask vertical orientation matches the panel: mask cy=0.25 shows content at the DISPLAYED top", async ({ page }) => {
  // Sibling of the warp orientation test above: mask.cx/cy/points arrive in the panel's
  // top-left-origin space, but the mask shader compares them against v_uv, where v=1 is
  // the displayed top (UNPACK_FLIP_Y uploads) — without a flip, a mask dragged toward
  // the panel's top gates the displayed BOTTOM. Every older mask spec used vertically
  // symmetric geometry (cy=0.5, y-centered polygons), which can't see this.
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  const stateBefore = await (await fetch(`http://localhost:${WS_PORT}/state`)).json();
  const demoOpacities = [stateBefore.layers["layer-1"]?.opacity, stateBefore.layers["layer-2"]?.opacity];
  await wsSend(socket, { type: "update", path: "layers.layer-1.opacity", value: 0 });
  await wsSend(socket, { type: "update", path: "layers.layer-2.opacity", value: 0 });
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      id: "layer-mask-vert", name: "mask vertical orientation", order: 210,
      source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "normal",
      // Ellipse centered in the TOP quarter of panel space, wide enough to be sampled
      // safely: visible red should appear near the displayed TOP, none at the bottom.
      mask: { enabled: true, shape: "ellipse", cx: 0.5, cy: 0.25, rx: 0.45, ry: 0.2, feather: 0 },
      fx: null,
      warp: {
        mode: "corner",
        corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
        mesh: { size: 4, points: [] },
      },
    },
  });

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(700);
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

  // readPixels origin is bottom-left: displayed top quarter = window yFrac 0.75.
  const displayedTop = await readPixel(0.5, 0.75);
  const displayedBottom = await readPixel(0.5, 0.25);
  expect(displayedTop[0]).toBeGreaterThan(180);
  expect(displayedBottom[0]).toBeLessThan(60);

  // Polygon leg: a triangle occupying the panel's TOP half must show at the displayed top.
  await wsSend(socket, { type: "update", path: "layers.layer-mask-vert.mask.shape", value: "polygon" });
  await wsSend(socket, {
    type: "update",
    path: "layers.layer-mask-vert.mask.points",
    value: [{ x: 0.1, y: 0.05 }, { x: 0.9, y: 0.05 }, { x: 0.5, y: 0.5 }],
  });
  await page.waitForTimeout(500);
  const polyTop = await readPixel(0.5, 0.85);
  const polyBottom = await readPixel(0.5, 0.15);
  expect(polyTop[0]).toBeGreaterThan(180);
  expect(polyBottom[0]).toBeLessThan(60);

  // Cleanup for the tests that share this server.
  await wsSend(socket, { type: "delete", path: "layers.layer-mask-vert" });
  if (demoOpacities[0] != null) await wsSend(socket, { type: "update", path: "layers.layer-1.opacity", value: demoOpacities[0] });
  if (demoOpacities[1] != null) await wsSend(socket, { type: "update", path: "layers.layer-2.opacity", value: demoOpacities[1] });
  socket.close();
});

test("fx.rotationDeg rotates a layer's content about its anchor (VPT8 parity: td.rota.jxs's rota field)", async ({ page }) => {
  // No mask/asymmetric image fixture needed: a solid-color layer's point pass treats
  // anything sampled outside content uv [0,1] as transparent ("border" in fx.js's
  // POINT_FRAG) — so rotating a full-cover color layer 45 degrees about its center
  // pushes every corner of the viewport outside that [0,1] window (each corner sits at
  // radius ~0.66 from center post-rotation, past the 0.5 half-width), turning solid
  // color into transparent-revealing-background right at the corner. That's a
  // deterministic, purely numeric way to prove rotation is wired end-to-end (state ->
  // WS -> render-client -> shader uniform -> pixels).
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      // order: 300 — above layer-w (order 100, left over from the previous test in this
      // file) as well as the two seeded demo layers, so it's unambiguously the topmost.
      id: "layer-rot", name: "rotation test", order: 300,
      source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "normal",
      // fx omitted entirely (not null) so the server's ensureLayerDefaults backfill on
      // create fills in a full defaultFx() — including the new rotationDeg/anchor/zoomXY
      // leaves — leaving "layers.layer-rot.fx.rotationDeg" a valid, existing patch path.
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

  // Baseline, rotationDeg=0 (the default): fx are all neutral, so the layer never enters
  // the fx chain at all (fxNeedsChain returns false) and renders as a flat, full-opacity
  // fill covering the entire quad — deterministically red at every corner, regardless of
  // whatever's composited beneath it.
  const baseline = await readPixel(0.05, 0.05);
  expect(baseline[0]).toBeGreaterThan(180);

  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.layer-rot.fx.rotationDeg", value: 45 });
  socket2.close();
  await page.waitForTimeout(500);

  // After a 45-degree rotation about the default center anchor (0.5, 0.5), this corner's
  // inverse-mapped sample point lands outside content uv [0,1] (radius ~0.66 > half-width
  // 0.5) — transparent, revealing whatever's beneath (near-black canvas ground) instead of
  // the layer's opaque red fill. Proves rotationDeg reached the shader and actually moved
  // the content, not just a state/type plumbing no-op.
  const rotated = await readPixel(0.05, 0.05);
  expect(rotated[0]).toBeLessThan(60);
});
