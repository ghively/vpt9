# Layer engine core

## Purpose

`enginetab.maxpat` is the "engine" tab of VPT8 and the heart of the running application's video
pipeline. It owns the single shared Jitter GL rendering context (`jit.world vpt`) that every layer
draws into, the preview render/window, the master output geometry (corner-pin/keystone editor plus
fullscreen/blackout/blind control and Syphon output), the project-wide preset store
(`pattrstorage vpt`), the top-level OSC command dispatcher for the whole app, and — most importantly
for this cluster — the dynamic **layer manager**: a `[js vlayer2.js]` object that creates, deletes
and reorders one `vlayer` bpatcher (the per-layer processing engine, documented in Task 3) per
video layer. The number of layers is not fixed; it is grown and shrunk at runtime and restored from
a saved project.

## Files in this cluster

- `vpt8 source code/patchers/enginetab.maxpat` (23229 lines)

## Key patchers & subpatchers

**Shared GL context and preview (toplevel).** The single most important object is
`jit.world vpt @enable 0 @windowposition 0 320 @shared 1 @output_texture 1 @fsaa 1 @size 320 240 @fsaa 1 @erase_color 0. 0. 0. 1.`
(obj-58, line ~438). Its context name is the literal string `vpt`, and `@shared 1 @output_texture 1`
mean every GL object that names `vpt` — the dynamically created `vlayer` engines, the divider
sketch, and (in other files) the mixer/output stage — renders into and reads back from this one
context. The tab also hosts `jit.gl.render preview` (obj-56), `jit.gl.videoplane preview @transform_reset 2`
(obj-3, line ~363) and a `jit.fpsgui` for the on-screen preview.

**`p VPT` — the layer manager** (obj-105, `varname "patcher"`, `text "p VPT"`, line ~7003). This
subpatcher contains `js vlayer2.js` (obj-35, `"filename" : "vlayer2.js"` line 6454, `text "js vlayer2.js"`
line 6459) — the `[js]` object that dynamically instantiates layer engines. Its input messages are
`addLayer` (obj-31), `deleteLayer` (obj-30), `init` (obj-139) and `startupLayers $1` (obj-93), plus
`r vlayer` (obj-121) carrying the layer count and `r layerinit` (obj-66, `varname "nLayersinit"`).
`vlayer2.js`'s function bodies (in `code/vlayer2.js`) do the work:
- `addLayer()` builds one more layer with
  `this.patcher.newdefault(0,0,"bpatcher","@name","vlayer","@patching_rect",10,10+22*i,210,21,"@varname",N+"layer","@args",N)`
  — i.e. a `vlayer` bpatcher whose `@varname` is `<N>layer` and whose first argument is the layer
  number `N`. It then emits `/numberofLayers N`, `send <N>layer_init`, and `/added 1`.
- `startupLayers(n)` rebuilds `n` such bpatchers at project-load time and finishes with `/initdone 1`.
- `deleteLayer()` calls `this.patcher.remove(vlayers[i-1])` (removes the most recently added layer).
- `movelayer(layerid,newpos)` / `layerprint()` reorder a separate `layers[]` order array and emit
  `/layerorder <id> <pos>` per layer followed by `/order_refresh 1`.
The js outlets feed `route /numberofLayers /i /initdone /layerorder /order_refresh /added` (obj-102,
line ~6336) and `s osc_out` (obj-72); the `send <N>layer_init` strings pass through `t b s` →
`fromsymbol` → `forward` (obj-65/58/37) so they are delivered to a receive named `<N>layer_init`
inside layer N's bpatcher, seeding its initial state.

**`p blackoutlayer`** (obj-105, `text "p blackoutlayer"`, line ~866). Contains a *statically* placed
`vlayer 99` (obj-44, `varname "vlayer"`, line ~697) — a reserved layer with id `99` used as the
full-frame blackout/master-fade layer. It is driven with hardcoded `/99layer/...` addresses
(`;\r99layer_init bang`, `;\rto_layer /99layer/color 0. 0. 0. 0.`, `;\rosc_in /99layer/fade 0.`,
`;\rosc_in /99layer/layerorder 200`, `/99layer/cornerpin`), where `layerorder 200` keeps it above all
real layers.

