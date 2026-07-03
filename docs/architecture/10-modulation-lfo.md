# Modulation (LFOs)

## Purpose
This cluster implements VPT8's LFO (low-frequency oscillator) subsystem: a bank of 6 independent
oscillators (selectable sine/ramp/triangle/square waveforms, tempo-synced or free-running) plus 4
"mixer" units that cross-fade or multiply pairs of those oscillators' outputs. Both oscillator and
mixer are reusable bpatchers instantiated together as a fixed 10-slot "rack". Each slot's live,
range-scaled value is broadcast on a single shared cross-cutting bus (`to_router`), tagged with a
global "VPT controller" index, so any of the app's other addressable parameters (bound elsewhere
through per-slot `ctrl_config-vpt7_01.maxpat` instances) can be driven by an oscillating value
instead of manual/MIDI/OSC/serial input.

## Files in this cluster
- `vpt8 source code/patchers/lfomodule-vpt7_01.maxpat` (3257 lines)
- `vpt8 source code/patchers/lfomix-vpt7_01.maxpat` (1818 lines)
- `vpt8 source code/patchers/lforack-vpt7.maxpat` (1692 lines)

## Key patchers & subpatchers

### `lforack-vpt7.maxpat` (the rack container)
- Instantiates 6x bpatcher `lfomodule-vpt7_01.maxpat` with creation args `1`-`6` (varnames
  `lfo1`..`lfo6`, ids `obj-19`, `obj-22`, `obj-26`, `obj-24`, `obj-20`, `obj-21`).
- Instantiates 4x bpatcher `lfomix-vpt7_01.maxpat` with creation args `7`-`10` (varnames
  `lfomix1`..`lfomix4`, ids `obj-27`, `obj-30`, `obj-31`, `obj-32`).
  An in-patch comment (`obj-62`) states this explicitly: "LFO 1-6 are normal LFOs, LFO 7-10 are LFO
  mixers: They combine two waveforms".
- `ctrl_offset` number box (`obj-194`, varname `ctrl_offset`, `prototypename: "vpt_int2"`) ->
  `s ctrl_offset` — a single shared integer offset applied to every LFO/mixer's own slot number.
- `loadbang` (`obj-23`) -> `s lfob` — a one-time load-time bang consumed by every child bpatcher's
  internal `p setbuttontext` subpatcher to redraw its on/off button and waveform-menu label.
- A design-time convenience block: `dropfile` (`obj-44`) + `metro 100`/`counter 7` (`obj-29`/`obj-16`)
  + `sprintf script sendbox lfo%d replace %s` (`obj-17`), gated by a `toggle` (`obj-28`). It iterates
  ctrl-index positions 1-7 and, on a file drop, uses Max's `thispatcher` scripting (`s sendbox ...
  replace ...`) to hot-swap a numbered box's saved content. This is an editor/maintenance utility, not
  part of the runtime signal chain.
- Internal subpatcher `p lfo` (`obj-45`) is a static help/annotation panel: embedded `fpic` images
  (base64, ids `obj-9`/`obj-4`/`obj-5`) and many `hidden:1` `button` placeholders illustrating the
  wave-monitor's mouse gestures (documented via long `comment` boxes, e.g. `obj-26`, `obj-61`,
  `obj-22`). This subpatcher's own saved metadata is `"revision":4,"architecture":"x86"` — see
  tech-debt finding 4.
- `lforack-vpt7.maxpat` itself is instantiated exactly once app-wide: inside `controltabs.maxpat`
  (`obj-12`, varname `router-vpt7[7]`, patching_rect `[372.0, 41.0, 128.0, 128.0]`), which is in turn
  reachable from the main patcher `vpt7project.maxpat` (which lists `lforack-vpt7.maxpat` only in its
  `dependency_cache`, confirming it is a transitive, not direct, dependency).

### `lfomodule-vpt7_01.maxpat` (one instance = one base LFO; `#1` = its own slot number, 1-6)
- `r #1lfo_osc` -> `OSC-route /speed /phase /val /range /lfomix /on /wave /waveinv` (`obj-45`/`obj-44`)
  — a per-instance OSC control surface (e.g. instance 3 listens on `3lfo_osc`).
- 7 `pattr` objects, all `"parameter_enable":0`: `lfoon` (`obj-43`), `lfowave` (`obj-42`),
  `lfownormal` (`obj-41`), `lfospeed` (`obj-40`), `lfophase` (`obj-39`), `lfoval` (`obj-38`),
  `lforange` (`obj-37`).
