# Layer select, masking & warping

## Purpose

This cluster provides the single, shared "active layer" properties panel (`activelayer.maxpat`)
that displays and edits whichever layer currently has focus, plus the two interactive point-editor
tools it hosts on demand: a draggable-point mask-shape editor (`pointmask.maxpat`) and a
draggable-point NxN warp-mesh editor (`gridcontroller.maxpat`). A fourth file, `layermask.maxpat`,
is the numeric per-layer processing stage that actually applies masking (blur/invert/alpha-glue) to
a layer's video and is driven by the same OSC-style parameter names the editors write to. Together
these files implement "what you see when you select a layer and choose to edit its mask or its
projection/geometry warp" — the interactive front-end to features whose live-rendering pipeline
lives in `vlayer.maxpat` (documented in Task 3's `03-layer-engine-instance.md`).

## Files in this cluster

- `vpt8 source code/patchers/activelayer.maxpat` (9360 lines)
- `vpt8 source code/patchers/layermask.maxpat` (2354 lines)
- `vpt8 source code/patchers/gridcontroller.maxpat` (2717 lines)
- `vpt8 source code/patchers/pointmask.maxpat` (4656 lines)

## Key patchers & subpatchers

**`activelayer.maxpat`** (internal patcher title `"controls"`) is a large, mostly-flat GUI panel of
sliders/toggles/umenus for one layer's parameters (mask, mesh/warp, zoom/pan, 4-point corner-pin,
edge-blend, blur/mblur, brightness/contrast/saturation, tile, flip, blend mode, source, layer name).
It is not itself a per-layer bpatcher bank; instead every control here reads from a `r osc-active_*`
receive (e.g. `r osc-active_xy`, `r osc-active_scale`, `r osc-mask`, `r osc-mesh`, `r osc-zoom`,
`r osc-edgeblend`, `r osc-blur`, `r osc-mblur`, `r osc-brcosa`) and, on edit, re-emits the value
prefixed with the *currently focused* layer number (via `sprintf`/`prepend` into `/%ilayer/...`
strings) onto `s engine` — the same generic per-layer command channel documented in Task 1/Task 3.
Key subpatchers/instances:
- `pointmask` (obj-56, varname `pointmask03g5`) — a single instance of the `pointmask.maxpat`
  abstraction, opened/closed via a `pcontrol` object (obj-54) driven by `open`/`close` messages
  gated on `sel 0 1` (obj-59) fed from `r maskswitch`. Confirmed instantiated **exactly once**
  (`grep -c "\"text\" : \"pointmask\""` → `1`).
- `gridcontroller` (obj-39) — a single instance of the `gridcontroller.maxpat` abstraction, opened/
  closed via its own `pcontrol` (obj-28), gated on the `editor` toggle button (varname
  `mesheditor`). Also confirmed instantiated **exactly once**.
- `p cornerpin_templates` (~line 1470-1826) — a small subpatcher offering preset 4-corner-pin
  layouts (full/center/thirds/rotations) via a `umenu`; a simpler, separate warp mechanism from the
  NxN mesh (`gridcontroller`) — it drives `/upper_left /lower_left /upper_right /lower_right /com`.
- `osc_active <param>` (dependency `osc_active.maxpat`) is instantiated ~14 times (one per
  parameter group: `mesh`, `mask`, `zoom`, `edgeblend`, `blur`, `mblur`, `brcosa`, `tile`, `flip`,
  `source`, `layername`, `blendmode`, `fade`, `rgb`) — an abstraction (out of this cluster's scope;
  likely Task 9/11 territory) that re-tags a locally-edited parameter for the focused layer.
- Two `p workaround` / `patcher reset` boilerplate subpatchers identical to the ones in
  `layermask.maxpat`/`pointmask.maxpat`/`gridcontroller.maxpat` (see Notable patterns).

**`layermask.maxpat`** is the numeric mask-processing stage embedded per layer (same `%ilayer`-
addressed lifecycle as `vlayer.maxpat`, Task 3). Top-level:
- `OSC-route /on /source /inv /blur_on /blur /switch /moving /points` (obj-4, line 726) is the
  entire parameter surface; `pattr on`, `pattr source @default_priority -1`, `pattr inv`,
  `pattr blur_on`, `pattr blur`, `pattr moving`, and `pattr points @initial -0.9 -0.9 0 0.9 0.9 -0.9`
  (obj-31, line 256) back each parameter for `pattrstorage` snapshotting.
