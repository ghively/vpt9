# VPT8 parity finish line: per-layer warp, source bank + blend modes, clip transport — design

## Context

`docs/ROADMAP.md` named three remaining sub-projects to close the gap between `control-panel/` and
VPT8, sequenced but never designed: (2) per-layer warp/corner-pin, (3) the shared/hot-swappable
source-bank architecture plus the 18 missing blend modes and the whole-bank A/B crossfade
("mix") source type, (4) a clip-trigger grid. This spec designs all three together, at the user's
request, rather than as three separate spec cycles. Build order stays 2 → 3 → 4; each sub-project is
independently shippable and independently verifiable.

Two orthogonal decisions were made alongside this design and are already implemented, not part of
the work below: `control-panel` is MIT-licensed (`control-panel/LICENSE`), and physical hardware
control (Art-Net/DMX, serial sensors, a real MIDI controller) is confirmed out of scope — see
`docs/ROADMAP.md`'s 2026-07-08 status update.

**Design review.** Before being written up, this design went through an independent adversarial
review (a separate model, briefed with no stake in the original draft, instructed to find errors
rather than validate). It found three genuine design errors — an unenforced invariant, a
state-authority model that contradicted itself and ignored the app's multi-screen architecture, and
a scheduling mechanism that couldn't observe the event it claimed to schedule on — plus seven
smaller gaps between VPT8's real behavior and the original draft. All ten are fixed inline below;
where a section exists specifically because of that review, it says so.

## What stays unchanged

Screen-level (whole-output) warp, the existing per-layer FX chain's stage math (flip/tile/zoom/
brcosa/edge-blend/blur/mblur), direct per-layer source assignment as the default way to give a layer
a source, and the 6 already-implemented blend modes' shader math.

## 1. Per-layer warp/corner-pin

### State shape

Each layer gains a `warp` object, structurally identical to what screens already carry:

```
warp: { mode: "corner" | "mesh", corners: [4 points], mesh: { size, points } }
```

reusing `server/src/state.js`'s `IDENTITY_CORNERS`/`identityMeshPoints` helpers — these are currently
module-private and need to be exported so the per-layer default-state initializer can call them too.

Corner-pin preset templates (VPT8's `activelayer.maxpat` → `p cornerpin_templates`) are included as a
UI convenience, not new state: a preset dropdown (Full / Center / Left third / Right third / Rotate
90° / 180° / 270°) that, on selection, writes known corner coordinates into the same `corners` array
via the existing update path.

### Render pipeline — corrected stage order

Per-layer render order: FX chain → **mask baked into the texture's alpha** → per-layer warp (deforms
the now-masked texture) → blend-composite onto the shared output canvas → screen-level warp
(corrects the whole composited frame for projector geometry).

This changes where masking happens. Today, `render-client/src/layers.js` applies the mask during the
blend pass (`maskAlpha()`), after any per-layer transform. If per-layer warp were added without
moving masking earlier, a warped layer's mask would stay axis-aligned in screen space instead of
deforming with the layer's content — VPT8's own `vlayer` order is mask, then mesh. Moving mask
application into the per-layer stage, before warp, is required scoped rework, not an additive change.

### Warp math generalization

`render-client/src/warp.js` currently hardcodes orientation for its one existing role: writing
directly to the visible canvas as the pipeline's terminal stage (its vertex shader's Y-flip assumes
this). Reused as a mid-pipeline stage rendering to an intermediate framebuffer, that flip must not
fire — it would get flipped again by the later screen-warp stage, inverting the layer. Fix:
parameterize orientation/target (e.g. a `renderTarget: "canvas" | "texture"` or explicit `flipY`
argument) instead of hardcoding it, so the same corner/mesh-to-geometry math serves both the
per-layer stage (writes to an FBO) and the screen stage (writes to the canvas).

### Panel UI

FX drawer gains a "Warp" section: Corner Pin / Mesh mode toggle, mesh density selector (matching the
screen editor), the preset dropdown above, and an "Edit on canvas" button. Clicking it swaps the
confidence-monitor overlay into `WarpHandle.tsx`-based drag/tag/coordinate-entry handles — the same
interaction already built for the screen warp editor and the mask's on-canvas mode — scoped to
`layers.<id>.warp`. `App.tsx`'s single on-canvas-target concept (currently just `maskEditLayerId`)
generalizes to a small discriminated value: `{type:"mask", layerId} | {type:"warp", layerId} | null`.
The screen warp editor keeps its existing always-visible side panel, unaffected by this.

