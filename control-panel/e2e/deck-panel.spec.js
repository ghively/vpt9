import { test, expect } from "@playwright/test";
// Same server/static-serve bootstrap the other specs use (see transport-and-playlist.spec.js),
// but for the *panel* rather than the render-client: build panel/dist once, serve it
// statically, and boot the control-plane against a temp STATE_FILE/MEDIA_DIR.
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
// Ports picked to avoid the running dev stack (8080/8081/8082) and the other specs
// (8180-8187) — nothing else in this repo uses 8194/8195.
const WS_PORT = 8194;
const PANEL_PORT = 8195;
let serverProc, staticServer;

// Unique per spec + per process so parallel/repeated runs never share (and pollute)
// the real control-panel/server/state.json or server/media used by dev/other specs.
const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-deck-panel-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;

// Build the panel exactly once for the whole spec file (vite build, not the full
// `npm run build`'s tsc --noEmit gate — that's covered separately by the verify step)
// by invoking vite's own JS entry directly with `node`, so this works the same on
// Windows (no .cmd/shell dependency) as everywhere else. `panel/vite.config.ts` sets
// `base: "./"` so the resulting panel/dist works behind any static server.
function buildPanel() {
  const viteBin = path.join(PANEL_DIR, "node_modules", "vite", "bin", "vite.js");
  const result = spawnSync(process.execPath, [viteBin, "build"], {
    cwd: PANEL_DIR,
    stdio: "inherit",
    timeout: 120_000,
  });
  if (result.status !== 0) {
    throw new Error(`panel build failed (exit ${result.status ?? "timeout"})`);
  }
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
    // cleanUrls: false — see media-compositing.spec.js: serve-handler's default
    // behavior strips the ?ws= query string off /index.html requests.
    handler(req, res, { public: path.join(PANEL_DIR, "dist"), cleanUrls: false }),
  );
  await new Promise((resolve) => staticServer.listen(PANEL_PORT, resolve));
}

function wsSend(socket, message) { return new Promise((resolve) => socket.send(JSON.stringify(message), resolve)); }

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

test("clicking a layer's region on the stage selects it", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  // server/src/state.js seeds two demo layers at startup: layer-1 (order 1) and
  // layer-2 (order 2, so it's the TOP of the stack). Give them known, non-overlapping
  // warp.corners so a click unambiguously lands on (at most) one of them: layer-2
  // (top) occupies the LEFT half of the frame, layer-1 the RIGHT half, with a small
  // gap between [0.45, 0.55] that belongs to neither.
  await wsSend(socket, {
    type: "update",
    path: "layers.layer-2.warp.corners",
    value: [{ x: 0, y: 0 }, { x: 0.45, y: 0 }, { x: 0.45, y: 1 }, { x: 0, y: 1 }],
  });
  await wsSend(socket, {
    type: "update",
    path: "layers.layer-1.warp.corners",
    value: [{ x: 0.55, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0.55, y: 1 }],
  });
  socket.close();

  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);

  const stage = page.locator(".deck-stage");
  await expect(stage).toBeVisible();
  const box = await stage.boundingBox();
  const selectedLayer = () => page.locator(".body");

  // Nothing selected yet (no click has happened).
  await expect(selectedLayer()).not.toHaveAttribute("data-selected-layer");

  // Click well inside layer-2's region (left half) -> selects layer-2.
  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.5);
  await expect(selectedLayer()).toHaveAttribute("data-selected-layer", "layer-2");

  // Click well inside layer-1's region (right half) -> selects layer-1.
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.5);
  await expect(selectedLayer()).toHaveAttribute("data-selected-layer", "layer-1");

  // Click the dead zone between the two regions -> deselects (empty space = no layer).
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await expect(selectedLayer()).not.toHaveAttribute("data-selected-layer");
});

test("dragging a corner handle on the stage sends the layer's own warp update", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  // A fresh, full-frame layer on top of the two demo layers (order: 100 — same
  // "outrank the seed layers" pattern layer-warp.spec.js uses) so a click anywhere on
  // the stage unambiguously selects it, with an identity corner-pin warp so the TL
  // handle starts at a known {x:0,y:0}.
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      id: "layer-drag",
      name: "drag test",
      order: 100,
      source: { type: "color", color: [0.2, 0.2, 0.2] },
      opacity: 1,
      blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
      fx: null,
      warp: {
        mode: "corner",
        corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
        mesh: { size: 4, points: [] },
      },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);

  const stage = page.locator(".deck-stage");
  await expect(stage).toBeVisible();
  const box = await stage.boundingBox();

  // Select the new layer by clicking its (full-frame) region on the stage. Warp is the
  // default stageEditMode (see src/app/useSelection.ts), so selecting it should render
  // its corner-pin handles directly on the stage — including ".deck-handle.tl", the
  // handle for corners[0] (TL), sitting right at the stage's top-left corner since
  // corners[0] = {x:0,y:0}.
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await expect(page.locator(".body")).toHaveAttribute("data-selected-layer", "layer-drag");
  await expect(page.locator(".deck-handle.tl")).toBeVisible();

  const readCorners = async () => {
    const state = await (await fetch(`http://localhost:${WS_PORT}/state`)).json();
    return state.layers["layer-drag"].warp.corners;
  };
  const before = await readCorners();
  expect(before[0]).toEqual({ x: 0, y: 0 });

  // Drag the TL handle a few pixels — a real pointerdown/move/up sequence so
  // WarpHandle's setPointerCapture-based drag (the same machinery WarpEditor's rail-
  // side corner drag uses) actually engages. Grab a few px in from the handle's own
  // center: the handle is centered exactly ON corners[0] = {x:0,y:0} (the stage's own
  // top-left pixel), so its dead-center sits right on `.deck-stage`'s `overflow:
  // hidden` clip edge, where hit-testing the exact boundary pixel is unreliable —
  // (box.x+3, box.y+3) is still well inside the handle's 16px circle but unambiguously
  // inside the clipped/visible region. Once captured, WarpHandle drives the corner
  // straight off the absolute cursor position (not the grab offset), so this doesn't
  // change where the drag ends up.
  await page.mouse.move(box.x + 3, box.y + 3);
  await page.mouse.down();
  await page.mouse.move(box.x + 40, box.y + 20, { steps: 5 });
  await page.mouse.up();

  // Poll (rather than a fixed sleep) until the server-side state reflects the drag —
  // proves the drag emitted a real "layers.layer-drag.warp.corners.0" update over the
  // socket and the server applied it, not just a local-only DOM change.
  await expect.poll(async () => (await readCorners())[0]).not.toEqual({ x: 0, y: 0 });
});