**`p display`** (obj, `text "p display"`, line ~3634). Holds the layer-count value `v nLayers`
(line ~3870) and a per-layer parameter broadcaster: an `uzi` over `nLayers` drives
`sprintf interp %ilayer::%s off` → `s toPS`, iterating a `umenu` (obj-16, line ~4027) whose items
enumerate the entire per-layer parameter namespace: `blendmode, source, flip::on, flip::fliptype,
mask::on, mask::source, mask::inv, mask::blur_on, mask::blur, mask::moving, mask::points, layerorder,
layername, brcosa::on, mblur::on, blur::on, tile::on, tile::xtile, tile::ytile, zoom::on,
edgeblend::on, edgeblend::inv, mesh::on, mesh::gridsize`. It also enumerates displays (`s display_count`).

**Master preset store.** `pattrstorage vpt @changemode 1 @autorestore 0 @savemode 0 @backupmode 2`
(obj-53, `varname "vpt"`, line ~5065) is the project-wide `pattrstorage` for all layer/preset state,
addressed by sub-priority `<N>layer::<param>` keys. Alongside it, `pattr sources @default_interp thresh 0.01`
(obj-42, `varname "sources"`, line ~4402, `restore [1003]`) binds the current video-source selection
into that stored state.

**`p OSC`** (obj, `text "p OSC"`, line ~11112). Hosts the application's top OSC dispatcher
`OSC-route /layers /focus /vlayer /pstorage /copy /paste /onoff /sources /mastercorner /initdone
/corner_radius /movelayer /toPS /0layer /sourcestab /fullscreen /drawcorners /blind /blackout
/activecorner /active_xy /presetfade /routerfade /router /0serial /serial /presetprev /presetnext
/cueprev /cuenext /sourcepreset /preview` (obj-14, line ~10010) fed from `r osc_in`, splitting into
`s to_layer`, `s layers`, `s focuse`, `s movelayer`, etc.

**`p opreset`** (obj, `text "p opreset"`, line ~8420) — preset/cue/source navigation:
`OSC-route /preset /cue /source /store0 /cuenext /cueprev /presetnext /presetprev /sourcenext
/sourceprev /blackout /cueplay /masterfade /pattr_interp /projectpath` (obj-73, line ~8507) feeding
`s toPS`, `s ps`, `s ps_sources`, `s sequence`, `s sourcenext`/`s sourceprev`.

**Master output geometry editor.** A large portion of the file (lines ~11100–22600) is the master
corner-pin/keystone + mesh-warp editor for the composited output: subpatchers `p mousetracking_preview`
(line ~12506), `p mousetracking` (line ~14064), a per-corner set `p LR`/`p UR`/`p LL`/`p UL`
(appearing twice, ~15581–17159 for calculation and ~19793–21011 for inc/dec) with nested `p km`
subpatchers, `p incdec_corners` (line ~19106) and `p cornerpin-calculations` (line ~22417). These
communicate through `s/r cornerpin`, `s mastercorner`/`r mastercorner`, `s corner_radius`,
`s calc_radius`, `s active_corner`, `s/r cur_xy`, `s multiplier_xy`, `s center_xy` and the corner
sends/receives `LR/UR/LL/UL` (and `LR_send/LR_receive` …). `OSC-route /cornerpin` (line ~14871) and
`OSC-route /upper_left /lower_left /upper_right /lower_right` (line ~14408) are the entry points.

