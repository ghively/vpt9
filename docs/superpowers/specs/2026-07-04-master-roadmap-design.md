# Master Roadmap Reconciliation — Design

Date: 2026-07-04

## Background

By 2026-07-04 this repo had accumulated four separate planning artifacts, never reconciled:

- `docs/superpowers/specs/2026-07-02-vpt8-architecture-audit-design.md` — spec for the read-only
  VPT8 audit (closed; direction question deliberately left open).
- `docs/TECH_DEBT.md` — 78 findings against the *original* VPT8 Max/MSP source (closed audit).
- `docs/CONTROL_PANEL_SPEC_AUDIT.md` — spec-compliance audit of `control-panel/` against its own
  README, 4 bugs found and fixed same day (closed audit).
- `docs/ROADMAP.md` — a first attempt (2026-07-04, earlier the same day) to reconcile the above and
  record, in writing for the first time, that direction had shifted from "stay in Max" to "port to
  `control-panel/`" — plus a fresh finding (the per-layer effects-chain gap) not captured anywhere
  else.

No single document was the current source of truth for "what's left to build," which is what
prompted this reconciliation.

## Scope

Produce **one master roadmap document** that supersedes `docs/ROADMAP.md` as the single place
anyone reads first to understand: what's built, what direction was chosen, and what work remains,
sequenced. It replaces `docs/ROADMAP.md`'s content in place (same path).

Explicitly **out of scope** for this document itself:
- Writing any new code.
- A full, buildable spec for any one subsystem (each gets its own future brainstorm → spec → plan
  cycle, one at a time).
- Deciding a license for `control-panel`'s new code (flagged as an open item, not resolved here).

## Approach

Sequencing is **impact-first**: subsystems are ordered by visible/demoable payoff to a user
comparing `control-panel` against VPT8, not by a separate risk-reduction or infrastructure-first
phase. Verification and testing are not a standalone phase — each subsystem's own definition of
done includes exercising its new pieces in a real browser (and a cheap scripted check where
feasible, following the pattern used to verify the WebSocket protocol during this session), rather
than a blocking "Phase 0."

## Document structure

`docs/ROADMAP.md` (rewritten) will contain, in order:

1. **Status Quo** — what's built and what's actually been confirmed (vs. only "spec-complete") as
   of today, for both the closed VPT8 audit and `control-panel`.
2. **Direction Decision** — the one-paragraph fact, recorded once: `control-panel` supersedes VPT8;
   this doc doesn't re-litigate it.
3. **Subsystem Inventory** — the three remaining subsystems, each stating VPT8's current
   capability, `control-panel`'s current capability, the concrete gap, a rough size, and its
   priority rank.
4. **Sequencing** — the explicit ranked order and the reasoning for it, including one open question
   flagged rather than assumed.
5. **Non-Goals** — what this document deliberately does not do (listed under Scope above).
6. **Supersession Note** — states that this file replaces `docs/ROADMAP.md`'s prior content, and
   that `docs/TECH_DEBT.md` / `docs/CONTROL_PANEL_SPEC_AUDIT.md` remain untouched as closed
   historical audit records, linked from here.

## Subsystem inventory (content to be written into the doc)

### 1. Per-layer visual effects chain — Priority 1
VPT8's `vlayer.maxpat` runs each layer through 9 stages: flip, tile, zoom, blur, motion-blur/slide,
brightness/contrast/saturation ("brcosa"), mask, edge-blend, mesh. `control-panel`'s
`render-client/src/compositor.js` implements exactly 2: shape-based mask (rect/ellipse + feather)
and blend-mode compositing. Gap: flip, tile, zoom, blur, motion-blur, brcosa, edge-blend (7 of 9
stages missing). Size: medium-large — each stage is a new WebGL shader pass, plus corresponding
per-layer UI controls in `panel/` and new fields in the server's layer state schema. This is the
single highest-impact gap: it's most of what makes a VPT8 layer look "processed" rather than a flat
video plane.

### 2. Whole-app automation — Priority 2
VPT8 has three automation paths: the preset module, a sequential cue-list script interpreter
(`C`/`F`/`D`/`L`/`S`/`R`/`O` letter codes), and a 15-alarm wall-clock timer bank, plus per-layer
`copypaste`. `control-panel` only has presets (`presetSave`/`presetRecall`). Gap: cue-list
interpreter, timer bank, copy-paste. Size: medium — the cue interpreter is a small scripting
language to parse and step through; the timer bank is simpler (scheduled triggers); copy-paste is
close to trivial once the layer state schema is stable.

### 3. Input sources & control surfaces — Priority 3
VPT8 has camera sources (`cam1`/`cam2`), hardware + soft MIDI, OSC, Art-Net/DMX, serial/sensor
input, a 100-row control router, and a 10-slot LFO modulation rack. `control-panel` has none of
this. Size: large — browsers only reach MIDI/serial hardware via WebMIDI/WebSerial (Chrome-only,
user-permission-gated), and Art-Net/DMX or camera capture would need a small local bridge service
outside the browser sandbox. **Open question, flagged rather than assumed:** does the actual
installation this is meant to run need physical hardware control at all? If not, this subsystem may
be permanently low-priority rather than a deferred "someday" — that's a decision for whoever's
running the installation, not an engineering call.

Tests/verification and the license decision are not listed as a fourth "process" subsystem — they're
woven into each subsystem's own definition of done (verification) or flagged as a standalone
one-time decision to make whenever `control-panel` is first meant to be shared/distributed
(license), so they don't get lost as a phase nobody starts.

## Verification

Self-review only (placeholder scan, internal consistency, scope, ambiguity) — this document has no
code to verify against; its claims are the same status-quo facts already established and cited in
`docs/ROADMAP.md`, `docs/TECH_DEBT.md`, and `docs/CONTROL_PANEL_SPEC_AUDIT.md`, re-sequenced rather
than re-derived.

## Out of scope

- Any new code in `control-panel/` or `vpt8 source code/`.
- A full spec for the per-layer effects chain, automation, or input/control subsystems (each is its
  own future brainstorm → spec → plan cycle).
- Choosing a license for `control-panel`.
