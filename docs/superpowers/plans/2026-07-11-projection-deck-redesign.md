# Projection Deck Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the control panel as a canvas-centric "projection deck" — a dominant live-preview stage where the operator selects a layer (from the rail *or* by clicking its object on the stage) and manipulates its warp/mask directly on the preview, with a contextual inspector showing only that layer's controls.

**Architecture:** Panel-only (`control-panel/panel/`). A new 3-zone shell (command bar · stage · rails) replaces the single-column body. A single selection state (`selectedLayerId`, `stageEditMode`) in `App` drives the stage overlay, the rail highlight, and the inspector. Click-to-select hit-tests each layer's warp-corner quad (already in state) and picks the topmost. Warp/mask handles reuse the existing `WarpEditor`/`WarpHandle`/`MaskShapeOverlay` logic and the exact state-path messages they already send — **no server or render-client change.**

**Tech Stack:** React 18 + TypeScript + Vite; existing tokens in `panel/src/tokens/`; Storybook 8 for component states; Playwright for interaction e2e; `tsc --noEmit` + ESLint as compile gates. No new runtime deps, no new test framework.

**Visual & interaction reference:** `docs/superpowers/specs/2026-07-11-projection-deck-mockup.html` — the approved, working mockup. It contains the exact CSS (layout, stage chrome, handles, inspector), the canvas scene, the corner/mask drag logic, and the contextual-inspector rendering. **Port from it; do not reinvent the look.** The spec is `docs/superpowers/specs/2026-07-11-projection-deck-redesign-design.md`.

## Global Constraints

- **Panel scope only.** No changes to `server/` or `render-client/`; no new WebSocket message types. Handle drags emit the SAME dotted-path updates the current code sends (`layers.<id>.warp.corners.<i>.x`, `layers.<id>.mask.*`, etc.).
- **Keep the token palette.** Use existing CSS variables from `panel/src/tokens/tokens.css` (`--beam` = operator/amber, `--cool` = render/cyan, `--ink/--panel/--raised/--hair`, etc.). Single dark theme by intent — do NOT add a light theme.
- **Reuse, don't fork, the drag logic.** `WarpHandle`/`MaskShapeOverlay` already register `pointermove`/`pointerup`/**`pointercancel`** (the cancel handler landed on `fix/control-panel-audit-findings`, which this branch is based on). Any new pointer drag MUST also handle `pointercancel`.
- **Optimistic echo preserved.** App's `send` already applies leaf updates locally when the socket is open (`App.tsx`). New controls call actions/`send` — never mutate `stateRef` directly.
- **Gates for every task:** `cd control-panel/panel && npx tsc --noEmit && npx eslint .` must be clean before every commit. Commit messages end with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer.
- **Coordinates are normalized 0..1** over the stage, matching the current `WarpEditor`. `warp.corners` order is `[TL, TR, BR, BL]` (see `WarpEditor.tsx` / `server/src/state.js`).
- **Branch:** work on `redesign/projection-deck` (already created, holds the spec + mockup).

---

## File Structure

**New files**
- `panel/src/app/useSelection.ts` — selection state hook (`selectedLayerId`, `stageEditMode`).
- `panel/src/components/deck/Stage.tsx` — the preview stage: frame + chrome + click-quads + overlay slot.
- `panel/src/components/deck/StageSelectionOverlay.tsx` — warp/mask handles for the selected layer, over the stage.
- `panel/src/components/deck/layerGeometry.ts` — pure geometry: quad from a layer's warp, point-in-quad, topmost pick.
- `panel/src/components/deck/LayerStack.tsx` — compact selectable/reorderable layer list.
- `panel/src/components/deck/SlotGrid.tsx` — compact source-bank slot grid.
- `panel/src/components/deck/Inspector.tsx` — selection-driven inspector (source/opacity/blend + Warp·Mask·FX + contextual body).
- `panel/src/components/deck/ShowDrawer.tsx` — bottom drawer housing Presets/Cues/Timers/LFO/MIDI/Media.
- `panel/src/components/deck/deck.css` — layout + deck-specific styles ported from the mockup.
- `*.stories.tsx` beside each of `Stage`, `LayerStack`, `SlotGrid`, `Inspector`, `ShowDrawer`.
- `e2e/deck-panel.spec.js` — panel interaction e2e (boots server + built panel).

