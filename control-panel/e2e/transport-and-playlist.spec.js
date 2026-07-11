import { test, expect } from "@playwright/test";
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
const WS_PORT = 8186;
const RENDER_PORT = 8187;
let serverProc, staticServer;

// Unique per spec + per process so parallel/repeated runs never share (and pollute)
// the real control-panel/server/state.json or server/media used by dev/other specs.
const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-transport-and-playlist-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;
const FIXTURES_DIR = path.join(__dirname, "fixtures");
// The server only serves filenames matching its server-generated `media-<token>.<ext>`
// pattern (server/src/media.js's SAFE_FILENAME allowlist) — a bare "sample.mp4" 404s.
// This fixture is a tiny (~4KB) ffmpeg `testsrc` clip whose content changes every frame,
// so it gives play/pause detection real pixel motion to compare against.
const FIXTURE_FILES = ["media-fixture-clip.mp4"];

async function startServer() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  for (const name of FIXTURE_FILES) {
    copyFileSync(path.join(FIXTURES_DIR, name), path.join(MEDIA_DIR, name));
  }
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), STATE_FILE, MEDIA_DIR, OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (buf) => { if (buf.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); } };
    serverProc.stdout.on("data", onData);
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

test("play/pause reflects in actual <video> playback state", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, {
    type: "create", path: "layers",
    value: {
      id: "l-play", name: "play test", order: 1, source: { type: "video", url: "/media/media-fixture-clip.mp4" }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null,
      warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } },
      transport: { playing: false, rate: 1, loopIn: null, loopOut: null, loopMode: "off", pan: 0, vol: 1 },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(500);

  // render-client/src/layers.js's setLayerSource() deliberately keeps a "video" source's
  // <video> element DETACHED from the DOM (GPU texture upload via gl.texImage2D doesn't
  // need DOM attachment, unlike <img> gifs) — so document.querySelector("video") can never
  // find it; that's not a bug to work around here. Instead, detect play/pause the same way
  // media-compositing.spec.js detects gif animation: compare two canvas screenshots a beat
  // apart. media-fixture-clip.mp4 is an ffmpeg `testsrc` clip whose visible content changes
  // every frame, so "frozen" vs. "advancing" is unambiguous from pixels alone.
  const canvas = page.locator("canvas");
  const isFrozen = async () => {
    const frame1 = await canvas.screenshot();
    await page.waitForTimeout(500);
    const frame2 = await canvas.screenshot();
    return Buffer.compare(frame1, frame2) === 0;
  };

  // transport.playing: false -> the video is paused, so consecutive screenshots must be
  // byte-identical.
  expect(await isFrozen()).toBe(true);

  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.l-play.transport.playing", value: true });
  socket2.close();
  await page.waitForTimeout(500); // let playback actually start advancing before sampling

  // transport.playing: true -> the video is advancing, so consecutive screenshots must differ.
  expect(await isFrozen()).toBe(false);
});

test("a still-image playlist auto-advances after its configured duration", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, {
    type: "create", path: "layers",
    value: {
      id: "l-pl", name: "playlist test", order: 1, source: { type: "video", url: "/media/fixture-red.jpg" }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null,
      warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } },
      sourceMode: "playlist",
      playlist: { items: [{ ref: { type: "media", mediaId: "a" }, duration: 0.2 }, { ref: { type: "media", mediaId: "b" }, duration: 0.2 }], cursor: 0 },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);

  // server/src/automation.js's tickPlaylists genuinely does advance the cursor every
  // ~0.2s here (verified directly against the server, independent of any render client) —
  // but with a 2-item playlist the cursor OSCILLATES 0 -> 1 -> 0 -> 1 ... every ~0.4s, and
  // real setInterval tick jitter shifts those transition instants around by tens of ms.
  // Sampling state at one fixed instant (the original `waitForTimeout(600)` then single
  // read) is a coin flip: 600ms is ~1.5 cycles in, right on top of a wrap-back-to-0
  // boundary, so it's equally likely to catch the cursor mid-flip back at 0. Poll instead
  // and succeed the moment any sample shows the cursor has left its initial value — that's
  // the actual behavior under test ("auto-advances"), without being racy about exactly
  // when in the oscillation we happen to look.
  const fetchState = () =>
    new Promise((resolve) => {
      const s = new WebSocket(`ws://localhost:${WS_PORT}`);
      s.once("message", (raw) => { const msg = JSON.parse(raw.toString()); if (msg.type === "state") { s.close(); resolve(msg.state); } });
    });

  const deadline = Date.now() + 2000;
  let cursor = 0;
  while (Date.now() < deadline) {
    const state = await fetchState();
    cursor = state.layers["l-pl"]?.playlist?.cursor;
    if (cursor !== 0) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  expect(cursor).not.toBe(0);
});
