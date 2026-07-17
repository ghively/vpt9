import { test, expect } from "@playwright/test";
// Task A9 — per-slot clip transport. Because many layers can share one source-bank slot,
// the slot owns its transport (play/rate/loop/scrub), not the consuming layer. This spec
// puts a moving video clip into slot-1, points a layer at that slot, and verifies the
// slot's OWN transport.playing drives whether the slot's texture advances: playing ->
// pixels change frame to frame; paused -> the texture stops advancing (the exact claim
// the brief calls out). Modeled on transport-and-playlist.spec.js (same play/pause
// pixel-motion detection) + source-bank-media-kind.spec.js (layer -> slot wiring).
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import os from "node:os";
import { mkdirSync, copyFileSync, rmSync } from "node:fs";
import handler from "serve-handler";
import WebSocket from "ws";
import { videoCanAdvance } from "./video-capability.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
// Isolated ports, distinct from every other spec (which span 8180–8197).
const WS_PORT = 8198;
const RENDER_PORT = 8199;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-source-bank-transport-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;
const FIXTURES_DIR = path.join(__dirname, "fixtures");
// A ~3s ffmpeg `testsrc` clip whose visible content changes every frame — so "advancing"
// vs. "frozen" is unambiguous from pixels alone (same fixture transport-and-playlist uses).
const FIXTURE_FILE = "media-fixture-clip.mp4";

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

test("a source-bank slot's own transport.playing drives whether the slot texture advances (task A9)", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  // Seed the media-library entry for the clip copied into MEDIA_DIR (mirrors media.js's
  // upload broadcast).
  await wsSend(socket, {
    type: "create", path: "media",
    value: { id: "clip", name: FIXTURE_FILE, filename: FIXTURE_FILE, kind: "video", size: 1, uploadedAt: new Date().toISOString() },
  });
  // Put the clip in slot-1 and START its transport (the slot owns play state now — the
  // hardcoded auto-play/loop was removed in task A9, so without this the slot stays paused).
  await wsSend(socket, { type: "update", path: "sourceBank.0.content", value: { type: "media", mediaId: "clip" } });
  await wsSend(socket, { type: "update", path: "sourceBank.0.transport.playing", value: true });
  await wsSend(socket, { type: "update", path: "sourceBank.0.transport.loopMode", value: "loop" });
  // A full-frame layer, topmost (order 100), pointed at the slot — it shows the slot's
  // transported texture (a layer never drives a slot's video; the slot owns it).
  await wsSend(socket, {
    type: "create", path: "layers",
    value: {
      id: "layer-slot", name: "slot transport test", order: 100,
      source: { type: "slot", slotId: "slot-1" }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null,
      warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(800); // let the slot video decode + start advancing

  // Skip cleanly where headless Chromium can't decode/advance mp4 <video> (readyState stays
  // 0) — the slot-texture-advance/pause checks below are then unobservable, not failing. A
  // documented environment limit, not an app bug; on a real GPU the probe passes and it runs.
  test.skip(
    !(await videoCanAdvance(page, `http://localhost:${WS_PORT}/media/${FIXTURE_FILE}`)),
    "headless Chromium can't decode/advance mp4 <video> here — documented environment limit, not an app bug",
  );

  const canvas = page.locator("canvas");
  const isFrozen = async () => {
    const frame1 = await canvas.screenshot();
    await page.waitForTimeout(500);
    const frame2 = await canvas.screenshot();
    return Buffer.compare(frame1, frame2) === 0;
  };

  // Slot transport.playing = true -> the slot texture is advancing, so consecutive
  // screenshots must differ.
  expect(await isFrozen()).toBe(false);

  // Pause the SLOT's transport -> the slot's texture must STOP advancing.
  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "sourceBank.0.transport.playing", value: false });
  socket2.close();
  await page.waitForTimeout(600); // let the pause take effect before sampling

  expect(await isFrozen()).toBe(true);

  // The render-client must not have thrown (a stray template-literal break silently blanks
  // the canvas — this guards the render-client edits for this cluster).
  expect(pageErrors).toEqual([]);
});
