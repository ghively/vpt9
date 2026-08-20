# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

**The project is `control-panel/`** — a browser-based Node/React/WebGL2 live video-projection/VJ
application. It began as a reimplementation of **VPT (VideoProjectionTool) 8**, a free live
video-projection/VJ app by HC Gilje built in Cycling '74 Max/MSP/Jitter and released May 2018, and
now stands on its own at full feature parity with it. **The original VPT8 Max/MSP source is no
longer in the working tree** — it was archived and removed on 2026-07-12 (it used to live under
`vpt8 source code/`); it is preserved in full in git history at tag `vpt8-source-archive`
(`git show vpt8-source-archive` / `git checkout vpt8-source-archive -- "vpt8 source code"` to
retrieve it, including `VPT8-sourcecode-readme.rtf`, its CC BY-NC-SA 3.0 Unported license text).
Nothing in `control-panel/` depends on it.

There is no Max/MSP anymore: this is a conventional text codebase with npm, a dev server, typecheck,
lint, unit tests, and Playwright e2e. If you're working in `control-panel/`, read
`control-panel/README.md` (architecture, state shape, protocol, build/run) and
`control-panel/OPERATOR_GUIDE.md` (how to run a show from the panel). See `docs/ROADMAP.md` for
project history and status.

## Build / run / gates

Per-package `npm install`, then (from `control-panel/`):

- Server tests: `cd server && node --test`
- Cast-receiver tests: `cd cast-receiver && node --test`
- Panel typecheck + lint: `cd panel && npx tsc --noEmit && npx eslint .`
- End-to-end: `cd e2e && npx playwright test` (see `control-panel/README.md` for details).

## Historical reference: the archived VPT8 Max/MSP source

The rest of this file describes the original VPT8 Max/MSP/Jitter project as it existed **before**
the 2026-07-12 removal. It no longer describes anything in this working tree, but it's kept here to
document what's retrievable from the `vpt8-source-archive` tag and to explain why `control-panel/`
is shaped the way it is. For a full reverse-engineered, file-by-file map, see
`docs/architecture/00-overview.md` and `docs/TECH_DEBT.md`.

VPT is built entirely in **Cycling '74 Max/MSP/Jitter** — a visual, dataflow programming
environment, not a conventional text-based codebase. There is no compiler, package manager, linter,
or test suite for the project as a whole. "Running" or "editing" it means opening it in the Max
application (with the Jitter GL extensions), not executing a shell command.

- Requires **Cycling '74 Max** (with Jitter) installed to open, edit, or run.
- The project file was `vpt8 source code/vpt8.maxproj`. Opening it in Max loads the whole project
  and its search path.
- The top-level ("toplevel") patchers, per `vpt8.maxproj`, were:
  - `patchers/vpt7project.maxpat` — the main application patcher.
  - `patchers/hapsource.maxpat` — HAP codec video source patcher.
- `.maxpat` files are JSON internally and can be diffed/read as text, but they were normally
  edited by opening them in the Max patcher GUI — hand-editing the JSON is error-prone (box IDs,
  patchline connections, saved `pattrstorage` state, etc. all have to stay internally consistent).
- There was no build step to "compile" the app; a Max standalone/collective would be produced via
  Max's own File > Build Collective/Application.

## Archived repository layout (tag `vpt8-source-archive`)

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
`docs/architecture/00-overview.md` and the per-cluster docs it links to. For a categorized
inventory of technical debt (platform gaps, toolchain/version debt, closed-source dependencies,
dead code, naming inconsistencies, architectural fragility, hardcoded limits, missing tests/CI,
and licensing constraints) to weigh before any modernization work, see `docs/TECH_DEBT.md`.
