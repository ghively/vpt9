import { test, expect } from "@playwright/test";
// Reuses the server/static-serve bootstrap pattern from source-bank-media-kind.spec.js —
// inlined for test independence (Playwright files don't share module state across files).
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
const WS_PORT = 8198;
const RENDER_PORT = 8199;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-playlist-color-fallback-${process.pid}`);
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

// Regression: render-client layers.js derived `isColor` from the raw `layer.source.type`
// while deriving `isSlot` from the RESOLVED effective source (entry.sourceType). For a
// playlist layer whose single-mode fallback `source` is a color but whose current clip is
// real media, that made isColor=true — so the clip's frame upload AND transport were
// skipped and the wall painted the static fallback color instead of the clip. Reproduced
// with a STILL image playlist item (no flaky headless video playback needed): a blue color
// fallback + a one-item playlist pointing at a red jpg must render RED, not the blue fallback.
test("a playlist layer with a color single-mode fallback plays its clip, not the fallback color", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  await wsSend(socket, {
    type: "create",
    path: "media",
    value: {
      id: "red-jpg",
      name: FIXTURE_FILE,
      filename: FIXTURE_FILE,
      kind: "image",
      size: 1,
      uploadedAt: new Date().toISOString(),
    },
  });

  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      id: "layer-pl", name: "playlist-color-fallback", order: 100,
      // The trap: a BLUE color fallback for single mode. Pre-fix, this color leaked onto
      // the wall in playlist mode. The playlist below points at the red jpg.
      source: { type: "color", color: [0, 0, 1] },
      opacity: 1, blendMode: "normal",
      sourceMode: "playlist",
      playlist: { items: [{ ref: { type: "media", mediaId: "red-jpg" }, duration: 5 }], cursor: 0 },
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

  // The red jpg must win: strongly red, and NOT the blue [0,0,1] fallback the bug painted.
  expect(px[0]).toBeGreaterThan(180); // red channel high (jpg)
  expect(px[2]).toBeLessThan(100);    // blue channel low (NOT the fallback color)
});
