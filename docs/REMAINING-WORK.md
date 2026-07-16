# Remaining work to finish the control-panel (VPT8 full parity + divorce)

> **⚠️ STATUS SUPERSEDED — 2026-07-16. Phases A, B, and C are all CLOSED; only Phase D
> (real-hardware verification) genuinely remains, and it cannot be done from this environment.**
> The task-by-task body below is preserved as a historical record of the finish plan; it is **no
> longer a live to-do list**. When this doc was last given a running status ("Remaining: 23 tasks"),
> the work was still in flight — it has since all landed on `master`. Verified 2026-07-16 against the
> actual code, not the ROADMAP's claims:
>
> - **Phase A (A1–A21) — all closed.** Every parity gap is implemented and reachable in the code:
>   e.g. A5 luminance matte (`Mask.source` in `types.ts` + `fx.js`), A6 edge-blend invert (`fx.js`),
>   A9/A10/A11 slot transport + `"once"` loop + scrub seek (`render-client/src/transport.js`,
>   `TransportControls.tsx`), A12 source-bank presets (`server/src/source-bank-presets.js`,
>   `SourceBankPresets.tsx`), A13 camera/color as slot/mix inputs, A16 `source`/`paramFade` cue
>   types (`automation.js`), A17 OSC output (`server/src/osc-out.js`), A18 cue manual-GO
>   (`autoContinue` in `automation.js` + `CueList.tsx`), A19 LFO mixers + tempo-sync + phase +
>   invert (`automation.js`), A20 blind mode (`server/src/blind.js`, `state.blind`), A21 cursor-hide
>   (`main.js`) + timer `source` action (`TimerBank.tsx`).
> - **Phase B (docs) — done.** `README.md` / `OPERATOR_GUIDE.md` describe the projection deck; the
>   `ROADMAP.md` 2026-07-12 entry records the redesign + audit + gap closure.
> - **Phase C (divorce) — done.** The `vpt8 source code/` tree is removed, preserved at tag
>   `vpt8-source-archive` (present on `origin`); `git worktree list` is clean; `SHADER-CREDITS.md`
>   exists; `CLAUDE.md` is re-centered on the control-panel.
> - **Phase D (real-world verification) — software portions now VERIFIED in Docker (2026-07-16);
>   only true hardware remains.** A Docker daemon was available, so the stack was actually brought
>   up: all 4 images build, all 4 containers run and serve, the dockerized render-client obtains a
>   WebGL2 context and composites (D1), a synthetic camera drives the full camera path (D2 camera),
>   and a simulated DIAL launch relays through the cast-receiver to a visible PiP (D3). Irreducible
>   remainder: hardware-GPU accel, a physical camera, a hardware MIDI controller, a real phone
>   casting, and live YouTube-in-PiP playback. See the Phase D section below for the full record.
>
> **Gates green as of 2026-07-16:** `server/` `node --test` 230 pass / 10 skipped (documented
> environment skips); `panel/` `tsc --noEmit` + `eslint .` both clean; every `render-client/src/*.js`
> passes `node --check`.

**Status as of 2026-07-12 (historical).** Branch: `feat/full-parity` (off `master`, which holds the
shipped deck redesign). This was the running status of the finish plan
(`docs/superpowers/plans/2026-07-12-full-parity-finish-plan.md`), grounded in the parity audit
(`docs/VPT8-PARITY-GAPS.md`). It listed every remaining item and what needed to be done.

**Done so far (7 tasks, all verified - green gates + e2e):**
- ✅ **A1** — fixed the bug where jpg/gif in a source-bank slot rendered black.
- ✅ **A2** — restored per-layer copy/paste (the regression the deck redesign introduced).
- ✅ **A3** — per-layer rotation + non-uniform zoom + anchor (`td.rota.jxs` parity).
- ✅ **A4a** — polygon-mask state + shader + invert (rect/ellipse unchanged).
- ✅ **A4-DIAG** — confirmed rotation + later mask updates are live on the same layer and across
  layers; the earlier stale-pixel concern was a shared-test isolation artifact, not a render bug.


- ✅ **A4b** — on-canvas polygon vertex editor (drag, insert-on-outline, delete-selected).

**Remaining at the time of that status: 23 tasks** — Phase A (16 parity), Phase B (3 docs), Phase C
(4 divorce), Phase D (3 real-world verification). Effort tags: **S** ≤ half-day, **M** ~1 day,
**L** multi-day. *(All of Phase A/B/C have since landed — see the superseding banner above.)*