**Modified**
- `panel/src/App.tsx` — new 3-zone layout, owns selection state, wires Stage/Inspector/rails/drawer.
- `panel/src/components/index.ts` — export new components.
- `panel/src/styles.css` — import `deck.css`.

**Reused unchanged (imported, not edited unless noted):** `WarpEditor`, `WarpHandle`, `MaskShapeOverlay`, `FxDrawer`, `MasterControl`, `StatusLamp`, `PipWindows`, `CueList`, `LfoRack`, `TimerBank`, `MidiMapPanel`, `MediaLibrary`, `PresetsBar`, `usePreviewBus`, `actions`, `store`.

---

## Task 1: Deck shell + selection state

**Files:**
- Create: `panel/src/app/useSelection.ts`
- Create: `panel/src/components/deck/deck.css`
- Modify: `panel/src/App.tsx` (body layout + selection wiring)
- Modify: `panel/src/styles.css` (import deck.css)

**Interfaces:**
- Produces: `useSelection()` → `{ selectedLayerId: string | null; setSelectedLayerId(id: string | null): void; stageEditMode: EditMode; setStageEditMode(m: EditMode): void }` where `type EditMode = "warp" | "mask" | "fx"`.
- Produces: a 3-zone grid in `App` with slots for `<LayerStack/>`, `<SlotGrid/>`, `<Stage/>`, `<Inspector/>` (placeholders in this task).

- [ ] **Step 1: Create the selection hook.**

```ts
// panel/src/app/useSelection.ts
import { useState, useCallback } from "react";

export type EditMode = "warp" | "mask" | "fx";

export function useSelection(firstLayerId: string | null) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(firstLayerId);
  const [stageEditMode, setStageEditMode] = useState<EditMode>("warp");
  const select = useCallback((id: string | null) => setSelectedLayerId(id), []);
  return { selectedLayerId, setSelectedLayerId: select, stageEditMode, setStageEditMode };
}
```

- [ ] **Step 2: Port the deck layout CSS.** Create `panel/src/components/deck/deck.css` by copying the layout-level rules from the mockup (`docs/superpowers/specs/2026-07-11-projection-deck-mockup.html`): the `.deck`, `.cmd`, `.body` (3-col grid `232px 1fr 288px`), `.rail`, `.sec-head` rules. Change the mockup's inline `:root` custom-property block to **reference the existing token names** (`var(--panel)`, `var(--hair)`, `var(--beam)`, etc.) — the tokens already exist in `tokens/tokens.css`; do NOT redefine them. Add `@import "./components/deck/deck.css";` to `styles.css`.

- [ ] **Step 3: Rebuild `App.tsx`'s body as the 3-zone grid.** Replace the current single-column body markup with:

```tsx
// inside App render, replacing the existing main content wrapper
const layerIds = Object.values(stateRef.current.layers)
  .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))   // top-of-stack first
  .map((l) => l.id);
const selection = useSelection(layerIds[0] ?? null);

return (
  <div className="deck">
    {/* existing command bar: wordmark, screen tabs, MasterControl, blackout, StatusLamp */}
    <header className="cmd">{/* keep existing top-bar controls here */}</header>
    <div className="body">
      <aside className="rail rail-l">
        {/* <LayerStack/> and <SlotGrid/> land here in Tasks 2 & 3 */}
        <div className="sec-head label">Layer stack</div>
        <div className="sec-head label">Source bank</div>
      </aside>
      <main className="stage-wrap">{/* <Stage/> lands here in Task 4 */}</main>
      <aside className="rail rail-r insp">{/* <Inspector/> lands here in Task 7 */}</aside>
    </div>
  </div>
);
```

Keep every existing hook/handler (`useSocket`, `send`, `actions`, preview bus, etc.) exactly as-is; only the returned JSX layout changes.

- [ ] **Step 4: Verify it compiles and renders.**

Run: `cd control-panel/panel && npx tsc --noEmit && npx eslint .`
Expected: clean (exit 0, no output).

Then visually: with the dev stack running (`server` on :8080, `npm run dev` on :8082), screenshot `http://localhost:8082/index.html?ws=ws://localhost:8080`.
Expected: three-zone dark shell — command bar on top, empty left rail with "LAYER STACK"/"SOURCE BANK" eyebrows, empty center, empty right rail. Connection lamp shows connected.

