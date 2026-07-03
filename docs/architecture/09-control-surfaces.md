# Control surfaces

## Purpose

This cluster covers every external-controller pathway into VPT: hardware MIDI plus an on-screen
"soft" MIDI-alike (`miditab-vpt7.maxpat`/`softmidi-vpt7_01.maxpat`/`softbutton-vpt7.maxpat`/
`softslider-vpt7.maxpat`), OSC over UDP (`osceditor-vpt7.maxpat`/`osc_active.maxpat`/
`osc_pass.maxpat`), serial/Arduino-style sensor input (`serial_VPT7.maxpat`/
`sensorinput_module_vpt7.maxpat`), and Art-Net/DMX (`artnet-vpt.maxpat`, via the Mac-only
`imp.artnet.node.mxo` external). All five input methods normalize to a `(value, id)` pair and
broadcast it on a single global `s to_router`, which is read by the three-file central dispatch hub
also in this cluster — `router-vpt7.maxpat` (window shell) hosting `ctrlrouter-vpt7_01.maxpat`
(a fixed bank of 100 mapping-row bpatchers) hosting `ctrl_config-vpt7_01.maxpat` (the per-row logic
that builds an OSC-style `/<destination><nr>/<parameter>` address string and fires it on `s ctrl`).
This confirms the task brief's hypothesis: the ctrlrouter/ctrl_config/router trio is the one place
where every controller type is mapped, by the end user, onto VPT's internal parameter-address
namespace — the same namespace consumed elsewhere in the app (e.g. `r ctrl` in `enginetab.maxpat`,
Tasks 2-3).

## Files in this cluster

- `vpt8 source code/patchers/miditab-vpt7.maxpat` (2392 lines)
- `vpt8 source code/patchers/softmidi-vpt7_01.maxpat` (932 lines)
- `vpt8 source code/patchers/softbutton-vpt7.maxpat` (685 lines)
- `vpt8 source code/patchers/softslider-vpt7.maxpat` (189 lines)
- `vpt8 source code/patchers/osceditor-vpt7.maxpat` (3180 lines)
- `vpt8 source code/patchers/osc_active.maxpat` (226 lines)
- `vpt8 source code/patchers/osc_pass.maxpat` (258 lines)
- `vpt8 source code/patchers/serial_VPT7.maxpat` (3082 lines)
- `vpt8 source code/patchers/sensorinput_module_vpt7.maxpat` (1252 lines)
- `vpt8 source code/patchers/artnet-vpt.maxpat` (570 lines)
- `vpt8 source code/patchers/ctrlrouter-vpt7_01.maxpat` (2820 lines)
- `vpt8 source code/patchers/ctrl_config-vpt7_01.maxpat` (2996 lines)
- `vpt8 source code/patchers/router-vpt7.maxpat` (1833 lines)

(All 13 line counts were confirmed exact via `wc -l`; total 20,415 lines, matching the task brief.)

## Key patchers & subpatchers

### MIDI (hardware + soft)

**`miditab-vpt7.maxpat`** is the "MIDI" tab of the main GUI. Two top-level static subpatchers:
`p softcontrol` (obj-49), which hosts a static bpatcher of `softmidi-vpt7_01.maxpat` (obj-4); and
`p midi` (obj-95), the hardware-MIDI side: `midiin a` (obj-105, line 1914, hardcoded single port
label `"a"`) → `midiparse` (obj-104, 8 outlets) → `unpack 0 0` chains, plus `midiinfo` (obj-33) and a
`umenu` varname `"mididevice"` with hardcoded placeholder items `["to Max 1", ",", "to Max 2"]`
(line 1433). A `tab` varname `"tab"` (`"tabs":["cc","channel","noteon"]`) is read by a `switch 3`
(obj-3, line 1505) — a magic-number coupling between the tab count and the switch argument with no
shared source of truth. No `ctlin`/`notein` objects exist; hardware MIDI is parsed only via
`midiin`+`midiparse`.

**`softmidi-vpt7_01.maxpat`** is a fixed grid of 32 on-screen soft controls: 16 static bpatcher
instances of `softslider-vpt7.maxpat` (args 1-16) and 16 static bpatcher instances of
`softbutton-vpt7.maxpat` (args 17-32) — individually hand-placed, copy-pasted boxes (confirmed:
32 `"maxclass":"bpatcher"` hits), not generated. A `textbutton` toggles button/toggle mode →
`s butmode`; `r lb` feeds a `ctrl_offset` (`prototypename":"vpt_int2"`) number box → `s soft_offset`.