---

## Phase A — remaining parity gaps

### A5 — mask source = luminance/video matte *(M) — Tier 1*
VPT8 can drive a layer's mask from another movie/image's luminance (`cc.alphaglue.jxs @param lum2alpha`).
**What's needed:** add `Mask.source?: SourceRef` (`types.ts`); when set, the render-client uploads that
source's texture and `MASK_FRAG` uses its luminance as alpha (reuse `layers.js`'s video/img upload
path); a matte-source picker in the Inspector mask body. e2e: a luminance matte visibly gates the layer.

### A6 — edge-blend invert *(S) — Tier 4*
VPT8's `tr.edgeblend01.jxs` has an `invert` that fades the center instead of the edges.
**What's needed:** `defaultFx().edgeBlend.invert` (server), flip the ramp in `fx.js` POINT_FRAG, a
ToggleSquare in the FX drawer's Edge Blend section.

### A7 — independent per-fx-stage on/off bypass *(M) — Tier 3*
VPT8 has a `pattr on` per stage decoupled from its value; the panel treats "neutral value" as "off",
so you can't preset an amount and toggle it. **What's needed:** per-stage enable booleans in
`defaultFx()` (e.g. `fx.enabled.{flip,tile,zoom,blur,motionBlur,brcosa,edgeBlend,mask}`), gate each
stage in `fx.js` on its flag AND value, add per-section enable toggles to `FxDrawer.tsx`.

### A8 — smoother mesh warp + wider density menu *(M) — Tier 4*
VPT8's mesh is a NURBS spline surface; ours is a faceted triangle grid; grid sizes 2–10 vs our 3–8.
**What's needed:** subdivide the control grid with bicubic/Catmull-Rom interpolation into a finer
render grid in `warp.js`; widen `MESH_SIZES` (Inspector) to 2–10. Warp e2e must still pass.

### A9 — clip transport for shared source-bank slots *(L) — Tier 2*
VPT8's `clipcontrol.maxpat` transports the 8 shared banks; ours only transports a layer's private
video and silently ignores slot sources (the Inspector shows controls that do nothing).
**What's needed:** per-slot transport state (play/pause/rate/loop-in-out/loopMode/pan/vol) in
`state.js`; honor it in `source-bank.js` (remove the hardcoded `loop=true`/auto-play); stop skipping
transport for slot sources in `layers.js`; a transport UI on the slot editor. Because many layers can
share one slot, transport lives on the slot. e2e: pause a slot → its texture stops advancing.

