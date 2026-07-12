import { test, expect } from "@playwright/test";
// Task A20 — "blind" (preview) mode. Drives the render-client directly (same server/static
// bootstrap as layer-warp.spec.js): with blind ON the projector canvas must FREEZE on its
// last committed frame while compositing keeps running; with blind OFF it resumes live.
// Also serves as the required pageerror-capture drive of the compositor's blind changes
// (a stray backtick in a shader/template silently blanks the canvas — a page error or an
// all-black baseline would catch it).
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
// Ports unique to this spec (nothing else in the repo uses 8196/8197).
const WS_PORT = 8196;
const RENDER_PORT = 8197;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-master-blind-${process.pid}`);
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

test("blind freezes the projector on its last frame while compositing keeps running", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  // A full-cover, opaque RED color layer on top of everything (order 100), the same pattern
  // layer-warp.spec.js uses. Its solid color is what the center pixel reads.
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      id: "layer-blind", name: "blind test", order: 100,
      source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 },
      fx: null,
      warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(600);
  const canvas = page.locator("canvas");

  const readCenter = () =>
    canvas.evaluate((el) => {
      const gl = el.getContext("webgl2");
      const px = new Uint8Array(4);
      gl.readPixels(Math.round(el.width * 0.5), Math.round(el.height * 0.5), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return Array.from(px);
    });

  // Baseline (blind OFF): the wall shows the live red layer. Also proves the canvas renders
  // at all — a blank/black canvas here would signal a shader/compositor regression.
  const baseline = await readCenter();
  expect(baseline[0], "baseline should be live RED (canvas renders, blind off)").toBeGreaterThan(180);
  expect(baseline[1]).toBeLessThan(60);

  // Turn blind ON, then (after the freeze snapshot) change the layer to GREEN. The projector
  // must stay frozen on RED while compositing continues underneath.
  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "blind", value: true });
  await page.waitForTimeout(300); // let the freeze snapshot capture the RED frame
  await wsSend(socket2, { type: "update", path: "layers.layer-blind.source.color", value: [0, 1, 0] });
  await page.waitForTimeout(500);

  const frozen = await readCenter();
  expect(frozen[0], "projector must stay FROZEN on red while blind").toBeGreaterThan(180);
  expect(frozen[1], "green must NOT reach the frozen wall").toBeLessThan(60);

  // Turn blind OFF: live drawing resumes and the wall now shows the current (GREEN) look.
  await wsSend(socket2, { type: "update", path: "blind", value: false });
  socket2.close();
  await page.waitForTimeout(500);

  const resumed = await readCenter();
  expect(resumed[1], "unfreezing must resume live output (now green)").toBeGreaterThan(180);
  expect(resumed[0], "red should be gone once live output resumes").toBeLessThan(60);

  expect(pageErrors, `render client threw: ${pageErrors.join("; ")}`).toEqual([]);
});
