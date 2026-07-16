import { test, expect } from "@playwright/test";
// Hover/press-to-animate gif thumbnails (2026-07-16): the bin shows a static poster
// (fast), and swaps to the real animated gif only for the cell you hover (desktop) or
// press (touch) — so the grid doesn't animate every gif at once. Same panel-build/static
// bootstrap as deck-panel.spec.js.
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
const WS_PORT = 8206;
const PANEL_PORT = 8207;
let serverProc, staticServer;
const TMP = path.join(os.tmpdir(), `vpt-e2e-thumbhover-${process.pid}`);

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

async function seedGif() {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((r) => socket.once("open", r));
  await wsSend(socket, { type: "create", path: "media", value: { id: "g1", name: "loop.gif", filename: "g1.gif", kind: "gif", size: 100, uploadedAt: "2025-01-01T00:00:00.000Z", tags: [] } });
  socket.close();
}
const thumbSrc = (cell) => cell.locator("img.media-thumb").getAttribute("src");

test("desktop hover swaps a gif thumbnail poster ↔ animated file", async ({ page }) => {
  await seedGif();
  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  await page.locator(".media-folder", { hasText: "All" }).click();
  const cell = page.locator(".media-cell", { hasText: "loop.gif" });
  await expect(cell).toBeVisible();

  // Static poster at rest.
  expect(await thumbSrc(cell)).toMatch(/\/media\/g1\.gif\/thumb$/);
  // Hover → the real animated file (no /thumb).
  await cell.hover();
  await expect.poll(() => thumbSrc(cell)).toMatch(/\/media\/g1\.gif$/);
  // Move away → back to the poster.
  await page.mouse.move(2, 2);
  await expect.poll(() => thumbSrc(cell)).toMatch(/\/media\/g1\.gif\/thumb$/);
});

test("touch press animates the gif, release returns to the poster", async ({ page }) => {
  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  await page.locator(".media-folder", { hasText: "All" }).click();
  const cell = page.locator(".media-cell", { hasText: "loop.gif" });
  await expect(cell).toBeVisible();
  const box = await cell.boundingBox();
  const cx = Math.round(box.x + box.width / 2), cy = Math.round(box.y + box.height / 2);

  await cell.dispatchEvent("pointerdown", { pointerType: "touch", clientX: cx, clientY: cy, isPrimary: true, bubbles: true });
  await expect.poll(() => thumbSrc(cell)).toMatch(/\/media\/g1\.gif$/);
  await cell.dispatchEvent("pointerup", { pointerType: "touch", clientX: cx, clientY: cy, isPrimary: true, bubbles: true });
  await expect.poll(() => thumbSrc(cell)).toMatch(/\/media\/g1\.gif\/thumb$/);
});