- `p gauss` (line 1491) — a hand-rolled 6-stage blur: `loadmess sendshader read cf.gaussian.2p.jxs`
  (line 975) feeds six chained `jit.gl.slab vpt @enable 0` objects (obj-8/9/14/15/16/18, lines
  864-1189). This duplicates the `jit.gl.slab.gauss6x` abstraction instead of reusing it (see
  Tech-debt finding 1).
- `p switch` (line 1765) — selects blurred vs. unblurred mask matrix depending on `blur_on`.
- `jit.gl.slab vpt @file cc.contrast.ip.jxs @param alpha 1.` (obj-27, line 1566) implements mask
  inversion (`inv`).
- `jit.gl.slab vpt @file cc.alphaglue.jxs @param lum2alpha 1` (obj-15, line 1780) is the actual
  masking operation: it converts the luminance of the (possibly blurred/inverted) mask
  image/shape into the layer's alpha channel.
- `jit.movie 4 3 @adapt 1 @interp 1 @unique 0` (obj-147, line 1855) lets a mask be an external movie
  file, not only a hand-drawn point shape — loaded via `route read`/`prepend read`
  (`sendshader`-style `read` messages driven by `r maskpath`/`r #1maskmovie`).

**`gridcontroller.maxpat`** is a standalone warp-mesh point editor window:
- `js pointgrid01b.js` (obj-1, line ~2019-2038) drives `jit.mgraphics 640 640 @relative_coords 1`
  (obj-31) → `jit.pwindow` (obj-4), the drawing surface.
- `p mouse_ctrl` (obj-54, lines 883-1828) is the mouse-event adapter implementing the
  mouse/button_down/button_up/mouse_loc contract (see Data flow).