- [ ] **Step 5: Commit.**

```bash
git add control-panel/panel/src/app/useSelection.ts control-panel/panel/src/components/deck/deck.css control-panel/panel/src/App.tsx control-panel/panel/src/styles.css
git commit -m "Deck redesign: 3-zone shell + selection state"
```

---

## Task 2: LayerStack rail

**Files:**
- Create: `panel/src/components/deck/LayerStack.tsx`, `panel/src/components/deck/LayerStack.stories.tsx`
- Modify: `panel/src/components/index.ts`, `panel/src/App.tsx` (mount it)

**Interfaces:**
- Consumes: `Layer` type from `components/types`; `actions` (`addLayer`, `moveLayer`, `removeLayer`); selection from Task 1.
- Produces: `<LayerStack layers={Layer[]} selectedId={string|null} onSelect={(id)=>void} actions={Actions} />`. `layers` is pre-sorted top-of-stack-first by the caller.

- [ ] **Step 1: Build the component.** Port the mockup's `.layers`/`.layer`/`.thumb`/`.opbar`/`.addbtn` markup+CSS into a React list. Each row: thumbnail (color swatch for color source, gradient placeholder otherwise), name, `BLEND · L<n>` meta, opacity bar. Row is a `<button>` with `aria-selected={id===selectedId}`; `onClick` calls `onSelect(id)`. Include reorder up/down affordances calling `actions.moveLayer(id, dir)` and a remove control calling `actions.removeLayer(id)`. Put the `.layer`/`.thumb`/… CSS in `deck.css`.

- [ ] **Step 2: Story with default + selected states.**

```tsx
// LayerStack.stories.tsx — use fixtures from components/fixtures
export const Default = { args: { layers: sampleLayers, selectedId: null } };
export const Selected = { args: { layers: sampleLayers, selectedId: sampleLayers[0].id } };
```

- [ ] **Step 3: Mount in `App.tsx`** left rail, passing the top-first-sorted layers, `selection.selectedLayerId`, and `selection.setSelectedLayerId`.

- [ ] **Step 4: Verify.** `npx tsc --noEmit && npx eslint .` clean. Storybook (`npm run storybook`) → LayerStack stories render; selected row shows the amber left-bar. In the running app, clicking a layer highlights it (screenshot).

- [ ] **Step 5: Commit.** `git commit -m "Deck redesign: compact selectable LayerStack rail"`

---

## Task 3: SlotGrid rail

**Files:**
- Create: `panel/src/components/deck/SlotGrid.tsx`, `SlotGrid.stories.tsx`
- Modify: `panel/src/components/index.ts`, `panel/src/App.tsx`

**Interfaces:**
- Consumes: `SourceBankSlot[]` from state; existing source-bank action(s) used by `SourceBankPanel` (reuse the same `send`/actions calls it already makes — read `SourceBankPanel.tsx` and keep its write paths).
- Produces: `<SlotGrid slots={SourceBankSlot[]} onEditSlot={(index)=>void} />` rendering a 2-col grid.

- [ ] **Step 1: Build the grid.** Port the mockup's `.slots`/`.slot` (2-col, `aspect-ratio:16/10`, filled slots cyan-tinted, mono slot label). Each cell shows `SLOT n` when empty, the content summary (e.g. `MIX`, media name, `CAM 1`) when filled. Clicking a cell opens the existing slot editor UI (reuse `SourceBankPanel`'s per-slot editing popover/handler — extract the editor if needed, but keep its write logic identical).

- [ ] **Step 2: Story** with a mix of empty and filled slots (fixtures).

- [ ] **Step 3: Mount** under the LayerStack in `App.tsx`.

- [ ] **Step 4: Verify.** tsc/eslint clean; story renders the tight grid; filled slots read cyan.

- [ ] **Step 5: Commit.** `git commit -m "Deck redesign: compact SlotGrid rail"`

---

## Task 4: Stage — preview + chrome

**Files:**
- Create: `panel/src/components/deck/Stage.tsx`, `Stage.stories.tsx`
- Modify: `panel/src/components/index.ts`, `panel/src/App.tsx`

