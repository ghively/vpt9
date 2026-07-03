# VPT8 Technical Debt Catalog

Compiled from a full read of all 49 patchers, 5 `code/*.js` scripts, 38 `.jxs` GL shaders (79 files
total under `shaders/`, including shared GLSL/ARB/Cg includes and license attributions) + 3
`pattrstorage` data dumps, and the 7 bundled Mac-only externals — the same source audit that produced
the eleven module docs under [`architecture/`](architecture/) and the
[architecture overview](architecture/00-overview.md). Each finding cites its concrete source
location(s), a severity, and a rough remediation effort.

Findings are grouped by the nine category tags used across the module docs. Entries that multiple
module docs raised about the *same underlying issue* have been merged into a single entry that cites
every location; the "Sources" note on merged entries records which module docs contributed. This
catalog contains **78** entries deduplicated from **93** raw findings across the eleven docs (25
raw findings collapsed into 10 merged entries).

Two cross-cutting nuances that corrected earlier per-module framing are reflected below and worth
stating up front:

- **`OSC-route.mxo` is *missing*, not a bundled Mac-only external.** It is referenced by the
  project's own `dependency_cache` in 17 patchers but does **not** exist under
  `vpt8 source code/externals/` (which holds exactly 7 items: `Label.mxo`, `Ldiv.mxo`, `Lmult.mxo`,
  `imp.artnet.node.mxo`, `jit.gl.syphonclient.mxo`, `jit.gl.syphonserver.mxo`, `o.route.mxo`). It is
  captured once, under **closed-dependency**, and is not conflated with the 7 real bundled externals.
- **The 6-pass Gaussian blur (`jit.gl.slab.gauss6x.maxpat`) is hand-duplicated in two files.**
  `pointmask.maxpat` uses the reusable abstraction correctly; `vlayer.maxpat` and `layermask.maxpat`
  each reimplement the same algorithm inline. Captured once, under **architectural-fragility**.

---

## platform-gap

1. **Syphon GPU texture-sharing is Mac-only, silently dead on Windows.** The composited-output Syphon
   server and all four inbound Syphon source slots depend on `jit.gl.syphonserver.mxo` /
   `jit.gl.syphonclient.mxo`, Mac-only `.mxo` externals with no bundled Windows (`.mxe64`) build, yet
   VPT8 ships for both platforms — so `s syphon_output`, the `syphon1`-`syphon4` source-bank slots, and
   the Syphon-output feature are non-functional on Windows. Location:
   `vpt8 source code/patchers/enginetab.maxpat` — `s syphon_output` (line ~1766);
   `vpt8 source code/patchers/syphon_vpt7.maxpat:355` (`jit.gl.syphonclient vpt @enable 0`);
   `vpt8 source code/patchers/vpt-syphonout.maxpat:193` (`jit.gl.syphonserver vpt @servername output @enable 0`);
   externals confirmed only as `.mxo` in `sourcebank.maxpat`'s `dependency_cache` (`:4662`, `:4666`).
   Severity: medium. Effort: high (would require a Windows equivalent, e.g. Spout, and per-platform
   branching). *Sources: Tasks 2, 7.*
2. **Art-Net/DMX input is Mac-only.** Art-Net depends on `imp.artnet.node.mxo`, a Mac-only external
   with no Windows build in the repo, so DMX/lighting control is unavailable on Windows. Location:
   `vpt8 source code/patchers/artnet-vpt.maxpat` — `imp.artnet.node @universe 1 @mode 2` (line 412),
   `dependency_cache` entry `"name" : "imp.artnet.node.mxo"` (line 563). Severity: high. Effort: high.
   *Source: Task 9.*
3. **A platform-specific movie-decode engine is hardcoded.** `xfadesource.maxpat` pins
   `jit.movie @engine viddll` (the Windows DirectShow engine) on both decoders, while VPT ships for Mac
   too (where the engine would be `avf`); `hapsource.maxpat` correspondingly pins `@engine hap`.
   Hardcoding a platform-specific engine relies on Max's silent cross-platform fallback. Location:
   `vpt8 source code/patchers/xfadesource.maxpat` — `jit.movie @output_texture 1 @engine viddll …`
   (lines 8523, 8630). Severity: medium. Effort: low. *Source: Task 6.*
4. **Default serial-port list is macOS-specific.** The serial-port `umenu` defaults to
   `OFF, Bluetooth-Incoming-Port`, with no Windows COM-port equivalent, even though Max's `serial`
   object itself is cross-platform. Location: `vpt8 source code/patchers/serial_VPT7.maxpat:2279`.
   Severity: low. Effort: low. *Source: Task 9.*

## toolchain-version

1. **The engine tab is pinned to Max 7.3.5 (2018) with no forward-compat guarantee.**
   `enginetab.maxpat` is saved for Max 7.3.5 / x64 and untouched since VPT8's 2018 release; its deeply
   nested GL/`pattrstorage` wiring has no guaranteed compatibility with Max 8/9. Location:
   `vpt8 source code/patchers/enginetab.maxpat` — `appversion` block (lines 4-9). Severity: low.
   Effort: high. *Source: Task 2.*
2. **The LFO rack container was saved with an older, 32-bit Max than its own children.**
   `lforack-vpt7.maxpat` (and its nested `p lfo`) carry `"revision":4,"architecture":"x86"` (Max
   7.3.4, 32-bit) while the two bpatchers it hosts carry `"revision":5,"architecture":"x64"` — directly
   contradicting `CLAUDE.md`'s "64-bit only" claim and suggesting the container predates (or was never
   re-saved during) the move to 64-bit-only Max. Location:
   `vpt8 source code/patchers/lforack-vpt7.maxpat` lines 7-8 and 123-124, vs.
   `lfomodule-vpt7_01.maxpat` / `lfomix-vpt7_01.maxpat` lines 6-8. Severity: low. Effort: low
   (re-save to normalize). *Source: Task 10.*
3. **A serial-port `dependency_cache` bakes in a dated VPT7-era authoring path.** A `bootpath` points
   at the original developer's machine-specific Max 7 project folder, unrelated to the VPT8 tree it now
   ships in. Location: `vpt8 source code/patchers/serial_VPT7.maxpat:3073` —
   `"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers"` (also present in
   `router-vpt7.maxpat`, lines 1813/1820). Severity: low. Effort: low. *Source: Task 9.*
