# Projection Deck — panel UI/interaction redesign

**Date:** 2026-07-11
**Status:** Approved design (mockup signed off), ready for implementation plan
**Scope:** `control-panel/panel/` only. No server or render-client protocol changes.
**Visual source of truth:** the approved interactive mockup (`scratchpad/deck-mockup.html`,
published artifact). This spec captures the implementation-relevant decisions; the mockup
carries the pixel-level look.

## Why

The current panel is a flat, full-width stack of equal-weight rows: a small warp preview
tucked in a side column, 8 giant "Empty" slot rows, bulky layer cards, no focal point.
The operator wanted (their words): a dominant live preview, real hierarchy, less wasted
space, and — the key ask — to **shape/warp layers directly on the preview, with the
controls for the selected object appearing contextually. "Super simple and intuitive."**

## The design in one paragraph

The **live preview becomes the dominant "stage"** at screen center. The operator selects a
layer — from a compact left-rail stack **or by clicking the object on the stage itself** —
and that layer's **warp corners / mask shape appear as draggable handles on the stage**,
while the right **inspector collapses to show only that layer's controls** with a
`Warp · Mask · FX` segmented switch. A tight slot grid and the compact layer stack live on
the left rail. The existing tungsten (operator) / cyan (render data) token palette is kept;
the deck stays single dark theme by intent (a venue instrument).

## Layout

Three-zone shell replacing the current single-column `App.tsx` body:

```
┌ command bar ─────────────────────────────────────────────┐
│ VPT/deck   [S1|S2]        MASTER ▮▮▮ 70%  BLACKOUT  ●conn │
├───────────┬───────────────────────────────┬──────────────┤
│ LEFT RAIL │           STAGE               │  INSPECTOR   │
│ layer     │  (dominant live preview +     │ (selected    │
│ stack     │   per-layer click regions +   │  layer only) │
│ ────────  │   selected layer's handles)   │  source/op/  │
│ slot grid │                               │  blend +     │
│           │  stage toolbar (mode readout) │  Warp|Mask|FX│
└───────────┴───────────────────────────────┴──────────────┘
```

- **Command bar:** wordmark, screen tabs, inline master fader, blackout, connection lamp.
  (Re-uses `MasterControl`, `AudioOwner`/screen selection, `StatusLamp`.)
- **Left rail — Layer stack:** compact, top-of-stack-first, one row per layer = thumbnail +
  name + blend/index + opacity bar. Selectable (drives stage + inspector), reorderable.
  Restructures `ChannelRack` / `LayerStrip` into a denser selectable list.
- **Left rail — Slot grid:** the 8 source-bank slots as a tight 2-col grid of cells (filled
  slots show a cyan-tinted state), replacing 8 full-width rows. Restructures `SourceBankPanel`.
- **Stage:** new `Stage` component (see below).
- **Inspector:** new `Inspector` component (see below).

## New/changed components

| Component | Origin | Responsibility |
|---|---|---|
| `Stage` | new | Renders the pushed preview frame (`usePreviewBus`), the per-layer clickable regions, the selected layer's edit overlay, and the stage chrome (registration ticks, LIVE badge, res/fps). |
| `StageSelectionOverlay` | new, wraps existing `WarpEditor`/`WarpHandle` + `MaskShapeOverlay` | For the selected layer + current edit mode, draws + drives the warp corners / mask handles over the stage. Reuses the existing drag/coordinate logic and the messages it already sends. |
| `Inspector` | new | Selection-driven. Header (name/index/source), opacity, blend, the `Warp·Mask·FX` segment, and the contextual body. FX body reuses `FxDrawer`; warp body reuses `WarpEditor`'s numeric controls; mask body reuses the mask controls. |
| `LayerStack` | from `ChannelRack`/`LayerStrip` | Compact selectable/reorderable layer list. |
| `SlotGrid` | from `SourceBankPanel` | Compact slot grid. |
| App shell | `App.tsx` | New 3-zone layout; owns new selection state. |

