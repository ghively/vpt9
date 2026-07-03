# Presets & cue automation

## Purpose

This cluster covers three parallel ways VPT8 changes its whole-app look over time, plus one
parameter-level shortcut between them. `presetmodule-vpt7.maxpat` + `preset_cellblock.maxpat` are a
hand-built preset store/recall **front end** (a `coll`-backed slot list) that never itself owns Max's
native preset-storage object — it is a UI shell that talks, via a mesh of plain send/receive buses,
to the real `pattrstorage vpt` object that actually lives in `enginetab.maxpat` (Task 2/3 territory,
outside this cluster). `cuelist-vpt7.maxpat` is a from-scratch, line-oriented "cue script" interpreter
(cut/fade/delay/loop/source-select/router-fade/raw-OSC letter codes) that sequences preset and router
changes over time and drives the same recall channel. `vpt-timersketch3.maxpat` +
`timermodule.maxpat` form a completely independent, second automation mechanism: a live wall-clock
display hosting 15 alarm-style timer instances that fire a preset/cue/source recall at a specific
time of day. `copypaste.maxpat` is unrelated to either automation path — it copies one layer's stored
parameter values onto another layer, parameter-by-parameter, by talking directly to the same
`pattrstorage vpt` object via its low-level get/set-value API.

## Files in this cluster

- `vpt8 source code/patchers/presetmodule-vpt7.maxpat` (4942 lines)
- `vpt8 source code/patchers/preset_cellblock.maxpat` (266 lines)
- `vpt8 source code/patchers/cuelist-vpt7.maxpat` (8611 lines)
- `vpt8 source code/patchers/copypaste.maxpat` (1223 lines)
- `vpt8 source code/patchers/timermodule.maxpat` (620 lines)
- `vpt8 source code/patchers/vpt-timersketch3.maxpat` (1596 lines)

## Key patchers & subpatchers

**`presetmodule-vpt7.maxpat`** is hosted as a static bpatcher (obj-101, varname
`"presetmodule-vpt7"`) directly inside `vpt7project.maxpat` (line 5267-5286, Task 1 scope). Despite
its name and its role, **it contains zero `pattrstorage` and zero `pattr` objects** (grep-verified:
no matches for either in the whole 4942-line file, including its three inline subpatchers). The
entire "preset engine" visible in this file is a bespoke system: a `coll`-backed cell list (see
`preset_cellblock.maxpat` below) plus hand-built OSC-style text messages sent across send/receive
buses and semicolon-prefixed cross-object messages. Three static inline subpatchers: `p
next-prev_preset` (obj-3, next/previous preset stepping, with an explicit comment "cellblock starts
at 0, not 1, so preset 1 is pos 0" acknowledging the off-by-one translation), `p clearall` (obj-160,
a "clear all presets" button whose hint text reads "deletes selected preset" — a copy-pasted,
incorrect hint; see Tech-debt finding 5), and `p presethelp` (obj-139, a help window embedding a
`vpt7_presets.png` screenshot as a base64 `fpic` blob, plus ~7 hidden leftover buttons from a
copy-pasted Max help-window template). Central dispatch is two `route` fan-outs: `route store number
name type go save slots feid` (obj-113, line 2438) and `route slotname delete read write recall
current` (obj-98, line 2812, fed by `r fps`, line 2782 — an odd choice of receive name given `fps`
conventionally means frames-per-second elsewhere in VPT; see Tech-debt finding 6). The module reaches
the real storage engine only through cross-file messaging: `s ps`/`r ps` (6 sends: lines 1037, 3070,
3145, 3225, 3360, 3493; 1 receive: line 1137), `s ps_sources` (line 993) plus `;\rps_sources grab`
(line 848), and `;\rtoPS clear` (line 702) / `"prepend /toPS"` (line 1122) — all of these bus names
are received elsewhere, in `enginetab.maxpat` (see Data flow).

