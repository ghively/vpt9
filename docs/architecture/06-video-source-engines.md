# Core video source engines (`hapsource`, `xfadesource`)

## Purpose
These two patchers are the core movie-playback "source" engines VPT loads into its video-source
banks. Each is a self-contained two-clip player: it reads a movie/still file into one of two
`jit.movie` decoders, crossfades between the two decoders on a GPU shader, and broadcasts the
resulting Jitter GL texture for a layer to consume. `hapsource.maxpat` decodes with the HAP hardware
codec engine; `xfadesource.maxpat` is the same engine built around the generic (`viddll`) video
engine. Both are argument-parameterized abstractions instantiated once per source-bank slot.

## Files in this cluster
- `vpt8 source code/patchers/hapsource.maxpat` (10351 lines) — HAP-codec two-clip video source; one of only two TOPLEVEL patchers in `vpt8.maxproj` (alongside `vpt7project.maxpat`).
- `vpt8 source code/patchers/xfadesource.maxpat` (10478 lines) — generic-engine (`viddll`) two-clip video source; near-identical twin of `hapsource`.

Neither file hardcodes a "videobank" name or a bank count. Each is a reusable abstraction whose
first typed-in argument `#1` is the **bank index (1–8)**. They are loaded into the eight
`videobankNN` bpatcher slots defined in `sourcebank.maxpat` (a Task 7 file). In the shipped default
project state those slots are saved as: `videobank01`, `videobank02`, `videobank03` → `xfadesource`
(args `[1]`,`[2]`,`[3]`); `videobank04`, `videobank06` → `hapsource` (args `[4]`,`[6]`);
`videobank05`, `videobank08` → `mix-vpt7`; `videobank07` → `xfadestill`
(`sourcebank.maxpat` lines 3716–3897). Any bank can be hot-swapped to any of those four patcher
types at runtime via `sourcebank.maxpat`'s `script sendbox videobankNN replace hapsource` /
`… replace xfadesource` messages. So this cluster supplies two of the four selectable source-patcher
types for the shared 8-slot source-bank rack; the bank naming/count lives in Task 7's `sourcebank`.

## Key patchers & subpatchers
Both files share an essentially identical internal structure. Toplevel objects of interest (line
numbers cited from `hapsource.maxpat` unless noted):

- **Two `jit.movie` decoders (the "A" and "B" clips).**
  - `hapsource`: `jit.movie @engine hap @output_texture 1 @colormode uyuv @drawto vpt @autostart 1`
    — `obj-4` (line 8553) and `obj-22` (line 8446).
  - `xfadesource`: `jit.movie @output_texture 1 @engine viddll @drawto vpt @autostart 1 @colormode uyuv`
    — `obj-4` (line 8630) and `obj-22` (line 8523).
  Files/clips are routed alternately to A vs B by `gate 2` objects gated on `r #1play`, so a new clip
  loads into the idle decoder and is then crossfaded in.
- **Crossfade compositor:** `jit.gl.slab vpt @file co.xfade.jxs` (`obj-61`, hapsource line 8431 /
  xfadesource line 8508). Blends the A and B textures; blend amount driven by the `xfade` pattr
  (`param xfade $1`, `obj-122`).
- **`p qtmovie_info`** (`obj-57`, hapsource line 4420) — wraps a `route read duration timescale
  loopnotify time loop dim rate looppoints moviedim`; polls each decoder (`gettimescale, getduration,
  getloop, getdim, getrate, getlooppoints, getmoviedim`) and distributes per-clip playback state
  (in/out loop points, rate, dim, duration) via `#1…` sends.
- **`p adapt`** (`obj-125`, line 2114) — rescales output dim to a fraction (F, 2/3, 1/2, 1/3, 1/4,
  1/8, 1/16) selected by the `uidim` umenu.
- **`p umenuCtrl`** (`obj-49`, line 3190) — populates the clip `umenu` and prepends an `OFF` entry.
- **`p playlist`** (nested inside `obj-83`) — steps a `1 2 3` playlist counter for auto-advance.
- **`p audioline`** (nested inside `obj-83`) — `line~`/`snapshot~` audio fade ramp.
- **`p pan`** (`obj-183`, line 531) — audio `trackpan 1/2 $1` from a −1..1 scaled control.
- **`p workaround`** (`obj-131`, line 1594) — `zl compare`/`gate` guard that suppresses re-triggering
  the same `videopath` value.
- **Clip picker UI:** a `dropfile` (`obj-18`) plus an `autopopulate` clip `umenu` (`obj-14`,
  hapsource line 8511 / xfadesource line 8588) with a saved file list and folder `prefix`.
- **`jit.pwindow` monitor** (`obj-35`) gated by `r monitor` for the small source preview.

## Data flow
All `#1…` names below have `#1` substituted with the bank index (1–8), e.g. bank 4 uses `4play`,
`4video`, `/4video/...`. Names are literal strings from the patchers.