**`softbutton-vpt7.maxpat`** and **`softslider-vpt7.maxpat`** are the reusable per-control templates
instantiated 16× each by `softmidi-vpt7_01.maxpat`. Each reads `r soft_offset` (adds its own `#1` arg
to get its control index) and `r butmode`/none respectively, packs `(index, value)`, and sends
`s to_router`. `softbutton-vpt7.maxpat` additionally has a static subpatcher `p setbuttontext`
(`r lb` → `tosymbol` → `prepend texton`/`prepend text`) that relabels the button with its own index
at load, and contains a stale hardcoded default label `"17"` (`"texton":"17"`/`"text":"17"`, lines
~527/529) baked into a template that is reused for indices 17-32.

### OSC

**`osceditor-vpt7.maxpat`** is the network transport + user-facing config UI for OSC: `udpreceive
6666` (obj-61, line 824) and `udpsend 127.0.0.1 6667` (obj-36, line 1725) are the actual sockets;
`route text`/`route port`/`route host`/`route set` (4 instances) plus `sprintf`/`pack`/`unpack`
chains rebuild the host/port config from user edits. It also embeds a self-contained, undocumented
**OSC script sequencer**: a Max `text` object backing a load/edit/save text file of line-based
messages, stepped via `counter`, auto-played via `metro 1000` (tempo number box, `minimum 30`) with a
3-way `umenu` (`up`,`down`,`up&down` — ping-pong) direction selector. A static subpatcher `p osc`
(obj-72) is a help/about popup containing the in-patch documentation of the OSC address grammar
(see Data flow). No `pattr`, `pattrstorage`, `js`, or bpatcher objects appear anywhere in this file.

