# Control-panel UI overhaul — composition, legibility, and unwired-capability closure

Date: 2026-07-05
Scope: `control-panel/panel/` (primary), plus the minimal `server/` + `render-client/`
changes one new capability (master dim/blackout) requires.

## Why

The panel is functionally broad but was judged (correctly) to look/feel unfinished and to
be missing abilities. Assessed live at 1600×1000 against a running control-plane:

1. **Composition wastes the screen.** The left rack column is mostly black void (the
   420px instrument aside is ~3× taller than a two-layer rack), while the automation band
   is pinned to the bottom at `max-height: 38vh` with sparse content. The app reads as a
   scaffold, not a console.
2. **Native form controls clash.** `<select>` renders with native chrome next to themed
   inputs; range styling is WebKit-only (default thumb on Firefox).
3. **FX drawer legibility.** 8px labels, three unlabeled rows, no visual grouping.
4. **Engine capabilities with no UI** (all verified supported by server + render client):
   - Mask geometry `cx/cy/rx/ry/feather` — render client uploads all five as uniforms
     (`layers.js:236-241`); panel only has enable + shape toggles.
   - `warp.mesh.size` — honored per frame (`warp.js:88`); panel has no density control.
   - Preset delete/rename — generic `delete presets.<id>` / `update presets.<id>.name`
     work server-side; no UI.
   - Screen add/rename — `create screens` / `update screens.<id>.name` work; no UI.
   - LFO/MIDI targets are free-text dotted paths — the ability exists but is
     undiscoverable without reading the state shape.
5. **No master dim / blackout** — VPT8 has a master fade; a live operator needs an
   instant, preset-proof blackout. Missing across the whole stack.
6. **Hierarchy inversions.** GO/STOP — the single most important live control — is a
   small chip; the confidence monitor shows unexplained black when no render client is
   connected (reads as broken rather than "no signal").

## Design

### A. Layout: two-column console

- **Left column (fluid):** LAYER RACK on top, then a SHOW CONTROL band — cards for
  Presets (full width), Cue list, Timers, LFO rack, MIDI map — that fills the remaining
  height. This kills the void: show control lives where the empty space was.
- **Right column (fixed 420px, full height):** the per-screen instruments — warp editor +
  PiP windows. Conceptual split: left = the scene and the show; right = the screen
  machines (cyan territory).
- Faceplate unchanged in role; gains the master section (J).

### B. Primitive polish

- `Select` becomes `appearance: none` with an inline-SVG chevron, matching TextField
  chrome exactly.
- Range inputs get `::-moz-range-thumb`/`::-moz-range-track` parity.
- Micro-type floors raised: FX labels 8px → 9.5px, values 9px → 10px; keep the
  nameplate voice (mono, tracked, uppercase).

### C. FX drawer: captioned sections + mask geometry

Sections with mono eyebrow captions — TRANSFORM (flip/tile/zoom/pan), COLOR
(blur/trail/brcosa), EDGE BLEND (l/r/t/b/gamma), and a new **MASK** section: shape select
plus `cx/cy/rx/ry/feather` faders (paths `mask.*`, all engine-supported today). Controls
align on a fixed grid; neutral values stay dimmed.

### D. Confidence monitor empty state

When no preview frame has arrived: centered mono "NO SIGNAL — awaiting render-client
preview". Clears on first frame.

### E. Transport hierarchy

Large tungsten GO button; STOP secondary (live-red on hover); running lamp; a readout of
the armed cue ("NEXT 02 — Build"). Cue rows otherwise unchanged.

### F. Presets card

Preset chips gain hover ×-delete (`delete presets.<id>`) and double-click inline rename
(`update presets.<id>.name`). Save row unchanged.

### G. Target picker (LFO + MIDI)

A shared `TargetPicker` component: optgrouped `<select>` built from live state — per
layer: `opacity`, numeric `fx.*` leaves, `mask.cx/cy/rx/ry/feather`; plus `master` — with
a "custom path…" option that reveals the existing free-text field. Used by both LfoRack
and MidiMapPanel rows (props gain a `targetOptions` list supplied by the container, so
the presentational components stay state-free).

### H. Mesh density

Warp editor gains a density Select (3/4/6/8), shown in mesh mode. Changing it sends
`warp.mesh.size` + fresh identity points for that size (documented as a mesh reset — the
old points are meaningless at a different grid size).

### I. Screens: add + rename

"+ ADD" chip in the warp panel head creates `screen-<n>` with identity warp (`create
screens`); the selected screen's name is editable via TextField (`update
screens.<id>.name`). Screen delete is deliberately out of scope (orphans pips/audio
owner; needs a guarded flow).

### J. Master dim / blackout (new capability, full stack)

- **Server:** top-level `master: 1` in `DEFAULT_STATE` + `ensureStateDefaults` backfill.
  NOT added to `PRESET_FIELDS` — blackout is a hard safety control that preset recalls
  and cue fades must never yank around. (Free bonus: OSC `/master 0.7` and LFO targeting
  `master` work automatically through the existing generic path routing.)
- **Render client:** the warp pass multiplies output RGB by a `u_master` uniform;
  `Compositor.setMaster()` wired from state in `main.js`'s `applyDerivedState`.
- **Panel:** faceplate master section — MASTER fader (0..1) + BLACKOUT toggle that drops
  `master` to 0 and restores the pre-blackout level (remembered locally).

### K. Stories / library hygiene

Changed components get their stories updated (PresetsBar, LfoRack, MidiMapPanel,
WarpEditor, FxDrawer, Faceplate); `TargetPicker` exported from `components/index.ts`.
`control-panel/README.md` state shape gains `master`.

## Non-goals

- No screen delete (guarded flow, later). No cue drag-reorder. No Art-Net/serial. No new
  render-client effect stages. No OSC-port surfacing in the panel (server doesn't expose
  it). No changes to `vpt8 source code/`.

## Verification plan

- `tsc --noEmit && vite build` + `build:lib` pass.
- Live before/after screenshots at 1600×1000.
- Scripted round-trips against a running server: master fader → `/state`; mask faders →
  `/state`; mesh size 4→6 → points length 36; preset save/rename/delete; GO advances
  `automation.cursor`.
- No browser console errors on load or while exercising controls.
