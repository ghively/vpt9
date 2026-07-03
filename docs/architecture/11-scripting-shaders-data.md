# Scripting, shaders & data

## Purpose

This cluster covers VPT8's three non-`.maxpat` source kinds, all of which are consumed *by*
patchers documented in Tasks 1-10 but live as standalone files: (1) the 5 `code/*.js` scripts run
inside Max `[js]` objects that implement the dynamic per-layer/per-tab bpatcher-instantiation
lifecycle (`addLayer`/`deleteLayer`/`startupLayers`) and the two `mgraphics` point-editor state
machines; (2) the ~63 GL shader files under `shaders/` (14 top-level effect shaders, 24 blend-mode
mixer shaders + companions under `shaders/v001 Mixers/`, 15 shared vertex/fragment includes under
`shaders/shared/{arb,cg,glsl}/`, and 2 third-party license attributions under
`shaders/shared/licenses/`) that implement every GL-side visual effect (color correction,
transitions, blend-mode compositing, distortion/masking) as `jit.gl.slab`-loaded `.jxs` programs
rather than as patcher logic; and (3) the 3 `data/*.json` files, which are `pattrstorage` snapshot
dumps (generated state, not hand-authored source) plus the project manifest (`vpt8.maxproj`),
release notes (`VPT8-sourcecode-readme.rtf`), and the empty `openactions.txt`. It also covers the 7
precompiled Mac-only `externals/*.mxo` binaries bundled with the project, cross-referencing which of
the 49 patchers under `patchers/` actually instantiate each one.

## Files in this cluster

- `vpt8 source code/code/dummylayers02c.js`, `pointgrid01b.js`, `pointmask01.js`, `tabs.js`,
  `vlayer2.js` (5 files)
- `vpt8 source code/shaders/*.jxs` — 14 top-level shader files (`ab.spotmask_mod01.jxs`,
  `cc.alphaglue.jxs`, `cc.alphaglue01.jxs`, `cc.brightness.ip.jxs`, `cc.contrast.ip.jxs`,
  `cc.saturate.ip.jxs`, `cc.scalebias.jxs`, `cc.uyvy2rgba.lite.jxs`, `cf.gaussian.2p.jxs`,
  `co.xfade.jxs`, `td.rota.jxs`, `tp.slide.jxs`, `tr.edgeblend.jxs`, `tr.edgeblend01.jxs`)
- `vpt8 source code/shaders/v001 Mixers/` — 48 files: 24 `.jxs` blend-mode definitions + 23
  companion `.fp.glsl` fragment programs + 1 shared `v001.co2.vp.glsl` vertex program
- `vpt8 source code/shaders/shared/arb/` — 3 files (`sh.basic.vp.arb`, `sh.passthru.fp.arb`,
  `sh.passthru.vp.arb`)
- `vpt8 source code/shaders/shared/cg/` — 2 files (`sh.passthru.fp.cg`, `sh.passthru.vp.cg`)
- `vpt8 source code/shaders/shared/glsl/` — 10 files (`cf.box8.vp.glsl`, `cf.box9.vp.glsl`,
  `cf.cross5.vp.glsl`, `cf.diag5.vp.glsl`, `op.binary.vp.glsl`, `op.unary.vp.glsl`,
  `sh.basic.vp.glsl`, `sh.passthru.color.fp.glsl`, `sh.passthru.xform.vp.glsl`,
  `sh.passthrudim.vp.glsl`)
- `vpt8 source code/shaders/shared/licenses/` — 2 files (`3Dlabs-license.txt`,
  `LightworkDesign-license.txt`)
- `vpt8 source code/data/gui.json`, `presets.json`, `sources.json` (3 files)
- `vpt8 source code/vpt8.maxproj`, `openactions.txt` (0 bytes), `VPT8-sourcecode-readme.rtf`
- `vpt8 source code/externals/` — 7 precompiled `.mxo` bundles (names only, binaries not read):
  `imp.artnet.node.mxo`, `jit.gl.syphonclient.mxo`, `jit.gl.syphonserver.mxo`, `Label.mxo`,
  `Ldiv.mxo`, `Lmult.mxo`, `o.route.mxo`

All counts above were re-derived directly with `find code shaders data externals -type f | sort`
and per-directory `find ... | wc -l` (not taken from `CLAUDE.md`).

## Key scripts, shaders & data files

### `code/*.js` scripts

- **`vlayer2.js`** (outlets=2) — the video-processing-engine driver, embedded as `[js vlayer2.js]`
  inside `patchers/enginetab.maxpat` (grep-confirmed) and referenced (for cross-file context) from
  `patchers/vpt7project.maxpat`. Exports `addLayer()` / `startupLayers(n)` / `deleteLayer()`
  (identical `this.patcher.newdefault(0,0,"bpatcher","@name","vlayer",...)` lifecycle pattern
  documented for the layer triad in `CLAUDE.md`), plus two functions **not** shared by the other two
  triad scripts: `layerprint()` (emits `/layerorder <id> <pos>` per layer, then `/order_refresh 1`)
  and `movelayer(layerid, newpos)` (splices a `layers[]` order-tracking array via a hand-rolled
  `Array.prototype.move` polyfill added directly onto the global `Array` prototype — see Tech-debt
  finding 1). A `wait(w)` function (lines 45-50) is a busy-loop (`for` counting to `w*100`) that is
  defined but never called from anywhere in the file — dead code, and even if called would block
  Max's single UI thread rather than actually delaying anything asynchronously.
- **`dummylayers02c.js`** (outlets=2) — the per-layer GUI-bank driver, embedded inside
  `patchers/layersbank.maxpat` (grep-confirmed) and cross-referenced from
  `patchers/vpt7project.maxpat`. Exports `addLayer()` / `startupLayers(n)` / `deleteLayer()`
  instantiating `bpatcher "@name" "layergui"` with `@varname <N>layergui`; no `init()` function is
  defined (unlike `pointgrid01b.js`/`pointmask01.js`).