**Interfaces:**
- Consumes: the preview frame stream (`usePreviewBus` — read its current API; it exposes the latest JPEG data-URL per screen for the confidence monitor). `screenId` from App.
- Produces: `<Stage screenId={string} frame={string|null} width={number} height={number} overlay={ReactNode} onBackgroundPointerDown={(e)=>void} />`. Renders the frame as the stage background, the registration chrome, and slots `overlay` (the selection handles from Task 6) above it. `onBackgroundPointerDown` fires only for clicks not on a handle (used by Task 5).

- [ ] **Step 1: Build Stage.** Port `.stage-wrap`/`.stage`/`.reg`/`.tick`/`.stage-badge`/`.stage-fps`/`.stage-toolbar` from the mockup. Background = `<img src={frame}>` when a frame exists, else a `NO SIGNAL · awaiting render-client` placeholder (cyan, matching the current confidence-monitor copy). The stage keeps a fixed 16:9 aspect box so normalized coords map cleanly. Render `{overlay}` absolutely positioned over the frame. `onBackgroundPointerDown` handler on the stage element, guarded to ignore events whose `target.closest(".deck-handle")` is non-null (Task 6 handles carry that class).

- [ ] **Step 2: Story** with (a) a data-URL frame fixture and (b) `frame={null}` (NO SIGNAL).

- [ ] **Step 3: Mount in `App.tsx`** center zone, feeding it the current screen's latest preview frame from the preview bus. Pass `overlay={null}` for now.

- [ ] **Step 4: Verify.** tsc/eslint clean. Story shows the framed stage with registration ticks + LIVE badge; NO-SIGNAL variant reads clearly. In the running app the stage shows the live confidence preview (or NO SIGNAL if none yet).

- [ ] **Step 5: Commit.** `git commit -m "Deck redesign: preview Stage with confidence-monitor chrome"`

---

## Task 5: Click-to-select on the stage (layer geometry)

**Files:**
- Create: `panel/src/components/deck/layerGeometry.ts`
- Create: `e2e/deck-panel.spec.js` (+ panel e2e harness)
- Modify: `panel/src/App.tsx` (wire background click → select), `panel/src/components/deck/Stage.tsx` (hover-outline the quads)

**Interfaces:**
- Produces:
  - `type Pt = { x: number; y: number }`
  - `type Quad = [Pt, Pt, Pt, Pt]` (TL, TR, BR, BL)
  - `layerQuad(layer: Layer): Quad` — from `layer.warp.corners` (corner mode) or the bounding hull of `layer.warp.mesh.points` (mesh mode); a color/full-frame layer returns the unit quad `[{0,0},{1,0},{1,1},{0,1}]`.
  - `pointInQuad(p: Pt, q: Quad): boolean` — even-odd ray test over the 4 edges.
  - `pickTopLayer(layers: Layer[], p: Pt): string | null` — layers sorted top-of-stack-first; returns the first whose quad contains `p`, else `null`.

- [ ] **Step 1: Write the geometry module.**

```ts
// panel/src/components/deck/layerGeometry.ts
import type { Layer } from "../types";

export type Pt = { x: number; y: number };
export type Quad = [Pt, Pt, Pt, Pt];

const UNIT: Quad = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];

export function layerQuad(layer: Layer): Quad {
  const w = layer.warp;
  if (w?.mode === "mesh" && w.mesh?.points?.length) {
    const xs = w.mesh.points.map((p) => p.x), ys = w.mesh.points.map((p) => p.y);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    return [{ x: minx, y: miny }, { x: maxx, y: miny }, { x: maxx, y: maxy }, { x: minx, y: maxy }];
  }
  const c = w?.corners;
  if (Array.isArray(c) && c.length === 4) return [c[0], c[1], c[2], c[3]] as Quad;
  return UNIT;
}

export function pointInQuad(p: Pt, q: Quad): boolean {
  let inside = false;
  for (let i = 0, j = 3; i < 4; j = i++) {
    const a = q[i], b = q[j];
    const hit = (a.y > p.y) !== (b.y > p.y) &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x;
    if (hit) inside = !inside;
  }
  return inside;
}

export function pickTopLayer(layers: Layer[], p: Pt): string | null {
  for (const layer of layers) if (pointInQuad(p, layerQuad(layer))) return layer.id;
  return null;
}
```

- [ ] **Step 2: Wire the stage background click in `App.tsx`.** In `onBackgroundPointerDown`, convert the event to normalized coords against the stage rect, then:

```tsx
const rect = e.currentTarget.getBoundingClientRect();
const p = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
const topFirst = Object.values(stateRef.current.layers).sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
selection.setSelectedLayerId(pickTopLayer(topFirst, p)); // null on empty space = deselect
```

Add a hover state in `Stage` that draws a faint outline of the hovered layer's quad (use `layerQuad` + an SVG polygon, `--hair`/`--beam-line`), so objects feel selectable.

- [ ] **Step 3: Stand up the panel e2e harness + write the failing test.** Create `e2e/deck-panel.spec.js` mirroring `e2e/transport-and-playlist.spec.js`'s server-boot pattern, but for the panel: build the panel once (`npm --prefix ../panel run build` → `panel/dist`), serve `panel/dist` statically on a test port, boot the control-plane server (temp STATE_FILE/MEDIA_DIR, OSC_PORT=0), then drive with Playwright. First test:

```js
test("clicking a layer's region on the stage selects it", async ({ page }) => {
  // seed two layers with known, non-overlapping warp.corners via a ws 'update'
  // (left layer occupies x<0.5, right layer x>0.5)
  await page.goto(panelUrl);
  await page.locator(".stage").click({ position: { x: leftX, y: midY } });
  await expect(page.locator("[data-selected-layer]")).toHaveAttribute("data-selected-layer", "layer-left");
});
```

Add `data-selected-layer={selectedLayerId}` to the deck root so the test can assert selection.

- [ ] **Step 4: Run the test — verify it passes** (geometry + wiring correct).

Run: `cd control-panel/e2e && npx playwright test deck-panel.spec.js`
Expected: PASS.

- [ ] **Step 5: Commit.** `git add` the geometry, App, Stage, e2e; `git commit -m "Deck redesign: click-to-select layers on the stage via warp-quad hit-testing"`

---

## Task 6: StageSelectionOverlay — warp & mask handles on the stage

**Files:**
- Create: `panel/src/components/deck/StageSelectionOverlay.tsx`
- Modify: `panel/src/App.tsx` (pass overlay into Stage), `e2e/deck-panel.spec.js` (drag assertion)

**Interfaces:**
- Consumes: selected `Layer`; `stageEditMode`; `actions`/`send`. The existing `WarpEditor`/`WarpHandle` (corner + mesh drag) and `MaskShapeOverlay` (ellipse/rect drag) — read them and reuse their handle components + the update paths they emit. Handles must carry `className="deck-handle"` so Stage's background-click ignores them.
- Produces: `<StageSelectionOverlay layer={Layer} mode={EditMode} actions={Actions} />`.

- [ ] **Step 1: Build the overlay.** For `mode==="warp"`: render the selected layer's corner/mesh handles positioned over the stage, reusing `WarpHandle` (and the mesh path from `WarpEditor`), wired to the SAME update calls `WarpEditor` uses today for a *layer* warp target (`layers.<id>.warp.corners.<i>.x/.y` / mesh points). For `mode==="mask"`: render `MaskShapeOverlay` for the layer's mask, wired to its existing mask update paths. For `mode==="fx"`: render a faint bounding box only. Add a floating `.sel-label` (layer name + mode) as in the mockup. Ensure every draggable node has `class="deck-handle"` and includes `pointercancel` in its drag teardown (reuse the fixed handlers — do not write new bare `pointerup`-only drags).

- [ ] **Step 2: Pass it into Stage** from `App.tsx`: `overlay={selectedLayer ? <StageSelectionOverlay layer={selectedLayer} mode={selection.stageEditMode} actions={actions} /> : null}`.

- [ ] **Step 3: Extend the e2e — write the failing drag assertion.**

```js
test("dragging a corner on the stage sends a layers.<id>.warp update", async ({ page }) => {
  // select the layer, ensure Warp mode, capture ws frames sent to the server
  const sent = captureClientMessages(page); // via exposed hook or a ws proxy
  await dragHandle(page, ".deck-handle.tl", { dx: 40, dy: 20 });
  expect(sent.some(m => m.type === "update" && /^layers\..*\.warp\./.test(m.path))).toBe(true);
});
```

- [ ] **Step 4: Run — verify pass**, AND run the existing warp/mask specs to confirm no regression:

Run: `cd control-panel/e2e && npx playwright test`
Expected: new deck drag test PASS; `layer-warp.spec.js` and others still PASS.

