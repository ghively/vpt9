import { test, expect } from "@playwright/test";
// Render-client harness (same bootstrap as source-bank-media-kind.spec.js). Verifies the
// YouTube-in-PiP DOM wiring (render-client/src/pip.js): when a PiP on this screen is visible
// and has a videoId, the overlay mounts an <iframe> pointing at the YouTube embed URL for
// that id. This exercises the D3 cast target's client side end-to-end MINUS actual youtube.com
// playback (a cross-origin iframe whose pixels can't be read and which needs the real site) —
// the piece that genuinely needs a network + real embed, called out in README's "Not verifiable".
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
const WS_PORT = 8202;
const RENDER_PORT = 8203;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-pip-youtube-${process.pid}`);
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

test("a visible PiP with a videoId mounts a YouTube-embed iframe on its screen", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  // pip-1 exists in DEFAULT_STATE on screen-1; make it a live cast target (this is exactly
  // what the cast-receiver's /api/pip/:id/cast relay writes when a phone casts).
  const videoId = "dQw4w9WgXcQ";
  await wsSend(socket, { type: "update", path: "pip.pip-1.videoId", value: videoId });
  await wsSend(socket, { type: "update", path: "pip.pip-1.visible", value: true });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);

  // The overlay mounts one .pip-window with an <iframe> whose src is the YouTube embed for
  // this videoId. Poll — the DOM sync happens on the first state broadcast after connect.
  const iframe = page.locator("#pip-root .pip-window iframe");
  await expect(iframe).toHaveCount(1);
  const src = await iframe.getAttribute("src");
  expect(src).toContain(`youtube.com/embed/${videoId}`);
  expect(src).toContain("autoplay=1");

  // Hiding the PiP tears the embed down (a display:none iframe would keep playing/sounding —
  // see pip.js), so the src must clear rather than linger.
  const s2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => s2.once("open", resolve));
  await wsSend(s2, { type: "update", path: "pip.pip-1.visible", value: false });
  s2.close();
  await expect.poll(async () => (await iframe.getAttribute("src")) || "").not.toContain("youtube.com/embed");
});
