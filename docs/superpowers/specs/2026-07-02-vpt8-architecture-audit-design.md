# VPT8 Architecture Audit & Developer Onboarding Map — Design

Date: 2026-07-02

## Background

This repository holds the source for **VPT (VideoProjectionTool) 8**, a Max/MSP/Jitter visual
programming application by HC Gilje, last saved with Max 7.3.5, released 2018, unmaintained since.
The intent going forward is to build on top of this codebase and eventually modernize it. Nobody on
the team currently has a working mental model of how it's built. Before any modernization work can
be safely planned, we need a complete map of the system and an honest inventory of its technical
debt.

`CLAUDE.md` (already written) gives a short, high-level orientation — project structure, file
types, the layer-lifecycle pattern, shader/data conventions — but deliberately does not enumerate
the 49 `.maxpat` patcher files in detail. This project produces that missing depth.

## Scope

Full-depth documentation and technical-debt cataloging of:
- All 49 `.maxpat` patcher files under `vpt8 source code/patchers/` (~157,000 lines of patcher JSON
  total; several files are 8,000–23,000 lines each)
- The 5 `code/*.js` scripts, 36 `shaders/*.jxs` (+ shared includes), 3 `data/*.json` pattrstorage
  dumps, and the 7 precompiled `externals/*.mxo` binaries (these are largely already understood from
  prior exploration but need a full, written-up pass)

Explicitly **out of scope**: deciding or executing any actual modernization/migration work. This is
an audit-only deliverable. Direction (stay-in-Max-and-upgrade vs. eventually port to another stack)
is intentionally left open, to be decided later using this audit as evidence.

## Approach

### Why full reads, not a skim

A structural skim (top-level objects/subpatcher names only) would produce a decent wayfinding map
but would systematically miss the things this audit is actually for: deprecated/legacy objects and
dead code tend to live inside nested subpatchers, and the real cross-module contracts (Max
`send`/`receive` names, OSC-style message strings, `pattr`/`pattrstorage` bindings) are only visible
by tracing actual patch cords and message boxes. Given the explicit goal — a debt inventory precise
enough to modify the system safely — every patcher is read in full.

### Parallel fan-out by functional cluster

The 49 patchers are grouped into 10 functional clusters, sized for rough parallel balance (not by
raw line count alone — the two largest single files, `enginetab.maxpat` and the source engines, get
dedicated/lighter clusters so no one agent is overloaded). An 11th cluster covers the non-patcher
assets (scripts, shaders, data, externals) which have already had a first pass but need to be
finished and written up formally.