**Other support subpatchers.** `p mesh-scaler` (obj-2, line ~348) rescales the `jit.gl.nurbs`
mesh-warp objects "found in vlayer" when entering/leaving fullscreen (`s nrb`); `p multiscreen-dividers`
(obj-17, line ~1375) draws screen-division guides with `jit.gl.sketch vpt @layer 88 @enable 0`
(line ~1238); `p init` (line ~2742), `p hidecursor` (line ~2931), `p mouseclick-undo` (line ~1558),
`p set-pattr-interp` (line ~4192), `p pattrcom` (inside `p VPT`, line ~6200), `p router_osc`
(line ~7476), `p serialout` (line ~9119) and `p esc` (line ~22566).

## Data flow

Every entry below is a literal `send`/`receive`/`route`/OSC string present in the file.

**Layer lifecycle (from `vlayer2.js`, inside `p VPT`):**
- Trigger messages into the js: `addLayer`, `deleteLayer`, `init`, `startupLayers $1`.
- js → `route /numberofLayers /i /initdone /layerorder /order_refresh /added` and `s osc_out`.
- Per-layer seed: `send <N>layer_init` (e.g. `send 3layer_init`) → `fromsymbol` → `forward` →
  receive `<N>layer_init` inside layer N.
- `r vlayer` / `s vlayer` (layer count in), `r layerinit` (obj-66), `print layerinit`, `r initdone`.
- Reorder: `r movelayer` → `movelayer 1 1` → js → `sprintf /%ilayer/layerorder %i` (obj-80,
  line ~4700) → `s to_layer`; `s order_refresh` / `r order_refresh`; `s refresh` / `r refresh`;
  `s lbe` / `r lbe`; `s layers_init`; `r/s initbang`; `s lb` / `r lb`.

**Per-layer control and state addressing (stringly-typed `<N>layer` convention):**
- `s to_layer` carries `/<N>layer/...` OSC-style messages to each `vlayer` bpatcher's OSC input.
- `s layers` broadcasts to all layers; `s to_sources` to the source subsystem.
- pattr sub-addresses: `sprintf interp %ilayer::%s off` (obj-4, line ~3900) targets
  `<N>layer::<param>` keys in `pattrstorage vpt`.

**Preset / project state:**
- `pattrstorage vpt` fed by `s toPS` / `r toPS`, `s fromPS`, `s from_pstorage`, `r pstorage` /
  `s pstorage`, `r ps_cut`, `s ps`, `s ps_sources`, `r recall-ps_sources`, `s readsources`.
- `pattr sources` uses `s t_sourcespreset` / `r f_sourcespreset`; source nav `s sourcenext` /
  `s sourceprev`, `s sourcestab`, `s sequence`.
- Standard preset messages seen inline: `;\rtoPS store 0`, `;\rtoPS 0`.

**OSC transport:** `r osc_in` / `s osc_in`, `r osc_out` / `s osc_out` (used by many subpatchers);
top dispatch strings quoted under Key patchers.