- [ ] **Step 5: Commit.** `git commit -m "Deck redesign: on-stage warp/mask handles for the selected layer"`

---

## Task 7: Contextual Inspector

**Files:**
- Create: `panel/src/components/deck/Inspector.tsx`, `Inspector.stories.tsx`
- Modify: `panel/src/components/index.ts`, `panel/src/App.tsx`

**Interfaces:**
- Consumes: selected `Layer`; `stageEditMode` + `setStageEditMode`; `actions`; existing `FxDrawer` (fx body) and the numeric warp/mask controls from `WarpEditor`/mask UI.
- Produces: `<Inspector layer={Layer|null} mode={EditMode} onModeChange={(m)=>void} actions={Actions} />`.

- [ ] **Step 1: Build the inspector.** Port the mockup's `.insp*`, `.field`, `.modes`, `.ctx`, `.coord`, `.subhead` styling. Header: swatch + name + `L<n>` + source line. Body: Source select, Opacity fader, Blend select (reuse the existing selects/faders from `LayerStrip`/primitives so the write paths are unchanged), then the `Warp · Mask · FX` segmented control (calls `onModeChange`), then the contextual body:
  - `warp`: corner/mesh toggle + live corner coordinate readout (bind to `layer.warp`).
  - `mask`: enable toggle + shape + feather + center/radius readout (bind to `layer.mask`).
  - `fx`: mount the existing `FxDrawer` for the layer.
  When `layer` is `null`, show a muted "Select a layer" empty state.

- [ ] **Step 2: Stories:** `Warp`, `Mask`, `Fx`, and `Empty` states (fixtures).

- [ ] **Step 3: Mount** in `App.tsx` right rail; bind `mode`/`onModeChange` to the same `selection.stageEditMode` that drives the stage overlay (so the segment switches both at once).

- [ ] **Step 4: Verify.** tsc/eslint clean; each story renders; in-app, selecting a layer fills the inspector and switching Warp/Mask/FX swaps both the inspector body and the on-stage handles (screenshot both).

- [ ] **Step 5: Commit.** `git commit -m "Deck redesign: selection-driven contextual Inspector"`

---

## Task 8: Relocate secondary panels to a Show drawer

**Files:**
- Create: `panel/src/components/deck/ShowDrawer.tsx`, `ShowDrawer.stories.tsx`
- Modify: `panel/src/App.tsx`, `panel/src/components/index.ts`

**Interfaces:**
- Produces: `<ShowDrawer tab={ShowTab} onTab={(t)=>void} ...panelProps />` where `type ShowTab = "presets"|"cues"|"timers"|"lfo"|"midi"|"media"`. Renders the existing `PresetsBar`/`CueList`/`TimerBank`/`LfoRack`/`MidiMapPanel`/`MediaLibrary` unchanged inside a collapsible bottom drawer.

- [ ] **Step 1: Build the drawer** as a bottom sheet spanning the body width, collapsed to a tab strip by default, expanding to show the active panel. Pass through the exact props these panels already receive in the current `App.tsx` (copy their current wiring verbatim — do not change their internals).

- [ ] **Step 2: Story** showing the drawer open on each tab.

- [ ] **Step 3: Mount** in `App.tsx`; remove the old always-on placement of these panels from the flat layout.

- [ ] **Step 4: Verify.** tsc/eslint clean. Each panel still works (open drawer → Cues GO, add an LFO, upload media) — smoke via the running app + a screenshot per tab.

- [ ] **Step 5: Commit.** `git commit -m "Deck redesign: move Presets/Cues/Timers/LFO/MIDI/Media into a Show drawer"`

---

## Task 9: Mobile pass

**Files:**
- Modify: `panel/src/App.tsx`, `panel/src/components/deck/deck.css`, `panel/src/components/MobileTabBar.tsx` (reuse/extend)

**Interfaces:**
- Consumes: `useIsMobile()` (existing).

- [ ] **Step 1: Responsive layout.** Under `useIsMobile()` / a coarse-pointer media query: collapse the 3-col grid to a single column with the **stage dominant** at top, and turn the left rail + inspector + show drawer into bottom-sheet tabs driven by `MobileTabBar` (`Layers · Slots · Inspector · Show`). Ensure handles use the token `--tap-min` (44px) touch target under coarse pointers (the tokens already gate this).

