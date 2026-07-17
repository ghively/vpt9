import { test, expect } from "@playwright/test";
// Panel harness (same bootstrap as deck-panel.spec.js: build panel/dist, serve it, boot the
// control-plane). Verifies the WebMIDI CC path (panel/src/app/useMidi.ts) end-to-end with a
// SYNTHETIC MIDI device — the same technique the camera path uses a fake camera for. A real
// hardware MIDI controller emitting the CC is the only irreducible remainder (WebMIDI can't be
// synthesized further in-browser); this proves the message-decode -> mapping-match -> scaled
// parameter-write logic is correct without one.
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

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-midi-cc-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;

function buildPanel() {
  const viteBin = path.join(PANEL_DIR, "node_modules", "vite", "bin", "vite.js");
  const result = spawnSync(process.execPath, [viteBin, "build"], { cwd: PANEL_DIR, stdio: "inherit", timeout: 120_000 });
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
async function readState() { return (await fetch(`http://localhost:${WS_PORT}/state`)).json(); }

test.beforeAll(async () => { buildPanel(); await startServer(); await startStatic(); });
test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(STATE_FILE, { force: true });
  rmSync(MEDIA_DIR, { recursive: true, force: true });
});

test("a MIDI CC message drives its mapped parameter (channel/controller match → scaled write)", async ({ page }) => {
  // Seed a mapping (CC 74 on channel 0 → master, 0..1) + a known starting master, before the
  // panel connects, so useMidi reads them from the synced state.
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, { type: "create", path: "midiMap", value: { id: "m1", channel: 0, controller: 74, target: "master", min: 0, max: 1 } });
  await wsSend(socket, { type: "update", path: "master", value: 0.2 });
  socket.close();

  // Inject a synthetic MIDI device BEFORE any app script runs (addInitScript), exposing the
  // input so the test can emit a raw CC message the way a hardware controller would.
  await page.addInitScript(() => {
    const input = { onmidimessage: null };
    window.__midiInput = input;
    const access = { inputs: new Map([["mock-in", input]]), outputs: new Map(), onstatechange: null };
    navigator.requestMIDIAccess = () => Promise.resolve(access);
  });

  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  // Wait for useMidi to acquire access and bind onmidimessage to our synthetic input.
  await page.waitForFunction(() => window.__midiInput && typeof window.__midiInput.onmidimessage === "function", null, { timeout: 10_000 });

  // Emit CC 74 = 127 on channel 0 (status 0xB0). 127/127 → the mapping's max (1.0).
  await page.evaluate(() => window.__midiInput.onmidimessage({ data: new Uint8Array([0xB0, 74, 127]) }));
  await expect.poll(async () => (await readState()).master).toBe(1);

  // Half value → mid-range; proves it's a real 0..127→[min,max] scale, not a fixed toggle.
  await page.evaluate(() => window.__midiInput.onmidimessage({ data: new Uint8Array([0xB0, 74, 64]) }));
  await expect.poll(async () => (await readState()).master).toBeGreaterThan(0.45);
  await expect.poll(async () => (await readState()).master).toBeLessThan(0.55);

  // A DIFFERENT controller (75) must NOT drive this mapping (74) — match is channel+controller.
  await page.evaluate(() => window.__midiInput.onmidimessage({ data: new Uint8Array([0xB0, 75, 0]) }));
  await page.waitForTimeout(300);
  const m = (await readState()).master;
  expect(m).toBeGreaterThan(0.45); // unchanged from the ~0.5 above, not driven to 0
});