**`osc_active.maxpat`** and **`osc_pass.maxpat`** are tiny reusable per-control abstractions (Max's
implicit patcher-as-object mechanism, not `bpatcher` boxes), instantiated by name with arguments from
at least `activelayer.maxpat`, `controltabs.maxpat`, `layergui.maxpat`, `vpt7project.maxpat` — e.g.
`osc_active fade`, `osc_active mesh`, `osc_active blendmode`, `osc_active brcosa` (1-arg, parameter
name only) and `osc_pass #1 fade` (2-arg: an explicit index plus parameter name; in `layergui.maxpat`
the `#1` is that file's own per-layer instantiation argument passed straight through). `osc_active`
sources its layer index from `r focus` (the currently-selected/focused layer), so it dynamically
retargets whichever layer the user has selected; `osc_pass` takes a fixed index as an instantiation
argument, for controls permanently bound to one physical layer. This "active vs. pass" distinction is
not documented in either patch — it is only recoverable by tracing patchcords.

### Serial / generic sensor

**`serial_VPT7.maxpat`** opens a serial port via `serial a 9600` (obj-22, line 2392, hardcoded
default port `"a"`/baud `9600`) inside a static subpatcher `p serial` (lines 302-1622), whose baud
umenu offers `1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200` (obj-25, line 2321) and whose port
umenu defaults to the hardcoded, macOS-only device list `OFF, Bluetooth-Incoming-Port` (obj-24, line
2279). Parsed lines are split by the "serial router" (comment obj-4, line 340) `route A B C D E F G
H I O` (obj-1, line 2548), an 11-outlet router: 9 letter-channels → `s ser1`...`s ser9` (lines
2406-2518), a 10th ("O") → `s osc_in` (line 657), plus a reject outlet. Six static bpatcher instances
of `sensorinput_module_vpt7.maxpat` (lines 1848-1972) provide per-channel UI for 6 of the 9 possible
letter-channels. A static subpatcher `p sr` (lines 58-285) independently re-implements the same
normalize/pack/send-to-router job as the bpatcher module (see Notable patterns), and a static
subpatcher `p workaround` (lines 346-582, `expr abs($i1-1)`/`zl compare OFF`/`gate`) patches over an
unexplained toggle-state-inversion quirk.

**`sensorinput_module_vpt7.maxpat`** is the reusable per-channel calibration module (bpatcher,
instantiated 6× above). It dynamically binds its own `receive` object at runtime via `sprintf set
ser%i` (obj-48, line 168) driven by a channel-select `umenu` (`--,A,B,C,D,E,F,G,H,I`) — i.e. the same
saved file is dropped in multiple times and wired to a different `serN` sender purely by UI choice,
with no per-copy code duplication (in contrast to `p sr` above). Raw values are split via `unpack 0
1024` (obj-23, line 265) and normalized via `scale 0 1024 0. 1.` (obj-22, line 789), assuming a 10-bit
ADC range. A digital/analog mode `umenu` plus three `gate 2 1` objects (lines 409, 454, 544)
implement trigger-vs-continuous behavior. Output is packed and sent via `pack 0. 1` (obj-1, line
370) → `s to_router` (obj-2, line 310).

### Art-Net/DMX

**`artnet-vpt.maxpat`** instantiates the third-party external with the literal object-box text
`imp.artnet.node @universe 1 @mode 2` (obj-1, line 412; confirmed by direct read). `attrui` boxes for
`net`/`subnet`/`universe`/`mode` write live attribute messages into that instance. A `loadmess 20`
(obj-33, line 48) sets a "active controllers" (comment obj-32, line 63) count via `zl slice 20`
(obj-5, line 267), truncating the incoming DMX list to the first 20 of a possible 512 channels — no
enforced ceiling exists in this patch. `listfunnel`→`swap`→`/ 255.`→`+ 1`→`pack 0. 0`→`s to_router`
(obj-35, line 200) republishes each channel as a normalized `(0.-1. value, 1-based channel id)` pair,
using the same `s to_router` name (but a slightly different `pack` argument order/arity) as the
serial and sensor-input files. The patch credits its own provenance in-patch: comment obj-19 (line
159), `"based on the imp.artnet objects by David Butler"`, plus a clickable logo/link to
`theimpersonalstereo.com` — this subsystem is a third-party contribution, not HC Gilje's own code.

### Central dispatch hub

**`router-vpt7.maxpat`** is the top-level window shell: its own window-management `thispatcher`
(obj-68), a `pattrstorage router @autorestore 0` (obj-352) bound to a `preset` object
(`"pattrstorage":"router"`, obj-31) for saving/recalling whole "router setups" to `router.json`
(`sprintf symout %srouter.json`, obj-287), and a static help subpatcher `p router` containing tooltip
comments that describe the addressing scheme in prose (see Data flow) plus a worked example message
box `"/layer2/pos_x 0.551181"` (obj-29, line 1373; confirmed by direct read). It instantiates
`ctrlrouter-vpt7_01.maxpat` as a single bpatcher (obj-35, varname `"ctrlrouter01"`, line 929).

**`ctrlrouter-vpt7_01.maxpat`** is a pure hosting/administration container with no routing logic of
its own: its boxes array is (aside from ~15 utility objects) exactly 100 static bpatcher
instantiations of `ctrl_config-vpt7_01.maxpat`, `args:[1]`...`args:[100]`, `varname:"midiconfig1"`
...`"midiconfig100"` — one bpatcher per mapping row, all 100 pre-declared in the saved JSON. A
`counter`/`metro`/`toggle`/`thispatcher`-script mechanism (`sprintf script sendbox midiconfig%d args
%d`, obj-25, line 1318; `sprintf script sendbox midiconfig%d replace %s`, obj-21, line 1436, paired
with a `dropfile` box, obj-17) lets the UI reprogram an existing row's `args` or replace its content
by dragging a file onto it, but it does not create or destroy boxes — the 100-row ceiling is fixed at
save time.

**`ctrl_config-vpt7_01.maxpat`** is the actual per-row mapping logic (one instance = one
controller-to-parameter binding). Each row filters the global `router_osc` broadcast (`r router_osc`,
obj-8, line 324) through its own `OSC-route /a` instance (obj-19, line 288, its per-row index set at
load via `t #1` + `delay 4000`), and separately listens on the global `r to_router` (obj-35, line
2154) for raw controller values. A `umenu` **"destination"** (obj-36, items `OFF, layer, video, lfo,
cam, serial, vpt`), a `number` **"destination_nr"** (obj-37), and a dynamically-repopulated `umenu`
**"parameter"** (obj-13) let the user pick a target; a static subpatcher `p parameters` (obj-132,
lines 543-2037) contains a `sel 0 1 2 ... 10` dispatcher (line 961) that emits, per destination
category, the curated legal parameter-token list for that category (see Data flow) on a per-instance
`s #1param_out`. The final address string is built by `sprintf /%s/%s \$1` (obj-18, line 2377) and
fired on `s ctrl` (obj-4, line 2236) — confirmed received elsewhere in the app by `r ctrl` in
`enginetab.maxpat` (line 9640), tying this cluster directly to the layer engine documented in Tasks
2-3.

## Data flow

**Shared raw-value bus** — every hardware/soft/sensor/DMX input source normalizes to a `(value,
index)` pair and sends it on the single literal name:
- `s to_router` — sent from `miditab-vpt7.maxpat` (line 1519, fed by a `zl rev`), `softbutton-
  vpt7.maxpat`, `softslider-vpt7.maxpat`, `serial_VPT7.maxpat`'s `p sr` subpatch (line 159),
  `sensorinput_module_vpt7.maxpat` (line 310), and `artnet-vpt.maxpat` (line 200). Received by
  `ctrl_config-vpt7_01.maxpat` (`r to_router`, line 2154).

**OSC network bus** — literal message strings found in `osceditor-vpt7.maxpat`: `/test 0`, `/test
three`, `/test $1`, `/transitiondone bang`, `/cuetrig bang`, `/preset $1`, `/cue $1`, `/out1 2`; the
in-patch help text (obj-11, line 319) states verbatim: *"OSC is also the basis of internal messages
in VPT, the control router is based on mapping different external or internal controllers to
different OSC messages"*, with worked examples `/layer1/fade 1.` and `/layer5/avig/y .7` (both inside
the `p osc` help subpatch). `osc_active.maxpat`/`osc_pass.maxpat` both build a runtime address via
the identical object `sprintf set /%ilayer/%s` piped into a bare, dynamically-reconfigured `prepend`
(pattern: `/<N>layer/<name>`), then broadcast on `s engine` (received by `r engine` in
`vpt7project.maxpat`) — a second, GUI-facing internal control bus distinct from `to_router`/`ctrl`.
Hardcoded UDP ports: **6666** receive (`udpreceive 6666`, plus a UI label and help text both stating
"6666"), **6667** send (`udpsend 127.0.0.1 6667`, repeated as a literal in 4 separate places: lines
1073, 1446, 1543, 1725).

