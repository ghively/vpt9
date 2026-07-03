# App shell & root

## Purpose

This cluster is the toplevel application shell of VPT8: the root patcher that Max opens when
`vpt8.maxproj` is loaded, plus its four direct support patchers. Between them they own booting the
app (standalone window setup, OSC networking, layer-count bootstrap), reading/writing user and
project preferences to disk, presenting static help/about screens, and hosting a floating "live
module" utility window for grabbing and recording a live camera source. Everything else in VPT8
(layer engine, presets, control surfaces, etc.) is wired into the root patcher described here,
either as a statically-placed bpatcher or as a dynamically-created instance.

## Files in this cluster

- `vpt8 source code/patchers/vpt7project.maxpat` (7194 lines)
- `vpt8 source code/patchers/prefs.maxpat` (3675 lines)
- `vpt8 source code/patchers/vpt7_info.maxpat` (442 lines)
- `vpt8 source code/patchers/vpt7_keys.maxpat` (219 lines)
- `vpt8 source code/patchers/livemodule-vpt7.maxpat` (4244 lines)
- `vpt8 source code/patchers/livemodule_d.maxpat` (150 lines)

## Key patchers & subpatchers

**`vpt7project.maxpat`** — the toplevel patcher (`vpt8.maxproj` marks it `"toplevel" : 1`), titled
`"VideoProjectionTool"`. Notable toplevel objects:
- `standalone` (obj-33, line ~2070) carries the Max standalone-build attributes
  (`"preffilename" : "VPT7"`, `"bundleidentifier" : "hcgilje.com"`) — this is literally the
  app-packaging descriptor used when building the shipped VPT7/VPT8 executable.
- `udpreceive 6661` (obj-5) feeds three `OSC-route` dispatchers that split incoming OSC into every
  remote-controllable message the app understands (see Data flow). `udpsend 127.0.0.1 6660`
  (obj-39) sends outbound OSC state, fed from `r engine`.
- `js tabs.js` (obj-22, line 3949, `"filename" : "tabs.js"`) — the `[js]` object that (per prior
  exploration and `CLAUDE.md`) calls `this.patcher.newdefault(...)` to dynamically instantiate
  `layertab` bpatchers as layers are added/removed. It sits downstream of `s nlayers`/`fromsymbol`/
  `forward` wiring in the same box cluster.
- `layertab -1` (obj-14) and `layergui -1` (obj-56) — the toplevel patcher also directly
  instantiates one base/template `layertab` and `layergui` instance (argument `-1`) in addition to
  whatever `tabs.js` creates dynamically.
- Bpatchers wired statically (not dynamically created): `preset_cellblock.maxpat` (obj-38),
  `sourcebank.maxpat` (obj-7, `varname "sources"`), `layersbank.maxpat` (obj-9,
  `varname "layers"`), `controltabs.maxpat` (obj-10, `varname "controltabs"`),
  `presetmodule-vpt7.maxpat` (obj-101, `varname "presetmodule-vpt7"`).
- Small named subpatchers (`p ...`) — most of the root patcher's logic is *not* delegated to
  subpatchers (see Notable patterns), but four exist:
  - `p keyboard_selectlayers` (line 2683) — a `[key]` object filters raw keycodes 49–57 (`'1'`–`'9'`)
    to select a layer by number, sending the result to `s focus`.
  - `p solo` (line 4341) — on receiving a layer number via `r focus`/gated by a `sel 1` toggle,
    builds `sprintf /%ilayer/solo 1` and the message `;engine /layers/cornerpin/com enable $1`,
    and also fires `;dummysolooff bang` to clear other layers' solo state.
  - `p layers_add-delete` (line 4706) — the `+`/`-` layer buttons send message boxes `addLayer` /
    `deleteLayer`; a `r startuplayers` branch sends `startupLayers $1`. All three route through
    `prepend /vlayer` into `s engine`, and also `s dummylayer`.
  - `p layerorder` (line 4983) — reads `r nlayers` to bound a layer-position control, unpacks a
    pair of indices (`unpack 1 0`), packs them as `pack movelayer 1 1`, and sends
    `prepend /movelayer` into `s engine`.
- The tab strip `obj-229` (`varname "tab"`, line 1015) lists 12 tabs:
  `"active", "cuelist", "router", "midi", "lfo", "artnet", "osc", "serial", "clock", "clip", "keys", "info"`.
  The last two surface `vpt7_keys.maxpat` and `vpt7_info.maxpat`'s content; the actual show/open
  logic for those two tabs lives inside `controltabs.maxpat` (outside this cluster) — neither file
  is wired as a bpatcher or `p`-subpatcher directly inside `vpt7project.maxpat` itself, they only
  appear in its Max-generated `dependency_cache` (confirming they are opened transitively, not
  inlined).
