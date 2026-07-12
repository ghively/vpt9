import { test, expect } from "@playwright/test";
// Task A10 (loop mode "once" + the always-loop fix) and A11 (scrub seek).
//
// A10: render-client/src/layers.js's shouldLoop() used to return `true` for EVERY
// single-source layer regardless of loopMode (the always-loop bug), so a clip could never
// stop. This spec plays a finite clip with loopMode "once" and, after it has run past its
// end, asserts the canvas is FROZEN — i.e. the clip played through once and stopped rather
// than looping. That exercises both halves of A10: shouldLoop() honoring loopMode, and the
// "don't re-play an ended clip" guard in transport.js.
//
// A11: `transport.seek` is a 0..1 scrub request. Duration isn't in shared state, so the
// bar (per the brief) is a state round-trip plus confirming the render-client processes the
// seek without throwing (a template-literal break silently blanks the canvas).
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
const WS_PORT = 8200;
const RENDER_PORT = 8201;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-clip-transport-loop-seek-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;
const FIXTURES_DIR = path.join(__dirname, "fixtures");
const FIXTURE_FILE = "media-fixture-clip.mp4"; // ~3s testsrc clip

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
function fetchState() {
  return new Promise((resolve) => {
    const s = new WebSocket(`ws://localhost:${WS_PORT}`);
    s.once("message", (raw) => { const msg = JSON.parse(raw.toString()); if (msg.type === "state") { s.close(); resolve(msg.state); } });
  });
}

test.beforeAll(async () => { await startServer(); await startStatic(); });
test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(STATE_FILE, { force: true });
  rmSync(MEDIA_DIR, { recursive: true, force: true });
});

test("a loopMode 'once' clip plays through once and stops rather than looping (task A10 always-loop fix)", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, {
    type: "create", path: "layers",
    value: {
      id: "l-once", name: "once test", order: 100,
      source: { type: "video", url: `/media/${FIXTURE_FILE}` }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null,
      warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } },
      sourceMode: "single",
      transport: { playing: true, rate: 1, loopIn: null, loopOut: null, loopMode: "once", pan: 0, vol: 1, seek: null },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);

  const canvas = page.locator("canvas");
  const isFrozen = async () => {
    const frame1 = await canvas.screenshot();
    await page.waitForTimeout(500);
    const frame2 = await canvas.screenshot();
    return Buffer.compare(frame1, frame2) === 0;
  };

  // First: the clip must actually be PLAYING early on (its content changes every frame).
  // This also catches a dead headless GPU (MEMORY headless-webgl-flaky-gpu) — that leaves
  // the canvas static from the start, which would read as "frozen" here; re-run such a flake.
  await page.waitForTimeout(1000);
  expect(await isFrozen()).toBe(false);

  // Then: it must play through once and STOP (task A10 — not loop). Poll until the canvas
  // stays byte-identical across 3 consecutive samples (~1.5s of true stillness). A looping
  // clip (the pre-A10 always-loop bug) advances forever and never stabilizes, so it fails
  // this on the deadline. Polling (not a fixed wait) absorbs variable headless start/decode
  // timing — the clip may not finish until several seconds in.
  const deadline = Date.now() + 16000;
  let prev = await canvas.screenshot();
  let stable = 0;
  let frozen = false;
  while (Date.now() < deadline) {
    await page.waitForTimeout(500);
    const cur = await canvas.screenshot();
    if (Buffer.compare(prev, cur) === 0) {
      if (++stable >= 3) { frozen = true; break; }
    } else {
      stable = 0;
    }
    prev = cur;
  }
  expect(frozen).toBe(true);
  expect(pageErrors).toEqual([]);
});

test("transport.seek round-trips through shared state and the render-client applies it without throwing (task A11)", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, {
    type: "create", path: "layers",
    value: {
      id: "l-seek", name: "seek test", order: 101,
      source: { type: "video", url: `/media/${FIXTURE_FILE}` }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null,
      warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } },
      sourceMode: "single",
      transport: { playing: true, rate: 1, loopIn: null, loopOut: null, loopMode: "loop", pan: 0, vol: 1, seek: null },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(800); // let the clip load + start

  // Write a scrub fraction and let the render-client act on it.
  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.l-seek.transport.seek", value: 0.6 });
  socket2.close();
  await page.waitForTimeout(600);

  // State round-trips (the scrub value persists, not cleared back to null by the client).
  const state = await fetchState();
  expect(state.layers["l-seek"].transport.seek).toBe(0.6);
  // And the render-client processed it without a template-literal/syntax break.
  expect(pageErrors).toEqual([]);
});
