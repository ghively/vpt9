# VPT Modernization Roadmap

This is the current source of truth for what's built, what direction was chosen, and what work
remains. It supersedes the earlier `docs/ROADMAP.md` (written 2026-07-04, first pass).
`docs/TECH_DEBT.md` and `docs/CONTROL_PANEL_SPEC_AUDIT.md` remain as closed historical audit
records — this doc doesn't repeat their findings, it points to them.

> **2026-07-05 status update:** all three subsystems below are now built and verified (see
> [`docs/superpowers/specs/2026-07-05-parity-subsystems-design.md`](superpowers/specs/2026-07-05-parity-subsystems-design.md)
> for the audit findings + design, and `control-panel/README.md` for the current feature set and
> verification record). Subsystem 1 (per-layer effects chain) and 2 (automation: cue-list
> interpreter, timer bank, layer copy/paste) are complete. Subsystem 3 is complete for everything
> software-reachable — LFO rack, camera source, WebMIDI CC mapping, and an OSC/UDP listener —
> while Art-Net/DMX/serial remain out of scope until physical hardware exists to test against;
> the WS + OSC protocol is the documented integration surface a future bridge would target.
> A same-day full audit also fixed 8 findings (a server crash vector, prototype pollution, no
> WS reconnect, sync-write-per-message persistence, hidden-PiP audio leak, invalid DIAL UUID,
> id-less creates, dead code). Still open: the `control-panel` license decision, and the
> real-hardware verification items listed at the end of the README.
>
> **2026-07-06 update:** the panel's operator UI was overhauled — see
> [`docs/superpowers/specs/2026-07-05-panel-ui-overhaul-design.md`](superpowers/specs/2026-07-05-panel-ui-overhaul-design.md).
> Composition moved to a two-column console (layer rack + show-control cards on the
> left, screen instruments on the right) and closed several engine-supported-but-
> unwired gaps: mask geometry faders, warp mesh-density selection, preset rename/
> delete, screen add/rename, and a state-built LFO/MIDI target picker. It also added a
> genuinely new capability, house master dim + hard blackout, deliberately excluded
> from presets/cue fades. `control-panel/README.md` now also links out to a new
> [`control-panel/OPERATOR_GUIDE.md`](../control-panel/OPERATOR_GUIDE.md) for the
> person running a show rather than building the software.
>
> **2026-07-06 update (2):** a fresh pass at "what would full VPT8 parity plus a genuinely better
> interface require" (prompted by user testing of the running panel) found the remaining gap is
> smaller than it sounds — engine-level parity was already closed above — but identified four real
> sub-projects: (1) a UI/UX overhaul (mobile layout, touch-target sizing, clearer layer-strip and
> warp-editor labeling, an on-canvas mask editor) plus a media library (the browser-world stand-in
> for VPT8's native file picker), (2) per-layer warp/corner-pin (VPT8 has this *in addition to* the
> master/output corner-pin already built — ours only has the latter), (3) source-model expansion
> (VPT8's shared/hot-swappable 8-slot source bank vs. our one-source-per-layer model), (4) a
> clip-trigger grid (VPT8's `clipcontrol.maxpat` — no analog exists yet).
> User-confirmed sequencing: 1 → 2 → 3 → 4 (sub-project 1's on-canvas editing patterns get reused by
> 2, so it goes first). User-confirmed non-goals: Art-Net/DMX, serial sensor input, and Syphon are
> explicitly out of scope for this installation (not merely deferred pending hardware — a real
> decision this time). Sub-project 1 is designed in
> [`docs/superpowers/specs/2026-07-06-panel-ux-and-media-library-design.md`](superpowers/specs/2026-07-06-panel-ux-and-media-library-design.md);
> sub-projects 2–4 are named and sequenced but not yet designed.
>
> **2026-07-06 correction:** the four-sub-project decomposition above missed two real gaps, caught
> only when asked directly whether it actually reached full parity. `render-client/src/layers.js`
> and `panel/src/components/types.ts` implement 6 of VPT8's 24 `shaders/v001 Mixers/` blend modes
> (normal/multiply/screen/overlay/difference/add) — 18 are missing. VPT8's whole-bank A/B crossfade
> (`mix-vpt7.maxpat`), distinct from per-layer blend modes, also has no analog. **User decision: both
> fold into sub-project 3** (same neighborhood as that sub-project's compositor/shader work) rather
> than becoming a 5th sub-project. Separately, VPT8's `hapsource.maxpat` uses the HAP codec, which no
> browser API decodes — the render-client's `<video>` element only plays codecs the browser supports
> natively (h264/vp9/av1/webm). **User decision: transcode source video to a standard web codec
> rather than build a HAP decoder** — browsers already hardware-decode those, so this is treated as
> equivalent in practice, not a gap requiring engineering. One further item was named but left as a
> deliberate design difference, not a gap: VPT8's single 100-row router (any input → any parameter)
> vs. our two separate mechanisms (WebMIDI CC-learn, OSC address-to-path) that reach the same
> destinations without one unified table.
>
> **2026-07-06 scope change:** the user asked for gif and jpg support in the media library.
> Storing/browsing those is a small server-side extension (broaden the upload allowlist), but
> *using* one as a layer's source is the still-image source-type piece that was sitting in
> sub-project 3 — so that piece is pulled forward into sub-project 1, on the reasoning that a
> library holding files you can't assign to a layer isn't useful. Sub-project 3 keeps the
> shared/hot-swappable source-bank architecture change plus the blend-mode/crossfade work; it no
> longer includes still-image support. `docs/superpowers/specs/2026-07-06-panel-ux-and-media-library-design.md`
> is updated accordingly.

## Status Quo

**VPT8 architecture audit (Track A) — closed.** Read-only audit of the original Max/MSP app:
[`docs/architecture/00-overview.md`](architecture/00-overview.md) plus 11 module docs covering all
49 patchers, and [`docs/TECH_DEBT.md`](TECH_DEBT.md) (78 findings). Verified via
[`docs/architecture/VERIFICATION-LOG.md`](architecture/VERIFICATION-LOG.md) (8/8 spot-checks
passed). Known coverage gaps admitted by the audit itself: camera sources (`cam1`/`cam2`) never got
a deep-dive, and the final `s ctrl` dispatch was only traced from the engine side.

**`control-panel/` web replacement (Track B) — functionally complete for parity subsystems 1–3,
partially verified.** A Node/WebSocket server, WebGL2 render client, React/TypeScript operator
panel, and DIAL/SSDP cast-receiver. Built in several passes (Phase 1 scaffold, then the full stack,
then the parity subsystems below, then a full React/TypeScript rewrite of the panel — see
[`docs/superpowers/specs/2026-07-05-panel-componentization-design.md`](superpowers/specs/2026-07-05-panel-componentization-design.md)
— then the UI overhaul), then spec-audited against its own README
([`docs/CONTROL_PANEL_SPEC_AUDIT.md`](CONTROL_PANEL_SPEC_AUDIT.md)) — 4 bugs found and fixed same
day; note that audit's file citations for `panel/` predate the React rewrite and no longer resolve
to real paths (the fixes themselves are still in place, just relocated — see
`docs/superpowers/specs/2026-07-05-panel-componentization-design.md` for where things moved). On
2026-07-04, live on a real (non-sandboxed) Windows machine: all JS files pass `node --check`; all
four services boot; the WebSocket state-sync protocol was exercised with two real clients (update
broadcast confirmed); the DIAL device description and the `POST /api/pip/:pipId/cast` →
PiP-visible hook both confirmed working end-to-end. Since then, `control-panel/README.md`'s
"What's verified" section records a further scripted Playwright pass (headless Chromium) that
**did** exercise real WebGL rendering in an actual browser, confirming layer compositing and the
full per-layer fx chain at the pixel level via screenshots — that item is no longer unverified.
Still unverified anywhere (see `control-panel/README.md`'s "Not verifiable from this environment"
list for the authoritative, current version of this): real YouTube playback inside the PiP iframe,
an actual phone's YouTube app casting to the receiver, Docker/GPU execution, and real hardware at
the edges (physical camera, MIDI controller, Chromecast, Art-Net/DMX/serial). A separate
2026-07-06 code-quality pass ([`docs/CONTROL_PANEL_CODE_QUALITY.md`](CONTROL_PANEL_CODE_QUALITY.md))
found 12 findings — including a live-reproduced `cast-receiver` crash on port conflict and a
non-atomic `state.json` write that could silently discard a show's saved state on a mid-write
crash — all fixed and verified the same evening (43 new automated tests added to `server/` in the
process; a `lint` script added to `panel/`).

## Direction Decision

Direction has shifted from "stay in Max and upgrade" to **port to `control-panel/`** — a decision
originally made only in an unrecorded conversation, first written down in the 2026-07-04
`ROADMAP.md`, and carried forward here. This doc does not re-litigate that choice.

## Subsystem Inventory — CLOSED (all three built; kept below as a historical record)

> This section originally (2026-07-04) identified three subsystems as missing, ranked by impact,
> before any of them had a spec. All three have since been designed and built — see
> [`docs/superpowers/specs/2026-07-05-parity-subsystems-design.md`](superpowers/specs/2026-07-05-parity-subsystems-design.md)
> for the implementation spec and `control-panel/README.md`'s Services table and "What's verified"
> section for the current, authoritative feature set. The per-subsystem write-ups below are kept
> **as originally written, for history** — read them as "what was missing as of 2026-07-04," not
> as live gaps. Two categories that might look like a fourth and fifth "subsystem" were deliberately
> folded into the three below rather than tracked separately: verification/testing (part of each
> subsystem's own definition of done) and the `control-panel` license choice (a standalone
> one-time decision to make before ever distributing it, not a build project — still open, see
> "Non-Goals" below).

### 1. Per-layer visual effects chain — Priority 1 — CLOSED

VPT8's `vlayer.maxpat` runs each layer through 9 stages: flip, tile, zoom, blur, motion-blur/slide,
brightness/contrast/saturation ("brcosa"), mask, edge-blend, mesh. As of 2026-07-04,
`control-panel`'s `render-client/src/compositor.js` implemented only 2: shape-based mask
(rect/ellipse + feather) and blend-mode compositing.

**Gap (as of 2026-07-04, now closed):** flip, tile, zoom, blur, motion-blur, brcosa, edge-blend — 7
of 9 stages missing.
**Resolution:** `render-client/src/fx.js` now implements the full flip → tile → zoom/pan →
brightness/contrast/saturation → edge-blend chain in one shader pass, plus separable gaussian blur
and motion-blur feedback, gated by `fxNeedsChain()`; per-layer UI controls live in the panel's FX
drawer (`panel/src/components/FxDrawer.tsx`); the server's layer state schema carries the `fx`
object documented in `control-panel/README.md`'s State shape section.

### 2. Whole-app automation — Priority 2 — CLOSED

VPT8 has three automation paths: the preset module, a sequential cue-list script interpreter
(`C`/`F`/`D`/`L`/`S`/`R`/`O` letter codes), and a 15-alarm wall-clock timer bank, plus per-layer
`copypaste`. As of 2026-07-04, `control-panel` only had presets (`presetSave`/`presetRecall`).

**Gap (as of 2026-07-04, now closed):** cue-list interpreter, timer bank, copy-paste.
**Resolution:** `server/src/automation.js` implements the cue-list interpreter (`recall`/`fade`/
`wait`/`goto` cue types) and the wall-clock timer bank; the panel's `CueList.tsx`/`TimerBank.tsx`
drive them and `App.tsx` implements layer copy/paste.

### 3. Input sources & control surfaces — Priority 3 — CLOSED for everything software-reachable

VPT8 has camera sources (`cam1`/`cam2`), hardware + soft MIDI, OSC, Art-Net/DMX, serial/sensor
input, a 100-row control router, and a 10-slot LFO modulation rack. As of 2026-07-04,
`control-panel` had none of this.

**Gap (as of 2026-07-04, now closed for the software-reachable parts):** everything in this
category.
**Resolution:** camera source support lives in `render-client/src/layers.js`; WebMIDI CC learn/map
is `panel/src/app/useMidi.ts` + `panel/src/components/MidiMapPanel.tsx`; the LFO rack is
`panel/src/components/LfoRack.tsx` with server-side oscillation in `server/src/automation.js`; an
OSC/UDP listener is `server/src/osc.js`. Art-Net/DMX and serial/sensor input remain out of scope —
no browser API reaches them; they'd need a small local bridge process speaking the WS/OSC protocol
`control-panel/README.md` documents as the integration surface for exactly this.
**Open question (still genuinely open, not an engineering call):** does the actual installation
this is meant to run need physical hardware control (Art-Net/DMX, serial sensors, a real MIDI
controller) at all? Every doc that touches this (this one, `control-panel/README.md`'s "Not
verifiable" list, and the parity-subsystems design spec) treats it the same way: deliberately
deferred until hardware is actually in the room, not resolved either way — that's a call for
whoever runs the installation, not something a future coding agent should decide unilaterally.

## Sequencing — historical

This was the planned build order, followed as written: **1) per-layer effects chain → 2) whole-app
automation → 3) input sources & control surfaces.** Each subsystem's "done" included exercising its
new pieces in a real browser via a scripted check (Playwright) — see `control-panel/README.md`'s
"What's verified" section for the resulting verification record.

## Non-Goals

- No license chosen for `control-panel` — flagged as a one-time open decision to make before ever
  distributing it, still not resolved here or anywhere else in the repo.
- (Historical, from the 2026-07-04 first pass, now moot: at the time this section was written there
  was no new code and no spec yet for the effects chain, automation, or input/control subsystems —
  see the Subsystem Inventory above for how each was subsequently spec'd and built.)

## Superseded / Related Documents

- This file supersedes the 2026-07-04 first-pass `ROADMAP.md`.
- [`docs/TECH_DEBT.md`](TECH_DEBT.md) — closed audit, 78 findings against the original VPT8 source.
  Still the reference for VPT8-specific debt if any Max-side work ever continues in parallel with
  `control-panel`.
- [`docs/CONTROL_PANEL_SPEC_AUDIT.md`](CONTROL_PANEL_SPEC_AUDIT.md) — closed spec-compliance audit
  of `control-panel/` (4 bugs found and fixed 2026-07-03).
- [`docs/CONTROL_PANEL_CODE_QUALITY.md`](CONTROL_PANEL_CODE_QUALITY.md) — closed code-quality audit
  of `control-panel/` (2026-07-06): error handling, data-integrity, and test/lint gaps, including a
  live-reproduced crash bug. All 12 findings fixed and verified the same evening.
- [`docs/architecture/00-overview.md`](architecture/00-overview.md) and its 11 module docs — the
  full VPT8 map this roadmap's subsystem gaps are derived from.
- [`docs/superpowers/specs/2026-07-04-master-roadmap-design.md`](superpowers/specs/2026-07-04-master-roadmap-design.md)
  — the design spec this document implements.
- [`docs/superpowers/specs/2026-07-05-parity-subsystems-design.md`](superpowers/specs/2026-07-05-parity-subsystems-design.md)
  — the design + audit for closing all three Subsystem Inventory gaps above.
- [`docs/superpowers/specs/2026-07-05-panel-componentization-design.md`](superpowers/specs/2026-07-05-panel-componentization-design.md)
  — the design for rewriting `panel/` from vanilla JS to React/TypeScript (the reason
  `docs/CONTROL_PANEL_SPEC_AUDIT.md`'s `panel/` file citations no longer resolve to real paths).
- [`docs/superpowers/specs/2026-07-05-panel-ui-overhaul-design.md`](superpowers/specs/2026-07-05-panel-ui-overhaul-design.md)
  — the design for the two-column console layout, house master/blackout, and mask/mesh/preset/
  target-picker UI referenced in the 2026-07-06 status update above.
- [`docs/superpowers/specs/2026-07-06-panel-ux-and-media-library-design.md`](superpowers/specs/2026-07-06-panel-ux-and-media-library-design.md)
  — sub-project 1 of the 4-part decomposition in the second 2026-07-06 update above: mobile layout,
  touch-target sizing, the media library (server + panel), warp-editor labeling, and the new
  on-canvas mask editor.