Existing `PipWindows`, `CueList`, `LfoRack`, `TimerBank`, `MidiMapPanel`, `MediaLibrary`,
`PresetsBar` are retained; they move into a secondary surface (a bottom drawer or a
rail tab) rather than the always-on flat stack — exact home decided in the plan.

## Interaction model — the core of the redesign

1. **Selection state** lives in `App`: `selectedLayerId: string | null` and
   `stageEditMode: "warp" | "mask" | "fx"`. A single source of truth that both the rail
   highlight, the stage overlay, and the inspector read from.

2. **Click-to-select on the stage.** The panel already holds every layer's `warp.corners`
   (normalized 0..1) in state. The stage renders, per visible layer, an **invisible
   clickable quad** from those corners. A pointer-down on the stage hit-tests these quads
   and selects the **topmost** layer whose quad contains the point (falls through to
   deselect on empty space). This is what makes "click the object" real — no image
   hit-testing needed. Hovering a quad shows a faint outline so objects feel tangible.

3. **Handles on the stage.** Once selected, the current edit mode decides the overlay:
   - `warp` → four corner-pin nodes (or mesh grid) — the existing `WarpEditor`/`WarpHandle`,
     repositioned over the stage instead of the side monitor.
   - `mask` → the ellipse/rect with center + radius handles — existing `MaskShapeOverlay`.
   - `fx` → no handles; a faint bounding box; inspector shows the fx sliders.
   Dragging a handle sends the **same state-path updates the current code already sends**
   (`layers.<id>.warp.corners...`, `.mask...`) — no new protocol.

4. **Contextual inspector.** The inspector always reflects `selectedLayerId`; switching the
   `Warp·Mask·FX` segment swaps both the on-stage overlay and the inspector body. Nothing
   for other layers is shown — this is the "controls pop up for the selected object" ask.

## Constraints & honest limits (carried from the architecture, not introduced here)

- The stage shows the **confidence-monitor preview stream** the render-client already pushes
  (`usePreviewBus`) — intentionally low-res / low-fps. It is for framing & warping, not a
  full-res program feed. No change to that pipeline.
- Warp/mask editing operates in **normalized 0..1 coordinates** over the stage, exactly as
  the current `WarpEditor` does. Screen-vs-layer warp targeting is unchanged.
- Per-layer click-quads use `warp.corners`; a layer in mesh mode uses its mesh bounding hull.
  Layers with no meaningful footprint (e.g. a full-frame color) select via the whole stage
  or the rail.

## Mobile

Preserve the existing responsive behavior (`useIsMobile`, `MobileTabBar`). On a coarse
pointer / narrow width: the **stage stays dominant**; the left rail and inspector become
bottom-sheet tabs (Layers · Slots · Inspector · Show). Handles honor the 44px touch target
the tokens already define. Pointer-drag handlers must include the `pointercancel` fix
already landed on branch `fix/control-panel-audit-findings`.

## Testing

- **Storybook** stories for each new component (`Stage`, `Inspector`, `LayerStack`,
  `SlotGrid`) in their default + selected/edit states, matching the existing story pattern.
- **Playwright e2e:** the existing warp/mask/transport specs must still pass unchanged (the
  underlying messages are identical). Add a panel-level spec: select a layer via a stage
  click-quad → assert its handles render and the inspector shows that layer → drag a corner
  → assert the corresponding `layers.<id>.warp.corners` update is sent.
- `tsc --noEmit` + ESLint clean (the panel's existing gates).

## Non-goals (keep scope tight)

- No server or render-client changes; no new message types; no full-res preview.
- No new effects, blend modes, or automation features — this is layout + interaction only.
- No visual re-theming beyond the approved mockup; the token palette stays.
- Cue/LFO/timer/MIDI/media panels keep their current internals; only their *placement* moves.

## Rollout

Build behind the existing panel (same routes). Suggested incremental order for the plan:
(1) 3-zone shell + selection state, (2) Stage with preview + click-quads, (3) StageSelectionOverlay
reusing warp/mask, (4) Inspector, (5) LayerStack + SlotGrid, (6) relocate secondary panels,
(7) mobile pass, (8) stories + e2e. Each step keeps the app runnable.
