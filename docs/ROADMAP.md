# VPT Modernization Roadmap

This is the current source of truth for what's built, what direction was chosen, and what work
remains. It supersedes the earlier `docs/ROADMAP.md` (written 2026-07-04, first pass).
`docs/TECH_DEBT.md` and `docs/CONTROL_PANEL_SPEC_AUDIT.md` remain as closed historical audit
records — this doc doesn't repeat their findings, it points to them.

**Current status (2026-07-12):** the panel UI is a **"projection deck"** (dominant live-preview
Stage with click-to-select and on-stage warp/mask handles, a contextual Warp·Mask·FX Inspector,
compact LayerStack/SlotGrid rails, a Show drawer, a screen selector, mobile layout — see the
2026-07-12 update near the bottom of this file and `control-panel/README.md` for the current,
authoritative feature description), and **`control-panel` is now at full VPT8 parity** — a
2026-07-12 adversarial audit (`docs/VPT8-PARITY-GAPS.md`) found the earlier "full parity" claim
below (2026-07-11) had been overstated (~15 real gaps + a bug + a regression), and all of them were
subsequently closed (task-by-task log: `docs/REMAINING-WORK.md`). The blockquoted status updates
below are kept in date order as a historical narrative — read the 2026-07-12 entry at the bottom
for the corrections to the two entries that turned out to be premature.

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
> person running a show rather than building the software. *(Superseded 2026-07-11 —
> this two-column console was itself replaced by the "projection deck" redesign; see
> the 2026-07-12 update near the bottom of this file. `control-panel/README.md` and
> `OPERATOR_GUIDE.md` now describe the deck, not this layout.)*
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
>
> **2026-07-08 status update: sub-project 1 (UI/UX overhaul + media library) is now CLOSED.** Built
> per `docs/superpowers/specs/2026-07-06-panel-ux-and-media-library-design.md`: the media library
> (`server/src/media.js` — upload/serve/delete for mp4/gif/jpg/jpeg with CORS + Range support;
> `panel/src/components/MediaLibrary.tsx`), still-image/gif layer sources
> (`render-client/src/layers.js`), the two-column mobile layout with a bottom tab bar below 720px
> (`panel/src/components/MobileTabBar.tsx`, `useIsMobile`), 44px touch targets on coarse pointers
> (`tokens.css`/`panel.css`), the restructured two-row layer strip (`LayerStrip.tsx`), warp-editor
> corner/mesh tags plus tap-to-select-and-type-exact-coordinates (`WarpEditor.tsx`, `WarpHandle.tsx`),
> and the on-canvas mask shape editor (`MaskShapeOverlay.tsx`). Server-side: 15 new tests in
> `server/test/media.test.js` (plus `media-helpers.test.js`), all passing. Two verification gaps from
> the spec were **not** closed and remain open, tracked here rather than silently dropped: the spec's
> planned Playwright pixel check (jpg/gif compositing, gif animation across two screenshots) was never
> built — no Playwright dependency or spec file exists anywhere in `control-panel/` — so this batch of
> work has automated server coverage but no live-browser verification; `control-panel/README.md`'s
> "What's verified" section accurately reflects this by omission. `control-panel/OPERATOR_GUIDE.md`
> has been updated to document all of the above.
>
> **2026-07-11 status update: sub-projects 2, 3, and 4 are now CLOSED.** *(This update's closing
> claim of "full VPT8 parity reached" turned out to be overstated — a 2026-07-12 adversarial audit
> found ~15 real remaining gaps, a bug, and a regression. See the 2026-07-12 update near the bottom
> of this file for the correction; all of those gaps were subsequently closed too. The subsystem work
> described immediately below is accurate as a historical record of what this pass actually built —
> only the "full parity" framing was premature.)*
> Built per `docs/superpowers/specs/2026-07-08-parity-finish-line-design.md` and
> `docs/superpowers/plans/2026-07-08-parity-finish-line-plan.md` (17 tasks, executed via three
> parallel worktree-isolated lanes with per-task subagent review):
> - **Per-layer warp/corner-pin** (sub-project 2): `layer.warp` (identical shape to screen warp),
>   applied via a generalized `ScreenWarp` (now targets an offscreen FBO or the canvas), reordered
>   so mask bakes into a layer's alpha **before** warp deforms it (`render-client/src/fx.js`'s
>   `_runMask`/`_runWarp`) — matching VPT8's own mask-then-mesh order. Corner-pin presets
>   (full/center/thirds/rotations) and an on-canvas editor (`panel/src/components/WarpEditor.tsx`
>   generalized to edit either a screen or a layer) round it out.
> - **Source bank + all 24 blend modes + mix-source type** (sub-project 3): `state.sourceBank` (8
>   shared slots, hybrid model — layers default to direct source assignment, optionally point at a
>   slot), all 18 remaining blend-mode formulas ported from VPT8's `shaders/v001 Mixers/*.fp.glsl`
>   (verified formula-by-formula against the original source, including two modes — `heat`/
>   `hardlight` — whose VPT8 call sites use a non-obvious argument order), and a mix-source type
>   (`render-client/src/source-bank.js`) that crossfades two inputs into one texture. The mix-cycle
>   guard (`wouldCreateMixCycle` in `server/src/state.js`, preventing a mix from ever referencing
>   another mix) went through 8 rounds of adversarial review before converging on a structurally
>   sound design (full-array revalidation via the same `walkToParent` primitive real writes use,
>   rather than pattern-matching write shapes) — see `docs/superpowers/plans/2026-07-08-parity-
>   finish-line-plan.md`'s Task 7 for the full history; this is the most heavily-scrutinized logic
>   in the codebase.
> - **Clip transport + playlist sequencing** (sub-project 4): per-layer `transport` (play/pause,
>   rate, loop in/out via manual seek, palindrome mode, pan/vol via Web Audio) and `playlist`
>   (still-image items advance on a server-side wall-clock timer; video items advance only when the
>   audio-owner render-client observes the native `ended` event and relays it — the server has no
>   other way to know a video finished). Reverse/negative-rate playback is an explicit non-goal (no
>   browser allows negative `playbackRate` — a hard platform limit VPT8 itself doesn't face). A
>   same-day follow-up closed a wiring gap this update had left behind: the panel's operator UI for
>   this subsystem (`FxDrawer.tsx`'s Transport section — play/rate/pan/vol/loop mode/loop in-out —
>   plus a new Playlist section with an ordered media-item editor and the single/playlist mode
>   toggle) was never connected to the `Layer` type or the layer strip, so it was reachable only via
>   raw WebSocket/OSC; it's now wired end-to-end through `ChannelRack`/`LayerStrip` to
>   `actions.setSourceMode`/`actions.setPlaylist`, making the "full software-reachable parity" claim
>   below accurate without a caveat.
>
> **Verification:** `control-panel/e2e/` is a new Playwright harness (didn't exist before this
> work) with 4 spec files — `media-compositing`, `layer-warp`, `blend-and-mix`,
> `transport-and-playlist` — each spawning a real server + render-client with isolated
> per-spec state (an earlier version shared the real dev `state.json`/media directory across
> specs, which caused two independent test-review sessions to reach contradictory conclusions
> about the same commit before the contamination was diagnosed and fixed). Also closed
> sub-project 1's still-open verification gap named in the 2026-07-08 update above. Current
> suite: 5 passed, 2 skipped — both skips are documented, known environment limitations, not
> app bugs (a headless-Chromium gif-frame-advancement limitation already recorded in prior
> session memory, and a mix-slot pixel check requiring an HTTP-multipart test-fixture helper
> the harness doesn't have yet). Server test suite: 113/113 passing.
>
> **Explicit non-goals, reaffirmed:** VPT8's native per-slot A/B crossfade-on-clip-change
> smoothness (lost by the source-bank simplification — slots point at media-library entries
> rather than duplicating a two-decoder crossfade engine); a literal multi-cell clip-launch grid
> (VPT8's own `clipcontrol.maxpat` is per-source transport + a single-sequence playlist, not that,
> and this work matches VPT8's actual behavior); Art-Net/DMX/serial/Syphon (2026-07-06 decision).
>
> **Two known, tracked follow-ups** (both real, both scoped out of this pass rather than silently
> dropped — see the plan doc's Task 14 section): a layer's loop in/out timer doesn't survive a
> *second* source change within the same session before this pass's fix landed (now fixed); and a
> playlist item that resolves to a shared source-bank slot renders correctly as of this pass (the
> render-client's slot-detection now reads from the actually-resolved entry, not the layer's static
> source field) — flagging both as closed, not open, per the Task 14 fix-and-verify commit.
>
> **With this update, `control-panel/` has full software-reachable feature parity with VPT8** —
> every subsystem named across the 2026-07-04 through 2026-07-08 audits is now built. What remains
> genuinely open: real-hardware verification (physical camera, MIDI controller, Chromecast — see
> `control-panel/README.md`'s "Not verifiable from this environment" list) and the standing question
> of whether the actual installation needs Art-Net/DMX/serial hardware integration at all (still a
> call for whoever runs the show, not resolved here). *(This "subsystem is built" reading of parity
> held up; what didn't was assuming subsystem presence meant full parameter/capability parity within
> each one — the 2026-07-12 audit found real per-parameter gaps inside already-"closed" subsystems.
> See the 2026-07-12 update below.)*
>
> **2026-07-12 update: the "projection deck" panel redesign, a rigorous parity audit, and the
> closure of every gap it found.** Two independent efforts landed this pass:
>
> 1. **Panel UI redesign — the "projection deck."** User testing of the two-column console (built
>    2026-07-06) surfaced a clear ask: a dominant live preview, real hierarchy, and the ability to
>    shape/warp layers directly on the picture instead of in a side panel. Designed in
>    [`docs/superpowers/specs/2026-07-11-projection-deck-redesign-design.md`](superpowers/specs/2026-07-11-projection-deck-redesign-design.md)
>    and built as a new `panel/src/components/deck/` tree: a dominant **Stage** (`Stage.tsx`) showing
>    the live preview with per-layer click-to-select regions; **StageSelectionOverlay.tsx** drawing
>    the selected layer's warp/mask handles directly on the Stage; a contextual **Inspector.tsx**
>    with a Warp·Mask·FX segmented switch; compact **LayerStack.tsx** + **SlotGrid.tsx** rails; a
>    collapsible **ShowDrawer.tsx** (Presets·Cues·Timers·LFO·MIDI·Media·PiP); a screen selector in
>    the command bar; and a mobile bottom-sheet layout. This replaced the 2026-07-06 two-column
>    console entirely — see `control-panel/README.md` and `control-panel/OPERATOR_GUIDE.md` for the
>    current, authoritative description (both fully rewritten, not just patched, for this update).
> 2. **Adversarial parity audit.** Prompted by a direct question — "does this actually reach full
>    VPT8 parity?" — a four-agent adversarial audit cross-checked all 11 VPT8 architecture modules
>    against the actual `control-panel` code, not the ROADMAP's claims. Verdict, recorded in
>    [`docs/VPT8-PARITY-GAPS.md`](VPT8-PARITY-GAPS.md): **not** at full parity. The 2026-07-11 "full
>    software-reachable feature parity" claim above reflected subsystem *presence*; it missed
>    per-parameter gaps inside subsystems already marked closed. Findings: ~15 real gaps (arbitrary-
>    polygon masking + invert + luminance matte; per-layer rotation + non-uniform zoom + anchor;
>    shared source-bank transport/presets/camera-color-as-slot/camera-picker; cue codes `S`/`R`/`O`;
>    OSC output; LFO mixers/tempo/phase; blind mode; per-fx-stage bypass; cue manual-GO checkpoints;
>    edge-blend invert; clip scrub/seek; per-source downscale; next/prev/random triggers; wider/
>    smoother mesh warp; cursor-hide), **1 regression** (per-layer copy/paste, present since
>    2026-07-05, silently dropped when the deck redesign removed the component that held it), and
>    **1 bug** (a jpg/gif dropped into a shared source-bank slot rendered black).
>
> **All of it was subsequently closed**, tracked task-by-task in
> [`docs/REMAINING-WORK.md`](REMAINING-WORK.md) and executed per
> [`docs/superpowers/plans/2026-07-12-full-parity-finish-plan.md`](superpowers/plans/2026-07-12-full-parity-finish-plan.md)
> (24 tasks: A1–A21 parity fixes, B1–B3 this doc rewrite, C1–C4 divorcing the archived VPT8 Max/MSP
> source, D1–D3 real-world verification pending hardware/a Docker host). **With this pass,
> `control-panel/` is genuinely at full VPT8 software-reachable parity** — both at the subsystem
> level (2026-07-11's claim) and the per-parameter level (this audit's bar). `control-panel/README.md`'s
> feature-set section and "What's verified" section are the current, authoritative record; this
> document's earlier "full parity" language (2026-07-11, and the "software-reachable feature parity"
> line above) is corrected by this entry, not deleted, so the sequence of claims and corrections stays
> legible. Confirmed non-goals are unchanged (see below) — the audit found real gaps, not disagreement
> with any non-goal decision already made.

## Status Quo

**VPT8 architecture audit (Track A) — closed.** Read-only audit of the original Max/MSP app:
[`docs/architecture/00-overview.md`](architecture/00-overview.md) plus 11 module docs covering all
49 patchers, and [`docs/TECH_DEBT.md`](TECH_DEBT.md) (78 findings). Verified via
[`docs/architecture/VERIFICATION-LOG.md`](architecture/VERIFICATION-LOG.md) (8/8 spot-checks
passed). Known coverage gaps admitted by the audit itself: camera sources (`cam1`/`cam2`) never got
a deep-dive, and the final `s ctrl` dispatch was only traced from the engine side.

**`control-panel/` web replacement (Track B) — as of 2026-07-12, at full VPT8 parity (see the
2026-07-12 update below); this paragraph is the historical build narrative through the 2026-07-06
UI overhaul.** A Node/WebSocket server, WebGL2 render client, React/TypeScript operator
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
`wait`/`goto`/`source`/`paramFade`/`osc` cue types, the last three added by the 2026-07-12 parity
pass) and the wall-clock timer bank; the panel's `CueList.tsx`/`TimerBank.tsx` drive them and layer
copy/paste is implemented in `panel/src/components/deck/LayerStack.tsx` (originally landed in the
pre-deck `App.tsx`, dropped as a regression when the 2026-07-11 projection-deck redesign removed
that component, and restored — see task A2 in `docs/REMAINING-WORK.md` — during the 2026-07-12
parity-gap closure).

### 3. Input sources & control surfaces — Priority 3 — CLOSED for everything software-reachable

VPT8 has camera sources (`cam1`/`cam2`), hardware + soft MIDI, OSC, Art-Net/DMX, serial/sensor
input, a 100-row control router, and a 10-slot LFO modulation rack. As of 2026-07-04,
`control-panel` had none of this.

**Gap (as of 2026-07-04, now closed for the software-reachable parts):** everything in this
category.
**Resolution:** camera source support lives in `render-client/src/layers.js` (extended by the
2026-07-12 pass with a device picker, resolution constraints, and record-to-disk); WebMIDI CC
learn/map is `panel/src/app/useMidi.ts` + `panel/src/components/MidiMapPanel.tsx`; the LFO rack is
`panel/src/components/LfoRack.tsx` with server-side oscillation in `server/src/automation.js`
(extended 2026-07-12 with waveform-mixer rows, tempo/BPM sync, phase offset, and waveform invert);
an OSC/UDP listener is `server/src/osc.js`, joined 2026-07-12 by an OSC **sender** (`server/src/
osc-out.js`) that mirrors state changes back out for bidirectional surfaces. Art-Net/DMX and
serial/sensor input remain out of scope — no browser API reaches them; they'd need a small local
bridge process speaking the WS/OSC protocol `control-panel/README.md` documents as the integration
surface for exactly this.
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

- **License — resolved 2026-07-08.** `control-panel` is MIT-licensed (`control-panel/LICENSE`); it's
  an independent rewrite, not a derivative of VPT8's Max/MSP source, so it doesn't inherit that
  source's CC BY-NC-SA 3.0 terms. User-confirmed: permissive, not the noncommercial/share-alike
  option also offered.
- **Hardware control (Art-Net/DMX, serial sensors, a real MIDI controller) — confirmed out of scope,
  2026-07-08.** Re-affirms the 2026-07-06 non-goal decision below rather than reopening it: this
  installation doesn't need physical hardware integration for the software to be considered
  finished. The WS/OSC protocol remains the documented integration surface if that ever changes.
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
- [`docs/superpowers/specs/2026-07-08-parity-finish-line-design.md`](superpowers/specs/2026-07-08-parity-finish-line-design.md)
  and [`docs/superpowers/plans/2026-07-08-parity-finish-line-plan.md`](superpowers/plans/2026-07-08-parity-finish-line-plan.md)
  — the design + 17-task plan for sub-projects 2–4 (per-layer warp, source bank + all 24 blend modes
  + mix-source type, clip transport + playlist), referenced in the 2026-07-11 status update above.
- [`docs/VPT8-PARITY-GAPS.md`](VPT8-PARITY-GAPS.md) — the 2026-07-12 four-agent adversarial parity
  audit that found the 2026-07-11 "full parity" claim above was overstated; the authoritative list
  of what was actually still missing at that point.
- [`docs/superpowers/specs/2026-07-11-projection-deck-redesign-design.md`](superpowers/specs/2026-07-11-projection-deck-redesign-design.md)
  — the design for the "projection deck" panel UI (Stage, Inspector, LayerStack, SlotGrid, Show
  drawer) that replaced the 2026-07-06 two-column console; see the 2026-07-12 update above.
- [`docs/superpowers/plans/2026-07-12-full-parity-finish-plan.md`](superpowers/plans/2026-07-12-full-parity-finish-plan.md)
  — the 24-task plan (parity fixes, this doc rewrite, VPT8-source divorce, real-world verification)
  that closed every gap `docs/VPT8-PARITY-GAPS.md` found; live status: `docs/REMAINING-WORK.md`.
