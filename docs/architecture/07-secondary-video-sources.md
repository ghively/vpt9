# Secondary video sources

## Purpose
This cluster documents VPT8's non-file-codec video sources — still-image crossfading, solid-color
fill, and Syphon (Mac-only GPU texture sharing) input/output — plus `sourcebank.maxpat`, the
patcher that lets each of the 8 "video bank" slots in the source rack be dynamically reassigned, at
runtime, between all four interchangeable source types (`xfadesource`, `hapsource`, `xfadestill`,
`mix-vpt7`). Where Task 6 covers the core HAP/crossfade video-file engines in depth, this doc covers
the sibling source types that share the same slot-swapping mechanism and per-instance (`#1`-style)
naming convention, and the routing/preset infrastructure (`sourcebank.maxpat`) that ties all of them
together.

## Files in this cluster
- `vpt8 source code/patchers/xfadestill.maxpat` (5692 lines)
- `vpt8 source code/patchers/sourcebank.maxpat` (4673 lines)
- `vpt8 source code/patchers/solid01_vpt7.maxpat` (1032 lines)
- `vpt8 source code/patchers/syphon_vpt7.maxpat` (1243 lines)
- `vpt8 source code/patchers/vpt-syphonout.maxpat` (284 lines)

## Key patchers & subpatchers

### `xfadestill.maxpat` — still-image crossfade source
The still-image counterpart to `xfadesource.maxpat` (video crossfade, Task 6): loads two still images
(A/B) instead of two movies and crossfades between them with the same `co.xfade.jxs` shader.
- `dropfile` object (`obj-18`) for drag-and-drop file loading; a `umenu` (`obj-14`, `autopopulate 1`)
  lists image/movie files found under a folder prefix
  (`HD:/Users/hcg/lab/vpt7-2017-osx-beta03/defaultproject2017/video/` — a hard-coded author-machine
  path baked into the saved patcher state).
- Two parallel `jit.matrix 4 char 320 240` / `jit.matrix 4 char 640 480 @adapt 1` chains (`obj-33`,
  `obj-35`, `obj-24`, `obj-23`) hold the "A" and "B" images; `p adapt` (`obj-83`, a large subpatcher)
  rescales each incoming image's factor (`* 0.5`, `* 0.33333`, `* 0.25`, … down to `* 0.0625`) driven
  by a resolution `umenu` with items `F, 2/3, 1/2, 1/3, 1/4, 1/8, 1/16` — a manual mip-style downscale
  selector, not an automatic fit.
- `jit.gl.slab vpt @file co.xfade.jxs` (`obj-61`) performs the actual crossfade between the two
  textures, driven by a `param xfade $1` message and a `pattr xfade` (default 0.5).
- `p playlist` subpatcher (nested inside `p adapt`, ~`xfadestill.maxpat:3566`) implements slideshow
  auto-advance: a `counter`/`umenu` combo iterating a `#1playlist` list, gated by `#1play`, feeding a
  `delay 3000` / `line 0.` audio-taper (`p audioline`, using `snapshot~`/`line~`) for the "how long
  the still image is on before fade in playlist mode" (`xfadestill.maxpat:3237`) hold time, itself
  driven by a `#1slide` (slide-length) receive.
- Monitor: `jit.pwindow` fed via `jit.qball`/`jit.gl.texture`, gated by an `r monitor` toggle — same
  monitor-thumbnail convention used by the other source types in this cluster.
- Per-instance receive/send naming follows the `#1`-prefixed convention (`#1A`, `#1B`, `#1both`,
  `#1video`, `#1playlist`, `#1play`, `#1slide`, `#1dim`, `#1Adim`, `#1Bdim`, `#1mgate`,
  `#1foldertrig`, `#1count`) so multiple `xfadestill` bpatcher instances (one per video-bank slot)
  don't collide.

### `solid01_vpt7.maxpat` — solid-color source
The simplest source type: a fixed-size, editable-color matrix used as a solid-fill video source
(instantiated as `solid1`/`solid2` in `sourcebank.maxpat`, matching `data/sources.json`'s
`solid1`/`solid2` slot names per `CLAUDE.md`).
- `jit.matrix hc 4 char 4 3` (`obj-1`) is the actual color-swatch matrix; `setall 255 255 255 255`
  (`obj-35`) resets it to white on load/click.
- `jit.gl.texture vpt @flip 0` (`obj-16`) turns the matrix into a GL texture, sent out via `s #1solid`
  (`solid01_vpt7.maxpat:525`).