**Central parameter-address namespace** — built inside `ctrl_config-vpt7_01.maxpat` and confirmed by
the literal worked example on the canvas of `router-vpt7.maxpat` (line 1373):
```
/layer2/pos_x 0.551181
```
Grammar: **`/<destination-category><destination-nr>/<parameter-token> <value>`** — an OSC-path-style
two-segment address (target-object name = category + 1-based index, then the specific parameter),
followed by the value as a separate trailing atom (not embedded as an OSC-typed argument). Built by
concatenating the `destination` umenu value + `destination_nr` number via `sprintf %i%s`/`gate 2 1`
(fixed literals `OFF`/`vpt` for the two non-indexed categories), then combined with the chosen
`parameter` token via `sprintf /%s/%s \$1` (obj-18, line 2377), and fired on `s ctrl`. One category
("cam"/sources) breaks the grammar: `sprintf sources/%s` (obj-10, line 384) produces a bare
`sources/N` token with no leading slash, unlike every other category.

Literal parameter-token namespace, by destination category (from the `p parameters` subpatcher of
`ctrl_config-vpt7_01.maxpat`):
- **layers**: `fade, red, green, blue, flip/on, tile/on, zoom/on, zoom/xzoom, zoom/yzoom, zoom/rota,
  blur/on, blur/blur, mblur/on, mblur/mblur, brcosa/on, brcosa/brightness, brcosa/contrast,
  brcosa/saturation, edgeblend/on, edgeblend/up, edgeblend/down, edgeblend/right, edgeblend/left`
- **video**: `rate, trig, in, out, scrub, loopreset, start, stop, random, clipnr, last, vol, xfade,
  mix`
- **lfos**: `speed, phase, val, range, lfomix`
- **live rec**: `source, rec, recdest`
- **buffer**: `fill, play, frame, speed, dir, range, source`
- **text**: `size, posx, posy, rotx, roty, rotz, fade, red, green, blue, layer, next, line,
  linetempo`
- **fx**: `blurlevel, mblurlevel, br, co, sa, scale_r, scale_g, scale_b, bias_r, bias_g, bias_b,
  param1...param10`
