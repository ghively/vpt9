# Layer GUI bank, tab UI, source mixing & clip control

## Purpose

This cluster covers the third leg of the layer-lifecycle triad documented in `CLAUDE.md`: the
per-layer GUI control strip (`layergui.maxpat`), dynamically banked by `code/dummylayers02c.js`
inside `layersbank.maxpat`, mirroring `vlayer2.js`/`enginetab.maxpat` (Tasks 2-3) and `tabs.js`
building `layertab.maxpat` instances (Task 1). Alongside it, `controltabs.maxpat` is the passive
container that hosts every secondary control-tab page (including the "clip" tab) side by side as a
horizontal filmstrip of bpatchers. `mix-vpt7.maxpat` is a per-video-source-bank A/B cross-fader/
blend-mode mixer (a *different* dynamic-instantiation mechanism than the layer triad). Finally
`clipcontrol.maxpat` plus its four embedded `loopback_clip_vpt7.maxpat` instances implement the
"clip" tab: per-source (1-8) movie transport, scrubbing, looping and a lightweight playlist,
addressed via a raw OSC-over-UDP loopback rather than the app's usual internal send/receive idiom.

## Files in this cluster

- `vpt8 source code/patchers/layersbank.maxpat` (366 lines)
- `vpt8 source code/patchers/layergui.maxpat` (2157 lines)
- `vpt8 source code/patchers/layertab.maxpat` (499 lines)
- `vpt8 source code/patchers/controltabs.maxpat` (658 lines)
- `vpt8 source code/patchers/mix-vpt7.maxpat` (1560 lines)
- `vpt8 source code/patchers/clipcontrol.maxpat` (4762 lines)
- `vpt8 source code/patchers/loopback_clip_vpt7.maxpat` (470 lines)

## Key patchers & subpatchers