## 2. Source bank + all 24 blend modes + mix-source type

### Source-bank state

```
state.sourceBank: [
  { id: "slot-1", name: "Slot 1",
    content: null | { type: "media", mediaId } | { type: "mix", a: SourceRef, b: SourceRef, blendMode, mix } },
  ... 8 total
]
```

`SourceRef` reuses the layer source-reference union already in `panel/src/components/types.ts`
(direct media / URL / camera), extended with a `{type:"slot", slotId}` variant so a layer — or a
mix's `a`/`b` — can point at a shared slot instead of a direct source. This is the hybrid model:
layers default to direct assignment, unchanged, and can optionally point at a shared slot. Slots
point at existing media-library entries rather than duplicating source-config infrastructure.

**Cycle prevention (fixes an unenforced invariant the design review found).** The original draft
reasoned that a mix's `a`/`b` "can't point at another mix, so no guard is needed" — but nothing in
the current `state.js`/WS update path actually enforces that; any client could set one up. Fix: the
server validates every write to a slot's `content` and rejects it if `content.type === "mix"` and
either `a` or `b` resolves — directly, or transitively through one level of `{type:"slot"}` — to
another slot whose content is itself `type:"mix"`. Mix nesting becomes structurally impossible, not
just discouraged by convention.

**Dangling references.** Deleting a media entry that a slot points at clears that slot's `content` to
`null` (broadcast as a normal slot update). Deleting a slot that a layer or a mix references resolves
that reference to "no source" — the layer shows no-signal; a mix missing one input passes the other
input through at full weight rather than rendering black or erroring.

### Mix-source rendering

