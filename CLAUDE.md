# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⭐ CURRENT STATE — read this first (updated 2026-07-12)

**The active project is `control-panel/`** — the browser-based Node/React/WebGL replacement for
VPT8. The original **VPT8 Max/MSP source lives under `vpt8 source code/` and is now reference-only**
(no code depends on it; it will be archived — see `docs/REMAINING-WORK.md` Phase C). Sections below
about opening/editing Max patchers apply only to that archived source, not to day-to-day work.

Recent milestones (all on `master`, pushed to origin):
- **The panel UI was redesigned into a "projection deck"** — a dominant live-preview Stage where you
  click a layer/object on the preview to select it, drag its warp corners / mask shape directly on
  the stage, and edit it in a contextual `Warp·Mask·FX` inspector; compact LayerStack + SlotGrid
  rails; a Show drawer (Presets/Cues/Timers/LFO/MIDI/Media/PiP); a screen selector; screen/projector
  warp; and a mobile layout. (Design: `docs/superpowers/specs/2026-07-11-projection-deck-redesign-design.md`
  + the interactive mockup `docs/superpowers/specs/2026-07-11-projection-deck-mockup.html`.)
- **Server hardening / render-client & panel bug-fixes** from an earlier audit are in too.
- **A rigorous VPT8→control-panel parity audit** (`docs/VPT8-PARITY-GAPS.md`) found the earlier
  "full parity" claim was overstated: ~15 real gaps + minors + 1 bug + 1 regression. The user chose
  to close **all** gaps.

**To continue the work, read `docs/REMAINING-WORK.md`** — the live status. 4 tasks done (A1 slot-media
bug, A2 copy/paste regression, A3 rotation, A4a polygon-mask shader); **24 tasks + 1 diagnostic
remain** across Phase A (parity), B (docs), C (VPT8 divorce), D (real-world verification). The
task-by-task specs are in `docs/superpowers/plans/2026-07-12-full-parity-finish-plan.md`; execute
them with the `superpowers:subagent-driven-development` flow (fresh implementer + review per task).
**Resume at A4-DIAG → A4b.** Progress ledger: `.superpowers/sdd/progress.md`.

⚠️ `docs/ROADMAP.md`, `control-panel/README.md`, and `control-panel/OPERATOR_GUIDE.md` still describe
the pre-redesign two-column UI and claim "full parity" — those rewrites are the pending Phase B tasks
(B1–B3); trust `docs/REMAINING-WORK.md` + the plan over them until then.

## What this is

This is the source code for **VPT (VideoProjectionTool) 8**, a free live video-projection/VJ
application by HC Gilje, released May 2018, 64-bit only (Mac and Windows). It is licensed under
Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported (see
`vpt8 source code/VPT8-sourcecode-readme.rtf`).

VPT is built entirely in **Cycling '74 Max/MSP/Jitter** — a visual, dataflow programming
environment, not a conventional text-based codebase. There is no compiler, package manager, linter,
or test suite for the project as a whole. "Running" or "editing" this project means opening it in
the Max application (with the Jitter GL extensions), not executing a shell command.

All VPT8 Max/MSP content lives under `vpt8 source code/`.

## Also in this repo: `control-panel/` (the browser-based replacement)

This repository also contains `control-panel/` — an actively developed, independent
Node/React project that replaces VPT8 with a browser-based control panel, a WebGL2
render client, and a WebSocket/OSC control-plane. It does not use Max/MSP and is not
covered by the rest of this file. If you're working in `control-panel/`, read
[`control-panel/README.md`](control-panel/README.md) (architecture, state shape,
protocol, build/run) and [`control-panel/OPERATOR_GUIDE.md`](control-panel/OPERATOR_GUIDE.md)
(how to run a show from the panel) instead — and see
[`docs/ROADMAP.md`](docs/ROADMAP.md) for how the two projects relate and which one is
under active development.

## Opening / working with the project

- Requires **Cycling '74 Max** (with Jitter) installed to open, edit, or run.
- The project file is `vpt8 source code/vpt8.maxproj`. Opening it in Max loads the whole project
  and its search path.
- The top-level ("toplevel") patchers, per `vpt8.maxproj`, are:
  - `patchers/vpt7project.maxpat` — the main application patcher.
  - `patchers/hapsource.maxpat` — HAP codec video source patcher.
- `.maxpat` files are JSON internally and can be diffed/read as text, but they should normally be
  edited by opening them in the Max patcher GUI — hand-editing the JSON is error-prone (box IDs,
  patchline connections, saved `pattrstorage` state, etc. all have to stay internally consistent).
- There is no build step to "compile" the app; a Max standalone/collective would be produced via
  Max's own File > Build Collective/Application, which is outside this repo.

## Repository layout

- `patchers/*.maxpat` — Max patcher files (the actual program graph: objects, subpatchers,
  bpatchers, connections). ~49 patchers, one per major module/UI panel (mixer, layer engine, presets,
  MIDI/OSC/serial control surfaces, LFOs, cue lists, edge-blending, etc.).
- `code/*.js` — scripts run inside Max `[js]` objects. These use **Max's embedded JS engine and its
  object model** (`this.patcher`, `outlet()`, `mgraphics`, `setoutletassist`, etc.), *not* Node.js —
  there's no `require`/npm ecosystem here.
