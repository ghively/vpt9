import { test, expect } from "@playwright/test";
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
const WS_PORT = 8192;
const RENDER_PORT = 8193;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-rotation-mask-diagnostic-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;

async function startServer() {
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), STATE_FILE, MEDIA_DIR, OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (buf) => {
      if (buf.toString().includes("listening")) {
        serverProc.stdout.off("data", onData);
        resolve();
      }
    };
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

function wsSend(socket, message) {
  return new Promise((resolve) => socket.send(JSON.stringify(message), resolve));
}

async function withSocket(fn) {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  try {
    await fn(socket);
  } finally {
    socket.close();
  }
}

async function readPixel(canvas, xFrac, yFrac) {
  return canvas.evaluate(
    (el, [xf, yf]) => {
      const gl = el.getContext("webgl2");
      const px = new Uint8Array(4);
      gl.readPixels(Math.round(el.width * xf), Math.round(el.height * yf), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return Array.from(px);
    },
    [xFrac, yFrac],
  );
}

test.beforeAll(async () => {
  await startServer();
  await startStatic();
});

test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(STATE_FILE, { force: true });
  rmSync(MEDIA_DIR, { recursive: true, force: true });
});

test("a rotated layer still picks up later mask updates on the same layer", async ({ page }) => {
  await withSocket(async (socket) => {
    await wsSend(socket, {
      type: "create",
      path: "layers",
      value: {
        id: "layer-rot-mask",
        name: "rotated mask diagnostic",
        order: 700,
        source: { type: "color", color: [1, 0, 0] },
        opacity: 1,
        blendMode: "normal",
      },
    });
  });

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(500);
  const canvas = page.locator("canvas");

  const beforeMask = await readPixel(canvas, 0.5, 0.5);
  expect(beforeMask[0]).toBeGreaterThan(180);

  await withSocket(async (socket) => {
    await wsSend(socket, { type: "update", path: "layers.layer-rot-mask.fx.rotationDeg", value: 30 });
  });
  await page.waitForTimeout(300);

  await withSocket(async (socket) => {
    await wsSend(socket, { type: "update", path: "layers.layer-rot-mask.mask.shape", value: "rect" });
    await wsSend(socket, { type: "update", path: "layers.layer-rot-mask.mask.cx", value: 0.5 });
    await wsSend(socket, { type: "update", path: "layers.layer-rot-mask.mask.cy", value: 0.5 });
    await wsSend(socket, { type: "update", path: "layers.layer-rot-mask.mask.rx", value: 0.12 });
    await wsSend(socket, { type: "update", path: "layers.layer-rot-mask.mask.ry", value: 0.12 });
    await wsSend(socket, { type: "update", path: "layers.layer-rot-mask.mask.feather", value: 0 });
    await wsSend(socket, { type: "update", path: "layers.layer-rot-mask.mask.enabled", value: true });
  });
  await page.waitForTimeout(500);

  const stillVisibleAtMaskCenter = await readPixel(canvas, 0.5, 0.5);
  expect(stillVisibleAtMaskCenter[0]).toBeGreaterThan(180);
  const maskedOutAfterUpdate = await readPixel(canvas, 0.8, 0.5);
  expect(maskedOutAfterUpdate[0]).toBeLessThan(60);
});

test("mask updates on one layer remain live after another layer is rotated", async ({ page }) => {
  await withSocket(async (socket) => {
    await wsSend(socket, {
      type: "create",
      path: "layers",
      value: {
        id: "layer-rot-other",
        name: "rotated other layer",
        order: 800,
        source: { type: "color", color: [1, 0, 0] },
        opacity: 1,
        blendMode: "normal",
      },
    });
    await wsSend(socket, {
      type: "create",
      path: "layers",
      value: {
        id: "layer-mask-target",
        name: "mask target layer",
        order: 900,
        source: { type: "color", color: [0, 1, 0] },
        opacity: 1,
        blendMode: "normal",
      },
    });
  });

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(500);
  const canvas = page.locator("canvas");

  const beforeMask = await readPixel(canvas, 0.8, 0.5);
  expect(beforeMask[1]).toBeGreaterThan(180);

  await withSocket(async (socket) => {
    await wsSend(socket, { type: "update", path: "layers.layer-rot-other.fx.rotationDeg", value: 30 });
  });
  await page.waitForTimeout(300);

  await withSocket(async (socket) => {
    await wsSend(socket, { type: "update", path: "layers.layer-mask-target.mask.shape", value: "rect" });
    await wsSend(socket, { type: "update", path: "layers.layer-mask-target.mask.cx", value: 0.5 });
    await wsSend(socket, { type: "update", path: "layers.layer-mask-target.mask.cy", value: 0.5 });
    await wsSend(socket, { type: "update", path: "layers.layer-mask-target.mask.rx", value: 0.12 });
    await wsSend(socket, { type: "update", path: "layers.layer-mask-target.mask.ry", value: 0.12 });
    await wsSend(socket, { type: "update", path: "layers.layer-mask-target.mask.feather", value: 0 });
    await wsSend(socket, { type: "update", path: "layers.layer-mask-target.mask.enabled", value: true });
  });
  await page.waitForTimeout(500);

  const maskTargetStillVisibleAtCenter = await readPixel(canvas, 0.5, 0.5);
  expect(maskTargetStillVisibleAtCenter[1]).toBeGreaterThan(180);
  const maskTargetClearedOutside = await readPixel(canvas, 0.8, 0.5);
  expect(maskTargetClearedOutside[1]).toBeLessThan(80);
  expect(maskTargetClearedOutside[0]).toBeGreaterThan(120);
});
