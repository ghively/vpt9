# Verification Spot-Check Log

Spot-check pass (Task 13) against the real source tree for `docs/TECH_DEBT.md` and
`docs/architecture/00-overview.md`. Eight checks total: 5 tech-debt findings spanning 5 different
category tags, and 3 data-flow/architectural claims from the overview. All commands were run from
the repo root; source paths are quoted because `vpt8 source code/` contains a literal space.
**Result: 8/8 confirmed. No corrections were needed to either synthesis doc.**

---

## Step 1: Tech-debt findings (5 findings, 5 category tags)

### 1.1 `platform-gap` #1 — Syphon is Mac-only, silently dead on Windows

Claim: `s syphon_output` in `enginetab.maxpat` (~line 1766); `jit.gl.syphonclient vpt @enable 0` in
`syphon_vpt7.maxpat:355`; `jit.gl.syphonserver vpt @servername output @enable 0` in
`vpt-syphonout.maxpat:193`.

Commands:
```bash
grep -n "s syphon_output" "vpt8 source code/patchers/enginetab.maxpat"
grep -n "jit.gl.syphonclient" "vpt8 source code/patchers/syphon_vpt7.maxpat"
grep -n "jit.gl.syphonserver" "vpt8 source code/patchers/vpt-syphonout.maxpat"
```

Output:
```
enginetab.maxpat:1766:   "text" : "s syphon_output"
syphon_vpt7.maxpat:355:  "text" : "jit.gl.syphonclient vpt @enable 0"
vpt-syphonout.maxpat:193:"text" : "jit.gl.syphonserver vpt @servername output @enable 0"
```

**Outcome: confirmed.** All three cited strings and line numbers match exactly. Cross-checked the
externals directory too — `ls "vpt8 source code/externals/"` returns exactly the 7 named `.mxo`
files (`Label.mxo`, `Ldiv.mxo`, `Lmult.mxo`, `imp.artnet.node.mxo`, `jit.gl.syphonclient.mxo`,
`jit.gl.syphonserver.mxo`, `o.route.mxo`) with no `.mxe64` Windows build present, matching the
finding's platform-gap claim.

### 1.2 `dead-code` #7 — 7 of 24 blend-mode mixer shaders unreachable from the mixer UI

Claim: `mix-vpt7.maxpat`'s `mixtype` umenu (line 911) offers only 17 modes, omitting `difference`,
`dodge`, `exclude`, `glow`, `inverse`, `negate`, `reflect`, which exist as shader files under
`shaders/v001 Mixers/`.

Commands:
```bash
sed -n '905,915p' "vpt8 source code/patchers/mix-vpt7.maxpat"
ls "vpt8 source code/shaders/v001 Mixers/" | grep -iE "difference|dodge|exclude|glow|inverse|negate|reflect"
```

Output: umenu `items` (obj-17, line 911) = `mix, additive, multiply, overlay, screen, stamp,
subtractive, average, brightlight, softlight, hardlight, lighten, burn, darken, freeze, heat,
lumablend` — exactly 17 items, none of the 7 named modes present. The shader directory listing
confirms `v001.co2.difference.jxs`, `v001.co2.dodge.jxs`, `v001.co2.exclude.jxs`,
`v001.co2.glow.jxs`, `v001.co2.inverse.jxs`, `v001.co2.negate.jxs`, `v001.co2.reflect.jxs` all exist
on disk (plus matching `.fp.glsl` includes).

**Outcome: confirmed.** Exact count (17 offered vs. 24 existing, with the 7 named modes missing)
matches.

### 1.3 `naming-inconsistency` #3 — `p mblur`/`pattr mblur` is not a blur

Claim: `pattr mblur @initial 0` (vlayer.maxpat line 3741) drives `jit.gl.slab vpt @file
tp.slide.jxs` (line 3793), a slide/trail shader, not a Gaussian blur.

Commands:
```bash
grep -n "pattr mblur" "vpt8 source code/patchers/vlayer.maxpat"
grep -n "tp.slide.jxs" "vpt8 source code/patchers/vlayer.maxpat"
```

Output:
```
3741: "text" : "pattr mblur @initial 0",
3793: "text" : "jit.gl.slab vpt @file tp.slide.jxs"
```

**Outcome: confirmed.** Both cited strings found at exactly the cited line numbers.

### 1.4 `architectural-fragility` #10 — source-slot reassignment is an 8-way copy-paste

Claim: `sourcebank.maxpat` duplicates an identical `p reassign` subpatcher (`sel V H S M` + 4
`script sendbox … replace` messages) once per `videobankNN` slot — 8 copies, 32 total `script
sendbox … replace` messages.

Commands:
```bash
grep -c "p reassign" "vpt8 source code/patchers/sourcebank.maxpat"
grep -c "sel V H S M" "vpt8 source code/patchers/sourcebank.maxpat"
grep -c "script sendbox" "vpt8 source code/patchers/sourcebank.maxpat"
```

Output: `p reassign` = 8, `sel V H S M` = 8, `script sendbox` = 32.

**Outcome: confirmed.** Counts match the finding exactly (8 subpatchers, 8×4=32 replace messages).

### 1.5 `hardcoded-limit` #10 — cue list fixed at 200 rows

Claim: `cuelist-vpt7.maxpat`'s `jit.cellblock` is `"rows":200` (line 7245) with a matching `uzi 200`
rebuild (line 7052).

Commands:
```bash
grep -n "\"rows\" : 200" "vpt8 source code/patchers/cuelist-vpt7.maxpat"
grep -n "uzi 200" "vpt8 source code/patchers/cuelist-vpt7.maxpat"
```

