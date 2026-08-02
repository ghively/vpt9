import { test, expect } from "@playwright/test";
// Reuse the exact server/static-serve bootstrap from media-compositing.spec.js /
// layer-mask-polygon.spec.js — extracted here inline for test independence (Playwright
// test files don't share module-level state across files by default). A dedicated spec
// file (not appended to layer-mask-polygon.spec.js) so this test's own server/state
// starts from a clean two-demo-layer baseline and its before/after-invert readback
// samples the SAME two content-uv points across a single "invert" flip — the same
// isolation rationale layer-mask-polygon.spec.js documents for headless-GL determinism.
// Isolated ports (8196/8197): none of 8080/8081/8082, and distinct from every other e2e
// spec's ports (which currently span 8180–8195).
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import os from "node:os";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8196;
const RENDER_PORT = 8197;
let serverProc, staticServer;

// Unique per spec + per process so parallel/repeated runs never share (and pollute)
// the real control-panel/server/state.json or server/media used by dev/other specs.
const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-layer-mask-matte-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;
// Must match the server's SAFE_FILENAME (media-<token>.<mp4|gif|jpg|jpeg>) — the media
// GET route 404s anything else, so a `.png` won't serve. A single-frame GIF is the
// simplest format hand-encodable from Node with no image libs on the test path.
const MATTE_FILE = "media-matte.gif";

// --- Minimal single-frame GIF encoder (no image libs on the test path) ----------------
// Builds an 8x8 GIF that is white on the LEFT half and black on the RIGHT half — a
// bright/dark luminance matte. A horizontal split is deliberately used (not vertical) so
// the assertions never have to reason about the render pipeline's Y-flip (UNPACK_FLIP_Y
// on upload): only the X axis carries signal, and X is preserved end-to-end. It's a
// STATIC (single-frame) GIF, so the headless "gifs never animate" quirk is irrelevant —
// the render-client just re-uploads the one frame.
//
// LZW uses the trivially-correct "Clear before every pixel" scheme: a Clear code resets
// the decoder's dictionary before each literal, so the dictionary never grows and the
// code size stays fixed at minCodeSize+1. Wasteful (2 codes/pixel) but tiny and immune to
// the classic dictionary-growth / code-width-bump off-by-ones.
function gifLzw(indices, minCodeSize) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  const codeSize = minCodeSize + 1; // constant, since the dictionary never grows
  const out = [];
  let bitBuffer = 0;
  let bitCount = 0;
  const emit = (code) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) { out.push(bitBuffer & 0xff); bitBuffer >>= 8; bitCount -= 8; }
  };
  for (const idx of indices) { emit(clearCode); emit(idx); }
  emit(eoiCode);
  if (bitCount > 0) out.push(bitBuffer & 0xff);
  // Pack the code stream into GIF sub-blocks (max 255 bytes each), then a 0 terminator.
  const blocks = [];
  for (let i = 0; i < out.length; i += 255) {
    const chunk = out.slice(i, i + 255);
    blocks.push(chunk.length, ...chunk);
  }
  blocks.push(0);
  return Buffer.from(blocks);
}
function makeSplitGif(size = 8) {
  const indices = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) indices.push(x < size / 2 ? 1 : 0); // 1 = white, 0 = black
  }
  const header = Buffer.from("GIF89a", "ascii");
  const lsd = Buffer.alloc(7);
  lsd.writeUInt16LE(size, 0);
  lsd.writeUInt16LE(size, 2);
  lsd[4] = 0x80; // global color table present; GCT size field 0 => 2 entries
  const gct = Buffer.from([0, 0, 0, 255, 255, 255]); // index 0 = black, 1 = white
  const imgDesc = Buffer.alloc(10);
  imgDesc[0] = 0x2c; // image separator
  imgDesc.writeUInt16LE(size, 5);
  imgDesc.writeUInt16LE(size, 7);
  const minCodeSize = 2; // GIF requires >= 2
  return Buffer.concat([header, lsd, gct, imgDesc, Buffer.from([minCodeSize]), gifLzw(indices, minCodeSize), Buffer.from([0x3b])]);
}

async function startServer() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  writeFileSync(path.join(MEDIA_DIR, MATTE_FILE), makeSplitGif(8));
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
    // cleanUrls: false — see media-compositing.spec.js: serve-handler's default behavior
    // strips the ?screen=&ws= query string off /index.html requests.
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

test("mask.source drives the mask alpha from a matte's luminance (bright shows / dark gates), and mask.invert flips it (VPT8 parity: layermask.maxpat pattr source + cc.alphaglue lum2alpha)", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  // Remove the two seeded demo layers: this spec's masked-out assertions expect the
  // near-black GROUND to show through, and since 8e44ed6 (demo layer-1 became a visible
  // color placeholder instead of a broken/black video) the demo pair composites a
  // brownish wash (~84 red) exactly where "masked out" is asserted <60.
  await wsSend(socket, { type: "delete", path: "layers.layer-1" });
  await wsSend(socket, { type: "delete", path: "layers.layer-2" });

  // Seed the media-library entry for the matte GIF written into MEDIA_DIR above (mirrors
  // what server/src/media.js's upload handler broadcasts on a real upload).
  await wsSend(socket, {
    type: "create",
    path: "media",
    value: { id: "matte-split", name: MATTE_FILE, filename: MATTE_FILE, kind: "gif", size: 1, uploadedAt: new Date().toISOString() },
  });

  // A full-frame opaque RED layer, unambiguously topmost (order 500, above the two seeded
  // demo layers) so wherever it's visible it fully occludes them, and wherever it's masked
  // out the near-black ground shows through. mask/fx/warp omitted so the server's
  // ensureLayerDefaults backfills a full defaultMask() (disabled, ellipse, source:null) —
  // leaving "mask.enabled" and "mask.source" as valid, pre-existing patch paths below.
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      id: "layer-matte", name: "matte test", order: 500,
      source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "normal",
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

  // Enable the mask and point its matte at the split PNG. Both are pre-existing (backfilled)
  // leaves, exactly the paths the Inspector's matte picker + enable toggle write.
  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.layer-matte.mask.enabled", value: true });
  await wsSend(socket2, { type: "update", path: "layers.layer-matte.mask.source", value: { type: "media", mediaId: "matte-split" } });
  socket2.close();
  await page.waitForTimeout(1200); // let the PNG decode + a render frame upload the matte

  // LEFT half of the matte is white (luminance ~1) -> alpha ~1 -> the red layer shows.
  const left = await readPixel(0.2, 0.5);
  expect(left[0]).toBeGreaterThan(180);
  // RIGHT half is black (luminance ~0) -> alpha ~0 -> masked out, reads the near-black ground.
  const right = await readPixel(0.8, 0.5);
  expect(right[0]).toBeLessThan(60);

  // Invert flips which luminance shows: bright now gates, dark now passes.
  const socket3 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket3.once("open", resolve));
  await wsSend(socket3, { type: "update", path: "layers.layer-matte.mask.invert", value: true });
  socket3.close();
  await page.waitForTimeout(500);

  const leftAfterInvert = await readPixel(0.2, 0.5);
  expect(leftAfterInvert[0]).toBeLessThan(60);
  const rightAfterInvert = await readPixel(0.8, 0.5);
  expect(rightAfterInvert[0]).toBeGreaterThan(180);
});