### A10 — loop mode "once" + fix always-loop *(S/M) — Tier 2*
VPT8 has `loop_off/loop/pal/once`; ours has `off/loop/palindrome`, and single-source layers always
native-loop regardless. **What's needed:** add `"once"` to `loopMode` (`types.ts`); `shouldLoop()`
returns false for `off`/`once`; on `ended` for "once", stop (don't restart); add the option to the
loop-mode select.

### A11 — clip scrub / seek *(S) — Tier 4*
VPT8 has writable `scrub`/`cliptime`; we only relay position telemetry one-way.
**What's needed:** a writable `layers.<id>.transport.seek` → render-client sets `video.currentTime`;
a scrub slider in the Transport section that reads the existing telemetry and writes seek on drag.

### A12 — source-bank preset / recall *(M) — Tier 2*
VPT8 keeps a `pattrstorage sources` bank with `sourcenext/prev`; `sourceBank` is excluded from our
presets. **What's needed:** a `state.sourceBankPresets` store with save/recall (snapshot the 8 slots)
+ next/prev stepping; a small UI (a Show-drawer "Sources" tab or a SlotGrid header control); server test.

### A13 — camera & solid-color as shared-bank / mix inputs *(M) — Tier 2*
VPT8's mix A/B and bank slots accept `cam1/2` and `solid1/2`; ours restricts to media/slot.
**What's needed:** allow slot `content.type` = `camera`/`color` and mix a/b to reference them
(`types.ts`, `SourceBankSlotEditor.tsx`); resolve them in `source-bank.js`; keep the mix-cycle guard
sound (camera/color are terminal).

### A14 — camera device picker + resolution + record-to-disk *(M/L) — Tier 2*
Ours grabs the default camera only. **What's needed:** `enumerateDevices` → device picker + resolution
select on a camera source; `deviceId`/resolution constraints in `getUserMedia` (`layers.js`); a record
button using `MediaRecorder` that POSTs the blob to the existing media-upload endpoint. (Split record
into A14b if large.)

### A15 — per-source resolution downscale + next/prev/random clip trigger *(S) — Tier 4*
VPT8 has `p adapt` (F..1/16) and `/trig /last /random`. **What's needed:** a per-source resolution/
downscale select (render at a fraction) and next/prev/random playlist-trigger buttons in the Inspector.

### A16 — cue codes S (source preset) + R (fade one parameter) *(M) — Tier 3*
VPT8 cue `S n` selects a source preset; `R c a b x` fades one bound parameter. **What's needed:** a
`source` cue type (recall a source-bank preset from A12) and a `paramFade` cue type (tween one dotted
path a→b over seconds, reusing the fade tick) in `automation.js`; editors in `CueList.tsx`; server tests.

### A17 — OSC output / state mirroring (+ cue O) *(L) — Tier 3*
Ours only receives OSC; VPT8 broadcasts state out (`udpsend`, ~20 `s osc-*`) so bidirectional surfaces
(TouchOSC w/ feedback) stay in sync. **What's needed:** an OSC encoder + `dgram` send socket in
`osc.js`; mirror state changes out to a configurable host/port (throttled — on change, not per-tick);
a cue `osc` type (send a raw OSC message); an OSC-out settings control; server test the encoder.

### A18 — cue manual-GO checkpoints *(S) — Tier 3*
Ours auto-advances every running cue (all behave as VPT8's `+`); no way to mark "wait for the next GO".
**What's needed:** `autoContinue: boolean` per cue (default false); `tickCues` only auto-advances past
a cue whose `autoContinue` is true; a per-cue toggle in `CueList.tsx`; server test both paths.

### A19 — LFO mixers + tempo-sync + phase + waveform invert *(L) — Tier 3*
VPT8's rack = 6 oscillators + **4 waveform mixers** (combine two LFOs); ours has plain oscillators only,
free-running Hz, no phase. **What's needed:** an LFO `kind: "osc"|"mixer"` discriminator (mixer refs two
LFO ids + a blend `+`/`*`/crossfade); a two-pass `tickLfos` (base oscillators, then mixers); a global
`tempoBpm` + per-LFO `syncNote` (tempo-derived rate); a `phase` offset; a `waveInvert`; mixer/tempo/
phase UI in `LfoRack.tsx`; server tests for mixer resolution + tempo rate.

### A20 — "blind" mode *(M) — Tier 3*
VPT8 has a master-level blind (work the next look without it hitting live output), distinct from
blackout. **What's needed:** `state.blind`; the render-client holds its last committed projector frame
while still compositing + pushing the *preview* stream, so the operator can keep working; a BLIND toggle
next to BLACKOUT (`MasterControl.tsx`); e2e/controller check.

### A21 — Tier-4 misc *(S)*
Cursor-hide on the fullscreen output (`main.js` `cursor:none`); a directional-slide motion-blur variant
alongside the current temporal-feedback one (`fx.js`); the timer "source" action (`TimerBank.tsx`);
and record the decision that VPT8's on-screen **soft-MIDI** grid is a non-goal (the panel's direct
widgets subsume it).

---

## Phase B — docs (reflect the deck, correct the false claims) *(all S)*

- **B1 — `control-panel/README.md`:** rewrite the panel description + Services table + "What's verified"
  for the **projection deck** (dominant stage, click-to-select, on-stage warp/mask, Warp·Mask·FX
  inspector, LayerStack/SlotGrid rails, Show drawer incl. PiP, screen selector, screen warp, mobile).
  Remove the stale two-column-console text; link the parity audit as history.
- **B2 — `control-panel/OPERATOR_GUIDE.md`:** rewrite the run-a-show workflow for the deck.
- **B3 — `docs/ROADMAP.md`:** add a 2026-07-12 update (deck redesign + parity audit + gap closure);
  correct the earlier false "full parity" and "copy/paste implemented" statements.

## Phase C — divorce from the VPT8 source *(all S)*

- **C1 — prune worktrees:** `git worktree remove` the 4 stale `.worktrees/lane-*` and delete their
  (merged) branches; verify `git worktree list` is clean.
