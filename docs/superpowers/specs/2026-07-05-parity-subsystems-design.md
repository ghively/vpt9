# Parity subsystems: effects chain, automation, inputs — design

Date: 2026-07-05. Companion to [`docs/ROADMAP.md`](../../ROADMAP.md), which defines the three
remaining subsystems and their priority order. This spec covers the 2026-07-05 full audit of
`control-panel/` and the design for closing all three gaps in one pass.

## Audit findings (2026-07-05)

Full read of all four services (~3.3k lines) plus `node --check` on every service JS file and a
clean `tsc --noEmit && vite build` on the panel. Findings, ordered by severity:

1. **Server crash via malformed update path** — `server/src/state.js` `applyUpdate`/`applyDelete`
   do `last in node` without checking `node` is an object. A path that walks through a primitive
   leaf (e.g. `layers.layer-1.opacity.x`) throws `TypeError: Cannot use 'in' operator`, uncaught in
   the WS message handler, killing the control plane. Any LAN client can do this. **Fix: type-guard.**
2. **Prototype pollution via `create`** — `applyCreate(state, "__proto__", {id: "x"})` walks to
   `Object.prototype` and assigns into it. **Fix: reject `__proto__`/`constructor`/`prototype` path
   segments in all three patch implementations (server, render-client, panel).**
3. **No WebSocket reconnect** — both the render client (`socket.js`) and panel (`useSocket.ts`)
   connect once; a control-plane restart strands every projector until someone reloads the page by
   hand. **Fix: auto-reconnect with capped backoff; the server already re-sends full state on
   connect, so re-sync is free.**
4. **Synchronous state write per message** — `saveState` runs `writeFileSync` on every update;
   drags emit updates at pointer-move rate. **Fix: debounce persistence (250 ms trailing).**
5. **Hidden PiP keeps playing** — `display:none` doesn't stop a YouTube iframe; a hidden PiP that
   owns audio keeps sounding. **Fix: unload the iframe when `visible` is false.**
6. **Cast receiver UUID isn't a valid UUID** — `...-9d9a-vptcastreceiver1` contains non-hex chars;
   strict DIAL senders may reject it. **Fix: valid fixed hex UUID.**
7. **`applyCreate` fallback key** — a create with no `value.id` stores an entry keyed by
   `Date.now()` with no `id` field, which downstream code assumes. **Fix: reject id-less creates.**
8. **Dead code** — `Compositor.updateLayerField` is never called (main.js re-derives everything
   from state). **Fix: remove.**
9. Minor, accepted as-is: `BLEND_MODES` duplicated between render client and panel (separate
   runtimes, no shared package); per-message JSON.parse without try/catch in render-client socket
   (wrapped as part of reconnect rework).

## Scope decision for "done"

