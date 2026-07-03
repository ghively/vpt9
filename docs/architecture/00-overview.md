# VPT8 Architecture Overview

VPT (VideoProjectionTool) 8 is a live video-projection/VJ application built entirely in Cycling '74
Max/MSP/Jitter — a visual dataflow environment, not a text-based codebase (there is no compiler,
package manager, or test suite; see `../../CLAUDE.md` for how to open and run it). This document is
the map into the eleven module deep-dives that follow: it indexes them, names the conventions that
recur across module boundaries, and traces one end-to-end walk of a frame from source to projector.
Read this first, then jump to the module doc for the subsystem you care about.

For the tech-debt catalog compiled across all eleven modules, see [`../TECH_DEBT.md`](../TECH_DEBT.md).

## Module index

| # | Module | Doc | One-line purpose |
|---|---|---|---|
| 1 | App shell & root | [01-app-shell.md](01-app-shell.md) | The toplevel application shell: the root patcher Max opens (`vpt7project.maxpat`) plus its four support patchers, owning app boot, OSC networking, prefs/file-path I/O, static help/about screens, and the floating live-camera utility window. |
| 2 | Layer engine core | [02-layer-engine-core.md](02-layer-engine-core.md) | The "engine" tab (`enginetab.maxpat`): the single shared Jitter GL rendering context (`jit.world vpt`), master output geometry/corner-pin/Syphon, the project-wide preset store (`pattrstorage vpt`), the app-wide OSC dispatcher, and the dynamic layer manager (`js vlayer2.js`). |
| 3 | Per-layer engine instance | [03-layer-engine-instance.md](03-layer-engine-instance.md) | `vlayer.maxpat`, the bpatcher template instantiated once per layer: the nine-stage GL processing chain (flip, tile, zoom, blur, mblur/slide, brcosa, mask, edge-blend, mesh) plus a per-layer corner-pin, for a single layer's texture. |
| 4 | Layer select, masking & warping | [04-layer-select-masking-warping.md](04-layer-select-masking-warping.md) | The shared "active layer" properties panel (`activelayer.maxpat`), the two singleton interactive point-editor tools (mask-shape `pointmask`, NxN warp-mesh `gridcontroller`), and the numeric per-layer mask-processing stage (`layermask.maxpat`). |
| 5 | Layer GUI bank, tab UI, source mixing & clip control | [05-layer-gui-mixing-clips.md](05-layer-gui-mixing-clips.md) | The GUI-control-strip leg of the layer triad (`layergui`, banked by `dummylayers02c.js`), the tab-button leg (`layertab`), the horizontal control-tab container (`controltabs.maxpat`), the A/B source cross-fader/blend mixer (`mix-vpt7.maxpat`), and the clip-transport tab (`clipcontrol.maxpat`). |
| 6 | Core video source engines | [06-video-source-engines.md](06-video-source-engines.md) | `hapsource.maxpat` / `xfadesource.maxpat`: the two near-identical two-clip movie-playback source engines (HAP-codec vs. generic `viddll`) that decode into A/B `jit.movie`s, crossfade on a shader, and broadcast a GL texture per source-bank slot. |
| 7 | Secondary video sources | [07-secondary-video-sources.md](07-secondary-video-sources.md) | The non-file source types (still-image crossfade `xfadestill`, solid-color `solid01`, Syphon client/server) plus `sourcebank.maxpat`, which reassigns each of the 8 "video bank" slots between source types at runtime via `script sendbox … replace`. |
| 8 | Presets & cue automation | [08-presets-cues.md](08-presets-cues.md) | The three parallel whole-app automation paths — the preset store/recall front end (`presetmodule`/`preset_cellblock`), the line-oriented cue-script interpreter (`cuelist-vpt7`), and the 15-alarm wall-clock timer bank — plus per-layer `copypaste`, all reaching the one real `pattrstorage vpt`. |
| 9 | Control surfaces | [09-control-surfaces.md](09-control-surfaces.md) | Every external-controller pathway (hardware + soft MIDI, OSC-over-UDP, serial/sensor, Art-Net/DMX), all normalizing to the shared `to_router` bus, plus the central three-file 100-row router that maps them onto VPT's `/dest<nr>/param` parameter-address namespace. |
| 10 | Modulation (LFOs) | [10-modulation-lfo.md](10-modulation-lfo.md) | A fixed 10-slot rack of 6 oscillators + 4 waveform mixers (`lfomodule`/`lfomix`/`lforack`) whose gated, range-scaled values broadcast on `to_router` tagged with a VPT-controller index, letting any addressable parameter be driven by an oscillating value. |
| 11 | Scripting, shaders & data | [11-scripting-shaders-data.md](11-scripting-shaders-data.md) | The three non-`.maxpat` source kinds: the 5 `code/*.js` scripts (layer-lifecycle drivers + `mgraphics` point editors), the ~63 GL shader files under `shaders/`, and the 3 `data/*.json` pattrstorage dumps — plus the project manifest and the 7 bundled Mac-only externals. |