- [ ] **Step 2: Verify.** tsc/eslint clean. Screenshot at 390×844 (phone) and 1440×850 (desktop): stage stays the focal point in both; tabs switch rails on mobile. Confirm dragging a warp corner works with touch (Playwright `page.touchscreen` or emulated), and a `pointercancel` mid-drag does not freeze the panel (regression guard for the audit fix).

- [ ] **Step 3: Commit.** `git commit -m "Deck redesign: mobile layout — dominant stage + bottom-sheet rails"`

---

## Task 10: Final verification & cleanup

**Files:**
- Modify: any leftover dead code from the old layout in `App.tsx`; `panel/src/components/index.ts`.

- [ ] **Step 1: Remove dead code.** Delete now-unused old-layout JSX/handlers and any components fully replaced (e.g. the old `ChannelRack` flat container if `LayerStack` supersedes it — only if nothing else imports it; check with a grep).

- [ ] **Step 2: Full gate.**

Run: `cd control-panel/panel && npx tsc --noEmit && npx eslint .`
Expected: clean.

Run: `cd control-panel/e2e && npx playwright test`
Expected: all specs pass (new `deck-panel.spec.js` + existing render-client specs unaffected).

Run: `cd control-panel/server && node --test`
Expected: 125/125 (unchanged — no server edits).

- [ ] **Step 3: Whole-app smoke.** Boot server + render-client + panel; open the panel, select a layer on the stage, warp it, switch to Mask, adjust, open the Show drawer, fire a cue. Screenshot the final deck. Confirm the render-client output reflects a warp change (proves the messages still flow end-to-end).

- [ ] **Step 4: Commit + summary.** `git commit -m "Deck redesign: cleanup + final verification"`. Report what changed and the verification results.

---

## Self-Review

- **Spec coverage:** shell+selection (T1) ✓; LayerStack (T2) ✓; SlotGrid (T3) ✓; dominant Stage w/ preview+chrome (T4) ✓; click-to-select via warp-quad hit-test (T5) ✓; on-stage warp/mask handles reusing existing components + messages (T6) ✓; contextual inspector w/ Warp·Mask·FX (T7) ✓; secondary panels relocated (T8) ✓; mobile (T9) ✓; testing/gates (T5/T6/T10) ✓; constraints (preview stream, normalized coords, no protocol change) honored throughout ✓.
- **Placeholder scan:** CSS is ported from the committed mockup (concrete, referenced file + named rules), not "TBD". Load-bearing logic (geometry, selection, wiring) has full code. e2e harness reuses the existing `transport-and-playlist.spec.js` boot pattern (named).
- **Type consistency:** `EditMode` defined once (T1) and reused (T5–T9); `Quad`/`Pt`/`layerQuad`/`pointInQuad`/`pickTopLayer` defined in T5 and consumed by T5/T6; `ShowTab` defined in T8. Selection setter name `setSelectedLayerId` consistent T1→T9.
- **Known adaptation from the skill's default TDD shape:** the panel has no unit-test runner and its established gates are `tsc`/ESLint/Storybook/Playwright; interaction tasks (T5, T6) are genuinely test-first via Playwright, visual tasks verify via Storybook + screenshot. This matches the existing project conventions rather than introducing a new framework (per the spec's "no new test framework").

---

# Follow-up: restore screen-level features (Tasks 11-14)

The whole-branch review found the redesign dropped three pre-existing screen-level capabilities the spec said to keep. These tasks restore them into the new deck. Same Global Constraints as above (panel-only; no server/render-client change; reuse existing actions/paths; decoupling components/⇏app/; tokens; single dark theme; commit trailer). The screen-warp/PiP/screen actions already exist in `panel/src/app/actions.ts` (`setWarpMode`/`resetWarp`/`moveWarpPoint`/`setMeshSize`/`addScreen`/`renameScreen`) and `PipWindows.tsx` still exists — this is re-wiring, not new protocol.

## Task 11: Active-screen selector in the command bar

**Files:** Modify `panel/src/app/App.tsx`, `panel/src/components/Faceplate.tsx` (or add a small `ScreenSelect` in `components/`), `panel/src/components/deck/deck.css`; export any new component from `index.ts`.

