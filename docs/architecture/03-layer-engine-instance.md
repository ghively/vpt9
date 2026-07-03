# Per-layer engine instance

## Purpose

`vlayer.maxpat` is the bpatcher template that `code/vlayer2.js` instantiates once per video
layer (as `bpatcher @name vlayer @varname <N>layer @args N`, per Task 2). It is the actual GL
processing chain for a single layer: it geometrically warps, masks, tiles, blurs, color-corrects,
edge-blends and corner-pins whatever texture the layer's selected video source has drawn into the
shared `jit.world vpt` context, then re-exposes the finished per-layer texture and control state
under names built from its own instance number. `jit.gl.slab.gauss6x.maxpat` is a related but
**separate** 6-pass Gaussian-blur bpatcher; despite living beside `vlayer.maxpat` and matching its
per-layer `#1`-argument convention, it is not used by `vlayer.maxpat` at all — it is instantiated
elsewhere, from the masking editor (see Dependencies).

## Files in this cluster

- `vpt8 source code/patchers/vlayer.maxpat` (10142 lines)
- `vpt8 source code/patchers/jit.gl.slab.gauss6x.maxpat` (588 lines)

## Key patchers & subpatchers

**`vlayer.maxpat` itself has zero patchcord inlets and zero outlets.** A whole-file search finds no
root-level `"maxclass":"inlet"`/`"outlet"` box at all — confirmed by the fact `code/vlayer2.js`'s
`this.patcher.newdefault(0,0,"bpatcher","@name","vlayer",...)` call (Task 2) never wires anything to
the resulting bpatcher box. Every input (OSC control) and output (the finished texture) crosses this
bpatcher's boundary through **globally-named `send`/`receive` objects**, disambiguated per instance
by the numeric argument passed via `@args N`, which Max substitutes for the literal token `#1`
everywhere inside the patcher (e.g. `r #1layertex`, `s #1multiplier_xy`, `@layer #1`).

The per-layer chain is a vertical stack of nine effect modules, each following the same skeleton
(see Notable patterns): a `pattr on @initial 0 @default_interp off`, an `OSC-route /on /<params>`,
and a `+ 1` → `gate 2 1` bypass switch wrapping a `jit.gl.slab`-based shader stage. In visual/GUI
stacking order (top to bottom at x≈702 in the file) and cross-checked against the root canvas's own
`"lines"` patchcord array (root `"lines"` begins at line 9536), the confirmed **texture signal
order** is:

**`p flip`** (line 9486/9487, varname `flip`) → **`p tile`** (5361/5362) → **`p zoom`**
(2448/2449) → **`p blur`** (4844/4845) → **`p mblur`** (3999/4000) → **`p brcosa`** (3599/3600) →
**`layermask`** (8913/8914, varname `mask`) → **`p edgeblend`** (3014/3015) → **`p mesh`**
(1816/1817). This was verified directly via root patchlines, e.g. `"destination":["obj-40","1"],
"source":["obj-23","0"]` (edgeblend → mesh, ~line 9666) and `"destination":["obj-17","1"],
"source":["obj-34","0"]` (zoom → blur, ~line 9573); the control-message side runs a parallel
**cascade of `OSC-route` objects** — `p tile`'s router feeds its unmatched-message outlet into
`p zoom`'s router, which feeds `p blur`'s, then `p mblur`'s, `p brcosa`'s, `p edgeblend`'s, and
finally `p mesh`'s (confirmed via patchlines linking `obj-13`→`obj-35`→`obj-18`→`obj-20`→`obj-32`→
`obj-33`→`obj-42`, the respective `OSC-route` boxes for `/tile`, `/zoom`, `/blur`, `/mblur`,
`/brcosa`, `/edgeblend`, `/mesh`), all ultimately fed from `r layers` / `r to_layer`.