Priorities 1 and 2 are implemented in full. For priority 3 (inputs & control surfaces), the
software-only members are implemented — **LFO rack, camera source, WebMIDI mapping, and an OSC/UDP
listener** — while Art-Net/DMX and serial remain out of scope for a browser/Node stack without
hardware present (per the roadmap's open question). The WS protocol itself is the control API any
future hardware bridge would target.

## State schema additions

```jsonc
// per layer — flat leaves so LFO/MIDI/OSC targets are simple dotted paths
"fx": {
  "flipH": false, "flipV": false,
  "tileX": 1, "tileY": 1,                       // repeat counts, 1 = off
  "zoom": 1, "panX": 0, "panY": 0,              // zoom >= 0.05; pan in UV units
  "blur": 0,                                    // 0..1 -> separable gaussian radius
  "motionBlur": 0,                              // 0..1 feedback-trail persistence
  "brightness": 1, "contrast": 1, "saturation": 1,   // brcosa
  "edgeBlend": { "left": 0, "right": 0, "top": 0, "bottom": 0, "gamma": 2 }
},

// top-level
"automation": {
  "cues": [ { "id", "label", "type": "recall"|"fade"|"wait"|"goto",
              "presetId"?, "seconds"?, "target"? } ],
  "cursor": -1, "running": false,
  "timers": { "timer-1": { "id", "enabled", "time": "HH:MM",
                           "action": "cueGo"|"recall", "presetId"? } }
},
"lfos":    { "lfo-1": { "id", "enabled", "wave": "sine"|"triangle"|"square"|"saw"|"random",
                        "rateHz", "min", "max", "target" } },
"midiMap": { "map-1": { "id", "channel", "controller", "target", "min", "max" } }
```

Because `applyUpdate` only patches existing leaves, the server backfills missing `fx` (and the new
top-level containers) into any loaded or created layer state (`ensureDefaults` migration on load
and on layer create).

## Protocol additions

- `{"type":"batch","updates":[{path,value},...]}` — server → clients; used by the fade/LFO engines
  so a 20-path fade doesn't emit 600 messages/sec. Clients apply all patches then re-derive once.
- `{"type":"cueGo"}` / `{"type":"cueStop"}` / `{"type":"cueJump","index":n}` — client → server
  cue-list transport control.
- Engine-driven updates (fade ticks, LFO ticks) broadcast but do **not** trigger state persistence;
  operator-driven messages persist as before (debounced).

## Rendering: the effects chain (render client)

`vlayer.maxpat` stage order is preserved: flip → tile → zoom/pan → brcosa + edge-blend (one
point-wise pass) → gaussian blur (2 separable passes, skipped when 0) → motion-blur feedback
(skipped when 0) → existing mask+blend compositing pass. Point-wise stages are one shader (`fx.js`,
`FxChain` per layer with lazily allocated FBOs at the internal 1280×720 resolution); blur and
motion-blur each use their own pass/feedback target only when active, so an fx-less layer costs one
texture lookup more than today. Edge-blend multiplies layer alpha with per-edge `pow(ramp, gamma)`.

## Automation engine (server, `automation.js`)

A single 30 Hz tick loop driving three things:

- **Cue interpreter** — modern equivalent of VPT8's `C/F/D/L/S` letter codes: `recall` (cut to
  preset), `fade` (interpolate every numeric leaf that differs between current state and the preset
  snapshot over `seconds`, non-numerics switch at completion), `wait` (delay `seconds`), `goto`
  (jump to cue index — loops). Transport: `cueGo` advances/starts, `cueStop` halts, `cueJump` moves
  the cursor. When `running`, cues execute sequentially. Missing preset → cue skipped with a warning.
- **Timer bank** — wall-clock `HH:MM` triggers, at most once per matching minute, firing `cueGo` or
  a preset recall. (VPT8 had 15 fixed slots; ours is dynamic.)
- **LFO rack** — per enabled LFO, wave(phase) scaled to `[min,max]`, applied to `target` path.
  Writes are ephemeral (broadcast, not persisted).

## Inputs

- **Camera source** — `source: {type:"camera"}` in the render client via `getUserMedia`; always
  muted (no audio capture). Panel source selector gains a "Camera" option.
- **WebMIDI (panel)** — mappings live in shared state (`midiMap`); the panel browser holds the MIDI
  access (Chrome-only, permission-gated). "Learn" arms a mapping; the next CC fills
  channel/controller. CC values 0–127 scale to `[min,max]` and go out as normal updates.
- **OSC (server)** — minimal UDP listener (default port 9000, `OSC_PORT` env): address
  `/layers/layer-1/opacity` maps to the dotted path, first float/int arg is the value; `/cue/go`,
  `/cue/stop`, `/preset/recall <id>` map to their protocol messages. No external deps.

## Panel UI

New full-width band under the existing layout with three sections: **Cues** (step list editor +
transport + active-step highlight), **Timers**, **Modulation** (LFO rack + MIDI map with learn).
Each LayerStrip gains a collapsible **FX** drawer (flip/tile/zoom/pan/blur/motion-blur/brcosa/
edge-blend controls) and copy/paste-settings buttons (opacity, blend, mask, fx). All new components
are presentational, follow the tungsten/cyan token conventions, and get Storybook stories.

## Verification plan

`node --check` on all JS; panel `tsc && vite build`; boot the real server and exercise cue
fade/wait/goto, timers, LFO ticks, OSC datagrams, and the batch protocol with a scripted Node WS
client; load the render client + panel in a real browser (Playwright) to confirm the fx chain
renders and the new UI drives it.
