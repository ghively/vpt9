# VPT8 Parity Finish Line Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every remaining gap between `control-panel/` and VPT8 named in `docs/ROADMAP.md`: per-layer warp/corner-pin, the source-bank architecture plus all 24 blend modes and the mix-source crossfade type, and clip transport + playlist sequencing — plus closing sub-project 1's still-open live-verification gap.

**Architecture:** Follows `docs/superpowers/specs/2026-07-08-parity-finish-line-design.md` exactly, in the same build order (verification closeout → per-layer warp → source bank/blend/mix → clip transport/playlist). Every task extends the existing server-authoritative-state + WebSocket-broadcast architecture; no new architectural pattern is introduced except the two one-way telemetry relay message types (`transportStatus`, `clipEnded`) that mirror the existing `preview` relay.

**Tech Stack:** Node.js (`server/`, plain JS ESM, `node:test`), vanilla JS + WebGL2 (`render-client/`), React 18 + TypeScript + Vite (`panel/`), Playwright (new — for e2e pixel checks, not previously present anywhere in this repo).

## Global Constraints

- Every new server-side state field must be backfilled in `server/src/state.js`'s `ensureLayerDefaults`/`ensureStateDefaults` so older saved shows upgrade cleanly — never assume a fresh field exists on load.
- Every `send({ type: "update"|"create"|"delete", path, value })` action in `panel/src/app/actions.ts` follows the exact existing pattern (see `updateLayer`/`setWarpMode` at `actions.ts:59-61,75-77`) — no new transport mechanism.
- `server/src/state.js`, `render-client/src/patch.js`, and `panel/src/app/store.ts` are three independently-maintained copies of the same dotted-path patch primitives, cross-checked only for `applyUpdate`/`applyDelete` by `server/test/state-patch-parity.test.js` (`applyCreate` is deliberately excluded — different signatures, see that test's header comment). Any change to `applyUpdate`'s validation logic in one copy must be evaluated for the other two; per the design spec, the sourceBank mix-cycle guard is server-only by design (server is the sole enforcement point for client-originated writes) — this is a deliberate, documented divergence, not an oversight.
- New WebGL shaders target `#version 300 es` (matching `layers.js`/`fx.js`/`warp.js`), not the legacy `sampler2DRect`/`varying`-style GLSL the original VPT8 `.jxs` shaders use — those are read as reference formulas only, never copied verbatim.
- Blend-mode formulas are ported from `vpt8 source code/shaders/v001 Mixers/*.fp.glsl` by extracting the core `result = ...` expression (mapping `myInput`→`top`, `previousmix`→`base`), dropping the outer `mix1`/`mix2`/`amount`-doubling wrapper (opacity/mask alpha is already handled once, outside the per-mode formula, by the existing blend pass) — this is the exact adaptation already used for the 6 shipped modes (verified against source: `multiply.fp.glsl`, `screen.fp.glsl`, `overlay.fp.glsl`, `difference.fp.glsl`, `additive.fp.glsl`, `alphablend.fp.glsl`).
- Every render-client Playwright check follows the project's established verification style: a live server + browser, pixel-level screenshot assertions — no snapshot/golden-image framework, no mocking of WebGL.
- **Line-number drift:** exact line numbers cited per task assume that file's state as of the last commit *before this plan started executing*. Once an earlier task in this plan has already modified a file, a later task's line citations for that same file are stale — locate the real anchor by content/symbol name (a named constant, function, or the nearest quoted code snippet), not the stale number.

---

## File Structure

**New files:**
- `control-panel/e2e/package.json`, `control-panel/e2e/playwright.config.js` — new Playwright harness package (none exists yet anywhere in the repo).
- `control-panel/e2e/media-compositing.spec.js` — Task 1.
- `control-panel/e2e/layer-warp.spec.js` — Task 6.
- `control-panel/e2e/blend-and-mix.spec.js` — Task 11.
- `control-panel/e2e/transport-and-playlist.spec.js` — Task 16.
- `control-panel/render-client/src/source-bank.js` — new shared/mix source resolver (Task 9).
- `control-panel/panel/src/components/SourceBankPanel.tsx` + `.stories.tsx` — Task 10.

**Modified files (grouped by task, exact line anchors given per task below):**
- `control-panel/server/src/state.js` — layer `warp` default (Task 2), `sourceBank` state + cycle guard (Task 7), layer `transport`/`sourceMode` defaults (Task 12).
- `control-panel/server/src/media.js` — dangling-reference cleanup on the real HTTP media-delete path (Task 7 — corrected from an earlier draft that wrongly targeted `index.js`'s dead WS delete path).
- `control-panel/server/src/index.js` — `transportStatus`/`clipEnded` WS cases (Task 13).
- `control-panel/server/src/automation.js` — still-image playlist advance + video clipEnded advance (Task 13).
- `control-panel/render-client/src/warp.js` — parameterized render target (Task 3).
- `control-panel/render-client/src/layers.js` — mask-before-warp reorder, per-layer warp application, 24 blend modes, slot source resolution, transport playback control (Tasks 4, 8, 9, 14).
- `control-panel/render-client/src/fx.js` — mask-bake stage (Task 4).
- `control-panel/render-client/src/compositor.js` — `setLayers` gains `sourceBank`/`media` params, resolves each layer's effective/playlist-aware source (Task 14).
- `control-panel/render-client/src/main.js` — audio-owner-gated `transportStatus`/`clipEnded` relay, `setLayers` call site (Task 14).
- `control-panel/panel/src/components/types.ts` — `Warp` on `Layer`, `sourceBank`/slot `SourceRef`, 24 `BLEND_MODES`, `Transport`/`sourceMode` (Tasks 5, 10, 15).
- `control-panel/panel/src/app/actions.ts` — layer-warp actions, source-bank actions, transport/playlist actions (Tasks 5, 10, 15).
- `control-panel/panel/src/app/App.tsx` — generalized on-canvas edit target, SourceBankPanel render site (Tasks 5, 10).
- `control-panel/panel/src/components/FxDrawer.tsx` — "Warp" section, "Transport" section (Tasks 5, 15).
- `control-panel/panel/src/components/LayerStrip.tsx` — "Shared Slot" source option (Task 10).
- `docs/ROADMAP.md` — status update marking sub-projects 2–4 CLOSED (final task).

---

## Execution: Parallel Lanes (worktree assignment)

This plan is written to be executed with subagent-driven-development, one git worktree per **lane**, run concurrently. Tasks within a lane are a strict serial chain (each depends on the previous one's edits to the same files); lanes themselves touch disjoint files and have no edit conflicts with each other, so they run fully in parallel. This is a real dependency graph, not just numbering order — verified by an adversarial re-review of this plan that traced every shared-file and shared-symbol dependency.

- **Lane A — server state** (worktree `lane-server-state`): Task 2 → Task 7 → Task 12 → Task 13, in that order (each depends on `state.js`/`media.js`/`automation.js`/`index.js` edits from the one before it in this lane).
- **Lane B — render pipeline** (worktree `lane-render`): Task 3 → Task 4 → Task 8 → Task 9 → Task 14, in that order (this is the plan's critical path — Task 4 needs Task 3's `warp.js` generalization, Task 9 needs both Task 7's `sourceBank` shape and Task 8's blend modes, Task 14 needs Task 9's `SourceBank`/`LayerStack` plumbing and Task 12's `transport`/`playlist` shape from Lane A).
- **Lane C — panel UI** (worktree `lane-panel`): Task 5 → Task 10 → Task 15, in that order (all three edit `types.ts`/`actions.ts`/`App.tsx`; Task 5 also shares `FxDrawer.tsx`/`LayerStrip.tsx`/`ChannelRack.tsx` with 15/10 respectively). Lane C has no file conflicts with Lanes A or B and can run fully concurrently with them — it only needs Lane A's/B's state *shape* to exist by the time it's manually integration-tested, not their code, since panel code only ever reads/writes dotted state paths by convention, never imports server or render-client modules.
- **Immediately, no dependencies, any worktree (or the main worktree directly):** Task 1 (new `e2e/` package — touches no file any other task touches).
- **Gated on their lane finishing (each is its own short-lived worktree, spun up once its inputs land):** Task 6 (needs Lane B through Task 4), Task 11 (needs Lane B through Task 9, and Task 8), Task 16 (needs Lane A through Task 13 and Lane B through Task 14).
- **Last, after all lanes merge:** Task 17 (`docs/ROADMAP.md`/`README.md` update — trivial, no code dependency, but logically a summary of everything above).

Merge order into the integration branch: Lane A, Lane B, Lane C can merge in any order relative to each other (no file overlap). Merge each lane's commits as a fast-forward or a single merge commit per lane, then run the full test suite (`server`: `node --test test/*.test.js`; `panel`: `npm run build`; `render-client`: `node --check src/*.js` for every touched file) before starting the gated e2e tasks.

---

## Task 1: Close sub-project 1's verification gap — Playwright media pixel check

No Playwright harness exists anywhere in this repo yet (`control-panel/render-client` has no `package.json` at all). This task scaffolds one and delivers the exact check `docs/superpowers/specs/2026-07-06-panel-ux-and-media-library-design.md`'s Testing section originally specified but never built.

**Files:**
- Create: `control-panel/e2e/package.json`
- Create: `control-panel/e2e/playwright.config.js`
- Create: `control-panel/e2e/media-compositing.spec.js`

**Interfaces:**
- Consumes: `server/src/index.js` (started as a child process on a test port), `render-client/index.html` served statically, the WS `create`/`update` message shapes already documented in `control-panel/README.md`.
- Produces: a `runServer()`/`stopServer()` pattern in the spec file every later e2e task (6, 11, 16) reuses verbatim.

- [ ] **Step 1: Scaffold the e2e package**

`control-panel/e2e/package.json`:
```json
{
  "name": "vpt-e2e",
  "version": "0.1.0",
  "private": true,
  "license": "MIT",
  "type": "module",
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0"
  }
}
```

`control-panel/e2e/playwright.config.js`:
```js
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  workers: 1, // each test boots its own server on a fixed port; keep serial
  reporter: [["list"]],
  use: {
    headless: true,
  },
});
```

Run: `cd control-panel/e2e && npm install`
Expected: installs `@playwright/test`; run `npx playwright install chromium` once afterward to fetch the browser binary.

- [ ] **Step 2: Write the failing test**

`control-panel/e2e/media-compositing.spec.js`:
```js
import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8180;
const RENDER_PORT = 8181;

let serverProc;
let staticServer;

async function startServer() {
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), MEDIA_DIR: path.join(REPO_ROOT, "server", "media"), OSC_PORT: "0" },
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
    handler(req, res, { public: path.join(REPO_ROOT, "render-client") }),
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
    value: { id: "layer-jpg", name: "jpg test", order: 10, source: { type: "video", url: "/media/fixture-red.jpg" }, opacity: 1, blendMode: "normal", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null },
  });
  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: { id: "layer-gif", name: "gif test", order: 20, source: { type: "video", url: "/media/fixture-blink.gif" }, opacity: 0, blendMode: "normal", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null },
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
```

- [ ] **Step 3: Add the tiny fixture files and a static-serve dependency**

Run:
```sh
cd control-panel/e2e && npm install serve-handler ws
```

Generate two tiny fixtures (a 4x4 solid-red JPEG and a 2-frame black/white blinking GIF) once, committed to the repo rather than generated at test time (deterministic, no image-library dependency in the test itself):

Run (one-off, using any available image tool — e.g. ImageMagick if present, otherwise Node's `canvas`-free approach via a tiny inline PNG-to-JPEG isn't available without a dependency, so use `ffmpeg`, already a reasonable assumption for a video-projection project's dev machine):
```sh
mkdir -p control-panel/server/media
ffmpeg -f lavfi -i color=c=red:s=64x64:d=1 -frames:v 1 control-panel/server/media/fixture-red.jpg -y
ffmpeg -f lavfi -i "color=c=black:s=64x64:d=0.2,format=gray" -f lavfi -i "color=c=white:s=64x64:d=0.2,format=gray" \
  -filter_complex "[0][1]concat=n=2:v=1:a=0" -loop 0 control-panel/server/media/fixture-blink.gif -y
```
If `ffmpeg` is unavailable in the execution environment, this step is a **blocking prerequisite** — flag it to the user rather than fabricating a fixture generation path with an untested tool.

- [ ] **Step 4: Run the test and verify it passes**

Run: `cd control-panel/e2e && npx playwright test`
Expected: `1 passed`. If it fails on the red-pixel assertion, check `fixture-red.jpg` actually decodes red at its center (some `ffmpeg` builds default to a slightly different red than pure `(255,0,0)` — the assertion already tolerates this with `>180`/`<80` thresholds rather than exact equality).

- [ ] **Step 5: Commit**

```bash
git add control-panel/e2e/
git commit -m "Add Playwright e2e harness; verify jpg/gif media compositing live"
```

---

## Task 2: Server — per-layer warp state

**Files:**
- Modify: `control-panel/server/src/state.js:12-129,145-146`
- Test: `control-panel/server/test/state.test.js`

**Interfaces:**
- Produces: `defaultWarp()` (exported), used by later tasks needing a fresh identity warp object; `layer.warp` shape `{ mode: "corner"|"mesh", corners: Point[4], mesh: { size, points } }`, identical to `screen.warp`.

- [ ] **Step 1: Write the failing tests**

Add to `control-panel/server/test/state.test.js` (append near the existing `ensureLayerDefaults` test at line 101):
```js
test("defaultWarp returns an identity corner-pin warp", () => {
  const warp = defaultWarp();
  assert.equal(warp.mode, "corner");
  assert.deepEqual(warp.corners, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]);
  assert.equal(warp.mesh.size, 4);
  assert.equal(warp.mesh.points.length, 16);
});

test("ensureLayerDefaults backfills warp on a layer missing it entirely", () => {
  const layer = { id: "layer-1", order: 1, opacity: 0.5, fx: defaultFx() };
  ensureLayerDefaults(layer);
  assert.ok(layer.warp);
  assert.equal(layer.warp.mode, "corner");
});

test("ensureLayerDefaults does not clobber an existing warp", () => {
  const layer = { id: "layer-1", order: 1, fx: defaultFx(), warp: { mode: "mesh", corners: [], mesh: { size: 3, points: [] } } };
  ensureLayerDefaults(layer);
  assert.equal(layer.warp.mode, "mesh");
  assert.equal(layer.warp.mesh.size, 3);
});
```
Add `defaultWarp` to the file's existing import line at the top of `state.test.js` (alongside whatever `defaultFx`/`ensureLayerDefaults` import already exists there).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd control-panel/server && node --test test/state.test.js`
Expected: FAIL — `defaultWarp is not defined` / `TypeError`.

- [ ] **Step 3: Implement**

In `control-panel/server/src/state.js`, add after `defaultFx()` (after line 48):
```js
export function defaultWarp() {
  return {
    mode: "corner",
    corners: structuredClone(IDENTITY_CORNERS),
    mesh: { size: 4, points: identityMeshPoints(4) },
  };
}
```

Add `warp: defaultWarp()` to both `DEFAULT_STATE.layers` entries (lines 52-67):
```js
    "layer-1": {
      id: "layer-1",
      name: "Ambient loop",
      order: 1,
      source: { type: "video", url: "/media/sample.mp4" },
      opacity: 0.82,
      blendMode: "screen",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
      fx: defaultFx(),
      warp: defaultWarp(),
    },
```
(and the analogous line in `"layer-2"`.)

Update `ensureLayerDefaults` (line 145) to also backfill `warp`:
```js
export function ensureLayerDefaults(layer) {
  fillMissing(layer, { fx: defaultFx(), warp: defaultWarp() });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd control-panel/server && node --test test/state.test.js`
Expected: PASS, all tests including the 3 new ones.

- [ ] **Step 5: Commit**

```bash
git add control-panel/server/src/state.js control-panel/server/test/state.test.js
git commit -m "Add per-layer warp state (identity default, backfilled for existing layers)"
```

---

## Task 3: Render-client — generalize `ScreenWarp` to a parameterized render target

**Files:**
- Modify: `control-panel/render-client/src/warp.js` (entire file's `render()` method and vertex shader)
- Test: manual verification via Task 6's Playwright check (this module has no existing unit-test coverage — render-client has none anywhere in the repo; correctness here is verified visually, matching the project's established pattern of e2e-only coverage for GL code)

**Interfaces:**
- Consumes: nothing new.
- Produces: `ScreenWarp.render(sceneTexture, warp, viewportWidth, viewportHeight, master, target?)` — `target` is a new optional 6th param: `null`/omitted keeps today's exact behavior (draw to the default framebuffer, Y-flipped for on-screen display); `{ framebuffer, width, height }` (an object shaped like `createFramebuffer`'s return value) draws into that FBO instead, without the extra display-orientation flip, for reuse as a per-layer mid-pipeline stage in Task 4.

- [ ] **Step 1: Change the vertex shader to take an explicit flip uniform**

In `control-panel/render-client/src/warp.js`, replace `WARP_VERT` (lines 7-14):
```js
const WARP_VERT = `#version 300 es
in vec2 a_uv;
in vec2 a_dest; // destination position in 0..1 screen space, (0,0) = top-left
uniform bool u_flipDest; // true when writing to the default framebuffer (GL's bottom-left
                         // origin needs the destination Y flipped); false when writing to
                         // an intermediate FBO (already top-left-origin, no flip needed).
out vec2 v_sceneUv;
void main() {
  float destY = u_flipDest ? (1.0 - a_dest.y * 2.0) : (a_dest.y * 2.0 - 1.0);
  gl_Position = vec4(a_dest.x * 2.0 - 1.0, destY, 0.0, 1.0);
  v_sceneUv = vec2(a_uv.x, u_flipDest ? 1.0 - a_uv.y : a_uv.y);
}`;
```

- [ ] **Step 2: Add the uniform location and thread a `target` param through `render()`**

In the constructor (after the existing uniform lookups, around line 63), add:
```js
    this.u_flipDest = gl.getUniformLocation(this.program, "u_flipDest");
```

Replace `render()`'s signature and its framebuffer-bind/clear/uniform lines (the method spans the current lines ~86-129):
```js
  // warp: { mode: "corner"|"mesh", corners: [{x,y}x4] TL,TR,BR,BL, mesh: { size, points } }
  // target: null (default framebuffer, on-screen orientation) | { framebuffer, width, height }
  //   (an offscreen FBO, source-orientation, no display flip) — used by the per-layer warp
  //   stage (render-client/src/layers.js) so the same geometry math serves both roles.
  render(sceneTexture, warp, viewportWidth, viewportHeight, master = 1, target = null) {
    const gl = this.gl;
    let size, points;
    if (warp?.mode === "mesh" && warp.mesh?.points?.length) {
      size = warp.mesh.size;
      points = warp.mesh.points;
    } else {
      const c = warp?.corners ?? IDENTITY_CORNERS;
      size = 2;
      points = [c[0], c[1], c[3], c[2]];
    }
    this._ensureGrid(size);

    const dest = new Float32Array(size * size * 2);
    for (let i = 0; i < size * size; i++) {
      dest[i * 2] = points[i]?.x ?? 0;
      dest[i * 2 + 1] = points[i]?.y ?? 0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.destBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, dest, gl.DYNAMIC_DRAW);

    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clearColor(0, 0, 0, target ? 0 : 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniform1i(this.u_flipDest, target ? 0 : 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.enableVertexAttribArray(this.a_uv);
    gl.vertexAttribPointer(this.a_uv, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.destBuffer);
    gl.enableVertexAttribArray(this.a_dest);
    gl.vertexAttribPointer(this.a_dest, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
    gl.uniform1i(this.u_scene, 0);
    gl.uniform1f(this.u_master, Math.min(1, Math.max(0, master)));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }
```
`compositor.js:74`'s existing call site (`this.screenWarp.render(scene, this.warp, this.canvas.width, this.canvas.height, this.master);`) needs no change — the new 6th param defaults to `null`, preserving exact current behavior for the screen-level pass.

- [ ] **Step 3: Verify no regression**

Run: `cd control-panel/render-client && node --check src/warp.js`
Expected: no syntax errors. There's no unit test for this file (confirmed — none exists anywhere for `render-client/src/*.js` GL code); the real verification is visual, deferred to Task 6's Playwright check, which will fail loudly if this generalization broke screen-level warp's on-screen orientation.

- [ ] **Step 4: Commit**

```bash
git add control-panel/render-client/src/warp.js
git commit -m "Parameterize ScreenWarp's render target so it can target an offscreen FBO"
```

---

## Task 4: Render-client — mask-before-warp reorder + per-layer warp application

This is the task the design review flagged as required rework, not an additive change: masking must move earlier in the per-layer pipeline so it deforms along with per-layer warp, matching VPT8's `vlayer` order (mask, then mesh).

**Files:**
- Modify: `control-panel/render-client/src/fx.js:150-260` (add a mask-bake stage to `FxChain`)
- Modify: `control-panel/render-client/src/layers.js` (remove `maskAlpha()`/mask uniforms from the blend pass; call the new per-layer warp stage)

**Interfaces:**
- Consumes: `ScreenWarp` (renamed conceptually to a reusable warp-geometry renderer — Task 3's generalized `render(sceneTexture, warp, w, h, master, target)`).
- Produces: `FxChain.process(srcTexture, fx, opts)` gains mask+warp as its final two stages, still returning one `WebGLTexture`; `layer.mask`/`layer.warp` are now consumed inside `entry.fxChain.process(...)`, not in `layers.js`'s blend pass.

- [ ] **Step 1: Add a mask-bake fragment pass to `fx.js`**

In `control-panel/render-client/src/fx.js`, add a new shader pair after the existing point-pass shader source (near the top of the file, following the same `#version 300 es` style as `POINT_FRAG`):
```glsl
const MASK_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform bool u_maskEnabled;
uniform int u_maskShape; // 0 = rect, 1 = ellipse
uniform vec2 u_maskCenter;
uniform vec2 u_maskRadius;
uniform float u_maskFeather;
out vec4 outColor;
void main() {
  vec4 c = texture(u_src, v_uv);
  if (!u_maskEnabled) { outColor = c; return; }
  vec2 d = (v_uv - u_maskCenter) / max(u_maskRadius, vec2(0.0001));
  float dist = (u_maskShape == 1) ? length(d) : max(abs(d.x), abs(d.y));
  float a = 1.0 - smoothstep(1.0 - u_maskFeather, 1.0, dist);
  outColor = vec4(c.rgb, c.a * a);
}`;
```
This is `layers.js`'s existing `maskAlpha()` formula (lines 48-53 of `BLEND_FRAG`), moved verbatim into its own bake pass — same math, new location.

Add this program to `FxPasses`'s constructor (wherever `this.point`/`this.blur`/`this.feedback` programs are built — follow that exact pattern) and add a `_runMask(srcTexture, mask)` method to `FxChain` alongside `_runPoint`/`_runBlur`:
```js
  _runMask(srcTexture, mask) {
    const gl = this.gl;
    const u = this.passes.u.mask;
    gl.useProgram(this.passes.mask);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    gl.uniform1i(u.u_src, 0);
    gl.uniform1i(u.u_maskEnabled, mask?.enabled ? 1 : 0);
    gl.uniform1i(u.u_maskShape, mask?.shape === "rect" ? 0 : 1);
    gl.uniform2f(u.u_maskCenter, mask?.cx ?? 0.5, mask?.cy ?? 0.5);
    gl.uniform2f(u.u_maskRadius, mask?.rx ?? 0.5, mask?.ry ?? 0.5);
    gl.uniform1f(u.u_maskFeather, mask?.feather ?? 0.05);
    if (!this.maskFbo) this.maskFbo = createFramebuffer(gl, this.width, this.height);
    this._draw(this.passes.mask, this.maskFbo);
    return this.maskFbo.texture;
  }
```
Add `this.maskFbo = null;` to `FxChain`'s constructor alongside `this.blurFbo`/`this.feedbackFbo`, and dispose it in `dispose()` alongside the others.

- [ ] **Step 2: Add a per-layer warp stage to `FxChain`, reusing `ScreenWarp`'s generalized renderer**

Import `ScreenWarp` into `fx.js`: `import { ScreenWarp } from "./warp.js";`

Add to `FxChain`'s constructor: `this.warpRenderer = new ScreenWarp(gl); this.warpFbo = null;`

Add a `_runWarp(srcTexture, warp)` method:
```js
  _runWarp(srcTexture, warp) {
    if (!this.warpFbo) this.warpFbo = createFramebuffer(this.gl, this.width, this.height);
    // master=1: per-layer warp never dims — that's screen-level warp's job (the house
    // master fader), applying it twice here would double-darken a warped layer.
    this.warpRenderer.render(srcTexture, warp, this.width, this.height, 1, this.warpFbo);
    return this.warpFbo.texture;
  }
```

- [ ] **Step 3: Wire mask + warp into `process()`, after motion-blur, gated correctly**

Replace `FxChain.process()` (fx.js:241-248):
```js
  process(srcTexture, fx, { isColor = false, color = [0, 0, 0], mask = null, warp = null } = {}) {
    let tex = this._runPoint(srcTexture, fx ?? {}, isColor, color);
    if ((fx?.blur ?? 0) > 0) tex = this._runBlur(tex, fx.blur);
    if ((fx?.motionBlur ?? 0) > 0) tex = this._runFeedback(tex, fx.motionBlur);
    if (mask?.enabled) tex = this._runMask(tex, mask);
    if (warp && (warp.mode === "mesh" || warp.corners)) tex = this._runWarp(tex, warp);
    return tex;
  }
```

- [ ] **Step 4: Update `fxNeedsChain` so a mask-only or warp-only layer still enters the chain**

In `control-panel/render-client/src/fx.js`, `fxNeedsChain(fx)` (lines 112-123) currently only looks at `fx` fields. Since mask/warp now live outside `fx` (on `layer.mask`/`layer.warp`), the gate needs those too. Change its call site in `layers.js` instead of the function's own signature (keeps `fxNeedsChain` focused on what it's named for):

In `control-panel/render-client/src/layers.js`'s `render()` method, replace the gate check:
```js
      const needsMaskOrWarp = layer.mask?.enabled || layer.warp?.mode === "mesh" || (layer.warp?.corners && !isIdentityCorners(layer.warp.corners));
      if (fxNeedsChain(layer.fx) || needsMaskOrWarp) {
        if (!entry.fxChain) entry.fxChain = new FxChain(gl, this.fxPasses, this.width, this.height);
        layerTexture = entry.fxChain.process(entry.texture, layer.fx, {
          isColor,
          color: isColor ? layer.source.color : [0, 0, 0],
          mask: layer.mask,
          warp: layer.warp,
        });
        blendAsColor = false;
      }
```
Add a small helper near the top of `layers.js`:
```js
function isIdentityCorners(corners) {
  const id = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
  return corners.length === 4 && corners.every((c, i) => c.x === id[i].x && c.y === id[i].y);
}
```

- [ ] **Step 5: Remove masking from the blend pass**

In `BLEND_FRAG` (`layers.js:30-70`), delete the `maskAlpha()` function and its 5 `u_mask*` uniforms, and change the alpha line from:
```glsl
  float a = clamp(u_opacity, 0.0, 1.0) * layer.a * maskAlpha();
```
to:
```glsl
  float a = clamp(u_opacity, 0.0, 1.0) * layer.a;
```
Remove the corresponding 5 uniform lookups from `LayerStack`'s constructor `uniforms` map and the 5 `gl.uniform*(u.mask*, ...)` calls in `render()` (the `const mask = layer.mask || {};` block).

- [ ] **Step 6: Verify no syntax errors**

Run: `cd control-panel/render-client && node --check src/fx.js && node --check src/layers.js`
Expected: clean. As with Task 3, real correctness verification is visual — deferred to Task 6.

- [ ] **Step 7: Commit**

```bash
git add control-panel/render-client/src/fx.js control-panel/render-client/src/layers.js
git commit -m "Move mask into the per-layer FX chain, add per-layer warp stage after it"
```

---

## Task 5: Panel — per-layer warp UI

**Files:**
- Modify: `control-panel/panel/src/components/types.ts:60-70` (add `warp: Warp` to `Layer`)
- Modify: `control-panel/panel/src/app/actions.ts` (new layer-warp actions, mirroring the screen-warp ones)
- Modify: `control-panel/panel/src/app/App.tsx` (generalize `maskEditLayerId` → a small on-canvas-edit-target union)
- Modify: `control-panel/panel/src/components/FxDrawer.tsx` (new "Warp" section)
- Modify: `control-panel/panel/src/components/WarpEditor.tsx` (accept a layer-warp target alongside the existing screen target)

**Interfaces:**
- Consumes: `Warp` type (already defined, `types.ts:77-81`), `WarpHandle`/`MaskShapeOverlay` (unchanged), `ConfidenceMonitorHandle` (unchanged).
- Produces: `actions.setLayerWarpMode(id, mode)`, `actions.resetLayerWarp(id)`, `actions.moveLayerWarpPoint(id, index, x, y)`, `actions.setLayerMeshSize(id, size)`, `actions.applyCornerPreset(id, presetName)` — layer-scoped mirrors of the four existing screen-warp actions plus one new preset helper.

- [ ] **Step 1: Add `warp` to the `Layer` type**

In `control-panel/panel/src/components/types.ts`, add to `Layer` (after `fx: Fx;`, line 70):
```ts
  warp: Warp;
```
(`Warp` is already defined above it at lines 77-81 — no new type needed, just reordering isn't required since TS doesn't care about declaration order within a module for interface references.)

- [ ] **Step 2: Add layer-warp actions, mirroring the screen ones exactly**

In `control-panel/panel/src/app/actions.ts`, add after `moveWarpPoint` (after line 93):
```ts
    setLayerWarpMode(id: string, mode: "corner" | "mesh") {
      send({ type: "update", path: `layers.${id}.warp.mode`, value: mode });
    },
    resetLayerWarp(id: string) {
      const warp = getState().layers[id]?.warp;
      if (warp?.mode === "mesh") {
        send({ type: "update", path: `layers.${id}.warp.mesh.points`, value: identityMeshPoints(warp.mesh.size) });
      } else {
        send({ type: "update", path: `layers.${id}.warp.corners`, value: IDENTITY_CORNERS.map((p) => ({ ...p })) });
      }
    },
    moveLayerWarpPoint(id: string, index: number, x: number, y: number) {
      const warp = getState().layers[id]?.warp;
      const base = warp?.mode === "mesh" ? `layers.${id}.warp.mesh.points` : `layers.${id}.warp.corners`;
      send({ type: "update", path: `${base}.${index}`, value: { x, y } });
    },
    setLayerMeshSize(id: string, size: number) {
      send({ type: "update", path: `layers.${id}.warp.mesh`, value: { size, points: identityMeshPoints(size) } });
    },
    // VPT8's activelayer.maxpat "p cornerpin_templates" preset menu (full/center/thirds/
    // rotations), applied to layers.<id>.warp.corners as one atomic write.
    applyLayerCornerPreset(id: string, preset: "full" | "center" | "leftThird" | "rightThird" | "rotate90" | "rotate180" | "rotate270") {
      const presets: Record<string, Point[]> = {
        full: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
        center: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, { x: 0.75, y: 0.75 }, { x: 0.25, y: 0.75 }],
        leftThird: [{ x: 0, y: 0 }, { x: 0.333, y: 0 }, { x: 0.333, y: 1 }, { x: 0, y: 1 }],
        rightThird: [{ x: 0.667, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0.667, y: 1 }],
        rotate90: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }],
        rotate180: [{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }],
        rotate270: [{ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
      };
      send({ type: "update", path: `layers.${id}.warp.corners`, value: presets[preset] });
    },
```

- [ ] **Step 3: Generalize the on-canvas edit target in `App.tsx`**

Replace the single `maskEditLayerId` state (`App.tsx:84`) with a small discriminated union:
```ts
type CanvasEditTarget = { kind: "mask"; layerId: string } | { kind: "warp"; layerId: string } | null;
const [canvasEditTarget, setCanvasEditTarget] = useState<CanvasEditTarget>(null);
```
Replace `editMask` (`App.tsx:198-204`) and add its warp sibling:
```ts
  const editMask = useCallback(
    (id: string) => {
      setCanvasEditTarget({ kind: "mask", layerId: id });
      if (isMobile) setActiveMobileTab("screen");
    },
    [isMobile],
  );
  const editLayerWarp = useCallback(
    (id: string) => {
      setCanvasEditTarget({ kind: "warp", layerId: id });
      if (isMobile) setActiveMobileTab("screen");
    },
    [isMobile],
  );
```
Update the `WarpEditor` JSX (`App.tsx:325-342`) to derive both target layers from the one state value and pass the new warp-target props (added to `WarpEditorProps` in Step 5 below):
```tsx
  const maskEditLayerId = canvasEditTarget?.kind === "mask" ? canvasEditTarget.layerId : null;
  const warpEditLayerId = canvasEditTarget?.kind === "warp" ? canvasEditTarget.layerId : null;
  // ...
  <WarpEditor
    ref={preview.warpMonitor}
    screen={screen}
    screens={screens}
    previewFrame={preview.frameFor(selectedScreenId)}
    onSelectScreen={setSelectedScreenId}
    onAddScreen={actions.addScreen}
    onRenameScreen={(name) => actions.renameScreen(sid, name)}
    onSetMode={(mode) => actions.setWarpMode(sid, mode)}
    onSetMeshSize={(size) => actions.setMeshSize(sid, size)}
    onReset={() => actions.resetWarp(sid)}
    onDragStart={beginDrag}
    onMovePoint={(index, x, y) => actions.moveWarpPoint(sid, index, x, y)}
    onDragEnd={endDrag}
    maskEditLayer={maskEditLayerId ? state.layers[maskEditLayerId] ?? null : null}
    onMaskChange={(field, value) => { if (maskEditLayerId) actions.updateLayer(maskEditLayerId, field, value); }}
    onMaskEditDone={() => setCanvasEditTarget(null)}
    warpEditLayer={warpEditLayerId ? state.layers[warpEditLayerId] ?? null : null}
    onLayerSetMode={(mode) => { if (warpEditLayerId) actions.setLayerWarpMode(warpEditLayerId, mode); }}
    onLayerSetMeshSize={(size) => { if (warpEditLayerId) actions.setLayerMeshSize(warpEditLayerId, size); }}
    onLayerResetWarp={() => { if (warpEditLayerId) actions.resetLayerWarp(warpEditLayerId); }}
    onLayerMovePoint={(index, x, y) => { if (warpEditLayerId) actions.moveLayerWarpPoint(warpEditLayerId, index, x, y); }}
    onWarpEditDone={() => setCanvasEditTarget(null)}
  />
```
Rename the `ChannelRack`'s `onEditMaskLayer={editMask}` (line 237) call site — add a sibling prop `onEditWarpLayer={editLayerWarp}` and thread it through `ChannelRackProps`/`ChannelRack.tsx`'s per-`LayerStrip` binding exactly like `onEditMaskLayer` already is (`ChannelRack.tsx:18,56`: add `onEditWarpLayer?: (id: string) => void;` to the props interface, and `onEditWarp={() => onEditWarpLayer?.(layer.id)}` to the `LayerStrip` JSX).

- [ ] **Step 4: Add the "Warp" section to `FxDrawer`**

In `control-panel/panel/src/components/FxDrawer.tsx`, add `import { Select } from "./primitives/Select";` to the file's existing import block (it currently imports only `Fader`/`ToggleSquare`/`Button` — `Select` is not yet imported here, unlike `WarpEditor.tsx`, which already uses it). Add `onEditWarp?: () => void;` to `FxDrawerProps` (alongside `onEditMask?: () => void;`, line 16), and a preset-select + section between the existing "Edge blend" and "Mask" sections (after line 143). `Select`'s real props (`Select.tsx`, same component `WarpEditor.tsx` already uses for mesh-size) don't include a `placeholder` prop — use an explicit first option instead, the same convention `MESH_SIZES`-style selects in this codebase already follow:
```tsx
      <FxSection caption="Warp">
        <Select
          className="corner-preset-select"
          value=""
          options={[
            { value: "", label: "Preset…" },
            { value: "full", label: "Full" },
            { value: "center", label: "Center" },
            { value: "leftThird", label: "Left third" },
            { value: "rightThird", label: "Right third" },
            { value: "rotate90", label: "Rotate 90°" },
            { value: "rotate180", label: "Rotate 180°" },
            { value: "rotate270", label: "Rotate 270°" },
          ]}
          onChange={(v) => { if (v) onUpdate?.("__cornerPreset__", v); }}
        />
        {onEditWarp && <Button label="Edit on canvas" onClick={onEditWarp} />}
      </FxSection>
```
The `"__cornerPreset__"` sentinel field name is read by `LayerStrip`'s `onUpdate` wrapper (Step 5) and dispatched to `actions.applyLayerCornerPreset` instead of a generic `layers.<id>.<field>` write, since applying a preset needs the action's own preset-name-to-corners table, not a raw field patch.

- [ ] **Step 5: Wire the preset sentinel and `onEditWarp` through `LayerStrip`**

In `control-panel/panel/src/components/LayerStrip.tsx`, where `<FxDrawer fx={layer.fx} mask={layer.mask} onUpdate={onUpdate} onEditMask={onEditMask} />` is rendered, change to intercept the preset sentinel:
```tsx
{fxOpen && layer.fx && (
  <FxDrawer
    fx={layer.fx}
    mask={layer.mask}
    onUpdate={(field, value) => {
      if (field === "__cornerPreset__") onApplyCornerPreset?.(value as string);
      else onUpdate?.(field, value);
    }}
    onEditMask={onEditMask}
    onEditWarp={onEditWarp}
  />
)}
```
Add `onApplyCornerPreset?: (preset: string) => void;` and `onEditWarp?: () => void;` to `LayerStripProps`, threaded from `ChannelRack` the same way `onEditMask` already is (add `onApplyCornerPreset={() => actions.applyLayerCornerPreset(layer.id, preset)}`-style binding at the `ChannelRack.tsx` call site, following the existing per-layer id-binding pattern at `ChannelRack.tsx:44-58`).

- [ ] **Step 6: Extend `WarpEditor` to render layer-warp handles when a `warpEditLayer` is set**

In `control-panel/panel/src/components/WarpEditor.tsx`, add the new props to `WarpEditorProps` (alongside the existing `maskEditLayer`/`onMaskChange`/`onMaskEditDone`):
```ts
  /** When set, the stage edits this layer's own corner-pin/mesh warp instead of the
   *  selected screen's. */
  warpEditLayer?: Layer | null;
  onLayerSetMode?: (mode: "corner" | "mesh") => void;
  onLayerSetMeshSize?: (size: number) => void;
  onLayerResetWarp?: () => void;
  onLayerMovePoint?: (index: number, x: number, y: number) => void;
  onWarpEditDone?: () => void;
```
Inside the component body, when `warpEditLayer` is set, source `warp`/`points`/`size` and the mode-toggle/reset/mesh-size handlers from it instead of `screen?.warp` — the existing `warp`/`isMesh`/`points`/`size` local derivations (lines 84-87) become:
```ts
    const activeWarp = warpEditLayer ? warpEditLayer.warp : screen?.warp;
    const isMesh = activeWarp?.mode === "mesh";
    const points: Point[] = isMesh ? activeWarp?.mesh.points ?? [] : activeWarp?.corners ?? [];
    const size = activeWarp?.mesh.size ?? 4;
```
And the mode-toggle/mesh-size-select/reset `Chip`s' `onClick`s become conditional on `warpEditLayer` being set (dispatch to `onLayerSetMode`/`onLayerSetMeshSize`/`onLayerResetWarp` instead of `onSetMode`/`onSetMeshSize`/`onReset`), and `onMovePoint?.(i, x, y)` becomes `(warpEditLayer ? onLayerMovePoint : onMovePoint)?.(i, x, y)`. Add a banner matching the existing `.mask-edit-banner` pattern (lines 105-110) for `warpEditLayer`, with its "Done" button calling `onWarpEditDone`.

- [ ] **Step 7: Verify the panel still typechecks**

Run: `cd control-panel/panel && npm run build`
Expected: `tsc --noEmit` passes with no new type errors.

- [ ] **Step 8: Commit**

```bash
git add control-panel/panel/src/components/types.ts control-panel/panel/src/app/actions.ts control-panel/panel/src/app/App.tsx control-panel/panel/src/components/FxDrawer.tsx control-panel/panel/src/components/WarpEditor.tsx control-panel/panel/src/components/ChannelRack.tsx control-panel/panel/src/components/LayerStrip.tsx
git commit -m "Add per-layer warp UI: on-canvas editor, corner presets, FX drawer section"
```

---

## Task 6: Playwright — verify per-layer warp moves independently of screen warp, with mask following it

**Files:**
- Create: `control-panel/e2e/layer-warp.spec.js`

- [ ] **Step 1: Write the test**

```js
import { test, expect } from "@playwright/test";
// Reuse the exact server/static-serve bootstrap from media-compositing.spec.js —
// extracted here inline for test independence (Playwright test files don't share
// module-level state across files by default); see that file for the fuller comments.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8182;
const RENDER_PORT = 8183;
let serverProc, staticServer;

async function startServer() {
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), MEDIA_DIR: path.join(REPO_ROOT, "server", "media"), OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (buf) => { if (buf.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); } };
    serverProc.stdout.on("data", onData);
    setTimeout(() => reject(new Error("server did not start")), 10_000);
  });
}
async function startStatic() {
  staticServer = http.createServer((req, res) => handler(req, res, { public: path.join(REPO_ROOT, "render-client") }));
  await new Promise((resolve) => staticServer.listen(RENDER_PORT, resolve));
}
function wsSend(socket, message) { return new Promise((resolve) => socket.send(JSON.stringify(message), resolve)); }