- Resolution `umenu` (`obj-14`) offers `4x3, 80x60, 320x240, 640x480, 1024x768` presets; a size `tab`
  (`XS, S, M, L, XL`) and a channel `tab` (`1, 2, 3, 4`) drive UI layout, not signal routing.
- `pattr on`, `pattr refreshrate`, `pattr resolution` are the persisted parameters.
- Same `OSC-route /a` → `sprintf set 1 /%isolid` → `r to_sources` boilerplate (see "Data flow" below)
  and `OSC-route /on /resolution /refresh` for its OSC control surface.

### `syphon_vpt7.maxpat` — Syphon client (inbound video source)
Receives a GPU texture published by another Mac application via the **Syphon** inter-app
texture-sharing protocol.
- `jit.gl.syphonclient vpt @enable 0` (`syphon_vpt7.maxpat:355`) is the external doing the actual
  work; enabled/disabled via an `enable $1` message driven by an On/Off `textbutton`.
- Server discovery: a `syphonservers` button (hint: "check for available syphon sources") sends
  `getavailableservers`; the external's `dumpout` is parsed with
  `route dim servername appname clear` (`obj-54`) to populate a servername `umenu` (dynamically
  populated, `"items":"<empty>"` at save time) and a dimension `umenu` (`uidim[1]`).
  A `print dumpout` object (`obj-56`) sits on this chain as a leftover debug tap.
- Monitor thumbnail: `jit.qball` → `jit.pwindow`, gated by an `r monitor` toggle (same pattern as
  `xfadestill.maxpat`).
- Output: `s #1syphon` (`syphon_vpt7.maxpat:536`); OSC surface via
  `OSC-route /on /update /server /serverlist` plus the shared `/a` → `/%isyphon` → `to_sources`
  boilerplate.

### `vpt-syphonout.maxpat` — Syphon server (outbound publishing)
The mirror-image feature: publishes VPT's own composited output as a Syphon server for other Mac
apps to consume. This is **not** one of the 8 swappable video-bank source slots — it is instantiated
once in `sourcebank.maxpat` (`varname "syphonout"`, `sourcebank.maxpat:3032`) as a fixed
output-side feature sitting alongside the source rack.
- `jit.gl.syphonserver vpt @servername output @enable 0` (`vpt-syphonout.maxpat:193`) is the
  publishing external.
- `jit.gl.slab vpt @td.rota.jxs` (`obj-4`) applies a rotation shader to the incoming texture
  (received on `r syphon_output`) before publishing — i.e., output can be rotated independently of
  what's rendered on-screen.
- A `syphon out` toggle (`textbutton`, `varname "monitor"`) drives an `enable $1` message into the
  syphonserver, mirrored by an `attrui` bound to the `enable` attribute directly.

### `sourcebank.maxpat` — source-type router and preset bank
The umbrella patcher that hosts 8 fixed "video bank" bpatcher slots (`videobank01`…`videobank08`)
plus fixed instances of the other source types (`cam1`/`cam2` = `livemodule-vpt7.maxpat` camera
input, `solid1`/`solid2`, `syphon1`…`syphon4`, `syphonout`).
- **Default slot contents** (from each slot's `bpatcher` `"name"`/`"args"`, `sourcebank.maxpat:3730`–
  `3898`): `videobank01`–`03` default to `xfadesource.maxpat` (args 1–3), `videobank04` and
  `videobank06` default to `hapsource.maxpat` (args 4, 6), `videobank05` and `videobank08` default to
  `mix-vpt7.maxpat` (args 5, 8), and `videobank07` defaults to `xfadestill.maxpat` (args 7).
- **Runtime slot reassignment** (`p sourcebank`, `sourcebank.maxpat:2926`): a `r sourcebank` receive
  feeds `unpack a a a a a a a a` (8 outlets, one per video-bank slot) into 8 parallel `p reassign`
  subpatchers, each containing `sel V H S M` (verified: `sel V H S M` appears exactly 8 times,
  confirmed via grep). Each `sel` outlet fires one of four `script sendbox videobankNN replace
  <patcher>` messages — confirmed for all 8 slots × 4 types (32 total messages):
  `V → xfadesource`, `H → hapsource`, `S → xfadestill`, `M → mix-vpt7`. This is VPT's live-patching
  mechanism: it uses Max's `script sendbox … replace` scripting message to swap which patcher
  file occupies a given bpatcher slot **while the patch is running**, without recreating the
  bpatcher box itself. Each `reassign` subpatcher also fires `s tp_sourcebank` after replacing, to
  confirm completion.
