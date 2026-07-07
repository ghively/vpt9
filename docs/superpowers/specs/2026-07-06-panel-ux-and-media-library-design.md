# Panel UX overhaul + media library — design

Status: proposed, pending user approval.

## Context

`control-panel`'s engine-level VPT8 parity is already closed (see `docs/ROADMAP.md`'s Subsystem
Inventory: per-layer FX chain, automation, camera/MIDI/OSC/LFO — all built and verified). What
this spec addresses is different: the operator UI itself is hard to use, has no real mobile
support, and is missing two capabilities VPT8 had for free (browsing local media, and on-canvas
mask editing) or never exposed clearly (warp point identity).

This is sub-project 1 of a 4-part decomposition of "VPT8 feature parity, better interface":

1. **This spec** — UI/UX overhaul + media library.
2. Per-layer warp/corner-pin (VPT8 has a per-layer corner-pin *in addition to* the master/output
   corner-pin we already built; ours only has the latter).
3. Source-model expansion (still-image source type; VPT8's shared/hot-swappable 8-slot source
   bank vs. our one-source-per-layer model).
4. Clip-trigger grid (VPT8's `clipcontrol.maxpat` — no analog exists yet).

Sequencing rationale: this spec's on-canvas editing patterns (labeled handles, live coordinate
readouts, tap-to-select-then-type-coordinates) are exactly what sub-project 2's per-layer warp
editor will reuse, so building them once here first avoids redoing the same interaction pattern
twice.

**Explicitly out of scope, by the user's decision, not an engineering call:** Art-Net/DMX, serial
sensor input, and Syphon (macOS-only GPU texture sharing). None of these have a browser API path;
the WS/OSC protocol documented in `control-panel/README.md` remains the integration surface if a
future bridge process is ever built for them.

## What stays unchanged

The existing token system (`panel/src/tokens/tokens.css`) — the tungsten/cyan "projection desk"
identity, the confidence-monitor signature element, mono equipment-label typography. The problem
this spec solves is information architecture and touch ergonomics, not visual identity.

## 1. Media library

### Server

- New `media` state container, keyed by id, same shape/discipline as `layers`/`presets`/`screens`:
  `{ "media-<id>": { id, name, filename, size, uploadedAt } }`. Added to `DEFAULT_STATE` and
  backfilled via `ensureStateDefaults`'s existing `fillMissing` (server/src/state.js) so old
  `state.json` files upgrade cleanly.
- Files live under `MEDIA_DIR` (env var, default `./media`; Docker default `/data/media`, reusing
  the existing `state-data` volume — no new volume). Internal filename is server-generated
  (`media-<id>.mp4`), never derived from the client-supplied name, closing off path traversal by
  construction. The display name (editable) is metadata only.
- Three new HTTP endpoints on the existing hand-rolled `http` server (no multipart library, matching
  the codebase's existing minimal-dependency style — raw request body + an `X-File-Name` header,
  mirroring how `readJsonBody` is already hand-rolled):
  - `POST /api/media` — body is raw file bytes. Rejects non-`.mp4` names (400) and anything over
    `MEDIA_MAX_BYTES` (default 1 GiB, env-overridable) checked against `Content-Length` up front,
    and re-checked against actual bytes written in case `Content-Length` is absent/wrong (abort +
    delete partial file, 413). On success: write file, `applyCreate(state, "media", {...})`,
    `scheduleSave()`, `broadcast({type:"create", path:"media", ...})` — same pattern as the existing
    PiP-cast hook.
  - `GET /media/:id.mp4` — validates the filename against `^media-[A-Za-z0-9_-]+\.mp4$` before
    touching the filesystem (defense in depth; ids are server-generated so this should never fail
    for a legitimate request). Streams with **HTTP Range support** (required for `<video>` seeking)
    and `Access-Control-Allow-Origin: *`. The CORS header isn't optional: `render-client/src/layers.js`
    already sets `video.crossOrigin = "anonymous"` because video frames get drawn into a WebGL
    texture, and a cross-origin video without CORS headers taints the canvas.
  - `DELETE /api/media/:id` — deletes the file from disk and the state entry, broadcasts `delete`.
  - Rename needs no new endpoint — it's a plain WS `update` on `media.<id>.name`, which the existing
    generic `applyUpdate` already handles.