- **`p mesh`** (1816) — geometric mesh-warp stage. Captures the shared context's current draw with
  `jit.gl.node vpt @capture 1` (~1408) and redraws it through a deformable surface with
  `jit.gl.nurbs vpt @enable 1 @color 1 1 1 1 @scale 1.1 0.83 1.` (~1423). Nested `p meshcalc` (1378)
  computes the warp-grid math. Controlled by `pattr gridsize`/`position`/`on` and
  `OSC-route /on /gridsize /position /trig` (~1516). Uses a custom `ldiv 255.` object (~1851,
  backed by the `Ldiv.mxo` external per `CLAUDE.md`) for coordinate scaling.
- **`p zoom`** (2448) — rotation/zoom/anchor transform via `jit.gl.slab vpt @file td.rota.jxs`
  (2173), driven by `pattr rota/xzoom/yzoom/xanchor/yanchor/on` and
  `OSC-route /on /xzoom /yzoom /xanchor /yanchor /rota` (2158).
- **`p edgeblend`** (3014) — per-edge feather/blend for multi-projector overlap via
  `jit.gl.slab vpt @file tr.edgeblend01.jxs` (2659), controlled by `pattr inv/down/right/up/left/on`
  and `OSC-route /on /left /down /right /up /inv` (2737); also has a local `r edgeblend` receive
  (2523) whose `invert $1` message merges into the same `pak fade 0. 0. 0. 0.` (2566) as the OSC path.
- **`p brcosa`** (3599) — brightness/contrast/saturation, three shader stages in series:
  `jit.gl.slab vpt @file cc.saturate.ip.jxs` (3155), `cc.contrast.ip.jxs` (3170),
  `cc.brightness.ip.jxs` (3275), each fed by an identically-worded `alpha $1` message box (3200,
  3230, 3260). Controlled by `pattr saturation/contrast/brightness/on` and
  `OSC-route /on /brightness /contrast /saturation` (3353).
- **`p mblur`** (3999) — despite its name and `pattr mblur`, this is **not a blur**: it is a
  directional slide/trail effect, `jit.gl.slab vpt @file tp.slide.jxs` (3793) driven by
  `slide_up $1`/`slide_down $1` messages (3691/3706) fed back through a bare, unnamed
  `jit.gl.slab` (3676, no `vpt` name arg, no `@file`).
- **`p blur`** (4844) — the real Gaussian blur, via a nested **`p gauss`** (4628) containing six
  bare `jit.gl.slab vpt` objects (4248-4250, 4263-4265, 4336-4338, 4351-4353, 4366-4368, 4396-4398)
  sharing one shader loaded via `loadmess sendshader read cf.gaussian.2p.jxs` (4188-4190), with
  `sendshader param width $1 0` / `width 0 $1` messages and `* 2.` width-doublers (4218, 4293) —
  the exact same 6-pass, alternating-axis, geometrically-doubling-width structure as
  `jit.gl.slab.gauss6x.maxpat` (see Purpose), just hand-duplicated inline rather than instantiated.
- **`p tile`** (5361) — tiling/repeat, reusing `jit.gl.slab vpt @file td.rota.jxs` (5123) — the same
  rotation shader used by `p zoom` — driven by `umenu` objects whose `items` hardcode a literal list
  of tile-count/offset fractions (~4911 xtile, ~4973 ytile). Controlled by `pattr xtile/ytile/on`
  and `OSC-route /on /xtile /ytile` (5108).
- **`layermask`** (8913, varname `mask`) — not a nested subpatcher but a bare object reference to
  the sibling abstraction `layermask.maxpat` (3 inlets, 1 outlet), routed to by `OSC-route /mask`
  (~8898). Masking logic itself lives outside this file (Task 4 territory).