- `p phasor_speed` (`obj-4`): chooses between a manual frequency and an ITM (Ableton-style
  interval/tempo-synced) note-value rate via a `translate notevalues hz` lookup and a
  `selector~ 2 2`, driving a `phasor~`.
- `p wave_select` (`obj-60`): shapes the raw phasor~ ramp into sine (`cos~`), ramp (raw phasor,
  `*~ 2.`/`-~ 0.5` centered), triangle (`triangle~ 0.5`), or square (`clip~ -1. 1.` of a scaled
  triangle, flagged in a comment as an "Exciting secret Max trick for creating squarewave output!"),
  with normal/inverted output (`*~ -1.`) and an `edge~`-based trigger-at-waveform-start outlet.
- `p pan_zoom` (`obj-18`): maps a 0-127 "range" control input to the actual output-range pair used
  downstream.
- `ui_moveon` `textbutton` (`obj-59`, `"texton":"#1"` — i.e. it displays its own slot number when
  engaged) gates the LFO's current value onto the two outbound sends (see Data flow).

### `lfomix-vpt7_01.maxpat` (one instance = one mixer; `#1` = its own slot number, 7-10)
- `r #1lfo_osc` -> `OSC-route /speed /phase /val /range /lfomix /on /wave /waveinv /1source /2source
  /blend` (`obj-45`/`obj-7`) — 3 extra OSC addresses vs. the base module (`/1source`, `/2source`,
  `/blend`).
- Two "lfo sources" `umenu`s (`obj-39`, `obj-22`; hint "lfo sources"; items
  `off,1lfo,2lfo,3lfo,4lfo,5lfo,6lfo,7lfo,8lfo`) each pick one base-LFO channel to pull from, via
  dynamically-retargeted `receive` objects (see Data flow).
- "add or multiply" `umenu` (`obj-19`; items `+`, `*`) selects the blend mode; `expr $f1*(1-$f2)`
  (`obj-53`) and `expr $f1*$f2` (`obj-58`) implement a linear crossfade weighted by the `lfomix`
  slider/OSC value in add mode, while a plain `* 1.` (`obj-63`) implements the multiply mode; `gate 2
  1` pairs (`obj-42`, `obj-43`) route each source into whichever branch is active.
- `p pan_zoom` (`obj-26`), a `multislider` waveform display (`obj-28`), and a `ui_moveon` textbutton
  gate (`obj-59`) — the same wiring pattern as `lfomodule-vpt7_01.maxpat`.
- No `pattr` objects exist anywhere in this file — see tech-debt finding 3.

## Data flow
- **OSC in** (per-instance namespace): `r #1lfo_osc` -> `OSC-route /speed /phase /val /range /lfomix
  /on /wave /waveinv[ /1source /2source /blend]`. `#1` is substituted with the bpatcher's
  instantiation number at load time (e.g. `r 3lfo_osc` for slot 3).
- **pattr** (base LFO only, literal varnames = object text): `lfoon`, `lfowave`, `lfownormal`,
  `lfospeed`, `lfophase`, `lfoval`, `lforange`.
- **Load-time redraw sync**: `s lfob` / `r lfob`, used by both cluster patchers' `p setbuttontext`
  subpatcher (`prepend texton`/`prepend text`) to restore each on/off button's and waveform-menu's
  displayed text after a patch load.
- **Cross-instance LFO-value bus** (feeds the mixers): each base LFO instance sends its gated,
  range-scaled value on `s #1lfo` (i.e. literally `s 1lfo` .. `s 6lfo`). A mixer's "lfo sources"
  `umenu` outputs the chosen item's text (`1lfo`.."8lfo") through `prepend set` into a `receive`
  object created with **no** fixed name; the `set <name>` message dynamically re-subscribes that
  `receive` to whichever channel is currently selected (e.g. selecting "3lfo" makes the `receive`
  behave as `r 3lfo`).
- **Global slot offset**: `s ctrl_offset` / `r ctrl_offset` — a single number box in
  `lforack-vpt7.maxpat`, read by every LFO and mixer instance and added (`+ #1`) to its own
  instantiation number, producing a global "VPT controller" index for that instance.
