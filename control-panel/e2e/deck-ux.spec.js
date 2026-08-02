import { test, expect } from "@playwright/test";
// UX restructure (2026-07-16): master/blackout/blind moved to a bottom strip, the dead
// audio-owner control removed, per-layer play/pause + draggable opacity on rows, FX
// section open by default with a HUE slider, and a Help panel of shortcuts/gestures. Same
// panel-build/static bootstrap as deck-panel.spec.js.
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
const WS_PORT = 8202;
const PANEL_PORT = 8203;
let serverProc, staticServer;
const TMP = path.join(os.tmpdir(), `vpt-e2e-ux-${process.pid}`);

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

test.beforeAll(async () => { buildPanel(); await startServer(); await startStatic(); });
test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(`${TMP}.json`, { force: true });
  rmSync(`${TMP}-media`, { recursive: true, force: true });
});

test("master/blind strip is at the bottom; playback-owner picker is in it (relabeled), not the old 'Audio on:'", async ({ page }) => {
  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  const bar = page.locator(".master-bar");
  await expect(bar).toBeVisible();
  await expect(bar.getByText("BLACKOUT")).toBeVisible();
  await expect(bar.getByText("BLIND")).toBeVisible();
  // The master strip is the last child of .deck (bottom of the page).
  const isLast = await page.evaluate(() => document.querySelector(".deck")?.lastElementChild?.classList.contains("master-bar"));
  expect(isLast).toBe(true);
  // The owner picker is BACK (it drives playlist-advance/telemetry/record, not audio) — in
  // the master bar, multi-screen only (default state ships screen-1 + screen-2), relabeled.
  await expect(bar.locator("#audio-owner")).toBeVisible();
  await expect(bar.getByText("Playback:")).toBeVisible();
  await expect(page.getByText("Audio on:")).toHaveCount(0);
});

test("Help panel lists shortcuts and closes on Escape", async ({ page }) => {
  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  await page.locator(".help-btn").click();
  const help = page.locator(".help-panel");
  await expect(help).toBeVisible();
  await expect(help.getByText("Recall look")).toBeVisible();
  await expect(help.getByText("Import it into the media library")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(help).toHaveCount(0);
});

test("a layer row exposes play/pause and a draggable opacity fader; FX shows a HUE slider writing fx.hue", async ({ page }) => {
  // layer-1 is a color placeholder by default (no bundled sample video ships with the
  // repo — see server/src/state.js) — give it a video source directly so its row shows
  // a play button + fader, same as it would once an operator assigns real footage.
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await new Promise((resolve) =>
    socket.send(JSON.stringify({ type: "update", path: "layers.layer-1.source", value: { type: "video", url: "/media/placeholder.mp4" } }), resolve),
  );
  socket.close();

  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  const row = page.locator('.layer[data-id="layer-1"]');
  await expect(row.locator(".layer-quick .layer-play")).toBeVisible();
  await expect(row.locator('.layer-quick input[type="range"]')).toBeVisible();

  // Select it, then the FX section is open by default and contains the HUE slider.
  await row.locator(".layer-hit").click();
  const hue = page.locator(".fx-control", { hasText: "HUE" });
  await expect(hue).toBeVisible();

  // Dragging the HUE fader writes layers.layer-1.fx.hue.
  const fader = hue.locator('input[type="range"]');
  await fader.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(async () => {
      const state = await (await fetch(`http://localhost:${WS_PORT}/state`)).json();
      return state.layers["layer-1"].fx.hue;
    })
    .toBeGreaterThan(0);
});

test("Warp section owns the corner-preset menu; Mask section owns editable size (no longer duplicated in FX)", async ({ page }) => {
  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  await page.locator('.layer[data-id="layer-1"] .layer-hit').click();

  // Expand the dedicated Warp section and apply a corner preset from its (moved-here) menu.
  await page.locator(".insp-sec__head", { hasText: "Warp" }).click();
  const preset = page.locator(".corner-preset-select");
  await expect(preset).toBeVisible();
  await preset.selectOption("leftThird");
  await expect
    .poll(async () => {
      const state = await (await fetch(`http://localhost:${WS_PORT}/state`)).json();
      // leftThird pins the top-right corner x to 0.333.
      return state.layers["layer-1"].warp.corners?.[1]?.x;
    })
    .toBeCloseTo(0.333, 2);

  // The corner-preset menu must NOT also appear inside the FX section (de-duplicated).
  const fxSection = page.locator(".insp-sec", { hasText: "FX" });
  await expect(fxSection.locator(".corner-preset-select")).toHaveCount(0);

  // Expand the dedicated Mask section and drive its editable Size X fader.
  await page.locator(".insp-sec__head", { hasText: "Mask" }).click();
  const sizeX = page.locator(".field", { hasText: "Size X" }).locator('input[type="range"]');
  await sizeX.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(async () => {
      const state = await (await fetch(`http://localhost:${WS_PORT}/state`)).json();
      return state.layers["layer-1"].mask.rx;
    })
    .toBeLessThan(0.4);
});

test("desktop: left-rail sections collapse (folding Media reveals more room) and the state persists", async ({ page }) => {
  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  // The three left-rail sections render collapsible headers on desktop.
  const mediaHead = page.locator(".rail-l .sec-head--toggle", { hasText: "Media" });
  await expect(mediaHead).toHaveAttribute("aria-expanded", "true");
  // The media bin body (its + Add media button) is visible while expanded.
  await expect(page.locator(".media-bin__add")).toBeVisible();
  // Collapse it: the body hides and aria-expanded flips.
  await mediaHead.click();
  await expect(mediaHead).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".media-bin__add")).toHaveCount(0);
  // Reloading keeps it collapsed (persisted to localStorage).
  await page.reload();
  await expect(page.locator(".rail-l .sec-head--toggle[aria-expanded='false']", { hasText: "Media" })).toHaveCount(1);
});