- **`p cornerpin`** (8774) — the layer's own quad-warp/keystone stage (distinct from `enginetab`'s
  *master* corner-pin, Task 2). Wraps `jit.gl.cornerpin vpt @automatic 1 @layer #1 @blend_enable 1
  @color 1. 1. 1. 1. @enable_mouse 0 @drawcorners 0 @corner_radius 10 @corner_color .7 .7 .5 .7`
  (~8380) and four near-identical corner-math subpatchers — **`p LR`** (6081), **`p UR`** (6587),
  **`p LL`** (7093), **`p UL`** (7599) — plus **`p center_calculations`** (8000), which averages the
  four corner positions. The four corner subpatchers carry Norwegian-language inline comments
  (`"f2 koordinat\nf3 senterverdi\nf1 mouseposition"`, ~5681/5696 — "koordinat"=coordinate,
  "senterverdi"=center value, "skaleringsverdi"=scale value), reflecting the original author's
  working language. Controlled by `pattr upper_left/lower_left/upper_right/lower_right/blendmode/
  rgb/fade` and `OSC-route /upper_left /lower_left /upper_right /lower_right /com` (~8265).
- **`p flip`** (9486, varname `flip`, box id `obj-113`) — mirror on X/Y, implemented by feeding
  signed zoom values into the *same* `td.rota.jxs` rotation shader a third time (~9256-9268) via a
  `vpt_umenu` whose items encode `1,1 / -1,1 / 1,-1 / -1,-1` (~9194-9224). Controlled by
  `pattr fliptype/on` and `OSC-route /on /fliptype` (9164-9176).
- **`p joint`** (9057, box id `obj-16`) — sits between the mesh stage and the final output send;
  its entire nested patcher is a single inlet wired straight to a single outlet with no processing
  at all (lines ~9009-9044).
- **Master per-layer OSC dispatcher** — a 15-branch `OSC-route /cornerpin /fade /rgb /blendmode
  /color /red /green /blue /layername /layerorder /dcolor /scalex /scaley /posx /posy` (obj-3,
  9491-9503), fed by `r layers` (8929).

**`jit.gl.slab.gauss6x.maxpat`** (588 lines, separate file): a self-contained 6-pass blur bpatcher
with two inlets — texture in (`obj-12`) and a width control (`obj-3`) — and one outlet. It chains
six `jit.gl.slab #1` objects (`#1` = a name argument, e.g. instantiated as
`jit.gl.slab.gauss6x mask`), all sharing the shader `cf.gaussian.2p.jxs` loaded once via
`loadmess sendshader read cf.gaussian.2p.jxs` (line 159) and fanned out to all six slabs. Each pass
blurs a single axis only (`sendshader param width $1 0` = horizontal, `param width 0 $1` =
vertical), alternating horizontal/vertical across three width tiers — original width, then 2×, then
4× (via two chained `* 2.` multipliers, lines 168/237) — i.e. a geometrically-widening 3-tier,
6-pass separable blur pyramid.

## Data flow

Every string below is literal, taken directly from the file.

**Bpatcher argument namespacing (`#1` = the layer number from `@args N`):** `r #1multiplier_xy` /
`s #1multiplier_xy`, `r #1center_xy` / `s #1center_xy`, `r #1corner_xy`, `r #1nrb`,
`r #1layer_init`, `r #1layertex` / `s #1layertex`, `jit.matrix #1mesh`, `@layer #1` (on
`jit.gl.cornerpin`), and debug prints `print #1mesh`, `print #1pattrmesh`, `print #1zlslice`,
`print #1gridsize`, `print #1points`, `print #1dim`, `print #1order`, `print #1layerout`. A bare
message box literal `"#1"` (~8349) is fed into `sprintf set /%ilayer` to build a per-layer OSC
address string at runtime.

**Control ingress:** `r layers`, `r to_layer` (feeding `OSC-route /a`, a single-letter, undocumented
address), `r lbe` (also undocumented). The cascading per-module routers:
`OSC-route /tile`, `OSC-route /zoom`, `OSC-route /blur`, `OSC-route /mblur`, `OSC-route /brcosa`,
`OSC-route /edgeblend`, `OSC-route /mesh`, `OSC-route /mask`, `OSC-route /flip`, `OSC-route /source`,
and the master `OSC-route /cornerpin /fade /rgb /blendmode /color /red /green /blue /layername
/layerorder /dcolor /scalex /scaley /posx /posy`. Per-module parameter routers:
`OSC-route /on /gridsize /position /trig` (mesh), `OSC-route /on /xzoom /yzoom /xanchor /yanchor
/rota` (zoom), `OSC-route /on /left /down /right /up /inv` (edgeblend, plus a local `r edgeblend`),
`OSC-route /on /brightness /contrast /saturation` (brcosa), `OSC-route /on /mblur` (mblur),
`OSC-route /on /blur` (blur), `OSC-route /on /xtile /ytile` (tile), `OSC-route /on /fliptype` (flip),
`OSC-route /upper_left /lower_left /upper_right /lower_right /com` (cornerpin).