- `pattrstorage gui @autorestore 0 @greedy 2` (obj-352, `varname "gui"`, line 740) persists GUI/tab
  state; it is written/read via `sprintf symout %sgui.json` + `route read` / `prepend write`
  (i.e. `data/gui.json`, matching `CLAUDE.md`'s description of `pattrstorage` snapshot files).

**`prefs.maxpat`** is not just "user preferences" — it bundles two responsibilities:
1. Application display preferences persisted to `prefs.txt`: everything funnels through one
   20-outlet `route` object (obj-6) whose argument list *is* the prefs schema:
   `route fsaa framerate previewframerate screenratio number_of_screens preview_width menubar
   cursor_off preview fullscreen autostart cuelist drawcorners master include_sources sourcebank
   autosource xfadelocal screendivider`. Read/write is `sprintf symout %sprefs.txt` +
   `prepend read` / `prepend write`.
2. Project-relative path bookkeeping: `projectpath.txt` (`sprintf symout %sprojectpath.txt`),
   `layers.txt` (`sprintf symout %slayers.txt`), and computed subfolder paths for `presets/`
   (`sprintf symout %spresets/`) and `video/` (`sprintf symout %svideo/`).
- Subpatcher `p windowsizes` (line ~2340) computes screen aspect ratio (`expr ($f2/$f1)`) and
  fullscreen/single-screen ratios from horizontal/vertical pixel counts, feeding `s screenratio`,
  `s singlescreenratio`, `s screencount`.

**`vpt7_info.maxpat`** is a static About/credits window: three embedded `fpic` logos
(`vpt07_128.png`/`vpt07_32.png`/`creativecommons_license.png`, stored as inline base64 `"data"`
blobs, not file references) plus `textbutton`s "hcgilje.com" and "VPT Forum" that trigger
`;max launchbrowser <url>` message boxes for `http://hcgilje.com`, the VPT Google Group
(`https://groups.google.com/forum/?hl=en&fromgroups#!forum/vpt-forum`),
`http://hcgilje.wordpress.com/vpt/`, and the CC license page
(`http://creativecommons.org/licenses/by-nc-sa/3.0/`). It has no `send`/`receive`/`pattr` wiring.

**`vpt7_keys.maxpat`** is a pure reference card: every one of its 9 boxes is a `maxclass":"comment"`
describing a keyboard/mouse shortcut (tab to cycle layers, number keys 1–9 select a layer,
shift+click-drag moves the active layer, alt+click-drag scales it, ctrl+z undoes the last
mouse-click, arrow keys fine-adjust the active cornerpin corner, delete removes the selected mask
point, return advances the cuelist). The file's own `"lines" : [ ]` (line 214) confirms there is no
functional wiring at all — it is opened purely to be read.

**`livemodule-vpt7.maxpat`** implements a "live module": a floating utility window for grabbing a
live camera source and optionally recording it. Notable substructure:
- Subpatcher `p recfolderdestination` — reads `r videopath` / `r from-ps_sources`, queries the
  video-source-bank's stored path via `sprintf getstoredvalue videobank0%i::videopath 0` +
  `store 0`, and republishes it on `s ps_sources` — syncing the live-record destination folder with
  video-source-bank slot 0's `pattrstorage`-backed path.
- Subpatcher `p livesettings` — the camera device/settings panel: `getvdevlist`/`getinputlist`
  message boxes populate `umenu`s for device and input selection, a dim `unpack 0 0`/`pak dim`
  chain sets capture width/height, and a `textbutton` toggles colorspace (`argb`/`uyvy`,
  `varname "uicolormode"`). It sends `s #1colormode` (line 1834) and `s #1_com` (lines 2265, 2310),
  and reads `r lb` and `r #1cam`.
- A child abstraction-call object `livemodule_d` (matching the sibling file `livemodule_d.maxpat`)
  supplies the raw camera frames; its output feeds `jit.gl.texture vpt @flip 1` and is republished
  on `s #1cam` (line 3458).
- `jit.qt.record @realtime 1` (obj-43) records the live feed; the destination path/filename is
  assembled via `prepend write` / `append 25. jpeg high` and `sprintf %s/xlive%i.mov`, triggered
  through `sprintf send %ifoldertrig` → `s foldertrig`.
- `OSC-route /a` (obj-112) and `OSC-route /on /rec /recdest` (obj-74) give this module its own
  remote-control surface (camera select, on/off, start/stop record, record destination).
- `pattr on` (`varname "on"`, line 1609) tracks the module's enabled state.
- Like `vpt7project.maxpat`, this file opens itself as its own floating OS window via a
  `thispatcher` object plus `window title`/`window flags`/`window exec`/`savewindow` messages, and
  further nests a second sub-window (`p livesettings`) opened/closed via a `pcontrol` object driven
  by `open`/`close` message boxes — a two-level floating-window nesting pattern.

**`livemodule_d.maxpat`** is a trivial 5-object wrapper: two inlets feed
`jit.grab @adapt 1 @unique 1 @engine viddll`, whose two outlets (`jit_matrix` texture, dimensions)
go straight to two outlets. It exists purely so `livemodule-vpt7.maxpat` has a single reusable
"grab a webcam frame" building block.

## Data flow

- **OSC network I/O (root):** `udpreceive 6661` and `udpsend 127.0.0.1 6660` in
  `vpt7project.maxpat`. Inbound OSC is split by three `OSC-route` objects:
  - `OSC-route /numberofLayers /startupLayers /fps /path /loadbang /fromPS /fullscreen /drawcorners /onoff /activecorner /active_xy /loopreport /PSrecall /center_xy /multiplier_xy`
  - `OSC-route /fade /rgb /flip /layername /layerorder /source /tile /brcosa /blur /mblur /blendmode /mask /edgeblend /zoom /solo /mesh`
  - `OSC-route /a /0layer`
- **OSC mirror channels** (keep local GUI and remote OSC clients in sync), all in
  `vpt7project.maxpat`: `s`/`r` pairs `osc-onoff`, `osc-drawcorners`, `osc-fullscreen`, `osc-solo`,
  `osc-layerorder`; send-only `osc-multiplier_xy`, `osc-center_xy`, `osc-active_xy`,
  `osc-activecorner`, `osc-zoom`, `osc-edgeblend`, `osc-mask`, `osc-blendmode`, `osc-mblur`,
  `osc-blur`, `osc-brcosa`, `osc-tile`, `osc-source`, `osc-layername`, `osc-flip`, `osc-rgb`,
  `osc-fade`, `osc-mesh`.
- **Layer lifecycle** (`vpt7project.maxpat`): `s`/`r engine` (the generic command channel into the
  layer engine — carries strings like `/vlayer addLayer`, `/vlayer deleteLayer`,
  `/movelayer 1 1`, `/layers/cornerpin/com enable $1`), `s`/`r nlayers`, `s`/`r startuplayers`
  (carries `startupLayers $1`), `s dummylayer`, `s to_dummylayer`, `r fromdummy`, `s`/`r focus`.
- **Project/session I/O** (`vpt7project.maxpat` + `prefs.maxpat`): `s`/`r projectpath`,
  `s presetspath`, `s`/`r videopath`, `r videopath_trig`, `s path`, `s`/`r ps`, `s ps_sources`/
  `r from-ps_sources`, `s loadcuelist`, `r presettrig`, `r current`, `s layerinit`
  (`varname "nLayersinit"`, in `prefs.maxpat`).
- **GUI/window state** (`vpt7project.maxpat`): `s blackout`, `r blackoutbutton`, `r masterfade`,
  `s win_preview`, `s win_output`, `r gui-preview_hide`, `s preview_hide`, `s gui_xfadeactive`,
  and `pattrstorage gui` (`@autorestore 0 @greedy 2`) reading/writing `data/gui.json` via
  `sprintf symout %sgui.json`.
- **Application preferences** (`prefs.maxpat`): the 18-field `route` schema listed under
  "Key patchers" above, persisted to `prefs.txt`; also `s divider`, `s sourceincgate`,
  `s sourcebank`, `s osc_out`, `s cursorFS`, `s screencount`, `s singlescreenratio`,
  `s screenratio`, `s setwindowsize`, `s ctrl`, `r ref-pref`, `r lbe`, `r cb`, `r folderupdate`,
  `r fullactive`.
- **Live module** (`livemodule-vpt7.maxpat`): `s`/`r #1cam`, `s`/`r #1colormode`, `s`/`r #1_com`
  (the `#1` token is the bpatcher-instance-argument substitution, i.e. this file is designed to be
  instantiated per camera-instance number), `s foldertrig`, `s ps_sources`/`r from-ps_sources`,
  `r lb`, `r monitor`, `r vpt_metro`, `pattr on`.

## Dependencies

- `code/tabs.js` — referenced by the `js tabs.js` object in `vpt7project.maxpat` (line 3949,
  `"filename" : "tabs.js"`).
- `OSC-route.mxo` — **referenced but not bundled.** Every `OSC-route` object in this cluster depends
  on it: `vpt7project.maxpat`'s three root `OSC-route` dispatchers and `livemodule-vpt7.maxpat`'s
  `OSC-route /a` / `OSC-route /on /rec /recdest`. Both files list it in their Max-generated
  `dependency_cache` (`vpt7project.maxpat` line 7163; `livemodule-vpt7.maxpat` line 4237), but no
  `OSC-route.mxo` file exists anywhere under `vpt8 source code/externals/` (confirmed enumeration:
  the directory contains exactly 7 items — `Label.mxo`, `Ldiv.mxo`, `Lmult.mxo`,
  `imp.artnet.node.mxo`, `jit.gl.syphonclient.mxo`, `jit.gl.syphonserver.mxo`, `o.route.mxo` — none
  of which is `OSC-route.mxo`). This is a missing/unresolved third-party dependency (likely a
  separately-installed CNMAT-style OSC object package), not one of the project's bundled externals.
- Built-in Jitter objects requiring no external: `jit.grab` (`livemodule_d.maxpat`),
  `jit.qt.record`, `jit.gl.texture`, `jit.fpsgui` (`vpt7project.maxpat`).
- `data/gui.json` — read/written by `vpt7project.maxpat`'s `pattrstorage gui`.
- No `shaders/*.jxs` files are referenced anywhere in this cluster.
- `vpt7project.maxpat`'s `dependency_cache` also transitively lists nearly every other patcher,
  external, and data file in the project (e.g. `Label.mxo`, `imp.artnet.node.mxo`,
  `jit.gl.syphonclient.mxo`/`jit.gl.syphonserver.mxo`, `Lmult.mxo`, `Ldiv.mxo`, `presets.json`,
  `sources.json`, `router.json`, `timer.json`) because it is the toplevel patcher and Max records
  every file reachable from it — those belong to other clusters' patchers, not to objects living
  directly in the 6 files covered here.

## Notable patterns

- **`#1`-substitution multi-instance convention.** `livemodule-vpt7.maxpat` uses `#1` in its
  `send`/`receive` names (`#1cam`, `#1colormode`, `#1_com`) exactly like the layer-bpatcher pattern
  documented in `CLAUDE.md` for `vlayer`/`layergui`/`layertab` — implying it too is meant to be
  instantiated multiple times with a per-instance argument.
- **Every OSC-controllable action has a doubled local/remote path.** Nearly every user control in
  `vpt7project.maxpat` has a matching `s osc-*`/`r osc-*` pair purely to keep the local GUI and
  remote OSC clients bidirectionally in sync — none of these sends perform computation themselves.
- **`prefs.maxpat` conflates two concerns.** Machine/user-level display preferences (`prefs.txt`)
  and per-project file-layout bookkeeping (`projectpath.txt`, `layers.txt`, `presets/`, `video/`
  subpaths) are both funneled through the same generic `sprintf symout %s...` +
  `route read`/`prepend write` idiom, in the same file.
  - Note: the project-path/layers.txt file-persistence wiring lives inside `prefs.maxpat` itself
  even though it is unrelated to "preferences" in the ordinary sense (window size, antialiasing,
  etc.) — it is really "settings and file-path I/O", not just user prefs.
- **Two-level floating-window nesting.** Both `vpt7project.maxpat` and `livemodule-vpt7.maxpat`
  open themselves as independent floating OS windows (`thispatcher` + `window title`/`window
  flags`/`window exec`/`savewindow`); `livemodule-vpt7.maxpat` additionally nests a second such
  window (`p livesettings`) opened/closed via a `pcontrol` object.
- **`vpt7_keys.maxpat` is inert by design.** It has zero patch cords (`"lines" : [ ]`) — it is a
  static reference card, not a functional module, and is not wired to the real key-handling logic
  in `p keyboard_selectlayers`.

## Tech-debt findings

1. **[missing-dependency]** `OSC-route.mxo` is referenced by this project's own Max-generated
   `dependency_cache` metadata, but no such file exists anywhere under
   `vpt8 source code/externals/` (confirmed enumeration: only 7 externals are actually bundled —
   `Label.mxo`, `Ldiv.mxo`, `Lmult.mxo`, `imp.artnet.node.mxo`, `jit.gl.syphonclient.mxo`,
   `jit.gl.syphonserver.mxo`, `o.route.mxo` — `OSC-route.mxo` is not among them). Yet the root OSC
   dispatch in `vpt7project.maxpat` and the live-module's OSC control surface both depend directly
   on `OSC-route` objects for all OSC-address routing, so opening either patcher on a machine
   without this external separately installed (likely a third-party CNMAT-style OSC object package)
   will produce unresolved-object errors. Location: `vpt8 source code/patchers/vpt7project.maxpat`
   — dependency_cache entry `"name" : "OSC-route.mxo"` (line 7163); `vpt8 source code/patchers/livemodule-vpt7.maxpat`
   — same entry (line 4237). Severity: high. Effort: high.
2. **[closed-dependency]** `Label.mxo`, `imp.artnet.node.mxo`,
   `jit.gl.syphonclient.mxo`/`jit.gl.syphonserver.mxo`, `Lmult.mxo`, `Ldiv.mxo` are precompiled
   binaries with no source anywhere in this repository — even on Mac they cannot be audited,
   rebuilt, or patched. `OSC-route.mxo` compounds this further: unlike these, it is not even bundled
   (see finding 1 above), so the app's entire OSC remote-control surface is coupled to an opaque
   third-party/unknown-provenance binary that must be sourced independently. Location:
   `vpt8 source code/patchers/vpt7project.maxpat` — dependency_cache `"type" : "iLaX"` entries
   (lines 7163-7189). Severity: medium. Effort: high.
3. **[hardcoded-limit]** The OSC listen/send ports are literal object arguments with no
   preference or UI anywhere in this cluster to change them (`udpreceive 6661`,
   `udpsend 127.0.0.1 6660`), and the live-record destination path defaults to a
   machine-specific development path left in as a message-box literal. Location:
   `vpt8 source code/patchers/vpt7project.maxpat` — `"text" : "udpreceive 6661"` (line 3334),
   `"text" : "udpsend 127.0.0.1 6660"` (line 3297); `vpt8 source code/patchers/livemodule-vpt7.maxpat`
   — `"text" : "HCHD:/moovs/videomlyd/"` (line 774). Severity: medium. Effort: low.
4. **[architectural-fragility]** `vpt7project.maxpat` is a single flat 7194-line root patcher:
   window-lifecycle boilerplate, OSC routing, layer-lifecycle dispatch, and prefs-refresh wiring
   nearly all live directly at the top level — only four named subpatchers exist
   (`p keyboard_selectlayers`, `p solo`, `p layers_add-delete`, `p layerorder`) among several
   hundred toplevel boxes, giving edits in this file an unusually large blast radius. Location:
   `vpt8 source code/patchers/vpt7project.maxpat` — entire toplevel `boxes` array (lines 41-5309).
   Severity: medium. Effort: high.
5. **[dead-code]** `vpt7_keys.maxpat` has zero patch cords — every box is a `comment` and the
   file's own connection list is empty — so it is a pure static reference card with no link back
   to the real key-handling logic (`p keyboard_selectlayers` in `vpt7project.maxpat`); shortcuts
   can silently drift out of sync with actual behavior since nothing enforces consistency between
   the two files. Location: `vpt8 source code/patchers/vpt7_keys.maxpat` — `"lines" : [  ]`
   (line 214). Severity: low. Effort: low.
6. **[naming-inconsistency]** `livemodule-vpt7.maxpat` follows the same `#1`-argument
   multi-instantiation convention as the documented `vlayer`/`layergui`/`layertab` triad
   (`s #1cam`, `s #1colormode`, `s #1_com`), but no corresponding add/delete/startup lifecycle
   driver for live-module instances is visible anywhere in this cluster or its declared
   dependencies — it is unclear from these 6 files alone whether/how more than one live-module
   instance is ever created. Location: `vpt8 source code/patchers/livemodule-vpt7.maxpat` —
   `"text" : "s #1cam"` (line 3458), `"text" : "s #1colormode"` (line 1834),
   `"text" : "s #1_com"` (lines 2265, 2310). Severity: low. Effort: medium.
7. **[no-tests-ci]** There is no automated test or CI coverage for any behavior in this cluster
   (app boot, prefs persistence, OSC networking, layer-lifecycle dispatch); the only way to verify
   that, say, sending an OSC message to `udpreceive 6661` (`vpt7project.maxpat`, line 3334)
   produces the correct `s engine` message, or that `prefs.maxpat`'s `route` schema (line 2547)
   still matches the fields actually written to `prefs.txt`, is to open the project in Max 7.3.5
   and exercise it by hand. Location: `vpt8 source code/patchers/vpt7project.maxpat` and
   `vpt8 source code/patchers/prefs.maxpat` (whole files — no test harness exists for either).
   Severity: medium. Effort: high.