## Cross-cutting conventions

These are the patterns you must internalize once; every module doc assumes them. Each names the
module doc(s) it spans.

### The three-legged layer lifecycle (Tasks 1, 2/3, 5, 11)

**The central architectural pattern of the entire codebase.** A single logical "layer" has *three
independent representations*, each a differently-named bpatcher, each created/destroyed by its own
`[js]` driver script, all kept in lock-step only by a shared add/delete/startup lifecycle contract
driven from the root patcher:

| Leg | Concern | Driver script | Bpatcher (`@name`) | `@varname` | Host patcher | Doc |
|---|---|---|---|---|---|---|
| Engine | Per-layer GL processing chain | `code/vlayer2.js` | `vlayer` | `<N>layer` | `enginetab.maxpat` (inside `p VPT`) | Tasks 2, 3 |
| GUI | Per-layer control strip | `code/dummylayers02c.js` | `layergui` | `<N>layergui` | `layersbank.maxpat` | Task 5 |
| Tabs | Per-layer tab/selector button | `code/tabs.js` | `layertab` | `<N>layertab` | `vpt7project.maxpat` | Task 1 |

All three scripts implement the identical three-function contract (verified across the scripts in
Task 11): `addLayer()` calls `this.patcher.newdefault(0,0,"bpatcher","@name",<name>,"@varname",N+…,"@args",N,…)`
to add one more instance and increments a count; `startupLayers(n)` rebuilds `n` instances at
project-load time to restore a saved session; `deleteLayer()` calls `this.patcher.remove(...)` on the
most-recently-added instance. Each emits `outlet(0,"/numberofLayers",N)` and an
`outlet(1,"send <N>…_init")` seed message. The root patcher's `p layers_add-delete` (Task 1) fans a
single `addLayer`/`deleteLayer`/`startupLayers $1` command to **both** `s engine` (→ `vlayer2.js`)
and `s dummylayer` (→ `dummylayers02c.js`), while `js tabs.js` sits directly in the root patcher.
The only cross-script inconsistency is the init-seed suffix: `vlayer2.js` and `dummylayers02c.js`
both emit `send <N>layer_init`, but `tabs.js` emits `send <N>tab_init` (Task 11). `vlayer2.js` alone
additionally tracks stack *order* independently of layer *identity* via a `layers[]` array and
`movelayer(id,pos)` (Task 2). **Consequence:** adding or changing per-layer behavior generally
requires mirroring the edit across all three legs, because nothing but convention keeps them in sync.

Note the contrast documented in Task 4: the mask and mesh point *editors* are **singletons**, not a
fourth lifecycle leg — one `pointmask` and one `gridcontroller` instance exist, re-pointed at
whichever layer has `focus`, rather than one-per-layer.

### The send/receive message-bus convention (all tasks)

VPT has almost no patchcord coupling between modules. Instead it uses a **flat, global
`send`/`receive` (`s`/`r`) namespace** as an app-wide message bus: a `receive` fires from any
matching `send` anywhere in the app (Task 2). Core buses include `s engine` (the generic per-layer
command channel carrying `/vlayer addLayer`, `/<N>layer/...` strings), `s to_layer`, `s layers`,
`s focus` (the currently-selected layer id, read by Tasks 1/4/5/9), `s toPS`/`s ps` (preset recall,
Task 8), `s to_sources` (Tasks 6/7), `s to_router`/`s ctrl` (control input, Tasks 9/10), and
`s osc_in`/`s osc_out` (Task 2). Two conventions layer on top:

- **`#1`-argument instance namespacing (Tasks 1, 3, 5, 6, 7, 9, 10).** Any bpatcher meant to be
  instantiated many times disambiguates its global send/receive names with the literal token `#1`,
  which Max substitutes with the box's first typed-in argument at load. A layer engine uses
  `r #1layertex`/`s #1multiplier_xy`/`@layer #1` (Task 3); a source bank uses `s #1video`/`r #1play`
  (Task 6); an LFO uses `s #1lfo`/`r #1lfo_osc` (Task 10). Note a *second, parallel* per-instance
  scheme rides alongside it: the same number `N` also forms the bpatcher's `@varname` (`<N>layer`),
  used by `pattrstorage` for keys — the two schemes stay in sync only because both derive from the
  same `@args N` (Task 3).
- **Runtime `OSC-route` re-targeting via `#1` → `sprintf set` → route (Tasks 3, 4, 5).** A bpatcher's
  `#1` argument feeds a `sprintf set 1 /%ilayer` (or `/%ivideo`, `/%isolid`, `/%isyphon`) message that
  reconfigures a downstream `OSC-route`'s argument list at load, so a generic `OSC-route /a` becomes
  that instance's own address filter.

### The `pattrstorage` state convention (Tasks 2, 5, 7, 8, 9, 11)

All persistent state lives in Max `pattrstorage` objects that serialize to slot-indexed JSON dumps
under `data/` (and one under the project folder). There are **four** distinct pattrstorage domains,
each owned by exactly one patcher, each reached by other modules only through send/receive buses —
never by patchcord:

| pattrstorage name | Owner patcher | On-disk dump | Scope | Doc |
|---|---|---|---|---|
| `vpt` | `enginetab.maxpat` | `data/presets.json` | All layer/preset state, keyed `<N>layer::<param>` | Tasks 2, 8, 11 |
| `gui` | `layersbank.maxpat` (scoped from `vpt7project.maxpat`) | `data/gui.json` | GUI/tab UI state | Tasks 1, 5, 11 |
| `sources` | `sourcebank.maxpat` | `data/sources.json` | Per-bank source type + settings, keyed `videobankNN::<param>` | Tasks 7, 11 |
| `router` | `router-vpt7.maxpat` | `router.json` | Whole controller-mapping "router setups" | Task 9 |

A **fifth**, easily missed, is `pattrstorage timer` in `vpt-timersketch3.maxpat`, persisted to its own
`timer.json` (Task 8). Restore is deliberately *manual and scripted* (`@autorestore 0`), rebuilt via
`startupLayers`/`/initdone` sequencing rather than Max's automatic restore (Task 2). Crucially, the
"preset module" GUI (Task 8) contains **no** pattrstorage/pattr object of its own — it is a
`coll`-backed UI shell that drives the real `pattrstorage vpt` in `enginetab.maxpat` purely through
terse buses (`ps`, `toPS`, `ps_sources`). The low-level `getstoredvalue`/`setstoredvalue` API (not
`store`/`recall`) is used by `copypaste.maxpat` to move one layer's values onto another (Task 8).

### The `mgraphics` point-editor convention (Tasks 4, 11)

The interactive mask-shape and warp-mesh editors are hand-built draggable-point overlays. Two
`[js]` scripts (`code/pointmask01.js`, `code/pointgrid01b.js`, Task 11) each maintain a `points[]`
array and a manual mouse-event state machine driven by the exact selectors `button_down` /
`button_up` / `mouse_loc` / `bang`, emitted from an identical `p mouse_ctrl` adapter subpatcher
(`route mouse mouseidle` → `unpack` → `sel 0 1`, copy-pasted between `pointmask.maxpat` and
`gridcontroller.maxpat`, Task 4). Each script draws by sending `mgraphics` commands
(`move_to`/`line_to`/`ellipse`/`fill`/`stroke`) out outlet 0 to a sibling `jit.mgraphics`/`jit.pwindow`,
and dumps the raw point list out a second outlet into a `pattrstorage`-backed
`<N>layer::mask::points` / `<N>layer::mesh::position` parameter (Task 11). `pointgrid01b.js` works on
an NxN grid (`create_points(gridsize)`); `pointmask01.js` works on a fixed 4:3 polygon and, unlike
the grid editor, supports inserting/deleting points (Task 11).

### The central control-surface router (Task 9, feeding Tasks 2/3)