4. **VPT8 ships two entire legacy shading toolchains (ARB assembly + Cg) with no live code path.**
   `cc.scalebias.jxs` is the sole top-level shader targeting `language name="arb"` (pre-GLSL
   `!!ARBfp1.0` assembly), and it is itself referenced by no patcher; the `shaders/shared/arb/` and
   `shaders/shared/cg/` directories (5 files) exist only to support that dead ARB/Cg path, of which
   only `sh.passthru.vp.arb` is referenced at all (by the dead `cc.scalebias.jxs`). One of them,
   `shaders/shared/arb/sh.passthru.fp.arb`, is a literal 0-byte file. Location:
   `vpt8 source code/shaders/cc.scalebias.jxs`; `vpt8 source code/shaders/shared/arb/`;
   `vpt8 source code/shaders/shared/cg/`. Severity: low. Effort: low (removal candidates).
   *Source: Task 11.*

## closed-dependency

1. **`OSC-route.mxo` — the backbone of VPT's internal OSC dispatch — is referenced but not bundled at
   all.** `OSC-route` (capitalized, hyphenated; a different object from the bundled `o.route`) is
   instantiated as a real object in **17** patchers with dozens of call sites and is central to the
   app's message routing, yet no `OSC-route.mxo` exists under `vpt8 source code/externals/` (only 7
   other externals do) and no `OSC-route.maxpat` abstraction exists anywhere in `patchers/`. It must
   resolve to a separately-installed third-party package (plausibly CNMAT's OSC library) on whatever
   machine built/ran the project — undocumented and unverifiable from this repo. Opening any of the 17
   patchers on a machine without it separately installed produces unresolved-object errors across the
   entire OSC control surface. Location (representative of 17): `vpt8 source code/patchers/vpt7project.maxpat`
   — `dependency_cache` entry `"name":"OSC-route.mxo"` (line 7163); `livemodule-vpt7.maxpat` (line 4237);
   `enginetab.maxpat` (11 `OSC-route` object instances); `vlayer.maxpat`, `layermask.maxpat`,
   `activelayer.maxpat`, `hapsource.maxpat`/`xfadesource.maxpat` (`:10471`),
   `ctrl_config-vpt7_01.maxpat` (`:2989`), `layergui.maxpat`, `mix-vpt7.maxpat`. Severity: high.
   Effort: high. *Sources: Tasks 1, 6, 9, 11.*
2. **The 7 bundled externals are opaque Mac-only precompiled binaries with no source.** `Label.mxo`,
   `Ldiv.mxo`, `Lmult.mxo`, `imp.artnet.node.mxo`, `jit.gl.syphonclient.mxo`, `jit.gl.syphonserver.mxo`,
   and `o.route.mxo` are precompiled `.mxo` bundles with no source anywhere in the repo — they cannot be
   audited, rebuilt, ported to Windows (no `.mxe64` builds are bundled), or verified for correctness;
   their behavior is taken on faith from `Info.plist`/folder naming. Location:
   `vpt8 source code/externals/` (the 7 `.mxo` bundles);
   `vpt8 source code/patchers/vpt7project.maxpat` — `dependency_cache` `"type":"iLaX"` entries
   (lines 7163-7189). Severity: medium. Effort: high (would require sourcing/rebuilding the packages).
   *Sources: Tasks 1, 11.*

## dead-code

1. **`vpt7_keys.maxpat` is inert by design and can silently drift from real behavior.** Every box is a
   `comment` and the file's connection list is empty (`"lines" : [ ]`), so it is a pure static keyboard
   reference card with no link to the real key-handling logic in `vpt7project.maxpat`'s
   `p keyboard_selectlayers` — documented shortcuts can drift out of sync with actual behavior with
   nothing enforcing consistency. Location: `vpt8 source code/patchers/vpt7_keys.maxpat` —
   `"lines" : [ ]` (line 214). Severity: low. Effort: low. *Source: Task 1.*
2. **A lone `ezdac~` with no signal chain sits in the otherwise pure-video engine tab.** A bare stereo
   audio-output DAC toggle (obj-20) is wired only from the same global `r onoff` that gates the video
   engine, via a toplevel patchcord; nothing feeds signal into it, and it is the *only* audio/DSP object
   in the entire 23,229-line video-control file — leftover debug/test residue. Location:
   `vpt8 source code/patchers/enginetab.maxpat` — `ezdac~` (obj-20, line 12527), `r onoff` (obj-25,
   line ~12642), patchcord (line ~22746). Severity: low. Effort: low. *Source: Task 2.*
3. **An orphaned shaderless `jit.gl.slab vpt` has no connection in `vlayer.maxpat`.** A root-scope
   `jit.gl.slab vpt` with no `@file` appears in no entry of the root patchline list. Location:
   `vpt8 source code/patchers/vlayer.maxpat` — line 9517. Severity: low. Effort: low. *Source: Task 3.*
4. **`p joint` is a pure identity passthrough in the layer signal path.** Sitting inline between the
   mesh-warp stage and the final `s #1layertex` output, its entire nested patcher is a single inlet
   wired straight to a single outlet with no processing. Location:
   `vpt8 source code/patchers/vlayer.maxpat` — `p joint` (line 9057; inlet→outlet at ~9009-9044).
   Severity: low. Effort: low. *Source: Task 3.*
5. **A `dependency_cache` entry carries a stale pre-VPT8 bootpath.** `vlayer.maxpat`'s cache entry for
   `layermask.maxpat` points its `bootpath` at a previous major version's project folder
   (`~/Documents/Max 7/Projects/vpt7-2017-140417/patchers`), a copy-forward artifact. Location:
   `vpt8 source code/patchers/vlayer.maxpat` — `dependency_cache` entry for `layermask.maxpat`
   (lines ~10124-10129). Severity: low. Effort: low. *Source: Task 3.*
6. **Three hidden, unwired click-to-test message boxes remain in `layersbank.maxpat`.** `addLayer`
   (line 225), `deleteLayer` (line 209), and `init` (line 193) feed `js dummylayers02c.js` but have no
   incoming patchcords anywhere in the file — leftover debug residue duplicating the real `r dummylayer`
   production path. Location: `vpt8 source code/patchers/layersbank.maxpat` — lines 181-249.
   Severity: low. Effort: low. *Source: Task 5.*
7. **7 of the 24 blend-mode mixer shaders are unreachable from the mixer UI.** `difference`, `dodge`,
   `exclude`, `glow`, `inverse`, `negate`, and `reflect` (`shaders/v001 Mixers/*.jxs`) are never listed
   as items in `mix-vpt7.maxpat`'s `mixtype` umenu (which offers only 17 modes), so they cannot be
   selected from that UI. Location: `vpt8 source code/patchers/mix-vpt7.maxpat` — `umenu` items (line 911);
   compare `vpt8 source code/shaders/v001 Mixers/`. Severity: low. Effort: low. *Source: Task 5.*
8. **Stale author-machine clip paths and personal sample-clip lists are saved into the source engines.**
   Both clip `umenu`s carry `prefix` paths on the original developer's machine
   (`HD:/Users/hcg/Desktop/vpt2012lab/default kopi/video/`, hapsource line 8531;
   `HD:/Users/hcg/lab/vpt7-2017-osx-beta03/defaultproject2017/video/`, xfadesource line 8608) plus
   hardcoded lists of personal sample clips (`alphatest.mov`, `maja.mov`, `xlive101.mov`, …) that
   resolve on no other install. Location: `vpt8 source code/patchers/hapsource.maxpat` line 8531;
   `xfadesource.maxpat` line 8608. Severity: low. Effort: low. *Source: Task 6.*
9. **A `pattr refreshrate` is explicitly dead, kept only for cross-file parity.** Annotated
   `"not used, included to be compatible with xfadestill"`. Location:
   `vpt8 source code/patchers/hapsource.maxpat` line 2003 (and `xfadesource.maxpat` line 2080).
   Severity: low. Effort: low. *Source: Task 6.*
10. **A `pattr on` in `xfadestill.maxpat` is dead, kept only for parity.** Annotated
    `"not used, included to be compatible with xfadesource"` (`saved_object_attributes`
    `{"parameter_enable":0}`). Location: `vpt8 source code/patchers/xfadestill.maxpat:2283` (comment),
    object at `:2743`. Severity: low. Effort: low. *Source: Task 7.*
11. **An undocumented cue-type letter `X`/`x` is wired into the cue-list dispatcher.** `zl compare X` /
    `zl compare x` feed the 9-outlet dispatch `gate`, but `X` is absent from the in-patcher help text
    (which documents only `C F D L S R O END`) — either an experimental feature or dead residue from a
    removed cue type. Location: `vpt8 source code/patchers/cuelist-vpt7.maxpat` — `zl compare X`
    (line 3887), `zl compare x` (line 3326); help `p cuelist_help` (lines 804-810). Severity: low.
    Effort: low. *Source: Task 8.*
12. **An abandoned "external preset control" pathway remains in `vpt-timersketch3.maxpat`.** Four
    objects — `r t_ctrlpreset`, a disconnected `t i b`, `s f_ctrlpreset`, and `s prefsave` — have zero
    patchline connections anywhere in the file. Location:
    `vpt8 source code/patchers/vpt-timersketch3.maxpat` — lines ~212-254. Severity: low. Effort: low.
    *Source: Task 8.*
13. **Multiple top-level and shared shader files are never referenced by any patcher.** At least 6 of
    the 14 top-level shaders are unreferenced (`ab.spotmask_mod01.jxs` — whose own description reads
    "shader program that does absolutely nothing!", `cc.alphaglue01.jxs`, `cc.scalebias.jxs`,
    `cc.uyvy2rgba.lite.jxs`, `tr.edgeblend.jxs`), and 12 of the 15 shared vertex/fragment includes are
    never `source=`-referenced by any `.jxs`. Location: `vpt8 source code/shaders/` (the named files)
    and `vpt8 source code/shaders/shared/{arb,cg,glsl}/`. Severity: low. Effort: low (safe to delete
    after confirming no external tooling references them). *Source: Task 11.*
14. **`o.route.mxo` is a bundled Mac-only external that no patcher actually instantiates.** It is
    declared in the `dependency_cache` of 5 patchers (`controltabs.maxpat`, `layersbank.maxpat`,
    `lforack-vpt7.maxpat`, `router-vpt7.maxpat`, `sourcebank.maxpat`), but grep across all 49 patchers
    finds no `o.route` object box anywhere — even `router-vpt7.maxpat`, whose name most suggests it,
    uses only built-in `route`/`p router`. Appears to be unused dead weight (or stale cache metadata,
    since Max regenerates `dependency_cache` from historical opens and does not reliably prune it).
    Location: `vpt8 source code/externals/o.route.mxo`; `dependency_cache` entries in the 5 patchers
    above (e.g. `router-vpt7.maxpat` lines 1825-1828, `lforack-vpt7.maxpat` line 1685); absence
    confirmed across `vpt8 source code/patchers/*.maxpat`. Severity: low. Effort: low
    (confirm-then-delete). *Sources: Tasks 9, 10, 11.*
15. **Leftover debug `print` objects are wired into live signal/message paths across many patchers.**
    Active `print` taps dump to the Max console during normal operation with no runtime purpose:
    `print #1layerout` in the corner-warp signal path (`vlayer.maxpat` line 5575); `print vpath` /
    `print #1pattr_vpath` and a Norwegian design-question comment (`hapsource.maxpat` lines 1291/1220/4306,
    mirrored in `xfadesource.maxpat`); `print #1dim` / `#1adapted` / `#1fra` / `xfades`
    (`xfadestill.maxpat` lines 950/1453/1467/2618) and `print dumpout` on the Syphon discovery chain
    (`syphon_vpt7.maxpat` line 757); two unwired `print serialO` / `print serialin`
    (`serial_VPT7.maxpat` lines 625/671 — genuinely orphaned, distinct from the one legitimately-wired
    `print` at line 1692). Severity: low. Effort: low. *Sources: Tasks 3, 6, 7, 9.*
16. **Unused and commented-out JavaScript functions remain in the `code/*.js` scripts.** `vlayer2.js`
    carries a commented-out original `init()`/`addLayer()` (lines 11-24) and a `wait(w)` busy-loop
    (lines 45-50) that would block Max's UI thread and is never called (its only call site is commented
    out at line 39); `pointgrid01b.js` defines a near-duplicate `init2(gridsize)` (lines 36-45) of
    `init`; `pointmask01.js` defines an `ellipse(w,h)` (lines 207-213) called by nothing. Location:
    `vpt8 source code/code/vlayer2.js` lines 11-24/39/45-50; `pointgrid01b.js` lines 36-45;
    `pointmask01.js` lines 207-213. Severity: low. Effort: low. *Sources: Tasks 2, 11.*