- **`tabs.js`** (outlets=2) — the per-layer tab-selector driver, embedded inside
  `patchers/vpt7project.maxpat` directly (grep-confirmed exact match on `tabs.js`; earlier broad
  substring greps for `tabs` alone falsely also matched unrelated files like
  `layertab.maxpat`/`solid01_vpt7.maxpat` merely because they contain the substring "tabs" — the
  precise `tabs.js` string appears only in `vpt7project.maxpat`). Exports `addLayer()` /
  `startupLayers(n)` / `deleteLayer()` instantiating `bpatcher "@name" "layertab"` with
  `@varname <N>layertab`, and additionally computes a wrapped `presentation_rect` grid position
  (`30+21*(i%8), 35+21*floor(i/8)`) so tab buttons wrap onto a new row every 8 layers — logic absent
  from the other two triad scripts.
- **`pointgrid01b.js`** (outlets=3) — an `mgraphics`-based NxN draggable-point-grid editor, embedded
  inside `patchers/gridcontroller.maxpat` (grep-confirmed), and reachable (for context) from
  `patchers/activelayer.maxpat`, `patchers/controltabs.maxpat`, `patchers/vpt7project.maxpat`.
  Exports `init(gridsize)`/`init2(gridsize)` (near-duplicate: `init2` is identical to `init` minus
  the trailing `gridlist()` call — see Tech-debt finding 2), `create_points(gridsize)`
  (builds an evenly-spaced NxN point array), `setgridsize(gridsize)`, `savedgrid()` (restores a
  flattened `x,y,x,y,...` array via `arrayfromargs`), `draw(gridsize)`/`redraw()`, and the mouse
  state machine `button_down()`/`button_up()`/`mouse_loc(x,y)`/`bang()` driven by external
  `mouse.down`/`mouse.hit` events. Unlike `pointmask01.js`, clicking empty space does **not** insert
  a new point (the `else new_point(...)` branch present in `pointmask01.js`'s `eval_hit()` is
  commented out here, line 148).