test.beforeAll(async () => { await startServer(); await startStatic(); });
test.afterAll(async () => { staticServer?.close(); serverProc?.kill(); });

test("a layer's own warp moves it independently of screen warp, mask follows the deformation", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));

  await wsSend(socket, {
    type: "create",
    path: "layers",
    value: {
      id: "layer-w", name: "warp test", order: 1,
      source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "normal",
      mask: { enabled: true, shape: "rect", cx: 0.5, cy: 0.5, rx: 0.5, ry: 0.5, feather: 0 },
      fx: null,
      warp: { mode: "corner", corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], mesh: { size: 4, points: [] } },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(500);
  const canvas = page.locator("canvas");

  const readCorner = () => canvas.evaluate((el) => {
    const gl = el.getContext("webgl2");
    const px = new Uint8Array(4);
    // Top-left 10% x 10% region: identity-warped full-frame red should be red here.
    gl.readPixels(Math.round(el.width * 0.05), Math.round(el.height * 0.95), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return Array.from(px);
  });
  const before = await readCorner();
  expect(before[0]).toBeGreaterThan(180); // identity warp: red fills the whole frame, corner included

  // Shrink the layer's own warp to the right half only (top-left corner moves to x=0.5).
  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.layer-w.warp.corners.0", value: { x: 0.5, y: 0 } });
  await wsSend(socket2, { type: "update", path: "layers.layer-w.warp.corners.3", value: { x: 0.5, y: 1 } });
  socket2.close();
  await page.waitForTimeout(500);

  const after = await readCorner();
  // The top-left corner should now be background (ground color), not red — both because
  // the layer's own warp moved its content away from that corner, AND because the mask
  // (rect, full-cover) must still be tracking the layer post-warp, not staying pinned to
  // pre-warp screen space (which would still show red there).
  expect(after[0]).toBeLessThan(60);
});
```

- [ ] **Step 2: Run and verify pass**

Run: `cd control-panel/e2e && npx playwright test layer-warp.spec.js`
Expected: `1 passed`. A failure on the `after` assertion most likely means Task 4's mask-before-warp reorder or Task 3's `u_flipDest` uniform has an orientation bug — re-check both against this test's failure screenshot (`npx playwright test --trace on` for a visual trace).

- [ ] **Step 3: Commit**

```bash
git add control-panel/e2e/layer-warp.spec.js
git commit -m "Add Playwright check for per-layer warp + mask-follows-warp"
```

---

## Task 7: Server — source-bank state + mix-cycle guard + dangling-reference cleanup

**Files:**
- Modify: `control-panel/server/src/state.js`
- Modify: `control-panel/server/src/media.js` (dangling-reference cleanup on the real HTTP media-delete path — see Step 6's correction; NOT `index.js`, which has no WS path for media deletion)
- Test: `control-panel/server/test/state.test.js`, new `control-panel/server/test/source-bank.test.js`

**Interfaces:**
- Produces: `state.sourceBank` (array of 8 `{ id, name, content }` slots), `wouldCreateMixCycle(state, path, value)` (exported, used by `applyUpdate`), `resolveDanglingSourceRefs(state, kind, id)` (exported, called from `media.js`'s `handleDelete`).

- [ ] **Step 1: Write the failing tests for the state shape**

Append to `control-panel/server/test/state.test.js`:
```js
test("DEFAULT_STATE has 8 empty source-bank slots", () => {
  const state = structuredClone(DEFAULT_STATE_FOR_TEST ?? loadState("/nonexistent/path/for/test.json"));
  assert.equal(state.sourceBank.length, 8);
  assert.equal(state.sourceBank[0].id, "slot-1");
  assert.equal(state.sourceBank[0].content, null);
});

test("ensureStateDefaults backfills sourceBank as 8 empty slots on an older state without it", () => {
  const state = { layers: {}, presets: {} };
  ensureStateDefaults(state);
  assert.equal(state.sourceBank.length, 8);
});
```
(`loadState` with a nonexistent path returns `structuredClone(DEFAULT_STATE)` per its existing fallback behavior — reuse that as the fixture rather than exporting `DEFAULT_STATE` itself, which isn't exported today and shouldn't become part of the public API just for a test.)

Create `control-panel/server/test/source-bank.test.js`:
```js
import test from "node:test";
import assert from "node:assert/strict";
import { applyUpdate, applyCreate } from "../src/state.js";

function fixtureState() {
  return {
    layers: {},
    media: { "media-1": { id: "media-1", kind: "video" }, "media-2": { id: "media-2", kind: "image" } },
    sourceBank: [
      { id: "slot-1", name: "Slot 1", content: { type: "media", mediaId: "media-1" } },
      { id: "slot-2", name: "Slot 2", content: null },
      { id: "slot-3", name: "Slot 3", content: { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "multiply", mix: 0.5 } },
    ],
  };
}

test("a mix slot may reference a media-holding slot", () => {
  const state = fixtureState();
  const ok = applyUpdate(
    state, "sourceBank.1.content",
    { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 },
  );
  assert.equal(ok, true);
});

test("a mix slot's a/b may NOT reference another mix-holding slot directly", () => {
  const state = fixtureState();
  const ok = applyUpdate(
    state, "sourceBank.1.content",
    { type: "mix", a: { type: "slot", slotId: "slot-3" }, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 },
  );
  assert.equal(ok, false);
  assert.equal(state.sourceBank[1].content, null); // rejected — state unchanged
});

test("a mix slot's a/b may NOT reference another mix-holding slot transitively through one level of slot indirection", () => {
  const state = fixtureState();
  // slot-2 is empty right now; point it at slot-1 (media) first — allowed.
  assert.equal(applyUpdate(state, "sourceBank.1.content", { type: "media", mediaId: "media-1" }), true);
  // Now try to make slot-2 itself a mix that references slot-3 (a mix) — rejected.
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "slot", slotId: "slot-3" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 }),
    false,
  );
});