- Two redundant `umenu` grid-size selectors — one showing `"2x2".."10x10"` (obj-34), one showing
  raw point counts `4,9,16,...100` (obj-131) — both ultimately call `setgridsize $1` into the js
  object (obj-1), which the code comment (obj-131's `hint`) warns "resets any transformation!".
- `p reset`-style `patcher reset` subpatchers (two, one per polarity) clear/repaint the mgraphics
  canvas.
- `p mouse_ctrl`'s output plus `route gridlist gridlength` (obj-40) feed `sprintf set /%ilayer/mesh`
  (obj-22) and `sprintf send %inrb` (obj-13) → `forward` (obj-10), which dynamically sends to a
  per-layer receiver name built at runtime (e.g. `3nrb`) — most likely consumed by `vlayer.maxpat`'s
  `p mesh` stage, which Task 3's doc records as receiving `r #1nrb`.

**`pointmask.maxpat`** is a standalone mask-shape point editor window:
- `js pointmask01.js` (obj-1, line ~3343-3358) drives `jit.mgraphics 1024 768 @relative_coords 1`
  (obj-31, line 2492) → `jit.pwindow` (obj-4).
- `p mouse_ctrl` (obj-54, lines 2570-3154) — the same mouse-adapter pattern as
  `gridcontroller.maxpat`'s.
- `p blur` (line 2190) applies `jit.gl.slab.gauss6x mask` (obj-27, **line 2068**) — confirming
  Task 3's finding that this file, not `vlayer.maxpat`, is the real consumer of the shared 6-pass
  blur abstraction; it softens the edges of the user-drawn mask silhouette before it is used.
- `jit.world mask @visible 0 @size 1024 768 @output_matrix 1` (obj-146) + `jit.gl.videoplane mask
  @transform_reset 2` (obj-42) render the vector mask shape offscreen; `jit.matrix 4 char 1024 768`
  (obj-25) captures it for PNG export (`exportimage` → `sprintf symout %s/%s.png`, obj-76).
- `pattrstorage` (varname `u728008198`, obj-63) + `pattr maskpoints @thru 0` (obj-60, restore list
  is a 21-point polygon, not the js's built-in 3-point-triangle default) persist the last-edited
  mask shape; `revert to last saved` / `save mask to disk` messages round-trip through it.
- A `tab` (obj-114) toggles "circle"/"points" editing mode; `live.slider`s bound to
  `mask.blur`/`circle.diameter[1]` are exposed up through the abstraction instance in
  `activelayer.maxpat`'s own `parameters` dictionary as `obj-56::obj-111` / `obj-56::obj-113`.

## Data flow

**Active-layer selection.** All four files read the shared `focus` send/receive pair (`r focus`,
e.g. `pointmask.maxpat` obj-55/obj-79/obj-140, `gridcontroller.maxpat` obj-70, `activelayer.maxpat`
obj-316/obj-70/obj-2) — an integer identifying which layer is currently selected in the layer-tab
UI (`layertab.maxpat`, outside this cluster). **The point editors are singletons, not one-per-
layer**: `activelayer.maxpat` instantiates exactly one `pointmask` and one `gridcontroller` (grep-
confirmed counts of 1 each), so only the currently-focused layer's mask or mesh can be visually
edited at any moment; switching focus repoints the same editor window at a different layer's saved
data via `r current_maskpoints` → `prepend savedmask` (`pointmask.maxpat` obj-143/obj-142/obj-57)
rather than opening a second window.

**Mouse/button contract** (identical in `pointmask.maxpat` and `gridcontroller.maxpat`'s
`p mouse_ctrl`): `route mouse mouseidle` → `unpack 0 0 0 0 0 0 0 0` → `sel 0 1` → literal message
boxes `button_down` / `button_up` sent to the `js` object's inlet 0; a parallel `pack 0. 0.` →
`prepend mouse_loc` path also targets inlet 0. The js scripts (`pointmask01.js`, `pointgrid01b.js`)
expect exactly these three message selectors plus a `bang` (driven by a `qmetro 33` in all three
non-`activelayer` files, e.g. `pointmask.maxpat` obj-105, `gridcontroller.maxpat` obj-105,
`layermask.maxpat`'s neighbours) to drive the `mouse.down`/`mouse.hit` drag state machine.

**Mask OSC-style parameter namespace** (literal, identical in `layermask.maxpat` obj-4/line 726 and
`activelayer.maxpat` obj-4/line 4595):
`OSC-route /on /source /inv /blur_on /blur /switch /moving /points`.

**Mesh/warp OSC-style parameter namespaces** in `activelayer.maxpat`:
`label /on /gridsize /position` (obj-22) / `OSC-route /on /gridsize /position` (obj-6) feed
`gridcontroller`; `OSC-route /on /xzoom /yzoom /xanchor /yanchor /rota` (obj-52, zoom);
`OSC-route /on /left /down /right /up /inv` (obj-53, edge-blend);
`OSC-route /on /blur` (obj-221) and `OSC-route /on /mblur` (obj-226);
`OSC-route /on /brightness /contrast /saturation` (obj-1);
`OSC-route /on /xtile /ytile` (obj-169); `OSC-route /on /fliptype` (obj-133);
`OSC-route /UL /LL /UR /LR` (obj-156, corner-pin) with reply messages
`prepend /UL`, `prepend /LL`, `prepend /UR`, `prepend /LR`, `prepend /activecorner` (obj-148/147/
139/128/127).

**Outbound per-layer addressed messages** (all built with `sprintf` and pushed to `s engine`):
`pointmask.maxpat` → `sprintf set /%ilayer/mask/points` (obj-137, line 265),
`sprintf /%ilayer/mask/on` (obj-92, line 1163), `sprintf /%ilayer/mask/source %s` (obj-87, line
1208), plus local `sprintf send %ifill`/`%ishape`/`%imaskpoints`/`symout %smask/`.
`gridcontroller.maxpat` → `sprintf set /%ilayer/mesh` (obj-22) and `sprintf send %inrb` → `forward`
(obj-13/obj-10).
`activelayer.maxpat` → `sprintf set /%ilayer` (in `p cornerpin_templates`), `prepend /active_xy` →
`s engine`, and the corner-pin `prepend /UL` etc. above.

**Other send/receive pairs crossing this cluster's boundary:** `s`/`r maskeditor`
(`pointmask.maxpat` → `layermask.maxpat`), `s`/`r maskswitch` and `s`/`r maskswitch_gui`
(`activelayer.maxpat` ↔ `pointmask.maxpat`), `s`/`r maskdest` and `s`/`r maskfoldertrig`
(`pointmask.maxpat` ↔ `activelayer.maxpat`), `s newmask` (`pointmask.maxpat`) / `r newmask`
(`activelayer.maxpat`), `s current_maskpoints` (`activelayer.maxpat`) / `r current_maskpoints`
(`pointmask.maxpat`), `r maskpoints`/`r maskpath`/`r initdone`/`r refresh_trig`/`r vpt_metro`
(`layermask.maxpat`), `s`/`r meshswitch` (`activelayer.maxpat` → `gridcontroller.maxpat`),
`s mgraphics`/`r mgraphics`, `s`/`r mb` (mouse-button bus shared by the reset subpatchers).

**Pattr/parameter bindings:** `layermask.maxpat`'s `pattr points/moving/blur/blur_on/inv/source/on`;
`pointmask.maxpat`'s `pattr maskpoints @thru 0`; `activelayer.maxpat`'s own `parameters` dictionary
exposes both its local sliders (`brightness[1..4]`, `contrast`, `saturation`, `scale`, `rot`,
`blur`, `mblur`, `le`/`ri`/`up`/`do` for edge-blend) **and** two parameters reaching down into the
embedded `pointmask` instance: `"obj-56::obj-111" : ["mask.blur","mask.blur",0]` and
`"obj-56::obj-113" : ["circle.diameter[1]","circle.diameter",0]`.

## Dependencies

- `code/pointmask01.js` — referenced by `pointmask.maxpat` (obj-1, `js pointmask01.js`) and
  transitively listed in `activelayer.maxpat`'s `dependency_cache` (it is not referenced directly
  by name in `activelayer.maxpat`, confirmed by `grep` returning no `js pointmask01`/`js pointgrid`
  boxes there — only the `dependency_cache` entries at lines 9321/9342).
- `code/pointgrid01b.js` — referenced by `gridcontroller.maxpat` (obj-1, `js pointgrid01b.js`);
  **not** listed in `gridcontroller.maxpat`'s own saved file at all — the file has **no**
  `dependency_cache` key whatsoever (verified: zero matches for `dependency_cache` in
  `gridcontroller.maxpat`), unlike its sibling `pointmask.maxpat`, which does declare
  `pointmask01.js` (see Tech-debt finding 4).
- `patchers/jit.gl.slab.gauss6x.maxpat` — used once, correctly, by `pointmask.maxpat`'s `p blur`
  (`jit.gl.slab.gauss6x mask`, line 2068); listed in both `pointmask.maxpat`'s and
  `activelayer.maxpat`'s `dependency_cache` as a transitive dependency.
- `shaders/cf.gaussian.2p.jxs` — loaded directly (bypassing the `gauss6x` abstraction) six times by
  `layermask.maxpat`'s `p gauss` via `loadmess sendshader read cf.gaussian.2p.jxs`.
- `shaders/cc.contrast.ip.jxs` — `layermask.maxpat`'s mask-invert stage (`@param alpha 1.`).
- `shaders/cc.alphaglue.jxs` — `layermask.maxpat`'s luminance-to-alpha masking stage
  (`@param lum2alpha 1`).
- `externals/OSC-route.mxo` — backs every `OSC-route` object; declared in `layermask.maxpat`'s and
  `activelayer.maxpat`'s `dependency_cache`. Not used by `gridcontroller.maxpat` or
  `pointmask.maxpat` (they use plain `route`, not `OSC-route`).
- `externals/Label.mxo` — backs the `label /...` objects in `activelayer.maxpat` (declared in its
  `dependency_cache`).
- `patchers/osc_active.maxpat` — instantiated ~14 times in `activelayer.maxpat`; documenting its
  internals is out of this cluster's scope (likely Task 9/11).

## Notable patterns

- **Singleton editor windows, not per-layer instances.** Unlike the per-layer `vlayer`/`layergui`/
  `layertab` triad (CLAUDE.md), the interactive mask/mesh editors exist exactly once inside
  `activelayer.maxpat` and are re-pointed at whichever layer has `focus`, opened/closed with
  `pcontrol` `open`/`close` messages rather than being created/destroyed per layer.
- **Shared mouse-adapter boilerplate.** `pointmask.maxpat` and `gridcontroller.maxpat` each embed an
  essentially identical `p mouse_ctrl` subpatcher (`route mouse mouseidle` → `unpack` 8 floats →
  `sel 0 1` → `button_down`/`button_up`; `pack`→`prepend mouse_loc`) rather than sharing one
  abstraction — a copy-paste pattern consistent with the `p workaround`/`patcher reset` duplication
  already noted in Task 3's doc for `vlayer.maxpat`.
- **`qmetro 33` polling.** All three editor-adjacent files redundantly gate their mgraphics
  redraw/mouse-poll logic behind their own local `qmetro 33`, rather than a single shared clock.
- **Two independent, differently-scaled canvases.** `gridcontroller.maxpat`'s mesh editor uses a
  square `640x640` `jit.mgraphics`/`jit.pwindow`; `pointmask.maxpat`'s mask editor uses `1024x768`
  (4:3) throughout its `jit.mgraphics`, `jit.world`, and export `jit.matrix` — two different fixed
  aspect ratios for what is conceptually the same kind of point-drag preview.
- **Norwegian-language leftover.** `pointmask.maxpat`'s default circle-mask filename `textedit`
  (obj-71) reads `"sirkel8"` ("sirkel" = Norwegian for "circle") — a harmless but telling trace of
  the original author's (HC Gilje, Norwegian) working language.

## Tech-debt findings

1. **[architectural-fragility]** `layermask.maxpat`'s `p gauss` subpatcher hand-duplicates the exact
   6-pass Gaussian blur (`loadmess sendshader read cf.gaussian.2p.jxs` feeding six chained
   `jit.gl.slab vpt @enable 0` stages) that already exists as the reusable `jit.gl.slab.gauss6x`
   abstraction — which `pointmask.maxpat` uses correctly (`jit.gl.slab.gauss6x mask`, line 2068).
   This is now a *third* independent hand-rolled copy of the same algorithm in the codebase (Task
   3's doc already found the same duplication inside `vlayer.maxpat`). Location:
   `vpt8 source code/patchers/layermask.maxpat` — the `p gauss` subpatcher, lines 864-1189 (loader
   at line 975). Severity: medium. Effort: low.
2. **[hardcoded-limit]** `activelayer.maxpat`'s mask-source chooser `umenu` (obj-106, varname
   `uimasksource`) has a hardcoded absolute Mac path baked into its `prefix` attribute:
   `"HD:/Users/hcg/lab/vpt7-2017-osx-beta03/defaultproject2017/mask/"` — the original developer's
   own machine path, using classic-Mac `HD:` volume-name syntax. It cannot resolve on any other
   machine, drive name, or OS (including the project's own Windows target). Location:
   `vpt8 source code/patchers/activelayer.maxpat` — obj-106, `prefix` attribute (~line 5959).
   Severity: medium. Effort: low.
3. **[naming-inconsistency]** `gridcontroller.maxpat`'s `s nrb` send object (obj-168) is fed only by
   an unrelated `ctlshow 0` message (a control-matrix-visibility toggle, obj-18) triggered on window
   close — nothing to do with NURBS meshes despite the name. The actual per-layer NURBS-mesh update
   path is a completely different mechanism: `sprintf send %inrb` (obj-13) → `forward` (obj-10),
   which builds a per-layer receiver name dynamically at runtime (e.g. `3nrb`). Two unrelated things
   share the `nrb` name fragment, and the plain `s nrb` appears to be vestigial. Location:
   `vpt8 source code/patchers/gridcontroller.maxpat` — obj-168 (`s nrb`, line 535) fed from obj-18
   (`ctlshow 0`, line 256) via the patchline at line 2233/2236. Severity: low. Effort: low.
4. **[architectural-fragility]** `gridcontroller.maxpat` has no `dependency_cache` key at all in its
   saved patcher (verified: zero matches for the string `dependency_cache` in the file), so its own
   `code/pointgrid01b.js` dependency is never declared — unlike the sibling `pointmask.maxpat`,
   which does declare its `pointmask01.js` dependency. Any tooling that relies on `dependency_cache`
   to collect/package a project's file dependencies would silently miss `pointgrid01b.js` when
   starting from `gridcontroller.maxpat`. Location: `vpt8 source code/patchers/gridcontroller.maxpat`
   (entire file — compare against `vpt8 source code/patchers/pointmask.maxpat` lines 4638-4652).
   Severity: low. Effort: low.
5. **[hardcoded-limit]** The two point-drag editors use different, fixed, non-parametrized canvas
   resolutions with no evident link to the project's actual output resolution: `gridcontroller.maxpat`
   uses a square `jit.mgraphics 640 640` / `jit.pwindow`, while `pointmask.maxpat` uses `jit.mgraphics
   1024 768`, `jit.world mask @size 1024 768`, and `jit.matrix 4 char 1024 768` for export — a fixed
   4:3 assumption. Neither adapts if the project's canvas is a different aspect ratio (e.g. 16:9).
   Location: `vpt8 source code/patchers/gridcontroller.maxpat` (obj-31, `jit.mgraphics 640 640
   @relative_coords 1`) vs. `vpt8 source code/patchers/pointmask.maxpat` (obj-31 `jit.mgraphics 1024
   768 @relative_coords 1`; obj-146 `jit.world mask @size 1024 768`; obj-25 `jit.matrix 4 char 1024
   768`). Severity: low. Effort: medium.
