import { test, expect } from "@playwright/test";
// Mobile UI pass (2026-07-16): touch long-press opens the context menus that were
// mouse-right-click-only (rename/tags/collections/delete/clear-slot…), the "Media" tab
// (was "Slots") surfaces the library, and the master strip + help fit a phone. Runs in a
// mobile viewport with touch. Same panel-build/static bootstrap as deck-panel.spec.js.
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
const WS_PORT = 8204;
const PANEL_PORT = 8205;
let serverProc, staticServer;
const TMP = path.join(os.tmpdir(), `vpt-e2e-mobile-${process.pid}`);

// Phone viewport with touch — below the 720px useIsMobile() breakpoint.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

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

// Long-press: dispatch a touch pointerdown at the element's center, hold past the 500ms
// threshold, then release — mirrors longPressHandlers() in ContextMenu.tsx.
async function longPress(locator, page) {
  const box = await locator.boundingBox();
  const cx = Math.round(box.x + box.width / 2), cy = Math.round(box.y + box.height / 2);
  await locator.dispatchEvent("pointerdown", { pointerType: "touch", clientX: cx, clientY: cy, isPrimary: true, bubbles: true });
  await page.waitForTimeout(650);
  await locator.dispatchEvent("pointerup", { pointerType: "touch", clientX: cx, clientY: cy, isPrimary: true, bubbles: true });
}

test("mobile: 'Media' tab (not 'Slots') + master strip present", async ({ page }) => {
  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  await expect(page.locator(".mobile-tabbar")).toBeVisible();
  await expect(page.locator(".mobile-tab", { hasText: "Media" })).toBeVisible();
  await expect(page.locator(".mobile-tab", { hasText: "Slots" })).toHaveCount(0);
  await expect(page.locator(".master-bar")).toBeVisible();
});

test("mobile: long-press a media cell opens its context menu (tags/collections/delete)", async ({ page }) => {
  // Seed a library item.
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((r) => socket.once("open", r));
  await wsSend(socket, { type: "create", path: "media", value: { id: "mob-1", name: "clip.mp4", filename: "mob-1.mp4", kind: "video", size: 100, uploadedAt: "2025-01-01T00:00:00.000Z", tags: [] } });
  socket.close();

  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  // Media tab → All folder → the cell.
  await page.locator(".mobile-tab", { hasText: "Media" }).click();
  await page.locator(".media-folder", { hasText: "All" }).click();
  const cell = page.locator(".media-cell", { hasText: "clip.mp4" });
  await expect(cell).toBeVisible();

  // No right-click on touch — long-press must open the same menu.
  await longPress(cell, page);
  const menu = page.locator(".ctx-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByText("Edit tags…")).toBeVisible();
  await expect(menu.getByText("Delete from library")).toBeVisible();
});

test("mobile: long-press a layer row opens Rename/Duplicate/Hide", async ({ page }) => {
  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  await page.locator(".mobile-tab", { hasText: "Layers" }).click();
  const row = page.locator('.layer[data-id="layer-1"]');
  await expect(row).toBeVisible();
  await longPress(row, page);
  const menu = page.locator(".ctx-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByText("Rename…")).toBeVisible();
  await expect(menu.getByText("Duplicate")).toBeVisible();
});