**`preset_cellblock.maxpat`** is hosted as its own separate static bpatcher (obj-38, line 458-478)
directly inside `vpt7project.maxpat` — a **sibling** of `presetmodule-vpt7.maxpat`, not nested inside
it (confirmed: `presetmodule-vpt7.maxpat` contains no `bpatcher` objects at all). The two communicate
purely by send/receive: `r to-presets_cellblock`/`s fr-presets_cellblock`/`r to-presets_coll`
(preset_cellblock.maxpat, lines 43-82) match `s to-presets_cellblock`/`r fr-presets_cellblock`/`s
to-presets_coll` in `presetmodule-vpt7.maxpat` (lines 132, 584, 598, 569). Internally it is a
`jit.cellblock` (obj-57, 11 rows × 2 cols, `hint:"click to select a preset"`, line 143-170) bound via
a `"refer presets"` message (obj-59, line 128-142) to a local `coll` object literally named `presets`
(obj-56, `embed:0`, line 171-189). No backing `presets.txt`/`presets` coll file exists anywhere in
the repo (verified: no such file under `vpt8 source code/`), so this `coll` is populated purely at
runtime by whatever `presetmodule-vpt7.maxpat` pushes down `s to-presets_coll` (presumably the slot
names returned by its `getslotnamelist 1` query, line 3368) — the preset-name list is therefore only
ever a live in-memory mirror, never a redistributable data file.

**`cuelist-vpt7.maxpat`** is hosted as a static bpatcher inside `controltabs.maxpat` (per Task 5's
`05-layer-gui-mixing-clips.md`, at x=326 in its 12-page filmstrip). It also has **zero `pattrstorage`
and zero `js` objects** (grep-verified). Cues are stored as plain lines of text in a `[text]` object
(obj-110, line 7528) displayed/edited through a `jit.cellblock` (obj-2, `cols:1`, **`rows:200`**
hardcoded, line 7238-7245) and a one-line `textedit` (obj-4, line 7183). The cue syntax, documented in
an in-patcher help comment (`p cuelist_help`, obj-6, lines 804-810), is a small letter-coded language:
`C n` (cut to preset n), `F a b x` (fade preset a→b over x seconds), `D x` (delay x seconds), `L n`
(loop to cuelist line n), `S n` (select source preset n), `R c a b x` (fade router controller c from a
to b over x seconds), `O ...` (send raw OSC out), and `END`. Any cue can carry a `+` suffix meaning
"auto-continue to the next cue." Dispatch is a 9-outlet `gate` (obj-91, line 4461) selected by
parallel `zl compare` objects testing the first token of each line: `F`/`f` (4766/3401), `C`/`c`
(4723/3386), `D`/`d` (4695/3371), `S`/`s` (4639/3341), `O`/`o` (4667/3356), `L`/`l` (3652/3311),
`R`/`r` (3193/3135), and an **undocumented** `X`/`x` (3887/3326) — the help text documents only 8
cue-type letters, not `X` (see Tech-debt finding 3). Fade timing for three separate purposes (global
crossfade, router-controller fade, preset fade) is implemented by **three duplicated** `p audioline`
subpatchers (lines 2196, 2701, 2928), each a `snapshot~`→`change`→`line~` chain — i.e. an audio-rate
signal ramp repurposed as the timing engine, rather than a scheduler object, copy-pasted three times
instead of being one reusable abstraction.

