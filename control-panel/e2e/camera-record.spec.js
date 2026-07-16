import { test, expect } from "@playwright/test";
// Verifies camera record-to-disk (task A14b: render-client/src/record.js) end-to-end with a
// SYNTHETIC camera — the audio-owner render-client wraps MediaRecorder around the camera
// layer's stream and POSTs the finished clip to the control-plane's /api/media, where it
// becomes a library entry. Chromium's fake device provides the stream; localhost is a secure
// context so getUserMedia + MediaRecorder work headless. Only a REAL camera's footage is the
// irreducible remainder. Portable: set PW_EXECUTABLE_PATH to pin a specific Chromium build
// (this sandbox); unset on normal CI so Playwright's bundled browser is used.
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
const WS_PORT = 8206;
const RENDER_PORT = 8207;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-camera-record-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;

test.use({
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
    ...(process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {}),
  },
});

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
async function readState() { return (await fetch(`http://localhost:${WS_PORT}/state`)).json(); }

test.beforeAll(async () => { await startServer(); await startStatic(); });
test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(STATE_FILE, { force: true });
  rmSync(MEDIA_DIR, { recursive: true, force: true });
});

test("the audio-owner render-client records its camera layer and uploads a clip to the library", async ({ page }) => {
  // Point a layer at the camera; this client is screen-1 = the default audio owner, so it's
  // the one that records + uploads.
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, { type: "update", path: "layers.layer-2.source", value: { type: "camera" } });
  await wsSend(socket, { type: "update", path: "layers.layer-2.opacity", value: 1 });
  socket.close();

  const before = Object.keys((await readState()).media ?? {}).length;

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(2500); // camera acquire (fake device) + first frames

  // Fire the record trigger the panel sends, record briefly, then stop → the "stop" handler
  // builds the blob and POSTs it to /api/media.
  const rec = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => rec.once("open", resolve));
  await wsSend(rec, { type: "record", action: "start" });
  await page.waitForTimeout(1500);
  await wsSend(rec, { type: "record", action: "stop" });
  rec.close();

  // The upload is async (encode flush → POST → applyCreate("media") → broadcast). Poll the
  // library for a new entry whose stored filename is a recorded camera clip.
  await expect.poll(async () => {
    const media = (await readState()).media ?? {};
    return Object.keys(media).length;
  }, { timeout: 15_000, intervals: [500] }).toBeGreaterThan(before);

  const media = Object.values((await readState()).media ?? {});
  const clip = media.find((m) => (m.name || "").startsWith("camera-") || /\.(webm|mp4)$/.test(m.filename || ""));
  expect(clip, "a recorded camera clip landed in the media library").toBeTruthy();
  expect(clip.kind).toBe("video");
});