- **noise**: `dimx, dimy, speed`
- **osc-out**: `out1...out8, next, line`
- **sound out**: `1amp...8amp`
- **serial out**: `s1...s8`
- **preset-sequence**: `preset, cue, blackout, store0, cuenext, cueprev, presetnext, presetprev,
  checklist, layerinc, layerdec`
- **dmx**: literal channel numbers `1...32`
- **adjust**: `posx_up, posx_down, posy_up, posy_down, scalex_up, scalex_down, scaley_up,
  scaley_down, x1_up, x1_down, ... y3_up, y3_down, y4_up, y4_down` (corner-pin warp increments)
- **"vpt"**: `preset, cue, source, store0, cuenext, cueprev, presetnext, presetprev, sourcenext,
  sourceprev, blackout, masterfade`
- **"mixers"**: `mix`

**Other confirmed send/receive names**: `router_osc` (global OSC-style broadcast filtered per-row by
`OSC-route`); `routerdest_global` (r, syncs a globally-selected destination context across rows);
`router-reset` (`s` from `router-vpt7.maxpat` line 47, `r` in `ctrl_config-vpt7_01.maxpat` line 219,
resets each row's state); `f_ctrlpreset`/`t_ctrlpreset` (controller-preset load/save triggers, also
referenced in `prefs.maxpat`/`cuelist-vpt7.maxpat`); `prefsave` (s, fires on router-preset selection);
`presetspath` (r, supplies the preset-folder path for `router.json` I/O); `midi_close` (s, on window
close); `lb` (a project-wide loadbang-relay convention, `r lb` present in nearly every file in this
cluster). MIDI/soft-control side: `s fmidiselect`/`r tmidiselect`, `s fmididevice`/`r tmididevice`,
`s midibutmode`/`r midibutmode`, `s midi_offset`/`r midi_offset` (hardware side) parallel to
`s soft_offset`/`r soft_offset`, `s butmode`/`r butmode` (soft-UI side). Serial/sensor side:
`s ser1`...`s ser9` (per-letter-channel), `s osc_in` (channel "O"), `s serialin`/`r serialin`,
`r serialout`.

