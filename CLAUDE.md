# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**The project is `control-panel/`** — a browser-based **Node / React / WebGL2** live
video-projection / VJ application. It began as a reimplementation of **VPT8**
(VideoProjectionTool 8 by HC Gilje, a Max/MSP/Jitter app) and now stands on its own at full
feature parity with it. The original VPT8 Max/MSP source is **no longer in the working tree** — it is
preserved in git history at tag **`vpt8-source-archive`** (`git show vpt8-source-archive` /
`git checkout vpt8-source-archive -- "vpt8 source code"` to retrieve it). Nothing here depends on it.

There is no Max/MSP anymore: this is a conventional text codebase with npm, a dev server, typecheck,
lint, unit tests, and Playwright e2e.

## Start here

- [`control-panel/README.md`](control-panel/README.md) — architecture, the projection-deck UI, state
  shape, the WebSocket/OSC protocol, and build/run instructions.
- [`control-panel/OPERATOR_GUIDE.md`](control-panel/OPERATOR_GUIDE.md) — how to run a live show from
  the panel.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — project history and status (deck redesign, the 2026-07-12
  parity audit, and the closure of all parity gaps A1–A21).

## The four pieces (all under `control-panel/`)

| Piece | What it is |
|---|---|
| `server/` | Node `ws` WebSocket control-plane + `dgram` OSC (in **and** out) + media upload. Holds one shared, crash-hardened `state` (`server/src/state.js`; `applyUpdate` validates every client write). Unit-tested with `node --test`. |
| `render-client/` | WebGL2 compositor (one shared layer stack; per-screen final warp). Inline GLSL. **No typecheck/lint** — see the caveat below. |
| `panel/` | React 18 + TS + Vite control panel — the **"projection deck"** UI (dominant live-preview Stage with click-to-select + on-stage warp/mask handles, a contextual Warp·Mask·FX Inspector, LayerStack/SlotGrid rails, a Show drawer, a screen selector, mobile layout). |
| `cast-receiver/` | DIAL/SSDP receiver for casting a phone's YouTube into a PiP window. |

## Build / run / gates

Per-package `npm install`, then (from `control-panel/`):

- Server tests: `cd server && node --test`
- Panel typecheck + lint: `cd panel && npx tsc --noEmit && npx eslint .`
- End-to-end: `cd e2e && npx playwright test` (see the README for running the whole stack).

See `control-panel/README.md` for the full dev-server / multi-service run.

### ⚠️ render-client has no typecheck or lint

`render-client/src/*.js` is plain JS with no `tsc`/eslint gate. A stray backtick inside an inline
GLSL template literal silently closes the string and **blanks the whole canvas with no error in the
other gates**. After editing any `render-client/src/*.js`: run `node --check` on it **and** drive it
once in Playwright capturing `pageerror` to confirm the canvas actually renders.

### e2e / headless GPU caveat

Headless Chromium on this machine kills the GPU on ~4 of 5 launches, and animated GIFs never advance
frames — neither is an app bug (see the auto-memory note `headless-webgl-flaky-gpu`). Run e2e specs in
**isolation** (one file at a time) and **re-run** a GPU-death flake; build pixel-readback specs around
static frames, mirroring `e2e/layer-mask-polygon.spec.js` / `e2e/source-bank-media-kind.spec.js`.

## Conventions

- **Cross-stack changes are normal**: a feature usually touches `server/` (state + validation),
  `render-client/` (GL), and `panel/` (deck UI) together. New per-layer controls attach to
  `panel/src/components/deck/Inspector.tsx` / `StageSelectionOverlay.tsx`; show-level controls to the
  command bar or `deck/ShowDrawer.tsx`.
- Components under `panel/src/components/` do **not** import from `panel/src/app/` — pass callback
  props down instead.
- Any new client-writable state path must survive `applyUpdate`'s validation — extend
  `corruptsStructure` in `server/src/state.js` for new structural containers; never bypass it.
- Commit trailer for AI-authored commits:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## Historical reference (kept, but describes the archived Max source)

These predate the divorce and describe the original VPT8 Max/MSP internals — useful for understanding
*why* the control-panel is shaped as it is, not for day-to-day work:

- [`docs/architecture/00-overview.md`](docs/architecture/00-overview.md) — the file-by-file map of the
  49 Max patchers (11 functional clusters).
- [`docs/TECH_DEBT.md`](docs/TECH_DEBT.md) — the technical-debt inventory of the original app.
- [`docs/VPT8-PARITY-GAPS.md`](docs/VPT8-PARITY-GAPS.md) — the 2026-07-12 audit that drove the final
  parity work (all gaps since closed).
- Tag `vpt8-source-archive` — the complete original Max/MSP/Jitter source (patchers, `code/*.js`,
  `shaders/*.jxs`, Mac-only externals, media). Shader/blend-mode attribution carried forward in
  [`control-panel/render-client/SHADER-CREDITS.md`](control-panel/render-client/SHADER-CREDITS.md).