**`copypaste.maxpat`** is instantiated not as a bpatcher but as a Max **patcher abstraction**: a bare
`newobj` box whose text is exactly `"copypaste"` (obj-64, line 4986-4993 of `enginetab.maxpat`) —
typing a patcher's base filename into an object box loads that patcher as a subpatcher object, a
third distinct instantiation idiom in this codebase alongside the static-bpatcher and
`newdefault`-driven dynamic-bpatcher patterns Task 5 documented. (`vpt7project.maxpat`'s
`dependency_cache` also lists `copypaste.maxpat`, but only transitively, line 7107.) The file itself
is a single flat patcher (no subpatchers, no bpatchers). It is triggered by `r copyfromlayer` (line
124) and `r pastetolayer` (line 109) — matching the `;copyfromlayer #1`/`;pastetolayer #1` messages
Task 5 found in `layergui.maxpat`'s per-layer "c"/"p" mini-buttons — plus a pair of grey-colored,
seemingly-legacy `r lcopy` (line 230) / `r lpaste` (line 214) receives. A `umenu` (obj-16, line
663-674) enumerates ~30 copyable per-layer parameter names (`fade`, `rgb`, `blendmode`, `source`,
`flip::on`, `flip::fliptype`, `mask::on/source/inv/blur_on/blur/moving`,
`cornerpin::upper_left/lower_left/upper_right/lower_right`,
`brcosa::on/brightness/contrast/saturation`, `mblur::mblur/on`, `blur::on/blur`,
`tile::on/xtile/ytile`, `zoom::on/xzoom/yzoom/xanchor/yanchor`,
`edgeblend::on/left/up/right/down/inv`) — closely matching, but not identical to, the `1layer::*`
namespace in `data/presets.json` (it omits `mesh::*`, `layername`, and `layerorder`; see Tech-debt
finding 7). Two `uzi` objects (obj-25, obj-43) iterate that list, and for each parameter build
`sprintf getstoredvalue %ilayer::%s 0` (obj-13, line 686) to read the source layer's value and
`sprintf setstoredvalue %i%s 0` (obj-34, line 362) to write it to the destination layer — Max
pattrstorage's low-level get/set-value message API, not its `store`/`recall` slot API. The iteration
count is queried at runtime via a `"count"` message (obj-29) / `route count` (obj-22, obj-44) rather
than hardcoded — the one place in this cluster a loop bound is *not* a magic number.

**`timermodule.maxpat`** is a small, self-contained, argument-parametrized (`#1`) module with **no
`metro`/`clocker`/`timer`/`transport` object at all** (grep-verified) — it is a wall-clock **alarm**,
not a countdown or stopwatch. It receives the live hour and minute (`r hour` line 301, `r minute`
line 288) and compares them, only when armed (`textbutton` varname `"active"`, obj-5, line 163-182),
against its own per-instance stored target hour/minute (`v #1hour`/`v #1minute`, obj-68/obj-69, lines
379-394). The equality test uses a deliberate `if $i1==$i2 then 1 else -1` / `if $i1==$i2 then 1 else
0` sentinel pair (obj-96 line 331-343, obj-95 line 319-330) feeding a final `==` (obj-82, line
358-369) — correct, but with no comment explaining why non-overlapping -1/0 sentinels were chosen
(see Tech-debt finding 8). On a match, a `umenu` (obj-13, items `preset, cue, source`, line 147-159)
and a `value` number box (obj-6) build the message `"/vpt/<type> $1"` via `sprintf /vpt/%s \$1`
(obj-2, line 131, overwriting the placeholder message box text `"/vpt/preset $1"`, obj-20, line 115)
and send it on **`s ctrl`** (obj-4, line 91). All five per-instance parameters
(`active`/`hour`/`minute`/`parameter`/`value`) are wrapped in an `autopattr` (obj-3, line 40-58),
which auto-registers them into whatever enclosing `pattrstorage` is present at instantiation time.