**Interfaces/behavior:**
- Add a screen-selector segment to the command bar (`.cmd`), distinct from `AudioOwner` (which is "AUDIO ON" = audio ownership). It lists `state.screens` and is bound to the EXISTING `selectedScreenId`/`setSelectedScreenId` state in App (currently only auto-set on connect at `App.tsx:150`). Selecting a screen changes which screen the Stage previews (`preview.frameFor(selectedScreenId)`, and the preview bus's `getSelectedScreenId`) and — after Task 12 — which screen's warp you edit. Match the mockup's `SCREEN 1 | SCREEN 2` command-bar segment placement/look (`2026-07-11-projection-deck-mockup.html` `.seg`). Include add-screen (`actions.addScreen`) and rename if trivial; at minimum, screen switching.
- Decoupled: if you add a `ScreenSelect` component it takes `screens`, `selectedId`, `onSelect`, `onAdd` — no app import.

**Verify:** tsc/eslint clean. (Controller will screenshot switching Screen 1↔2 and confirm the Stage badge + preview follow.) Commit.

## Task 12: Screen / projector warp editing on the stage

**Files:** Create/modify `panel/src/components/deck/StageSelectionOverlay.tsx` (generalize to also render a SCREEN warp target), `panel/src/components/deck/Inspector.tsx` (a Layer/Screen edit-target toggle + screen-warp controls), `panel/src/app/App.tsx`, `panel/src/app/useSelection.ts` (add `editTarget: "layer" | "screen"`), `e2e/deck-panel.spec.js`; `deck.css`.

**Behavior:**
- Add `editTarget: "layer" | "screen"` to `useSelection` (default "layer"). Surface a **Layer / Screen** toggle at the top of the Inspector (or command bar).
- When `editTarget === "screen"`: the Stage shows the SELECTED SCREEN's warp handles (reuse `WarpHandle` for corner-pin, mesh handles for mesh mode) wired to `actions.moveWarpPoint(selectedScreenId, i, x, y)` / mesh equivalents; the Inspector shows the screen's warp controls — corner/mesh mode (`setWarpMode(screenId,…)`), mesh size (`setMeshSize(screenId,…)`), reset (`resetWarp(screenId)`), coord readout, and the screen name (rename/add). No layer overlay while in screen mode. Generalize `StageSelectionOverlay` to accept a generic warp target `{ warp, onCorner(i,x,y), onMode, … }` so the same handles serve layer and screen (the layer path is unchanged).
- When `editTarget === "layer"`: current behavior (unchanged).
- Reuse the EXIST­ING screen warp actions/paths (`screens.<id>.warp.*`) — no new message types. Handles carry `deck-handle`; drags include `pointercancel` (reused components already do).

**Verify (test-first):** extend `e2e/deck-panel.spec.js` — switch to Screen edit target, drag a screen warp corner on the stage, assert `screens.<id>.warp.corners` changed in `/state`. RED→GREEN. tsc/eslint + full deck-panel e2e pass. Commit.

## Task 13: PiP windows restored

**Files:** Modify `panel/src/components/deck/ShowDrawer.tsx` (add a "PiP" tab) + `panel/src/app/App.tsx` (mount `PipWindows` in the drawer, wired as the pre-Task-1 original did — recover from `git show 3dcc100:control-panel/panel/src/app/App.tsx`), `deck.css`; optionally overlay the PiP boxes on the stage.

**Behavior:** Add `"pip"` to `ShowTab` and a PiP tab to the Show drawer that mounts `PipWindows` with its original props/wiring (from git). Do not change `PipWindows` internals or its write paths. This restores PiP management (add/position/videoId/visible for the selected screen). Optionally also render the PiP boxes over the Stage for the current screen.

**Verify:** tsc/eslint clean; deck-panel e2e still passes. (Controller screenshots the PiP tab.) Commit.

## Task 14: Final cleanup + re-verification

**Files:** remove any code still orphaned after 11-13 (grep-verify `ChannelRack`, `SourceBankPanel` — delete component+story+export if zero live refs; keep `SourceBankSlotEditor`/`otherSlotOptions` which `SlotGrid` uses). 

**Verify (full gate):** `cd panel && npx tsc --noEmit && npx eslint .` clean; `cd e2e && npx playwright test` (whole suite) pass/known-skip only; `cd server && node --test` 125/125. Commit. Then a final whole-branch re-review.