**Egress / cross-module:** `s osc_out`, `s layers_out`, `s loaded`, `s #1layertex` (final per-layer
texture, read back internally by `r #1layertex` inside `p cornerpin`). A bare, unnamed `receive`
(~8883) is dynamically re-bound at runtime via a `prepend set` message into its inlet — Max's
"rebind a receive's target with `set <name>`" idiom, not a broken/orphaned object.

**pattr bindings** (no `pattrstorage` object exists anywhere in this file — persistence is owned by
the parent's `pattrstorage vpt`, keyed by this bpatcher's `@varname`): `on` (repeated per module),
`gridsize`, `position`, `rota`, `xzoom`, `yzoom`, `xanchor`, `yanchor`, `inv`, `down`, `right`, `up`,
`left`, `saturation`, `contrast`, `brightness`, `mblur`, `blur`, `xtile`, `ytile`, `layerorder`,
`layername`, `source`, `upper_left`, `lower_left`, `upper_right`, `lower_right`, `blendmode`, `rgb`,
`fade`, `fliptype`.

## Dependencies

- `patchers/layermask.maxpat` — instantiated by bare-name reference (`text: "layermask"`, varname
  `mask`, line 8913) as an abstraction, not a bpatcher-with-args; confirmed present at
  `vpt8 source code/patchers/layermask.maxpat` and listed in this file's own `dependency_cache`
  (line ~10124), though with a **stale bootpath** pointing at a previous major version's project
  folder (`~/Documents/Max 7/Projects/vpt7-2017-140417/patchers`, not vpt8).
- **`jit.gl.slab.gauss6x.maxpat` is not a dependency of `vlayer.maxpat`.** A whole-file search for
  `gauss6x` inside `vlayer.maxpat` returns zero matches. The bpatcher is instead instantiated as
  `jit.gl.slab.gauss6x mask` inside `vpt8 source code/patchers/pointmask.maxpat:2068` (the masking
  point-editor, Task 4 territory) — its `dependency_cache` appearances in `vpt7project.maxpat`,
  `pointmask.maxpat`, `controltabs.maxpat` and `activelayer.maxpat` are transitive-dependency
  listings, not usages inside `vlayer.maxpat`.
- `shaders/*.jxs`: `td.rota.jxs` (reused three times — `p zoom`, `p tile`, `p flip`),
  `tr.edgeblend01.jxs` (`p edgeblend`), `cc.saturate.ip.jxs` / `cc.contrast.ip.jxs` /
  `cc.brightness.ip.jxs` (`p brcosa`), `tp.slide.jxs` (`p mblur`), `cf.gaussian.2p.jxs` (`p gauss`,
  loaded via `sendshader` message rather than `@file`).
- Jitter GL runtime objects: `jit.gl.node` (`@capture 1`), `jit.gl.nurbs`, `jit.gl.cornerpin`,
  `jit.gl.slab` (used ~14 times). All render into the shared `vpt` context established by
  `enginetab.maxpat`'s `jit.world vpt` (Task 2).