- **Preset bank**: a `preset` object (`obj-31`, hint "shift+click to save sources setup, click to
  select") bound to `pattrstorage sources @autorestore 0 @changemode 1 @backupmode 2`
  (`sourcebank.maxpat:3711`, `varname "sources"`). The pattrstorage's embedded `interp`/`priority`
  dictionaries list the exact per-slot parameter set persisted per source type (e.g.
  `videobank01::videopath`, `videobank01::on`, `videobank01::alpha`, `videobank01::loop`,
  `videobank01::resolution`; `videobank05::A`/`::B`/`::mixtype` for a `mix-vpt7` slot;
  `syphon1::on`…`syphon4::on`), confirming this is where each slot's *type identity and settings*
  are captured for save/recall.
- Preset navigation: `sourcenext`/`sourceprev` receives drive `+ 1`/`- 1` against a `v sourcepos`
  value object (min 1), used to step through stored preset slots.
- Disk persistence: `sprintf symout %ssources.json` (`sourcebank.maxpat:3588`) together with
  `prepend write`/`prepend read` and a `route read recall` dispatcher — this is the mechanism behind
  `data/sources.json` referenced in `CLAUDE.md`.
- Dev/debug affordances: `storagewindow` and `clientwindow` messages open the pattrstorage/preset
  editor windows; `window flags nofloat, window exec` (`thispatcher` scripting) configures a
  presentation window.

## Data flow
- **Slot-reassignment bus**: `sourcebank` (receive, feeding `unpack a a a a a a a a`) → per-slot
  `sel V H S M` → `script sendbox videobankNN replace {xfadesource|hapsource|xfadestill|mix-vpt7}` →
  `tp_sourcebank` (send, per-slot completion signal).
- **Shared "register with `to_sources`" boilerplate**, present nearly identically in `xfadestill.maxpat`
  (`:2662`–`2649`), `solid01_vpt7.maxpat` (`:80`–`65`), and `syphon_vpt7.maxpat` (`:131`–`117`):
  `loadbang` → message `#1` → `sprintf set 1 /%i{solid|video|syphon}` → `OSC-route /a` → send
  `to_sources`. Each source-type patcher registers its own instance-numbered OSC address
  (`/1solid`, `/2video`, `/3syphon`, etc.) into a shared address list read by the top-level
  `to_sources` receiver (outside this cluster).
- **OSC control surfaces** (per source type, via `OSC-route`):
  - `xfadestill.maxpat`: `/a` (registration) and
    `/clip /clipnr /xfade /resolution /refresh /on /playlist /play /slide_length`.
  - `solid01_vpt7.maxpat`: `/a` and `/on /resolution /refresh`.
  - `syphon_vpt7.maxpat`: `/a` and `/on /update /server /serverlist`.
- **Per-instance sends** (all `#1`-prefixed, instance number substituted per bpatcher instantiation):
  `s #1solid` (solid color output), `s #1video`/`s #1A`/`s #1B`/`s #1both` (xfadestill A/B channels
  and combined-adapt trigger), `s #1syphon` (Syphon client output), `s #1playlist`, `s #1slide`,
  `s #1dim`/`s #1Adim`/`s #1Bdim`, `s #1mgate`, `s #1foldertrig`, `s #1count`, `s #1play`.
- **Internal message busses**: `solid_com` (`solid01_vpt7.maxpat`: `send solid_com`/`r solid_com`,
  gates the color-matrix update loop); `vpt_metro` (received by both `xfadestill.maxpat` and
  `syphon_vpt7.maxpat` to drive their monitor-thumbnail refresh); `monitor` (global monitor-enable
  toggle read by `syphon_vpt7.maxpat`, `xfadestill.maxpat`, and `vpt-syphonout.maxpat`).
- **Syphon output path**: `r syphon_output` → `jit.gl.slab vpt @td.rota.jxs` (rotation) →
  `jit.gl.syphonserver vpt @servername output @enable 0`, gated by `r syphonout_enable`/`enable $1`.
- **`sourcebank.maxpat` pattrstorage/preset**: `r sourcebank` (slot-type bus, above) is distinct from
  the `pattrstorage sources` preset system, which persists parameter *values* (not slot identity)
  for whatever patcher currently occupies each slot; the two together implement "which source type
  is in slot N, with what settings" as a single recallable preset. Disk sync:
  `sprintf symout %ssources.json` → `write`/`read` messages → `pattrstorage sources` ↔
  `data/sources.json`.

## Dependencies
- `shaders/v001 Mixers/` (or equivalent) `co.xfade.jxs` — crossfade shader used by both
  `xfadestill.maxpat` (`jit.gl.slab vpt @file co.xfade.jxs`) and (per Task 6) `xfadesource.maxpat`.
- `shaders/td.rota.jxs` — rotation shader used by `vpt-syphonout.maxpat`'s `jit.gl.slab vpt
  @td.rota.jxs` to rotate the published Syphon output independent of on-screen rendering.
- `externals/jit.gl.syphonclient.mxo` — used by `syphon_vpt7.maxpat`'s `jit.gl.syphonclient vpt
  @enable 0` (confirmed: `syphon_vpt7.maxpat:355`; listed in `sourcebank.maxpat`'s
  `dependency_cache`, `sourcebank.maxpat:4662`).
- `externals/jit.gl.syphonserver.mxo` — used by `vpt-syphonout.maxpat`'s `jit.gl.syphonserver vpt
  @servername output @enable 0` (confirmed: `vpt-syphonout.maxpat:193`; listed in
  `sourcebank.maxpat`'s `dependency_cache`, `sourcebank.maxpat:4666`).
- `externals/o.route.mxo` — listed in `sourcebank.maxpat`'s `dependency_cache`
  (`sourcebank.maxpat:4658`) as an implicit dependency of this cluster (custom routing external; not
  directly visible as an object box in any of the 5 files read, so likely pulled in transitively by
  a nested/instantiated child patcher such as `mix-vpt7.maxpat` or `hapsource.maxpat`).
- `patchers/hapsource.maxpat`, `patchers/xfadesource.maxpat`, `patchers/mix-vpt7.maxpat`,
  `patchers/livemodule-vpt7.maxpat`, `patchers/livemodule_d.maxpat` — sibling source/mixer patchers
  instantiated as bpatchers inside `sourcebank.maxpat` and/or swapped in via the `script sendbox
  replace` mechanism (see `sourcebank.maxpat`'s `dependency_cache`, lines 4595–4635).
- `data/sources.json` — the `pattrstorage sources` snapshot dump read/written by `sourcebank.maxpat`
  (see Data flow).

## Notable patterns
- **Live-patching via `script sendbox … replace`**: instead of building four separate UI slots (one
  per source type) and hiding/showing them, VPT swaps the *actual patcher file* loaded into a single
  bpatcher box at runtime. This is an unusual, fairly fragile Max idiom — it depends on the target
  bpatcher name (`videobankNN`) and the four replacement patcher filenames staying in exact sync
  across 8 duplicated `p reassign` subpatchers (`sourcebank.maxpat`), with no shared/parameterized
  implementation (see tech-debt below).
- **Per-instance `#1`-prefixed send/receive naming**: every source-type patcher in this cluster
  (and, per Task 6, the core ones too) uses Max's `#1`/`#2`... argument-substitution convention so
  that multiple bpatcher instances of the same patcher don't collide on global send/receive names.
  This is consistent across `xfadestill`, `solid01_vpt7`, and `syphon_vpt7`.
- **Identical OSC-registration boilerplate duplicated three times**: the `loadbang → #1 →
  sprintf set 1 /%i<type> → OSC-route /a → to_sources` block is copy-pasted nearly verbatim into
  `xfadestill.maxpat`, `solid01_vpt7.maxpat`, and `syphon_vpt7.maxpat` (and, presumably, into
  `hapsource.maxpat`/`xfadesource.maxpat`/`mix-vpt7.maxpat` per Task 6), rather than factored into a
  shared abstraction — copy-paste duplication typical of this Max codebase.
- **Author's own uncertainty preserved in-patch**: a Norwegian-language comment in `xfadestill.maxpat`
  reads "bør vel kun være en om gangen?" ("should probably only be one at a time?",
  `xfadestill.maxpat:2853`), left near the gated A/B channel-select logic — a first-hand sign that
  even the original author (HC Gilje) was unsure whether concurrent A/B playback was intended
  behavior or a latent bug.
- **Syphon is bidirectional but asymmetrically integrated**: `syphon_vpt7.maxpat` (client/inbound,
  one of the 8 swappable source-bank slots, up to 4 simultaneous instances `syphon1`–`syphon4`) and
  `vpt-syphonout.maxpat` (server/outbound, a single fixed instance) are separate patchers with no
  shared code, despite both wrapping closely related Syphon externals.

## Tech-debt findings
1. **[platform-gap]** `syphon_vpt7.maxpat` and `vpt-syphonout.maxpat` depend on
   `jit.gl.syphonclient.mxo` / `jit.gl.syphonserver.mxo`, which are Mac-only compiled externals (per
   `CLAUDE.md`, no Windows `.mxe64` builds exist in this repo). Since VPT8 ships for both Mac and
   Windows, the four Syphon source-bank slots (`syphon1`–`syphon4`) and the Syphon-output feature are
   silently unavailable/non-functional on Windows. Location: `vpt8 source code/patchers/syphon_vpt7.maxpat:355`
   (`jit.gl.syphonclient vpt @enable 0`) and `vpt8 source code/patchers/vpt-syphonout.maxpat:193`
   (`jit.gl.syphonserver vpt @servername output @enable 0`); externals confirmed present only as
   `.mxo` in `sourcebank.maxpat`'s `dependency_cache` (`sourcebank.maxpat:4662`, `:4666`).
   Severity: medium. Effort: high (would require sourcing/building Windows Syphon-equivalent
   externals, e.g. Spout, and branching the patch logic per platform).
2. **[hardcoded-limit]** `xfadestill.maxpat`'s file-browser `umenu` (`obj-14`) has a hard-coded
   `prefix` attribute pointing at the original author's local development path
   (`HD:/Users/hcg/lab/vpt7-2017-osx-beta03/defaultproject2017/video/`), baked into the saved patcher
   file. On any other machine this prefix won't resolve, so the folder-populate/autopopulate feature
   is effectively broken out of the box. Location: `vpt8 source code/patchers/xfadestill.maxpat`
   — `obj-14`, `"prefix"` attribute (~line 4664). Severity: low. Effort: low (replace with a relative
   or user-configurable path).
3. **[architectural-fragility]** The slot-reassignment mechanism in `sourcebank.maxpat` duplicates
   an identical `p reassign` subpatcher (containing `sel V H S M` and 4 `script sendbox … replace`
   messages) 8 times — once per `videobankNN` slot — with the only difference being the hard-coded
   slot number in each `script sendbox` message string. Any change to the type-code scheme (e.g.
   adding a 5th source type) requires editing all 8 copies in lockstep; a missed or mistyped slot
   number would silently misroute that slot's reassignment. Location:
   `vpt8 source code/patchers/sourcebank.maxpat` — 8 `p reassign` subpatchers, e.g. lines 1009-1178
   (videobank01) through 2640-2810 (videobank08); confirmed 8 occurrences of `sel V H S M` and 32
   `script sendbox … replace` messages via grep. Severity: medium. Effort: medium (would need a
   single parameterized subpatcher taking the slot number as an argument).
4. **[dead-code]** `xfadestill.maxpat` contains a `pattr on` object (`obj-27`, `saved_object_attributes`
   `{"parameter_enable": 0}`) annotated with the comment "not used, included to be compatible with
   xfadesource" — a parameter kept only for pattrstorage/interface parity with a sibling patcher, not
   because it does anything in this patcher. Location: `vpt8 source code/patchers/xfadestill.maxpat:2283`
   (comment), object at `xfadestill.maxpat:2743`. Severity: low. Effort: low.
5. **[dead-code]** Leftover debug `print` objects are wired into live signal/message paths:
   `print #1dim`, `print #1adapted`, `print #1fra`, and `print xfades` in `xfadestill.maxpat`
   (lines 950, 1453, 1467, 2618) and `print dumpout` in `syphon_vpt7.maxpat` (line 757, tapping the
   `jit.gl.syphonclient` dumpout/server-discovery chain). These write to the Max console on every
   invocation and serve no runtime purpose. Severity: low. Effort: low.
6. **[no-tests-ci]** As with the rest of this Max/MSP/Jitter codebase, none of the 5 files in this
   cluster have any automated test or CI coverage; the slot-reassignment mechanism, Syphon
   enable/disable logic, and the sources.json read/write round-trip are all verifiable only by
   opening the patch in Max and manually exercising the UI. Severity: medium. Effort: high (would
   require a Max-side test harness, which does not exist for this project).
