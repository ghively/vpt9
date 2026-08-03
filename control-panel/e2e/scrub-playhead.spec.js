import { test, expect } from "@playwright/test";
// Scrub fader tracks the live playhead (2026-07-16): transportStatus now carries clip
// duration (render-client → server relay → panel), so the SCRUB thumb follows position/
// duration instead of sitting frozen at the last seek. Same panel bootstrap as deck-panel.
import { spawnSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import os from "node:os";
import { rmSync } from "node:fs";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PANEL_DIR = path.join(REPO_ROOT, "panel");
const WS_PORT = 8208;
const PANEL_PORT = 8209;
let serverProc, staticServer;
const TMP = path.join(os.tmpdir(), `vpt-e2e-scrub-${process.pid}`);

function buildPanel() {
  const viteBin = path.join(PANEL_DIR, "node_modules", "vite", "bin", "vite.js");
  const r = spawnSync(process.execPath, [viteBin, "build"], { cwd: PANEL_DIR, stdio: "inherit", timeout: 120_000 });
  if (r.status !== 0) throw new Error(`panel build failed (${r.status ?? "timeout"})`);
}
async function startServer() {
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), STATE_FILE: `${TMP}.json`, MEDIA_DIR: `${TMP}-media`, OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (b) => { if (b.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); } };
    serverProc.stdout.on("data", onData);
    serverProc.on("exit", (c) => reject(new Error(`server exited early (${c})`)));
    setTimeout(() => reject(new Error("server did not start")), 10_000);
  });
}
async function startStatic() {
  staticServer = http.createServer((req, res) => handler(req, res, { public: path.join(PANEL_DIR, "dist"), cleanUrls: false }));
  await new Promise((r) => staticServer.listen(PANEL_PORT, r));
}
const wsSend = (s, m) => new Promise((r) => s.send(JSON.stringify(m), r));

test.beforeAll(async () => { buildPanel(); await startServer(); await startStatic(); });
test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(`${TMP}.json`, { force: true });
  rmSync(`${TMP}-media`, { recursive: true, force: true });
});

test("SCRUB thumb follows the playhead from position/duration telemetry", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((r) => socket.once("open", r));
  await wsSend(socket, { type: "create", path: "layers", value: { id: "layer-scrub", name: "scrub", order: 5, source: { type: "video", url: "/media/x.mp4" }, opacity: 1, blendMode: "normal", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null, warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } } } });
  await wsSend(socket, { type: "update", path: "layers.layer-scrub.transport.playing", value: true });

  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  await page.locator('.layer[data-id="layer-scrub"] .layer-hit').click();
  // Inspector is its own sidebar tab now — not visible until selected.
  await page.locator(".sidebar-tabs button", { hasText: "Inspector" }).click();
  const scrub = page.locator(".fx-control", { hasText: "SCRUB" }).locator('input[type="range"]');
  await scrub.scrollIntoViewIfNeeded();
  await expect(scrub).toBeVisible();
  const val = () => scrub.evaluate((el) => Number(el.value));

  // A SECOND ws client sends the telemetry the render-client would; the server relays it.
  const tele = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((r) => tele.once("open", r));
  await wsSend(tele, { type: "transportStatus", layerId: "layer-scrub", position: 5, duration: 10 });
  await expect.poll(val).toBeCloseTo(0.5, 1);
  await wsSend(tele, { type: "transportStatus", layerId: "layer-scrub", position: 8, duration: 10 });
  await expect.poll(val).toBeCloseTo(0.8, 1);

  socket.close();
  tele.close();
});