- No total-library quota — explicit non-goal; only a per-file cap.

### Panel

- New persistent "Media library" pane, always visible above the layer rack (not one more
  `sc-card` among Presets/Cues/Timers/LFO/MIDI — see the IA section below for why).
- Rows: editable name (existing `TextField` commit pattern), formatted size, delete (`×`).
- Upload: a file input (`accept="video/mp4"`) + upload button. Uses `XMLHttpRequest` (not `fetch`)
  specifically because it exposes `upload.onprogress`, needed for a progress indicator on large
  files.
- A layer's video-source field becomes a `Select` populated from `state.media` (label = name) plus
  an "External URL…" option that reveals the existing raw `TextField` — keeps the ability to point
  at an arbitrary external stream without regressing that capability.

## 2. Information architecture

### Desktop

```
┌─ MEDIA LIBRARY ─────────────────── [+ Upload] ─┐
│ ▸ Ambient loop.mp4          142 MB    ✎  ×     │
│ ▸ Starfield.mp4              38 MB    ✎  ×     │
└─────────────────────────────────────────────────┘
┌─ LAYERS ────────────────────── [+ Add layer] ──┐
│ 01 ▲▼  Ambient loop      screen ▾    ▓▓▓▓░ 82% │  ← row 1: what/how much
│        [ Mask ]  [ FX ]  [ Copy Paste ]  [ Remove ] │  ← row 2: grouped actions
├─────────────────────────────────────────────────┤
│ 02 ▲▼  Starfield         color        ▓▓░░░ 46% │
│        [ Mask ]  [ FX ]  [ Copy Paste ]  [ Remove ] │
└─────────────────────────────────────────────────┘
┌─ SHOW   [Presets] [Cues] [Timers] [LFO] [MIDI] ─┐
│  (one tab's content at a time, not 5 stacked)   │
└─────────────────────────────────────────────────┘
```

Right column (Screen: Warp + PiP) is unchanged in position — direct-manipulation-on-preview is
already the right pattern there, per how MadMapper structures the same problem.

Media library goes above Layers, persistent, not buried in a card: you pick media before or while
assigning a layer's source, so it's the natural first stop (mirrors MadMapper's permanent media-bin
pane, rather than treating content management as a settings afterthought).

The five show-control cards (Presets/Cues/Timers/LFO/MIDI) become one tabbed section instead of
five stacked cards — reduces scroll depth on both desktop and mobile without losing anything.

### Mobile (<720px)

Bottom tab bar, four tabs: **Layers / Screen / Media / Show**. One full-height panel visible at a
time, independent internal scroll, 48px-tall bar in the thumb zone.

```
┌───────────────────────────┐
│ VPT          ● connected  │
├───────────────────────────┤
│                           │
│   [ active tab's panel ]  │
│   fills remaining height  │
│                           │
├───────────────────────────┤
│ [Layers][Screen][Media][Show] │
└───────────────────────────┘
```

Tablet widths (720–1099px) keep the existing single-column stacked behavior (today's one
`@media max-width:1100px` rule) — enough vertical room that tab-per-screen isn't needed yet.
Below 720px, `App.tsx` holds `activeMobileTab` state and renders only that section; the tab bar is
a new `MobileTabBar` component.

## 3. Touch ergonomics

New token: `--tap-min: 44px` (Apple HIG minimum; Material's 48px is close enough that we don't need
two separate constants).

Applied via `@media (any-pointer: coarse)` — this targets actual touchscreens (phone, tablet,
touch-capable laptops) regardless of viewport width, so mouse users keep today's compact sizing.
Affected: `ToggleSquare` (26px → 44px), `.move-btn` (26×12px → 44×44px), fader thumbs, `WarpHandle`
(16px → 44px, see below for how dense mesh warp avoids handles overlapping at that size), the PiP
resize corner (12px → 44px).

## 4. Layer strip restructure

The current 7-column CSS grid (`~700px` minimum-width, see `panel.css` `.strip`) physically cannot
fit a phone screen. It becomes a 2-row card:

- Row 1 (always-needed info): index/reorder, name, source, blend mode, opacity.
- Row 2 (actions, clearly grouped and spaced instead of 6 bare glyphs edge-to-edge): Mask, FX,
  Copy·Paste, Remove.

Same markup reflows from desktop down to phone by adjusting wrap via CSS — no separate mobile-only
component.