- `Ldiv.mxo` external (per `CLAUDE.md`'s custom-externals list) — backs the `ldiv 255.` object
  (~1851) inside `p mesh`.
- `OSC-route.mxo` external — backs every `OSC-route` object in the file (used pervasively).
- **No `code/*.js` scripts are used anywhere in `vlayer.maxpat`** — unlike `enginetab.maxpat`
  (`vlayer2.js`) or the masking/warping editors (`pointmask01.js`/`pointgrid01b.js`), this file is
  pure patcher-and-shader logic with no embedded `[js]`/`[jsui]` object.

## Notable patterns

- **Zero-I/O bpatcher, all-broadcast communication.** The bpatcher exposes no inlets/outlets;
  everything in and out travels via globally-named `send`/`receive` disambiguated by the `#1`
  substitution of the instantiation argument `N`. This matches `enginetab.maxpat`'s `addLayer()`,
  which never wires patchcords to the newly created bpatcher box.
- **Two parallel per-instance naming schemes for the same number.** `@varname "<N>layer"` (used
  externally by `pattrstorage vpt` for keys like `<N>layer::blur`) and the internal `#1` token (used
  for `s/r #1layertex` etc.) both encode the same layer number `N`, but are different mechanisms
  that only stay in sync because both derive from the same `@args N` at instantiation time.
- **Standard per-effect-module skeleton.** Every stage (`mesh`, `zoom`, `edgeblend`, `brcosa`,
  `mblur`, `blur`, `tile`, `flip`) repeats the same template: `pattr on @initial 0
  @default_interp off`, an `OSC-route /on /<params>` as the first object, and a local `+ 1` →
  `gate 2 1` bypass switch around the shader stage.
- **Cascading `OSC-route` chain instead of a single dispatcher.** Each module's router passes its
  unmatched-message outlet into the next module's router (tile → zoom → blur → mblur → brcosa →
  edgeblend → mesh); inserting a new effect module means splicing into this specific chain, with no
  central registry of the order.
- **Shader reuse across unrelated features.** `td.rota.jxs` ("rotation") is repurposed, via
  different `pak`/`prepend param` drivers, for rotation+zoom, tiling, and mirroring — a maintainer
  searching shader files by feature name will miss two of its three usages.
