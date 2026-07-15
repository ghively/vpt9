import { test, expect } from "@playwright/test";
// The live-show workflow surfaces added in the deck polish pass: true blind editing
// (BLIND snapshots the look; GO LIVE commits, DISCARD reverts) and the look bar
// (trigger-only preset chips above the stage + 1-9 keyboard recall). Same panel
// build/serve bootstrap as deck-panel.spec.js — see the comments there.
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
// 8196/8197: next free pair after deck-panel.spec.js's 8194/8195.
const WS_PORT = 8196;
const PANEL_PORT = 8197;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-deck-live-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;

function buildPanel() {
  const viteBin = path.join(PANEL_DIR, "node_modules", "vite", "bin", "vite.js");
  const result = spawnSync(process.execPath, [viteBin, "build"], {
    cwd: PANEL_DIR,
    stdio: "inherit",
    timeout: 120_000,
  });
  if (result.status !== 0) throw new Error(`panel build failed (exit ${result.status ?? "timeout"})`);
}

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
    handler(req, res, { public: path.join(PANEL_DIR, "dist"), cleanUrls: false }),
  );
  await new Promise((resolve) => staticServer.listen(PANEL_PORT, resolve));
}

function wsSend(socket, message) { return new Promise((resolve) => socket.send(JSON.stringify(message), resolve)); }
const readState = async () => (await fetch(`http://localhost:${WS_PORT}/state`)).json();

test.beforeAll(async () => {
  buildPanel();
  await startServer();
  await startStatic();
});
test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(STATE_FILE, { force: true });
  rmSync(MEDIA_DIR, { recursive: true, force: true });
});

test("BLIND snapshots the look; DISCARD reverts off-air edits; GO LIVE commits them", async ({ page }) => {
  // server/src/state.js seeds layer-1 (opacity 1). Drive edits over a raw socket while
  // the panel's buttons drive the blind session itself.
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  const before = (await readState()).layers["layer-1"].opacity;

  // Round 1: engage blind, edit off-air, DISCARD → edit reverted, blind off.
  await page.getByRole("button", { name: "BLIND", exact: true }).click();
  await expect.poll(async () => (await readState()).blind).toBe(true);
  await expect(page.locator(".deck-stage")).toHaveAttribute("data-blind", "true");

  await wsSend(socket, { type: "update", path: "layers.layer-1.opacity", value: 0.25 });
  await expect.poll(async () => (await readState()).layers["layer-1"].opacity).toBe(0.25);

  await page.getByRole("button", { name: "DISCARD", exact: true }).click();
  await expect.poll(async () => (await readState()).blind).toBe(false);
  expect((await readState()).layers["layer-1"].opacity).toBe(before);
  await expect(page.locator(".deck-stage")).toHaveAttribute("data-blind", "false");

  // Round 2: engage blind, edit off-air, GO LIVE → edit survives the commit.
  await page.getByRole("button", { name: "BLIND", exact: true }).click();
  await expect.poll(async () => (await readState()).blind).toBe(true);
  await wsSend(socket, { type: "update", path: "layers.layer-1.opacity", value: 0.6 });
  await page.getByRole("button", { name: "GO LIVE", exact: true }).click();
  await expect.poll(async () => (await readState()).blind).toBe(false);
  expect((await readState()).layers["layer-1"].opacity).toBe(0.6);

  socket.close();
});

test("look bar saves the scene and the number key recalls it", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  await expect(page.locator(".lookbar")).toBeVisible();

  // Pin a known opacity, snapshot it as look 1 via the bar's +save.
  await wsSend(socket, { type: "update", path: "layers.layer-1.opacity", value: 0.8 });
  await expect.poll(async () => (await readState()).layers["layer-1"].opacity).toBe(0.8);
  await page.locator(".look-save").click();
  await expect.poll(async () => Object.keys((await readState()).presets ?? {}).length).toBe(1);
  await expect(page.locator(".look-chip")).toHaveCount(1);

  // Wreck the look, then recall it with the "1" key (focus the page body first —
  // shortcuts are guarded off inputs).
  await wsSend(socket, { type: "update", path: "layers.layer-1.opacity", value: 0.1 });
  await expect.poll(async () => (await readState()).layers["layer-1"].opacity).toBe(0.1);
  await page.locator(".deck-stage").click();
  await page.keyboard.press("1");
  await expect.poll(async () => (await readState()).layers["layer-1"].opacity).toBe(0.8);

  socket.close();
});