Per-bank internal sends/receives (`s`/`r`):
- `#1play` — master play/gate signal (many `r #1play`), routes clips into the A/B decoders.
- `#1A`, `#1B` — messages to the A and B `jit.movie` decoders; `#1both` — broadcast to both.
- `#1video` — **output**: `s #1video` (`obj-26`, hapsource line 6818 / xfadesource line 6895)
  broadcasts the crossfaded `jit_gl_texture` reference. This is the source's output boundary.
- `#1umenu`, `#1count`, `#1foldertrig` — clip-list selection/refresh.
- `#1rate` — playback rate; `#1cliptime` — normalized playhead; `#1playlist` — playlist list.
- `#1loopA`, `#1loopB` — loop-mode per decoder; `#1Ain`/`#1Aout`/`#1Bin`/`#1Bout` — loop in/out
  points; `#1Ascrub`/`#1Bscrub` — scrub; `#1Aloopreset`/`#1Bloopreset` — loop reset;
  `#1Acurduration`/`#1Bcurduration` (`value` objects).
- `#1dim`, `#1moviedim` — output/source dimensions.
- Debug prints: `print #1pattr_vpath`, `print #1adapted`, `print #1fra` (left active).

Global (un-prefixed) sends/receives connecting the bank to the rest of the app:
- `r globalfade`, `r monitor`, `r vpt_metro` (frame clock), `r cuetrig`, `r presettrig`,
  `r f_sourcespreset`, `r videopath`, `r foldertrig`, `r qttrig`.
- `r trigvideo` and `r to_sources` (`obj-110`/`obj-111`) — the incoming OSC command bus.
- `xfadesource` additionally has a toplevel `s rate` (`obj-10`, line 101).

OSC command surface (the source's remote-control API). `r to_sources` is filtered to this bank by
building a per-index match address — `sprintf set 1 /%ivideo` (`obj-113`) feeds `OSC-route /a`
(`obj-112`) — so this bank only accepts messages addressed `/<index>video/...`. The matched payload
then hits the main dispatcher `obj-74`:
- `hapsource` (`obj-74`, line 3757): `OSC-route /clip /clipnr /rate /loop /xfade /resolution /trig
  /on /vol /loopreport /last /random /scrub /start /stop /in /out /loopreset /pan /playlist /play
  /soc /cliptime /com /alpha` (25 addresses).
- `xfadesource` (`obj-74`, line 3834): the same list plus a trailing `/viddll` (26 addresses).
The global side of this address space is `sprintf /sources/%ivideo/%s` in `clipcontrol.maxpat`
(line 3445) and `sprintf set 1 /%ivideo` in `mix-vpt7.maxpat` (line 278).

`pattrstorage` bindings. The pattr varnames inside each source are `video`, `xfade`, `loop`,
`volume`, `on`, `rate`, `alpha`, `resolution`, `videopath`, `autotrig`, `refreshrate`, `in`, `out`.
Because the hosting bpatcher's scripting name is `videobankNN`, these are namespaced as
`videobankNN::<name>` in the saved project. Concretely, `vpt7project.maxpat`'s stored state contains
`videobank01::loop`, `videobank01::video`, `videobank01::on`, `videobank01::alpha`,
`videobank01::resolution`, `videobank01::videopath` (lines 3643–3648) — exactly the single-source
pattr set these two patchers expose (contrast `videobank05::A`/`::B`/`::mixtype`, a `mix-vpt7` bank).

Output → layer path. The final crossfaded texture leaves each source only via `s #1video`
(send name `<index>video`, e.g. `4video`), carrying a `jit_gl_texture` reference on the shared `vpt`
GL context. A layer engine instance (`vlayer.maxpat`, Task 3) selects a source and receives that
named texture downstream; the selection/routing itself lives in the layer/mixer patchers, not in
these source files (neither `hapsource` nor `xfadesource` names a layer or `videobank` receiver).

## Dependencies
- **Shaders:** `shaders/v001 Mixers/`-adjacent `co.xfade.jxs`, referenced by the crossfade
  `jit.gl.slab vpt @file co.xfade.jxs` (`obj-61`).
- **Externals:** `externals/OSC-route.mxo`, referenced by the OSC dispatch objects (`obj-74`,
  `obj-112`) and recorded in each file's `dependency_cache` (`xfadesource.maxpat` line 10471,
  `"name" : "OSC-route.mxo"`). Per `CLAUDE.md`, bundled externals are Mac-only `.mxo` binaries with
  no Windows `.mxe64` counterpart.
- **Jitter GL objects:** `jit.movie`, `jit.gl.slab`, `jit.pwindow`, `jit.qball` — stock Jitter, but
  the `jit.movie` decode `@engine` is pinned per file (`hap` vs `viddll`).
- **No `code/*.js`** scripts are referenced by either patcher.