- **The addressing scheme (the cross-cutting mechanism)**: every LFO/mixer instance packs
  `[currentValue, ctrl_offset + ownSlotNumber]` (`pack 0. #1`, whose 2nd element is overridden by
  the `ctrl_offset+#1` computation on its cold inlet) and, only while its `ui_moveon` textbutton is
  toggled on, sends that pair to the single shared channel `s to_router`.
  `to_router` is consumed (confirmed via repo-wide grep) by 12 patchers total, including
  `ctrl_config-vpt7_01.maxpat`, which has `r to_router` (line 2154) and is itself instantiated once
  per addressable "VPT controller" slot (its own `#1` = that slot's index). It filters the incoming
  `[value, index]` pair with a `zl slice 1` / `sel 0` comparison chain against its own index before
  applying the matching value to whatever parameter that controller slot is bound to. This is how an
  LFO's output actually reaches a destination parameter elsewhere in the app: LFO/mixer -> `to_router`
  (broadcast, addressed by index) -> the one matching `ctrl_config-vpt7_01.maxpat` instance -> the
  bound destination parameter. (`ctrl_config-vpt7_01.maxpat` is outside this task's 3-file scope and
  was only grepped/partially read to confirm this consumer side, not read in full.)
- `s to_router` is fed identically by many other control-surface producers found via the same grep
  (`softslider-vpt7.maxpat`, `softbutton-vpt7.maxpat`, `serial_VPT7.maxpat`,
  `sensorinput_module_vpt7.maxpat`, `miditab-vpt7.maxpat`, `loopback_clip_vpt7.maxpat`,
  `enginetab.maxpat`, `cuelist-vpt7.maxpat`, `artnet-vpt.maxpat`) — LFOs are one of several producers
  sharing this bus, not a special case.

## Dependencies
- No `code/*.js`, `shaders/*.jxs`, or `externals/*.mxo` are referenced by name from any object's box
  text in these 3 files.
- `lforack-vpt7.maxpat`'s `dependency_cache` lists `o.route.mxo` (type `iLaX`, a Mac-only external
  per CLAUDE.md's externals inventory) as an implicit dependency, but the string `o.route` does not
  appear anywhere in the patcher's actual box content — only the standard `OSC-route` object is used
  anywhere in this 3-file cluster (see tech-debt finding 5).
- The 2 `fpic` objects in `lforack-vpt7.maxpat`'s `p lfo` help subpatcher embed their image data
  inline as base64 (`"embed":1`, `"data":[...]`) — not external file references.

## Notable patterns
- Uniform "rack" convention: both bpatcher types take a single creation argument (`#1`), used three
  ways inside each instance: (a) baked into every send/receive name (`#1lfo`, `#1lfo_osc`,
  `#1lfomix`, `#1lforange`, `#1lfoval`), (b) as the default `pack` value and the `ui_moveon` button's
  displayed label, and (c) added to the shared `ctrl_offset` to compute the instance's global routing
  index.
- `ui_moveon` doubles as both an "engage this LFO" toggle and, via `"texton":"#1"`, a label showing
  the LFO's own slot number while engaged — matching the in-rack help comment (`obj-61`): "Turn the
  lfo on. The number represents the VPT control nr it is mapped to".
- `ctrl_offset` is a single shared, non-per-instance, non-OSC-addressable integer that shifts the
  whole rack's target indices at once, letting the same 10-slot rack automate different banks of
  10 destination parameters — per the in-rack help comment (`obj-22`): "by default the lfos are
  mapped to VPT controllers 1-10, but you can choose to move the controllers by adjusting the
  offset. With an offset of 10 the lfos would be affecting VPT controllers 11 through 20".
- The wave-shaping subpatcher's square-wave path is explicitly flagged in-patch by the original
  author as a trick rather than a documented technique.
- The `dropfile`/`counter`/`sprintf script sendbox` block in `lforack-vpt7.maxpat` is a design-time
  convenience for batch-replacing a numbered box's saved content, unrelated to the runtime LFO signal
  path — an onboarding trap for anyone assuming every wired object participates in modulation.

## Tech-debt findings
1. **[hardcoded-limit]** `lfomix-vpt7_01.maxpat`'s two "lfo sources" umenus offer 8 choices
   (`off,1lfo,2lfo,...,8lfo`), but only 6 base LFOs (`lfo1`-`lfo6`, from `lfomodule-vpt7_01.maxpat`)
   ever `send` on a matching `#Nlfo` channel — `lfomix` instances (slots 7-10) never send on such a
   channel at all (verified: no `"text" : "s ` other than `s to_router` exists anywhere in
   `lfomix-vpt7_01.maxpat`). Selecting "7lfo" or "8lfo" as a mix source therefore silently receives
   nothing, forever. Location: `vpt8 source code/patchers/lfomix-vpt7_01.maxpat` —
   `"items" : [ "off", ",", "1lfo", ..., "8lfo" ]` (umenu ids `obj-39` / `obj-22`).
   Severity: low. Effort: low.

2. **[architectural-fragility]** The cross-cutting routing bus (`s`/`r to_router`) and the rack-wide
   `s`/`r ctrl_offset` are plain, globally-scoped Max send/receive names with no bpatcher-argument
   namespacing, so correctness depends entirely on there being exactly one `lforack-vpt7.maxpat`
   instance app-wide. This was verified true today (single bpatcher in `controltabs.maxpat`, `obj-12`,
   varname `router-vpt7[7]`), but nothing in the patcher enforces it — a second instantiation anywhere
   would silently sum/overwrite `ctrl_offset` and interleave unrelated `to_router` traffic with no
   isolation. Location: `vpt8 source code/patchers/lforack-vpt7.maxpat` — `"text" : "s ctrl_offset"`;
   `vpt8 source code/patchers/lfomodule-vpt7_01.maxpat` and
   `vpt8 source code/patchers/lfomix-vpt7_01.maxpat` — `"text" : "s to_router"`.
   Severity: medium. Effort: medium (would require namespacing, e.g. via `#0`, everywhere the bus is
   used across all 12 producer/consumer patchers found by grep, not just this cluster).

3. **[architectural-fragility]** Only the base LFO module wraps its parameters in `pattr` objects
   (`lfoon`, `lfowave`, `lfownormal`, `lfospeed`, `lfophase`, `lfoval`, `lforange` —
   `lfomodule-vpt7_01.maxpat`); `lfomix-vpt7_01.maxpat` has zero `pattr` objects for its source/blend
   /mix-level controls, so mixer settings are structurally inconsistent with base-LFO settings for
   the app's `pattrstorage`-based save/preset mechanism. Compounding this, none of the base LFO's
   `pattr` varnames appear in any of the 3 shipped `pattrstorage` snapshot dumps either (grepped
   `lfospeed|lfoon|lfomix|lforange|lfophase|lfoval|lfownormal|lfowave` against `data/gui.json`,
   `data/presets.json`, `data/sources.json` — zero matches in all three), so it is unclear whether
   even base-LFO state reliably persists across a saved session. Location:
   `vpt8 source code/patchers/lfomix-vpt7_01.maxpat` (absence of any `pattr` object, whole file);
   `vpt8 source code/data/gui.json`, `data/presets.json`, `data/sources.json` (absence of any `lfo*`
   key). Severity: medium. Effort: medium (requires opening the project in Max to test save/reload
   behavior directly).

4. **[toolchain-version]** `lforack-vpt7.maxpat` was last saved with
   `"appversion":{"major":7,"minor":3,"revision":4,"architecture":"x86","modernui":1}` (an older,
   32-bit Max 7.3.4 build, at both the root patcher and its nested `p lfo` subpatcher), while the two
   bpatchers it hosts carry `"revision":5,"architecture":"x64"`. This contradicts CLAUDE.md's
   statement that VPT8 is "64-bit only," and suggests the rack container patcher predates (or was
   never re-saved during) the project's move to 64-bit-only Max. Location:
   `vpt8 source code/patchers/lforack-vpt7.maxpat` lines 7-8 and 123-124 (`"revision" : 4`,
   `"architecture" : "x86"`) vs. `vpt8 source code/patchers/lfomodule-vpt7_01.maxpat` and
   `vpt8 source code/patchers/lfomix-vpt7_01.maxpat` lines 6-8 (`"revision" : 5`,
   `"architecture" : "x64"`). Severity: low. Effort: low (re-save in current Max to normalize).

5. **[dead-code]** `lforack-vpt7.maxpat`'s `dependency_cache` lists `o.route.mxo` (a Mac-only
   external, per CLAUDE.md's externals inventory) as an implicit dependency, but no object anywhere
   in this 3-file cluster's actual box content references `o.route` — only the standard `OSC-route`
   object is used. This is stale cache metadata (Max's `dependency_cache` is regenerated from
   historical opens/edits and is not reliably pruned). Location:
   `vpt8 source code/patchers/lforack-vpt7.maxpat` — `"name" : "o.route.mxo"` (line 1685).
   Severity: low. Effort: low.