test("a mix slot may not reference itself", () => {
  const state = fixtureState();
  assert.equal(
    applyUpdate(state, "sourceBank.2.content", { type: "mix", a: { type: "slot", slotId: "slot-3" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 }),
    false,
  );
});

test("a mix slot may not reference itself even when its own current content isn't a mix yet", () => {
  const state = fixtureState();
  // slot-2 starts empty (content: null in the fixture) — this specifically exercises the
  // self-reference check independent of the referenced slot's current content type,
  // which the "currently a mix" check alone would miss.
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "slot", slotId: "slot-2" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 }),
    false,
  );
});

test("cannot retroactively turn a slot into a mix once another slot's mix already depends on it", () => {
  const state = fixtureState();
  // slot-1 (media) is already referenced by slot-3's mix as `a`. Turning slot-1 itself
  // into a mix now would make slot-3 a mix-of-mix without slot-3's own write ever being
  // revalidated — the ordering hole.
  assert.equal(
    applyUpdate(state, "sourceBank.0.content", { type: "mix", a: { type: "media", mediaId: "media-2" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 }),
    false,
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd control-panel/server && node --test test/source-bank.test.js test/state.test.js`
Expected: FAIL — `state.sourceBank` is `undefined`.

- [ ] **Step 3: Implement the state shape**

In `control-panel/server/src/state.js`, add after the `screens` block in `DEFAULT_STATE` (after line ~86):
```js
  // Shared, optionally-hot-swappable source slots (VPT8's 8-slot sourcebank.maxpat).
  // Layers default to a direct `source` (unchanged); pointing a layer's source at
  // { type: "slot", slotId } instead makes it track whichever content this slot holds,
  // live. A slot's content is either a media-library reference or a "mix" — two other
  // sources (each a media/camera ref, or a slot reference — but never another mix-
  // holding slot, enforced below) crossfaded by a chosen blend mode.
  sourceBank: Array.from({ length: 8 }, (_, i) => ({ id: `slot-${i + 1}`, name: `Slot ${i + 1}`, content: null })),
```

Add to `ensureStateDefaults`'s `fillMissing` call (line ~150):
```js
export function ensureStateDefaults(state) {
  fillMissing(state, {
    automation: { cues: [], cursor: -1, running: false, timers: {} },
    lfos: {},
    midiMap: {},
    master: 1,
    media: {},
    sourceBank: Array.from({ length: 8 }, (_, i) => ({ id: `slot-${i + 1}`, name: `Slot ${i + 1}`, content: null })),
  });
  // ... rest unchanged
```

- [ ] **Step 4: Implement the mix-cycle guard**

Add before `applyUpdate` (before line 215).

**Correction from the plan's own re-review: the first draft of this guard only checked the write's own a/b refs, missing two reachable holes** — (1) a slot mixing *itself* as `a` or `b` is a 1-node cycle regardless of what that slot's current content type is (the original guard only fired when the referenced slot's *current* content was already `"mix"`, so a slot referencing itself while empty/media sailed through); (2) an *ordering* hole — write `slot-1 = mix(a: slot-2)` while `slot-2` is media (legal), then separately write `slot-2 = mix(...)` — that second write only validates `slot-2`'s own inputs, never checks whether some *other* slot already depends on `slot-2` as a mix input, so it retroactively creates a mix-of-mix through `slot-1` without the guard ever seeing it. Both are closed below:
```js
// A slot's content may be a "mix" of two other sources; a mix's own a/b refs may point
// at a media-holding slot but never at another mix-holding slot (directly, or through
// one level of slot indirection) — otherwise a self- or mutually-referencing mix would
// recurse without bound at render time. Enforced here, the sole write path for
// client-originated state changes; render-client/src/patch.js intentionally does NOT
// duplicate this guard (see docs/superpowers/plans/2026-07-08-parity-finish-line-plan.md
// Global Constraints — it only ever applies server-broadcast, already-validated state).
function slotContentType(state, slotId) {
  const slot = (state.sourceBank ?? []).find((s) => s.id === slotId);
  return slot?.content?.type ?? null;
}

function refIsMixSlot(state, ref) {
  if (ref?.type !== "slot") return false;
  return slotContentType(state, ref.slotId) === "mix";
}

// True if some OTHER slot's mix currently uses `slotId` as an input — i.e. turning
// `slotId` itself into a mix now would retroactively create a mix-of-mix through that
// other slot (the ordering hole described above).
function isUsedAsMixInputElsewhere(state, slotId) {
  return (state.sourceBank ?? []).some((s) => {
    if (s.id === slotId || s.content?.type !== "mix") return false;
    return (s.content.a?.type === "slot" && s.content.a.slotId === slotId) || (s.content.b?.type === "slot" && s.content.b.slotId === slotId);
  });
}

export function wouldCreateMixCycle(state, path, value) {
  // Path shape: "sourceBank.<index>.content"
  const match = /^sourceBank\.(\d+)\.content$/.exec(path);
  if (!match || value?.type !== "mix") return false;
  const thisSlot = state.sourceBank?.[Number(match[1])];
  if (!thisSlot) return false;
  // Self-reference: always a cycle, regardless of this slot's current content type.
  if (value.a?.type === "slot" && value.a.slotId === thisSlot.id) return true;
  if (value.b?.type === "slot" && value.b.slotId === thisSlot.id) return true;
  // Direct: an input that's itself a mix-holding slot right now.
  if (refIsMixSlot(state, value.a) || refIsMixSlot(state, value.b)) return true;
  // Ordering hole: this slot is already someone else's mix input — becoming a mix now
  // would make that other slot a mix-of-mix without ever revalidating its own write.
  if (isUsedAsMixInputElsewhere(state, thisSlot.id)) return true;
  return false;
}
```

Update `applyUpdate` (lines 215-224) to consult it:
```js
export function applyUpdate(state, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  if (isUnsafePath(keys) || UNSAFE_KEYS.has(last)) return false;
  if (wouldCreateMixCycle(state, path, value)) return false;
  const node = walkToParent(state, keys);
  if (node == null || typeof node !== "object" || !Object.hasOwn(node, last)) return false;
  if (node[last] === value) return false;
  node[last] = value;
  return true;
}
```
Note: `sourceBank` is an array, so `sourceBank.1.content` resolves via `walkToParent` the same way any array-index path already does elsewhere in this codebase (arrays are plain objects with numeric-string keys as far as `Object.hasOwn`/bracket access are concerned) — no special-casing needed for array vs. object containers.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd control-panel/server && node --test test/source-bank.test.js test/state.test.js`
Expected: PASS, all tests.

- [ ] **Step 6: Implement dangling-reference cleanup on delete**

Add to `control-panel/server/src/state.js` (exported, near `applyDelete`):
```js
// Called after a media entry or a source-bank slot is deleted: clears any reference to
// it rather than leaving a dangling id. A slot referencing deleted media becomes empty
// (content: null). A mix slot whose a/b referenced a deleted media/slot passes the
// other input through at full weight rather than rendering black — matches how the
// design spec defines "missing input" behavior for a mix.
export function resolveDanglingSourceRefs(state, kind, id) {
  const refMatches = (ref) => (kind === "media" ? ref?.type === "media" && ref.mediaId === id : ref?.type === "slot" && ref.slotId === id);
  for (const slot of state.sourceBank ?? []) {
    if (!slot.content) continue;
    if (slot.content.type === "media" && kind === "media" && slot.content.mediaId === id) {
      slot.content = null;
    } else if (slot.content.type === "mix") {
      if (refMatches(slot.content.a)) slot.content = { ...slot.content, a: null };
      if (refMatches(slot.content.b)) slot.content = { ...slot.content, b: null };
    }
  }
}
```
This intentionally does NOT touch `layers.*.source` (a layer whose `{type:"slot"}` reference now points at an empty slot already renders as "no source" for free — the render-client's slot resolver, Task 9, treats a `content: null` slot as empty, no separate layer-side cleanup needed).

**Correction from the plan's own re-review: media deletion happens over HTTP, not WS.** The panel's `removeMedia` (`App.tsx:108-115`) calls `fetch(DELETE /api/media/:id)`, handled entirely by `control-panel/server/src/media.js`'s `handleDelete(res, id)` (`media.js:151-161`) — there is no WS `delete` message for `media.*` anywhere in `actions.ts`, so hooking this into `index.js`'s WS `handleDelete` (as originally drafted) would never fire on a real deletion. Hook it into `media.js` instead:

```js
// control-panel/server/src/media.js:151-161, modified:
  function handleDelete(res, id) {
    const entry = state.media?.[id];
    if (!entry) { sendJson(res, 404, { error: `no media with id "${id}"` }); return; }
    if (SAFE_FILENAME.test(entry.filename)) {
      try { unlinkSync(join(mediaDir, entry.filename)); } catch { /* already gone */ }
    }
    applyDelete(state, `media.${id}`);
    resolveDanglingSourceRefs(state, "media", id);
    scheduleSave();
    broadcast({ type: "delete", path: `media.${id}` });
    broadcast({ type: "state", state }); // slot content may have changed too
    sendJson(res, 200, { ok: true });
  }
```
Add `resolveDanglingSourceRefs` to `media.js`'s existing `import { applyCreate, applyDelete } from "./state.js";` line (`media.js:28`). `index.js`'s own WS `handleDelete` needs no change — it's never the path media deletion takes. (Slot deletion itself isn't a supported operation — slots are a fixed 8-element array, never created/deleted individually — so only the `media.*` deletion path needs this hook.)

- [ ] **Step 7: Write and run a test for dangling-reference cleanup**

Add to `control-panel/server/test/source-bank.test.js`:
```js
import { resolveDanglingSourceRefs } from "../src/state.js";

test("resolveDanglingSourceRefs clears a slot's direct media reference", () => {
  const state = fixtureState();
  resolveDanglingSourceRefs(state, "media", "media-1");
  assert.equal(state.sourceBank[0].content, null);
});

test("resolveDanglingSourceRefs nulls only the affected side of a mix, keeps the other", () => {
  const state = fixtureState();
  resolveDanglingSourceRefs(state, "media", "media-2"); // slot-3's mix.b
  assert.equal(state.sourceBank[2].content.type, "mix");
  assert.equal(state.sourceBank[2].content.b, null);
  assert.deepEqual(state.sourceBank[2].content.a, { type: "slot", slotId: "slot-1" }); // untouched
});
```
Run: `cd control-panel/server && node --test test/source-bank.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add control-panel/server/src/state.js control-panel/server/src/media.js control-panel/server/test/state.test.js control-panel/server/test/source-bank.test.js
git commit -m "Add source-bank state, mix-cycle guard, dangling-reference cleanup"
```

---

## Task 8: Render-client — port all 18 remaining blend modes

**Files:**
- Modify: `control-panel/render-client/src/layers.js:4-5,55-62`
- Modify: `control-panel/panel/src/components/types.ts:168-175`
- Test: new `control-panel/server/test/blend-modes-parity.test.js` (a plain-Node test that statically parses both files' mode-name lists — no server involvement needed, it's a cross-package text check, but lives under `server/test/` alongside the file's the closest existing precedent, `state-patch-parity.test.js`, which already cross-checks server against render-client)

**Interfaces:**
- Produces: `BLEND_MODES` (24 entries) in both `layers.js` and `types.ts`, in identical order (order matters — `BLEND_INDEX` in `layers.js` derives each mode's shader-side integer from array position, so a mismatch between the two lists' order would make the panel's dropdown select the wrong visual mode).

- [ ] **Step 1: Write the failing parity test**

Create `control-panel/server/test/blend-modes-parity.test.js`:
```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function extractArrayLiteral(filePath, constName) {
  const src = readFileSync(filePath, "utf8");
  const re = new RegExp(`${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]`);
  const match = re.exec(src);
  if (!match) throw new Error(`${constName} not found in ${filePath}`);
  return [...match[1].matchAll(/"([a-zA-Z]+)"/g)].map((m) => m[1]);
}

test("render-client and panel blend-mode lists have the same 24 modes in the same order", () => {
  const clientModes = extractArrayLiteral(path.join(__dirname, "../../render-client/src/layers.js"), "BLEND_MODES");
  const panelModes = extractArrayLiteral(path.join(__dirname, "../../panel/src/components/types.ts"), "BLEND_MODES");
  assert.deepEqual(clientModes, panelModes);
  assert.equal(clientModes.length, 24);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd control-panel/server && node --test test/blend-modes-parity.test.js`
Expected: FAIL — both lists currently have 6 entries.

- [ ] **Step 3: Implement — extend `layers.js`'s `BLEND_MODES` and `blend()`**

Replace `BLEND_MODES` (`layers.js:4`):
```js
// Order is load-bearing: BLEND_INDEX derives each mode's shader-side integer from
// array position, and panel/src/components/types.ts's BLEND_MODES must list the exact
// same 24 names in the exact same order (checked by
// server/test/blend-modes-parity.test.js) so the panel's dropdown selects the mode it
// visually shows. Formulas ported from vpt8 source code/shaders/v001 Mixers/*.fp.glsl —
// see this plan's Global Constraints for the exact adaptation rule (myInput->top,
// previousmix->base, outer amount-mix wrapper dropped, divisions guarded against 0).
const BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "difference", "add",
  "average", "brightlight", "burn", "darken", "dodge", "exclude",
  "freeze", "glow", "hardlight", "heat", "inverse", "lighten",
  "lumablend", "negate", "reflect", "softlight", "stamp", "subtractive",
];
```

Replace the `blend()` GLSL function (`layers.js:55-62`):
```glsl
vec3 blend(vec3 base, vec3 top, int mode) {
  if (mode == 1) return base * top;
  if (mode == 2) return 1.0 - (1.0 - base) * (1.0 - top);
  if (mode == 3) return mix(2.0 * base * top, 1.0 - 2.0 * (1.0 - base) * (1.0 - top), step(0.5, base));
  if (mode == 4) return abs(base - top);
  if (mode == 5) return min(base + top, 1.0);
  if (mode == 6) return base + top * 0.5; // "average" — ported as-is from VPT8's actual (asymmetric) formula
  if (mode == 7) return (1.0 - base) * base * top + base * (1.0 - (1.0 - base) * (1.0 - top));
  if (mode == 8) return clamp(1.0 - (1.0 - base) / max(top, 0.0001), 0.0, 1.0);
  if (mode == 9) return min(base, top);
  if (mode == 10) return clamp(base / max(1.0 - top, 0.0001), 0.0, 1.0);
  if (mode == 11) return base + top - 2.0 * base * top;
  if (mode == 12) return clamp(1.0 - pow(1.0 - base, 2.0) / max(top, 0.0001), 0.0, 1.0);
  if (mode == 13) return clamp((top * top) / max(1.0 - base, 0.0001), 0.0, 1.0);
  if (mode == 14) {
    float luminance = dot(base, vec3(0.2125, 0.7154, 0.0721));
    float mixAmount = clamp((luminance - 0.45) * 10.0, 0.0, 1.0);
    vec3 branch1 = 2.0 * top * base;
    vec3 branch2 = 1.0 - 2.0 * (1.0 - top) * (1.0 - base);
    return mix(branch1, branch2, vec3(mixAmount));
  }
  if (mode == 15) return clamp(1.0 - pow(1.0 - top, 2.0) / max(base, 0.0001), 0.0, 1.0);
  if (mode == 16) return max(base, top);
  if (mode == 17) return mix(base, top, dot(base, vec3(0.2125, 0.7154, 0.0721)));
  if (mode == 18) return 1.0 - abs(1.0 - base - top);
  if (mode == 19) return clamp((base * base) / max(1.0 - top, 0.0001), 0.0, 1.0);
  if (mode == 20) return 2.0 * base * top + base * base - 2.0 * base * base * top;
  if (mode == 21) return base + 2.0 * top - 1.0;
  if (mode == 22) return base + top - 1.0;
  return top;
}
```
(Mode indices 6–22 above map 1:1 to `BLEND_MODES` indices 6–22: `average, brightlight, burn, darken, dodge, exclude, freeze, glow, hardlight, heat, inverse, lighten, lumablend, negate, reflect, softlight, stamp` — 17 entries, index 6 through 22; `subtractive` is index 23, `mode == 23` implicitly handled since it's the last one in the list before the function's final fallthrough — **fix**: add an explicit `if (mode == 23) return base + top - 1.0;` and remove the duplicate from slot 22 above, since `stamp` (21) and `subtractive` (23) are different formulas and the numbering above has an off-by-one — re-derive carefully in Step 3a below.)

- [ ] **Step 3a: Correct the mode-index-to-formula mapping (the count above drifted by one)**

`BLEND_MODES` has 24 entries at indices 0–23. Re-listing the intended mapping precisely, since off-by-one errors here are silent (wrong colors, not a crash):

| index | name | formula (base, top) |
|---|---|---|
| 0 | normal | `top` |
| 1 | multiply | `base * top` |
| 2 | screen | `1.0 - (1.0 - base) * (1.0 - top)` |
| 3 | overlay | `mix(2*base*top, 1-2*(1-base)*(1-top), step(0.5,base))` |
| 4 | difference | `abs(base - top)` |
| 5 | add | `min(base + top, 1.0)` |
| 6 | average | `base + top * 0.5` |
| 7 | brightlight | `(1-base)*base*top + base*(1-(1-base)*(1-top))` |
| 8 | burn | `clamp(1-(1-base)/max(top,1e-4), 0, 1)` |
| 9 | darken | `min(base, top)` |
| 10 | dodge | `clamp(base/max(1-top,1e-4), 0, 1)` |
| 11 | exclude | `base + top - 2*base*top` |
| 12 | freeze | `clamp(1-pow(1-base,2)/max(top,1e-4), 0, 1)` |
| 13 | glow | `clamp((top*top)/max(1-base,1e-4), 0, 1)` |
| 14 | hardlight | luminance-branched, see Step 3 |
| 15 | heat | `clamp(1-pow(1-top,2)/max(base,1e-4), 0, 1)` |
| 16 | inverse | `clamp(top/max(1-base,1e-4), 0, 1)` |
| 17 | lighten | `max(base, top)` |
| 18 | lumablend | `mix(base, top, dot(base, lumcoeff))` |
| 19 | negate | `1 - abs(1 - base - top)` |
| 20 | reflect | `clamp((base*base)/max(1-top,1e-4), 0, 1)` |
| 21 | softlight | `2*base*top + base*base - 2*base*base*top` |
| 22 | stamp | `base + 2*top - 1` |
| 23 | subtractive | `base + top - 1` |

Rewrite the `blend()` function in `layers.js` (superseding Step 3's draft) using these indices exactly:
```glsl
vec3 blend(vec3 base, vec3 top, int mode) {
  if (mode == 1) return base * top;
  if (mode == 2) return 1.0 - (1.0 - base) * (1.0 - top);
  if (mode == 3) return mix(2.0 * base * top, 1.0 - 2.0 * (1.0 - base) * (1.0 - top), step(0.5, base));
  if (mode == 4) return abs(base - top);
  if (mode == 5) return min(base + top, 1.0);
  if (mode == 6) return base + top * 0.5;
  if (mode == 7) return (1.0 - base) * base * top + base * (1.0 - (1.0 - base) * (1.0 - top));
  if (mode == 8) return clamp(1.0 - (1.0 - base) / max(top, 0.0001), 0.0, 1.0);
  if (mode == 9) return min(base, top);
  if (mode == 10) return clamp(base / max(1.0 - top, 0.0001), 0.0, 1.0);
  if (mode == 11) return base + top - 2.0 * base * top;
  if (mode == 12) return clamp(1.0 - pow(1.0 - base, 2.0) / max(top, 0.0001), 0.0, 1.0);
  if (mode == 13) return clamp((top * top) / max(1.0 - base, 0.0001), 0.0, 1.0);
  if (mode == 14) {
    float luminance = dot(base, vec3(0.2125, 0.7154, 0.0721));
    float mixAmount = clamp((luminance - 0.45) * 10.0, 0.0, 1.0);
    return mix(2.0 * top * base, 1.0 - 2.0 * (1.0 - top) * (1.0 - base), vec3(mixAmount));
  }
  if (mode == 15) return clamp(1.0 - pow(1.0 - top, 2.0) / max(base, 0.0001), 0.0, 1.0);
  if (mode == 16) return clamp(top / max(1.0 - base, 0.0001), 0.0, 1.0);
  if (mode == 17) return max(base, top);
  if (mode == 18) return mix(base, top, dot(base, vec3(0.2125, 0.7154, 0.0721)));
  if (mode == 19) return 1.0 - abs(1.0 - base - top);
  if (mode == 20) return clamp((base * base) / max(1.0 - top, 0.0001), 0.0, 1.0);
  if (mode == 21) return 2.0 * base * top + base * base - 2.0 * base * base * top;
  if (mode == 22) return base + 2.0 * top - 1.0;
  if (mode == 23) return base + top - 1.0;
  return top; // mode 0, normal
}
```

- [ ] **Step 4: Mirror `BLEND_MODES` in `types.ts`**

Replace `types.ts:168-175`:
```ts
export const BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "difference", "add",
  "average", "brightlight", "burn", "darken", "dodge", "exclude",
  "freeze", "glow", "hardlight", "heat", "inverse", "lighten",
  "lumablend", "negate", "reflect", "softlight", "stamp", "subtractive",
] as const;
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```sh
cd control-panel/server && node --test test/blend-modes-parity.test.js
cd ../render-client && node --check src/layers.js
cd ../panel && npm run build
```
Expected: parity test PASS, `layers.js` syntax-checks clean, panel `tsc --noEmit` clean.

- [ ] **Step 6: Commit**

```bash
git add control-panel/render-client/src/layers.js control-panel/panel/src/components/types.ts control-panel/server/test/blend-modes-parity.test.js
git commit -m "Port all 18 remaining blend modes from VPT8's v001 Mixers shaders"
```

---

## Task 9: Render-client — shared source resolver + mix-slot rendering

**Files:**
- Create: `control-panel/render-client/src/source-bank.js`
- Modify: `control-panel/render-client/src/layers.js` (consume `SourceBank` for `{type:"slot"}` sources)

**Interfaces:**
- Produces: `class SourceBank { constructor(gl); setMediaOrigin(origin); updateAll(slots, media); resolveTexture(slotId, slots, media, depth = 0): WebGLTexture | null; dispose(); }`.
- Consumes: `createTexture`/`createFramebuffer`/`createProgram`/`createFullscreenQuad`/`bindFullscreenQuad` from `./gl-utils.js` (same helpers `layers.js`/`fx.js`/`warp.js` already use).

- [ ] **Step 1: Implement `SourceBank`**

Create `control-panel/render-client/src/source-bank.js`:
```js
import { createProgram, createFullscreenQuad, bindFullscreenQuad, createTexture, createFramebuffer } from "./gl-utils.js";

const MIX_VERT = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// Reuses the exact same 24-mode blend() ported in layers.js — duplicated here rather
// than shared via import because GLSL source strings aren't ES module exports; keep
// both copies in lockstep by hand (both are ported straight from the same VPT8 source
// files, see server/test/blend-modes-parity.test.js for the JS-side name-list parity
// check — this GLSL-level duplication has no automated parity check, a known gap).
const MIX_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_a;
uniform sampler2D u_b;
uniform int u_blendMode;
uniform float u_mix;
out vec4 outColor;
vec3 blend(vec3 base, vec3 top, int mode) {
  if (mode == 1) return base * top;
  if (mode == 2) return 1.0 - (1.0 - base) * (1.0 - top);
  if (mode == 3) return mix(2.0 * base * top, 1.0 - 2.0 * (1.0 - base) * (1.0 - top), step(0.5, base));
  if (mode == 4) return abs(base - top);
  if (mode == 5) return min(base + top, 1.0);
  if (mode == 6) return base + top * 0.5;
  if (mode == 7) return (1.0 - base) * base * top + base * (1.0 - (1.0 - base) * (1.0 - top));
  if (mode == 8) return clamp(1.0 - (1.0 - base) / max(top, 0.0001), 0.0, 1.0);
  if (mode == 9) return min(base, top);
  if (mode == 10) return clamp(base / max(1.0 - top, 0.0001), 0.0, 1.0);
  if (mode == 11) return base + top - 2.0 * base * top;
  if (mode == 12) return clamp(1.0 - pow(1.0 - base, 2.0) / max(top, 0.0001), 0.0, 1.0);
  if (mode == 13) return clamp((top * top) / max(1.0 - base, 0.0001), 0.0, 1.0);
  if (mode == 14) {
    float luminance = dot(base, vec3(0.2125, 0.7154, 0.0721));
    float mixAmount = clamp((luminance - 0.45) * 10.0, 0.0, 1.0);
    return mix(2.0 * top * base, 1.0 - 2.0 * (1.0 - top) * (1.0 - base), vec3(mixAmount));
  }
  if (mode == 15) return clamp(1.0 - pow(1.0 - top, 2.0) / max(base, 0.0001), 0.0, 1.0);
  if (mode == 16) return clamp(top / max(1.0 - base, 0.0001), 0.0, 1.0);
  if (mode == 17) return max(base, top);
  if (mode == 18) return mix(base, top, dot(base, vec3(0.2125, 0.7154, 0.0721)));
  if (mode == 19) return 1.0 - abs(1.0 - base - top);
  if (mode == 20) return clamp((base * base) / max(1.0 - top, 0.0001), 0.0, 1.0);
  if (mode == 21) return 2.0 * base * top + base * base - 2.0 * base * base * top;
  if (mode == 22) return base + 2.0 * top - 1.0;
  if (mode == 23) return base + top - 1.0;
  return top;
}
void main() {
  vec4 a = texture(u_a, v_uv);
  vec4 b = texture(u_b, v_uv);
  vec3 blended = blend(a.rgb, b.rgb, u_blendMode);
  outColor = vec4(mix(a.rgb, blended, u_mix), 1.0);
}`;

// Same 24-name list and order as render-client/src/layers.js's BLEND_MODES and
// panel/src/components/types.ts's BLEND_MODES (server/test/blend-modes-parity.test.js
// checks those two; this third copy has no automated check against them — see this
// plan's Self-Review Notes for that known gap — so any future reordering of one list
// MUST be manually mirrored in the other two or a mix slot's blend-mode picker will
// silently select the wrong visual result).
const MIX_BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "difference", "add",
  "average", "brightlight", "burn", "darken", "dodge", "exclude",
  "freeze", "glow", "hardlight", "heat", "inverse", "lighten",
  "lumablend", "negate", "reflect", "softlight", "stamp", "subtractive",
];

function mediaUrlFor(mediaId, media, mediaOrigin) {
  const item = media?.[mediaId];
  if (!item) return null;
  return `${mediaOrigin}/media/${item.filename}`;
}

export class SourceBank {
  constructor(gl) {
    this.gl = gl;
    this.mixProgram = createProgram(gl, MIX_VERT, MIX_FRAG);
    this.mixQuad = createFullscreenQuad(gl);
    this.mixUniforms = {
      a: gl.getUniformLocation(this.mixProgram, "u_a"),
      b: gl.getUniformLocation(this.mixProgram, "u_b"),
      blendMode: gl.getUniformLocation(this.mixProgram, "u_blendMode"),
      mix: gl.getUniformLocation(this.mixProgram, "u_mix"),
    };
    this.entries = new Map(); // slotId -> { texture, videoEl, imgEl, currentUrl }
    this.mixFbos = new Map(); // slotId -> framebuffer, one per mix-type slot
    this.mediaOrigin = "";
  }

  setMediaOrigin(origin) {
    this.mediaOrigin = origin || "";
  }

  _mediaEntry(slotId) {
    if (!this.entries.has(slotId)) {
      this.entries.set(slotId, { texture: createTexture(this.gl), videoEl: null, imgEl: null, currentUrl: null });
    }
    return this.entries.get(slotId);
  }

  // Decodes/uploads one media ref's current frame into the entry keyed by `entryKey`.
  // Shared by both direct slot media (keyed by the slot's own id) and a mix's direct-
  // media a/b inputs (keyed by `${slot.id}:a`/`${slot.id}:b`) — factored out so both
  // paths actually decode, fixing an earlier draft where only direct slot media was
  // wired and a mix's own media inputs sampled a never-uploaded (black) texture.
  _decodeMediaInto(entryKey, mediaId, media) {
    const entry = this._mediaEntry(entryKey);
    const url = mediaUrlFor(mediaId, media, this.mediaOrigin);
    if (!url) return;
    if (entry.currentUrl !== url) {
      entry.currentUrl = url;
      if (entry.videoEl) { entry.videoEl.pause(); entry.videoEl.remove(); entry.videoEl = null; }
      const el = document.createElement("video");
      el.src = url;
      el.crossOrigin = "anonymous";
      el.loop = true;
      el.muted = true; // shared slots never own audio directly — a layer/mix consuming one does, per the transport work in Task 14
      el.playsInline = true;
      el.play().catch(() => {});
      entry.videoEl = el;
    }
    if (entry.videoEl && entry.videoEl.readyState >= 2) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, entry.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, entry.videoEl);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }
  }

  // Decodes/uploads the current frame for every media-type slot AND every mix slot's
  // direct-media a/b inputs. Called once per frame, before layer rendering, mirroring
  // LayerStack's own per-frame upload step.
  updateAll(slots, media) {
    for (const slot of slots ?? []) {
      if (slot.content?.type === "media") {
        this._decodeMediaInto(slot.id, slot.content.mediaId, media);
      } else if (slot.content?.type === "mix") {
        if (slot.content.a?.type === "media") this._decodeMediaInto(`${slot.id}:a`, slot.content.a.mediaId, media);
        if (slot.content.b?.type === "media") this._decodeMediaInto(`${slot.id}:b`, slot.content.b.mediaId, media);
      }
    }
  }

  resolveTexture(slotId, slots, media, depth = 0) {
    if (depth > 2) return null;
    const slot = (slots ?? []).find((s) => s.id === slotId);
    if (!slot?.content) return null;
    if (slot.content.type === "media") {
      return this._mediaEntry(slot.id).texture;
    }
    if (slot.content.type === "mix") {
      const { a, b, blendMode, mix } = slot.content;
      const texA = a?.type === "slot" ? this.resolveTexture(a.slotId, slots, media, depth + 1) : a?.type === "media" ? this._mediaEntry(`${slot.id}:a`).texture : null;
      const texB = b?.type === "slot" ? this.resolveTexture(b.slotId, slots, media, depth + 1) : b?.type === "media" ? this._mediaEntry(`${slot.id}:b`).texture : null;
      // Missing-input behavior (design spec, Section 2): pass the other input through
      // at full weight rather than rendering black.
      if (!texA && !texB) return null;
      if (!texA) return texB;
      if (!texB) return texA;

      const gl = this.gl;
      if (!this.mixFbos.has(slot.id)) this.mixFbos.set(slot.id, createFramebuffer(gl, 1280, 720));
      const fbo = this.mixFbos.get(slot.id);
      const modeIndex = MIX_BLEND_MODES.indexOf(blendMode);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
      gl.viewport(0, 0, fbo.width, fbo.height);
      gl.useProgram(this.mixProgram);
      bindFullscreenQuad(gl, this.mixProgram, this.mixQuad);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texA);
      gl.uniform1i(this.mixUniforms.a, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texB);
      gl.uniform1i(this.mixUniforms.b, 1);
      gl.uniform1i(this.mixUniforms.blendMode, Math.max(0, modeIndex));
      gl.uniform1f(this.mixUniforms.mix, mix ?? 0.5);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return fbo.texture;
    }
    return null;
  }

  dispose() {
    for (const fbo of this.mixFbos.values()) this.gl.deleteFramebuffer(fbo.framebuffer);
  }
}
```
(The `${slot.id}:a`/`${slot.id}:b` synthetic entry ids used by `resolveTexture`'s mix branch are decoded by `updateAll`'s mix branch above, added in the Step 1 rewrite — both paths now share `_decodeMediaInto`, so there is no separate follow-up needed here.)

- [ ] **Step 2: Wire `{type:"slot"}` layer sources through `SourceBank` in `layers.js`**

In `control-panel/render-client/src/layers.js`, import and instantiate:
```js
import { SourceBank } from "./source-bank.js";
```
In `LayerStack`'s constructor, add `this.sourceBank = new SourceBank(gl); this.slots = []; this.media = {};`. In `setMediaOrigin`, also call `this.sourceBank.setMediaOrigin(origin);`.

Add a setter (`LayerStack` has no `setLayers` method — that name belongs to `Compositor`, which owns `this.layerStack`; storing `slots`/`media` is a small, separate setter here, not a same-named method):
```js
  setSourceContext(slots, media) {
    this.slots = slots ?? [];
    this.media = media ?? {};
  }
```

In `render(layers)`, before the per-layer loop, call `this.sourceBank.updateAll(this.slots, this.media);`.

`compositor.js`'s existing `setLayers(layersById)` needs a signature change to receive and forward `slots`/`media` — **this is finished properly in Task 14 Step 0**, which also fixes how each layer's *effective* source (accounting for playlist mode, added in Task 12) gets to `setLayerSource`. Doing both here would leave Task 12's not-yet-existent `sourceMode`/`playlist` fields referenced before that task runs; the ordering in this plan (9 before 12/14) is deliberate, so this step only wires the slot/media plumbing, not source resolution.

Inside the per-layer loop, where `layerTexture` is currently always `entry.texture` (or the FX-chain output), branch on source type:
```js
    for (const layer of layers) {
      const entry = this._entry(layer.id);
      const isColor = layer.source?.type === "color";
      const isSlot = layer.source?.type === "slot";
      let sourceTexture = entry.texture;
      if (isSlot) {
        sourceTexture = this.sourceBank.resolveTexture(layer.source.slotId, this.slots, this.media) ?? entry.texture;
      } else if (!isColor) {
        this._uploadSourceFrame(entry);
      }
      // ...rest of the loop uses `sourceTexture` wherever it previously used `entry.texture`
```

- [ ] **Step 3: Verify no syntax errors**

Run: `cd control-panel/render-client && node --check src/source-bank.js && node --check src/layers.js`
Expected: clean. Real correctness verification deferred to Task 11's Playwright check.

- [ ] **Step 4: Commit**

```bash
git add control-panel/render-client/src/source-bank.js control-panel/render-client/src/layers.js control-panel/render-client/src/compositor.js control-panel/render-client/src/main.js
git commit -m "Add shared source-bank resolver with mix-slot rendering to render-client"
```

---

## Task 10: Panel — source-bank UI + "Shared Slot" layer source option

**Files:**
- Modify: `control-panel/panel/src/components/types.ts` (extend `LayerSource`, add `SourceBankSlot` type)
- Modify: `control-panel/panel/src/app/actions.ts` (source-bank actions)
- Create: `control-panel/panel/src/components/SourceBankPanel.tsx` + `SourceBankPanel.stories.tsx`
- Modify: `control-panel/panel/src/components/LayerStrip.tsx` ("Shared Slot" source option)
- Modify: `control-panel/panel/src/app/App.tsx` (render `SourceBankPanel`, thread `sourceBank`/actions)

- [ ] **Step 1: Extend types**

In `control-panel/panel/src/components/types.ts`, replace `LayerSource` (lines 5-9):
```ts
export interface LayerSource {
  type: "video" | "color" | "camera" | "slot";
  url?: string;
  color?: [number, number, number];
  slotId?: string;
}

export interface SourceRef {
  type: "media" | "slot";
  mediaId?: string;
  slotId?: string;
}

export interface SourceBankSlot {
  id: string;
  name: string;
  content:
    | null
    | { type: "media"; mediaId: string }
    | { type: "mix"; a: SourceRef | null; b: SourceRef | null; blendMode: string; mix: number };
}
```

- [ ] **Step 2: Add source-bank actions**

In `control-panel/panel/src/app/actions.ts`, add:
```ts
    setSourceBankSlotContent(slotId: string, index: number, content: unknown) {
      send({ type: "update", path: `sourceBank.${index}.content`, value: content });
    },
    renameSourceBankSlot(index: number, name: string) {
      send({ type: "update", path: `sourceBank.${index}.name`, value: name });
    },
```
(`index` is threaded alongside `slotId` since `sourceBank` is a fixed-length array addressed positionally by the existing `applyUpdate` dotted-path convention — `slotId` is kept as a param too since callers building `content.a`/`content.b` refs need the id, not the array index.)

- [ ] **Step 3: Build `SourceBankPanel`**

Create `control-panel/panel/src/components/SourceBankPanel.tsx`, following `MediaLibrary.tsx`'s exact structural pattern (section wrapper, head row, per-item row):
```tsx
import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import type { SourceBankSlot, MediaItem, SourceRef } from "./types";
import { BLEND_MODES } from "./types";

export interface SourceBankPanelProps {
  slots: SourceBankSlot[];
  media: MediaItem[];
  onRename?: (index: number, name: string) => void;
  onSetContent?: (slotId: string, index: number, content: SourceBankSlot["content"]) => void;
}

function RefPicker({ value, media, otherSlots, onChange }: { value: SourceRef | null; media: MediaItem[]; otherSlots: { id: string; name: string }[]; onChange: (ref: SourceRef | null) => void }) {
  const options = [
    { value: "", label: "—" },
    ...media.map((m) => ({ value: `media:${m.id}`, label: m.name })),
    ...otherSlots.map((s) => ({ value: `slot:${s.id}`, label: s.name })),
  ];
  const current = value ? `${value.type}:${value.type === "media" ? value.mediaId : value.slotId}` : "";
  return (
    <Select
      value={current}
      options={options}
      onChange={(v) => {
        if (!v) return onChange(null);
        const [type, id] = v.split(":");
        onChange(type === "media" ? { type: "media", mediaId: id } : { type: "slot", slotId: id });
      }}
    />
  );
}

export function SourceBankPanel({ slots, media, onRename, onSetContent }: SourceBankPanelProps) {
  return (
    <section id="source-bank" className="sc-card">
      <div className="media-head">
        <h3>Source bank</h3>
      </div>
      {slots.map((slot, i) => {
        const otherSlots = slots.filter((s) => s.id !== slot.id).map((s) => ({ id: s.id, name: s.name }));
        const isMix = slot.content?.type === "mix";
        return (
          <div className="media-row source-slot-row" key={slot.id}>
            <TextField className="media-name" value={slot.name} onCommit={(v) => onRename?.(i, v)} />
            <Select
              className="source-slot-type"
              value={slot.content?.type ?? ""}
              options={[{ value: "", label: "Empty" }, { value: "media", label: "Media" }, { value: "mix", label: "Mix" }]}
              onChange={(v) => {
                if (v === "media") onSetContent?.(slot.id, i, { type: "media", mediaId: media[0]?.id ?? "" });
                else if (v === "mix") onSetContent?.(slot.id, i, { type: "mix", a: null, b: null, blendMode: "normal", mix: 0.5 });
                else onSetContent?.(slot.id, i, null);
              }}
            />
            {slot.content?.type === "media" && (
              <Select
                value={slot.content.mediaId}
                options={media.map((m) => ({ value: m.id, label: m.name }))}
                onChange={(v) => onSetContent?.(slot.id, i, { type: "media", mediaId: v })}
              />
            )}
            {isMix && slot.content?.type === "mix" && (
              <>
                <RefPicker value={slot.content.a} media={media} otherSlots={otherSlots} onChange={(a) => onSetContent?.(slot.id, i, { ...slot.content, a } as SourceBankSlot["content"])} />
                <RefPicker value={slot.content.b} media={media} otherSlots={otherSlots} onChange={(b) => onSetContent?.(slot.id, i, { ...slot.content, b } as SourceBankSlot["content"])} />
                <Select
                  value={slot.content.blendMode}
                  options={BLEND_MODES.map((m) => ({ value: m, label: m }))}
                  onChange={(v) => onSetContent?.(slot.id, i, { ...slot.content, blendMode: v } as SourceBankSlot["content"])}
                />
              </>
            )}
          </div>
        );
      })}
    </section>
  );
}
```

Create `control-panel/panel/src/components/SourceBankPanel.stories.tsx`, matching `MediaLibrary.stories.tsx`'s exact convention:
```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { SourceBankPanel } from "./SourceBankPanel";
import { sampleMedia, noop } from "./fixtures";

const meta: Meta<typeof SourceBankPanel> = {
  title: "Panel/SourceBankPanel",
  component: SourceBankPanel,
  decorators: [(Story) => <div style={{ width: 720, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SourceBankPanel>;

const emptySlots = Array.from({ length: 8 }, (_, i) => ({ id: `slot-${i + 1}`, name: `Slot ${i + 1}`, content: null }));

export const Empty: Story = { args: { slots: emptySlots, media: sampleMedia, onRename: noop, onSetContent: noop } };
export const WithMix: Story = {
  args: {
    slots: [
      { id: "slot-1", name: "Slot 1", content: { type: "media", mediaId: sampleMedia[0]?.id ?? "media-1" } },
      { id: "slot-2", name: "Slot 2", content: { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: null, blendMode: "multiply", mix: 0.5 } },
      ...emptySlots.slice(2),
    ],
    media: sampleMedia,
    onRename: noop,
    onSetContent: noop,
  },
};
```

- [ ] **Step 4: Add the "Shared Slot" source option to `LayerStrip`**

In `control-panel/panel/src/components/LayerStrip.tsx`'s source-type `<Select>` options (line ~66), add a fourth option:
```tsx
    options={[
      { value: "video", label: "Video URL" },
      { value: "color", label: "Solid color" },
      { value: "camera", label: "Camera" },
      { value: "slot", label: "Shared Slot" },
    ]}
    onChange={(v) =>
      onUpdate?.(
        "source",
        v === "color"
          ? { type: "color", color: layer.source?.color ?? [0.5, 0.5, 0.5] }
          : v === "camera"
            ? { type: "camera" }
            : v === "slot"
              ? { type: "slot", slotId: sourceBank?.[0]?.id ?? "slot-1" }
              : { type: "video", url: layer.source?.url ?? "" },
      )
    }
```
Add a rendering branch in the `source-field` div for `layer.source?.type === "slot"`:
```tsx
    ) : layer.source?.type === "slot" ? (
      <Select
        value={layer.source.slotId ?? ""}
        options={(sourceBank ?? []).map((s) => ({ value: s.id, label: s.name }))}
        onChange={(v) => onUpdate?.("source", { type: "slot", slotId: v })}
      />
    ) : isColor ? (
```
Add `sourceBank?: SourceBankSlot[];` to `LayerStripProps` and thread it from `ChannelRack` (new `sourceBank` prop, passed straight through to every `LayerStrip`, same pattern as the existing `media` prop).

- [ ] **Step 5: Render `SourceBankPanel` in `App.tsx`**

Following the exact `mediaPane` pattern (`App.tsx:217-224`), add:
```tsx
  const sourceBankPane = (
    <SourceBankPanel
      slots={state.sourceBank ?? []}
      media={media}
      onRename={actions.renameSourceBankSlot}
      onSetContent={actions.setSourceBankSlotContent}
    />
  );
```
Splice `sourceBankPane` into the same mobile/desktop layout spots `mediaPane` already occupies (both places `{mediaPane}` appears, add `{sourceBankPane}` immediately after it), and add `sourceBank={state.sourceBank}` to the existing `<ChannelRack ... />` call site (`App.tsx:227-238`).

- [ ] **Step 6: Verify panel typechecks**

Run: `cd control-panel/panel && npm run build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add control-panel/panel/src/components/types.ts control-panel/panel/src/app/actions.ts control-panel/panel/src/components/SourceBankPanel.tsx control-panel/panel/src/components/SourceBankPanel.stories.tsx control-panel/panel/src/components/LayerStrip.tsx control-panel/panel/src/components/ChannelRack.tsx control-panel/panel/src/app/App.tsx
git commit -m "Add source-bank management UI and Shared Slot layer source option"
```

---

## Task 11: Playwright — verify new blend modes and mix-slot rendering

**Files:**
- Create: `control-panel/e2e/blend-and-mix.spec.js`

- [ ] **Step 1: Write the test**

```js
import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8184;
const RENDER_PORT = 8185;
let serverProc, staticServer;

async function startServer() {
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), MEDIA_DIR: path.join(REPO_ROOT, "server", "media"), OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (buf) => { if (buf.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); } };
    serverProc.stdout.on("data", onData);
    setTimeout(() => reject(new Error("server did not start")), 10_000);
  });
}
async function startStatic() {
  staticServer = http.createServer((req, res) => handler(req, res, { public: path.join(REPO_ROOT, "render-client") }));
  await new Promise((resolve) => staticServer.listen(RENDER_PORT, resolve));
}
function wsSend(socket, message) { return new Promise((resolve) => socket.send(JSON.stringify(message), resolve)); }

test.beforeAll(async () => { await startServer(); await startStatic(); });
test.afterAll(async () => { staticServer?.close(); serverProc?.kill(); });

async function readCenterPixel(page) {
  return page.locator("canvas").evaluate((el) => {
    const gl = el.getContext("webgl2");
    const px = new Uint8Array(4);
    gl.readPixels(el.width >> 1, el.height >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return Array.from(px);
  });
}

test("darken blend mode: min(base,top) — white base + red top over black ground reads red-only", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, { type: "create", path: "layers", value: { id: "l-base", name: "base", order: 1, source: { type: "color", color: [1, 1, 1] }, opacity: 1, blendMode: "normal", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null, warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } } } });
  await wsSend(socket, { type: "create", path: "layers", value: { id: "l-top", name: "top", order: 2, source: { type: "color", color: [1, 0, 0] }, opacity: 1, blendMode: "darken", mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null, warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } } } });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(500);
  const px = await readCenterPixel(page);
  // min(1,1)=1 (R), min(1,0)=0 (G), min(1,0)=0 (B) -> pure red.
  expect(px[0]).toBeGreaterThan(200);
  expect(px[1]).toBeLessThan(30);
  expect(px[2]).toBeLessThan(30);
});

test("a mix slot 50/50 multiply of red and green sources renders a dim yellow-ish blend", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  // Multiply of pure red (1,0,0) and pure green (0,1,0) is (0,0,0) - black - which is a
  // trivially-passing but uninformative check; use red and white instead: multiply(red,
  // white) = red, so the mix-slot's OWN 50% crossfade (not the inner blend mode) should
  // land the visible result approximately halfway between "just red layer" and "mixed
  // red*white=red" -- to keep the assertion meaningful or the inner blend, this test
  // uses "screen" instead: screen(red, white) = white, distinctly different from either
  // input, unambiguously proving the mix pipeline actually ran.
  await wsSend(socket, {
    type: "update", path: "sourceBank.0.content",
    value: { type: "mix", a: { type: "media", mediaId: null }, b: { type: "media", mediaId: null }, blendMode: "screen", mix: 1.0 },
  });
  // sourceBank content needs real media; simpler to drive this with two solid-color
  // layers feeding a mix isn't supported by SourceRef (media/slot only, no "color" ref
  // type per the design spec) -- so this specific test instead verifies the mix pipeline
  // via two uploaded fixture stills already used in Task 1 (fixture-red.jpg exists;
  // reuse it for "a", and rely on media.js's existing upload path to add a white fixture
  // for "b" at test setup time via the HTTP API rather than WS).
  socket.close();
  test.skip(true, "requires a second (white) fixture upload via HTTP multipart — tracked as a follow-up; the darken-mode test above already exercises the ported-blend-formula code path end to end, and Task 9's resolveTexture unit-level logic has no test file of its own by design (render-client has zero unit tests anywhere, verified during research) so this e2e check is the only coverage opportunity for the mix path specifically");
});
```

- [ ] **Step 2: Run and verify the first test passes; the second is a documented skip**

Run: `cd control-panel/e2e && npx playwright test blend-and-mix.spec.js`
Expected: `1 passed, 1 skipped`. The skip is intentional and explained inline — closing it requires extending the test harness with an HTTP multipart upload helper, which is out of scope for this task; **do not silently delete the skipped test** — it documents a real, named coverage gap (the mix-slot rendering path in `source-bank.js` has no automated check beyond `node --check`'s syntax validation).

- [ ] **Step 3: Commit**

```bash
git add control-panel/e2e/blend-and-mix.spec.js
git commit -m "Add Playwright check for a new blend mode; document mix-slot coverage gap"
```

---

## Task 12: Server — layer `transport` + `sourceMode`/playlist state

**Files:**
- Modify: `control-panel/server/src/state.js`
- Test: `control-panel/server/test/state.test.js`

**Interfaces:**
- Produces: `defaultTransport()` (exported), `layer.transport` shape `{ playing, rate, loopIn, loopOut, loopMode, pan, vol }`, `layer.sourceMode: "single" | "playlist"`, `layer.playlist: { items: Array<{ ref, duration? }>, cursor: number }`.

- [ ] **Step 1: Write the failing tests**

Append to `control-panel/server/test/state.test.js`:
```js
test("defaultTransport returns a paused, forward, un-looped, centered transport", () => {
  const t = defaultTransport();
  assert.equal(t.playing, false);
  assert.equal(t.rate, 1);
  assert.equal(t.loopIn, null);
  assert.equal(t.loopOut, null);
  assert.equal(t.loopMode, "off");
  assert.equal(t.pan, 0);
  assert.equal(t.vol, 1);
});

test("ensureLayerDefaults backfills transport, sourceMode, and playlist on an older layer", () => {
  const layer = { id: "layer-1", order: 1, fx: defaultFx(), warp: defaultWarp() };
  ensureLayerDefaults(layer);
  assert.ok(layer.transport);
  assert.equal(layer.sourceMode, "single");
  assert.deepEqual(layer.playlist, { items: [], cursor: -1 });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd control-panel/server && node --test test/state.test.js`
Expected: FAIL — `defaultTransport is not defined`.

- [ ] **Step 3: Implement**

In `control-panel/server/src/state.js`, add after `defaultWarp()`:
```js
export function defaultTransport() {
  return { playing: false, rate: 1, loopIn: null, loopOut: null, loopMode: "off", pan: 0, vol: 1 };
}
```
Add `transport: defaultTransport(), sourceMode: "single", playlist: { items: [], cursor: -1 },` to both `DEFAULT_STATE.layers` entries, and update `ensureLayerDefaults`:
```js
export function ensureLayerDefaults(layer) {
  fillMissing(layer, {
    fx: defaultFx(),
    warp: defaultWarp(),
    transport: defaultTransport(),
    sourceMode: "single",
    playlist: { items: [], cursor: -1 },
  });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd control-panel/server && node --test test/state.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add control-panel/server/src/state.js control-panel/server/test/state.test.js
git commit -m "Add per-layer transport and playlist state"
```

---

## Task 13: Server — playlist advance scheduling + transport/clipEnded relay

**Files:**
- Modify: `control-panel/server/src/automation.js`
- Modify: `control-panel/server/src/index.js`
- Test: `control-panel/server/test/automation.test.js`

**Interfaces:**
- Produces: `createAutomationEngine(...)`'s returned object gains a new method `clipEnded(layerId)`, called from `index.js`'s new `clipEnded` WS case; the tick loop gains still-image playlist advance alongside the existing cue/timer/LFO ticks.

- [ ] **Step 1: Write the failing tests**

Append to `control-panel/server/test/automation.test.js`:
```js
test("a still-image playlist item advances after its configured duration", async () => {
  const { state, engine } = makeHarness({
    layers: {
      "layer-1": {
        sourceMode: "playlist",
        playlist: {
          items: [
            { ref: { type: "media", mediaId: "a" }, duration: 0.1 },
            { ref: { type: "media", mediaId: "b" }, duration: 0.1 },
          ],
          cursor: 0,
        },
      },
    },
  });
  await wait(180);
  assert.equal(state.layers["layer-1"].playlist.cursor, 1);
  engine.dispose();
});

test("a video playlist item does NOT advance on wall-clock time alone (no duration set)", async () => {
  const { state, engine } = makeHarness({
    layers: {
      "layer-1": {
        sourceMode: "playlist",
        playlist: { items: [{ ref: { type: "media", mediaId: "a" } }, { ref: { type: "media", mediaId: "b" } }], cursor: 0 },
      },
    },
  });
  await wait(180);
  assert.equal(state.layers["layer-1"].playlist.cursor, 0); // unchanged — no duration means "play through to end", which only clipEnded() advances
  engine.dispose();
});

test("clipEnded() advances a video playlist item and wraps at the end", () => {
  const { state, engine } = makeHarness({
    layers: {
      "layer-1": {
        sourceMode: "playlist",
        playlist: { items: [{ ref: { type: "media", mediaId: "a" } }, { ref: { type: "media", mediaId: "b" } }], cursor: 1 },
      },
    },
  });
  engine.clipEnded("layer-1");
  assert.equal(state.layers["layer-1"].playlist.cursor, 0); // wraps
  engine.dispose();
});

test("clipEnded() on a layer not in playlist mode is a no-op", () => {
  const { state, engine } = makeHarness({ layers: { "layer-1": { sourceMode: "single", playlist: { items: [], cursor: -1 } } } });
  engine.clipEnded("layer-1"); // must not throw
  assert.equal(state.layers["layer-1"].playlist.cursor, -1);
  engine.dispose();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd control-panel/server && node --test test/automation.test.js`
Expected: FAIL — `engine.clipEnded is not a function`, and the playlist cursor tests fail since nothing advances it yet.

- [ ] **Step 3: Implement playlist advance in `automation.js`**

Add near the other per-tick functions (alongside `tickTimers`):
```js
  const playlistFired = new Map(); // layerId -> ms timestamp the current item started

  function tickPlaylists(now) {
    // Same leak-prevention pattern tickTimers already uses for timerFired: a layer
    // deleted entirely (not just switched out of playlist mode) would otherwise leave
    // its entry in this Map forever, since the loop below only ever visits ids still
    // present in state.layers.
    pruneStaleSlots(playlistFired, new Set(Object.keys(state.layers ?? {})));
    for (const [id, layer] of Object.entries(state.layers ?? {})) {
      if (layer.sourceMode !== "playlist") { playlistFired.delete(id); continue; }
      const pl = layer.playlist;
      if (!pl?.items?.length) continue;
      const item = pl.items[pl.cursor];
      if (!item?.duration) continue; // video items ("play through to end") only advance via clipEnded()
      const startedAt = playlistFired.get(id);
      if (startedAt == null) { playlistFired.set(id, now); continue; }
      if (now - startedAt >= item.duration * 1000) {
        const nextCursor = (pl.cursor + 1) % pl.items.length;
        state.layers[id].playlist = { ...pl, cursor: nextCursor };
        playlistFired.set(id, now);
        broadcast({ type: "update", path: `layers.${id}.playlist`, value: state.layers[id].playlist });
      }
    }
  }

  // Called when a render client (the audio owner for this layer) reports its <video>
  // firing the native `ended` event — the only way the server can know a video-mode
  // playlist item finished, since it never observes playback directly.
  function clipEnded(layerId) {
    const layer = state.layers?.[layerId];
    if (layer?.sourceMode !== "playlist") return;
    const pl = layer.playlist;
    if (!pl?.items?.length) return;
    const nextCursor = (pl.cursor + 1) % pl.items.length;
    state.layers[layerId].playlist = { ...pl, cursor: nextCursor };
    broadcast({ type: "update", path: `layers.${layerId}.playlist`, value: state.layers[layerId].playlist });
  }
```
Add `tickPlaylists(now);` to the tick-loop body (alongside `tickCues(now); tickTimers(now);`), and add `clipEnded` to the returned object:
```js
  return {
    cueGo,
    cueStop,
    cueJump,
    clipEnded,
    dispose() {
      clearInterval(interval);
    },
  };
```

- [ ] **Step 4: Run to verify pass**

Run: `cd control-panel/server && node --test test/automation.test.js`
Expected: PASS.

- [ ] **Step 5: Add the `transportStatus`/`clipEnded` WS cases to `index.js`**

In `control-panel/server/src/index.js`'s `switch (message.type)` (after the existing `preview` case), add:
```js
      case "transportStatus":
        // Playback-position telemetry: relay-only, never persisted, mirroring the
        // `preview` pattern exactly — see docs/superpowers/specs/2026-07-08-parity-
        // finish-line-design.md Section 3 for why this is NOT part of `state`.
        if (typeof message.layerId === "string" && typeof message.position === "number") {
          broadcast({ type: "transportStatus", layerId: message.layerId, position: message.position }, socket);
        }
        return;
      case "clipEnded":
        if (typeof message.layerId === "string") engine.clipEnded(message.layerId);
        return;
```

- [ ] **Step 6: Run the full server test suite**

Run: `cd control-panel/server && node --test test/*.test.js`
Expected: all tests pass (existing + new).

- [ ] **Step 7: Commit**

```bash
git add control-panel/server/src/automation.js control-panel/server/src/index.js control-panel/server/test/automation.test.js
git commit -m "Add playlist advance scheduling and transportStatus/clipEnded relay"
```

---

## Task 14: Render-client — playback control, loop in/out, palindrome, pan/vol, audio-owner-gated relay

**Files:**
- Modify: `control-panel/render-client/src/layers.js` (apply `transport` to each layer's `<video>`; playlist-aware source resolution)
- Modify: `control-panel/render-client/src/compositor.js` (`setLayers` gains `sourceBank`/`media` params and calls `effectiveSource`/`shouldLoop` per layer — the fix for B2/B3 below)
- Modify: `control-panel/render-client/src/main.js` (audio-owner-gated `transportStatus`/`clipEnded` sends; `setLayers` call site)

**Interfaces:**
- Consumes: `layer.transport`, `layer.sourceMode`/`layer.playlist` (Task 12), the `isAudioOwner` boolean already computed in `applyDerivedState()` (`main.js:27`), `LayerStack.setSourceContext`/`this.media` (Task 9).
- Produces: `LayerStack.applyTransport(layer, entry)` — called once per layer per frame from `render()`; `LayerStack.effectiveSource(layer)` and `LayerStack.shouldLoop(layer)` — called from `Compositor.setLayers`, not from `render()` (a corrected self-review fix — see Step 0).

- [ ] **Step 0: Wire playlist cursor to the actually-displayed source, and let video-mode playlist items report `ended` (corrects the plan's own self-review fix, which put this in the wrong method — `render()` never calls `setLayerSource`; only `Compositor.setLayers` does, which is also where a playlist video item's `loop` must become `false` so the native `ended` event Task 13/B3 depends on can ever fire)**

Task 13 advances `layer.playlist.cursor` server-side, but nothing yet makes the render-client switch what it displays when that happens, and today's `setLayerSource` hardcodes `video.loop = true` unconditionally — which means a looping `<video>` never fires `ended`, so the `clipEnded` relay this task adds in Step 2 below would never actually send. Both are fixed together here, at the real call site.

Add a resolver method to `LayerStack` (uses `this.media`, populated by `setSourceContext` — Task 9 Step 2):
```js
  // When sourceMode is "playlist", the layer's displayed content is
  // playlist.items[cursor].ref, not layer.source directly — layer.source is only the
  // fallback for sourceMode "single". ref shape matches SourceRef: {type:"media",
  // mediaId} resolves through the media library the same way a direct video URL would
  // (media items are served at /media/<filename>, matching mediaUrlFor's convention in
  // source-bank.js); {type:"slot", slotId} resolves through this.sourceBank.
  effectiveSource(layer) {
    if (layer.sourceMode !== "playlist") return layer.source;
    const item = layer.playlist?.items?.[layer.playlist.cursor];
    if (!item) return layer.source;
    const ref = item.ref;
    if (ref?.type === "slot") return { type: "slot", slotId: ref.slotId };
    if (ref?.type === "media") {
      const mediaItem = this.media?.[ref.mediaId];
      return mediaItem ? { type: "video", url: `/media/${mediaItem.filename}` } : null;
    }
    return null;
  }

  // Whether this layer's <video> should loop. Single-mode and looping-still playlists
  // loop as before; a playlist VIDEO item with no fixed duration means "play through to
  // end" — it must NOT loop, or the native `ended` event this relies on never fires.
  shouldLoop(layer) {
    if (layer.sourceMode !== "playlist") return true;
    const item = layer.playlist?.items?.[layer.playlist.cursor];
    return item?.duration != null;
  }
```

Change `setLayerSource(id, source)`'s signature to `setLayerSource(id, source, { loop = true } = {})` and replace its hardcoded `video.loop = true;` (inside the `"video"` branch, where the `<video>` element is created) with `video.loop = loop;`.

In `control-panel/render-client/src/compositor.js`, change `setLayers`'s signature and body:
```js
  // layersById: state's `layers` map. sourceBank/media: state.sourceBank/state.media,
  // needed so slot-sourced and playlist-media-sourced layers can resolve what they
  // actually display (see LayerStack.effectiveSource/setSourceContext).
  setLayers(layersById, sourceBank, media) {
    const incoming = Object.values(layersById || {}).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const incomingIds = new Set(incoming.map((l) => l.id));

    this.layerStack.setSourceContext(sourceBank, media);
    for (const layer of incoming) {
      const effective = this.layerStack.effectiveSource(layer);
      if (effective) this.layerStack.setLayerSource(layer.id, effective, { loop: this.layerStack.shouldLoop(layer) });
    }
    for (const id of [...this.layerStack.entries.keys()]) {
      if (!incomingIds.has(id)) this.layerStack.removeLayer(id);
    }

    this.layers = incoming;
    this._applyMute();
  }
```
In `control-panel/render-client/src/main.js`'s `applyDerivedState()`, update the call site: `compositor.setLayers(state.layers, state.sourceBank, state.media);`.

`setLayerSource` itself needs no further change beyond the `loop` option — it already dedupes on `entry.currentUrl`, so a playlist advancing to a *different* item's URL naturally triggers a fresh decode (and a fresh `loop` value), and re-advancing to a URL it's already showing is a no-op that also leaves `video.loop` at whatever it was last set to — which is correct, since the same item necessarily has the same `duration`/loop-ness each time it's shown.

- [ ] **Step 1: Implement loop in/out + palindrome + rate + pan/vol in `layers.js`**

Add a method to `LayerStack`, called from `render()` right after `_uploadSourceFrame`/slot resolution for each layer:
```js
  // Applies transport control (play/pause, rate, loop in/out via manual seek, palindrome
  // direction, pan/vol via Web Audio) to a layer's <video> element. Reverse playback
  // (negative rate) is NOT implemented — no browser allows a negative
  // HTMLMediaElement.playbackRate; VPT8's own reverse-rate support has no browser
  // equivalent and is an explicit, stated non-goal (design spec, Section 3).
  applyTransport(layer, entry) {
    const video = entry.videoEl;
    if (!video) return;
    const t = layer.transport;
    if (!t) return;

    if (t.playing && video.paused) video.play().catch(() => {});
    if (!t.playing && !video.paused) video.pause();
    video.playbackRate = Math.max(0.0625, t.rate ?? 1); // browsers reject 0 and clamp very small values inconsistently; floor it

    if (t.loopIn != null && t.loopOut != null && t.loopOut > t.loopIn) {
      if (!entry._loopHandler) {
        entry._loopDir = 1;
        entry._loopHandler = () => {
          const layerT = entry._latestTransport;
          if (!layerT || layerT.loopIn == null || layerT.loopOut == null) return;
          if (layerT.loopMode === "palindrome") {
            if (entry._loopDir === 1 && video.currentTime >= layerT.loopOut) { entry._loopDir = -1; video.playbackRate = -Math.abs(video.playbackRate); }
            else if (entry._loopDir === -1 && video.currentTime <= layerT.loopIn) { entry._loopDir = 1; video.playbackRate = Math.abs(video.playbackRate); }
            // Note: HTMLMediaElement can't actually play backward (see the applyTransport
            // doc comment above) — palindrome's "reverse leg" is approximated by pausing
            // and stepping currentTime backward on a timer instead of relying on a
            // negative playbackRate, which browsers reject. See Step 2 for that stepper.
          } else if (video.currentTime >= layerT.loopOut) {
            video.currentTime = layerT.loopIn;
          }
        };
        video.addEventListener("timeupdate", entry._loopHandler);
      }
      entry._latestTransport = t;
    }

    // One shared AudioContext for the whole LayerStack (this.audioCtx, created lazily
    // below), not one per layer — browsers cap the number of live AudioContexts (around
    // 6 in Chrome), and this render client can have far more layers than that.
    // entry._audioNodes is tied to THIS video element's identity (entry._audioNodesFor)
    // so a source change that replaces entry.videoEl (via _stopSource, Step 1a below)
    // gets fresh nodes instead of silently keeping pan/vol routed to a dead element —
    // createMediaElementSource can only be called once per element for its lifetime, so
    // this check must never re-call it on the same still-live element either.
    if (entry._audioNodesFor !== video && window.AudioContext) {
      try {
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        const source = this.audioCtx.createMediaElementSource(video);
        const gainNode = this.audioCtx.createGain();
        const pannerNode = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;
        if (pannerNode) { source.connect(pannerNode); pannerNode.connect(gainNode); }
        else source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        entry._audioNodes = { gainNode, pannerNode };
        entry._audioNodesFor = video;
      } catch {
        entry._audioNodes = null;
        entry._audioNodesFor = video; // still mark as "attempted for this element" so we don't retry every frame
      }
    }
    if (entry._audioNodes) {
      entry._audioNodes.gainNode.gain.value = t.vol ?? 1;
      if (entry._audioNodes.pannerNode) entry._audioNodes.pannerNode.pan.value = t.pan ?? 0;
    } else {
      video.volume = t.vol ?? 1;
    }
  }
```
Note the palindrome "reverse leg" caveat is stated inline as a code comment rather than fully implemented via a currentTime-stepping timer in this task — that stepper (a `requestAnimationFrame`-driven manual backward seek loop while `entry._loopDir === -1`) is real additional work; add it as a follow-up `TODO`-free explicit next step:

- [ ] **Step 1a: Implement the palindrome reverse-leg stepper**

Add to `applyTransport`, replacing the two-line palindrome-detection block above with a full implementation:
```js
          if (layerT.loopMode === "palindrome") {
            if (entry._loopDir === 1 && video.currentTime >= layerT.loopOut) {
              entry._loopDir = -1;
              video.pause();
              this._startPalindromeReverse(entry, layerT);
            } else if (entry._loopDir === -1) {
              // handled by _startPalindromeReverse's own rAF loop, not here
            }
          } else if (video.currentTime >= layerT.loopOut) {
            video.currentTime = layerT.loopIn;
          }
```
Add the stepper method:
```js
  _startPalindromeReverse(entry, transport) {
    const video = entry.videoEl;
    const step = () => {
      if (entry._loopDir !== -1 || !video) return;
      const dt = (1 / 60) * Math.abs(transport.rate ?? 1);
      video.currentTime = Math.max(transport.loopIn, video.currentTime - dt);
      if (video.currentTime <= transport.loopIn) {
        entry._loopDir = 1;
        video.play().catch(() => {});
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
```

- [ ] **Step 1b: Disconnect audio nodes when a layer's source changes (closes the M1 leak — `_stopSource` swaps `entry.videoEl` but nothing previously released the old element's Web Audio graph)**

In `_stopSource(entry)` (the existing method that tears down `entry.videoEl`/`entry.stream`/`entry.imgEl` on a source change), add, right where `entry.videoEl` is nulled out:
```js
    if (entry._audioNodes) {
      entry._audioNodes.gainNode.disconnect();
      entry._audioNodes.pannerNode?.disconnect();
      entry._audioNodes = null;
      entry._audioNodesFor = null;
    }
```
This doesn't close `this.audioCtx` itself (it's shared across all layers, per Step 1's fix — only individual nodes tied to the departing `<video>` are disconnected), so other layers' audio keeps working uninterrupted.

- [ ] **Step 2: Call `applyTransport` from `render()` and hook the native `ended` event for playlist advance**

In `LayerStack.render()`, after resolving `entry`/`sourceTexture` for each layer, add: `if (!isColor && !isSlot) this.applyTransport(layer, entry);`

In `setLayerSource` (where `entry.videoEl` is created for `source.type === "video"`), add an `ended` listener when the layer is in playlist mode with a video item (no `duration`):
```js
        video.addEventListener("ended", () => {
          if (this.onClipEnded) this.onClipEnded(id);
        });
```
Add `this.onClipEnded = null;` to `LayerStack`'s constructor — a settable callback `compositor.js`/`main.js` wire up (Step 3), keeping `layers.js` free of any direct WS/audio-owner knowledge (matching the existing separation where `layers.js` never imports `main.js`).

- [ ] **Step 3: Wire the audio-owner-gated relay in `main.js`**

Hoist `isAudioOwner` to module scope (currently local to `applyDerivedState()`, `main.js:27`):
```js
let isAudioOwner = false;
function applyDerivedState() {
  isAudioOwner = state.audioOwnerScreenId === screenId;
  compositor.setLayers(state.layers, state.sourceBank, state.media);
  compositor.setWarp(state.screens?.[screenId]?.warp);
  compositor.setMuted(!isAudioOwner);
  compositor.setMaster(state.master ?? 1);
  pipOverlay.sync(state.pip, isAudioOwner);
}
```
Wire the clip-ended callback once. `compositor` is constructed early in `main.js` (before `applyDerivedState` is even defined), but `socket` isn't created until `main.js:35`'s `connectControlPlane(...)` call — this snippet references `socket`, so it must be placed **after** that line, not merely after `compositor`'s construction:
```js
compositor.layerStack.onClipEnded = (layerId) => {
  if (!isAudioOwner || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "clipEnded", layerId }));
};
```
Add a position-telemetry interval (mirroring the existing 250ms preview interval, `main.js:57-81`, but per-layer and much less frequent since it's just a number, not a JPEG):
```js
setInterval(() => {
  if (!isAudioOwner || socket.readyState !== WebSocket.OPEN) return;
  for (const [layerId, entry] of compositor.layerStack.entries) {
    if (entry.videoEl && !entry.videoEl.paused) {
      socket.send(JSON.stringify({ type: "transportStatus", layerId, position: entry.videoEl.currentTime }));
    }
  }
}, 500);
```

- [ ] **Step 4: Verify no syntax errors**

Run: `cd control-panel/render-client && node --check src/layers.js && node --check src/main.js`
Expected: clean. Real verification deferred to Task 16.

- [ ] **Step 5: Commit**

```bash
git add control-panel/render-client/src/layers.js control-panel/render-client/src/compositor.js control-panel/render-client/src/main.js
git commit -m "Add transport playback control, loop/palindrome, pan/vol, audio-owner-gated relay"
```

---

## Task 15: Panel — Transport UI + playlist editor

**Files:**
- Modify: `control-panel/panel/src/components/FxDrawer.tsx` (new "Transport" section)
- Modify: `control-panel/panel/src/app/actions.ts` (transport/playlist actions)
- Modify: `control-panel/panel/src/app/App.tsx` (wire `transportStatus` relay into panel state for display)

**Interfaces:**
- Produces: `actions.updateTransport(id, field, value)` (thin wrapper reusing the existing generic `updateLayer` — transport fields are just `layers.<id>.transport.<field>` paths, no new send-shape needed), `actions.setPlaylist(id, items)`, `actions.setSourceMode(id, mode)`.

- [ ] **Step 1: Add transport/playlist actions**

In `control-panel/panel/src/app/actions.ts`, add:
```ts
    setSourceMode(id: string, mode: "single" | "playlist") {
      send({ type: "update", path: `layers.${id}.sourceMode`, value: mode });
    },
    setPlaylist(id: string, items: Array<{ ref: unknown; duration?: number }>) {
      send({ type: "update", path: `layers.${id}.playlist`, value: { items, cursor: 0 } });
    },
```
(No new `updateTransport` action is needed — `layers.<id>.transport.<field>` is already reachable via the existing generic `actions.updateLayer(id, \`transport.${field}\`, value)`, following the same pattern `"fx.zoom"`/`"mask.cx"` already use.)

- [ ] **Step 2: Add the "Transport" section to `FxDrawer`**

Add `transport?: Transport; sourceMode?: string; playlist?: { items: Array<{ ref: unknown; duration?: number }> };` to `FxDrawerProps` (import `Transport` from `./types` — add that type alongside `Warp`/`Fx` in `types.ts`: `export interface Transport { playing: boolean; rate: number; loopIn: number | null; loopOut: number | null; loopMode: "off" | "loop" | "palindrome"; pan: number; vol: number; }`).

Add a new section after "Mask" (or "Warp", per Task 5's insertion). `FxDrawer.tsx`'s `SliderSpec` interface requires a `neutral` field (the "stage off" value used to dim the slider when untouched, same as every existing slider table — `TRANSFORM_SLIDERS`/`COLOR_SLIDERS`/etc. all set one) — the root passed to each `FxSlider` must be `transport` itself (not `fxRoot`, which is `fx`, a sibling object with no `rate`/`pan`/`vol` fields):
```tsx
      {transport && (
        <FxSection caption="Transport">
          <Button label={transport.playing ? "Pause" : "Play"} onClick={() => onUpdate?.("transport.playing", !transport.playing)} />
          <FxSlider spec={{ label: "RATE", field: "transport.rate", min: 0.1, max: 4, step: 0.05, neutral: 1 }} root={transport as unknown as Record<string, unknown>} onUpdate={onUpdate} />
          <FxSlider spec={{ label: "PAN", field: "transport.pan", min: -1, max: 1, step: 0.01, neutral: 0 }} root={transport as unknown as Record<string, unknown>} onUpdate={onUpdate} />
          <FxSlider spec={{ label: "VOL", field: "transport.vol", min: 0, max: 1, step: 0.01, neutral: 1 }} root={transport as unknown as Record<string, unknown>} onUpdate={onUpdate} />
          <ToggleSquare
            label={transport.loopMode === "off" ? "Off" : transport.loopMode === "loop" ? "Loop" : "Pal"}
            title="Cycle loop mode: off / loop / palindrome"
            onClick={() =>
              onUpdate?.("transport.loopMode", transport.loopMode === "off" ? "loop" : transport.loopMode === "loop" ? "palindrome" : "off")
            }
          />
        </FxSection>
      )}
```
`readField`'s logic is generic (strips only the leading segment of the field path regardless of what it's named), already confirmed by how the existing Mask section passes `root={mask as unknown as Record<string, unknown>}` with field paths like `"mask.cx"` — the Transport section follows the identical pattern.

- [ ] **Step 3: Wire `transportStatus` telemetry into panel state for read-only position display (optional display polish)**

In `control-panel/panel/src/app/App.tsx`'s `useSocket` handlers, add a case for the new message type. Since `useSocket`'s dispatcher (`useSocket.ts:52-65`) only recognizes `state`/`update`/`create`/`delete`/`batch`/`preview` today, extend it:
```ts
        else if (message.type === "preview") h().onPreview(message.screenId, message.frame);
        else if (message.type === "transportStatus") h().onTransportStatus?.(message.layerId, message.position);
```
Add an `onTransportStatus?: (layerId: string, position: number) => void;` handler slot to `useSocket`'s options type, and in `App.tsx`, a lightweight local (non-`state`, non-persisted — matches the design's "telemetry, not state" rule) `transportPositions` ref/map updated on receipt, read by the Transport section for a scrub-position readout. This is UI polish, not required for the transport controls themselves to function — skip the display wiring if time-constrained, but do NOT skip the dispatcher extension, since dropping unrecognized message types silently is already how `useSocket.ts` behaves for anything not in its `if/else if` chain (no `default` case that warns) — an unwired `transportStatus` message would otherwise vanish with no error, which is fine functionally but means the position telemetry Task 14 sends would go nowhere until this step lands.

- [ ] **Step 4: Verify panel typechecks**

Run: `cd control-panel/panel && npm run build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add control-panel/panel/src/components/types.ts control-panel/panel/src/components/FxDrawer.tsx control-panel/panel/src/app/actions.ts control-panel/panel/src/app/App.tsx control-panel/panel/src/app/useSocket.ts
git commit -m "Add Transport UI section and playlist actions to the panel"
```

---

## Task 16: Playwright — verify play/pause and still-image playlist auto-advance

**Files:**
- Create: `control-panel/e2e/transport-and-playlist.spec.js`

- [ ] **Step 1: Write the test**

```js
import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import handler from "serve-handler";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WS_PORT = 8186;
const RENDER_PORT = 8187;
let serverProc, staticServer;

async function startServer() {
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), MEDIA_DIR: path.join(REPO_ROOT, "server", "media"), OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (buf) => { if (buf.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); } };
    serverProc.stdout.on("data", onData);
    setTimeout(() => reject(new Error("server did not start")), 10_000);
  });
}
async function startStatic() {
  staticServer = http.createServer((req, res) => handler(req, res, { public: path.join(REPO_ROOT, "render-client") }));
  await new Promise((resolve) => staticServer.listen(RENDER_PORT, resolve));
}
function wsSend(socket, message) { return new Promise((resolve) => socket.send(JSON.stringify(message), resolve)); }

test.beforeAll(async () => { await startServer(); await startStatic(); });
test.afterAll(async () => { staticServer?.close(); serverProc?.kill(); });

test("play/pause reflects in actual <video> playback state", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, {
    type: "create", path: "layers",
    value: {
      id: "l-play", name: "play test", order: 1, source: { type: "video", url: "/media/sample.mp4" }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null,
      warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } },
      transport: { playing: false, rate: 1, loopIn: null, loopOut: null, loopMode: "off", pan: 0, vol: 1 },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(500);

  const isPaused = () => page.evaluate(() => {
    const video = document.querySelector("video");
    return video ? video.paused : null;
  });
  expect(await isPaused()).toBe(true);

  const socket2 = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket2.once("open", resolve));
  await wsSend(socket2, { type: "update", path: "layers.l-play.transport.playing", value: true });
  socket2.close();
  await page.waitForTimeout(500);
  expect(await isPaused()).toBe(false);
});

test("a still-image playlist auto-advances after its configured duration", async ({ page }) => {
  const socket = new WebSocket(`ws://localhost:${WS_PORT}`);
  await new Promise((resolve) => socket.once("open", resolve));
  await wsSend(socket, {
    type: "create", path: "layers",
    value: {
      id: "l-pl", name: "playlist test", order: 1, source: { type: "video", url: "/media/fixture-red.jpg" }, opacity: 1, blendMode: "normal",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0 }, fx: null,
      warp: { mode: "corner", corners: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], mesh: { size: 4, points: [] } },
      sourceMode: "playlist",
      playlist: { items: [{ ref: { type: "media", mediaId: "a" }, duration: 0.2 }, { ref: { type: "media", mediaId: "b" }, duration: 0.2 }], cursor: 0 },
    },
  });
  socket.close();

  await page.goto(`http://localhost:${RENDER_PORT}/index.html?screen=screen-1&ws=ws://localhost:${WS_PORT}`);
  await page.waitForTimeout(600); // > one 0.2s duration, should have advanced at least once

  const state = await new Promise((resolve) => {
    const s = new WebSocket(`ws://localhost:${WS_PORT}`);
    s.once("message", (raw) => { const msg = JSON.parse(raw.toString()); if (msg.type === "state") { s.close(); resolve(msg.state); } });
  });
  expect(state.layers["l-pl"].playlist.cursor).not.toBe(0);
});
```

- [ ] **Step 2: Run and verify pass**

Run: `cd control-panel/e2e && npx playwright test transport-and-playlist.spec.js`
Expected: `2 passed`.

- [ ] **Step 3: Commit**

```bash
git add control-panel/e2e/transport-and-playlist.spec.js
git commit -m "Add Playwright check for play/pause and playlist auto-advance"
```

---

## Task 17: Close out — update ROADMAP.md

**Files:**
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Add a status update marking sub-projects 2–4 CLOSED**

Following the doc's established append-only status-update convention (see the 2026-07-08 entry already added for sub-project 1), add a new dated entry summarizing: per-layer warp/corner-pin built (Tasks 2–6), source-bank + all 24 blend modes + mix-source type built (Tasks 7–11, noting the one documented e2e coverage gap from Task 11), clip transport + playlist built (Tasks 12–16), and the sub-project-1 Playwright verification gap closed (Task 1). List the new e2e harness (`control-panel/e2e/`) as a new "What's verified" category in `control-panel/README.md` too — cross-reference it rather than duplicating.

- [ ] **Step 2: Update `control-panel/README.md`'s "What's verified" section**

Add a paragraph after the existing 2026-07-05/06 panel-UI-overhaul verification paragraph, listing the four new Playwright specs (`media-compositing`, `layer-warp`, `blend-and-mix`, `transport-and-playlist`) and explicitly naming the one open gap from Task 11 (mix-slot rendering has no automated pixel check beyond the darken-mode blend-formula check, pending a multipart-upload test-harness extension).

- [ ] **Step 3: Commit**

```bash
git add docs/ROADMAP.md control-panel/README.md
git commit -m "Update ROADMAP and README: sub-projects 2-4 closed"
```

---

## Self-Review Notes

**Spec coverage:** Section 1 (per-layer warp) → Tasks 2–6. Section 2 (source bank/blend/mix) → Tasks 7–11. Section 3 (transport/playlist) → Tasks 12–16. Sub-project 1 verification closeout → Task 1. All three of the design review's blocking fixes (B1 mix-cycle guard, B2 control/telemetry split, B3 clipEnded-driven advance) are implemented in Tasks 7, 13, and 14 respectively. All seven refinements (warp.js generalization, mask-before-warp reorder, corner-pin presets, pan/vol, loop-mode/reverse-playback non-goal, source-bank UI, dangling-reference handling) are covered in Tasks 3, 4, 5, 15, 14, 10, and 7 respectively.

**Known, explicitly-documented gaps carried forward (not silently dropped):** Task 11's mix-slot Playwright check is a documented skip pending a test-harness extension. Task 9's GLSL blend formula is duplicated (not shared) between `layers.js` and `source-bank.js`, with no automated parity check at the GLSL-source level (only the JS-side mode-name list has one, Task 8) — `MIX_BLEND_MODES` must be manually kept in lockstep with the other two 24-entry lists. `render-client/` has zero unit-test coverage anywhere (a pre-existing condition, not introduced by this plan) — every render-client correctness claim in this plan is verified only by the Playwright e2e suite.

**Second review pass (adversarial, post-write):** this plan was re-reviewed independently after the first draft, cross-checking every quoted code excerpt against the actual files on disk rather than trusting the plan's own quotes. Four blocking bugs were found and fixed in place (not just flagged): (1) dangling-reference cleanup was originally hooked into a WS delete path that real media deletion never uses — moved to `media.js`'s actual HTTP delete handler (Task 7). (2) The first self-review's playlist-cursor fix put source resolution in `LayerStack.render()`, which never calls `setLayerSource` — moved to `Compositor.setLayers`, the real call site (Task 14 Step 0, now also fixes issue 3). (3) `setLayerSource` hardcoded `video.loop = true`, so a playlist video item's native `ended` event — the entire mechanism Task 13's `clipEnded` design relies on — could never fire; loop is now conditional on playlist/duration state. (4) The Transport UI section and the Warp UI section each had a real TypeScript build error (`FxSlider`'s required `neutral` field omitted; `Select` used without being imported and with a nonexistent `placeholder` prop) — both fixed with corrected code, not just noted. Three medium-severity issues were also fixed: a mix-cycle guard hole reachable through self-reference-while-not-yet-a-mix and through write-ordering (two new tests added), a dead `resolveRef` method whose media-decode path for a mix's direct-media inputs was never actually wired into `updateAll` (now merged into one real code path), and Web Audio nodes never being disconnected on a layer's source change (now cleaned up in `_stopSource`, using one shared `AudioContext` per `LayerStack` instead of one per layer to avoid the browser context ceiling). The parallel-lanes execution plan above is this same re-review's output, not a separate analysis — it traces the plan's real file/symbol dependency graph, not task numbering.
