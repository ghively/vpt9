# VPT8 Full-Parity Finish + Divorce Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task (fresh implementer + review per task). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Close every genuine VPT8→control-panel parity gap found in the 2026-07-12 adversarial audit (`docs/VPT8-PARITY-GAPS.md`, all Tiers 1–4 + the bug + the regression), then update the docs, divorce the repo from the VPT8 Max source, and drive the real-world/hardware verification.

**Architecture:** Unlike the deck redesign (panel-only), most parity tasks are **cross-stack** — they add capability to `render-client/` (WebGL), `server/` (state + automation + OSC), and `panel/` (deck UI) together. The deck UI (Stage, Inspector, StageSelectionOverlay, LayerStack, SlotGrid, ShowDrawer) is the surface all new controls attach to. Reuse existing patterns; do not reintroduce the removed old-layout components.

**Tech stack:** Node/ws/dgram server; WebGL2 render-client (inline GLSL); React 18 + TS + Vite panel; `node --test` (server), Playwright e2e, `tsc`/ESLint gates. VPT8 reference: `docs/architecture/0N-*.md` + `vpt8 source code/` (shaders/patchers/code).

## Global Constraints

- **Ground every task in `docs/VPT8-PARITY-GAPS.md`** (the audited spec of what's missing) and the cited VPT8 file (e.g. `shaders/v001 Mixers/*.fp.glsl`, `code/pointmask01.js`) for exact behavior. Match VPT8 capability, not its Max UI.
- **Cross-stack is allowed and expected** here (server + render-client + panel), but keep the deck UI model: new per-layer controls attach to `Inspector.tsx` / `StageSelectionOverlay.tsx`; new show-level controls to the command bar or `ShowDrawer`. Components under `panel/src/components/` do NOT import from `panel/src/app/` (callback props). Handle drags carry `deck-handle` + `pointercancel`.
- **Keep the token palette** (`panel/src/tokens/tokens.css`), single dark theme.
- **Preserve the server crash-hardening**: any new client-writable state path must survive the `applyUpdate` value-validation (`server/src/state.js` `corruptsStructure`) — extend that guard for new structural containers, never bypass it.
- **Gates per task:** `cd control-panel/server && node --test` (when server touched), `cd control-panel/panel && npx tsc --noEmit && npx eslint .`, and the relevant `control-panel/e2e` spec. New render/interaction behavior is verified test-first via a Playwright e2e where observable (drive it, assert `/state` or a canvas/DOM effect). Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Branch:** create `feat/full-parity` off `master`. Commit per task.
- **No regressions:** the full e2e suite + server 125/125 must stay green; the deck's screen-selector/warp/PiP/transport all keep working.

---

# PHASE A — Close the parity gaps

## Task A1 — BUG: still/gif render black in a source-bank slot / mix input
**Files:** `render-client/src/source-bank.js` (`_decodeMediaInto`), `e2e/blend-and-mix.spec.js`.
**Ref:** gaps §4. `layers.js` `setLayerSource` already branches on `mediaKindFromUrl(url)` → `<img>` vs `<video>`; `_decodeMediaInto` (source-bank.js:112-135) always builds a `<video>`.
- [ ] Write a failing e2e: put a jpg media item into a source-bank slot, point a layer at that slot, assert the stage is not black (canvas non-uniform, mirroring `media-compositing.spec.js`'s jpg check).
- [ ] Fix `_decodeMediaInto` to branch on kind exactly like `layers.js`: `<img>` (attached, per the gif-needs-DOM rule) for gif/image, `<video>` for video; upload the right element into the slot texture each frame.
- [ ] Verify e2e RED→GREEN; full suite green. Commit.

## Task A2 — REGRESSION: restore per-layer copy/paste
**Files:** `panel/src/app/App.tsx`, `panel/src/components/deck/LayerStack.tsx` (or `Inspector.tsx`), `panel/src/app/actions.ts` if needed.
**Ref:** gaps §3. Recover the deleted implementation: `git show 2cd91e7:control-panel/panel/src/app/App.tsx` and `2cd91e7:control-panel/panel/src/components/LayerStrip.tsx` (the `copyLayer`/`pasteLayer` callbacks + a `structuredClone` clipboard ref + the ⧉/⇩ buttons, copying opacity/blendMode/mask/fx — the "look", not source/name/order).
- [ ] Re-add a clipboard ref + `copyLayer(id)`/`pasteLayer(id)` in App, wired to a copy/paste affordance on each `LayerStack` row (or the Inspector header). Paste writes via the existing `updateLayer` paths (no new messages).
- [ ] tsc/eslint clean; controller screenshot shows copy on one layer → paste onto another changes its look. Commit.

## Task A3 — Per-layer rotation (+ non-uniform zoom + anchor)
**Files:** `server/src/state.js` (`defaultFx`), `render-client/src/fx.js` (POINT_FRAG uv transform), `panel/src/components/FxDrawer.tsx` + `deck/Inspector.tsx` (FX body), `panel/src/components/types.ts` (`Fx`), `e2e`.
**Ref:** gaps §2. VPT8 `td.rota.jxs` / `p zoom`: `rota`, `xzoom`/`yzoom`, `xanchor`/`yanchor`.
- [ ] Add `rotationDeg` (and `zoomX`/`zoomY` superseding scalar `zoom`, `anchorX`/`anchorY`) to `defaultFx()` with neutral defaults (rotation 0, zoom 1, anchor 0.5).
- [ ] In `fx.js` POINT_FRAG, apply a 2D rotation matrix about the anchor plus non-uniform scale in the existing uv transform. Add the `u_rotation`/`u_zoomXY`/`u_anchor` uniforms.
- [ ] Add a Rotation knob (and X/Y zoom, anchor) to the FX drawer/Inspector; ensure they're LFO/MIDI-targetable (leaf paths).
- [ ] e2e: set `fx.rotationDeg=90` on a layer with an asymmetric source, assert the canvas differs from rotation 0. tsc/eslint + server tests. Commit.

## Task A4 — Arbitrary-polygon mask + invert
**Files:** `panel/src/components/types.ts` (`Mask`), `server/src/state.js` (mask default + validation), `render-client/src/fx.js` (MASK_FRAG), `panel/src/components/MaskShapeOverlay.tsx` (+ a polygon point editor), `deck/Inspector.tsx` (mask body), `e2e`.
**Ref:** gaps §1. VPT8 `code/pointmask01.js` (draggable N-point polygon, insert-on-outline, delete), `layermask.maxpat` `pattr inv`.
- [ ] Extend `Mask` to `shape: "rect"|"ellipse"|"polygon"` with `points?: Point[]` (normalized) and `invert: boolean`. Backfill defaults in `state.js`; ensure `corruptsStructure`/`ensureLayerDefaults` handle the new fields.
- [ ] MASK_FRAG: for polygon, do point-in-polygon (even-odd, reuse the `pointInQuad` approach generalized to N points) with a feather band; apply `invert` (`mix(a, 1-a, invert)`).
- [ ] Extend `MaskShapeOverlay.tsx` with a polygon mode: draggable vertex handles (reuse `WarpHandle`/`deck-handle`/`pointercancel`), click-empty-outline to insert a point, delete selected point — mirroring `pointmask01.js`. Add an invert toggle + shape select to the Inspector mask body.
- [ ] e2e: set a polygon mask, drag a vertex, assert `layers.<id>.mask.points` changed in `/state`; toggle invert. tsc/eslint + server tests. Commit. (This is the largest task — split into A4a state/shader and A4b editor UI if a reviewer flags scope.)

## Task A5 — Mask source = luminance/video matte
**Files:** `panel/src/components/types.ts` (`Mask.source?`), `render-client/src/fx.js`/`layers.js` (mask-matte texture upload + lum2alpha in MASK_FRAG), `deck/Inspector.tsx`, `server/src/state.js`, `e2e`.
**Ref:** gaps §1. VPT8 `layermask.maxpat` `pattr source` + `cc.alphaglue.jxs @param lum2alpha 1`.
- [ ] Add `Mask.source?: SourceRef` (a media/slot ref). When set, the render-client uploads that source's texture and MASK_FRAG uses its luminance as alpha (reuse the existing video/img upload path from `layers.js`).
- [ ] Inspector mask body: a matte-source picker (reuse the source picker). e2e: a luminance matte visibly gates the layer. Gates. Commit.

## Task A6 — Edge-blend invert
**Files:** `render-client/src/fx.js` (edge uniform), `server/src/state.js` (`defaultFx().edgeBlend.invert`), `panel/src/components/FxDrawer.tsx`.
**Ref:** gaps §Tier4 / `tr.edgeblend01.jxs` `mix(alph,1.-alph,invert)`.
- [ ] Add `edgeBlend.invert` boolean; POINT_FRAG flips the ramp; a ToggleSquare in the Edge Blend section. tsc/eslint. Commit.

## Task A7 — Independent per-fx-stage on/off bypass
**Files:** `server/src/state.js` (`defaultFx()` per-stage `*_on` flags OR an `fx.enabled: {flip,tile,zoom,blur,motionBlur,brcosa,edgeBlend,mask}` map), `render-client/src/fx.js` (`fxNeedsChain`/stage gating), `panel/src/components/FxDrawer.tsx` (per-section enable toggle).
**Ref:** gaps §14. VPT8: every stage has a `pattr on` decoupled from its value.
- [ ] Add per-stage enable booleans (default true). Render gates each stage on its flag AND its value, so a dialed-in amount is preserved while toggled off. Add a per-section enable toggle in the FX drawer. Gates. Commit.

## Task A8 — Smoother mesh warp + wider density menu
**Files:** `render-client/src/warp.js` (mesh interpolation), `panel/src/components/deck/Inspector.tsx` (`MESH_SIZES`).
**Ref:** gaps §Tier4. VPT8 `jit.gl.nurbs` (spline) vs current linear `gl.TRIANGLES`; grid 2×2..10×10.
- [ ] Subdivide the mesh (bicubic/Catmull-Rom interpolation of the control grid into a finer render grid) to reduce faceting; widen `MESH_SIZES` to 2–10. Verify warp e2e still passes. Commit.

## Task A9 — Clip transport for shared source-bank slots
**Files:** `server/src/state.js` (per-slot transport), `render-client/src/source-bank.js` (honor transport per slot), `render-client/src/layers.js` (stop skipping transport for slot sources), `panel/src/components/deck/SlotGrid.tsx`/`SourceBankSlotEditor.tsx` (slot transport UI), `server/src/automation.js` (slot playlist if applicable), `e2e`.
**Ref:** gaps §5. VPT8 `clipcontrol.maxpat` controls the 8 shared banks, not per-layer.
- [ ] Add transport state to each source-bank slot (play/pause/rate/loop-in/out/loopMode/pan/vol), applied in `source-bank.js` (remove the hardcoded `loop=true`/auto-play). Add a transport UI to the slot editor. Because many layers can share one slot, transport lives on the slot, not the layer.
- [ ] e2e: pause a slot, assert its texture stops advancing. Gates. Commit.

## Task A10 — Loop mode "once" + fix always-loop
**Files:** `panel/src/components/types.ts` (`loopMode`), `render-client/src/layers.js` (`shouldLoop`/`applyTransport`), `panel/src/components/FxDrawer.tsx`.
**Ref:** gaps §8. VPT8 `loop_off/loop/pal/once`.
- [ ] Add `"once"` to `loopMode`; `shouldLoop()` returns false for `"off"`/`"once"`; on `ended` for "once", stop (don't restart). Add the option to the loop-mode select. e2e/controller check. Commit.

## Task A11 — Clip scrub / seek
**Files:** `render-client/src/layers.js` (apply `transport.seek`/scrub), `server/src/state.js`, `panel/src/components/FxDrawer.tsx` (a scrub slider using the existing position telemetry).
**Ref:** gaps §6. VPT8 `"scrub $1"`/`"cliptime $1"`.
- [ ] Add a writable seek: panel sends a `layers.<id>.transport.seek` (or a dedicated `seek` message) → render-client sets `video.currentTime`. A scrub slider in the Transport section reads the existing position telemetry and writes seek on drag. Gates. Commit.

## Task A12 — Source-bank preset/recall
**Files:** `server/src/index.js` (`PRESET_FIELDS` + a separate source-bank preset store, or add `sourceBank` to a new preset kind), `server/src/state.js`, `panel/src/components/deck/SlotGrid.tsx` or a Show-drawer control, `e2e`/server test.
**Ref:** gaps §6/§Tier2. VPT8 `pattrstorage sources` + `sourcenext/prev`.
- [ ] Add a source-bank preset store (`state.sourceBankPresets`) with save/recall (snapshot the 8 slots' content), plus next/prev stepping. Wire a small UI (Show drawer "Sources" tab or SlotGrid header). Server test for save/recall. Commit.

## Task A13 — Camera & solid-color as shared-bank / mix inputs
**Files:** `panel/src/components/types.ts` (`SourceRef`/slot content types), `render-client/src/source-bank.js` (resolve camera/color slot content + as mix inputs), `panel/src/components/SourceBankSlotEditor.tsx` (add camera/color to the type Select), `server/src/state.js`.
**Ref:** gaps §7. VPT8 mix inputs include `cam1/2`, `solid1/2`.
- [ ] Allow slot `content.type` = `camera` and `color`, and allow a mix's a/b to reference them; render-client resolves a camera-getUserMedia texture / a solid color for a slot. Update the mix-cycle guard as needed (color/camera are terminal, no cycle risk). Gates. Commit.

## Task A14 — Camera device picker + resolution + record
**Files:** `render-client/src/layers.js` (enumerateDevices, deviceId + resolution constraints, MediaRecorder), `server/src/state.js` (camera source config), `panel/src/components/deck/Inspector.tsx` (camera source controls), `server/src/media.js` (accept a recorded upload — reuse the upload endpoint).
**Ref:** gaps §9. VPT8 `livemodule-vpt7.maxpat` `vdevice`, resolution, `jit.qt.record`.
- [ ] Add `enumerateDevices` → a device picker + resolution select on a camera-source layer; a `deviceId`/resolution constraint in `getUserMedia`. Add a record button using `MediaRecorder` that POSTs the blob to the existing media-upload endpoint. Gates. Commit. (Split record into A14b if large.)

## Task A15 — Per-source resolution downscale + next/prev/random clip trigger
**Files:** `render-client/src/layers.js`/`source-bank.js` (downscale on upload), `panel/src/components/deck/Inspector.tsx`/`FxDrawer.tsx` (downscale select + playlist trig buttons), `server/src/automation.js` (random/next/prev playlist advance).
**Ref:** gaps §Tier4. VPT8 `p adapt` (F..1/16), `/trig /last /random`.
- [ ] Add a per-source resolution/downscale select (render at a fraction) and next/prev/random playlist trigger buttons. Gates. Commit.

## Task A16 — Cue codes S (source preset) + R (fade one parameter)
**Files:** `server/src/automation.js` (new cue types `source`, `paramFade`), `panel/src/components/CueList.tsx` (`CUE_TYPES` + editors), `server/src/state.js`, server test.
**Ref:** gaps §10. VPT8 cue `S n` / `R c a b x`.
- [ ] Add a `source` cue (recall a source-bank preset from A12) and a `paramFade` cue (tween a single dotted path a→b over seconds, reusing the fade tick machinery but for one path). Add editors to `CueList`. Server tests for both. Commit.

## Task A17 — OSC output / state mirroring (+ cue O)
**Files:** `server/src/osc.js` (add a `dgram` send socket + an OSC encoder), `server/src/index.js` (mirror broadcasts out as OSC, configurable target/subset), `server/src/automation.js` (cue `osc` type), `panel` (an OSC-out settings control + cue O editor), server test.
**Ref:** gaps §11. VPT8 `udpsend` + ~20 `s osc-*` mirrors; cue `O`.
- [ ] Add an OSC encoder + UDP send. Mirror state changes out as OSC to a configurable host/port (throttle to avoid flooding — send on change, not per-tick). Add a cue `osc` type (send a raw OSC message). Server test the encoder + a send. Commit.

## Task A18 — Cue manual-GO checkpoints
**Files:** `server/src/automation.js` (`tickCues` gate), `panel/src/components/CueList.tsx` (per-cue autoContinue toggle), `server/src/state.js`, server test.
**Ref:** gaps §15. VPT8 default = manual advance unless `+`.
- [ ] Add `autoContinue: boolean` per cue (default false). `tickCues` only auto-advances past a cue whose `autoContinue` is true; otherwise it stops and waits for the next GO. Update the fade/wait interaction. Add a per-cue toggle. Server test both paths. Commit.

## Task A19 — LFO mixers + tempo-sync + phase + waveform invert
**Files:** `server/src/state.js` (lfo shape: `kind: "osc"|"mixer"`, `phase`, `invert`, `syncNote`; a global `tempoBpm`), `server/src/automation.js` (`tickLfos` two-pass: base oscillators then mixers; tempo-synced rate; phase offset), `panel/src/components/LfoRack.tsx` (mixer rows + tempo + phase + invert), server test.
**Ref:** gaps §12. VPT8 6 osc + 4 mixers; ITM tempo sync; phase; waveinv.
- [ ] Add an LFO `kind` discriminator: `mixer` slots reference two other LFO ids + a blend (`+`/`*`/crossfade). `tickLfos` resolves base oscillators first, then mixers. Add a global `tempoBpm` and a per-LFO `syncNote` (rate derived from tempo when set), a `phase` offset, and a `waveInvert`. Add mixer/tempo/phase UI to `LfoRack`. Server tests for mixer resolution + tempo rate. Commit.

## Task A20 — "Blind" mode
**Files:** `server/src/state.js` (`blind: boolean`), `render-client/src/compositor.js`/`main.js` (freeze/hold output when blind — keep sending preview frames to the panel but hold the projector output), `panel/src/components/MasterControl.tsx` (BLIND toggle next to BLACKOUT), `e2e`.
**Ref:** gaps §13. VPT8 `s blind`/`r blind`, master-level, distinct from blackout.
- [ ] Add `state.blind`. The render-client, when blind, holds its last committed output frame on the projector canvas but continues to composite + push the *preview* stream so the operator can work the next look. Add a BLIND toggle. e2e/controller check. Commit.

## Task A21 — Tier-4 misc: cursor-hide, motion-blur mode, timer "source", soft-MIDI decision
**Files:** `render-client/src/main.js` (CSS `cursor:none` on the output canvas), `render-client/src/fx.js` (a directional-slide motion-blur option alongside the feedback one), `panel/src/components/TimerBank.tsx` (add `source` action), a short doc note on soft-MIDI.
**Ref:** gaps §Tier4.
- [ ] Hide the cursor over the fullscreen output; add a directional-slide motion-blur variant (VPT8's actual `tp.slide.jxs` behavior) selectable alongside feedback; add the timer `source` action (recall a source-bank preset); decide soft-MIDI is a documented non-goal (the panel's direct widgets subsume it) and record that. Gates. Commit.

---

# PHASE B — Docs (reflect the deck + close the false claims)

## Task B1 — Rewrite `control-panel/README.md`
- [ ] Rewrite the panel description (Services table + feature list) for the **projection deck** (dominant stage, click-to-select, on-stage warp/mask handles, Warp·Mask·FX inspector, LayerStack/SlotGrid rails, Show drawer incl. PiP, screen selector, screen warp, mobile). Update "What's verified" (the deck e2e). Remove the stale two-column-console description. Note the parity gaps are closed (link `docs/VPT8-PARITY-GAPS.md` as history). Commit.

## Task B2 — Rewrite `control-panel/OPERATOR_GUIDE.md`
- [ ] Rewrite the run-a-show workflow for the deck (select a layer on the stage, warp/mask it, use the inspector, screen warp, PiP, cues/timers/LFO in the drawer). Commit.

## Task B3 — Update `docs/ROADMAP.md`
- [ ] Add a 2026-07-12 update: the deck redesign, the adversarial parity audit (link the gaps doc), and the parity-gap closure. Correct the earlier false "full parity" and "copy/paste implemented" statements. Commit.

---

# PHASE C — Divorce from the VPT8 source

## Task C1 — Prune stale worktrees
- [ ] `git worktree remove` the 4 `.worktrees/lane-*` (lane-e2e-harness, lane-panel, lane-render, lane-server-state) and delete their branches (they're merged into master). Verify `git worktree list` is clean. Commit if any tracked change.

## Task C2 — Archive + remove `vpt8 source code/`
- [ ] Tag the current commit `vpt8-source-archive` (preserves the Max source + `externals/` in history). Then `git rm -r "vpt8 source code"`. Keep `docs/architecture/` + `docs/TECH_DEBT.md` (the VPT8 map/audit) as historical reference. Verify the control-panel still builds/tests (it has no dependency on the source). Commit.

## Task C3 — Re-center `CLAUDE.md` on the control-panel
- [ ] Rewrite `CLAUDE.md`: lead with the control-panel (architecture, the deck, state shape, protocol, build/run/test), keep a short "historical: this began as a port of VPT8 (Max/MSP), archived at tag `vpt8-source-archive`" note, and point at `control-panel/README.md`. Remove the Max/patcher/shader "how to open the project" instructions (no longer applicable). Commit.

## Task C4 — Shader license review
- [ ] Confirm the 24 ported blend-mode GLSL formulas in `render-client/src/{layers.js,source-bank.js}` carry an attribution comment (v001/Vade via VPT8's `shaders/v001 Mixers/`, and the `shaders/shared/licenses/` third-party attributions where relevant). Standard blend math isn't copyrightable, but preserve attribution for a clean MIT project. Add a short `render-client/SHADER-CREDITS.md` if useful. Commit.

---

# PHASE D — Real-world verification (needs the user / hardware)

These cannot be done from this environment; they're the checklist for whoever runs the install.

## Task D1 — Docker/GPU production bring-up
- [ ] `docker compose up` the 4 services on a real machine; confirm the render-client gets a GPU context and composites; confirm the panel + cast-receiver reachable. Record results in the README "What's verified".

## Task D2 — Physical camera + MIDI controller
- [ ] On a projector machine: a real camera source (device picker from A14), a hardware MIDI controller (CC-learn), confirm mappings drive parameters live.

## Task D3 — Chromecast + YouTube-in-PiP
- [ ] Cast a phone's YouTube to the DIAL/SSDP cast-receiver; confirm it appears as a PiP window and plays in the render-client iframe.

---

## Self-Review

- **Spec coverage:** every item in `docs/VPT8-PARITY-GAPS.md` maps to a task — Tier 1: A1(bug)/A2(regression)/A3(rotation)/A4+A5(mask); Tier 2: A9/A10/A12/A13/A14; Tier 3: A7/A16/A17/A18/A19/A20; Tier 4: A6/A8/A11/A15/A21. Docs: B1–B3. Divorce: C1–C4. Verification: D1–D3.
- **Sequencing:** do A1 (bug) + A2 (regression) first (quick, high-value); then the Tier-1 capabilities (A3–A5); then source-bank (A9–A14) and automation/control (A16–A20) which are heavier and cross-stack; Tier-4 (A6/A8/A11/A15/A21) can interleave as quick wins. Phase B/C after Phase A so docs describe the finished state. Phase D is user/hardware, last.
- **Scale note:** ~21 parity tasks span server + render-client + panel; several (A4 mask, A14 camera, A17 OSC-out, A19 LFO) are large — split into sub-tasks (a/b) if a reviewer flags scope. Each ends with an independently testable deliverable and a green gate.
- **Risk:** A4 (polygon mask shader + editor), A17 (OSC-out encoder), A19 (LFO mixer graph) carry the most new logic — write these test-first and review adversarially. A9/A12/A13 change the source-bank state shape — extend the `corruptsStructure` guard and add server tests so the crash-hardening invariants hold.