**`vpt-timersketch3.maxpat`** is hosted as a static bpatcher inside `controltabs.maxpat` (per Task
5's doc, at x=2601). It is the container for the whole timer bank: a `metro @active 1 1000` (obj-2,
line 1195) ticking once per second drives a `date` object (obj-1, line 1208) whose hour/minute are
broadcast globally via `s hour` (line 902) / `s minute` (line 890) — exactly what every
`timermodule.maxpat` instance's `r hour`/`r minute` receives. Three `ignoreclick` number boxes with
`:` message-box separators (lines 608-659, 1080-1145) render a live H:M:S readout in presentation
mode — a numeric clock face, not a graphical/`mgraphics` sketch despite the filename. The file
statically embeds **15 bpatcher instances of `timermodule.maxpat`**, each given a distinct `#1`
argument 1-15 via its `args` array (e.g. obj-21 `args:[15]` varname `timermodule[14]`; obj-36
`args:[10]` varname `timermodule` with no suffix; 15 boxes total, confirmed by 16 occurrences of
`"name":"timermodule.maxpat"` — 15 boxes plus one `dependency_cache` entry at line 1586). The whole
bank's configuration is itself snapshotted by its own `pattrstorage timer @autorestore 0` (varname
`timer`, line 482) — a **fourth** pattrstorage, distinct from `vpt`/`gui`/`sources`, persisted to its
own external `timer.json` file (via `sprintf symout %stimer.json`, not one of the three JSON dumps
this task was asked to ground against). Four objects — `r t_ctrlpreset` (line ~226), a disconnected
`t i b`, `s f_ctrlpreset` (line ~241), and `s prefsave` (line ~212) — have zero patchline connections
anywhere in the file, an apparently abandoned "external preset control" pathway (see Tech-debt
finding 9).

## Data flow

Every entry below is a literal string or object found in the cited file.

**Preset module ↔ real storage engine (`enginetab.maxpat`, Task 2/3 scope, cited only for
cross-reference):** `enginetab.maxpat` owns `"pattrstorage vpt @changemode 1 @autorestore 0
@savemode 0 @backupmode 2"` (varname `vpt`, line 5065) — the object whose live state is dumped in
`data/presets.json` (`"pattrstorage":{"name":"vpt", ...}`). `presetmodule-vpt7.maxpat` never touches
it directly; it sends `;\rtoPS clear`, `"prepend /toPS"`, `;\rps getslotnamelist 1`, `;\rps_sources
grab`, and plain `s ps`/`s ps_sources` messages, all of which are picked up elsewhere: `enginetab.maxpat`
has `r toPS` (line 5036) and (in several places) `s toPS` (lines 3914, 8109, 8492, 9654) /
`;\rtoPS 0` / `;\rtoPS store 0` (lines 1436, 1482, 8464); `sourcebank.maxpat` (Task 6/7 scope) has
`r ps_sources` (line 757) and its own `s recall-ps_sources`/`s from-ps_sources` relay. `cuelist-vpt7.maxpat`
sends into the identical channel: `s toPS` (line 3489) and `;\rtoPS $1` (line 4138), plus `;\rps
getcurrent` (line 3475) — i.e. the sequential cue list and the manual preset-module UI drive the
same recall path. `data/presets.json`'s own per-slot `"sources":[1001]`…`[1011]` fields cross-link
each of its 11 "vpt" preset slots to a same-numbered slot in the `sources` pattrstorage
(`data/sources.json`); `data/sources.json` has entries for slot ids `1,2,3,1006,1007,1008,1009,1010,
1011` but **not `1004`/`1005`** — the linked-source slots for preset-module slots 4 and 5 are absent
from the shipped data snapshot (see Tech-debt finding 10). `data/gui.json`'s `pattrstorage` (name
`"gui"`) is unrelated to this cluster — it is owned by `vpt7project.maxpat` (Task 1 scope, per
CLAUDE.md), not by any file here.

**Preset module internal UI:** `r to-presets_cellblock`/`s fr-presets_cellblock`/`r to-presets_coll`
(preset_cellblock.maxpat) ↔ `s to-presets_cellblock`/`r fr-presets_cellblock`/`s to-presets_coll`
(presetmodule-vpt7.maxpat); `"col 116 width 1"`, `"refer presets"` (preset_cellblock.maxpat);
`"getslotnamelist 1"`, `"select 0 $1"`, `route store number name type go save slots feid`, `route
slotname delete read write recall current` (fed by `r fps`), `"storagewindow"`/`"clientwindow"`
window-open messages, `"write"`/`"read"`/`"writeagain"` (presetmodule-vpt7.maxpat).

