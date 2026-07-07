# VPT8 Architecture Audit & Developer Onboarding Map Implementation Plan

> **STATUS: COMPLETED (2026-07-02).** Every task below was executed via
> superpowers:subagent-driven-development, not the checkbox-tracking executing-plans skill, so the
> `- [ ] Step N` boxes below were never checked off even though the work is done. All deliverables
> exist and are current: `docs/architecture/00-overview.md` + the 11 per-cluster module docs,
> `docs/TECH_DEBT.md`, `docs/architecture/VERIFICATION-LOG.md`, and the `CLAUDE.md`/`AGENTS.md`
> pointer section. Kept here as a historical record of how that work was scoped — do not treat the
> unchecked boxes below as open work.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a complete, verified architecture map and technical-debt catalog for the VPT8
Max/MSP/Jitter codebase by reading every patcher, script, shader, and data file in full, so future
developers/agents can navigate and modify it safely and a modernization roadmap can later be scoped
from real evidence.

**Architecture:** One research-and-write task per functional cluster (11 clusters, covering all 49
`.maxpat` patchers plus all scripts/shaders/data/externals), each producing a self-contained module
doc under `docs/architecture/` using a shared template. A synthesis task then merges all 11 into a
system overview (`00-overview.md`) and a deduplicated tech-debt catalog (`TECH_DEBT.md`). A
verification task spot-checks claims against source. A final task adds a pointer section to
`CLAUDE.md`.

**Tech Stack:** N/A — this is a documentation deliverable, not code. Source material is Cycling '74
Max/MSP/Jitter (`.maxpat` JSON patchers, `.js` scripts using Max's embedded JS engine, `.jxs`/`.glsl`
Jitter shaders, `.json` pattrstorage dumps). Read/Grep/Glob are the only tools needed against source;
Write/Edit produce the docs.

## Global Constraints

- All source files live under `vpt8 source code/` (note the space in the directory name — always
  quote paths in shell commands).
- Every file assigned to a cluster must be read **in full** — no sampling or truncation. Several
  `.maxpat` files exceed the default single-Read window (up to 23,229 lines); page through with
  repeated `Read` calls using `offset`/`limit` until the entire file has been seen. Do not write a
  module doc section based on a partial read.
- Every module doc must follow the **Module Doc Template** below exactly — all sections present, no
  placeholder text (no "TBD", "TODO", "similar to X", or vague hand-waving).
- Every tech-debt finding must cite a concrete source location: file path, plus a line number/range
  for `.js`/`.jxs`/`.glsl` files, or a unique JSON key path / surrounding string for `.maxpat` JSON
  (line numbers in `.maxpat` files are fragile — a nearby unique string like an object's `varname` or
  `text` field is a more durable citation).
- Git identity is already configured in this repo (`Gene Hively` / `genehively@gmail.com`); commit
  after every task.
- Never delete or rewrite the *source* `vpt8 source code/` tree in this plan — this is a read-only
  audit. Only files under `docs/` and `CLAUDE.md` are created/modified.

### Module Doc Template

Every per-cluster doc produced by Tasks 1–11 must use exactly this structure:

```markdown
# <Cluster Title>

## Purpose
<what this module does in the running application, 2-4 sentences>

## Files in this cluster
- `vpt8 source code/patchers/<file1>.maxpat` (<line count> lines)
- <one line per file actually covered, with its real line count>

## Key patchers & subpatchers
<for each file: its toplevel objects of interest, and any bpatchers/subpatchers it contains or
instantiates — whether wired statically in the patcher or created dynamically (e.g. a `[js]` object
calling `this.patcher.newdefault(...)`) — and what each one is for>

## Data flow
<every `send`/`receive` pair name, OSC-style message string, and `pattr`/`pattrstorage` binding that
connects this module to the rest of the app, and what value/message it carries. Name the literal
string used (e.g. `send 3layer_init`), not a paraphrase.>

## Dependencies
<which `code/*.js` scripts, `shaders/*.jxs`, or `externals/*.mxo` this module's patchers reference,
and which object in which file references them>

## Notable patterns
<conventions, quirks, or non-obvious coupling worth knowing before modifying this module>

## Tech-debt findings
1. **[category-tag]** <description>. Location: `<file>` — `<line/range or unique string>`.
   Severity: <low|medium|high>. Effort: <low|medium|high>.
2. ...
```

Valid category tags (use exactly these): `platform-gap`, `toolchain-version`, `closed-dependency`,
`dead-code`, `naming-inconsistency`, `architectural-fragility`, `hardcoded-limit`, `no-tests-ci`,
`licensing`. A cluster with zero findings in a category simply omits that tag — never invent a
finding to fill a category.

---

### Task 1: App shell & root

**Files:**
- Create: `docs/architecture/01-app-shell.md`
- Read (do not modify): `vpt8 source code/patchers/vpt7project.maxpat` (7194 lines), `vpt8 source code/patchers/prefs.maxpat` (3675 lines), `vpt8 source code/patchers/vpt7_info.maxpat` (442 lines), `vpt8 source code/patchers/vpt7_keys.maxpat` (219 lines), `vpt8 source code/patchers/livemodule-vpt7.maxpat` (4244 lines), `vpt8 source code/patchers/livemodule_d.maxpat` (150 lines)

**Interfaces:**
- Consumes: the 6 source files listed above (this is the toplevel application patcher plus prefs/info/keys/live-mode support patchers)
- Produces: `docs/architecture/01-app-shell.md`, consumed by Task 12 (synthesis)

- [ ] **Step 1: Read every file in this cluster in full**

  Read each of the 6 files listed above completely, using repeated `Read` calls with `offset`/`limit`
  for any file longer than one read window. `vpt7project.maxpat` is the toplevel patcher per
  `vpt8 source code/vpt8.maxproj` — pay particular attention to what it wires together (it is the
  root of the whole application graph) and where it embeds the `code/tabs.js` script (already known
  from prior exploration to instantiate `layertab` bpatchers).

- [ ] **Step 2: Write `docs/architecture/01-app-shell.md`**

  Follow the Module Doc Template exactly. Cover: what boots first when the app opens, how
  preferences are loaded/saved (`prefs.maxpat`), what `vpt7_info.maxpat` and `vpt7_keys.maxpat` are
  for, and what "live module" (`livemodule-vpt7.maxpat` / `livemodule_d.maxpat`) does. Include every
  `send`/`receive` name and `pattrstorage` reference you find touching these files.

- [ ] **Step 3: Verify structural completeness**

  Run (from the repo root):
  ```bash
  grep -c "^## " "docs/architecture/01-app-shell.md"
  ```
  Expected: `7` (Purpose, Files in this cluster, Key patchers & subpatchers, Data flow,
  Dependencies, Notable patterns, Tech-debt findings — 7 top-level `##` headers). Then run:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/01-app-shell.md"
  ```
  Expected: no output (no matches). If either check fails, fix the doc before continuing.

- [ ] **Step 4: Spot-check against source**

  Pick 3 specific claims written in the doc's "Key patchers & subpatchers" or "Data flow" sections
  (e.g. a named object, a `send`/`receive` string, a subpatcher name). For each, run a grep against
  the actual source file to confirm the string really appears, e.g.:
  ```bash
  grep -n "tabs.js" "vpt8 source code/patchers/vpt7project.maxpat"
  ```
  If any claim doesn't check out, correct the doc.

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/01-app-shell.md
  git commit -m "Add app-shell architecture doc (cluster 1/11)"
  ```

---

### Task 2: Layer engine core

**Files:**
- Create: `docs/architecture/02-layer-engine-core.md`
- Read (do not modify): `vpt8 source code/patchers/enginetab.maxpat` (23229 lines — the single
  largest file in the codebase)

**Interfaces:**
- Consumes: `enginetab.maxpat`
- Produces: `docs/architecture/02-layer-engine-core.md`, consumed by Task 12

- [ ] **Step 1: Read the file in full**

  This file is large; expect to need ~12 or more sequential `Read` calls with increasing `offset`
  (e.g. 2000-line windows) to see the whole thing. Do not summarize from a partial read. Note: prior
  exploration found `code/vlayer2.js` is embedded somewhere in this patcher family
  (`patchers/enginetab.maxpat` per earlier grep) driving dynamic `vlayer` bpatcher
  instantiation/reordering — confirm exactly where and how in this file.

- [ ] **Step 2: Write `docs/architecture/02-layer-engine-core.md`**

  Follow the Module Doc Template exactly. This is the core video-processing engine tab — document
  how many layer engine instances it manages, how layer add/delete/reorder messages
  (`send N layer_init`, `movelayer`, etc. — from `vlayer2.js`) are received and acted on here, and how
  this patcher connects to the video-source clusters (Tasks 6–7) and the mixing patcher
  (`mix-vpt7.maxpat`, Task 5).

- [ ] **Step 3: Verify structural completeness**

  ```bash
  grep -c "^## " "docs/architecture/02-layer-engine-core.md"
  ```
  Expected: `7`. Then:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/02-layer-engine-core.md"
  ```
  Expected: no output.

- [ ] **Step 4: Spot-check against source**

  Confirm 3 specific claims (e.g. a `send`/`receive` name, a bpatcher name, a shader reference) by
  grepping `enginetab.maxpat` directly, e.g.:
  ```bash
  grep -n "layer_init" "vpt8 source code/patchers/enginetab.maxpat"
  ```
  Fix the doc if any claim doesn't hold up.

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/02-layer-engine-core.md
  git commit -m "Add layer-engine-core architecture doc (cluster 2/11)"
  ```

---

### Task 3: Per-layer engine instance

**Files:**
- Create: `docs/architecture/03-layer-engine-instance.md`
- Read (do not modify): `vpt8 source code/patchers/vlayer.maxpat` (10142 lines), `vpt8 source code/patchers/jit.gl.slab.gauss6x.maxpat` (588 lines)

**Interfaces:**
- Consumes: `vlayer.maxpat`, `jit.gl.slab.gauss6x.maxpat`
- Produces: `docs/architecture/03-layer-engine-instance.md`, consumed by Task 12

- [ ] **Step 1: Read both files in full**

  `vlayer.maxpat` is the bpatcher template instantiated per-layer by `code/vlayer2.js` (per
  `addLayer()`/`startupLayers()` in that script, already known from prior exploration — each instance
  is named `"<N>layer"` via `@varname`). `jit.gl.slab.gauss6x.maxpat` is a custom 6-pass Gaussian
  blur slab likely used as a GL effect inside the layer chain — confirm where it's referenced from.

- [ ] **Step 2: Write `docs/architecture/03-layer-engine-instance.md`**

  Follow the Module Doc Template exactly. Document what one layer instance actually does end to end
  (its GL processing chain: source in, effects/masking/warping applied, output), which shaders
  (Task 11's cluster) it invokes and in what order, and which `@varname`/`@args` conventions the
  instantiator (`vlayer2.js` in Task 2/11) relies on.

- [ ] **Step 3: Verify structural completeness**

  ```bash
  grep -c "^## " "docs/architecture/03-layer-engine-instance.md"
  ```
  Expected: `7`. Then:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/03-layer-engine-instance.md"
  ```
  Expected: no output.

- [ ] **Step 4: Spot-check against source**

  Confirm 3 claims (e.g. a shader filename, a jit.gl object, a `@varname` pattern) directly against
  `vlayer.maxpat`, e.g.:
  ```bash
  grep -n "jit.gl.slab" "vpt8 source code/patchers/vlayer.maxpat"
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/03-layer-engine-instance.md
  git commit -m "Add layer-engine-instance architecture doc (cluster 3/11)"
  ```

---

### Task 4: Layer select, masking & warping

**Files:**
- Create: `docs/architecture/04-layer-select-masking-warping.md`
- Read (do not modify): `vpt8 source code/patchers/activelayer.maxpat` (9360 lines), `vpt8 source code/patchers/layermask.maxpat` (2354 lines), `vpt8 source code/patchers/gridcontroller.maxpat` (2717 lines), `vpt8 source code/patchers/pointmask.maxpat` (4656 lines)

**Interfaces:**
- Consumes: the 4 files listed above
- Produces: `docs/architecture/04-layer-select-masking-warping.md`, consumed by Task 12

- [ ] **Step 1: Read every file in this cluster in full**

  Prior exploration found `code/pointmask01.js` and `code/pointgrid01b.js` are embedded across
  `pointmask.maxpat`, `gridcontroller.maxpat`, `controltabs.maxpat` (Task 5), and `activelayer.maxpat`
  — these implement `mgraphics`-based draggable-point editors for masking and geometric
  warp/projection correction. Confirm exactly how each of these 4 patchers uses them, and what
  "active layer" selection (`activelayer.maxpat`) actually means/controls.

- [ ] **Step 2: Write `docs/architecture/04-layer-select-masking-warping.md`**

  Follow the Module Doc Template exactly. Explain the relationship between "active layer" selection
  and the mask/warp editors — i.e. does the point editor always edit the currently active layer, or
  can multiple be edited independently? Document the `mouse`/`button_down`/`button_up`/`mouse_loc`
  message contract these scripts expect from their host patchers.

- [ ] **Step 3: Verify structural completeness**

  ```bash
  grep -c "^## " "docs/architecture/04-layer-select-masking-warping.md"
  ```
  Expected: `7`. Then:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/04-layer-select-masking-warping.md"
  ```
  Expected: no output.

- [ ] **Step 4: Spot-check against source**

  ```bash
  grep -n "pointmask01.js\|pointgrid01b.js" "vpt8 source code/patchers/activelayer.maxpat"
  ```
  Confirm 2 more claims similarly against the relevant file before finalizing.

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/04-layer-select-masking-warping.md
  git commit -m "Add layer-select-masking-warping architecture doc (cluster 4/11)"
  ```

---

### Task 5: Layer GUI bank/tabs, mixing & clips

**Files:**
- Create: `docs/architecture/05-layer-gui-mixing-clips.md`
- Read (do not modify): `vpt8 source code/patchers/layersbank.maxpat` (366 lines), `vpt8 source code/patchers/layergui.maxpat` (2157 lines), `vpt8 source code/patchers/layertab.maxpat` (499 lines), `vpt8 source code/patchers/controltabs.maxpat` (658 lines), `vpt8 source code/patchers/mix-vpt7.maxpat` (1560 lines), `vpt8 source code/patchers/clipcontrol.maxpat` (4762 lines), `vpt8 source code/patchers/loopback_clip_vpt7.maxpat` (470 lines)

**Interfaces:**
- Consumes: the 7 files listed above
- Produces: `docs/architecture/05-layer-gui-mixing-clips.md`, consumed by Task 12

- [ ] **Step 1: Read every file in this cluster in full**

  `layersbank.maxpat` is known from prior exploration to use `code/dummylayers02c.js` to dynamically
  instantiate `layergui` bpatchers (`patchers/layergui.maxpat`); `layertab.maxpat` is instantiated by
  `code/tabs.js` (Task 1). Confirm how `controltabs.maxpat` relates (it was found in prior
  exploration to also embed `pointmask01.js`/`pointgrid01b.js` — cross-reference with Task 4's
  findings rather than duplicating them). Read `mix-vpt7.maxpat`, `clipcontrol.maxpat`, and
  `loopback_clip_vpt7.maxpat` for how layer outputs get mixed/composited and how clip
  triggering/looping works.

- [ ] **Step 2: Write `docs/architecture/05-layer-gui-mixing-clips.md`**

  Follow the Module Doc Template exactly. Document the third leg of the layer-lifecycle pattern
  (GUI bank via `dummylayers02c.js` — the other two legs, engine and tabs, are in Tasks 2–3 and
  Task 1), and how the mixing/clip-control patchers consume layer engine output.

- [ ] **Step 3: Verify structural completeness**

  ```bash
  grep -c "^## " "docs/architecture/05-layer-gui-mixing-clips.md"
  ```
  Expected: `7`. Then:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/05-layer-gui-mixing-clips.md"
  ```
  Expected: no output.

- [ ] **Step 4: Spot-check against source**

  ```bash
  grep -n "dummylayers02c.js" "vpt8 source code/patchers/layersbank.maxpat"
  ```
  Confirm 2 more claims similarly.

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/05-layer-gui-mixing-clips.md
  git commit -m "Add layer-gui-mixing-clips architecture doc (cluster 5/11)"
  ```

---

### Task 6: Core video source engines

**Files:**
- Create: `docs/architecture/06-video-source-engines.md`
- Read (do not modify): `vpt8 source code/patchers/hapsource.maxpat` (10351 lines), `vpt8 source code/patchers/xfadesource.maxpat` (10478 lines)

**Interfaces:**
- Consumes: `hapsource.maxpat`, `xfadesource.maxpat`
- Produces: `docs/architecture/06-video-source-engines.md`, consumed by Task 12

- [ ] **Step 1: Read both files in full**

  `hapsource.maxpat` is one of the two toplevel patchers per `vpt8 source code/vpt8.maxproj` — it
  handles HAP-codec video playback. `xfadesource.maxpat` handles crossfading between two video
  sources. Both are large; page through fully with repeated `Read` calls.

- [ ] **Step 2: Write `docs/architecture/06-video-source-engines.md`**

  Follow the Module Doc Template exactly. Document the video decode/playback pipeline, how many
  source "banks" each manages (cross-reference the `videobank01`..`videobank08` naming already seen
  in `data/sources.json`), and how a source's output reaches a layer engine instance (Task 3).

- [ ] **Step 3: Verify structural completeness**

  ```bash
  grep -c "^## " "docs/architecture/06-video-source-engines.md"
  ```
  Expected: `7`. Then:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/06-video-source-engines.md"
  ```
  Expected: no output.

- [ ] **Step 4: Spot-check against source**

  ```bash
  grep -n "videobank" "vpt8 source code/patchers/hapsource.maxpat" | head -5
  ```
  Confirm 2 more claims similarly against `xfadesource.maxpat`.

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/06-video-source-engines.md
  git commit -m "Add video-source-engines architecture doc (cluster 6/11)"
  ```

---

### Task 7: Secondary video sources

**Files:**
- Create: `docs/architecture/07-secondary-video-sources.md`
- Read (do not modify): `vpt8 source code/patchers/xfadestill.maxpat` (5692 lines), `vpt8 source code/patchers/sourcebank.maxpat` (4673 lines), `vpt8 source code/patchers/solid01_vpt7.maxpat` (1032 lines), `vpt8 source code/patchers/syphon_vpt7.maxpat` (1243 lines), `vpt8 source code/patchers/vpt-syphonout.maxpat` (284 lines)

**Interfaces:**
- Consumes: the 5 files listed above
- Produces: `docs/architecture/07-secondary-video-sources.md`, consumed by Task 12

- [ ] **Step 1: Read every file in this cluster in full**

  `syphon_vpt7.maxpat` and `vpt-syphonout.maxpat` use the `jit.gl.syphonclient.mxo` /
  `jit.gl.syphonserver.mxo` externals (Mac-only GPU texture sharing) — note this cross-reference for
  the tech-debt findings on platform gaps. `solid01_vpt7.maxpat` is a solid-color source
  (`solid1`/`solid2` seen in `data/sources.json`). `sourcebank.maxpat` is likely the overall source
  selector UI tying these together with the core sources from Task 6.

- [ ] **Step 2: Write `docs/architecture/07-secondary-video-sources.md`**

  Follow the Module Doc Template exactly. Document each source type's purpose and how `sourcebank`
  routes between all source types (core + secondary). Flag the Syphon-based externals' Mac-only
  nature as a `platform-gap` finding here, with file references.

- [ ] **Step 3: Verify structural completeness**

  ```bash
  grep -c "^## " "docs/architecture/07-secondary-video-sources.md"
  ```
  Expected: `7`. Then:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/07-secondary-video-sources.md"
  ```
  Expected: no output.

- [ ] **Step 4: Spot-check against source**

  ```bash
  grep -n "jit.gl.syphonclient\|jit.gl.syphonserver" "vpt8 source code/patchers/syphon_vpt7.maxpat"
  ```
  Confirm 2 more claims similarly.

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/07-secondary-video-sources.md
  git commit -m "Add secondary-video-sources architecture doc (cluster 7/11)"
  ```

---

### Task 8: Presets & cue automation

**Files:**
- Create: `docs/architecture/08-presets-cues.md`
- Read (do not modify): `vpt8 source code/patchers/presetmodule-vpt7.maxpat` (4942 lines), `vpt8 source code/patchers/preset_cellblock.maxpat` (266 lines), `vpt8 source code/patchers/cuelist-vpt7.maxpat` (8611 lines), `vpt8 source code/patchers/copypaste.maxpat` (1223 lines), `vpt8 source code/patchers/timermodule.maxpat` (620 lines), `vpt8 source code/patchers/vpt-timersketch3.maxpat` (1596 lines)

**Interfaces:**
- Consumes: the 6 files listed above
- Produces: `docs/architecture/08-presets-cues.md`, consumed by Task 12

- [ ] **Step 1: Read every file in this cluster in full**

  These patchers govern saving/recalling whole-app state. Cross-reference with the `pattrstorage`
  dumps already understood (`data/presets.json`, `data/gui.json`, `data/sources.json`) — confirm which
  patcher(s) actually own/write those `pattrstorage` objects.

- [ ] **Step 2: Write `docs/architecture/08-presets-cues.md`**

  Follow the Module Doc Template exactly. Document how presets are stored/recalled, how the cue list
  sequences/automates preset changes over time (including any timer-driven automation via
  `timermodule.maxpat`/`vpt-timersketch3.maxpat`), and how copy/paste of layer or preset state works.

- [ ] **Step 3: Verify structural completeness**

  ```bash
  grep -c "^## " "docs/architecture/08-presets-cues.md"
  ```
  Expected: `7`. Then:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/08-presets-cues.md"
  ```
  Expected: no output.

- [ ] **Step 4: Spot-check against source**

  ```bash
  grep -n "pattrstorage" "vpt8 source code/patchers/presetmodule-vpt7.maxpat"
  ```
  Confirm 2 more claims similarly.

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/08-presets-cues.md
  git commit -m "Add presets-cues architecture doc (cluster 8/11)"
  ```

---

### Task 9: Control surfaces

**Files:**
- Create: `docs/architecture/09-control-surfaces.md`
- Read (do not modify): `vpt8 source code/patchers/miditab-vpt7.maxpat` (2392 lines), `vpt8 source code/patchers/softmidi-vpt7_01.maxpat` (932 lines), `vpt8 source code/patchers/softbutton-vpt7.maxpat` (685 lines), `vpt8 source code/patchers/softslider-vpt7.maxpat` (189 lines), `vpt8 source code/patchers/osceditor-vpt7.maxpat` (3180 lines), `vpt8 source code/patchers/osc_active.maxpat` (226 lines), `vpt8 source code/patchers/osc_pass.maxpat` (258 lines), `vpt8 source code/patchers/serial_VPT7.maxpat` (3082 lines), `vpt8 source code/patchers/sensorinput_module_vpt7.maxpat` (1252 lines), `vpt8 source code/patchers/artnet-vpt.maxpat` (570 lines), `vpt8 source code/patchers/ctrlrouter-vpt7_01.maxpat` (2820 lines), `vpt8 source code/patchers/ctrl_config-vpt7_01.maxpat` (2996 lines), `vpt8 source code/patchers/router-vpt7.maxpat` (1833 lines)

**Interfaces:**
- Consumes: the 13 files listed above
- Produces: `docs/architecture/09-control-surfaces.md`, consumed by Task 12

- [ ] **Step 1: Read every file in this cluster in full**

  This cluster covers every way an external controller can drive VPT: MIDI (hardware + on-screen
  "soft" controls), OSC, serial, generic sensor input, and Art-Net/DMX (via the
  `imp.artnet.node.mxo` external). `ctrlrouter-vpt7_01.maxpat`/`ctrl_config-vpt7_01.maxpat`/
  `router-vpt7.maxpat` appear to be the central dispatch layer that all the input methods funnel
  through — confirm this and document the actual routing mechanism.

- [ ] **Step 2: Write `docs/architecture/09-control-surfaces.md`**

  Follow the Module Doc Template exactly. Document each input method's patcher, how it's normalized/
  routed centrally, and the parameter-address namespace used to target specific layers/effects (this
  is likely the same OSC-style message convention seen elsewhere in the app — confirm and cite it
  precisely).

- [ ] **Step 3: Verify structural completeness**

  ```bash
  grep -c "^## " "docs/architecture/09-control-surfaces.md"
  ```
  Expected: `7`. Then:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/09-control-surfaces.md"
  ```
  Expected: no output.

- [ ] **Step 4: Spot-check against source**

  ```bash
  grep -n "imp.artnet.node" "vpt8 source code/patchers/artnet-vpt.maxpat"
  ```
  Confirm 2 more claims similarly, e.g. a routing message name in `router-vpt7.maxpat`.

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/09-control-surfaces.md
  git commit -m "Add control-surfaces architecture doc (cluster 9/11)"
  ```

---

### Task 10: Modulation (LFOs)

**Files:**
- Create: `docs/architecture/10-modulation-lfo.md`
- Read (do not modify): `vpt8 source code/patchers/lfomodule-vpt7_01.maxpat` (3257 lines), `vpt8 source code/patchers/lfomix-vpt7_01.maxpat` (1818 lines), `vpt8 source code/patchers/lforack-vpt7.maxpat` (1692 lines)

**Interfaces:**
- Consumes: the 3 files listed above
- Produces: `docs/architecture/10-modulation-lfo.md`, consumed by Task 12

- [ ] **Step 1: Read every file in this cluster in full**

  These patchers implement LFO (low-frequency oscillator) parameter modulation. Confirm how an LFO's
  output actually reaches a target parameter elsewhere in the app (e.g. a layer or effect parameter)
  — this is a cross-cutting mechanism worth documenting precisely for `00-overview.md`.

- [ ] **Step 2: Write `docs/architecture/10-modulation-lfo.md`**

  Follow the Module Doc Template exactly. Document how many LFOs exist (`lforack-vpt7.maxpat`
  suggests a rack of multiple), how they're mixed (`lfomix-vpt7_01.maxpat`), and the exact addressing
  scheme used to assign an LFO to a destination parameter.

- [ ] **Step 3: Verify structural completeness**

  ```bash
  grep -c "^## " "docs/architecture/10-modulation-lfo.md"
  ```
  Expected: `7`. Then:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/10-modulation-lfo.md"
  ```
  Expected: no output.

- [ ] **Step 4: Spot-check against source**

  Pick 3 specific claims (an object name, a send/receive string) and grep the corresponding file to
  confirm, e.g.:
  ```bash
  grep -n "lfo" "vpt8 source code/patchers/lforack-vpt7.maxpat" | head -5
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/10-modulation-lfo.md
  git commit -m "Add modulation-lfo architecture doc (cluster 10/11)"
  ```

---

### Task 11: Scripting, shaders & data

**Files:**
- Create: `docs/architecture/11-scripting-shaders-data.md`
- Read (do not modify): all files under `vpt8 source code/code/` (5 `.js` files), all files under
  `vpt8 source code/shaders/` including `shaders/shared/` and `shaders/v001 Mixers/` (`.jxs`, `.glsl`,
  `.arb`, `.cg`, and the 2 license `.txt` files), all files under `vpt8 source code/data/` (3 `.json`
  pattrstorage dumps), `vpt8 source code/vpt8.maxproj`, `vpt8 source code/openactions.txt` (empty),
  `vpt8 source code/VPT8-sourcecode-readme.rtf`, and the filenames (not contents — these are binaries)
  under `vpt8 source code/externals/`

**Interfaces:**
- Consumes: all files listed above
- Produces: `docs/architecture/11-scripting-shaders-data.md`, consumed by Task 12

- [ ] **Step 1: Enumerate and read every file in this cluster in full**

  First enumerate exactly what exists (don't rely on a stale list):
  ```bash
  cd "vpt8 source code" && find code shaders data externals -type f | sort
  ```
  Then read every non-binary file in full: all 5 `code/*.js` scripts, every `.jxs`/`.glsl`/`.arb`/
  `.cg` shader file (most are short — under 90 lines — except `shaders/shared/glsl/sh.basic.vp.glsl`
  at 135 lines), the 2 shader license `.txt` files, all 3 `data/*.json` files, `vpt8.maxproj`, and
  `VPT8-sourcecode-readme.rtf`. For `externals/*.mxo`, these are precompiled Mac binaries with no
  source in this repo — just record each external's name and, from its usage elsewhere (cross-
  reference Tasks 1–10's findings on which patchers reference `jit.gl.syphonclient`,
  `jit.gl.syphonserver`, `imp.artnet.node`, `o.route`, `Label`, `Ldiv`, `Lmult`), what it's for.

- [ ] **Step 2: Write `docs/architecture/11-scripting-shaders-data.md`**

  Follow the Module Doc Template exactly, adapted as follows since this cluster isn't `.maxpat`
  patchers: "Key patchers & subpatchers" becomes "Key scripts, shaders & data files" — for each
  `code/*.js` file, summarize its exported functions and which patcher(s) embed it (cross-reference
  Tasks 1–10); for shaders, group by category (color correction, transitions, blend-mode mixers,
  distortion/masking) and note which use inline GLSL vs. `shaders/shared/` includes vs. legacy
  `arb`/`cg` targets; for `data/*.json`, describe the `pattrstorage` slot structure. Include a
  `toolchain-version` finding on the ARB/Cg shader targets being kept alongside GLSL, a
  `closed-dependency` finding for every `externals/*.mxo` (no source in this repo — can't be
  audited, rebuilt, or ported), and a `licensing` finding citing the CC BY-NC-SA 3.0 license from
  `VPT8-sourcecode-readme.rtf` plus the two shader license files.

- [ ] **Step 3: Verify structural completeness**

  ```bash
  grep -c "^## " "docs/architecture/11-scripting-shaders-data.md"
  ```
  Expected: `7`. Then:
  ```bash
  grep -iE "TBD|TODO|similar to (task|cluster)" "docs/architecture/11-scripting-shaders-data.md"
  ```
  Expected: no output.

- [ ] **Step 4: Spot-check against source**

  ```bash
  grep -n "license" "vpt8 source code/shaders/shared/licenses/3Dlabs-license.txt" | head -3
  ```
  Confirm 2 more claims similarly (e.g. a specific shader's `<param>` list, a `code/*.js` function
  name).

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/11-scripting-shaders-data.md
  git commit -m "Add scripting-shaders-data architecture doc (cluster 11/11)"
  ```

---

### Task 12: Synthesis — system overview and tech-debt catalog

**Files:**
- Create: `docs/architecture/00-overview.md`
- Create: `docs/TECH_DEBT.md`
- Read (do not modify): all 11 files created in Tasks 1–11 (`docs/architecture/01-*.md` through
  `docs/architecture/11-*.md`)

**Interfaces:**
- Consumes: the 11 module docs from Tasks 1–11
- Produces: `docs/architecture/00-overview.md`, `docs/TECH_DEBT.md`, both consumed by Task 13
  (verification) and Task 14 (`CLAUDE.md` update)

- [ ] **Step 1: Read all 11 module docs in full**

  Read every file `docs/architecture/01-app-shell.md` through `docs/architecture/11-scripting-shaders-data.md`.

- [ ] **Step 2: Write `docs/architecture/00-overview.md`**

  Structure:
  ```markdown
  # VPT8 Architecture Overview

  ## Module index
  | # | Module | Doc | One-line purpose |
  |---|---|---|---|
  | 1 | App shell & root | [01-app-shell.md](01-app-shell.md) | <filled from Task 1's Purpose section> |
  | 2 | Layer engine core | [02-layer-engine-core.md](02-layer-engine-core.md) | <...> |
  ... (all 11 rows)

  ## Cross-cutting conventions
  <describe every pattern that recurs across 2+ modules, each with which modules it spans: the
  three-representation layer lifecycle (engine/GUI/tabs, Tasks 2/3, 5, 1), the send/receive message
  convention, the pattrstorage state convention, the mgraphics point-editor convention (Task 4), the
  central control-surface router (Task 9), the LFO-to-parameter addressing scheme (Task 10)>

  ## Top-level data flow
  <a narrative walkthrough: source (Tasks 6-7) -> layer engine (Tasks 2-3) -> masking/warping
  (Task 4) -> mixing (Task 5) -> output, with control input (Task 9) and modulation (Task 10)
  feeding in, and presets/cues (Task 8) able to drive the whole state>
  ```
  Fill in every placeholder above with real content pulled from the 11 module docs — do not leave
  any `<...>` unresolved.

- [ ] **Step 3: Write `docs/TECH_DEBT.md`**

  Collect every "Tech-debt findings" entry from all 11 module docs into one list. Deduplicate
  entries that describe the same underlying issue (e.g. if both Task 7 and Task 11 flag Syphon's
  Mac-only nature, merge into one entry citing both locations). Structure:
  ```markdown
  # VPT8 Technical Debt Catalog

  Compiled from a full read of all 49 patchers, 5 scripts, ~90 shader/data files, and the 7 bundled
  externals. Each finding cites its concrete source location.

  ## platform-gap
  1. <finding>. Location(s): <file(s)>. Severity: <>. Effort: <>.
  ...

  ## toolchain-version
  ...

  ## closed-dependency
  ...

  ## dead-code
  ...

  ## naming-inconsistency
  ...

  ## architectural-fragility
  ...

  ## hardcoded-limit
  ...

  ## no-tests-ci
  ...

  ## licensing
  ...
  ```
  Include every category header even if a category turns out to have only one finding; omit a
  category header only if genuinely zero findings exist for it across all 11 docs.

- [ ] **Step 4: Verify completeness**

  ```bash
  grep -c "^\[.*\](0[1-9]-.*\.md\|1[01]-.*\.md)" docs/architecture/00-overview.md
  ```
  Expected: `11` (one link per module doc in the index table — adjust the grep if your table
  formatting differs, but manually confirm all 11 are linked). Then:
  ```bash
  grep -iE "TBD|TODO" docs/architecture/00-overview.md docs/TECH_DEBT.md
  ```
  Expected: no output.

- [ ] **Step 5: Commit**

  ```bash
  git add docs/architecture/00-overview.md docs/TECH_DEBT.md
  git commit -m "Add architecture overview and tech-debt catalog (synthesis)"
  ```

---

### Task 13: Verification spot-check pass

**Files:**
- Modify: `docs/TECH_DEBT.md` (fix any inaccuracies found)
- Modify: `docs/architecture/00-overview.md` (fix any inaccuracies found)
- Create: `docs/architecture/VERIFICATION-LOG.md`

**Interfaces:**
- Consumes: `docs/TECH_DEBT.md`, `docs/architecture/00-overview.md`, and the original source tree
- Produces: `docs/architecture/VERIFICATION-LOG.md`, corrected versions of the two synthesis docs if
  needed

- [ ] **Step 1: Spot-check 5 tech-debt findings**

  From `docs/TECH_DEBT.md`, pick 5 findings spanning at least 3 different category tags. For each,
  open the cited file at the cited location (or grep for the cited unique string) and confirm the
  finding is accurate — not exaggerated, not hallucinated, not already-fixed-elsewhere. Example:
  ```bash
  grep -n "<cited string>" "vpt8 source code/<cited file>"
  ```

- [ ] **Step 2: Spot-check 3 data-flow claims from the overview**

  From `docs/architecture/00-overview.md`'s "Top-level data flow" and "Cross-cutting conventions"
  sections, pick 3 specific claims (e.g. a named `send`/`receive` pair). For each, confirm **both**
  a sender and a receiver exist somewhere in the patchers, e.g.:
  ```bash
  grep -rn "<send/receive name>" "vpt8 source code/patchers/"
  ```
  Expect at least 2 matches (one send side, one receive side).

- [ ] **Step 3: Record results and fix any discrepancies**

  Write `docs/architecture/VERIFICATION-LOG.md` listing each of the 8 checks performed, the exact
  command run, and the outcome (confirmed / corrected — with what was corrected). If any check in
  Steps 1–2 failed, fix the source doc (`TECH_DEBT.md` or `00-overview.md`) directly before recording
  it as "corrected" rather than "confirmed".

- [ ] **Step 4: Commit**

  ```bash
  git add docs/architecture/VERIFICATION-LOG.md docs/TECH_DEBT.md docs/architecture/00-overview.md
  git commit -m "Add verification log for architecture audit; correct any spot-check discrepancies"
  ```

---

### Task 14: Update CLAUDE.md with a pointer to the deep architecture docs

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `docs/architecture/00-overview.md`, `docs/TECH_DEBT.md` (just their existence/paths)
- Produces: updated `CLAUDE.md` for all future sessions in this repo

- [ ] **Step 1: Add a new section to `CLAUDE.md`**

  Insert this section (after the existing "Architecture: shaders and compositing" section, at the
  end of the file):
  ```markdown

  ## Deep architecture reference

  The sections above are a high-level orientation. For a complete, file-by-file map of all 49
  patchers (grouped into 11 functional clusters: app shell, layer engine core, per-layer engine
  instance, layer select/masking/warping, layer GUI/mixing/clips, core video sources, secondary
  video sources, presets/cues, control surfaces, modulation, and scripting/shaders/data), see
  [`docs/architecture/00-overview.md`](docs/architecture/00-overview.md) and the per-cluster docs it
  links to. For a categorized inventory of technical debt (platform gaps, toolchain/version debt,
  closed-source dependencies, dead code, naming inconsistencies, architectural fragility, hardcoded
  limits, missing tests/CI, and licensing constraints) to weigh before any modernization work, see
  [`docs/TECH_DEBT.md`](docs/TECH_DEBT.md).
  ```

- [ ] **Step 2: Verify the section was added correctly**

  ```bash
  grep -n "Deep architecture reference" CLAUDE.md
  grep -n "docs/architecture/00-overview.md\|docs/TECH_DEBT.md" CLAUDE.md
  ```
  Expected: each grep returns at least one match.

- [ ] **Step 3: Commit**

  ```bash
  git add CLAUDE.md
  git commit -m "Point CLAUDE.md at the new architecture and tech-debt docs"
  ```
