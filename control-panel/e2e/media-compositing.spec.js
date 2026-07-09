import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import { mkdirSync, copyFileSync } from "node:fs";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8180;
const RENDER_PORT = 8181;

const MEDIA_DIR = path.join(REPO_ROOT, "server", "media");
const FIXTURES_DIR = path.join(__dirname, "fixtures");
// The server only serves filenames matching its server-generated `media-<token>.<ext>`
// pattern (server/src/media.js's SAFE_FILENAME allowlist) — see media-helpers.test.js's
// "sample.mp4" rejection case. Fixtures are named to satisfy that allowlist and are
// copied into MEDIA_DIR before the server starts, rather than hand-editing the allowlist.
const FIXTURE_FILES = ["media-fixture-red.jpg", "media-fixture-blink.gif"];

let serverProc;
let staticServer;

async function startServer() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  for (const name of FIXTURE_FILES) {
    copyFileSync(path.join(FIXTURES_DIR, name), path.join(MEDIA_DIR, name));
  }
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), MEDIA_DIR, OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (buf) => {
      if (buf.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); }
    };
    serverProc.stdout.on("data", onData);
    serverProc.on("exit", (code) => reject(new Error(`server exited early (${code})`)));
    setTimeout(() => reject(new Error("server did not start within 10s")), 10_000);
  });
}

async function startStatic() {
  staticServer = http.createServer((req, res) =>
    // cleanUrls: false — serve-handler's default "cleanUrls" behavior 301-redirects
    // /index.html to / and drops the query string in the process, which silently
    // strips the ?screen=&ws= params the render client depends on to find its
    // control-plane. Discovered while debugging this test: the page would load with
    // location.search === "" and silently fall back to the default ws://host:8080,
    // never receiving the test's layer state.
    handler(req, res, { public: path.join(REPO_ROOT, "render-client"), cleanUrls: false }),
  );
  await new Promise((resolve) => staticServer.listen(RENDER_PORT, resolve));
}

function wsSend(socket, message) {
  return new Promise((resolve) => socket.send(JSON.stringify(message), resolve));
}

test.beforeAll(async () => {
  await startServer();
  await startStatic();
});

test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
});

test("a jpg and a gif source composite correctly and the gif animates", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  // Two solid-color-distinguishable fixture files already exist for this purpose;
  // see Step 3 for how they're generated if missing.
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: { id: "layer-jpg", name: "jpg test", order: 10, source: { type: "video", url: "/media/media-fixture-red.jpg" }, opacity: 1, blendMode: "normal", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null },
  });
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: { id: "layer-gif", name: "gif test", order: 20, source: { type: "video", url: "/media/media-fixture-blink.gif" }, opacity: 0, blendMode: "normal", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(1500); // let the jpg decode + first composite land

  const canvas = page.locator("canvas");
  const redPixel = await canvas.evaluate((el) => {
    const gl = el.getContext("webgl2");
    const px = new Uint8Array(4);
    gl.readPixels(el.width >> 1, el.height >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return Array.from(px);
  });
  expect(redPixel[0]).toBeGreaterThan(180); // fixture-red.jpg center should read back strongly red
  expect(redPixel[1]).toBeLessThan(80);

  // Confirm the gif is animating: two screenshots a beat apart must differ.
  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.layer-jpg.opacity", value: 0 });
  await wsSend(socket2, { type: "update", path: "layers.layer-gif.opacity", value: 1 });
  socket2.close();
  await page.waitForTimeout(300);

  const frame1 = await canvas.screenshot();
  await page.waitForTimeout(500);
  const frame2 = await canvas.screenshot();
  expect(Buffer.compare(frame1, frame2)).not.toBe(0);
});
