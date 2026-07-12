import { test, expect } from "@playwright/test";
// Reuses the exact isolated server/static-serve bootstrap from source-bank-media-kind.spec.js
// / layer-mask-matte.spec.js (extracted inline for test independence — Playwright specs don't
// share module state). Covers the SOURCE-BANK-INPUTS cluster paths that render deterministically
// in headless GL: A13 solid-color slots + color-as-mix-inputs, and A15 per-source downscale.
// The camera paths (A13/A14) can't run under headless getUserMedia, so they're covered by
// node --check + state round-trip tests instead (see the report).
//
// Isolated ports 8202/8203 (distinct from every other spec's 8180–8201).
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
const WS_PORT = 8202;
const RENDER_PORT = 8203;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-source-bank-inputs-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;
const FIXTURES_DIR = path.join(__dirname, "fixtures");
const RED_JPG = "media-fixture-red.jpg";

async function startServer() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  copyFileSync(path.join(FIXTURES_DIR, RED_JPG), path.join(MEDIA_DIR, RED_JPG));
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
async function withSocket(fn) {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await fn(socket);
  socket.close();
}
function readCenter(canvas) {
  return canvas.evaluate((el) => {
    const gl = el.getContext("webgl2");
    const px = new Uint8Array(4);
    gl.readPixels(el.width >> 1, el.height >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return Array.from(px);
  });
}

test.beforeAll(async () => { await startServer(); await startStatic(); });
test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(STATE_FILE, { force: true });
  rmSync(MEDIA_DIR, { recursive: true, force: true });
});

// A13 — a solid-color slot (VPT8's solid1/solid2) resolves to a filled texture and
// composites through a layer pointed at that slot.
test("a solid-color source-bank slot composites through a layer pointed at that slot", async ({ page }) => {
  await withSocket(async (socket) => {
    await wsSend(socket, { type: "update", path: "sourceBank.0.content", value: { type: "color", color: [0, 1, 0] } });
    await wsSend(socket, {
      type: "create", path: "layers",
      value: {
        id: "layer-color-slot", name: "color slot", order: 100,
        source: { type: "slot", slotId: "slot-1" }, opacity: 1, blendMode: "normal",
        mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null,
        warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
      },
    });
  });

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(1000);
  const px = await readCenter(page.locator("canvas"));
  // Green fill: strong green channel, weak red/blue — definitively not the black an
  // unresolved (never-uploaded) slot texture would produce.
  expect(px[1]).toBeGreaterThan(180);
  expect(px[0]).toBeLessThan(80);
  expect(px[2]).toBeLessThan(80);
});

// A13 — solid-color inputs feed a MIX slot's A/B and the crossfade selects between them.
test("a mix of two solid-color inputs blends and crossfades (color-as-mix-input)", async ({ page }) => {
  await withSocket(async (socket) => {
    await wsSend(socket, {
      type: "update", path: "sourceBank.1.content",
      value: { type: "mix", a: { type: "color", color: [1, 0, 0] }, b: { type: "color", color: [0, 0, 1] }, blendMode: "normal", mix: 0 },
    });
    await wsSend(socket, {
      type: "create", path: "layers",
      value: {
        id: "layer-mix-slot", name: "mix slot", order: 200,
        source: { type: "slot", slotId: "slot-2" }, opacity: 1, blendMode: "normal",
        mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null,
        warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
      },
    });
  });

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(1000);
  // mix = 0 selects input A (red).
  let px = await readCenter(page.locator("canvas"));
  expect(px[0]).toBeGreaterThan(180);
  expect(px[2]).toBeLessThan(80);

  // Crossfade fully to input B (blue) — proves both color inputs decoded independently.
  await withSocket((socket) => wsSend(socket, { type: "update", path: "sourceBank.1.content.mix", value: 1 }));
  await page.waitForTimeout(700);
  px = await readCenter(page.locator("canvas"));
  expect(px[2]).toBeGreaterThan(180);
  expect(px[0]).toBeLessThan(80);
});

// A15 — a layer whose direct source is downscaled still composites (the reduced-size
// decode/upload path must not blank the layer; color is resolution-invariant, so a red
// fixture stays red).
test("a downscaled direct source still composites correctly (task A15)", async ({ page }) => {
  await withSocket(async (socket) => {
    await wsSend(socket, {
      type: "create", path: "media",
      value: { id: "red-jpg", name: RED_JPG, filename: RED_JPG, kind: "image", size: 1, uploadedAt: new Date().toISOString() },
    });
    await wsSend(socket, {
      type: "create", path: "layers",
      value: {
        id: "layer-downscaled", name: "downscaled", order: 300,
        source: { type: "video", url: `/media/${RED_JPG}` }, opacity: 1, blendMode: "normal", downscale: 4,
        mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null,
        warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
      },
    });
  });

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(1200); // let the jpg decode + downscaled upload land
  const px = await readCenter(page.locator("canvas"));
  expect(px[0]).toBeGreaterThan(180);
  expect(px[1]).toBeLessThan(80);
});