## Notable patterns
- **`#1` is a number, not a name.** The bank index arrives as the bpatcher's typed-in arg `[N]`
  (`sourcebank.maxpat` lines 3718–3897), so every `s/r #1…` resolves to `<N>…` (`4play`, `4video`)
  and OSC addresses are `/<N>video/...`. Bank *identity for pattr* comes from a separate channel —
  the bpatcher **scripting name** `videobankNN` — so the integer arg and the scripting name must be
  kept in lockstep by hand (bank 4's bpatcher must be created with arg `4`).
- **Internal A/B crossfade vs. bank-level crossfade.** These patchers already crossfade *two clips*
  of a single source. That is distinct from `mix-vpt7` (Task 5), which crossfades *two whole banks*.
  Do not conflate the two `xfade` mechanisms.
- **`hapsource` ≈ `xfadesource`.** The two files are line-for-line near-identical; they diverge
  almost entirely in (a) the `jit.movie @engine` attribute (`hap` vs `viddll`), (b) the extra
  `/viddll` OSC address in `xfadesource`, (c) the saved clip `umenu` contents and folder `prefix`,
  and (d) a cosmetic comment (`hap` vs `v`). Behavioral edits generally must be mirrored across both
  (and the related `xfadestill.maxpat`, Task 7).
- **Vestigial parity object.** `pattr refreshrate` is annotated `not used, included to be compatible
  with xfadestill` (hapsource line 2003 / xfadesource line 2080) — kept only so the three source
  types share a pattr shape.
- **Debug prints and dev notes left in.** Active `print` objects (`print vpath`, `print duration`,
  `print timescale`, `print #1adapted`, `print #1fra`, `print #1pattr_vpath`) and a Norwegian design
  note `bør vel kun være en om gangen?` ("should probably only be one at a time?", hapsource line
  4306 / xfadesource line 4384) remain in the shipped patchers.

## Tech-debt findings
1. **[architectural-fragility]** `hapsource.maxpat` (10351 lines) and `xfadesource.maxpat` (10478
   lines) are near-verbatim duplicates of the entire clip-player/crossfade/OSC/pattr machinery,
   differing meaningfully only in the two `jit.movie @engine` attributes and the umenu defaults;
   the logic is copy-pasted rather than parameterized. Any behavioral fix must be mirrored across
   both (and `xfadestill.maxpat`). Location: `vpt8 source code/patchers/hapsource.maxpat` vs
   `vpt8 source code/patchers/xfadesource.maxpat` (whole-file). Severity: medium. Effort: high.
2. **[platform-gap]** `xfadesource.maxpat` pins `jit.movie @engine viddll` on both decoders (lines
   8523 and 8630) — `viddll` is the Windows DirectShow engine — while VPT ships for Mac too (where
   the engine is `avf`); `hapsource.maxpat` correspondingly pins `@engine hap` (lines 8446, 8553).
   Hardcoding a platform-specific engine name relies on Max's silent fallback across platforms.
   Location: `vpt8 source code/patchers/xfadesource.maxpat` — `jit.movie @output_texture 1 @engine viddll …`.
   Severity: medium. Effort: low.
3. **[closed-dependency]** The entire OSC control surface of both sources depends on the Mac-only
   `OSC-route.mxo` external (`obj-74`, `obj-112`; recorded in `dependency_cache`), for which no
   Windows binary is bundled. Location: `vpt8 source code/patchers/xfadesource.maxpat` — line 10471
   `"name" : "OSC-route.mxo"` (same in `hapsource.maxpat`). Severity: medium. Effort: medium.
4. **[dead-code]** Both clip `umenu`s carry stale saved state pointing at the original developer's
   machine: `prefix` `HD:/Users/hcg/Desktop/vpt2012lab/default kopi/video/` (hapsource line 8531)
   and `HD:/Users/hcg/lab/vpt7-2017-osx-beta03/defaultproject2017/video/` (xfadesource line 8608),
   plus hardcoded lists of the author's personal sample clips (`alphatest.mov`, `maja.mov`,
   `xlive101.mov`, `petanque.mov`, `prisme.mov`, …). These paths resolve on no other install.
   Location: `vpt8 source code/patchers/hapsource.maxpat` line 8531; `xfadesource.maxpat` line 8608.
   Severity: low. Effort: low.
5. **[dead-code]** Explicitly-dead parameter: `pattr refreshrate` is commented `not used, included to
   be compatible with xfadestill`. Location: `vpt8 source code/patchers/hapsource.maxpat` line 2003
   (and `xfadesource.maxpat` line 2080). Severity: low. Effort: low.
6. **[dead-code]** Active debug `print` objects and an unresolved Norwegian design-question comment
   remain in the shipped patchers, dumping to the Max console. Location:
   `vpt8 source code/patchers/hapsource.maxpat` — `bør vel kun være en om gangen?` (line 4306),
   `print vpath` (line 1291), `print #1pattr_vpath` (line 1220). Severity: low. Effort: low.
7. **[naming-inconsistency]** A bank's identity is split across two hand-synchronized channels: the
   integer arg `#1` (drives all `s/r #1…` sends and `/<N>video` OSC routing) and the bpatcher
   scripting name `videobankNN` (drives the `videobankNN::…` pattr namespace). A mismatch between the
   two silently misroutes control and state with no error. Location:
   `vpt8 source code/patchers/hapsource.maxpat` `s #1video` (line 6818) / `sprintf set 1 /%ivideo`
   (line 3638) vs. `sourcebank.maxpat` `args`/`varname` pairing (lines 3716–3897). Severity: medium.
   Effort: medium.