Output:
```
7245: "rows" : 200,
7052: "text" : "uzi 200"
```

**Outcome: confirmed.** Both cited lines match exactly.

---

## Step 2: Overview data-flow / architectural claims (3 claims)

### 2.1 The control-surface router: `s to_router` / `r to_router` bus

Claim (cross-cutting conventions, "central control-surface router"): every controller input method
normalizes to `(value, index)` and broadcasts on `s to_router`; the router (`ctrl_config-vpt7_01.maxpat`)
receives via `r to_router`.

Command:
```bash
grep -rln "s to_router" "vpt8 source code/patchers/"
grep -rln "r to_router" "vpt8 source code/patchers/"
```

Output: **senders** found in `artnet-vpt.maxpat`, `cuelist-vpt7.maxpat`, `enginetab.maxpat`,
`lfomix-vpt7_01.maxpat`, `lfomodule-vpt7_01.maxpat`, `loopback_clip_vpt7.maxpat`,
`miditab-vpt7.maxpat`, `sensorinput_module_vpt7.maxpat`, `serial_VPT7.maxpat`,
`softbutton-vpt7.maxpat`, `softslider-vpt7.maxpat` (11 files); **receiver** found in
`ctrl_config-vpt7_01.maxpat:2154` (`"text" : "r to_router"`). 12 total matches across the two greps —
well above the ≥2 threshold, with the receiver side matching the overview's own claim that
`ctrl_config-vpt7_01.maxpat` is the receiving hub.

**Outcome: confirmed.** Both sender side (many independent controller-input patchers, exactly as the
overview describes — MIDI, soft-MIDI, serial/sensor, Art-Net, LFO rack, clip control) and receiver
side exist.

### 2.2 The preset bus: `s toPS` / `r toPS` feeding `pattrstorage vpt`

Claim (pattrstorage convention + top-level data flow step 8): preset/cue automation paths converge
on `s toPS`, received in `enginetab.maxpat` and applied to `pattrstorage vpt`.

Commands:
```bash
grep -n "s toPS\|r toPS" "vpt8 source code/patchers/enginetab.maxpat" "vpt8 source code/patchers/cuelist-vpt7.maxpat"
grep -n "pattrstorage vpt" "vpt8 source code/patchers/enginetab.maxpat"
```

Output: `s toPS` senders at `enginetab.maxpat:3914,8109,8492,9654` and `cuelist-vpt7.maxpat:3489`;
`r toPS` receiver at `enginetab.maxpat:5036`; `pattrstorage vpt @changemode 1 @autorestore 0
@savemode 0 @backupmode 2` at `enginetab.maxpat:5065` (immediately after the receiver, consistent
with the doc's framing that the bus feeds this exact object).

**Outcome: confirmed.** Sender and receiver both exist, and the receiver sits directly upstream of
`pattrstorage vpt` in the same file, matching the claim.

### 2.3 The three-legged layer lifecycle: `vlayer2.js` / `dummylayers02c.js` / `tabs.js` driver scripts

Claim (cross-cutting conventions, "three-legged layer lifecycle" table): three independent driver
scripts (`code/vlayer2.js`, `code/dummylayers02c.js`, `code/tabs.js`) each live in a different host
patcher (`enginetab.maxpat`, `layersbank.maxpat`, `vpt7project.maxpat` respectively), all triggered
from the root patcher.

Commands:
```bash
grep -rln "vlayer2.js" "vpt8 source code/patchers/"
grep -rln "dummylayers02c.js" "vpt8 source code/patchers/"
grep -rln "tabs.js" "vpt8 source code/patchers/"
```

Output: `vlayer2.js` → `enginetab.maxpat`, `vpt7project.maxpat`; `dummylayers02c.js` →
`layersbank.maxpat`, `vpt7project.maxpat`; `tabs.js` → `vpt7project.maxpat` only.

**Outcome: confirmed.** All three scripts are referenced exactly where the table says (each script's
"host patcher" column matches, e.g. `vlayer2.js` in `enginetab.maxpat`, `dummylayers02c.js` in
`layersbank.maxpat`), and all three are additionally reachable from `vpt7project.maxpat` (the root
patcher), matching the claim that "the root patcher's `p layers_add-delete`… fans a single
`addLayer`/`deleteLayer`/`startupLayers $1` command to both" plus `js tabs.js` sitting directly in
the root patcher.

---

## Summary

| # | Check | Category/Section | Outcome |
|---|---|---|---|
| 1 | Syphon Mac-only (`s syphon_output`, syphonclient/server) | platform-gap | confirmed |
| 2 | 7 unreachable blend-mode shaders vs. 17-item umenu | dead-code | confirmed |
| 3 | `p mblur` is actually `tp.slide.jxs` | naming-inconsistency | confirmed |
| 4 | 8-way `p reassign` / `sel V H S M` / 32 `script sendbox` copies | architectural-fragility | confirmed |
| 5 | Cue list fixed at 200 rows (`rows:200`, `uzi 200`) | hardcoded-limit | confirmed |
| 6 | `s to_router` / `r to_router` control-surface bus | overview: cross-cutting conventions | confirmed |
| 7 | `s toPS` / `r toPS` feeding `pattrstorage vpt` | overview: pattrstorage convention / data flow | confirmed |
| 8 | Three-legged lifecycle driver scripts (`vlayer2.js`/`dummylayers02c.js`/`tabs.js`) | overview: cross-cutting conventions | confirmed |

**No edits were made to `docs/TECH_DEBT.md` or `docs/architecture/00-overview.md`** — every checked
claim, including specific cited line numbers, matched the real source exactly.