**Cue list dispatch:** cue-type letters `C F D L S R O END` parsed by `zl compare` fan-out into a
9-outlet `gate`; auto-continue `+` suffix; outputs `s toPS` (preset cut/fade cues), `s to_router` /
`r routerfeid` (router-fade "R" cues, Task 9 scope for the receiving end), `s osc-extout` (raw "O"
cues), `s t_sourcespreset` (source-preset "S" cues); UI: `r loadcuelist`, `r cueplay`, `r cuenext`/`s
cuenext`, `r cueprev`, `s cuetrig`, `s`/`r focus` (×2), `s ps_cut`, `s`/`r line_done` (×3, one per
`p audioline`), `s progress`, `r feid`.

**Timer bank:** `s hour`/`s minute` (vpt-timersketch3.maxpat, from its own `metro`+`date`) ↔ `r
hour`/`r minute` (every timermodule.maxpat instance); per-instance `v #1hour`/`v #1minute`
(autopattr-registered); on match, `"/vpt/preset $1"` / `"/vpt/cue $1"` / `"/vpt/source $1"` → `s
ctrl` (timermodule.maxpat). `enginetab.maxpat` separately has both `r ctrl` (line 9640) and `s toPS`
(line 9654) in the same file (their internal patchline-level wiring together is not traced here, as
`enginetab.maxpat` is out of this cluster's assigned scope) — establishing only that the timer bank's
output bus and the preset-recall input bus are both received inside the one file that owns
`pattrstorage vpt`. Timer-bank persistence: `pattrstorage timer @autorestore 0` (vpt-timersketch3.maxpat)
↔ `"read"`/`"write"`/`"writeagain"` messages → `sprintf symout %stimer.json`; `r presetspath` supplies
the save directory.

**Copy/paste:** `r copyfromlayer` / `r pastetolayer` (matching `layergui.maxpat`'s `;copyfromlayer
#1`/`;pastetolayer #1`, Task 5); legacy-looking `r lcopy`/`r lpaste`; per-parameter `sprintf
getstoredvalue %ilayer::%s 0` / `sprintf setstoredvalue %i%s 0` ↔ `s pstorage`/`r pstorage`, `s
from_pstorage`/`r from_pstorage` — received in `enginetab.maxpat` at `r pstorage` (line 5477) and `s
from_pstorage` (line 5462), immediately beside its `pattrstorage vpt` object (line 5065); `"count"` /
`route count` (runtime parameter-count query); `"store 0"` / `"store 0, 0"` (hardcoded slot argument);
`s refresh`.

## Dependencies

This cluster is unusual among the ones audited so far: **zero** `code/*.js` scripts, **zero**
`shaders/*.jxs` files, and **zero** `externals/*.mxo` binaries are referenced anywhere across all six
files (grep-verified for `.js`, `.jxs`, `.mxo`, `OSC-route`, and `o.route` — no matches). Every
mechanism here — the cue-script interpreter, the wall-clock alarm bank, the copy/paste parameter
walker — is built entirely from stock Max objects (`text`, `jit.cellblock`, `coll`, `zl`, `uzi`,
`gate`, `date`, `metro`, `autopattr`, `pattrstorage`, `sprintf`, `regexp`). `presetmodule-vpt7.maxpat`,
`preset_cellblock.maxpat`, and `copypaste.maxpat` have **no `dependency_cache` key at all**;
`cuelist-vpt7.maxpat` and `timermodule.maxpat` have an empty one (`[]`); only `vpt-timersketch3.maxpat`
declares one, and its single entry is just its own embedded `timermodule.maxpat`.

Cross-cluster couplings (all via send/receive or shared pattrstorage, never file includes):
- `enginetab.maxpat` (Task 2/3 scope) — owns `pattrstorage vpt` (the object behind `data/presets.json`)
  and hosts `copypaste.maxpat` as an abstraction (`newobj` "copypaste", line 4986); receives `toPS`,
  `ps`, `ctrl`, `pstorage`/`from_pstorage`.
- `sourcebank.maxpat` (Task 6/7 scope) — owns `pattrstorage sources` (behind `data/sources.json`);
  receives `ps_sources`.
- `controltabs.maxpat` / `vpt7project.maxpat` (Task 1/5 scope) — static bpatcher hosts for every file
  in this cluster.
- `layergui.maxpat` (Task 5 scope) — source of the `;copyfromlayer #1`/`;pastetolayer #1` messages
  that trigger `copypaste.maxpat`.
- `router-vpt7.maxpat` (Task 9 scope) — owns `pattrstorage router`; receiving end of `to_router`/
  `routerfeid`.
- `osceditor-vpt7.maxpat` (Task 9 scope) — plausible consumer of `cuelist-vpt7.maxpat`'s raw
  `osc-extout` messages (not confirmed here; outside this cluster's file set).

## Notable patterns

- **The "preset module" is a UI shell, not the storage engine.** Neither `presetmodule-vpt7.maxpat`
  nor `preset_cellblock.maxpat` contains a single `pattrstorage`/`pattr` object; the real `pattrstorage
  vpt` lives in `enginetab.maxpat` and is reached only through a mesh of tersely-named send/receive
  buses (`ps`, `toPS`, `ps_sources`) and semicolon cross-object messages, none of which are documented
  in-patcher.
- **Three independent triggers, one recall channel.** Manual preset-module UI clicks, sequential
  cue-list "C"/"F" cues, and (indirectly, via `enginetab.maxpat`) the wall-clock timer bank all
  ultimately reach the same `toPS` bus feeding the one real `pattrstorage vpt` object — a reasonable
  integration point, but one entirely dependent on every file independently getting a 4-character bus
  name right, with no shared abstraction or documentation tying the three trigger paths together.
  Note: the timer bank's own `"parameter"` umenu offers `preset, cue, source` as if cue-triggering
  were symmetric with preset-triggering, but its output is only ever the generic `/vpt/cue $1` on `s
  ctrl` — nothing in this cluster's six files shows what (if anything) consumes a cue-index number
  from that channel to actually advance `cuelist-vpt7.maxpat`.
- **Two automation mechanisms that never reference each other.** `cuelist-vpt7.maxpat` (sequential,
  manually/auto-stepped) and `vpt-timersketch3.maxpat`/`timermodule.maxpat` (wall-clock, 15 parallel
  alarms) share no send/receive names and no code; a search for "timer"/"timersketch" inside
  `cuelist-vpt7.maxpat` returns nothing. They are two separately engineered answers to "change the
  preset over time."
- **A hand-rolled scripting language instead of native sequencing idioms.** `cuelist-vpt7.maxpat`'s
  cue syntax (`C`/`F`/`D`/`L`/`S`/`R`/`O`/`END`, `+` for auto-continue) is parsed by a purpose-built
  `zl compare` fan-out into a 9-way `gate`, and its timing is implemented by three copy-pasted
  `p audioline` (`snapshot~`/`change`/`line~`) subpatchers — an audio-rate signal object repurposed as
  a scheduler, rather than Max's cooperative `line`/`pipe`/`delay` idioms used almost everywhere else
  in this codebase.
- **A third distinct instantiation mechanism.** Alongside the static-bpatcher and `newdefault`-driven
  dynamic-bpatcher patterns documented in Tasks 2-5, `copypaste.maxpat` is loaded via the plain
  `newobj`-named-after-file abstraction idiom (`enginetab.maxpat`'s bare `"copypaste"` object) —
  a third "make an instance of this patcher" convention in the same app.
- **A fourth, ungrounded pattrstorage.** `vpt-timersketch3.maxpat`'s `pattrstorage timer` persists the
  15-alarm bank to its own `timer.json`, entirely separate from the three pattrstorage dumps
  (`presets.json`/`gui.json`/`sources.json`) this task was asked to cross-reference — the timer bank's
  saved state is not visible in any of those three files.

## Tech-debt findings

1. **[architectural-fragility]** `presetmodule-vpt7.maxpat` and `preset_cellblock.maxpat` reach the
   real `pattrstorage vpt` object (owned by `enginetab.maxpat`) exclusively through terse, undocumented
   send/receive bus names (`ps`, `toPS`, `ps_sources`) and semicolon cross-object messages, with zero
   in-patcher comments explaining the relay. A typo in any one of these bus names in any of the three
   files would silently break preset recall with no error. Location: `vpt8 source code/patchers/presetmodule-vpt7.maxpat`
   — `s ps` (lines 1037, 3070, 3145, 3225, 3360, 3493), `r ps` (line 1137), `;\rtoPS clear` (line 702);
   cross-reference `vpt8 source code/patchers/enginetab.maxpat` — `pattrstorage vpt` (line 5065), `r
   toPS` (line 5036). Severity: medium. Effort: medium.
2. **[dead-code]** The cue-type letter `X`/`x` is fully wired into `cuelist-vpt7.maxpat`'s 9-outlet
   dispatch `gate` (`zl compare X` / `zl compare x`) but is not documented anywhere in the in-patcher
   help text, which lists only `C F D L S R O END`. It is either an undocumented experimental feature
   or dead residue from a removed cue type. Location: `vpt8 source code/patchers/cuelist-vpt7.maxpat`
   — `zl compare X` (line 3887), `zl compare x` (line 3326); help text `p cuelist_help` obj-6 (lines
   804-810). Severity: low. Effort: low.
3. **[hardcoded-limit]** The cue list's `jit.cellblock` is fixed to `rows:200`, and its rebuild logic
   uses a matching `uzi 200` — a cue list cannot exceed 200 lines without directly editing the
   patcher. Location: `vpt8 source code/patchers/cuelist-vpt7.maxpat` — `"rows":200` (line 7245),
   `uzi 200` (line 7052). Severity: low. Effort: medium.
4. **[hardcoded-limit]** `preset_cellblock.maxpat`'s `jit.cellblock` is fixed to `rows:11`, capping the
   number of presets visibly selectable from the grid at once (scrolling behavior beyond 11 rows is
   not evidenced in this file). Location: `vpt8 source code/patchers/preset_cellblock.maxpat` — obj-57
   (line 163, `"rows":11`). Severity: low. Effort: low.
5. **[naming-inconsistency]** The `"clear all presets"` textbutton in `presetmodule-vpt7.maxpat`'s `p
   clearall` subpatcher carries the hint text `"deletes selected preset"` — describing a different
   button's behavior (clearing one selected preset) than what this button actually does (clearing
   every preset). Location: `vpt8 source code/patchers/presetmodule-vpt7.maxpat` — obj-67 textbutton
   (line 707), hint (line 711). Severity: low. Effort: low.
6. **[naming-inconsistency]** `presetmodule-vpt7.maxpat`'s preset-engine reply dispatcher is fed by `r
   fps` — a receive name that, everywhere else in this codebase, conventionally means "frames per
   second." Reusing it here for preset-storage replies risks accidental cross-talk if any other module
   ever broadcasts a numeric frame-rate on the same bus name. Location: `vpt8 source code/patchers/presetmodule-vpt7.maxpat`
   — `r fps` (line 2782), feeding `route slotname delete read write recall current` (obj-98, line
   2812). Severity: low. Effort: low.
7. **[naming-inconsistency]** `copypaste.maxpat`'s copyable-parameter `umenu` (obj-16) enumerates ~30
   per-layer parameter names but omits `mesh::*`, `layername`, and `layerorder` — three fields that
   *do* exist in the `1layer::*` namespace dumped in `data/presets.json`. Copy/paste therefore silently
   skips a layer's mesh warp state and its name/stacking order, with no indication to the user that
   the operation is partial. Location: `vpt8 source code/patchers/copypaste.maxpat` — obj-16 `umenu`
   items list (line 663-674); compare `vpt8 source code/data/presets.json` — `"1layer::mesh::gridsize"`,
   `"1layer::layername"`, `"1layer::layerorder"` keys. Severity: low. Effort: low.
8. **[architectural-fragility]** `timermodule.maxpat`'s hour/minute equality check relies on a
   deliberate but entirely uncommented sentinel-value trick (`if $i1==$i2 then 1 else -1` paired with
   `if $i1==$i2 then 1 else 0`, so a final `==` only ever fires on a true double-match, never on a
   coincidental single mismatch producing the same false value from both branches). Anyone editing
   this logic without noticing the asymmetric else-branches could reintroduce a false-positive alarm
   trigger. Location: `vpt8 source code/patchers/timermodule.maxpat` — obj-96 (line 331-343), obj-95
   (line 319-330), obj-82 `==` (line 358-369). Severity: low. Effort: low.
9. **[dead-code]** `vpt-timersketch3.maxpat` contains four objects — `r t_ctrlpreset`, a disconnected
   `t i b`, `s f_ctrlpreset`, and `s prefsave` — with no patchline connections anywhere in the file:
   an apparently abandoned "external preset control" feature left in the shipped patcher. Location:
   `vpt8 source code/patchers/vpt-timersketch3.maxpat` — `r t_ctrlpreset` (line 226-240), `s
   f_ctrlpreset` (line 241-254), `s prefsave` (line 212-225). Severity: low. Effort: low.
10. **[architectural-fragility]** `data/presets.json`'s 11 "vpt" preset slots each cross-link to a
    same-numbered slot (`1001`-`1011`) in the `sources` pattrstorage, but `data/sources.json` has no
    entries for ids `1004`/`1005` — recalling preset-module slots 4 or 5 (the two `presetname`-named,
    unedited slots) would reference linked source state that does not exist in the shipped data
    snapshot. Location: `vpt8 source code/data/presets.json` — slots `"4"`/`"5"`, `"sources":[1004]`/
    `[1005]`; compare `vpt8 source code/data/sources.json` — slot ids present (`1,2,3,1006-1011`).
    Severity: low. Effort: low.
11. **[naming-inconsistency]** `copypaste.maxpat` receives layer-copy triggers on two differently-named
    bus pairs that appear to serve the same purpose: the misspelled `r focuse` (missing a "d",
    appearing twice) alongside correctly-spelled `v focus` objects in the same file, and a
    current/legacy pair `r copyfromlayer`/`r pastetolayer` alongside grey-colored (visually
    de-emphasized) `r lcopy`/`r lpaste`. Location: `vpt8 source code/patchers/copypaste.maxpat` — `r
    focuse` (lines 94, 536); `r lcopy` (line 230), `r lpaste` (line 214). Severity: low. Effort: low.
12. **[architectural-fragility]** `cuelist-vpt7.maxpat`'s help-window `fpic` embeds a hardcoded,
    non-portable, developer-machine absolute path (`"HCHD:/Users/hcg/Desktop/vpt6_images/vpt6_cuelist2.png"`)
    from an even older VPT6 asset; the image itself is embedded as base64 so it still renders, but the
    path string is stale and the file is a straight VPT6/VPT7-era carryover with no in-patch
    acknowledgment of the version drift (mirrors the `presetmodule-vpt7.maxpat`/`vpt7_presets.png`
    naming drift noted above). Location: `vpt8 source code/patchers/cuelist-vpt7.maxpat` — `p
    cuelist_help` obj-1 `"pic"` attribute (line 868). Severity: low. Effort: low.
