# VPT8 → control-panel parity gaps (adversarial audit, 2026-07-12)

A four-agent adversarial audit cross-checked all 11 VPT8 architecture modules against the
control-panel code (not the ROADMAP's claims). Verdict: **`control-panel` is NOT at full VPT8
parity.** The ROADMAP's "full software-reachable parity" reflected subsystem *presence*, not full
*parameter/capability* parity. Below are the genuine gaps (things VPT8 does that the control-panel
cannot), deduped and tiered. Confirmed deliberate non-goals are listed at the end — those are NOT
gaps.

## Tier 1 — core capabilities, a regression, and a bug

1. **Arbitrary-polygon masking + invert + luminance/video matte.** VPT8's `pointmask01.js` is a
   full draggable-point polygon editor (insert/delete points), with a mask **invert** and a
   luminance-to-alpha matte driven from a movie/image. The panel's mask is `rect|ellipse` + feather
   only (`panel/src/components/types.ts`, `MaskShapeOverlay.tsx`, `render-client/src/fx.js` MASK_FRAG).
   Core for projection-mapping onto irregular surfaces. *(confirmed by 2 agents)*
2. **Per-layer continuous rotation (+ non-uniform zoom + anchor).** VPT8's `p zoom` (`td.rota.jxs`)
   bundles zoom+pan+**rotate** (`rota`, a preset-persisted field); the panel ported only uniform
   zoom + pan (`fx.js` POINT_FRAG has no rotation uniform; `state.js defaultFx()` has no field).
   *(confirmed by 2 agents)*
3. **REGRESSION — per-layer copy/paste is gone.** Implemented 2026-07-05 (commit `2cd91e7` on
   `LayerStrip.tsx`), then deleted by the deck redesign (which removed `LayerStrip`) and never
   carried into `deck/LayerStack.tsx`/`Inspector.tsx`. `ROADMAP.md` still (falsely) claims it's done.
   Low effort to restore from the deleted code.
4. **BUG — still/gif in a source-bank slot or mix input renders black.** `render-client/src/source-bank.js`
   `_decodeMediaInto` always builds a `<video>` regardless of `MediaItem.kind` (unlike `layers.js`,
   which branches). The UI lets you drop a jpg/gif into a slot; it silently never renders. Low effort.

## Tier 2 — shared source-bank parity (the "hybrid model" simplification's cost)

5. **Clip transport doesn't apply to shared-slot sources.** `layers.js:491` skips `applyTransport`
   for slot sources; `source-bank.js` hardcodes `loop=true`/auto-play with no pause/rate/loop/pan/vol.
   The Inspector shows the Transport section for a slot-sourced layer, but it does nothing. (VPT8's
   `clipcontrol.maxpat` is *specifically* the transport for the shared bank.)
6. **No source-bank preset/recall.** `sourceBank` is excluded from `PRESET_FIELDS` (`server/src/index.js:40`);
   can't snapshot/recall "slot setup A vs B".
7. **Camera & solid-color can't be shared-bank slots or mix inputs** (per-layer only). VPT8 treats
   `cam1/2`, `solid1/2` as first-class shareable/mixable sources.
8. **Loop mode "once" missing** — VPT8 has `loop_off/loop/pal/once`; panel has `off/loop/palindrome`,
   and `shouldLoop()` always returns true for single-source layers (they can never play-through-and-stop).
9. **Camera: no device picker / resolution / record-to-disk** — `getUserMedia({video:true})` grabs
   the default camera only; no `enumerateDevices`, no `MediaRecorder`.

## Tier 3 — automation / control / modulation parity

10. **Cue letter codes S / R / O un-ported.** Panel cue types are `recall/fade/wait/goto`; VPT8 also
    has `S` (select source preset), `R` (fade one bound parameter), `O` (send OSC out). No source-cue,
    no single-param tween, no OSC-out from a cue.
11. **OSC is receive-only — no OSC output / state mirroring.** VPT8 broadcasts state out (`udpsend`,
    ~20 `s osc-*` channels) so bidirectional surfaces (TouchOSC w/ feedback, a lighting console) stay
    in sync. `server/src/osc.js` only listens. *(confirmed by 2 agents)*
12. **LFO "mixer" slots + tempo-sync + phase.** VPT8's rack = 6 oscillators + **4 waveform mixers**
    (combine two LFOs); panel has plain oscillators only. Also missing: tempo/BPM-synced rate (no
    global tempo exists) and per-LFO phase offset.
13. **"Blind" mode** — VPT8 has a master-level blind (preview/work the next look without it hitting
    live output), distinct from blackout. No analog. *(state flag the render-client honors)*
14. **No independent per-fx-stage on/off bypass.** VPT8 has a `pattr on` per stage decoupled from its
    value; the panel treats "neutral value" as "off" (can't preset an amount and toggle it).
15. **Cue manual-GO checkpoints missing.** Panel auto-advances every running cue (all behave as
    VPT8's `+` suffix); no way to mark a cue "wait for the next manual GO".

## Tier 4 — minor / cosmetic

Edge-blend **invert**; clip **scrub/seek**; per-source **resolution downscale**; **next/prev/random**
clip trigger; mesh warp is faceted (linear) not NURBS-smooth + narrower density menu (3–8 vs 2–10);
**cursor-hide** on output; motion-blur uses temporal-feedback (different look than VPT8's directional
slide); LFO **waveform invert**; timer "source" action; VPT8's on-screen **soft-MIDI** grid (arguably
subsumed by the panel's direct widgets).

## Confirmed correctly-scoped NON-GOALS (NOT gaps — leave as-is)

Art-Net/DMX · serial/sensor input · Syphon (macOS GPU sharing) · the unified 100-row control router
(replaced by WebMIDI CC-learn + OSC address-to-path) · the 7 Mac-only `.mxo` externals · HAP codec
(→ transcode to a web codec) · native per-slot A/B crossfade-on-clip-change smoothness · a literal
multi-cell clip-launch grid · reverse/negative playback rate (hard browser limit). All documented in
`docs/ROADMAP.md`.

## What's genuinely solid (verified, not just claimed)

All 24 blend modes (1:1 name + formula match, exceeds VPT8's own 3-mode UI) · the 9 fx *stages* all
present · mask-before-warp order · per-layer AND master corner-pin/mesh warp · presets save/recall/
rename/delete · cue C/F/D/L + GO/STOP/jump · the 15-alarm timer bank · playlist still-vs-video
advance · atomic state persistence (stricter than VPT8's cross-file scheme).