| # | Cluster | Files | ~Lines |
|---|---|---|---|
| 1 | App shell & root | vpt7project, prefs, vpt7_info, vpt7_keys, livemodule-vpt7, livemodule_d | 15,900 |
| 2 | Layer engine core | enginetab | 23,200 |
| 3 | Per-layer engine instance | vlayer, jit.gl.slab.gauss6x | 10,700 |
| 4 | Layer select, masking & warping | activelayer, layermask, gridcontroller, pointmask | 19,100 |
| 5 | Layer GUI bank/tabs, mixing & clips | layersbank, layergui, layertab, controltabs, mix-vpt7, clipcontrol, loopback_clip_vpt7 | 10,500 |
| 6 | Core video source engines | hapsource, xfadesource | 20,800 |
| 7 | Secondary video sources | xfadestill, sourcebank, solid01_vpt7, syphon_vpt7, vpt-syphonout | 12,900 |
| 8 | Presets & cue automation | presetmodule-vpt7, preset_cellblock, cuelist-vpt7, copypaste, timermodule, vpt-timersketch3 | 17,300 |
| 9 | Control surfaces | miditab-vpt7, softmidi-vpt7_01, softbutton-vpt7, softslider-vpt7, osceditor-vpt7, osc_active, osc_pass, serial_VPT7, sensorinput_module_vpt7, artnet-vpt, ctrlrouter-vpt7_01, ctrl_config-vpt7_01, router-vpt7 | 20,400 |
| 10 | Modulation (LFOs) | lfomodule-vpt7_01, lfomix-vpt7_01, lforack-vpt7 | 6,800 |
| 11 | Scripting, shaders & data | code/*.js, shaders/*.jxs + shared includes, data/*.json, externals/*.mxo (metadata only — no source), vpt8.maxproj, readme | (mostly pre-read) |

Each cluster agent works read-only against the same template so outputs are consistent and mergeable:
- **Purpose** — what this module does in the running application
- **Key patchers/subpatchers** — the file(s), their toplevel objects, and any bpatchers/subpatchers
  they instantiate (static or dynamic)
- **Data flow** — inlets/outlets, `send`/`receive` names, OSC-style message strings, `pattr` /
  `pattrstorage` bindings connecting this module to the rest of the app
- **Dependencies** — which `code/*.js` scripts, `shaders/*.jxs`, or `externals/*.mxo` this module
  uses
- **Notable patterns** — anything worth knowing before modifying this module (established
  conventions, quirks, non-obvious coupling)
- **Tech-debt findings** — concrete issues with file references (see taxonomy below)

### Synthesis pass

Once all 11 cluster reports are in, a synthesis step produces the final deliverables:
- `docs/architecture/00-overview.md` — system map: module index (linking to each per-module doc),
  cross-cutting conventions used throughout the app (the layer-lifecycle pattern already identified
  in `CLAUDE.md`, the `send`/`receive` message-bus convention, `pattrstorage` state conventions), and
  a top-level data-flow narrative (source → layer engine → mixing → output)
- `docs/architecture/<cluster-name>.md` — one file per cluster (11 files), from the template above
- `docs/TECH_DEBT.md` — every finding, deduplicated, grouped by category, each with a file reference
  and a rough severity/effort tag

Tech-debt categories (a finding may span more than one):
- **Platform gaps** — e.g. Mac-only externals (Syphon, Art-Net) with no evident Windows equivalent
  bundled, despite VPT shipping for both platforms
- **Toolchain/version debt** — authored in Max 7.3.5; deprecated shader targets kept alongside
  modern ones (ARB assembly, Cg, ARB/GLSL side by side)
- **Missing source / closed dependencies** — precompiled `.mxo` externals (`Ldiv`, `Lmult`, `Label`,
  `o.route`, `imp.artnet.node`) with no source in this repo — can't be audited, rebuilt, or ported
- **Dead/vestigial code** — commented-out blocks, "dummy" placeholders, unused functions/objects
- **Naming/versioning inconsistency** — e.g. the toplevel patcher is still named
  `vpt7project.maxpat` inside a project called VPT8; pervasive `-vpt7` suffixes
- **Architectural fragility** — e.g. the layer system's three parallel bpatcher representations
  (engine/GUI/tab) kept in sync by hand across separate scripts, with no single source of truth
- **Hard-coded limits** — fixed enumerations (e.g. `videobank01`..`videobank08` in pattrstorage)
  rather than dynamic structures
- **No automated tests/CI** — inherent to the Max/MSP environment, worth stating explicitly as a
  constraint on any future modernization
- **Licensing constraints** — CC BY-NC-SA 3.0 (non-commercial); relevant if modernization has any
  commercial angle

### Verification

After synthesis, a manual spot-check: pick a sample of specific claims from the generated docs
(e.g. a described data-flow path, a cited tech-debt finding) and confirm them directly against the
source patchers/files before treating the docs as trustworthy.

### CLAUDE.md update

Add a short "Deep architecture reference" section to `CLAUDE.md` pointing at
`docs/architecture/00-overview.md` and `docs/TECH_DEBT.md`, without duplicating their content.

## Deliverables

- `docs/architecture/00-overview.md`
- `docs/architecture/` — 11 per-cluster module docs
- `docs/TECH_DEBT.md`
- Updated `CLAUDE.md` with a pointer section

## Out of scope

- Any actual code/patch changes to modernize VPT8
- Deciding the target modernization direction (stay-in-Max vs. port to another stack)
- Building/packaging the app as a Max standalone
