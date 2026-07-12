import { test, expect } from "@playwright/test";
// Reuse the exact server/static-serve bootstrap from media-compositing.spec.js —
// extracted here inline for test independence (Playwright test files don't share
// module-level state across files by default); see that file for the fuller comments.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import os from "node:os";
import { mkdirSync, copyFileSync, rmSync } from "node:fs";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8188;
const RENDER_PORT = 8189;
let serverProc, staticServer;

// Unique per spec + per process so parallel/repeated runs never share (and pollute)
// the real control-panel/server/state.json or server/media used by dev/other specs.
const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-source-bank-media-kind-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;
const FIXTURES_DIR = path.join(__dirname, "fixtures");
const FIXTURE_FILE = "media-fixture-red.jpg";

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

// Regression test for the parity-audit bug (docs/VPT8-PARITY-GAPS.md §4):
// SourceBank._decodeMediaInto() always built an HTML <video> for any media reference,
// regardless of the media's `kind`. A jpg/gif put into a source-bank slot got a
// <video> pointed at an image src, whose readyState never reaches 2 — so the slot's
// texture is never uploaded and renders black forever. Reproduces via a real
// source-bank slot (not a layer's direct `source`, which already worked): a jpg
// media item -> sourceBank slot-1's content -> a layer pointed at { type: "slot" }.
test("a jpg placed in a source-bank slot composites correctly through a layer pointed at that slot", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  // Seed the media library entry directly (mirrors what server/src/media.js's upload
  // handler broadcasts on a real upload), pointing at the fixture file copied into
  // MEDIA_DIR above.
  await wsSend(socket, {
    type: "create",
    path: "media",
    value: {
      id: "media-fixture-red-jpg",
      name: FIXTURE_FILE,
      filename: FIXTURE_FILE,
      kind: "image",
      size: 1,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Put that media item into source-bank slot-1.
  await wsSend(socket, {
    type: "update",
    path: "sourceBank.0.content",
    value: { type: "media", mediaId: "media-fixture-red-jpg" },
  });

  // Point a layer's source at the slot rather than at the media directly — this is
  // the path SourceBank._decodeMediaInto covers (a layer's own direct `source` of
  // type "video" already went through layers.js's correctly-branching setLayerSource).
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      // order: 100 — server/src/state.js seeds two demo layers at startup (layer-1
      // order 1, layer-2 order 2); order this above both, same pattern as
      // media-compositing.spec.js/layer-warp.spec.js.
      id: "layer-slot", name: "slot test", order: 100,
      source: { type: "slot", slotId: "slot-1" }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 },
      fx: null,
      warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(1500); // let the jpg decode + first composite land

  const canvas = page.locator("canvas");
  const px = await canvas.evaluate((el) => {
    const gl = el.getContext("webgl2");
    const data = new Uint8Array(4);
    gl.readPixels(el.width >> 1, el.height >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return Array.from(data);
  });

  // fixture-red.jpg center should read back strongly red, definitively NOT the black
  // that an unuploaded/incomplete texture (the bug) would produce.
  expect(px[0]).toBeGreaterThan(180);
  expect(px[1]).toBeLessThan(80);
});