**pattr/pattrstorage/autopattr bindings**: `ctrl_config-vpt7_01.maxpat` has an `autopattr` (obj-12)
with an explicit `"restore"` dict binding `destination, destination_nr, max, min, parameter,
vptcontroller` (the row's own varnames). `router-vpt7.maxpat` has `pattrstorage router
@autorestore 0` (obj-352) bound to a `preset` object, persisting whole router setups to
`router.json`. `miditab-vpt7.maxpat` binds `ctrl_offset` (`prototypename":"vpt_int2"`), `mididevice`,
`tab`, `velocity`, `midinote`, `value`, `cc`, `midichannel` as pattr varnames (no pattrstorage object
in that file itself). No `pattr`/`pattrstorage`/`autopattr` objects appear in the OSC-editor,
serial, sensor-input, or Art-Net files.

## Dependencies

- **`OSC-route.mxo`** (referenced but not bundled — a missing/unresolved dependency, per Task 1's
  finding; the repo's `vpt8 source code/externals/` directory contains only 7 items, and
  `OSC-route.mxo` is not one of them) — `dependency_cache` entry in `ctrl_config-vpt7_01.maxpat`
  (line 2989); instantiated by the object-box text `OSC-route /a` (obj-19, line 294).
- **`o.route.mxo`** (a different Mac-only external) — `dependency_cache` entry in `router-vpt7.maxpat`
  (line 1826), but **no object box in that file actually instantiates it** — a stale/orphaned
  dependency reference (see Tech-debt).
- **`imp.artnet.node.mxo`** (Mac-only external) — instantiated by `imp.artnet.node @universe 1 @mode
  2` (`artnet-vpt.maxpat` line 412; confirmed by direct read); `dependency_cache` entry `"name" :
  "imp.artnet.node.mxo", "type" : "iLaX"` (line 563). Filesystem confirms only a `.mxo` bundle exists
  under `vpt8 source code/externals/imp.artnet.node.mxo/Contents/MacOS/imp.artnet.node` — no
  `.mxe`/`.mxe64` (Windows external) counterpart exists anywhere in the repo, so Art-Net/DMX input is
  unavailable on Windows.
- No `code/*.js` or `shaders/*.jxs` references appear anywhere in this cluster's 13 files.
- Stale absolute developer-machine paths baked into saved JSON (harmless at runtime since the
  matching images are embedded, but confirm the files were carried over from the original authors'
  machines unmodified): `router-vpt7.maxpat` line 271, `"pic":"HDSN:/Users/hcg/lab/vpt2012lab/
  screenshots/vpt7_router.png"` (HC Gilje's own Mac); `artnet-vpt.maxpat` line 139, `"pic":
  "Macintosh HD:/Users/David/Projects/DMaX 2/Graphics/ImpLogo.png"` (the third-party Art-Net
  contributor's Mac); `miditab-vpt7.maxpat`, `"pic":"HCHD:/Users/hcg/Desktop/vpt6_images/
  vpt6_midi.png"` (HC Gilje's Mac, referencing still-older "vpt6" assets); `serial_VPT7.maxpat`
  `dependency_cache` `"bootpath":"~/Documents/Max 7/Projects/vpt7-2017-140417/patchers"` (also
  present in `router-vpt7.maxpat`'s own `dependency_cache`, lines 1813/1820).

## Notable patterns

- **One convention, five independent implementations.** All five input methods (hardware MIDI, soft
  MIDI, serial, generic sensor, Art-Net) converge on the identical `s to_router` name using a
  `(value, index)`-pair shape, but each was hand-written separately: the `pack` argument order/arity
  differs between files (`pack 0. 1` in serial/sensor vs. `pack 0. 0` in Art-Net), and there is no
  shared abstraction/template — convergent design intent, divergent implementation.
- **Two unrelated OSC-address-matching externals for one job, and only one is actually present**:
  `OSC-route.mxo` in `ctrl_config-vpt7_01.maxpat` (referenced by dependency_cache but missing from
  `externals/` entirely) vs. `o.route.mxo` in `router-vpt7.maxpat` (bundled, but orphaned — no
  object in that file actually uses it).
- **Two parallel internal control buses**: `to_router`/`ctrl` (fed by external controller hardware,
  routed through the ctrlrouter/ctrl_config mapping UI) vs. `engine` (fed by `osc_active`/`osc_pass`,
  used pervasively by the GUI's own on-screen controls) — both ultimately address layers with a
  similar-looking `/layerN/param` string grammar, but via two structurally distinct paths.
- **Dynamic runtime rebinding, twice, two different ways**: `sensorinput_module_vpt7.maxpat` rebinds
  its own `receive` name via a `sprintf set ser%i` message (clean, no duplication across its 6
  instances); `ctrlrouter-vpt7_01.maxpat` instead uses `thispatcher` "script" messages
  (`sprintf script sendbox midiconfig%d args %d` / `... replace %s`) to reprogram statically
  pre-declared bpatcher boxes, including an unusual `dropfile`-driven "drag a file onto this row to
  replace its content" hook.
- **Not a generic dispatch table.** The "central router" is 100 parallel hand-wired copies of the
  same `sprintf`/`zl reg`/`gate` chain, not a `route`/`match`/`dict`/`coll`-based lookup (confirmed:
  zero such objects found in `ctrlrouter-vpt7_01.maxpat` or `ctrl_config-vpt7_01.maxpat`, aside from
  unrelated Max window-management `route` calls in `router-vpt7.maxpat`). Building an address string
  and firing it on `s ctrl` is the entire "routing" logic; the fan-in of that string into a specific
  per-layer receiver happens outside this cluster (confirmed via `r ctrl` in `enginetab.maxpat`,
  Tasks 2-3), so this cluster documents the address-construction half of the pipeline, not the final
  dispatch-to-receiver half.
- **VPT7-era naming throughout.** All 13 files in this cluster retain `vpt7` in their filenames
  (`miditab-vpt7`, `softmidi-vpt7_01`, `softbutton-vpt7`, `softslider-vpt7`, `osceditor-vpt7`,
  `serial_VPT7`, `sensorinput_module_vpt7`, `ctrlrouter-vpt7_01`, `ctrl_config-vpt7_01`,
  `router-vpt7`) despite living in the VPT8 tree — consistent with the versioning pattern already
  documented in earlier tasks, and further compounded here by a "vpt6"-era image reference inside
  `miditab-vpt7.maxpat`.
- **Duplicate sensor-normalization logic.** `serial_VPT7.maxpat`'s static `p sr` subpatch (lines
  58-285) reimplements — with different quantization math (`/1024.` vs. the bpatcher module's
  `scale 0 1024 0. 1.`) and a different controller-id range cap — the same job as the
  `sensorinput_module_vpt7.maxpat` bpatchers it also hosts six copies of.
- **Undocumented but functional: an OSC script sequencer inside `osceditor-vpt7.maxpat`.** A
  self-contained, working feature (not dead code — confirmed wired) lives alongside the file's OSC
  transport/config UI: a Max `text` object backing a load/edit/save text file of line-based messages,
  stepped via `counter`, auto-played via `metro 1000` (tempo number box, `minimum 30`) with a 3-way
  `umenu` (`up`, `down`, `up&down` — ping-pong) direction selector (roughly lines 1729-2242). It is not
  mentioned anywhere in the file's own help-popup comments (`p osc`, obj-72), so its existence is only
  recoverable by reading the patch directly.

## Tech-debt findings

1. **[architectural-fragility]** The "central router" (`ctrlrouter-vpt7_01.maxpat` +
   `ctrl_config-vpt7_01.maxpat`) is not a generic dispatch table but 100 statically pre-declared,
   hand-wired copies of the same address-building chain — adding a 101st controller mapping requires
   hand-editing the `.maxpat` JSON to add another bpatcher box and re-plumb the `counter`/
   `thispatcher`-script bootstrap. Location: `vpt8 source code/patchers/ctrlrouter-vpt7_01.maxpat` —
   bpatcher instances `varname:"midiconfig1"` (lines 2598-2616) through `varname:"midiconfig100"`
   (lines 39-61). Severity: medium. Effort: high.

2. **[platform-gap]** Art-Net/DMX input depends on `imp.artnet.node.mxo`, a Mac-only external with no
   Windows (`.mxe64`) build anywhere in the repo, even though VPT8 ships for both Mac and Windows.
   Location: `vpt8 source code/patchers/artnet-vpt.maxpat` — object text `imp.artnet.node @universe 1
   @mode 2` (line 412) and `dependency_cache` entry `"name" : "imp.artnet.node.mxo"` (line 563).
   Severity: high. Effort: high (would require sourcing/building a Windows Art-Net external).

3. **[closed-dependency]** OSC-address matching depends on two different closed, third-party
   externals for conceptually the same job, and neither is in a fully healthy state: `OSC-route.mxo`
   (used by `ctrl_config-vpt7_01.maxpat`) is referenced in that file's `dependency_cache` but is not
   actually bundled anywhere under `vpt8 source code/externals/` — a missing/unresolved dependency,
   per Task 1's cross-cluster finding — while `o.route.mxo` (declared as a dependency of
   `router-vpt7.maxpat`) is genuinely bundled (Mac-only) but orphaned/unused in that file (see
   finding 4 below). Location: `vpt8 source code/patchers/ctrl_config-vpt7_01.maxpat:2989`
   (`OSC-route.mxo`) and `vpt8 source code/patchers/router-vpt7.maxpat:1826` (`o.route.mxo`).
   Severity: high. Effort: high.

4. **[dead-code]** `router-vpt7.maxpat`'s `dependency_cache` lists `o.route.mxo` as a dependency, but
   no object box anywhere in the file's `boxes` array instantiates an `o.route` object — a stale,
   orphaned dependency reference (or the external is genuinely unused and the reference should have
   been removed). Location: `vpt8 source code/patchers/router-vpt7.maxpat` — `dependency_cache` entry
   at lines 1825-1828, no matching `o.route` object box found by search. Severity: low. Effort: low.

5. **[hardcoded-limit]** Art-Net input truncates to the first 20 of a possible 512 DMX channels by
   default, via a `loadmess 20` into `zl slice 20`, with no comment tying the number to the Art-Net/
   DMX spec and no enforced ceiling if a user raises it. Location:
   `vpt8 source code/patchers/artnet-vpt.maxpat` — `loadmess 20` (line 48), `zl slice 20` (line 267),
   "active controllers" comment (line 63). Severity: medium. Effort: low.

6. **[architectural-fragility]** Duplicate, drifted implementations of the same sensor-normalization
   responsibility: `serial_VPT7.maxpat`'s inline `p sr` subpatch uses `/ 1024.` quantization and (via
   its sibling `serial_VPT7.maxpat` number box) a 1-100 controller-id range, while the
   `sensorinput_module_vpt7.maxpat` bpatcher it also hosts six copies of uses `scale 0 1024 0. 1.`
   quantization and a 1-50 controller-id range for the same logical field. Location:
   `vpt8 source code/patchers/serial_VPT7.maxpat` — `p sr` subpatch (lines 58-285), controller-nr
   number box `minimum 1`/`maximum 100` (obj-69, lines 733-734); vs.
   `vpt8 source code/patchers/sensorinput_module_vpt7.maxpat` — controller-nr number box `minimum 1`/
   `maximum 50` (obj-37, lines 221-222). Severity: medium. Effort: medium.

7. **[naming-inconsistency]** All 13 files in this cluster retain `vpt7`/`VPT7` in their filenames
   despite living in the VPT8 source tree, and `miditab-vpt7.maxpat` additionally references
   still-older "vpt6" image assets. Location: filenames themselves (e.g.
   `vpt8 source code/patchers/miditab-vpt7.maxpat`); `vpt6` image path at `miditab-vpt7.maxpat` —
   `"pic":"HCHD:/Users/hcg/Desktop/vpt6_images/vpt6_midi.png"`. Severity: low. Effort: low.

8. **[hardcoded-limit]** The soft on-screen MIDI control bank is a fixed grid of exactly 32 controls
   (16 sliders + 16 buttons), individually authored as separately positioned, copy-pasted bpatcher
   boxes rather than generated from a count — extending it requires manual box-by-box editing.
   Location: `vpt8 source code/patchers/softmidi-vpt7_01.maxpat` — 32 `"maxclass":"bpatcher"` box
   entries (bpatcher args 1-16 for `softslider-vpt7.maxpat`, 17-32 for `softbutton-vpt7.maxpat`).
   Severity: low. Effort: medium.

9. **[toolchain-version]** A serial-port `dependency_cache` entry bakes in the original developer's
   machine-specific, dated project path from the VPT7 authoring environment, unrelated to the VPT8
   tree it now ships inside. Location: `vpt8 source code/patchers/serial_VPT7.maxpat:3073` —
   `"bootpath" : "~/Documents/Max 7/Projects/vpt7-2017-140417/patchers"` (also present in
   `vpt8 source code/patchers/router-vpt7.maxpat`, lines 1813/1820). Severity: low. Effort: low.

10. **[platform-gap]** The default serial-port selection list is macOS-specific
    (`OFF, Bluetooth-Incoming-Port`), with no Windows COM-port equivalent present, even though serial
    input itself uses Max's cross-platform `serial` object. Location:
    `vpt8 source code/patchers/serial_VPT7.maxpat:2279` — `umenu` items
    `"OFF", "Bluetooth-Incoming-Port"`. Severity: low. Effort: low.

11. **[naming-inconsistency]** The address-string grammar built by `ctrl_config-vpt7_01.maxpat` is
    inconsistent within the same file: most destination categories build a `/<name><nr>/<param>`
    slash-prefixed path, but the "cam"/sources category builds a bare `sources/N` token with no
    leading slash. Location: `vpt8 source code/patchers/ctrl_config-vpt7_01.maxpat:384` (`sprintf
    sources/%s`) vs. `ctrl_config-vpt7_01.maxpat:2377` (`sprintf /%s/%s \$1`). Severity: low.
    Effort: low.

12. **[dead-code]** `serial_VPT7.maxpat` contains three debug `print` objects, but only one is
    actually wired: the bare `print` (obj-63, line 1692) has a genuine incoming patchline (from a
    `t 0 b` (obj-55) → `"serialport ready"` message box (obj-65, line 1678), fed by the serial-port
    connection logic), so it does fire live during normal operation, printing serial-port-open status
    to the Max console — this one is not dead code. `print serialO` (obj-79, line 625) and
    `print serialin` (obj-74, line 671), by contrast, have zero patchline references anywhere in the
    file (confirmed by searching for both object IDs as source and destination across the entire
    `"lines"` patchcord array) — these two are genuinely unwired, dead debug instrumentation. Location:
    `vpt8 source code/patchers/serial_VPT7.maxpat` — `print` (obj-63, line 1692, wired); `print
    serialO` (obj-79, line 625, unwired); `print serialin` (obj-74, line 671, unwired). Severity: low.
    Effort: low.