- **`pointmask01.js`** (outlets=3) — an `mgraphics`-based fixed-ratio (1.333, 4:3) polygon mask-shape
  editor, embedded inside `patchers/pointmask.maxpat` (grep-confirmed), and reachable from
  `patchers/activelayer.maxpat`, `patchers/controltabs.maxpat`, `patchers/vpt7project.maxpat`.
  Starts with a fixed 3-point triangle (`create_points()`, hardcoded `(-.9,-.9)`, `(0,.9)`,
  `(.9,-.9)`), and — unlike `pointgrid01b.js` — supports inserting new points on empty-space click
  (`eval_hit()`'s `else new_point(...)`, nearest-segment insertion via `segmentDistToPoint`) and
  deleting the most-recently-deselected point (`delete()`, using a `dead_point` tracked across
  `button_up()` calls). Exports `mask()`/`outline()` (fill vs. stroke render + `masklist()` dump +
  `shape_commands()` dump), `savedmask()` (restores from a flattened `x,y,...` array), and an unused
  `ellipse(w,h)` helper (defined, never called from any other function in the file or, per grep,
  invoked by name from any patcher — see Tech-debt finding 2).

### Shaders, grouped by category

All effect shaders are `.jxs` (Jitter's XML wrapper: `<jittershader>` → `<param>` list → one
`<language>` block → `<program name="vp|fp" ...>` either inline GLSL/ARB/Cg in a `CDATA` block or a
`source="filename"` pointer into `shaders/shared/`), loaded at runtime by `jit.gl.slab @file
<name>.jxs` or `loadmess sendshader read <name>.jxs` (both forms confirmed via grep, e.g.
`patchers/layermask.maxpat`: `"jit.gl.slab vpt @file cc.alphaglue.jxs @param lu..."`;
`patchers/vlayer.maxpat`: `"loadmess sendshader read cf.gaussian.2p.jxs"`).

**Color correction (`cc.*.jxs`, 7 files):**
- `cc.brightness.ip.jxs`, `cc.contrast.ip.jxs`, `cc.saturate.ip.jxs` — brightness/contrast/
  saturation via interpolation-extrapolation, each with an inline GLSL vp+fp pair explicitly
  authored by Randi Rost, copyright 2002-2005 3Dlabs Inc. (comment: `"See 3Dlabs-License.txt for
  license information"` in every one of the 6 program blocks across these 3 files) — the direct
  reason `shaders/shared/licenses/3Dlabs-license.txt` is bundled. Used by `patchers/vlayer.maxpat`
  (`cc.brightness.ip.jxs`, grep-confirmed) and `patchers/vlayer.maxpat`+1 other
  (`cc.contrast.ip.jxs`, 2 patchers); `cc.saturate.ip.jxs` used by 1 patcher.
- `cc.alphaglue.jxs` — uses a second texture's selected color plane (or luma) as the first
  texture's alpha channel, with a brightness threshold/fade; inline GLSL, `Copyright 2006 -
  Cycling '74` (Andrew Benson). Used by `patchers/layermask.maxpat` (1 patcher, grep-confirmed).
- `cc.alphaglue01.jxs` — near-identical to `cc.alphaglue.jxs` plus one extra line
  (`al *= at.a;`, multiplying the computed alpha by the first texture's own pre-existing alpha).
  **Never referenced by filename in any of the 49 patchers** (grep-confirmed 0 matches) — dead file
  (see Tech-debt finding 3).
- `cc.scalebias.jxs` — scale+bias per RGBA channel; the **only** top-level shader targeting
  `language name="arb"` (legacy `!!ARBfp1.0` assembly, `source="sh.passthru.vp.arb"` for its vertex
  stage) rather than GLSL. **Never referenced by filename in any of the 49 patchers**
  (grep-confirmed 0 matches) — the entire ARB code path this file represents appears unreachable at
  runtime (see Tech-debt finding 4).
- `cc.uyvy2rgba.lite.jxs` — packed UYVY→RGBA colorspace conversion (CCIR 601/ITU-R), inline GLSL,
  `source="sh.passthru.xform.vp.glsl"` for its vertex stage. **Never referenced by filename in any
  of the 49 patchers** (grep-confirmed 0 matches).

**Transitions/mixing (top-level, 3 files):**
- `co.xfade.jxs` ("accum") — simple two-texture cross-fade (`mix(a,b,xfade)`); `source=
  "sh.passthru.xform.vp.glsl"`. Used by 3 patchers (grep-confirmed).
- `tr.edgeblend.jxs` — generates a gradient alpha mask from 4 independent edge-fade widths (xy
  fade vec4) for projector edge-blending; inline GLSL, Andrew Benson/Cycling '74 2006;
  `source="sh.passthrudim.vp.glsl"`. **Never referenced by filename in any of the 49 patchers**
  (grep-confirmed 0 matches) — the original, pre-`01` revision.
- `tr.edgeblend01.jxs` — identical to `tr.edgeblend.jxs` plus one extra line
  (`wiped.a *= a.a;`, same "multiply by pre-existing alpha" pattern as `cc.alphaglue01.jxs`). This
  is the version actually loaded, by `patchers/vlayer.maxpat` (`"...b vpt @file
  tr.edgeblend01.jxs"`, grep-confirmed, 1 patcher) — i.e. of the `edgeblend`/`edgeblend01` pair,
  the base file is orphaned and the `01` revision is live (the *opposite* of the
  `alphaglue`/`alphaglue01` pair, where the base file is live and the `01` revision is orphaned —
  see Tech-debt finding 3).

**Blend-mode mixers (`shaders/v001 Mixers/`, 24 `.jxs` + 23 `.fp.glsl` + 1 shared `.vp.glsl`):**
`additive`, `alphablend`, `average`, `brightlight`, `burn`, `darken`, `difference`, `dodge`,
`exclude`, `freeze`, `glow`, `hardlight`, `heat`, `inverse`, `lighten`, `lumablend`, `multiply`,
`negate`, `overlay`, `reflect`, `screen`, `softlight`, `stamp`, `subtractive`. All but `lumablend`
follow an identical structure: the `.jxs` binds `amount` (vec4)/`tex0`/`tex1`, uses
`source="v001.co2.vp.glsl"` for the vertex stage (a plain two-texcoord passthrough, Andrew
Benson/Cycling '74 2005) and `source="v001.co2.<name>.fp.glsl"` for the fragment stage; each
fragment program defines a named blend function (e.g. `vec4 multiply(vec4 myInput, vec4
previousmix, vec4 amount)`) and calls it symmetrically twice (`mix1`/`mix2`, swapping which texture
is "input" vs. "previous") before a final `mix(mix1, mix2, amount)` — a self-consistent, deliberate
pattern across all 23. `lumablend` is the outlier: it uses inline GLSL (not a separate `.fp.glsl`
file) and `source="sh.passthru.xform.vp.glsl"` (the generic shared include) rather than
`v001.co2.vp.glsl`, and its `amount` param is a scalar `float`, not `vec4`. Only `mix-vpt7.maxpat`
loads any of these 24 files (`"sprintf read v001.co2.%s.jxs"` → `jit.gl.slab`, grep-confirmed — the
sole patcher referencing `v001.co2` anywhere).

**Distortion/masking (4 files):**
- `ab.spotmask_mod01.jxs` ("blank" — the shader's own `<description>` literally reads "shader
  program that does absolutely nothing!") — a soft-edged circular spotlight mask
  (`smoothstep`-based radial falloff written to the alpha channel); inline GLSL,
  `source="sh.passthrudim.vp.glsl"`. **Never referenced (by any "spotmask" substring) in any of the
  49 patchers** (grep-confirmed 0 matches) — dead file (see Tech-debt finding 3).
- `cf.gaussian.2p.jxs` ("gaussian") — a 7-tap, single-axis Gaussian blur (weights
  `0.1752/0.1658/0.1403/0.1063`), driven by a `width` vec2 param bound to the **vertex** stage (the
  7 sample offsets are computed once in the vp and passed as `varying`s, not recomputed per-fragment
  in the fp) — used twice per blur (horizontal pass + vertical pass, inferred from the `width vec2`
  taking either an x or y offset). Used by 3 patchers (grep-confirmed, incl.
  `patchers/jit.gl.slab.gauss6x.maxpat`, `patchers/layermask.maxpat`, `patchers/vlayer.maxpat`).
- `td.rota.jxs` ("rotation shader" — `<description>kaleidoscope</description>`) — combined
  zoom/rotate/pan/anchor transform with 5 selectable `boundmode`s (passthrough, ignore-out-of-bound,
  wrap, unused-mode-3, fold/mirror), inline GLSL, `source="sh.passthrudim.vp.glsl"`. Used by 2
  patchers.
- `tp.slide.jxs` ("slide") — a directional "slide up"/"slide down" transition between two textures
  based on per-channel comparison (`input0.x > input1.x`); fully inline GLSL vp+fp (does not use any
  `shaders/shared/` include). Used by 1 patcher.

**Shared includes (`shaders/shared/{arb,cg,glsl}/`) — usage confirmed by grepping every `.jxs` in
the repo for `source="<filename>"`:**

| File | Used by (count) | Status |
|---|---|---|
| `glsl/sh.passthrudim.vp.glsl` | 6 `.jxs` files | live |
| `glsl/sh.passthru.xform.vp.glsl` | 3 `.jxs` files (`cc.uyvy2rgba.lite.jxs`, `co.xfade.jxs`, `v001.co2.lumablend.jxs`) | live |
| `arb/sh.passthru.vp.arb` | 1 `.jxs` file (`cc.scalebias.jxs`, itself unreferenced — see above) | effectively dead |
| `glsl/cf.box8.vp.glsl`, `cf.box9.vp.glsl`, `cf.cross5.vp.glsl`, `cf.diag5.vp.glsl`, `op.binary.vp.glsl`, `op.unary.vp.glsl`, `sh.basic.vp.glsl`, `sh.passthru.color.fp.glsl` | 0 `.jxs` files | dead |
| `arb/sh.basic.vp.arb`, `arb/sh.passthru.fp.arb` | 0 `.jxs` files | dead |
| `cg/sh.passthru.fp.cg`, `cg/sh.passthru.vp.cg` | 0 `.jxs` files | dead |

i.e. **12 of the 15 shared vertex/fragment includes are never `source=`-referenced by any of the 62
`.jxs` files in this repo** (see Tech-debt finding 3). `arb/sh.passthru.fp.arb` is additionally a
literal **0-byte empty file** (verified: `wc -l` → 0 lines, `ls -la` → 0 bytes) — even if some future
shader did reference it as its fragment program, it could not compile.

### `data/*.json` pattrstorage dumps

All three are `{"pattrstorage": {"name": ..., "slots": {"<id>": {"id": ..., "data": {...}}}}}`
snapshot dumps written by Max's `pattrstorage` object — generated state, not hand-authored source.

- **`gui.json`** (`pattrstorage` name `"gui"`) — 1 slot only (`"1"`), holding 2 scalar UI-state
  values: `gui_divider` (a divider-position pixel offset, `[87]`) and `gui_tab` (`[0]`, the
  currently-selected control tab index). Matches `layersbank.maxpat`'s `globalpatchername":"gui"` /
  `pattrmarker gui` scoping (Task 5's doc).
- **`presets.json`** (`pattrstorage` name `"vpt"`) — **11** slots (ids 1-11, grep-confirmed via
  `grep -c '"id"'`), one per user preset (`"name"` values: `loopoff`, `loopon`, `presetname` ×4,
  `nnks`, `presetname` ×4 more — i.e. only 3 of 11 presets were ever given a non-default name). Each
  slot's `data` holds ~44 keys, almost all empty arrays (`[  ]`, meaning "not yet captured for this
  preset") except a single populated key per slot: `"sources" : [ 100<N> ]` — a cross-reference into
  `sources.json`'s slot IDs. The 44 keys are namespaced `1layer::<module>::<param>` (e.g.
  `1layer::brcosa::brightness`, `1layer::edgeblend::on`, `1layer::mask::points`,
  `1layer::cornerpin::upper_left`) — i.e. this dump only ever captured layer-1's parameters, one
  literal key per per-layer module (`mesh`, `zoom`, `edgeblend`, `brcosa`, `mblur`, `blur`, `tile`,
  `cornerpin`, `mask`, `flip`, plus flat `blendmode`/`rgb`/`fade`/`source`/`layername`/`layerorder`)
  — matching the per-layer module set documented across Tasks 2-4.
- **`sources.json`** (`pattrstorage` name `"sources"`) — **9** slots (grep-confirmed via
  `grep -c '"id"'`), with ids `1`, `2`, `3`, `1006`, `1007`, `1008`, `1009`, `1010`, `1011` — **not**
  a contiguous 1-11 range. Each slot's `data` holds ~90 keys for the 8 `videobankNN` source-bank
  slots (`videopath`/`loop`/`xfade`/`video`/`rate`/`on`/`alpha`/`resolution`/`refreshrate`/`volume`,
  plus `in`/`out` for bank 1 and `autotrig` for banks 1-4) plus `solid1`/`solid2`/`cam1`/`cam2`/
  `syphon1`-`syphon4` on/resolution/refreshrate keys. See Tech-debt finding 5 for the cross-file
  slot-ID mismatch this produces against `presets.json`.

### `vpt8.maxproj`, `VPT8-sourcecode-readme.rtf`, `openactions.txt`

- **`vpt8.maxproj`** — the Max project manifest. Its `"contents"` object explicitly lists only 2
  patchers as toplevel (`vpt7project.maxpat` — `"toplevel":1` — and `hapsource.maxpat`, matching
  `CLAUDE.md`), and declares **empty** `"media"`, `"code"`, `"data"`, `"externals"` sub-objects
  (verified by reading the full 59-line file) — i.e. the project's own manifest does not enumerate
  any of the 5 `code/*.js`, 3 `data/*.json`, or 7 `externals/*.mxo` files that in fact exist on disk
  and are actively used (see Tech-debt finding 6). The file also embeds a base64 PNG `coverimage`
  thumbnail inline (line 58).
- **`VPT8-sourcecode-readme.rtf`** — a 1-paragraph RTF note: VPT 8 released May 2018, 64-bit only,
  Mac and Windows, licensed under **Creative Commons Attribution-NonCommercial-ShareAlike 3.0
  Unported**, copyright "2007, 2008, 2009, 2010, 2011, 2013, 2018 by HC Gilje" (see Tech-debt
  finding 7).
- **`openactions.txt`** — confirmed genuinely empty (0 bytes, 0 lines via both `wc -l` and `ls -la`).

### `externals/*.mxo`

7 precompiled Mac-only binary bundles (each a standard `.mxo` package: `Contents/MacOS/<name>`,
`Contents/Info.plist`, `Contents/PkgInfo`; the two Syphon ones additionally bundle a
`Syphon.framework`). No source is present in this repo for any of them. Actual usage, confirmed by
grepping every `patchers/*.maxpat` for each external's exact object-instantiation text (not just its
appearance in a patcher's `dependency_cache` metadata block, which over-reports — see Tech-debt
finding 8):

- **`jit.gl.syphonclient.mxo`** — instantiated exactly once, in `patchers/syphon_vpt7.maxpat`
  (`"text":"jit.gl.syphonclient vpt @enable 0"`). Also listed in `sourcebank.maxpat`'s and
  `vpt7project.maxpat`'s `dependency_cache` (transitive, via embedding `syphon_vpt7.maxpat`).
- **`jit.gl.syphonserver.mxo`** — instantiated exactly once, in `patchers/vpt-syphonout.maxpat`
  (`"text":"jit.gl.syphonserver vpt @servername output @enable 0"`). Also listed in
  `sourcebank.maxpat`'s and `vpt7project.maxpat`'s `dependency_cache` (transitive).
- **`imp.artnet.node.mxo`** — Art-Net/DMX lighting-protocol output, instantiated exactly once, in
  `patchers/artnet-vpt.maxpat` (`"text":"imp.artnet.node @universe 1 @mode 2"`). Also listed in
  `controltabs.maxpat`'s and `vpt7project.maxpat`'s `dependency_cache` (transitive, via embedding
  `artnet-vpt.maxpat`).
- **`Label.mxo`** — a small custom logic external instantiated (lowercase `label`, e.g.
  `"text":"label /on /gridsize /position"`, `"label /on /brightness /contrast /saturation"`, etc.)
  directly in `patchers/activelayer.maxpat` (10 instances), `patchers/clipcontrol.maxpat` (1),
  `patchers/enginetab.maxpat` (1). `patchers/controltabs.maxpat` and `patchers/vpt7project.maxpat`
  only carry it in their `dependency_cache` (transitive, via embedding `activelayer.maxpat`). Note
  the object is invoked with an all-lowercase class name (`label`) while the bundled binary and
  bundle folder are capitalized (`Label.mxo`/`Contents/MacOS/Label`) — this resolves correctly only
  because macOS's default filesystem (HFS+/APFS in its default mode) is case-insensitive; it would
  fail to load on a case-sensitive filesystem (see Tech-debt finding 9).
- **`Ldiv.mxo`** — instantiated once, lowercase, in `patchers/vlayer.maxpat`
  (`"text":"ldiv 255."`) — same lowercase-vs-`Ldiv.mxo` case mismatch as `Label.mxo`.
  `vpt7project.maxpat` only carries it in `dependency_cache` (transitive).
- **`Lmult.mxo`** — instantiated twice, lowercase, in `patchers/enginetab.maxpat`
  (`"text":"lmult 1.5 1.5"` ×2) — same case mismatch. Listed in `vpt7project.maxpat`'s
  `dependency_cache` only (transitive).
- **`o.route.mxo`** — declared in the `dependency_cache` of 5 patchers (`controltabs.maxpat`,
  `layersbank.maxpat`, `lforack-vpt7.maxpat`, `router-vpt7.maxpat`, `sourcebank.maxpat`) but **never
  found as an actual instantiated object** (`"text":"o.route..."`) in **any** of the 49 patchers —
  grep-confirmed across the entire `patchers/` directory. Whatever object each of those 5 patchers'
  routing logic actually uses (`router-vpt7.maxpat` itself only shows plain `route`, `p router`, and
  a subpatcher named `"p router"` — all built-in Max objects, not `o.route`), `o.route.mxo` appears
  to be an unused/orphaned bundled dependency (see Tech-debt finding 10).

**`OSC-route` — used pervasively but not bundled anywhere in this repo.** The brief for this cluster
asked specifically whether `OSC-route.mxo` exists: it does **not**. `OSC-route` (capital-letters,
hyphenated — a visibly different object from `o.route`) is instantiated as a real object in **17**
patchers with dozens of call sites (e.g. `patchers/enginetab.maxpat`:
`"OSC-route /layers /focus /vlayer /pstorage /copy /paste /onoff /sources /mastercorner ..."`;
`patchers/layersbank.maxpat`: `"OSC-route /numberofLayers"`), forming the backbone of VPT's internal
OSC-style message dispatch. Yet there is **no** `OSC-route.mxo` under `externals/`, and **no**
`OSC-route.maxpat` abstraction anywhere in `patchers/` (`find . -iname "*osc-route*"` — confirmed 0
matches outside the citing patchers themselves). It must therefore resolve to a Max built-in or a
third-party package (e.g. CNMAT's OSC library ships an object of this name) installed separately on
whatever machine originally built/ran this project — undocumented and unverifiable from this repo
alone (see Tech-debt finding 11).

## Data flow

**Layer-lifecycle scripts** (`vlayer2.js`, `dummylayers02c.js`, `tabs.js`): each receives
`addLayer`/`deleteLayer`/`startupLayers $1` messages via inlet 0 from its host patcher's `r
dummylayer`-style receive object (documented per-file in Tasks 1-3/5); each emits `outlet(0,
"/numberofLayers", N)` plus `outlet(1, "send "+N+"<suffix>_init")` where `<suffix>` is
`layer`/`layer`/`tab` respectively — the varying suffix is the only cross-script naming
inconsistency in an otherwise identical lifecycle contract.

**Point-editor scripts** (`pointgrid01b.js`, `pointmask01.js`): inlet-driven mouse events
(`button_down`/`button_up`/`mouse_loc`/`bang`) → internal `points[]` array mutation → `outlet(0,
...)` mgraphics drawing commands (`move_to`/`line_to`/`ellipse`/`fill`/`stroke`) consumed by a
sibling `mgraphics` object in the host patcher, plus `outlet(1 or 2, ...)` dumps of the raw point
list (`masklist`/`gridlist`/`/position`/`/gridsize`) for external consumption (e.g. into a
`pattrstorage`-backed `1layer::mask::points` / `1layer::mesh::position` parameter, per
`presets.json`'s key namespace above).

**Shaders**: a hosting patcher's `jit.gl.slab @file <name>.jxs` (or a `loadmess sendshader read
<name>.jxs` message) loads one `.jxs` definition; its declared `<param>`s are bound via patcher-side
`@param`/message-driven attribute sets (e.g. `cc.alphaglue.jxs`'s `plane`/`thresh`/`fade`/`lumcoeff`);
each `<program>` either inlines its GLSL/ARB/Cg source or points (`source="..."`) into
`shaders/shared/`, which is resolved via Max's file search path at shader-compile time (not visible
as a patchcord — a load-time file lookup, invisible to patcher-level dataflow tracing).

**`data/*.json`**: written by Max's `pattrstorage` object in response to UI edits + explicit
`store`/`recall` messages (the `route store` / `route read recall` message-text patterns Task 5
documented in `sourcebank.maxpat`); read back at project-load/preset-recall time to restore the
`1layer::*` / `videobankNN::*` / `gui_*` parameter tree.

## Dependencies

- `code/vlayer2.js` ↔ `patchers/enginetab.maxpat` (embedding); cross-referenced by
  `patchers/vpt7project.maxpat`.
- `code/dummylayers02c.js` ↔ `patchers/layersbank.maxpat` (embedding); cross-referenced by
  `patchers/vpt7project.maxpat`.
- `code/tabs.js` ↔ `patchers/vpt7project.maxpat` (embedding, directly — not via `layertab.maxpat`).
- `code/pointgrid01b.js` ↔ `patchers/gridcontroller.maxpat` (embedding); cross-referenced by
  `patchers/activelayer.maxpat`, `patchers/controltabs.maxpat`, `patchers/vpt7project.maxpat`.
- `code/pointmask01.js` ↔ `patchers/pointmask.maxpat` (embedding); cross-referenced by
  `patchers/activelayer.maxpat`, `patchers/controltabs.maxpat`, `patchers/vpt7project.maxpat`.
- `shaders/*.jxs` (top-level) ↔ `patchers/vlayer.maxpat`, `layermask.maxpat`,
  `jit.gl.slab.gauss6x.maxpat`, and others, one `jit.gl.slab @file` per shader (usage table above).
- `shaders/v001 Mixers/*.jxs` (24 files) ↔ `patchers/mix-vpt7.maxpat` only (sole loader, via
  `"sprintf read v001.co2.%s.jxs"`; documented in Task 5's `05-layer-gui-mixing-clips.md`, which also
  found only 17 of the 24 reachable from that file's `mixtype` umenu).
- `shaders/shared/{arb,cg,glsl}/*` ↔ referenced only via `source="..."` attributes inside `.jxs`
  files, resolved through Max's file search path (`vpt8.maxproj`'s empty `"searchpath"` object
  notwithstanding) — not a patcher-level dependency at all.
- `externals/jit.gl.syphonclient.mxo` ↔ `patchers/syphon_vpt7.maxpat`.
- `externals/jit.gl.syphonserver.mxo` ↔ `patchers/vpt-syphonout.maxpat`.
- `externals/imp.artnet.node.mxo` ↔ `patchers/artnet-vpt.maxpat`.
- `externals/Label.mxo` ↔ `patchers/activelayer.maxpat`, `patchers/clipcontrol.maxpat`,
  `patchers/enginetab.maxpat`.
- `externals/Ldiv.mxo` ↔ `patchers/vlayer.maxpat`.
- `externals/Lmult.mxo` ↔ `patchers/enginetab.maxpat`.
- `externals/o.route.mxo` ↔ no confirmed instantiating patcher (dependency_cache-only in 5 files;
  see Tech-debt finding 10).
- `data/gui.json` ↔ `pattrstorage gui` in `patchers/layersbank.maxpat` (`globalpatchername":"gui"`,
  per Task 5).
- `data/presets.json` ↔ `pattrstorage vpt` (the app-wide preset store; slot `sources` keys
  cross-reference `data/sources.json` slot IDs — see Tech-debt finding 5).
- `data/sources.json` ↔ `pattrstorage sources`, referenced by `videobankNN`/`solidN`/`camN`/
  `syphonN` keys matching the source-bank modules documented in Tasks 6-7.

## Notable patterns

- **A consistent three-function lifecycle contract, with one varying detail.** All three
  layer-triad scripts (`vlayer2.js`, `dummylayers02c.js`, `tabs.js`) implement
  `addLayer()`/`startupLayers(n)`/`deleteLayer()` with the same `this.patcher.newdefault(...)` +
  `outlet(0, "/numberofLayers", N)` shape; the only inconsistency is the init-message suffix
  (`layer_init` for two of them, `tab_init` for `tabs.js`).
- **A repeated "fix the alpha, bump the version number, leave the original" edit pattern.** Both
  `cc.alphaglue.jxs`→`cc.alphaglue01.jxs` and `tr.edgeblend.jxs`→`tr.edgeblend01.jxs` show the exact
  same one-line diff (`al *= at.a;` / `wiped.a *= a.a;`, both multiplying the newly-computed alpha by
  the input's pre-existing alpha) — but which file of each pair actually stays live is inconsistent:
  the *original* `cc.alphaglue.jxs` is the one loaded, while for edgeblend it's the *`01` revision*
  that's loaded. Both non-loaded siblings are dead weight in the repo.
- **The v001 Mixers shaders share one deliberate, well-factored fragment-shader idiom** (a named
  blend function called symmetrically twice, then `mix`ed by the crossfade `amount`) — the most
  internally consistent code in this entire cluster, undermined only by the copy-paste
  `<jittershader name="...">` bug (Tech-debt finding 1).
- **`dependency_cache` under-reports and over-reports simultaneously.** It over-reports by
  propagating transitively (a top-level patcher's cache lists every external/script/shader used by
  anything it embeds, even many subpatcher-levels down — e.g. `vpt7project.maxpat`'s cache lists
  `Label.mxo` even though no box in that specific file instantiates it). It also cannot be trusted as
  a "what does this project actually use" inventory on its own — `o.route.mxo` is cache-listed in 5
  files yet apparently instantiated in none of the 49 patchers.
- **The project manifest doesn't know about its own code/data/externals.** `vpt8.maxproj`'s
  `"contents"` object declares empty `"code"`/`"data"`/`"externals"` sub-objects despite 5, 3, and 7
  real files respectively existing in those directories and being actively loaded by the toplevel
  patchers it does list.

## Tech-debt findings

1. **[naming-inconsistency]** 11 of the 24 `.jxs` files under `shaders/v001 Mixers/` carry the
   literal, copy-pasted internal shader name `<jittershader name="AB Additive">` — inherited from
   `v001.co2.additive.jxs` (where it is correct) but never updated for the actual blend mode the
   file implements: `brightlight`, `burn`, `darken`, `difference`, `dodge`, `exclude`, `freeze`,
   `glow`, `heat`, `inverse`, `lighten` all show this same wrong name (verified:
   `grep -l '<jittershader name="AB Additive">' "shaders/v001 Mixers/"*.jxs` returns exactly these
   11 files plus `additive.jxs` itself — 12 files total, 11 of which are wrong; `average.jxs` is
   correctly labeled `"AB Average"` and is not part of this bug). This is purely a GUI-display-name/introspection cosmetic bug (the
   filename, not this internal name, drives which shader loads), but it means any tool or UI surface
   that reads the shader's declared name (e.g. Max's own object inspector) would mislabel 11 distinct
   blend modes as "AB Additive". Location: `vpt8 source code/shaders/v001 Mixers/v001.co2.brightlight.jxs`
   line 1 (and the 10 other files named above: `burn`, `darken`, `difference`, `dodge`, `exclude`,
   `freeze`, `glow`, `heat`, `inverse`, `lighten`, each line 1). Severity: low. Effort: low (one-line
   fix per file).
2. **[dead-code]** `code/pointgrid01b.js` defines `init2(gridsize)` (lines 36-45) as a near-duplicate
   of `init(gridsize)` (lines 24-34) missing only the trailing `gridlist()` call, and `vlayer2.js`
   defines `wait(w)` (lines 45-50, a busy-loop counting to `w*100` that blocks Max's UI thread rather
   than delaying anything) which is never called from anywhere in the file (a call to it is
   commented out at line 39: `//wait(50000);`). `code/pointmask01.js`'s `ellipse(w,h)` (lines
   207-213) is likewise defined but not called from any function in the file, nor found by name in
   any patcher via grep. Location: `vpt8 source code/code/pointgrid01b.js` lines 36-45;
   `vpt8 source code/code/vlayer2.js` lines 39, 45-50; `vpt8 source code/code/pointmask01.js` lines
   207-213. Severity: low. Effort: low.
3. **[dead-code]** At least 6 of the 14 top-level shader files are never referenced by filename
   (`@file`/`sendshader read`) from any of the 49 patchers under `patchers/` (grep-confirmed 0
   matches for each): `ab.spotmask_mod01.jxs`, `cc.alphaglue01.jxs`, `cc.scalebias.jxs`,
   `cc.uyvy2rgba.lite.jxs`, `tr.edgeblend.jxs`. Additionally, of the 15 shared vertex/fragment
   includes under `shaders/shared/{arb,cg,glsl}/`, **12** are never `source="..."`-referenced by any
   of the 62 `.jxs` files in the repo: `cf.box8.vp.glsl`, `cf.box9.vp.glsl`, `cf.cross5.vp.glsl`,
   `cf.diag5.vp.glsl`, `op.binary.vp.glsl`, `op.unary.vp.glsl`, `sh.basic.vp.glsl`,
   `sh.passthru.color.fp.glsl`, `sh.basic.vp.arb`, `sh.passthru.fp.arb`, `sh.passthru.fp.cg`,
   `sh.passthru.vp.cg` (verified by grepping every `.jxs` file for each include's filename in a
   `source="..."` attribute). Location: `vpt8 source code/shaders/` (the 5 files named) and
   `vpt8 source code/shaders/shared/{arb,cg,glsl}/` (the 12 files named). Severity: low. Effort: low
   (safe to delete after confirming no external tooling references them by path).
4. **[toolchain-version]** `cc.scalebias.jxs` is the sole top-level shader targeting
   `language name="arb"` (legacy `!!ARBfp1.0` fragment-program assembly, a pre-GLSL, pre-2010 Nvidia/
   ATI-era shading path) rather than `language name="glsl"` like every other shader in this
   directory — and it is itself unreferenced by any patcher (Tech-debt finding 3). The
   `shaders/shared/arb/` and `shaders/shared/cg/` directories (5 files total) exist purely to support
   this now-legacy ARB/Cg pipeline, of which only `sh.passthru.vp.arb` is referenced at all (by the
   otherwise-dead `cc.scalebias.jxs`) — i.e. VPT8 ships two entire legacy shading-language toolchains
   (ARB assembly and Cg) alongside GLSL with no confirmed live code path exercising either. One file,
   `shaders/shared/arb/sh.passthru.fp.arb`, is additionally a literal 0-byte empty file (verified via
   `wc -l`/`ls -la`) — broken even if it were referenced. Location:
   `vpt8 source code/shaders/cc.scalebias.jxs`; `vpt8 source code/shaders/shared/arb/`;
   `vpt8 source code/shaders/shared/cg/`. Severity: low. Effort: low (candidates for removal).
5. **[architectural-fragility]** `data/presets.json`'s 11 preset slots each reference exactly one
   `data/sources.json` slot via `"sources" : [ 100N ]` (N = the preset's own slot number, so preset 1
   references source-slot 1001, preset 2 → 1002, ... preset 11 → 1011) — but `data/sources.json`
   itself only actually contains 9 slots, keyed `"1"`, `"2"`, `"3"`, `"1006"`-`"1011"` (verified by
   listing every top-level slot key in the file). This means: (a) presets 1-3 reference source-slot
   IDs `1001`-`1003`, which don't exist as keys in `sources.json` at all (only unprefixed `"1"`-`"3"`
   exist — an off-by-1000 numbering mismatch between the two files); and (b) presets 4 and 5
   reference source-slot IDs `1004`/`1005`, which have **no** corresponding slot in `sources.json`
   under either numbering scheme — a genuinely missing cross-reference target. Because
   `pattrstorage` slot cross-references are plain integers with no schema/foreign-key enforcement
   between the two independently-maintained JSON dumps, this kind of silent drift is invisible until
   a preset recall actually fails to find its source snapshot. Location:
   `vpt8 source code/data/presets.json` (`"sources" : [ 1001 ]` through `[ 1011 ]`, one per slot,
   lines 9, 63, 117, 171, 225, 279, 333, 387, 441, 495, 549) vs.
   `vpt8 source code/data/sources.json` (top-level slot keys, lines 5, 109, 213, 317, 421, 525, 629,
   733, 837). Severity: medium. Effort: low (to fix the data; the underlying schema gap is
   architectural).
6. **[architectural-fragility]** `vpt8 source code/vpt8.maxproj`'s `"contents"` manifest declares
   empty `"code"` (line 30-32), `"data"` (line 34-36), and `"externals"` (line 38-40) sub-objects,
   despite 5 `code/*.js`, 3 `data/*.json`, and 7 `externals/*.mxo` files existing on disk and being
   actively loaded by the very patchers (`vpt7project.maxpat`, `hapsource.maxpat`) this same manifest
   does list as toplevel. The project's own metadata cannot be used as a source of truth for what
   code/data/external files the project depends on — that inventory can only be recovered by walking
   the patchers' own `dependency_cache` entries (which have their own gaps — Tech-debt finding 10) or
   by direct filesystem enumeration, as this doc does. Location: `vpt8 source code/vpt8.maxproj`
   lines 30-40. Severity: low. Effort: low (regenerating the manifest from within Max would likely
   fix this automatically).
7. **[licensing]** The entire VPT8 source tree is released under **Creative Commons
   Attribution-NonCommercial-ShareAlike 3.0 Unported** (CC BY-NC-SA 3.0), per
   `vpt8 source code/VPT8-sourcecode-readme.rtf` (verified: "VPT (Videoprojectiontools) is released
   under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported license... by HC
   Gilje"). This is a share-alike, **non-commercial-only** license, incompatible with typical
   permissive-OSS (MIT/BSD/Apache) reuse or any commercial redistribution/fork. Within `shaders/`,
   two additional third-party BSD-style license files are bundled: `shared/licenses/3Dlabs-license.txt`
   (covering the Randi Rost/3Dlabs 2002-2005 GLSL brightness/contrast/saturation shaders actually used
   in `cc.brightness.ip.jxs`/`cc.contrast.ip.jxs`/`cc.saturate.ip.jxs` — confirmed via in-file
   attribution comments), and `shared/licenses/LightworkDesign-license.txt` (LightWork Design Ltd.,
   2002-2005) — but **no** shader file anywhere in this repo mentions "Lightwork"/"LightWork"
   (grep-confirmed 0 matches outside the license file itself), so this second license attribution
   currently covers no shipped code — likely a leftover from a larger third-party shader template
   collection VPT8's shaders were originally drawn from. Location:
   `vpt8 source code/VPT8-sourcecode-readme.rtf`; `vpt8 source code/shaders/shared/licenses/
   3Dlabs-license.txt`; `vpt8 source code/shaders/shared/licenses/LightworkDesign-license.txt`.
   Severity: medium (licensing terms materially restrict reuse). Effort: n/a (informational).
8. **[naming-inconsistency]** A patcher's `dependency_cache` block is not a reliable indicator of
   that specific file's own object usage: it propagates transitively from every subpatcher/bpatcher
   the file embeds, arbitrarily many levels deep. E.g. `patchers/vpt7project.maxpat`'s
   `dependency_cache` lists `Label.mxo` even though grep confirms zero `"text":"label..."` object
   boxes exist directly in that file — the real usage lives 2 levels down, inside
   `patchers/activelayer.maxpat` (embedded by `patchers/controltabs.maxpat`, embedded by
   `vpt7project.maxpat`). Any future audit or tooling that treats `dependency_cache` entries as "this
   file uses X" rather than "this file's subtree uses X somewhere" will over-attribute usage.
   Location: `vpt8 source code/patchers/vpt7project.maxpat` (`dependency_cache` entry for
   `Label.mxo`) vs. `vpt8 source code/patchers/activelayer.maxpat` (actual `"text":"label ..."`
   boxes, 10 occurrences). Severity: low. Effort: n/a (informational/documentation gap, not fixable
   in the data itself).
9. **[naming-inconsistency]** `Label.mxo`, `Ldiv.mxo`, and `Lmult.mxo` are bundled with
   capitalized bundle/binary names (`Contents/MacOS/Label`, `.../Ldiv`, `.../Lmult`), but every
   patcher that instantiates them does so with an **all-lowercase** object name: `"text":"label
   /on /gridsize ..."` (`activelayer.maxpat`, 10×; `clipcontrol.maxpat`, 1×; `enginetab.maxpat`,
   1×), `"text":"ldiv 255."` (`vlayer.maxpat`), `"text":"lmult 1.5 1.5"` (`enginetab.maxpat`, 2×).
   This resolves correctly only on a case-insensitive filesystem (macOS's default HFS+/APFS mode);
   on a case-sensitive filesystem (APFS case-sensitive variant, or any Linux/Wine-based Max port)
   Max's external loader would fail to find `Label.mxo`/`Ldiv.mxo`/`Lmult.mxo` for these lowercase
   object names. Location: `vpt8 source code/patchers/activelayer.maxpat`,
   `clipcontrol.maxpat`, `enginetab.maxpat` (`label` boxes); `vpt8 source code/patchers/vlayer.maxpat`
   (`ldiv` box); `vpt8 source code/patchers/enginetab.maxpat` (`lmult` boxes); compare
   `vpt8 source code/externals/Label.mxo`, `Ldiv.mxo`, `Lmult.mxo`. Severity: low (works today on the
   only platform these externals ship for). Effort: low.
10. **[dead-code]** `externals/o.route.mxo` is declared in the `dependency_cache` of 5 patchers
    (`controltabs.maxpat`, `layersbank.maxpat`, `lforack-vpt7.maxpat`, `router-vpt7.maxpat`,
    `sourcebank.maxpat`) but grep across **all 49** `patchers/*.maxpat` files finds **no** actual
    instantiated object box referencing `o.route` anywhere (only `.mxo`-suffixed dependency-cache
    entries) — e.g. `patchers/router-vpt7.maxpat`, the file whose name most suggests it would use a
    custom router object, only shows plain built-in Max `route`/`p router` objects. This bundled
    Mac-only compiled external appears to be entirely unused dead weight in the shipped project (or
    its usage lives in a patcher/subpatcher outside the 49 scanned here, which is out of this
    cluster's scope to rule out further). Location: `vpt8 source code/externals/o.route.mxo`;
    absence confirmed via `grep` across `vpt8 source code/patchers/*.maxpat`. Severity: low.
    Effort: low (confirm-then-delete candidate).
11. **[closed-dependency]** All 7 externals under `externals/*.mxo`
    (`imp.artnet.node.mxo`, `jit.gl.syphonclient.mxo`, `jit.gl.syphonserver.mxo`, `Label.mxo`,
    `Ldiv.mxo`, `Lmult.mxo`, `o.route.mxo`) are precompiled Mac-only binaries with **no** source
    anywhere in this repository — they cannot be audited, rebuilt, ported to Windows (VPT8 itself
    ships for Windows too, per `CLAUDE.md`, but no `.mxe64` Windows binaries are bundled here for any
    of these 7), or verified for correctness by this documentation effort at all; their behavior is
    taken entirely on faith from their `Info.plist`/folder naming. Additionally, and more severely:
    **`OSC-route`** — a distinctly-named object (capitalized, hyphenated) instantiated in **17**
    patchers and central to the app's internal OSC-style message dispatch (e.g.
    `patchers/layersbank.maxpat`: `"OSC-route /numberofLayers"`;
    `patchers/enginetab.maxpat`: multi-argument routes with 10+ symbol arguments) — has **no**
    corresponding `.mxo` under `externals/` and **no** `.maxpat` abstraction anywhere in `patchers/`
    (confirmed: `find . -iname "*osc-route*"` matches nothing outside the citing patcher files
    themselves). This app-critical object is not bundled with the source at all; it must resolve to
    either a Max built-in or a separately-installed third-party package (plausibly CNMAT's OSC
    library) on whatever system built/ran this project, making this cluster's most heavily-used
    "external" entirely unverifiable and unreproducible from this repository. Location:
    `vpt8 source code/externals/` (the 7 `.mxo` bundles, names only); `vpt8 source code/patchers/
    layersbank.maxpat`, `enginetab.maxpat`, and 15 other patchers (`OSC-route` call sites). Severity:
    high (for `OSC-route`: the app cannot function without an object that isn't in this repo at all,
    and its provenance is undocumented anywhere in the codebase); medium (for the 7 bundled
    Mac-only externals). Effort: n/a (would require sourcing/rebuilding the actual external
    packages, outside this repo's scope).