**Output / window control:** `s syphon_output` (obj-52, line ~1766), `s win_output`, `s win_preview`,
`r/s fullscreen_size`, `r setwindowsize`, `r/s windowsize`, `r/s prewindowsize`, `s framerate`,
`s vpt_metro`, `r qmetro` / `s qmetro`, `r previewspeed` / `s previewspeed`, `s masterfade`,
`r blackout`, `r blind`, `s blackoutbutton`, `s blind`, `s fscreen` / `r fscreen`,
`prepend /fullscreen` → `s osc_out`, `s master_toggle`, `r nlayers` (obj-172, line ~3798; the
app-wide layer-count channel driven from the root patcher's `s nlayers`).

**Master-output geometry:** `s/r cornerpin`, `s mastercorner` / `r mastercorner`,
`s mastercorner_draw`, `s corner_radius` / `r corner_radius`, `s calc_radius`, `s active_corner`,
`s active_xy` / `r active_xy`, `s cur_xy` / `r cur_xy`, `s center_xy`, `s multiplier_xy`,
`s LR/UR/LL/UL` and `r LR_send/UR_send/LL_send/UL_send` (+ matching `_receive`).

**pattr binding:** `pattrstorage vpt` (varname `vpt`) and `pattr sources` (varname `sources`) are the
only two `pattr`-family objects in the file; both are quoted above.

## Dependencies

- `code/vlayer2.js` — the `[js vlayer2.js]` layer-manager script inside `p VPT` (`"filename" : "vlayer2.js"`,
  line 6454). This is the sole embedded script in the file and the mechanism for dynamic layer creation.
- `patchers/vlayer.maxpat` (Task 3) — instantiated dynamically by `vlayer2.js` as `bpatcher @name vlayer`
  (varname `<N>layer`, arg `N`) and once statically as `vlayer 99` (obj-44, the blackout layer). The
  `p mesh-scaler` comment explicitly notes the `jit.gl.nurbs` mesh objects it scales are "found in
  vlayer".
- Jitter GL runtime objects: `jit.world` (obj-58), `jit.gl.render` (obj-56), `jit.gl.videoplane`
  (obj-3), `jit.gl.sketch` (obj-1, line ~1238), `jit.fpsgui` (obj-1), and `jit.gl.nurbs` (referenced
  in comment). All depend on Jitter/OpenGL being present.
- `OSC-route` object is used pervasively (a dozen instances) as the OSC message router; it is an
  OSC/odot-family object that must be on the Max search path for the tab to load.
- `s syphon_output` routes the composited output to the Syphon server external (a Mac-only
  `externals/*.mxo`, per `CLAUDE.md`) that lives in another patcher — so the Syphon output path is
  reachable only on macOS.
- No `shaders/*.jxs` files are referenced by name in this file; GL effects/blend shaders live inside
  the per-layer `vlayer` engine and the mixer, not here.

### Cross-cluster connection points (Tasks 5–7, not yet written)

- **To the per-layer engine (`vlayer.maxpat`, Task 3):** dynamic `bpatcher @name vlayer` creation in
  `vlayer2.js`; control via `s to_layer` (`/<N>layer/...`), `s layers`, and `send <N>layer_init`
  seeding.
- **To video sources (Tasks 6–7):** `pattr sources` (varname `sources`), `s ps_sources` /
  `r recall-ps_sources`, `s readsources`, `s to_sources`, `s sourcenext` / `s sourceprev`,
  `s sourcestab`, and the OSC `/sources` and `/sourcepreset` branches of the top dispatcher.
- **To the mixer/output (`mix-vpt7.maxpat`, Task 5):** coupling is *not* by patchcord and the file
  never names `mix-vpt7` — it is by the shared GL context. The mixer attaches to the same
  `jit.world vpt @shared 1 @output_texture 1` context (name string `vpt`) and to `s syphon_output` /
  `s win_output`; masterfade/blackout/corner-pin state is shared via `s masterfade`, `r blackout`,
  and `s/r cornerpin`.

## Notable patterns

- **One shared GL context named `vpt`.** All rendering coupling across files is by the *string*
  `vpt` passed to `jit.world`/`jit.gl.*`, not by connections. This is elegant but invisible: nothing
  enforces that the mixer, dividers and every `vlayer` agree on the name.
- **Reserved magic indices.** Layer `99` is the blackout layer, `layerorder 200` forces it on top,
  and GL `@layer 88` is the multiscreen divider sketch. These numbers are hardcoded in several places
  and assume real layers never reach them.
- **Stringly-typed layer identity.** A layer's bpatcher varname (`<N>layer`), its OSC control address
  (`/<N>layer/...`), and its pattr keys (`<N>layer::<param>`) are all assembled by
  `toString()`/`sprintf` in three different spots (`vlayer2.js`, `sprintf /%ilayer/layerorder %i`,
  `sprintf interp %ilayer::%s off`). They must stay in lock-step by convention only.
- **Order vs identity.** `vlayer2.js` keeps a separate `layers[]` order array (monkey-patched with
  `Array.prototype.move`) so layers can be reordered in the stack without recreating them; identity
  is the varname number, order is the array position.
- **Flat global send/receive namespace.** Names like `osc_in`, `osc_out`, `toPS`, `refresh`, `lbe`
  are reused across many nested subpatchers, so a single receive fires from any matching send anywhere
  in the app.
- **Manual, scripted restore.** `pattrstorage vpt` is `@autorestore 0 @savemode 0`; project state is
  rebuilt explicitly via `startupLayers`/`/initdone` and an "after initdone read presets" sequence
  (comment at line ~6216), not by Max's automatic restore.
- **Design residue in the driver script.** `code/vlayer2.js` still contains the earlier
  `newdefault(...,"vlayer",...)` implementation (commented out) alongside the current bpatcher-based
  one, showing the layer representation changed from raw abstraction instance to bpatcher.

## Tech-debt findings

1. **[architectural-fragility]** The engine tab is a single 23,229-line patcher mixing unrelated
   concerns — the shared GL context, the layer manager, the master preset store, the app-wide OSC
   dispatcher, the corner-pin/keystone editor, multiscreen dividers, and serial output. Any change
   requires navigating an enormous file with deep nesting. Location: `vpt8 source code/patchers/enginetab.maxpat`
   (whole file; e.g. `p VPT` at line ~7003 vs `p cornerpin-calculations` at line ~22417).
   Severity: high. Effort: high.
2. **[architectural-fragility]** Cross-module coupling relies entirely on stringly-typed shared
   names — the GL context name `vpt` and a flat global send/receive namespace (`osc_in`, `osc_out`,
   `toPS`, `refresh`, `to_layer` …). Renaming any string silently breaks the mixer, sources or preset
   wiring with no compile-time check. Location: `enginetab.maxpat` — `jit.world vpt @enable 0 ... @shared 1 @output_texture 1`
   (line ~438) and the OSC dispatcher `OSC-route /layers /focus /vlayer ...` (line ~10010).
   Severity: medium. Effort: high.
3. **[hardcoded-limit]** Reserved layer/GL indices are hardcoded and scattered: blackout layer id
   `99` and `layerorder 200`, and divider sketch `@layer 88`. Real layers silently colliding with
   these numbers would misbehave. Location: `enginetab.maxpat` — `vlayer 99` (line ~697),
   `;\rosc_in /99layer/layerorder 200` (line ~619), `jit.gl.sketch vpt @layer 88 @enable 0`
   (line ~1238). Severity: medium. Effort: medium.
4. **[naming-inconsistency]** The layer-count concept is spelled three ways: the value object
   `v nLayers` (camelCase, line ~3870), the receive `r nlayers` (lowercase, line ~3798, fed from the
   root patcher's `s nlayers`), and the `p VPT` receive `r layerinit`/`varname "nLayersinit"`
   (line ~6291). Nothing ties them together, so it is easy to wire the wrong one. Location:
   `enginetab.maxpat` — lines ~3798, ~3870, ~6291. Severity: low. Effort: low.
5. **[dead-code]** `code/vlayer2.js` carries a commented-out original `init()` and `addLayer()`
   (lines 11–24) and a hand-rolled busy-wait `wait(w)` function (lines 45–50) whose only call site is
   also commented out (`//wait(50000);`, line 39). Location: `vpt8 source code/code/vlayer2.js` —
   lines 11–24, 39, 45–50. Severity: low. Effort: low.
6. **[platform-gap]** The composited output is routed to `s syphon_output`, whose consuming Syphon
   external is Mac-only (`externals/*.mxo`, per `CLAUDE.md`); there is no bundled Windows equivalent,
   so this output path is dead on Windows even though VPT ships for both platforms. Location:
   `enginetab.maxpat` — `s syphon_output` (line ~1766). Severity: low. Effort: high.
7. **[toolchain-version]** The patcher is saved for Max 7.3.5, 64-bit (`"major":7,"minor":3,"revision":5,"architecture":"x64"`)
   and has been untouched since VPT8's 2018 release; the deeply nested GL/`pattrstorage` wiring has no
   guaranteed forward compatibility with Max 8/9. Location: `enginetab.maxpat` — `appversion` block,
   lines 4–9. Severity: low. Effort: high.
