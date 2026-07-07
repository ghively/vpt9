# Design — Componentize the control panel & sync to Claude Design

**Date:** 2026-07-05
**Status:** Approved (design gates 1–2 approved; user waived remaining review gates and
directed immediate implementation)

## Goal

Rebuild `control-panel/panel/` — currently vanilla HTML/CSS/JS — as a real React +
TypeScript component library so that:

1. It **replaces** the vanilla panel as the single operator UI (same WebSocket server on
   `:8080`, visually identical to the projection-desk redesign committed in `6f9aa8d`).
2. Its presentational components are a clean **design-sync source**, so Claude Design
   (claude.ai/design) can build and iterate VPT UI with the project's real components.

Scope is the operator panel only. `render-client/`, `server/`, and `cast-receiver/` are
untouched, and the panel keeps talking to the same server over the existing WebSocket
protocol.

## Approach (chosen: "C — one self-contained package, presentational/container split")

A single self-contained Vite package (respecting the repo's "each deployable unit is
self-contained, no shared-package build" philosophy), with a hard internal boundary:

> **`src/components/` never imports from `src/app/`.** Components take props and emit
> callbacks; the container wires them to the socket.

design-sync is scoped (via `componentSrcMap`) to `src/components/` + `src/tokens/` +
`styles.css`, so the socket/state wiring is invisible to it.

Rejected: **A** (no split — bundler would drag socket wiring into synced components);
**B** (two packages — needs a workspace/shared build, against the repo's grain).

## Package structure

```
control-panel/panel/
├── package.json            react, react-dom, typescript, vite, @storybook/*
├── tsconfig.json
├── vite.config.ts          app build (dist/) + library build (design-sync bundle)
├── index.html              Vite entry → mounts React
├── .storybook/             Storybook config (scoped to src/components)
├── .design-sync/           config.json, conventions.md, NOTES.md
├── src/
│   ├── tokens/tokens.css    ← migrated verbatim from today's tokens.css
│   ├── tokens/base.css      ← migrated verbatim from today's base.css
│   ├── styles.css           @imports tokens + base + component CSS (design-sync entry)
│   ├── components/          PRESENTATIONAL — props in, callbacks out, ZERO socket
│   │   ├── primitives/      Chip, ToggleSquare, Fader, Button, Select, TextField, StatusLamp
│   │   ├── Faceplate, AudioOwner, ChannelRack, LayerStrip
│   │   ├── ConfidenceMonitor   ← signature (well, grid, crop-marks, feathered preview)
│   │   ├── WarpEditor, WarpHandle, PipWindows, PipBox, PresetsBar
│   │   ├── *.stories.tsx    colocated Storybook stories
│   │   ├── types.ts         shared UI types (Layer, Screen, Pip, Preset, Warp)
│   │   └── index.ts         barrel → library bundle exposes window.VPTPanelKit.*
│   └── app/                 CONTAINER — imports components, owns wiring
│       ├── App.tsx          composes UI, holds selectedScreenId + isDragging
│       ├── store.ts         state + reducer (ports patch.js applyUpdate/Create/Delete)
│       ├── useSocket.ts     WebSocket effect → dispatch + send()
│       ├── usePreviewBus.ts preview frames kept OUT of React render
│       ├── actions.ts       send() wrappers (create/update/delete/preset)
│       └── main.tsx         mounts <App/>
```

## Component contracts (become the `.d.ts` design-sync feeds Claude Design)

Primitives: `Chip{label,active?,onClick}`, `ToggleSquare{label,active?,tone?,disabled?,
title?,onClick}`, `Fader{value,min?,max?,step?,onChange}`, `Button{label,variant?,
onClick}`, `Select{value,options[],onChange}`, `TextField{value,placeholder?,onCommit}`,
`StatusLamp{state,label}`.

Composites: `Faceplate{wordmark,center?,right?}`, `AudioOwner{screens[],ownerId,
onSelect}`, `LayerStrip{layer,neighbors,onUpdate,onMove,onRemove}`, `ChannelRack{layers[],
onUpdateLayer,onMoveLayer,onRemoveLayer,onAddLayer}`, `ConfidenceMonitor{previewFrame?,
children}` (forwardRef → imperative `setFrame(dataUrl)`), `WarpHandle{x,y,active?,
onDragStart,onDragTo,onDragEnd}`, `WarpEditor{screen,screens[],mode,points[],onSelectScreen,
onSetMode,onReset,onMovePoint,onDragStart,onDragEnd}`, `PipBox{pip,onMove,onResize,
onDragStart,onDragEnd}`, `PipWindows{screenId,pips[],onUpdatePip,onRemovePip,onAddPip}`
(named `PipManager` in this original spec; renamed to `PipWindows` during implementation — see
`control-panel/panel/.design-sync/NOTES.md`),
`PresetsBar{presets[],onRecall,onSave}`.

## Data flow (two optimizations from the vanilla app that MUST survive)

1. **No re-render during drags.** The container holds an `isDragging` flag; while a warp
   handle or PiP box is being dragged, incoming server echoes update the store but do not
   re-render the dragged subtree. Handles/boxes keep local drag state, commit on
   `pointerup`. (Mirrors `app.js`'s `isDragging` guard.)
2. **Preview frames bypass React.** ~250ms preview frames per screen must NOT trigger
   React re-renders (they'd reset text-input focus and fight drags). `usePreviewBus`
   holds the latest frame per screen and pushes it straight to `ConfidenceMonitor`'s
   `<img>` via the component's imperative `setFrame()` ref — never through render.

WebSocket protocol (`state`/`update`/`create`/`delete`/`presetSave`/`presetRecall`/
`preview`) and the dotted-path patch semantics are unchanged from `server/src/state.js`.

## Build, Storybook, design-sync

- **Vite** produces the static app `dist/` (drop-in for the existing static-server /
  Docker setup — Dockerfile switches to `vite build` then serve `dist/`) AND a library
  build of `src/components/index.ts` exposing `window.VPTPanelKit.*` for design-sync.
- **Storybook** covers every component in `src/components/`; stories are the design-sync
  preview source (its high-fidelity path).
- **design-sync** (`.design-sync/config.json`): `shape: package`, `componentSrcMap`
  scoped to `src/components/`, `tokensGlob` for `src/tokens/`, `readmeHeader` →
  `conventions.md`. Run after the panel builds and Storybook renders clean.

## Testing / verification

- `tsc --noEmit` clean; `vite build` clean; Storybook builds.
- Live parity check: run the new `dist/` against the running server on `:8080`; confirm
  layers/warp/pip/presets/audio-owner all work, drag is smooth, preview frames paint into
  the monitor without resetting focus — verified via a real browser screenshot (Playwright
  bundled chromium, as used for the redesign).
- Component render checks via Storybook stories.

## Migration / cutover

Old vanilla `src/*.js` and the inline-styled `index.html` are removed once the React build
runs and passes the live parity check. The projection-desk look is preserved because
`tokens.css`/`base.css` migrate verbatim and the component CSS is ported from today's
`index.html`. Checkpoint `6f9aa8d` preserves the vanilla version in history.

## Non-goals

- No changes to `render-client/`, `server/`, `cast-receiver/`, or the WS protocol.
- No new panel features — this is a faithful re-platforming of the existing UI plus the
  design-sync capability.