**`layersbank.maxpat`** (internal `"title":"layers"`, `"globalpatchername":"gui"`, hosted as
`vpt7project.maxpat` obj-9, varname `"layers"` per Task 1's doc) is almost entirely wiring around
`js dummylayers02c.js` (obj-4, line 246): `r dummylayer` (obj-3, line 161) feeds it the literal
messages `addLayer`/`deleteLayer`/`startupLayers $1` (the same unprefixed strings that
`vpt7project.maxpat`'s `p layers_add-delete` sends to `s dummylayer`, per Task 1). Its outlet 0
(`/numberofLayers N`) is split by `OSC-route /numberofLayers` (obj-13, line 54) into `pipe 100`
(obj-12, line 69) → `s focus` (obj-11, line 83) — i.e. after a layer is added, the new layer is
auto-focused 100 ms later. Three **hidden, unwired** manual-trigger message boxes — `addLayer`
(obj-100, line 225), `deleteLayer` (obj-96, line 209), `init` (obj-139, line 193) — feed the same
`js` object but have no incoming patchcords anywhere in the file; they read as leftover
click-to-test debug boxes alongside the real `r dummylayer` production path (see Tech-debt finding
5). `pattrmarker gui` (obj-75, line 177, hidden) plus the file's own `globalpatchername":"gui"`
scope this patcher's parameters into the app-wide `pattrstorage gui`/`data/gui.json` snapshot
documented in Task 1. A `closebang` (obj-32) → `t 0` (obj-34) → `s layergui` (obj-33, line 114)
chain fires on patcher close (purpose not resolvable from this file alone).

`code/dummylayers02c.js` (read for context, not itself in the assigned-files list) mirrors
`vlayer2.js`/`tabs.js` almost exactly: a `dlayers[]` array; `addLayer()`/`startupLayers(n)` call
`this.patcher.newdefault(0,0,"bpatcher","@name","layergui","@varname",N+"layergui","@args",N, ...)`
and emit `outlet(0,"/numberofLayers",N)` + `outlet(1,"send "+N+"layer_init")`; `deleteLayer()` calls
`this.patcher.remove(dlayers[i-1])`. The varname convention is `<N>layergui` (vs. `vlayer2.js`'s
`<N>layer` and `tabs.js`'s `<N>layertab`), and the init-seed message text is `send <N>layer_init` —
identical to `vlayer2.js`'s convention but *different* from `tabs.js`'s `send <N>tab_init`.

**`layergui.maxpat`** is the bpatcher content instantiated per layer (varname `<N>layergui`).
Notable structure:
- Focus highlight: `r focus` (obj-241, line 1290) → `sel #1` (obj-242) → toggles a background
  `panel` (obj-212/213, via `prepend bgcolor`) so the currently-focused layer's row is visibly
  highlighted.
- Copy/paste mini-buttons: `uisolo[1]` (obj-181, labelled "c", line 1217) and `uisolo[3]` (obj-185,
  labelled "p", line 1187) send `;copyfromlayer #1` (obj-23, line 1157) and `;pastetolayer #1`
  (obj-36, line 1141).
- Solo logic reachable from a small textbutton (obj-163) reproduces, verbatim, the message text
  `";\rengine /layers/cornerpin/com enable $1"` (obj-56, line 261) and
  `"sprintf /%ilayer/cornerpin/com enable 1"` (obj-55, line 245) that Task 1's doc records as living
  in `vpt7project.maxpat`'s root `p solo` subpatcher — i.e. the identical literal control string is
  hardcoded independently in two files (see Tech-debt finding 3). It also sends
  `s dummysolooff` (obj-59, line 201) and reads `r dummysolooff` (obj-43, line 398), matching
  `p solo`'s `;dummysolooff bang`.
- Blend-mode selector: **three** linked `umenu` objects — `obj-50` (line 175, icon-index items
  `[6,7,",",6,1,",",2,7]`, no text), `obj-116` (line 1048, plain-text items `["=",",","+",",","x"]`),
  and `obj-257` (line 515, same icon-index items as `obj-50`) — chained together (`obj-50`→`obj-12`→
  `obj-116`→`obj-257`/`obj-25`) so the icon-only front control and the plain-text proxy stay in
  sync. The result feeds two parallel per-layer blendmode broadcasts: the live user-edit path
  `"sprintf /%ilayer/blendmode %s"` (obj-40, line 497), and a separate `r dummy`-driven copy/paste
  replay path `"sprintf /%ilayer/blendmode %i"` (obj-27, line 689). Only 3 blend choices are exposed
  here (see Tech-debt finding 6), versus the ~24 dedicated blend shaders under
  `shaders/v001 Mixers/` (reachable only via `mix-vpt7.maxpat`, below).
- Per-instance OSC init: `r to_dummylayer` (obj-15, line 912) → `OSC-route /a /initdone` (obj-19,
  line 897) → `osc_pass #1 fade` (obj-8, line 971) on one outlet and `sprintf set 1 /%ilayer`
  (obj-7, line 927) on the other — the latter dynamically reconfigures a downstream `OSC-route`'s
  argument to this instance's own layer number via the classic `#1`-arg → `sprintf set ...` → route
  idiom (same pattern Task 4 found in `gridcontroller.maxpat`/`pointmask.maxpat`).
- `layergui.maxpat` has **no** `dependency_cache` key at all (verified: zero matches for
  `dependency_cache` in the file), unlike `layersbank.maxpat` and `controltabs.maxpat` (see
  Tech-debt finding 7).

**`layertab.maxpat`** is the tiny (78×57) per-layer tab-button bpatcher instantiated by `tabs.js`
(varname `<N>layertab`). `r #1tab_init` (obj-22) drives `text #1`/`texton #1` message boxes
(obj-67/68) that label the tab's `textbutton` (obj-66) with the layer number. Clicking the button
→ `sel 1` (obj-72) → `;alltabs 0` (obj-74, deselect every sibling tab) and, after `delay 1`
(obj-6), `;focus #1` (obj-75, set this layer as focused) — a 1 ms debounce between the two
messages. `r alltabs` (obj-71) lets any other tab's click deselect this one. A `ubutton` (obj-7)
plus `t 1`→(obj-8)→feeds the same textbutton with a literal `1`, a secondary (likely
click-simulation/testing) path into the same select logic.

**`controltabs.maxpat`** is a near-inert container: its own wiring is only 3 patchcords, all
window-management boilerplate (`r this_control` (obj-10, line 214) → `thispatcher` (obj-9, line
230); `"window flags nogrow, window exec"` (obj-23, line 88) and `"window flags grow, window exec"`
(obj-15, line 62) also → `thispatcher`). Everything else is 12 statically wired bpatchers, each 128×
128 in patching view but placed at successive, evenly spaced (326 px apart) `presentation_rect` x-
offsets — `activelayer.maxpat` (varname `activelayer`, x=1), `cuelist-vpt7.maxpat` (x=326),
`router-vpt7.maxpat` (x=651) plus three router satellites `miditab-vpt7.maxpat` (x=976),
`osceditor-vpt7.maxpat` (x=1951), `clipcontrol.maxpat` (**varname `router-vpt7[3]`**, x=2926 — this
is the "clip" tab page), `serial_VPT7.maxpat` (x=2276), `vpt7_keys.maxpat` (x=3250),
`vpt7_info.maxpat` (x=3575), `lforack-vpt7.maxpat` (x=1303), `vpt-timersketch3.maxpat` (x=2601),
`artnet-vpt.maxpat` (x=1628) — a horizontal filmstrip of every secondary control-tab page. Only one
326-wide slice is visible at a time because the hosting bpatcher instance in `vpt7project.maxpat`
(obj-10, varname `"controltabs"`) is sized to exactly one slice (`presentation_rect` 328×417, line
1344) with scrolling disabled. Tracing the *actual* tab-switching mechanism (not present inside
this file) into `vpt7project.maxpat`: `"* -326"` (obj-223, line 1221) multiplies the selected tab
index by −326, feeds `"pak offset 0 0"` (obj-227, line 1258) to build an `"offset $1 0"` message,
sent via `s this_control` (obj-224, line 1239) — which is exactly the `r this_control` this file
receives into its own `thispatcher` object. Sending `offset x y` to `thispatcher` pans that
patcher's internal view, so "switching tabs" here is implemented by scrolling the filmstrip, not by
`pcontrol` open/close (contrast Task 4's singleton mask/mesh editors). Cross-reference: the
`parameters` dictionary (lines 410-430) exposing `obj-1::obj-56::obj-111`/`obj-56::obj-113` (the
embedded `pointmask` instance's `mask.blur`/`circle.diameter[1]`) and the `dependency_cache` entries
for `pointmask.maxpat` (line 447), `pointmask01.js` (line 454), `gridcontroller.maxpat` (line 468),
`pointgrid01b.js` (line 475) are all transitive, via the embedded `activelayer.maxpat` — already
fully documented in Task 4's `04-layer-select-masking-warping.md`; not re-derived here. The
`dependency_cache` also declares `clipcontrol.maxpat` (line 545) and `loopback_clip_vpt7.maxpat`
(line 552) transitively, confirming the latter is reachable only through `clipcontrol.maxpat`, not
placed directly in `controltabs.maxpat`.

**`mix-vpt7.maxpat`** is an A/B video-source cross-fader/blend-mode mixer. It is **not** part of the
`vlayer`/`layergui`/`layertab` triad and uses a **third, distinct dynamic-instantiation mechanism**:
`patchers/sourcebank.maxpat` (Task 6/7 scope) contains 8 literal message boxes
`"script sendbox videobankNN replace mix-vpt7"` (`videobank01` through `videobank08`, grep-
confirmed 8 occurrences) — Max's `thispatcher script sendbox <boxname> replace <patchername>`
mechanism, which swaps a placeholder bpatcher box's content for a named patcher at runtime, one per
video-source-bank slot — rather than `this.patcher.newdefault(...)`. Internally: `pattr A`
(varname `A`, line 1017) / `pattr B` (varname `B`, line 996) hold the two source-selector `umenu`s
(`mixA`/`mixB`, items `1video`..`8video`,`1cam`,`2cam`,`1solid`,`2solid`,`1syphon`..`4syphon`);
`pattr mix @initial 0.5` (varname `mix`, line 976) is the 0-1 crossfade amount; `pattr mixtype
@default_interp off @default_priority 1` (varname `mixtype`, line 861) holds the selected blend
algorithm name, chosen from a `umenu` (obj-17, line 911) with items `mix, additive, multiply,
overlay, screen, stamp, subtractive, average, brightlight, softlight, hardlight, lighten, burn,
darken, freeze, heat, lumablend`. Selecting a mode fires `"sprintf read v001.co2.%s.jxs"` (obj-18,
line 939) which is read by `jit.gl.slab vpt @file v001.co2.additive.jxs` (obj-19, line 955) — i.e.
the blend algorithm is implemented by hot-loading one of the `shaders/v001 Mixers/*.jxs` files by
name. A `p workaround` subpatcher (line 793) special-cases the umenu's own first item text "mix":
it compares the incoming value against the literal symbol `"mix"` and, on match, forces the message
`"alphablend"` (obj-4, line 608 inside the subpatcher) instead of following the naming convention —
because there is no `v001.co2.mix.jxs` shader file, only `v001.co2.alphablend.jxs` (verified via
directory listing; see Tech-debt finding 1). Per-instance OSC binding: `r trigvideo` (obj-110, line
233) → loadbang-fed message `"#1"` (obj-114) → `"sprintf set 1 /%ivideo"` (obj-113, line 278) →
`set`-reconfigures `OSC-route /a` (obj-112, line 263) to this instance's own `/<N>video` address —
the same `#1`-arg-driven `OSC-route` re-targeting idiom as `layergui.maxpat`, but correctly scoped
to `/%ivideo` (video-source addressing), not `/%ilayer`. Matched output splits via
`"OSC-route /A /B /out /mix /mixtype"` (obj-22, line 841). A `jit.pwindow` monitor (obj-35) plus a
`ubutton` (obj-51)/`toggle`(obj-36)/`gate`(obj-21) lets the user preview the mixed output inline.

**`clipcontrol.maxpat`** is the "clip" control-tab page (hosted by `controltabs.maxpat` as
`router-vpt7[3]`). Per-video-source (1-8) transport controls are built from plain message boxes:
`start`/`stop`/`"rate $1"`/`"scrub $1"`/`"loop $1"`/`"in $1"`/`"out $1"`/`"pan $1"`/`"vol $1"`/
`"cliptime $1"`, an `rslider` "loop points" (obj-56, hint "loop points"), a rate `multislider`
(obj-63) plus `flonum` (obj-29), and a `loop_off/loop/pal/once` mode `umenu` (obj-121). Two parallel
`route 1 2 3 4 5 6 7 8` banks (obj-51 line 2046, obj-96 line 1787, obj-122 line 1569) fan values out
to **8 duplicated, identical** `led`/`vpt_indicator` pairs (obj-45/73/80/86/90/91/89/88 and
obj-95/97/98/99/100/101/104/105) and **8 duplicated, identical** `p` "highlight" subpatchers
(obj-127/128/129/130/131/132/133/134, each an unnamed clone of the same 6-box `fgcolor`/`sel 0 1`
logic, e.g. lines 96-273, 285-454, 458-636, ...) rather than one parametrized abstraction (see
Tech-debt finding 4). A lightweight playlist/slideshow feature sits alongside the main transport:
a `"--"/"Playlist"` `umenu` (obj-39), a `textedit` box (obj-44) → `"route text"` (obj-47) →
`"prepend playlist"` (obj-48), and a `"slide_length $1"` message (obj-57, hint "slide length in
seconds (still module only)") for a still-image slideshow mode. **All outbound per-source commands
funnel through** `"sprintf /sources/%ivideo/%s"` (obj-3, line 3445) **into**
`"udpsend localhost 6666"` (obj-13, line 3355) — a literal OSC-over-UDP loopback-to-self, not the
`s engine`/`send` idiom used by every other file in this cluster (see Tech-debt finding 2); the
matching listener, `"udpreceive 6666"`, lives in `patchers/osceditor-vpt7.maxpat` (Task 9 scope,
grep-confirmed, line 824). Four statically placed instances of the `loopback_clip_vpt7.maxpat`
bpatcher (obj-66/67/68/69, grep-confirmed count of 4) provide per-channel scrub/rate/pan sub-panels.
`clipcontrol.maxpat` has **no** `dependency_cache` key at all (verified: zero matches).

**`loopback_clip_vpt7.maxpat`** is a small, reusable "per-source value router": two `umenu`s — a
`1..8video` source picker (varname `umenu2`, items `--,1video,...,8video`) and a
`cliptime`/`loopreport` mode picker (varname `umenu1`) — feed a `switch 8` (obj-32) selecting one
of 8 `receive`-fed values (`route 1 2 3 4 5 6 7 8`, obj-27) and republishing the chosen source's
chosen value type onto `s to_router` (obj-3). It, too, has no `dependency_cache` key.

## Data flow

Every entry below is a literal string found in the files.

**Layer lifecycle (GUI leg):** `r dummylayer` receiving `addLayer`/`deleteLayer`/`startupLayers $1`
(`layersbank.maxpat`); js outlets `/numberofLayers N` and `send <N>layer_init`; `OSC-route
/numberofLayers` → `pipe 100` → `s focus` (auto-focus new layer); `s`/`r layergui`; `pattrmarker
gui` (scopes into the app-wide `pattrstorage gui`/`data/gui.json`, Task 1).

**Per-layer GUI (`layergui.maxpat`):** `r focus` / `sel #1`; `s`/`r dummysolooff`;
`;copyfromlayer #1` / `;pastetolayer #1`; `r dummy` (copy/paste broadcast source) / `s fromdummy`
(generic per-layer parameter mirror channel, matching Task 1/2's flat-namespace pattern);
`"sprintf /%ilayer/blendmode %s"` / `"sprintf /%ilayer/blendmode %i"`;
`"sprintf /%ilayer/cornerpin/com enable 1"` / `";\rengine /layers/cornerpin/com enable $1"` →
`s engine`; `"sprintf /%ilayer/layername %s"`; `"sprintf /%ilayer/source %s"`;
`"sprintf /%ilayer/fade %f"`; `r to_dummylayer` / `OSC-route /a /initdone` / `osc_pass #1 fade` /
`sprintf set 1 /%ilayer`; `s`/`r lcopy`, `s`/`r lpaste`.

**Tab selector (`layertab.maxpat`):** `r #1tab_init`; `;alltabs 0` / `r alltabs`; `;focus #1`.

**Control-tab paging (`controltabs.maxpat` ↔ `vpt7project.maxpat`):** `r this_control` →
`thispatcher` (receives an `"offset $1 0"` message); the driving computation
(`"* -326"` → `"pak offset 0 0"` → `s this_control`) lives in `vpt7project.maxpat`, outside this
cluster.

**Source mixer (`mix-vpt7.maxpat`):** `pattr A`/`pattr B`/`pattr mix`/`pattr mixtype`/`pattr on`;
`OSC-route /A /B /out /mix /mixtype`; `r trigvideo`; `r to_sources`; `sprintf set 1 /%ivideo` →
`OSC-route /a` (dynamic per-instance address); `sprintf read v001.co2.%s.jxs`; `s mixvalue`;
`r #1mix_com`; `s #1video`; `r monitor`; `r vpt_metro`.

**Clip control (`clipcontrol.maxpat`):** per-source message strings `start`, `stop`, `"rate $1"`,
`"scrub $1"`, `"loop $1"`, `"in $1"`, `"out $1"`, `"pan $1"`, `"vol $1"`, `"cliptime $1"`,
`"play $1"`; all funneled through `"sprintf /sources/%ivideo/%s"` → `udpsend localhost 6666` (raw
OSC/UDP loopback, consumed by `osceditor-vpt7.maxpat`'s `udpreceive 6666`, Task 9); `r loopreport`
/ `"loopreport $1"`; `r cliptime`; `r rate`; `r in`; `r out`; `com getlooppoints, com getrate`
message; `"prepend playlist"`; `"slide_length $1"`.

**Clip value router (`loopback_clip_vpt7.maxpat`):** `s to_router`.

## Dependencies

- `code/dummylayers02c.js` — the `[js dummylayers02c.js]` object inside `layersbank.maxpat`
  (obj-4, line 246); declared in `layersbank.maxpat`'s `dependency_cache` (line 353).
- `externals/o.route.mxo` — declared in both `layersbank.maxpat`'s (line 359) and
  `controltabs.maxpat`'s (line 647) `dependency_cache`; backs the plain `route` objects used
  throughout this cluster (a Mac-only compiled external per `CLAUDE.md`).
- `shaders/v001 Mixers/*.jxs` (24 files: `additive`, `alphablend`, `average`, `brightlight`,
  `burn`, `darken`, `difference`, `dodge`, `exclude`, `freeze`, `glow`, `hardlight`, `heat`,
  `inverse`, `lighten`, `lumablend`, `multiply`, `negate`, `overlay`, `reflect`, `screen`,
  `softlight`, `stamp`, `subtractive`) — hot-loaded by name from `mix-vpt7.maxpat`'s
  `jit.gl.slab vpt @file v001.co2.<name>.jxs`; only 17 of the 24 are reachable from the `mixtype`
  umenu's items list (`difference`, `dodge`, `exclude`, `glow`, `inverse`, `negate`, `reflect` are
  not umenu items and so are unreachable from this file — see Tech-debt finding 8).
- `externals/OSC-route.mxo` — used by `mix-vpt7.maxpat`'s `OSC-route /A /B /out /mix /mixtype` and
  `OSC-route /a`, and `layergui.maxpat`'s `OSC-route /a /initdone` / `OSC-route /fade /blendmode
  /layername /layerorder /source /rgb /solo`; neither file declares a `dependency_cache` entry for
  it because neither file has a `dependency_cache` at all.
- `patchers/loopback_clip_vpt7.maxpat` — instantiated 4 times as a static bpatcher inside
  `clipcontrol.maxpat` (obj-66/67/68/69).
- `patchers/mix-vpt7.maxpat` — instantiated (via `script sendbox ... replace`, not a bpatcher box)
  8 times inside `patchers/sourcebank.maxpat` (Task 6/7 scope), once per `videobank01`..`videobank08`
  slot.
- `patchers/clipcontrol.maxpat` — hosted as a static bpatcher (varname `router-vpt7[3]`) inside
  `controltabs.maxpat`.
- `patchers/activelayer.maxpat`, `patchers/pointmask.maxpat`, `patchers/gridcontroller.maxpat`,
  `code/pointmask01.js`, `code/pointgrid01b.js` — all transitively declared in `controltabs.maxpat`'s
  `dependency_cache` via the embedded `activelayer.maxpat`; fully documented in Task 4, not
  re-derived here.
- `osceditor-vpt7.maxpat`'s `udpreceive 6666` (Task 9 scope) is the runtime consumer of
  `clipcontrol.maxpat`'s `udpsend localhost 6666` traffic.

## Notable patterns

- **Three distinct dynamic-instantiation mechanisms coexist in this cluster alone.**
  `dummylayers02c.js`/`tabs.js` use `this.patcher.newdefault(...)` (matching `vlayer2.js`, Task 2);
  `mix-vpt7.maxpat` is bound into `sourcebank.maxpat` slots via Max's `script sendbox <name> replace
  <patcher>` message; `loopback_clip_vpt7.maxpat` is placed 4 times as plain static bpatchers with
  no driver script at all. Three different "make N copies of a thing" idioms for three superficially
  similar problems.
- **Tab switching by panning, not by opening/closing.** `controltabs.maxpat` lays its 12 child
  control-tab pages out side by side on a 326-px-pitch horizontal filmstrip and relies on
  `vpt7project.maxpat` sending an `offset` message to its own `thispatcher` (via `r this_control`)
  to scroll the correct page into view — a completely different mechanism from the singleton
  `pcontrol` open/close pattern Task 4 documented for the mask/mesh point editors.
- **Duplicated literal control strings.** The exact message text
  `";\rengine /layers/cornerpin/com enable $1"` is hardcoded independently in both
  `vpt7project.maxpat`'s root `p solo` (Task 1) and `layergui.maxpat`'s per-layer solo logic, with
  no shared abstraction between them.
- **Flat, reused send/receive namespace continues here.** `s fromdummy`, `s dummysolooff`,
  `s engine`, and the `#1`/`<N>`-argument substitution convention are all reused across this
  cluster exactly as documented for the engine core in Task 2.
- **`OSC-route` argument re-targeting via `#1` → `sprintf set` → route.** Both `layergui.maxpat`
  (`/%ilayer`) and `mix-vpt7.maxpat` (`/%ivideo`) use the identical idiom — a bpatcher's own `#1`
  argument feeds a `sprintf set ...` message that reconfigures a downstream `OSC-route`/`route`
  object's argument list at instantiation time — the same pattern Task 4 found in
  `gridcontroller.maxpat`/`pointmask.maxpat`.
- **8-way copy-paste instead of parametrized abstraction.** `clipcontrol.maxpat` repeats an
  identical 6-box `p` subpatcher 8 times (once per video source) for LED highlight logic, rather
  than a single abstraction taking a source index argument.

## Tech-debt findings

1. **[naming-inconsistency]** `mix-vpt7.maxpat`'s `mixtype` umenu's first item is the literal text
   "mix", but there is no `v001.co2.mix.jxs` shader file — only `v001.co2.alphablend.jxs` exists. A
   `p workaround` subpatcher papers over this by comparing the incoming value against the literal
   symbol `"mix"` and hardcoding the message `"alphablend"` instead of following the file's own
   `sprintf read v001.co2.%s.jxs` naming convention. Location: `vpt8 source code/patchers/mix-vpt7.maxpat`
   — `p workaround` (line 793, `"sel 0"`/`"alphablend"` at lines within the subpatcher ~608-624),
   fed from `pattr mixtype` (line 861) and `umenu` items list (line 911). Severity: low. Effort: low.
2. **[architectural-fragility]** `clipcontrol.maxpat` sends every per-source clip-transport command
   (`start`/`stop`/`rate`/`scrub`/`loop`/`in`/`out`/`pan`/`vol`/`cliptime`) as an OSC packet over a
   real UDP socket looped back to `localhost:6666`, instead of the internal Max `send`/`receive`
   idiom used by every other file in this cluster (`s engine`, `s to_layer`, etc.). This makes a
   purely intra-process dataflow depend on the OS network stack (port availability, firewall/
   loopback-interface state), for no apparent benefit over a plain `send`. Location:
   `vpt8 source code/patchers/clipcontrol.maxpat` — `"udpsend localhost 6666"` (line 3355) fed by
   `"sprintf /sources/%ivideo/%s"` (line 3445); consumed by `vpt8 source code/patchers/osceditor-vpt7.maxpat`
   — `"udpreceive 6666"` (line 824). Severity: medium. Effort: medium.
3. **[architectural-fragility]** The exact literal control message `";\rengine /layers/cornerpin/com
   enable $1"` is hardcoded independently in two files with no shared abstraction: it drives the
   per-layer "solo" behavior in both the root patcher's `p solo` subpatcher (Task 1's
   `01-app-shell.md`) and here in `layergui.maxpat`'s per-layer solo logic. A future edit to the
   message format in one location will silently desync from the other. Location:
   `vpt8 source code/patchers/layergui.maxpat` — obj-56 (line 261) and obj-55
   `"sprintf /%ilayer/cornerpin/com enable 1"` (line 245); compare
   `vpt8 source code/patchers/vpt7project.maxpat`'s `p solo` (documented in Task 1). Severity: low.
   Effort: low.
4. **[architectural-fragility]** `clipcontrol.maxpat` repeats an identical 6-box `p` subpatcher
   (a `sel 0 1` / `fgcolor` highlight helper) 8 times — once per video source — instead of a single
   parametrized abstraction, alongside 3 separate `route 1 2 3 4 5 6 7 8` fan-out objects doing the
   same per-source dispatch. Location: `vpt8 source code/patchers/clipcontrol.maxpat` — the 8 `p`
   boxes at lines 96-273, 285-454, 458-636, 638-816, 819-997, 1000-1178, 1181-1359, 1362-1540;
   `route 1 2 3 4 5 6 7 8` at lines 1569, 1787, 2046. Severity: low. Effort: medium.
5. **[dead-code]** `layersbank.maxpat` contains three hidden message boxes — `addLayer` (line 225),
   `deleteLayer` (line 209), `init` (line 193) — that feed `js dummylayers02c.js` but have **no**
   incoming patchcords anywhere in the file (verified by inspecting the full `lines` array); they
   duplicate the real production trigger path (`r dummylayer`, line 161) and read as leftover
   click-to-test debug residue. Location: `vpt8 source code/patchers/layersbank.maxpat` — lines 181-249.
   Severity: low. Effort: low.
6. **[hardcoded-limit]** `layergui.maxpat`'s per-layer blend-mode selector exposes only 3 choices
   via an icon-only umenu (items `[6,7,",",6,1,",",2,7]`, Max built-in icon indices, no text; a
   linked plain-text proxy shows `"=","+","x"`), while ~24 dedicated blend-mode shaders exist under
   `shaders/v001 Mixers/` and are exposed with a full 17-item text menu one file over, in
   `mix-vpt7.maxpat`'s `mixtype` selector. A layer's own blend mode and the source-mixer's blend
   mode are two different, inconsistently-sized option sets addressing conceptually the same
   compositing operation. Location: `vpt8 source code/patchers/layergui.maxpat` — obj-50 (line 175),
   obj-116 (line 1048), obj-257 (line 515); compare
   `vpt8 source code/patchers/mix-vpt7.maxpat` — obj-17 (line 911). Severity: low. Effort: medium.
7. **[naming-inconsistency]** 5 of the 7 files in this cluster have **no** `dependency_cache` key at
   all (verified: zero matches for the string `dependency_cache`) — `layergui.maxpat`,
   `layertab.maxpat`, `mix-vpt7.maxpat`, `clipcontrol.maxpat`, `loopback_clip_vpt7.maxpat` — while
   `layersbank.maxpat` and `controltabs.maxpat` do declare one. Any tooling that walks
   `dependency_cache` to collect a project's file dependencies would silently miss
   `code/dummylayers02c.js`'s sibling scripts and every shader these files load by name (e.g.
   `shaders/v001 Mixers/*.jxs` from `mix-vpt7.maxpat`). This mirrors the same gap Task 4 found in
   `gridcontroller.maxpat`. Location: the 5 files named above (whole files — no `dependency_cache`
   key present in any of them). Severity: low. Effort: low.
8. **[dead-code]** 7 of the 24 shader files under `shaders/v001 Mixers/` — `difference`, `dodge`,
   `exclude`, `glow`, `inverse`, `negate`, `reflect` — are never listed as items in
   `mix-vpt7.maxpat`'s `mixtype` umenu (which only offers 17 named modes), so they cannot be
   selected from this file's UI at all; whether they are reachable from elsewhere in the app is
   outside this cluster's scope. Location: `vpt8 source code/patchers/mix-vpt7.maxpat` — `umenu`
   items list (line 911); compare the shader directory listing under
   `vpt8 source code/shaders/v001 Mixers/`. Severity: low. Effort: low.