## 5. Warp editor: labeling and precision

- **Corner-pin mode:** each of the 4 handles gets a small always-visible tag (`TL`/`TR`/`BR`/`BL`).
- **Mesh mode:** permanent per-point numbering is too noisy at 8×8 (64 labels). Points stay
  unlabeled at rest; a mouse hover, or a tap/drag-start on touch, reveals that point's
  `R2·C3`-style coordinate.
- **Live coordinate readout:** any handle, while being dragged, shows a small floating badge with
  its live normalized position (e.g. `x 0.62 · y 0.18`).
- **Precision without collision:** bumping handles to the 44px touch minimum would make adjacent
  points overlap at high mesh density in a small stage. Resolution: dragging remains the coarse
  mechanism; tapping a handle *selects* it (highlight + its coordinate badge stays pinned) and
  reveals two small numeric X/Y text inputs for exact entry. One mechanism for coarse (drag), one
  for precise (type) — not a second gesture vocabulary (e.g. arrow-key nudging) layered on top.

## 6. Mask: on-canvas draggable editor

Masking currently has no on-canvas manipulation — five abstract sliders only (`FxDrawer.tsx`'s
`MASK_SLIDERS`). New capability, matching VPT8's original point-based mask tool:

- New `MaskShapeOverlay` component: a shape outline (ellipse or rect, per `mask.shape`) positioned
  from `cx/cy`, sized from `rx/ry`, rendered in tungsten (the layer-stack's existing color, not the
  cyan used for screen/render data — same grammar already established by the strip's tungsten
  accent bar).
  - Drag the shape body → updates `cx/cy`.
  - Drag an edge handle (right edge → `rx`, bottom edge → `ry`) → resizes each independently,
    matching the existing sliders' semantics exactly.
  - Feather stays a slider — dragging a soft-falloff distance isn't a natural direct-manipulation
    gesture. The shape may show a second, fainter, non-interactive outline previewing the feather
    extent.
- **Where it lives:** an "Edit on canvas" button next to the mask On/Off toggle in `FxDrawer.tsx`.
  Activating it puts the Screen tab's confidence monitor into a focused mask-edit mode for that
  layer: `WarpEditor`'s warp-handle children are replaced by the `MaskShapeOverlay`'s children
  (PiP boxes in the separate `PipWindows` monitor are unaffected), and a banner appears above the
  stage: `Editing mask — Layer 2: Starfield` with a `Done` button that clears the mode. On mobile,
  activating it also switches `activeMobileTab` to `"screen"` — it's the same "jump to the visual
  editor" affordance either way.
- State ownership: `App.tsx` holds `maskEditLayerId: string | null`, passed down to the Screen tab.
  No new server-side state — this reuses the existing `mask.cx/cy/rx/ry/feather` leaves exactly as
  the sliders do today; only the interaction surface is new.

## Testing

- Server: `test/media.test.js` (existing `node --test` pattern) — non-mp4 rejected, oversize
  rejected, successful upload appears in state and broadcasts `create`, `GET` serves with correct
  CORS + Range behavior, `DELETE` removes both file and state entry, rename via the existing
  generic `update` path works unchanged.
- Panel: no existing component-test framework beyond Storybook stories (`*.stories.tsx`) — this
  spec doesn't introduce one; new components (`MobileTabBar`, `MaskShapeOverlay`, the restructured
  `LayerStrip`) get stories matching the existing precedent. Functional verification follows the
  project's established pattern: a scripted Playwright pass against the live server + browser,
  screenshotting the confidence monitor to confirm compositing/mask/warp changes at the pixel
  level (see `control-panel/README.md`'s "What's verified" section for the existing version of this
  practice) — plus explicit mobile-viewport screenshots (390×844-class) to confirm the tab bar and
  44px targets, since none of the prior verification passes exercised a narrow viewport.

## Non-goals (this spec)

- Sub-projects 2–4 (per-layer warp, source-model expansion, clip-trigger grid) — sequenced after
  this one, not designed here.
- Art-Net/DMX, serial sensor input, Syphon — out of scope by the user's explicit decision (not
  hardware/interop this installation needs).
- A total media-library disk quota (only a per-file cap).
- Rotate/skew on the mask shape (VPT8's original tool didn't have it either — center/size/feather
  matches parity, not a new capability beyond it).
