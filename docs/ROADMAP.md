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

## Status Quo

**VPT8 architecture audit (Track A) — closed.** Read-only audit of the original Max/MSP app:
[`docs/architecture/00-overview.md`](architecture/00-overview.md) plus 11 module docs covering all
49 patchers, and [`docs/TECH_DEBT.md`](TECH_DEBT.md) (78 findings). Verified via
[`docs/architecture/VERIFICATION-LOG.md`](architecture/VERIFICATION-LOG.md) (8/8 spot-checks
passed). Known coverage gaps admitted by the audit itself: camera sources (`cam1`/`cam2`) never got
a deep-dive, and the final `s ctrl` dispatch was only traced from the engine side.

**`control-panel/` web replacement (Track B) — actively built, partially verified.** A Node/
WebSocket server, WebGL2 render client, operator panel, and DIAL/SSDP cast-receiver. Built in two
passes (Phase 1 scaffold, then the full stack), then spec-audited against its own README
([`docs/CONTROL_PANEL_SPEC_AUDIT.md`](CONTROL_PANEL_SPEC_AUDIT.md)) — 4 bugs found and fixed same
day. On 2026-07-04, live on a real (non-sandboxed) Windows machine: all 20 JS files pass
`node --check`; all four services boot; the WebSocket state-sync protocol was exercised with two
real clients (update broadcast confirmed); the DIAL device description and the
`POST /api/pip/:pipId/cast` → PiP-visible hook both confirmed working end-to-end. Still unverified
anywhere: real WebGL visual rendering in an actual browser, real YouTube iframe playback, real
phone-to-DIAL discovery, Docker/GPU execution, real Chromecast hardware.

## Direction Decision

Direction has shifted from "stay in Max and upgrade" to **port to `control-panel/`** — a decision
originally made only in an unrecorded conversation, first written down in the 2026-07-04
`ROADMAP.md`, and carried forward here. This doc does not re-litigate that choice.

## Subsystem Inventory

Three subsystems remain before `control-panel` reaches functional parity with VPT8. Two categories
that might look like a fourth and fifth "subsystem" are deliberately folded into the three below
rather than tracked separately: verification/testing (part of each subsystem's own definition of
done) and the `control-panel` license choice (a standalone one-time decision to make before ever
distributing it, not a build project).

### 1. Per-layer visual effects chain — Priority 1

VPT8's `vlayer.maxpat` runs each layer through 9 stages: flip, tile, zoom, blur, motion-blur/slide,
brightness/contrast/saturation ("brcosa"), mask, edge-blend, mesh. `control-panel`'s
`render-client/src/compositor.js` implements exactly 2: shape-based mask (rect/ellipse + feather)
and blend-mode compositing.

**Gap:** flip, tile, zoom, blur, motion-blur, brcosa, edge-blend — 7 of 9 stages missing.
**Size:** medium-large — each stage is a new WebGL shader pass, plus per-layer UI controls in
`panel/` and new fields in the server's layer state schema.
**Why first:** highest-impact gap — it's most of what makes a layer look "processed" like VPT8
rather than a flat video plane.

### 2. Whole-app automation — Priority 2

VPT8 has three automation paths: the preset module, a sequential cue-list script interpreter
(`C`/`F`/`D`/`L`/`S`/`R`/`O` letter codes), and a 15-alarm wall-clock timer bank, plus per-layer
`copypaste`. `control-panel` only has presets (`presetSave`/`presetRecall`).

**Gap:** cue-list interpreter, timer bank, copy-paste.
**Size:** medium — the cue interpreter is a small scripting language to parse and step through; the
timer bank is simpler (scheduled triggers); copy-paste is close to trivial once the layer state
schema is stable.

### 3. Input sources & control surfaces — Priority 3

VPT8 has camera sources (`cam1`/`cam2`), hardware + soft MIDI, OSC, Art-Net/DMX, serial/sensor
input, a 100-row control router, and a 10-slot LFO modulation rack. `control-panel` has none of
this.

**Gap:** everything in this category.
**Size:** large — browsers only reach MIDI/serial hardware via WebMIDI/WebSerial (Chrome-only,
user-permission-gated), and Art-Net/DMX or camera capture would need a small local bridge service
outside the browser sandbox.
**Open question (flagged, not assumed):** does the actual installation this is meant to run need
physical hardware control at all? If not, this subsystem may be permanently low-priority rather
than a deferred "someday" — that's a call for whoever runs the installation, not an engineering
one.

## Sequencing

Ordered by visible impact, not by a separate risk-reduction phase: **1) per-layer effects chain →
2) whole-app automation → 3) input sources & control surfaces.** Each subsystem's own "done"
includes exercising its new pieces in a real browser (and a cheap scripted check where feasible,
the way the WebSocket protocol was verified this session) — that's part of finishing the
subsystem, not a separate blocking phase before starting it.

## Non-Goals

- No new code in `control-panel/` or `vpt8 source code/` — this document only plans.
- No full spec for the effects chain, automation, or input/control subsystems yet — each gets its
  own brainstorm → spec → plan cycle, one at a time, starting with whichever the user picks next.
- No license chosen for `control-panel` — flagged as a one-time open decision to make before ever
  distributing it, not resolved here.

## Superseded / Related Documents

- This file supersedes the 2026-07-04 first-pass `ROADMAP.md`.
- [`docs/TECH_DEBT.md`](TECH_DEBT.md) — closed audit, 78 findings against the original VPT8 source.
  Still the reference for VPT8-specific debt if any Max-side work ever continues in parallel with
  `control-panel`.
- [`docs/CONTROL_PANEL_SPEC_AUDIT.md`](CONTROL_PANEL_SPEC_AUDIT.md) — closed spec-compliance audit
  of `control-panel/` (4 bugs found and fixed 2026-07-03).
- [`docs/architecture/00-overview.md`](architecture/00-overview.md) and its 11 module docs — the
  full VPT8 map this roadmap's subsystem gaps are derived from.
- [`docs/superpowers/specs/2026-07-04-master-roadmap-design.md`](superpowers/specs/2026-07-04-master-roadmap-design.md)
  — the design spec this document implements.
