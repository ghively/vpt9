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
3. Source-model expansion (VPT8's shared/hot-swappable 8-slot source bank vs. our
   one-source-per-layer model, plus the remaining 18 of 24 blend modes and A/B bank crossfade).
4. Clip-trigger grid (VPT8's `clipcontrol.maxpat` — no analog exists yet).

**Scope change from the original decomposition:** still-image and animated-gif source support was
originally slated for sub-project 3, but a media library that can store a jpg/gif you can never
assign to a layer isn't useful, so that piece is pulled forward into this spec (see "Media as a
layer source" below). Sub-project 3 keeps the *shared/hot-swappable source-bank* architecture
change (decoupling sources from layers) plus the blend-mode/crossfade work.

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
  `{ "media-<id>": { id, name, filename, kind, size, uploadedAt } }`. `kind` is one of
  `"video" | "gif" | "image"`, derived from the upload's extension at write time so the panel and
  render-client never have to re-parse a filename to know how to treat a file. Added to
  `DEFAULT_STATE` and backfilled via `ensureStateDefaults`'s existing `fillMissing`
  (server/src/state.js) so old `state.json` files upgrade cleanly.
- Files live under `MEDIA_DIR` (env var, default `./media`; Docker default `/data/media`, reusing
  the existing `state-data` volume — no new volume). Internal filename is server-generated
  (`media-<id>.<ext>`), never derived from the client-supplied name, closing off path traversal by
  construction. The display name (editable) is metadata only.
- **Allowed extensions:** `.mp4` (→ `kind: "video"`, `video/mp4`), `.gif` (→ `kind: "gif"`,
  `image/gif`), `.jpg`/`.jpeg` (→ `kind: "image"`, `image/jpeg`). One allowlist, checked
  case-insensitively; anything else is rejected at upload (400). The per-file size cap
  (`MEDIA_MAX_BYTES`, default 1 GiB) applies uniformly — images/gifs will in practice be far
  smaller, so a separate, lower cap per type isn't worth the added complexity.
- Three new HTTP endpoints on the existing hand-rolled `http` server (no multipart library, matching
  the codebase's existing minimal-dependency style — raw request body + an `X-File-Name` header,
  mirroring how `readJsonBody` is already hand-rolled):
  - `POST /api/media` — body is raw file bytes; the extension from `X-File-Name` decides `kind` and
    is validated against the allowlist above (400 if not recognized). Size enforced against
    `Content-Length` up front, and re-checked against actual bytes written in case `Content-Length`
    is absent/wrong (abort + delete partial file, 413). On success: write file,
    `applyCreate(state, "media", {...})`, `scheduleSave()`,
    `broadcast({type:"create", path:"media", ...})` — same pattern as the existing PiP-cast hook.
  - `GET /media/:filename` — validates the filename against
    `^media-[A-Za-z0-9_-]+\.(mp4|gif|jpe?g)$` before touching the filesystem (defense in depth; ids
    are server-generated so this should never fail for a legitimate request), and sets
    `Content-Type` from the matched extension. Streams with **HTTP Range support** (required for
    `<video>` seeking; harmless for the smaller gif/image files) and
    `Access-Control-Allow-Origin: *`. The CORS header isn't optional for any of the three kinds:
    `render-client/src/layers.js` already sets `crossOrigin = "anonymous"` on its video element
    because frames get drawn into a WebGL texture, and the same taint rule applies to images/gifs
    sampled into a texture the same way (see "Media as a layer source" below).
  - `DELETE /api/media/:id` — deletes the file from disk and the state entry, broadcasts `delete`.
  - Rename needs no new endpoint — it's a plain WS `update` on `media.<id>.name`, which the existing
    generic `applyUpdate` already handles.
- No total-library quota — explicit non-goal; only a per-file cap.

### Panel

- New persistent "Media library" pane, always visible above the layer rack (not one more
  `sc-card` among Presets/Cues/Timers/LFO/MIDI — see the IA section below for why).
- Rows: editable name (existing `TextField` commit pattern), a small mono type tag (`MP4`/`GIF`/
  `JPG`), formatted size, delete (`×`).
- Upload: a file input (`accept="video/mp4,image/gif,image/jpeg"`) + upload button. Uses
  `XMLHttpRequest` (not `fetch`) specifically because it exposes `upload.onprogress`, needed for a
  progress indicator on large files.
- A layer's video-source field becomes a `Select` populated from `state.media` (label = name,
  regardless of `kind`) plus an "External URL…" option that reveals the existing raw `TextField` —
  keeps the ability to point at an arbitrary external stream without regressing that capability.