Every external-controller input method — hardware MIDI, on-screen "soft" MIDI, serial/Arduino sensor,
and Art-Net/DMX — independently normalizes its input to a `(value, index)` pair and broadcasts it on
one shared global bus, **`s to_router`** (Task 9; also fed by the LFO rack, Task 10, and clip control,
Task 5). The receiving hub is a three-file stack: `router-vpt7.maxpat` (window shell + `pattrstorage
router`) hosts `ctrlrouter-vpt7_01.maxpat` (a fixed bank of **100** pre-declared mapping-row
bpatchers) which hosts `ctrl_config-vpt7_01.maxpat` (the per-row logic). Each row listens on
`r to_router`, filters for its own index, and — from a user-chosen `destination` category + number +
`parameter` token — builds an OSC-path-style address `/<category><nr>/<parameter> <value>` via
`sprintf /%s/%s \$1` and fires it on **`s ctrl`**, which is received back in `enginetab.maxpat`
(`r ctrl`, Task 2/3). This is the single place where any controller is mapped onto VPT's internal
parameter namespace. A **second, parallel** internal control bus, `s engine`, is fed by the GUI's own
on-screen controls via the `osc_active`/`osc_pass` abstractions (Task 9) — both buses ultimately
address layers with the same `/layerN/param` string grammar via structurally distinct paths.

### The LFO-to-parameter addressing scheme (Task 10, via Task 9)

The LFO rack reuses the control-surface router as its delivery mechanism. Each of the 10 rack slots
(6 base oscillators `lfo1`-`lfo6`, 4 mixers `lfomix1`-`lfomix4`) computes a global "VPT controller"
index by adding a single shared, rack-wide `r ctrl_offset` to its own slot number (`+ #1`), packs
`[currentValue, index]`, and — only while its `ui_moveon` toggle is engaged — sends that pair on the
same `s to_router` bus every controller uses (Task 10). The matching `ctrl_config-vpt7_01.maxpat`
instance (whose own `#1` equals that index) filters for it and applies the oscillating value to
whatever parameter that controller row is bound to. So an LFO is just one more `to_router` producer;
routing an LFO to a parameter is done in the same 100-row router UI as routing a MIDI knob. The
`ctrl_offset` lets the same 10-slot rack automate different banks of 10 destinations (offset 10 →
controllers 11-20, Task 10).

### Other recurring idioms worth knowing

- **Three *more* instantiation mechanisms beyond the layer triad's `newdefault`.** `mix-vpt7`,
  `hapsource`, `xfadesource`, `xfadestill` are swapped into the 8 `videobankNN` slots at runtime by
  Max's `script sendbox <box> replace <patcher>` message (Tasks 5, 7); `loopback_clip_vpt7` and the
  100 router rows are placed as plain static bpatchers (Tasks 5, 9); `copypaste` is loaded as a bare
  `newobj`-named-after-file abstraction (Task 8). Four "make N of a thing" idioms coexist.
- **Cascading `OSC-route` chains instead of a central dispatcher.** The nine per-layer effect modules
  (Task 3) are wired by passing each `OSC-route`'s unmatched-message outlet into the next module's
  router; the order is recoverable only by tracing patchcords.
- **Hand-rolled scheduling.** The cue-list timing engine repurposes audio-rate `snapshot~`/`line~`
  ramps (three copy-pasted `p audioline` subpatchers) rather than Max's `line`/`pipe`/`delay` (Task 8).
- **Shaders, not patcher logic, do the pixels.** Every GL visual effect is a `.jxs` file loaded by
  `jit.gl.slab @file` (or `loadmess sendshader read`); `td.rota.jxs` alone is reused for rotation,
  tiling, and mirroring (Tasks 3, 11).
- **VPT7/VPT6-era naming throughout.** Most patcher filenames retain `vpt7`/`VPT7` (all 13 control-
  surface files, Task 9) despite living in the VPT8 tree, and several embed even older `vpt6` assets.

### Known coverage gaps

- **Camera sources (`cam1`/`cam2`).** `sourcebank.maxpat` also routes two camera slots (`cam1`/`cam2`)
  to `livemodule-vpt7.maxpat` (Task 7), and `data/sources.json` carries `cam1`/`cam2` keys (Task 11),
  but the live-camera capture/record path itself is only touched at the shell level (Task 1's
  `livemodule-vpt7.maxpat`) and is not given a dedicated deep-dive by any of the eleven module docs.