- **A companion bpatcher file that looks like a dependency but isn't.** `jit.gl.slab.gauss6x.maxpat`
  sits alongside `vlayer.maxpat` and shares its per-instance `#1`-naming convention, but is actually
  wired into a different, unrelated file (`pointmask.maxpat`) — the blur used inside `vlayer.maxpat`
  is a separate, hand-duplicated implementation of the same algorithm (see Tech-debt #1).

## Tech-debt findings

1. **[architectural-fragility]** `p gauss` (nested in `p blur`) hand-duplicates the exact 6-pass,
   alternating-axis, geometrically-doubling-width Gaussian blur that the sibling bpatcher
   `jit.gl.slab.gauss6x.maxpat` already implements as a reusable abstraction (and which is in fact
   used elsewhere, e.g. `jit.gl.slab.gauss6x mask` in `pointmask.maxpat:2068`) — instead of
   instantiating that bpatcher, six bare `jit.gl.slab vpt` objects and a `cf.gaussian.2p.jxs`
   `sendshader`/width-doubling chain are reimplemented inline. Location:
   `vpt8 source code/patchers/vlayer.maxpat` — `p gauss` (line 4628), six slabs at lines 4248-4250,
   4263-4265, 4336-4338, 4351-4353, 4366-4368, 4396-4398; cf.
   `vpt8 source code/patchers/jit.gl.slab.gauss6x.maxpat` (whole file). Severity: medium.
   Effort: medium.
2. **[architectural-fragility]** The nine per-layer effect modules are wired into a single
   undocumented chain via cascading `OSC-route` unmatched-outlets (tile→zoom→blur→mblur→brcosa→
   edgeblend→mesh) rather than a central dispatcher; the exact order is recoverable only by tracing
   individual patchcords. Location: `vlayer.maxpat` — patchlines linking `obj-13`→`obj-35`→`obj-18`→
   `obj-20`→`obj-32`→`obj-33`→`obj-42` in the root `"lines"` array (lines 9536-10122).
   Severity: medium. Effort: medium.
3. **[naming-inconsistency]** `p mblur` ("motion blur", `pattr mblur`, and even `enginetab.maxpat`'s
   own `mblur::on` parameter-list entry) implements a directional slide/trail effect
   (`tp.slide.jxs`, `slide_up`/`slide_down` messages) with no blur math at all; the real Gaussian
   blur is the separately-named `p blur`/`blur` parameter. Location: `vlayer.maxpat` —
   `pattr mblur @initial 0` (line 3741), `jit.gl.slab vpt @file tp.slide.jxs` (line 3793).
   Severity: low. Effort: low.
4. **[naming-inconsistency]** The rotation shader `td.rota.jxs` is reused for three unrelated
   features — rotation/zoom, tiling, and mirroring — via different parameter drivers rather than
   dedicated shaders, with no comment marking the reuse. Location: `vlayer.maxpat` — lines 2173
   (`p zoom`), 5123 (`p tile`), 9267 (`p flip`). Severity: low. Effort: low.
5. **[hardcoded-limit]** The `xtile`/`ytile` `umenu` objects hardcode a fixed literal list of
   tile-count/offset fraction pairs (halves through fifths); adding a new tile-count option requires
   manually editing this literal list. Location: `vlayer.maxpat` — `p tile`, `umenu` `items`
   attributes at lines ~4911 (xtile) and ~4973 (ytile). Severity: low. Effort: low.
6. **[hardcoded-limit]** The blend-mode `umenu` encodes OpenGL blend-factor pairs as an opaque,
   uncommented flattened numeric list (e.g. `6,7 / 6,1 / 2,7`) with no legend mapping the pairs to
   blend-mode names, and `pattr blendmode @initial 6 7` bakes one such pair in as the default.
   Location: `vlayer.maxpat` — `umenu` with hint `"blendmode"` (~line 3062);
   `pattr blendmode @initial 6 7 @default_interp off` (line 8810). Severity: medium. Effort: low.
7. **[dead-code]** An orphaned `jit.gl.slab vpt` with no `@file` shader has no patchcord connection
   anywhere in the root canvas's own patchline list (absent from every entry in lines 9536-10122).
   Location: `vlayer.maxpat`, root scope, line 9517 (`"text":"jit.gl.slab vpt"`, numinlets 2,
   numoutlets 2). Severity: low. Effort: low.
8. **[dead-code]** `p joint`, sitting inline between the mesh-warp stage and the final
   `s #1layertex` output send, is a pure identity passthrough — a single inlet wired straight to a
   single outlet with no processing. Location: `vlayer.maxpat` — `p joint` (line 9057; inlet→outlet
   wiring at lines ~9009-9044). Severity: low. Effort: low.
9. **[dead-code]** A live debug `print #1layerout` object is wired directly into the runtime signal
   path of the corner-warp helper subpatcher rather than removed before release. Location:
   `vlayer.maxpat` — line 5575. Severity: low. Effort: low.
10. **[naming-inconsistency]** `pattr layerorder` and `pattr layername` both omit the `@initial`
    attribute every sibling `pattr` in the file uses, instead carrying a baked-in editor-time
    `"restore"` value (`[3]` and `["layer_1"]`) left over from whatever layer instance the template
    was last saved as; separately, `pattr source`'s attribute values
    (`@default_interp 0 @initial off`) are ordered/valued opposite to every other pattr's
    `@initial <val> @default_interp off` convention. Location: `vlayer.maxpat` — lines 5406/5412
    (layerorder), 5472/5478 (layername), 5514-5515 (source). Severity: low. Effort: low.
11. **[dead-code]** The `layermask.maxpat` entry in this file's own `dependency_cache` carries a
    stale `bootpath` pointing at a previous major version's project folder
    (`~/Documents/Max 7/Projects/vpt7-2017-140417/patchers`), not the current vpt8 project — a
    copy-forward artifact from restructuring the project between versions. Location: `vlayer.maxpat`
    — `dependency_cache` entry for `"name":"layermask.maxpat"` (lines ~10124-10129).
    Severity: low. Effort: low.