## naming-inconsistency

1. **`livemodule-vpt7.maxpat` uses the multi-instance `#1` convention but has no lifecycle driver.** It
   follows the same `#1`-argument namespacing (`s #1cam`, `s #1colormode`, `s #1_com`) as the layer
   triad, but no add/delete/startup driver for live-module instances is visible in its cluster or
   dependencies, so whether more than one instance is ever created is unclear from the source alone.
   Location: `vpt8 source code/patchers/livemodule-vpt7.maxpat` — `s #1cam` (line 3458),
   `s #1colormode` (line 1834), `s #1_com` (lines 2265, 2310). Severity: low. Effort: medium.
   *Source: Task 1.*
2. **The layer-count concept is spelled three unlinked ways.** The value object `v nLayers` (camelCase,
   line ~3870), the receive `r nlayers` (lowercase, line ~3798, fed from the root patcher's `s nlayers`),
   and the `p VPT` receive `r layerinit` / `varname "nLayersinit"` (line ~6291) all denote the layer
   count with nothing tying them together. Location: `vpt8 source code/patchers/enginetab.maxpat` —
   lines ~3798, ~3870, ~6291. Severity: low. Effort: low. *Source: Task 2.*
3. **`p mblur` / `pattr mblur` is not a blur.** Despite its name (and `enginetab.maxpat`'s own
   `mblur::on` parameter-list entry), it is a directional slide/trail effect (`tp.slide.jxs`,
   `slide_up`/`slide_down`) with no blur math; the real Gaussian blur is the separately-named `p blur`.
   Location: `vpt8 source code/patchers/vlayer.maxpat` — `pattr mblur @initial 0` (line 3741),
   `jit.gl.slab vpt @file tp.slide.jxs` (line 3793). Severity: low. Effort: low. *Source: Task 3.*
4. **The rotation shader `td.rota.jxs` is silently reused for three unrelated features.** It backs
   rotation/zoom (`p zoom`), tiling (`p tile`), and mirroring (`p flip`) via different parameter
   drivers, with no comment marking the reuse — a maintainer searching shaders by feature name will
   miss two of three usages. Location: `vpt8 source code/patchers/vlayer.maxpat` — lines 2173, 5123, 9267.
   Severity: low. Effort: low. *Source: Task 3.*
5. **Two `pattr`s in the layer template break the file's own attribute conventions.**
   `pattr layerorder` and `pattr layername` omit the `@initial` attribute every sibling uses, instead
   carrying baked-in editor-time `restore` values (`[3]`, `["layer_1"]`) left over from the template's
   last-saved instance; and `pattr source`'s attributes (`@default_interp 0 @initial off`) are
   ordered/valued opposite to every other pattr's `@initial <val> @default_interp off`. Location:
   `vpt8 source code/patchers/vlayer.maxpat` — lines 5406/5412, 5472/5478, 5514-5515. Severity: low.
   Effort: low. *Source: Task 3.*
6. **A vestigial `s nrb` in `gridcontroller.maxpat` shares a name fragment with unrelated NURBS logic.**
   `s nrb` (obj-168) is fed only by an unrelated `ctlshow 0` visibility toggle on window close; the
   actual per-layer NURBS-mesh update path is a completely different `sprintf send %inrb` → `forward`
   mechanism. Location: `vpt8 source code/patchers/gridcontroller.maxpat` — obj-168 (line 535) fed from
   obj-18 (line 256). Severity: low. Effort: low. *Source: Task 4.*
7. **`mix-vpt7.maxpat`'s first blend mode "mix" has no matching shader and needs a workaround.** The
   `mixtype` umenu's first item is "mix", but there is no `v001.co2.mix.jxs` — only
   `v001.co2.alphablend.jxs` — so a `p workaround` subpatcher special-cases the literal symbol "mix" to
   force `"alphablend"` instead of following the file's own `sprintf read v001.co2.%s.jxs` convention.
   Location: `vpt8 source code/patchers/mix-vpt7.maxpat` — `p workaround` (line 793), `pattr mixtype`
   (line 861), umenu items (line 911). Severity: low. Effort: low. *Source: Task 5.*
8. **A source bank's identity is split across two hand-synchronized channels.** The integer arg `#1`
   drives all `s/r #1…` sends and `/<N>video` OSC routing, while the bpatcher scripting name
   `videobankNN` drives the `videobankNN::…` pattr namespace; a mismatch silently misroutes control and
   state with no error. Location: `vpt8 source code/patchers/hapsource.maxpat` `s #1video` (line 6818) /
   `sprintf set 1 /%ivideo` (line 3638) vs. `sourcebank.maxpat` `args`/`varname` pairing (lines 3716-3897).
   Severity: medium. Effort: medium. *Source: Task 6.*
9. **A "clear all presets" button's hint describes a different button's behavior.** The `p clearall`
   textbutton (which clears *every* preset) carries the hint `"deletes selected preset"` (clearing
   *one*) — a copy-pasted, incorrect hint. Location:
   `vpt8 source code/patchers/presetmodule-vpt7.maxpat` — obj-67 (line 707), hint (line 711).
   Severity: low. Effort: low. *Source: Task 8.*
10. **The preset-engine reply dispatcher is fed by a receive named `r fps`.** Everywhere else in the
    codebase `fps` means frames-per-second; reusing it here for preset-storage replies risks accidental
    cross-talk if any module broadcasts a frame rate on that bus name. Location:
    `vpt8 source code/patchers/presetmodule-vpt7.maxpat` — `r fps` (line 2782) feeding `route slotname
    delete read write recall current` (line 2812). Severity: low. Effort: low. *Source: Task 8.*
11. **Copy/paste silently omits 7 per-layer parameters that presets do capture.** `copypaste.maxpat`'s
    copyable-parameter `umenu` enumerates 38 names but omits `mesh::gridsize`, `mesh::on`,
    `mesh::position`, `layername`, `layerorder`, `mask::points`, and `zoom::rota` — all present in the
    45-key `1layer::*` namespace in `data/presets.json` — so copy/paste skips a layer's mesh warp,
    name/stacking order, mask-shape points, and zoom rotation with no indication to the user. Location:
    `vpt8 source code/patchers/copypaste.maxpat` — obj-16 items (lines 663-674); compare
    `vpt8 source code/data/presets.json` (the 7 missing keys). Severity: low. Effort: low.
    *Source: Task 8.*
12. **`copypaste.maxpat` has a misspelled receive and a legacy/duplicate trigger pair.** A misspelled
    `r focuse` (missing "d", twice) sits alongside correctly-spelled `focus` objects, and a
    current/legacy pair `r copyfromlayer`/`r pastetolayer` sits alongside grey-colored (de-emphasized)
    `r lcopy`/`r lpaste` apparently serving the same purpose. Location:
    `vpt8 source code/patchers/copypaste.maxpat` — `r focuse` (lines 94, 536); `r lcopy` (line 230),
    `r lpaste` (line 214). Severity: low. Effort: low. *Source: Task 8.*
13. **All 13 control-surface files retain VPT7-era filenames, and one references VPT6 assets.** Every
    file in the control cluster keeps `vpt7`/`VPT7` in its name despite living in the VPT8 tree, and
    `miditab-vpt7.maxpat` embeds a still-older `vpt6_midi.png`. Location: filenames themselves (e.g.
    `vpt8 source code/patchers/miditab-vpt7.maxpat`); vpt6 image path
    `"pic":"HCHD:/Users/hcg/Desktop/vpt6_images/vpt6_midi.png"`. Severity: low. Effort: low.
    *Source: Task 9.*
14. **The router's address-string grammar is internally inconsistent.** Most destination categories
    build a slash-prefixed `/<name><nr>/<param>` path, but the "cam"/sources category builds a bare
    `sources/N` token with no leading slash. Location:
    `vpt8 source code/patchers/ctrl_config-vpt7_01.maxpat:384` (`sprintf sources/%s`) vs. `:2377`
    (`sprintf /%s/%s \$1`). Severity: low. Effort: low. *Source: Task 9.*
15. **11 of 24 blend-mode mixer shaders carry a wrong, copy-pasted internal `<jittershader name>`.**
    `brightlight`, `burn`, `darken`, `difference`, `dodge`, `exclude`, `freeze`, `glow`, `heat`,
    `inverse`, and `lighten` all declare `<jittershader name="AB Additive">`, inherited from
    `additive.jxs` and never updated — a GUI-display/introspection cosmetic bug (the filename, not this
    name, drives loading) that would mislabel 11 distinct modes as "AB Additive" in any tool reading the
    declared name. Location: `vpt8 source code/shaders/v001 Mixers/v001.co2.brightlight.jxs` line 1
    (and the 10 other named files). Severity: low. Effort: low (one-line fix per file). *Source: Task 11.*
16. **`Label`/`Ldiv`/`Lmult` externals are instantiated with a case that only resolves on
    case-insensitive filesystems.** The bundles are capitalized (`Label.mxo`, `Ldiv.mxo`, `Lmult.mxo`)
    but every instantiating object uses an all-lowercase class name (`label …`, `ldiv 255.`,
    `lmult 1.5 1.5`), which loads correctly only on macOS's default case-insensitive HFS+/APFS and would
    fail on a case-sensitive filesystem. Location: `vpt8 source code/patchers/activelayer.maxpat` (10
    `label` boxes), `clipcontrol.maxpat` (1), `enginetab.maxpat` (`label` ×1, `lmult` ×2),
    `vlayer.maxpat` (`ldiv`); compare `vpt8 source code/externals/Label.mxo`, `Ldiv.mxo`, `Lmult.mxo`.
    Severity: low. Effort: low. *Source: Task 11.*
17. **`dependency_cache` is an unreliable dependency inventory — under-reporting in some files,
    over-reporting in others.** Under-reporting: `gridcontroller.maxpat` has no `dependency_cache` key
    at all (so its `code/pointgrid01b.js` dependency is undeclared), and 5 of the 7 files in the GUI/mix
    cluster (`layergui`, `layertab`, `mix-vpt7`, `clipcontrol`, `loopback_clip_vpt7`) likewise declare
    none — any tool walking `dependency_cache` to package the project would silently miss their scripts
    and by-name-loaded shaders. Over-reporting: a top-level patcher's cache propagates transitively many
    levels deep, so `vpt7project.maxpat`'s cache lists `Label.mxo` even though no box in that file
    instantiates it (the real usage is 2 levels down in `activelayer.maxpat`). Location:
    `vpt8 source code/patchers/gridcontroller.maxpat` (no cache); the 5 GUI/mix files above (no cache);
    `vpt8 source code/patchers/vpt7project.maxpat` (`Label.mxo` cache entry) vs. `activelayer.maxpat`
    (actual `label` boxes). Severity: low. Effort: low (informational / tooling caveat).
    *Sources: Tasks 4, 5, 11.*

## architectural-fragility

1. **The root patcher is a single flat 7,194-line file.** `vpt7project.maxpat` puts
   window-lifecycle boilerplate, OSC routing, layer-lifecycle dispatch, and prefs-refresh wiring nearly
   all at the top level — only four named subpatchers exist among several hundred toplevel boxes, giving
   edits an unusually large blast radius. Location: `vpt8 source code/patchers/vpt7project.maxpat` —
   toplevel `boxes` array (lines 41-5309). Severity: medium. Effort: high. *Source: Task 1.*
2. **The engine tab is a single 23,229-line file mixing unrelated concerns.** `enginetab.maxpat`
   combines the shared GL context, the layer manager, the master preset store, the app-wide OSC
   dispatcher, the corner-pin/keystone editor, multiscreen dividers, and serial output in one deeply
   nested patcher. Location: `vpt8 source code/patchers/enginetab.maxpat` (whole file; e.g. `p VPT` at
   line ~7003 vs. `p cornerpin-calculations` at line ~22417). Severity: high. Effort: high.
   *Source: Task 2.*
3. **All cross-module coupling relies on stringly-typed shared names with no compile-time check.** The
   GL context name `vpt` and a flat global send/receive namespace (`osc_in`, `osc_out`, `toPS`,
   `refresh`, `to_layer`, …) are the only glue between modules; renaming any string silently breaks the
   mixer, sources, or preset wiring. Location: `vpt8 source code/patchers/enginetab.maxpat` —
   `jit.world vpt … @shared 1 @output_texture 1` (line ~438), OSC dispatcher (line ~10010).
   Severity: medium. Effort: high. *Source: Task 2.*
4. **The 6-pass Gaussian blur is hand-duplicated inline in two files instead of reusing the existing
   abstraction.** `jit.gl.slab.gauss6x.maxpat` implements a reusable 6-pass, alternating-axis,
   geometrically-doubling-width blur and *is* used correctly by `pointmask.maxpat`
   (`jit.gl.slab.gauss6x mask`, line 2068) — but `vlayer.maxpat`'s `p gauss` and `layermask.maxpat`'s
   `p gauss` each reimplement the identical algorithm inline with six bare `jit.gl.slab vpt` objects and
   a `cf.gaussian.2p.jxs` `sendshader`/width-doubling chain, giving three independent copies of one
   algorithm. Location: `vpt8 source code/patchers/vlayer.maxpat` — `p gauss` (line 4628; six slabs at
   4248-4400); `vpt8 source code/patchers/layermask.maxpat` — `p gauss` (lines 864-1189, loader at 975);
   cf. `vpt8 source code/patchers/jit.gl.slab.gauss6x.maxpat` (whole file) and its correct use in
   `pointmask.maxpat:2068`. Severity: medium. Effort: medium. *Sources: Tasks 3, 4.*
5. **The nine per-layer effect modules are wired into one undocumented cascade, not a dispatcher.** Each
   module's `OSC-route` passes its unmatched-message outlet into the next module's router
   (tile→zoom→blur→mblur→brcosa→edgeblend→mesh); the order is recoverable only by tracing individual
   patchcords, and inserting a new effect means splicing into this specific chain with no central
   registry. Location: `vpt8 source code/patchers/vlayer.maxpat` — patchlines linking
   `obj-13`→`obj-35`→`obj-18`→`obj-20`→`obj-32`→`obj-33`→`obj-42` (root `lines`, 9536-10122).
   Severity: medium. Effort: medium. *Source: Task 3.*
6. **Clip transport routes intra-process commands over a real UDP loopback socket.** `clipcontrol.maxpat`
   sends every per-source command (`start`/`stop`/`rate`/`scrub`/`loop`/`in`/`out`/`pan`/`vol`/`cliptime`)
   as an OSC packet to `localhost:6666` instead of Max's internal `send`/`receive`, making a purely
   in-process dataflow depend on the OS network stack (port availability, firewall/loopback state) for
   no benefit. Location: `vpt8 source code/patchers/clipcontrol.maxpat` — `udpsend localhost 6666`
   (line 3355) fed by `sprintf /sources/%ivideo/%s` (line 3445); consumed by
   `osceditor-vpt7.maxpat` — `udpreceive 6666` (line 824). Severity: medium. Effort: medium.
   *Source: Task 5.*
7. **A layer "solo" control string is hardcoded independently in two files.** The exact message
   `";\rengine /layers/cornerpin/com enable $1"` drives per-layer solo in both `vpt7project.maxpat`'s
   root `p solo` and `layergui.maxpat`'s per-layer logic, with no shared abstraction — a future format
   edit in one desyncs the other. Location: `vpt8 source code/patchers/layergui.maxpat` — obj-56
   (line 261), obj-55 `sprintf /%ilayer/cornerpin/com enable 1` (line 245); compare
   `vpt8 source code/patchers/vpt7project.maxpat`'s `p solo`. Severity: low. Effort: low. *Source: Task 5.*
8. **`clipcontrol.maxpat` repeats an identical per-source subpatcher 8 times instead of parametrizing.**
   The same 6-box `sel 0 1`/`fgcolor` LED-highlight helper is copy-pasted once per video source,
   alongside 3 separate `route 1 2 3 4 5 6 7 8` fan-out objects. Location:
   `vpt8 source code/patchers/clipcontrol.maxpat` — the 8 `p` boxes (lines 96-1540) and `route` objects
   at 1569/1787/2046. Severity: low. Effort: medium. *Source: Task 5.*
9. **The two core source engines are near-verbatim duplicates.** `hapsource.maxpat` (10,351 lines) and
    `xfadesource.maxpat` (10,478 lines) copy-paste the entire clip-player/crossfade/OSC/pattr
    machinery, differing meaningfully only in the two `jit.movie @engine` attributes and umenu defaults;
    any behavioral fix must be mirrored across both (and `xfadestill.maxpat`). Location:
    `vpt8 source code/patchers/hapsource.maxpat` vs. `xfadesource.maxpat` (whole-file). Severity: medium.
    Effort: high. *Source: Task 6.*
10. **The source-slot reassignment logic is an 8-way copy-paste.** `sourcebank.maxpat` duplicates an
    identical `p reassign` subpatcher (`sel V H S M` + 4 `script sendbox … replace` messages) once per
    `videobankNN` slot, differing only in the hardcoded slot number; adding a 5th source type means
    editing all 8 in lockstep, and a mistyped slot number silently misroutes. Location:
    `vpt8 source code/patchers/sourcebank.maxpat` — 8 `p reassign` subpatchers (lines ~1009-2810);
    confirmed 8 `sel V H S M` and 32 `script sendbox … replace`. Severity: medium. Effort: medium.
    *Source: Task 7.*
11. **The preset module reaches its real storage engine only through terse, undocumented buses.**
    `presetmodule-vpt7.maxpat` and `preset_cellblock.maxpat` (which contain no pattrstorage/pattr of
    their own) drive `enginetab.maxpat`'s `pattrstorage vpt` exclusively via bus names `ps`, `toPS`,
    `ps_sources` and semicolon cross-object messages, with zero in-patcher comments — a typo in any bus
    name in any of the three files silently breaks preset recall. Location:
    `vpt8 source code/patchers/presetmodule-vpt7.maxpat` — `s ps` (lines 1037, 3070, 3145, 3225, 3360,
    3493), `r ps` (line 1137), `;\rtoPS clear` (line 702); cross-reference
    `vpt8 source code/patchers/enginetab.maxpat` — `pattrstorage vpt` (line 5065), `r toPS` (line 5036).
    Severity: medium. Effort: medium. *Source: Task 8.*
12. **A timer equality check relies on an uncommented asymmetric-sentinel trick.**
    `timermodule.maxpat`'s hour/minute match pairs `if $i1==$i2 then 1 else -1` with
    `if $i1==$i2 then 1 else 0` so a final `==` only ever fires on a true double-match — correct, but with
    no comment explaining why non-overlapping -1/0 sentinels were chosen; an unaware edit could
    reintroduce a false-positive alarm. Location: `vpt8 source code/patchers/timermodule.maxpat` —
    obj-96 (lines 331-343), obj-95 (lines 319-330), obj-82 `==` (lines 358-369). Severity: low.
    Effort: low. *Source: Task 8.*
13. **A cue-list help image embeds a stale VPT6-era developer-machine path.** The `p cuelist_help`
    `fpic` carries a hardcoded `"HCHD:/Users/hcg/Desktop/vpt6_images/vpt6_cuelist2.png"` from a
    two-versions-old asset (the image itself is base64-embedded so it still renders, but the path string
    is stale carryover). Location: `vpt8 source code/patchers/cuelist-vpt7.maxpat` — `p cuelist_help`
    `"pic"` (line 868). Severity: low. Effort: low. *Source: Task 8.*
14. **The "central router" is 100 hand-wired copies, not a generic dispatch table.**
    `ctrlrouter-vpt7_01.maxpat` + `ctrl_config-vpt7_01.maxpat` are 100 statically pre-declared,
    hand-wired copies of the same address-building chain (no `route`/`match`/`dict`/`coll` lookup);
    adding a 101st mapping requires hand-editing the JSON to add a bpatcher and re-plumb the bootstrap.
    Location: `vpt8 source code/patchers/ctrlrouter-vpt7_01.maxpat` — `varname:"midiconfig1"`
    (lines 2598-2616) through `"midiconfig100"` (lines 39-61). Severity: medium. Effort: high.
    *Source: Task 9.*
15. **The same sensor-normalization job is implemented twice, with drifted math.**
    `serial_VPT7.maxpat`'s inline `p sr` subpatch uses `/ 1024.` quantization and a 1-100 controller-id
    range, while the `sensorinput_module_vpt7.maxpat` bpatcher it also hosts six copies of uses
    `scale 0 1024 0. 1.` and a 1-50 range for the same logical field. Location:
    `vpt8 source code/patchers/serial_VPT7.maxpat` — `p sr` (lines 58-285), controller-nr box
    `min 1`/`max 100` (obj-69); vs. `sensorinput_module_vpt7.maxpat` — controller-nr box
    `min 1`/`max 50` (obj-37). Severity: medium. Effort: medium. *Source: Task 9.*
16. **The cross-cutting `to_router` and `ctrl_offset` buses assume exactly one LFO rack, unenforced.**
    Both are plain globally-scoped send/receive names with no bpatcher-argument namespacing, so
    correctness depends on there being exactly one `lforack-vpt7.maxpat` app-wide (true today, but
    nothing enforces it — a second instance would silently sum/overwrite `ctrl_offset` and interleave
    unrelated `to_router` traffic). Location: `vpt8 source code/patchers/lforack-vpt7.maxpat`
    (`s ctrl_offset`); `lfomodule-vpt7_01.maxpat` / `lfomix-vpt7_01.maxpat` (`s to_router`).
    Severity: medium. Effort: medium. *Source: Task 10.*
17. **LFO mixers have no `pattr` objects, so their settings are inconsistent with base LFOs for
    save/preset, and even base-LFO persistence is unconfirmed.** Only `lfomodule-vpt7_01.maxpat` wraps
    its parameters in `pattr` (`lfoon`/`lfowave`/…); `lfomix-vpt7_01.maxpat` has none for its
    source/blend/mix controls. Compounding this, none of the base LFO's `pattr` varnames appear in any
    of the three shipped `pattrstorage` snapshot dumps, so whether even base-LFO state persists across a
    session is unclear. Location: `vpt8 source code/patchers/lfomix-vpt7_01.maxpat` (no pattr, whole
    file); `vpt8 source code/data/gui.json`, `presets.json`, `sources.json` (no `lfo*` key).
    Severity: medium. Effort: medium (requires testing save/reload in Max). *Source: Task 10.*
18. **Two independently-maintained JSON dumps cross-reference by unenforced integer slot IDs, and the
    references are already broken.** `data/presets.json`'s 11 preset slots each link to a source slot via
    `"sources":[100N]`, but `data/sources.json` contains only 9 slots keyed `1,2,3,1006-1011`: presets
    1-3 reference `1001`-`1003` (an off-by-1000 mismatch against the bare `1`-`3` keys that exist), and
    presets 4-5 reference `1004`/`1005` which exist under no scheme — so recalling those presets
    references source state that is absent from the shipped snapshot, invisibly until recall fails.
    Location: `vpt8 source code/data/presets.json` (`"sources":[1001]`…`[1011]`, lines 9-549) vs.
    `vpt8 source code/data/sources.json` (top-level slot keys, lines 5-837). Severity: medium.
    Effort: low (to fix the data; the schema gap is architectural). *Sources: Tasks 8, 11.*
19. **The project manifest doesn't enumerate its own code/data/externals.** `vpt8.maxproj`'s
    `"contents"` declares empty `"code"`, `"data"`, and `"externals"` sub-objects despite 5 `code/*.js`,
    3 `data/*.json`, and 7 `externals/*.mxo` files existing and being actively loaded — so the manifest
    cannot serve as a source of truth for project dependencies (which are recoverable only by walking
    patchers' own imperfect `dependency_cache` or by filesystem enumeration). Location:
    `vpt8 source code/vpt8.maxproj` lines 30-40. Severity: low. Effort: low (regenerating from Max would
    likely fix it). *Source: Task 11.*

## hardcoded-limit

1. **OSC ports and a live-record destination path are hardcoded literals with no UI.** The OSC
   listen/send ports are literal object arguments (`udpreceive 6661`, `udpsend 127.0.0.1 6660`) with no
   preference to change them, and the live-record destination defaults to a machine-specific
   development path baked into a message box. Location: `vpt8 source code/patchers/vpt7project.maxpat` —
   line 3334, line 3297; `livemodule-vpt7.maxpat` — `"HCHD:/moovs/videomlyd/"` (line 774). Severity:
   medium. Effort: low. *Source: Task 1.*
2. **Reserved magic layer/GL indices are hardcoded and scattered.** Blackout layer id `99`,
   `layerorder 200` (forces it on top), and divider sketch `@layer 88` are hardcoded in several places
   and assume real layers never reach them. Location: `vpt8 source code/patchers/enginetab.maxpat` —
   `vlayer 99` (line ~697), `layerorder 200` (line ~619), `jit.gl.sketch vpt @layer 88` (line ~1238).
   Severity: medium. Effort: medium. *Source: Task 2.*
3. **A mesh-corner hit-test radius table lives in a plain comment, not code.** The lookup mapping mesh
   gridsize → grab radius (`"8:0.03\n12:0.04\n15:0.06\n20:0.07\n25 0.08"`) is a comment consumed by a
   nearby `expr`/`if` chain, so adding a new `mesh::gridsize` value silently falls outside the table
   with no defined radius. Location: `vpt8 source code/patchers/enginetab.maxpat` — comment at line
   20735 (corner-pin/mesh-warp region ~19106-22417). Severity: medium. Effort: low. *Source: Task 2.*
4. **The tile-count `umenu`s hardcode a fixed literal list of fraction pairs.** Adding a tile-count
   option requires manually editing the literal list (halves through fifths). Location:
   `vpt8 source code/patchers/vlayer.maxpat` — `p tile` `umenu` items at ~4911 (xtile) and ~4973
   (ytile). Severity: low. Effort: low. *Source: Task 3.*
5. **The blend-mode `umenu` encodes OpenGL blend-factor pairs as an opaque numeric list with no
   legend.** Items like `6,7 / 6,1 / 2,7` map to blend modes only implicitly, and `pattr blendmode
   @initial 6 7` bakes one such pair in as the default. Location:
   `vpt8 source code/patchers/vlayer.maxpat` — `umenu` hint `"blendmode"` (~line 3062),
   `pattr blendmode @initial 6 7` (line 8810). Severity: medium. Effort: low. *Source: Task 3.*
6. **A mask-source chooser has a hardcoded absolute Mac path that resolves on no other machine.**
   `activelayer.maxpat`'s mask-source `umenu` bakes
   `"HD:/Users/hcg/lab/vpt7-2017-osx-beta03/defaultproject2017/mask/"` (classic-Mac `HD:` syntax) into
   its `prefix`. Location: `vpt8 source code/patchers/activelayer.maxpat` — obj-106 `prefix` (~line 5959).
   Severity: medium. Effort: low. *Source: Task 4.*
7. **The two point-drag editors use fixed, non-parametrized canvas resolutions.** `gridcontroller.maxpat`
   uses a square `640x640` and `pointmask.maxpat` a `1024x768` (4:3) throughout its mgraphics/world/
   export matrix; neither adapts to a different project aspect ratio. Location:
   `vpt8 source code/patchers/gridcontroller.maxpat` (`jit.mgraphics 640 640`) vs.
   `pointmask.maxpat` (`jit.mgraphics 1024 768`, `jit.world mask @size 1024 768`, `jit.matrix 4 char
   1024 768`). Severity: low. Effort: medium. *Source: Task 4.*
8. **A layer's own blend-mode selector exposes only 3 of ~24 available modes.** `layergui.maxpat`'s
   per-layer blend `umenu` offers only 3 icon choices, while ~24 blend shaders exist and the source
   mixer one file over exposes 17 — two inconsistently-sized option sets for conceptually the same
   compositing operation. Location: `vpt8 source code/patchers/layergui.maxpat` — obj-50 (line 175),
   obj-116 (line 1048), obj-257 (line 515); compare `mix-vpt7.maxpat` obj-17 (line 911). Severity: low.
   Effort: medium. *Source: Task 5.*
9. **A still-image source's file browser has a hardcoded author-machine path.** `xfadestill.maxpat`'s
   `umenu` `prefix` points at `HD:/Users/hcg/lab/vpt7-2017-osx-beta03/defaultproject2017/video/`, so the
   folder-populate feature is broken out of the box on any other machine. Location:
   `vpt8 source code/patchers/xfadestill.maxpat` — obj-14 `prefix` (~line 4664). Severity: low.
   Effort: low. *Source: Task 7.*
10. **The cue list is fixed at 200 rows.** The `jit.cellblock` is `rows:200` with a matching `uzi 200`
    rebuild, so a cue list cannot exceed 200 lines without editing the patcher. Location:
    `vpt8 source code/patchers/cuelist-vpt7.maxpat` — `"rows":200` (line 7245), `uzi 200` (line 7052).
    Severity: low. Effort: medium. *Source: Task 8.*
11. **The preset grid is fixed at 11 rows.** `preset_cellblock.maxpat`'s `jit.cellblock` is `rows:11`,
    capping visibly-selectable presets at 11. Location:
    `vpt8 source code/patchers/preset_cellblock.maxpat` — obj-57 (line 163, `"rows":11`). Severity: low.
    Effort: low. *Source: Task 8.*
12. **Art-Net input truncates to the first 20 of 512 DMX channels with no spec-tied ceiling.** A
    `loadmess 20` into `zl slice 20` caps the default channel count at 20, with no comment linking it to
    the Art-Net/DMX spec and no enforced ceiling if raised. Location:
    `vpt8 source code/patchers/artnet-vpt.maxpat` — `loadmess 20` (line 48), `zl slice 20` (line 267).
    Severity: medium. Effort: low. *Source: Task 9.*
13. **The soft on-screen MIDI bank is a fixed grid of exactly 32 copy-pasted controls.** 16 sliders + 16
    buttons are individually authored as separately-positioned bpatcher boxes, not generated from a
    count, so extending it requires manual box-by-box editing. Location:
    `vpt8 source code/patchers/softmidi-vpt7_01.maxpat` — 32 `bpatcher` entries (args 1-16 sliders,
    17-32 buttons). Severity: low. Effort: medium. *Source: Task 9.*
14. **An LFO-mixer source menu offers 8 choices but only 6 can ever produce a value.** `lfomix`'s two
    "lfo sources" umenus list `off,1lfo,…,8lfo`, but only the 6 base LFOs send on a `#Nlfo` channel
    (mixer slots 7-10 never do), so selecting "7lfo"/"8lfo" silently receives nothing forever. Location:
    `vpt8 source code/patchers/lfomix-vpt7_01.maxpat` — umenu items (obj-39/obj-22). Severity: low.
    Effort: low. *Source: Task 10.*

## no-tests-ci

1. **There is no automated test or CI coverage anywhere in the project.** Consistent with a
   Max/MSP/Jitter codebase, no subsystem — app boot, prefs persistence, OSC networking, layer
   lifecycle, source slot-reassignment, Syphon enable/disable, `sources.json` round-trip, or any
   other — has any test harness; every behavior is verifiable only by opening the project in Max
   (7.3.5) and exercising the UI by hand. This is a project-wide condition, flagged concretely in the
   app-shell and secondary-source clusters but applicable to all 49 patchers, 5 scripts, and data files.
   Location: whole project — e.g. `vpt8 source code/patchers/vpt7project.maxpat` and `prefs.maxpat`
   (no harness); `vpt8 source code/patchers/sourcebank.maxpat` and the 5 secondary-source files (no
   harness). Severity: medium. Effort: high (would require a Max-side test harness that does not exist).
   *Sources: Tasks 1, 7.*

## licensing

1. **The project is CC BY-NC-SA 3.0 (non-commercial, share-alike), and one bundled third-party license
   covers no shipped code.** The whole VPT8 source tree is released under Creative Commons
   Attribution-NonCommercial-ShareAlike 3.0 Unported — incompatible with permissive-OSS (MIT/BSD/Apache)
   reuse or any commercial redistribution/fork. Within `shaders/`, `shared/licenses/3Dlabs-license.txt`
   legitimately covers the Randi Rost/3Dlabs GLSL brightness/contrast/saturation shaders actually used
   (`cc.brightness.ip.jxs`/`cc.contrast.ip.jxs`/`cc.saturate.ip.jxs`), but
   `shared/licenses/LightworkDesign-license.txt` covers no shipped code (no shader mentions
   "Lightwork") — a leftover attribution from a larger third-party shader collection. Location:
   `vpt8 source code/VPT8-sourcecode-readme.rtf`; `vpt8 source code/shaders/shared/licenses/3Dlabs-license.txt`;
   `vpt8 source code/shaders/shared/licenses/LightworkDesign-license.txt`. Severity: medium (terms
   materially restrict reuse). Effort: n/a (informational). *Source: Task 11.*
