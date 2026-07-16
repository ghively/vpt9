import { test, expect } from "@playwright/test";
// Per-layer HUE (new fx.hue, 2026-07-16). Drives the REAL render-client so the inline GLSL
// actually compiles — a stray backtick / bad shader blanks the canvas with no other error
// (CLAUDE.md). Proves: (1) canvas still renders (no pageerror, non-black), (2) hue=0 leaves
// a colour unchanged, (3) a hue rotation shifts it. Same server/static bootstrap as
// gif-animation.spec.js.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { rmSync } from "node:fs";
import http from "node:http";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8286;
const RENDER_PORT = 8287;
let serverProc, staticServer;
const TMP = path.join(os.tmpdir(), `vpt-e2e-hue-${process.pid}`);

async function startServer() {
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), STATE_FILE: `${TMP}.json`, MEDIA_DIR: `${TMP}-media`, OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (b) => { if (b.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); } };
    serverProc.stdout.on("data", onData);
    serverProc.on("exit", (c) => reject(new Error(`server exited early (${c})`)));
    setTimeout(() => reject(new Error("server did not start")), 10_000);
  });
}
async function startStatic() {
  staticServer = http.createServer((req, res) => handler(req, res, { public: path.join(REPO_ROOT, "render-client"), cleanUrls: false }));
  await new Promise((r) => staticServer.listen(RENDER_PORT, r));
}
const wsSend = (s, m) => new Promise((r) => s.send(JSON.stringify(m), r));

test.beforeAll(async () => { await startServer(); await startStatic(); });
test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(`${TMP}.json`, { force: true });
  rmSync(`${TMP}-media`, { recursive: true, force: true });
});

test("fx.hue rotates a layer's colour; hue=0 is unchanged; the canvas still renders", async ({ page }) => {
  // A full-frame solid RED layer — a color source needs no media and fills the frame.
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((r) => socket.once("open", r));
  await wsSend(socket, {
    type: "create", path: "layers",
    value: {
      id: "layer-hue", name: "hue test", order: 100,
      source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 },
      fx: null, // server backfills defaultFx (incl. hue:0)
      warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
    },
  });

  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(1200);

  const center = () => page.locator("canvas").evaluate((el) => {
    const gl = el.getContext("webgl2");
    const d = new Uint8Array(4);
    gl.readPixels(el.width >> 1, el.height >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, d);
    return [d[0], d[1], d[2]];
  });

  // hue=0 (fxNeedsChain false → no fx pass): the layer is plain red.
  const base = await center();
  expect(pageErrors, "no shader/JS error blanked the canvas").toEqual([]);
  expect(base[0]).toBeGreaterThan(180); // R high
  expect(base[1]).toBeLessThan(70);     // G low
  expect(base[2]).toBeLessThan(70);     // B low

  // Rotate hue +120° about the luma axis: red → green-dominant.
  await wsSend(socket, { type: "update", path: "layers.layer-hue.fx.hue", value: 120 });
  await page.waitForTimeout(400);
  const rotated = await center();
  expect(pageErrors).toEqual([]);
  expect(rotated).not.toEqual(base);          // it actually changed
  expect(rotated[1]).toBeGreaterThan(rotated[0]); // green now exceeds red
  expect(rotated[1]).toBeGreaterThan(rotated[2]);

  socket.close();
});