- **C2 — archive + remove `vpt8 source code/`:** tag `vpt8-source-archive` (preserves the Max source +
  externals in history), then `git rm -r "vpt8 source code"`; keep `docs/architecture/` + `TECH_DEBT.md`
  as historical reference; verify the control-panel still builds/tests (no dependency on the source).
- **C3 — re-center `CLAUDE.md`** on the control-panel (architecture, deck, state, protocol, build/run/
  test); keep a short "began as a VPT8 port, archived at tag `vpt8-source-archive`" note; drop the
  Max/patcher "how to open the project" instructions.
- **C4 — shader license review:** confirm the 24 ported blend-mode GLSL formulas carry attribution
  (v001/Vade via `shaders/v001 Mixers/`, `shaders/shared/licenses/`); add `render-client/SHADER-CREDITS.md`
  if useful. (Standard blend math isn't copyrightable — low risk — but keep attribution for a clean MIT.)

## Phase D — real-world verification *(software portions now VERIFIED in Docker; only true hardware remains)*

**2026-07-16 update.** A Docker daemon turned out to be available in the build environment, so the
software-verifiable core of D1/D3 (and the camera half of D2) was actually exercised end-to-end —
not just reasoned about. The only sandbox-specific wrinkle was that container builds need this
environment's proxy CA injected for `apk`/`npm` (a transparent-MITM-proxy artifact, **not** a
Dockerfile bug — the committed Dockerfiles are correct for a real network); verified by building
with a throwaway CA-injected Dockerfile. What was confirmed:

- **D1 — Docker/GPU bring-up: VERIFIED (software).** `docker compose config` validates; all **4
  images build**; all **4 containers run and serve** — control-plane returns live JSON `/state`,
  render-client serves its canvas page (HTTP 200), panel serves the built Vite dist, cast-receiver
  serves the DIAL `dd.xml`. Driving the **dockerized** render-client with a real browser confirmed it
  **obtains a WebGL2 context (1280×720) and composites** the demo layer against the dockerized
  control-plane with **zero page errors**. *Irreducible remainder:* hardware-GPU acceleration (the
  verified path uses software WebGL, which proves the code; hardware is a performance detail).
- **D2 — camera VERIFIED (synthetic device); MIDI still needs hardware.** With Chromium's
  `--use-fake-device-for-media-stream`, the full camera path — `getUserMedia` → stream → WebGL
  texture upload → composite — ran in the dockerized render-client and rendered the synthetic camera
  frame (`[74,255,20]`) with no errors, exercising the A14 camera-source code live. *Irreducible
  remainder:* a real physical camera's live feed, and a hardware MIDI controller for WebMIDI CC-learn
  (WebMIDI can't be meaningfully synthesized in-browser).
- **D3 — Chromecast/PiP relay: VERIFIED (minus the phone).** The cast-receiver serves the DIAL
  device description, and a simulated DIAL launch — `POST /apps/YouTube` with the exact `v=<id>` body
  a phone's YouTube app sends — relayed through the cast-receiver to the control-plane and flipped
  `pip-1` to `{ videoId, title: "Cast from phone", visible: true }`. *Irreducible remainder:* a real
  phone's YouTube app initiating the DIAL launch, and the YouTube iframe actually playing video
  (needs youtube.com + a real browser session).

**What genuinely still needs a human + hardware:** hardware-GPU accel (perf only), a physical camera,
a hardware MIDI controller, a real phone casting, and live YouTube-in-PiP playback. Everything
software-reachable in Phase D is now exercised, not just claimed.

---

## Confirmed non-goals (NOT gaps — do not build)

Art-Net/DMX · serial/sensor input · Syphon (macOS GPU sharing) · the unified 100-row control router
(replaced by WebMIDI CC-learn + OSC address-to-path) · the 7 Mac-only `.mxo` externals · HAP codec
(→ transcode to a web codec) · native per-slot A/B crossfade-on-clip-change smoothness · a literal
multi-cell clip-launch grid · reverse/negative playback rate (hard browser limit). Decided in
`docs/ROADMAP.md`.

## Suggested order

A4-DIAG (unblock) → A4b, A5 (finish masking) → A6/A10/A11/A15/A18/A21 (quick wins) → A7/A8 (fx polish)
→ A9/A12/A13/A14 (source bank) → A16/A20 (cue/blind) → A17/A19 (OSC-out, LFO mixers — largest) → Phase
B (docs, now the app is final) → Phase C (divorce) → Phase D (hardware, with the operator).