- **Downstream `s ctrl` dispatch.** Task 9 documents how a controller value becomes a `/dest<nr>/param`
  address; the final fan-in of that string to a specific per-layer receiver lives in `enginetab.maxpat`
  (`r ctrl`) and is covered only from the engine side (Tasks 2/3), not traced end-to-end.

## Top-level data flow

A single walk from "a movie file on disk" to "pixels on a projector," with control and modulation
feeding in and presets/cues able to reset the whole state:

1. **Source (Tasks 6-7).** One of the 8 `videobankNN` slots in `sourcebank.maxpat` holds a source
   patcher — `hapsource`/`xfadesource` (movie files), `xfadestill` (stills), `mix-vpt7` (an A/B mix of
   two other banks), `solid01` (solid color), `syphon_vpt7` (inbound GPU texture), or a camera via
   `livemodule`. Each decodes/loads its media, crossfades its own internal A/B pair on `co.xfade.jxs`,
   and broadcasts the finished `jit_gl_texture` on a `#1`-namespaced send (`s <N>video` / `s <N>solid`
   / `s <N>syphon`) on the shared `vpt` GL context. Which source type occupies a slot is hot-swapped at
   runtime by `script sendbox videobankNN replace …`, and both slot type and settings persist in
   `pattrstorage sources` → `data/sources.json`.

2. **Layer engine (Tasks 2-3).** `enginetab.maxpat` owns the one shared `jit.world vpt @shared 1
   @output_texture 1` context that everything renders into, and its `js vlayer2.js` dynamically
   creates one `vlayer.maxpat` bpatcher per layer. Each `vlayer` instance selects a source (receiving
   that source's named texture) and runs it through a nine-stage GL chain — flip → tile → zoom → blur →
   mblur(slide) → brcosa → **mask** → edge-blend → mesh — plus a per-layer corner-pin, re-exposing the
   processed texture as `s <N>layertex`.

3. **Masking & warping (Task 4).** The mask stage inside each `vlayer` is `layermask.maxpat`
   (blur/invert/luminance-to-alpha). Its shape, and each layer's projection warp mesh, are authored in
   the singleton `pointmask`/`gridcontroller` `mgraphics` editors hosted by `activelayer.maxpat`,
   which re-point at whichever layer has `focus` and write per-layer-addressed values (`/<N>layer/mask/points`,
   `/<N>layer/mesh`) back onto `s engine`.

4. **Mixing & compositing (Task 5).** Layers composite in the shared context in `layerorder`, each with
   its own blend mode (a `jit.gl.slab` blend shader). `mix-vpt7.maxpat` additionally offers whole-bank
   A/B cross-fading with the full `shaders/v001 Mixers/` blend-mode set. The `layergui` strip and
   `layertab` buttons (the GUI/tab legs of the triad) drive per-layer fade, blend, source, solo, and
   copy/paste.

5. **Output (Tasks 1-2, 7).** The composited output is corner-pinned/keystoned by `enginetab`'s master
   geometry editor, gated by master-fade/blackout/blind, and sent to the preview window, the fullscreen
   projector output, and — on macOS only — a Syphon server (`vpt-syphonout.maxpat`) for other apps.

6. **Control input feeds in (Task 9).** MIDI/soft-MIDI/serial/sensor/Art-Net all normalize to
   `(value, index)` on `s to_router`; the 100-row `ctrl_config` router maps each to a
   `/<dest><nr>/<param>` address on `s ctrl`, received by `enginetab` and applied to the addressed
   layer/source/parameter. The GUI's own controls feed the parallel `s engine` bus via `osc_active`/
   `osc_pass`. External OSC over UDP (`osceditor-vpt7`, ports 6666/6667) is a further input.

7. **Modulation feeds in (Task 10).** The LFO rack broadcasts oscillating values on the *same*
   `s to_router` bus, tagged with controller indices, so any router-mapped parameter can be animated
   continuously instead of driven by a physical controller.

8. **Presets & cues drive the whole state (Task 8).** Three automation paths — the manual preset-module
   UI, the sequential cue-script interpreter (`C`/`F`/`D`/`L`/`S`/`R`/`O` letter codes), and the
   15-alarm wall-clock timer bank — all converge on the `s toPS` bus feeding the one `pattrstorage vpt`
   store, letting a single trigger recall a complete snapshot of every layer's parameters (and, via the
   linked `sources` slots, the source rack) at once. `copypaste.maxpat` is a parameter-level shortcut
   that transfers one layer's stored values onto another without a full preset.