### Media as a layer source: images and gifs

The render-client composites every layer by re-sampling a source element into a WebGL texture once
per rendered frame (`render-client/src/layers.js` does this today for `<video>` elements). That
same mechanism works unchanged for images: a static jpg or an animated gif is just a different
source element to sample from.

- When a layer's source resolves to a media-library entry with `kind: "gif"` or `kind: "image"`,
  the render client creates an `<img crossOrigin="anonymous">` instead of a `<video>`. Animated
  gifs auto-advance their own frame on the browser's own clock; sampling the `<img>` into the
  texture every render frame picks up whatever frame is currently showing, with no extra animation
  logic needed on our side. A static jpg only needs a single texture upload (its pixels never
  change) rather than a re-upload every frame — a cheap, worthwhile optimization over treating it
  like video.
- `source.type` stays `"video"` rather than gaining a new `"image"` value — it already means "a
  URL/file-backed visual source," and `kind` (carried on the resolved media entry) is what actually
  distinguishes video/gif/image at the render-client level. This avoids a state-shape migration for
  every layer already saved with `type: "video"`, at the cost of the field name being a mild
  misnomer for a still image. Worth naming explicitly so it doesn't read as an oversight later.

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

- Server: `test/media.test.js` (existing `node --test` pattern) — each of mp4/gif/jpg/jpeg uploads
  successfully with the right `kind` and `Content-Type`, an unrecognized extension is rejected
  (400), oversize is rejected (413), successful upload appears in state and broadcasts `create`,
  `GET` serves with correct CORS + Range behavior for all three kinds, `DELETE` removes both file
  and state entry.
- Render-client: a Playwright pixel check (matching the project's existing verification style)
  assigning a jpg and a gif to a layer each, confirming both composite correctly and that the gif
  actually animates across two screenshots taken a beat apart.

> **2026-07-08 correction:** as actually built, `media.test.js` does not include a rename test (rename
> goes through the existing generic `update` path and was judged already covered by that path's own
> tests) — the line above claiming it does was aspirational, not built. The render-client Playwright
> pixel check for jpg/gif compositing described above was never built either; no Playwright dependency
> or spec file exists anywhere in `control-panel/` for this work. See `control-panel/README.md`'s
> "What's verified" section for the current, accurate record of what has and hasn't been exercised
> live for this batch of work.
- Panel: no existing component-test framework beyond Storybook stories (`*.stories.tsx`) — this
  spec doesn't introduce one; new components (`MobileTabBar`, `MaskShapeOverlay`, the restructured
  `LayerStrip`) get stories matching the existing precedent. Functional verification follows the
  project's established pattern: a scripted Playwright pass against the live server + browser,
  screenshotting the confidence monitor to confirm compositing/mask/warp changes at the pixel
  level (see `control-panel/README.md`'s "What's verified" section for the existing version of this
  practice) — plus explicit mobile-viewport screenshots (390×844-class) to confirm the tab bar and
  44px targets, since none of the prior verification passes exercised a narrow viewport.

## Non-goals (this spec)

- Sub-project 2 (per-layer warp), the shared/hot-swappable source-bank architecture change and
  blend-mode/crossfade work in sub-project 3, and sub-project 4 (clip-trigger grid) — sequenced
  after this one, not designed here. (Still-image/gif source support itself is in scope for this
  spec, per the scope change noted in Context.)
- Art-Net/DMX, serial sensor input, Syphon — out of scope by the user's explicit decision (not
  hardware/interop this installation needs).
- A total media-library disk quota (only a per-file cap).
- Rotate/skew on the mask shape (VPT8's original tool didn't have it either — center/size/feather
  matches parity, not a new capability beyond it).
- Other image formats (png, webp, etc.) and video formats beyond mp4 — not requested; the allowlist
  is a plain array in one place in the server if that changes later.