- `shaders/*.jxs` — Jitter GL shader definitions (XML wrapping GLSL vertex/fragment source in
  `<program>` CDATA blocks), used by `jit.gl.slab` objects for color correction, transitions, masking,
  and layer mixing.
  - `shaders/v001 Mixers/` — one `.jxs` + companion `.fp.glsl` pair per blend mode (multiply, screen,
    overlay, dodge, burn, difference, etc.), used by the layer compositor.
  - `shaders/shared/{arb,cg,glsl}/` — reusable shader includes referenced from `.jxs` files via
    `<program source="...">` (e.g. `sh.passthru.xform.vp.glsl`).
  - `shaders/shared/licenses/` — third-party shader license attributions (3Dlabs, LightworkDesign).
    Keep these attached if shaders are reused elsewhere.
- `data/*.json` — `pattrstorage` snapshot dumps (`gui.json`, `presets.json`, `sources.json`): slot-
  indexed serialized UI/preset state written by Max's `pattrstorage` object. These are generated
  data/state files, not hand-authored source — treat edits to them as data surgery, not coding.
- `externals/*.mxo` — precompiled **Mac-only** Max external binaries bundled with the project:
  Syphon client/server (GPU texture sharing), Art-Net/DMX (`imp.artnet.node`), plus small custom
  logic externals (`o.route`, `Label`, `Ldiv`, `Lmult`). These are binaries, not buildable from
  source in this repo; there are no Windows externals (`.mxe64`) present here even though VPT itself
  ships for both platforms.
- `media/` — app icons and the CC license image.

## Architecture: the layer system

VPT's core concept is a stack of video **layers**, each independently sourced, processed, and
composited. Understanding it requires reading across three files that stay in sync via a common
"add/delete/startup" pattern, each instantiating a different **bpatcher** representation of the same
logical layer:

| Concern | Driver script | Bpatcher instantiated | Host patcher(s) |
|---|---|---|---|
| Video-processing engine per layer | `code/vlayer2.js` | `vlayer` (`patchers/vlayer.maxpat`) | `patchers/enginetab.maxpat` |
| Per-layer GUI controls | `code/dummylayers02c.js` | `layergui` (`patchers/layergui.maxpat`) | `patchers/layersbank.maxpat` |
| Per-layer tab/selector UI | `code/tabs.js` | `layertab` (`patchers/layertab.maxpat`) | `patchers/vpt7project.maxpat`, `patchers/activelayer.maxpat`, `patchers/controltabs.maxpat` |

All three follow the same lifecycle, driven from the top-level patcher:
- `addLayer()` — dynamically creates one more bpatcher instance via `this.patcher.newdefault(...)`,
  increments a layer count, and sends an init message out (`outlet(1, "send N..._init")`) so the new
  layer's state gets seeded.
- `startupLayers(n)` — recreates `n` layers at project load time (used to restore a saved session).
- `deleteLayer()` — removes the most recently added instance.
- `vlayer2.js` additionally tracks **layer order** (independent of layer identity) via a `layers[]`
  array and `movelayer(layerid, newpos)` / `layerprint()`, so layers can be reordered in the stack
  without recreating them.

When adding/modifying layer behavior, changes typically need to be mirrored across the engine
(`vlayer`), the GUI bank (`layergui`), and the tab selector (`layertab`) to keep the three in sync.

## Architecture: masking & warping (`mgraphics` point editors)

`code/pointmask01.js` and `code/pointgrid01b.js` implement interactive, draggable-point overlays
using Max's `mgraphics` drawing API and a manual mouse-event state machine (`button_down`,
`button_up`, `mouse_loc`, `bang` driven by `mouse.down`/`mouse.hit`). These back the masking and
geometric-correction/projection-warping grid editors used in `patchers/pointmask.maxpat`,
`patchers/gridcontroller.maxpat`, `patchers/controltabs.maxpat`, and `patchers/activelayer.maxpat`.
`pointgrid01b.js` works on an NxN grid (`create_points(gridsize)`); `pointmask01.js` works on a fixed
aspect-ratio point set. Both draw via `outlet(0, ...)` messages consumed by an `mgraphics` object and
report point/hit info on outlet 1.

## Architecture: shaders and compositing

GL effects are implemented as Jitter shaders (`.jxs`) rather than JS/patcher logic:
- Color correction: `cc.*.jxs` (brightness, contrast, saturation, alpha glue, colorspace conversion).
- Transitions/mixing: `co.xfade.jxs`, `tr.edgeblend*.jxs`, and the full blend-mode set in
  `shaders/v001 Mixers/`.
- Distortion/geometry: `td.rota.jxs` (rotation), `tp.slide.jxs` (slide/pan), `cf.gaussian.2p.jxs`
  (blur), `ab.spotmask_mod01.jxs` (spot masking).
- Each `.jxs` declares its `<param>`s (bound to `vp`/`fp` programs) and its GLSL source either inline
  in a `<program>` CDATA block or via `source="filename.glsl"` pointing into `shaders/shared/`.

## Deep architecture reference

The sections above are a high-level orientation. For a complete, file-by-file map of all 49
patchers (grouped into 11 functional clusters: app shell, layer engine core, per-layer engine
instance, layer select/masking/warping, layer GUI/mixing/clips, core video sources, secondary
video sources, presets/cues, control surfaces, modulation, and scripting/shaders/data), see
[`docs/architecture/00-overview.md`](docs/architecture/00-overview.md) and the per-cluster docs it
links to. For a categorized inventory of technical debt (platform gaps, toolchain/version debt,
closed-source dependencies, dead code, naming inconsistencies, architectural fragility, hardcoded
limits, missing tests/CI, and licensing constraints) to weigh before any modernization work, see
[`docs/TECH_DEBT.md`](docs/TECH_DEBT.md).