Rendering a `"mix"` slot requires the render-client to decode/render both `a` and `b` refs to
intermediate textures and blend them into one output texture, consumed as the referencing layer's
input pre-FX-chain. This is new infrastructure, not reuse of something that already exists:
`render-client/src/compositor.js` has framebuffer creation, but no shared decode-once/reuse-across-
layers texture manager, which shared slots inherently need (multiple layers can point at the same
slot and shouldn't each decode it independently).

### Blend modes

`render-client/src/layers.js`'s blend-mode table grows from 6 to 24, ported from
`shaders/v001 Mixers/*.fp.glsl`. The blend-mode list is currently duplicated between `layers.js` and
`panel/src/components/types.ts`; growing both to 24 must keep them in lockstep — worth factoring into
one shared constants module rather than maintaining two copies of 24 names. The panel's blend-mode
picker exposes all 24 (fixing VPT8's own 17-of-24 UI gap — user-confirmed, deliberate divergence from
strict behavioral parity).

### Panel UI — source-bank management

A new "Source Bank" panel (alongside the Media Library) lists the 8 slots: assign a media-library
entry directly, or configure a slot as a mix (A/B pickers drawing from media/camera/other
media-holding slots, blend-mode picker, crossfade-amount slider). `LayerStrip.tsx`'s source picker
gains a "Shared Slot" option alongside its existing video/color/camera choices.

### Documented trade-off

VPT8's `xfadesource`/`hapsource` source engines natively crossfade smoothly between two decoders when
a clip changes. Collapsing a shared slot down to "points at one media-library entry" — this design's
simplification, chosen to reuse the media library rather than duplicate source-config infrastructure
— means a slot's clip changes are hard cuts, not crossfades. This is an accepted consequence of the
hybrid model already chosen, documented here rather than silently lost.

## 3. Clip transport + playlist/sequencing

### Transport state — control vs. telemetry split

Each layer gains:

```
transport: { playing, rate, loopIn, loopOut, loopMode: "off" | "loop" | "palindrome", pan, vol }
```

— server-authoritative **control** state: real, persisted, broadcast like every other piece of state
in this app.

Playback **position is not part of this state.** It's relay-only telemetry, broadcast the same way
confidence-monitor `preview` frames already are today (not persisted, not looped back to its sender):
`{"type":"transportStatus", layerId, position}`.

This split fixes a contradiction the design review found: the original draft called position
"server-authoritative" while also describing it as relayed like preview frames — those are opposites
(state is persisted and multi-client-visible; the preview pattern is deliberately neither). It also
addresses something the draft missed entirely: with multiple screens, each render-client runs its own
independent `<video>` decoder for the same layer, so there is no single "the" position to be
authoritative about. Position telemetry is sourced from exactly one render-client per layer — its
**audio owner** (the app's existing single-source-of-truth concept for which screen's audio is live
for a given layer) — since only that decoder's timing actually matters for sync. A layer with no
audio owner assigned shows play/pause state in the panel without a numeric scrub position.

### Loop in/out, loop mode, and rate — browser constraints stated explicitly

Arbitrary loop in/out points aren't a native `<video>` feature: implemented via
`requestVideoFrameCallback` where available (falling back to `timeupdate`), seeking back to `loopIn`
once playback passes `loopOut`. This has real, stated imprecision (potentially a frame or more),
not presented as sample-accurate. `palindrome` loop mode reverses direction at each bound by manually
driving playback forward/backward through explicit seeks — it cannot use native reverse playback (see
below).

**Reverse playback (negative `rate`) is an explicit non-goal.** VPT8 supports it; no browser allows
`<video>.playbackRate` to go negative. This is a hard platform limit, stated here rather than silently
dropped.

### Pan/vol

Per-clip pan and volume require Web Audio API integration: a `MediaElementAudioSourceNode` wrapping
the layer's `<video>` element, routed through a `GainNode` (volume) and `StereoPannerNode` (pan)
before the audio destination — native `<video>` only exposes linear `volume`, not pan.

### Playlist / sequencing

A layer gains `sourceMode: "single" | "playlist"`; playlist mode holds an ordered list of source refs
(direct media or a shared slot), each with either a fixed duration (stills) or "play through to end"
(video). `server/src/automation.js`'s tick loop schedules **still-image** advances the same way it
already schedules wall-clock timers.

**Video-item advance cannot be wall-clock scheduled** — the server has no visibility into playback
progress, so a fixed-duration guess would drift or cut clips short. Fix (closes a gap the design
review found: the original draft put this in the server tick loop with no way to observe end-of-clip):
the audio-owner render-client sends a one-shot `{"type":"clipEnded", layerId}` message when the
native `<video>` `ended` event fires; automation advances the playlist on receiving that signal, not
by polling a guessed duration.

### Panel UI

FX drawer gains a "Transport" section: play/pause, rate slider, loop in/out (numeric entry or "set
from current position"), a loop-mode selector (off/loop/palindrome), pan/vol sliders, and a
playlist-mode toggle revealing an ordered media-list editor (add/remove/reorder from the media
library or shared slots, per-item duration for stills).

## Testing

- **Server:** unit tests for source-bank slot CRUD and the mix-nesting rejection; `transport` state
  init/patch shape parity (mirroring the existing state-patch-parity test style); still-image
  playlist-advance timing (mirroring the existing timer-bank tests); a test confirming `clipEnded`
  advances a video-mode playlist item and that wall-clock timers do *not* fire for video items.
- **Render-client:** Playwright pixel checks — a layer's own warp moving independently of screen
  warp, with the layer's mask visibly following the deformation (verifying the corrected mask-before-
  warp stage order); several representative new blend modes plus one mix-slot end-to-end check (two
  known-color sources blended 50/50 with "multiply" produces the expected pixel color); play/pause
  reflected in actual `<video>` playback state; a still-image playlist auto-advancing after its
  configured duration.
- **Also in scope:** closing sub-project 1's still-open verification gap — the Playwright pixel check
  for the media library/mask editor/mobile layout that was spec'd in
  `docs/superpowers/specs/2026-07-06-panel-ux-and-media-library-design.md` but never built. Scheduled
  first, since it depends on nothing built in this spec.

## Non-goals

- Reverse/negative-rate playback — a hard browser platform limit, not a scoping choice.
- VPT8's native per-slot A/B crossfade-on-clip-change smoothness — lost by the source-bank
  simplification described in Section 2; an accepted, documented trade-off, not an oversight.
- Art-Net/DMX, serial sensor input, Syphon — out of scope by prior explicit decision (2026-07-06),
  reaffirmed 2026-07-08.
- A literal Ableton-style multi-clip-per-slot launch grid — VPT8's own `clipcontrol.maxpat` is
  per-source transport control plus a single-sequence playlist, not a multi-cell grid; this spec
  builds the former, matching what VPT8 actually has.
