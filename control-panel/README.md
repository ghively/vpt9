# VPT control panel — the browser-based VPT8 replacement

A browser-based, Docker-deployable replacement for the Max/MSP VPT8 application: it
runs headless, projector outputs are fullscreen browsers, and warping/layer control
happens from a separate control panel — including warping a screen you're not standing
in front of, and casting YouTube from a phone to a virtual window. See `docs/` for the
architecture audit of the original VPT8 this replaces, and the design conversation that
shaped these decisions (`docs/ROADMAP.md`, `docs/VPT8-PARITY-GAPS.md`,
`docs/superpowers/specs/2026-07-11-projection-deck-redesign-design.md`).

This directory is **not** part of the VPT8 Max/MSP source discussed elsewhere in this
repo — it's new code for the replacement system.

This file is the **developer** reference (architecture, state shape, protocol, build &
run). If you're running a show rather than building the software, see
[`OPERATOR_GUIDE.md`](OPERATOR_GUIDE.md) instead.

## The panel: a "projection deck"

The operator UI (`panel/`) is a **projection deck** — a dominant live-preview **Stage**
at the center of the screen, not a flat stack of equal-weight cards:

- **Stage** (`panel/src/components/deck/Stage.tsx`) — renders the render-client's live
  low-res confidence-monitor preview and, per visible layer, an invisible clickable
  region derived from its warp corners. **Click a layer's image on the Stage to select
  it** — no need to hunt for it in a list first. The topmost layer under the click wins;
  clicking empty space deselects.
- **StageSelectionOverlay** (`panel/src/components/deck/StageSelectionOverlay.tsx`) —
  once a layer is selected, its warp corners/mesh handles or its mask shape are drawn
  directly on the Stage as draggable handles, in whichever mode the inspector is set to.
  Dragging sends the same `layers.<id>.warp...`/`.mask...` state updates the editors
  always did — no new protocol.
- **Inspector** (`panel/src/components/deck/Inspector.tsx`) — a contextual panel showing
  only the selected layer's controls: source, opacity, blend mode, and a **Warp · Mask ·
  FX** segmented switch that swaps both the on-stage overlay and the inspector body
  between corner/mesh warp editing, mask shape + matte-source editing, and the full FX
  drawer (transform / color / edge-blend / transport, each independently on/off).
- **LayerStack** (`panel/src/components/deck/LayerStack.tsx`) — a compact,
  top-of-stack-first, selectable/reorderable list of layers in the left rail (thumbnail +
  name + blend + opacity), replacing a full-width layer rack.
- **SlotGrid** (`panel/src/components/deck/SlotGrid.tsx`) — the 8 shared source-bank
  slots as a tight grid of cells in the left rail, instead of 8 full-width rows.
- **Show drawer** (`panel/src/components/deck/ShowDrawer.tsx`) — a collapsible bottom
  sheet with a tab strip: **Presets · Cues · Timers · LFO · MIDI · Media · PiP**. One
  section open at a time instead of five-plus stacked cards.
- **Command bar** — wordmark, a screen selector (tabs), an inline master fader,
  **BLACKOUT**, **BLIND**, and the connection status lamp.
- **Mobile layout** — below 720px / on a coarse pointer, the left rail and inspector
  collapse into bottom-sheet tabs (`MobileTabBar`); the Stage stays dominant; handles
  honor the 44px touch-target minimum.

The deck is a single dark theme by intent (a venue instrument, not a marketing surface).
Design source: `docs/superpowers/specs/2026-07-11-projection-deck-redesign-design.md`.

## Services

| Service | What it is | VPT8 analogue |
|---|---|---|
| `server/` | State store (file-persisted) + WebSocket broadcast hub + the automation engine (cue-list interpreter with 7 cue types, wall-clock timers, preset fades, the LFO rack incl. mixers/tempo-sync), an OSC/UDP listener **and sender** (bidirectional state mirroring), source-bank presets, and an HTTP surface for the cast receiver and the media library (upload/serve/delete video, gif, and jpg files under `MEDIA_DIR`). | `pattrstorage` + the app-wide send/receive bus + the cuelist/timer/LFO modules + `udpsend`/`udpreceive` |
| `render-client/` | Browser WebGL2 compositor: one shared multi-layer stack, per-layer effects chain (flip, tile, non-uniform zoom/pan/**rotation + anchor**, blur, motion-trail or directional-slide, brightness/contrast/saturation, edge-blend with invert — each stage independently bypassable), 24 blend modes, per-layer masking (rect/ellipse/**arbitrary polygon**, invert, luminance/video matte), per-layer **and** per-screen warp (corner-pin or Catmull-Rom mesh, density 2–10), an 8-slot shared source bank with clip transport (play/rate/loop off·loop·palindrome·once/pan/vol/loop-in-out/scrub-seek) and A/B mix inputs, video/color/camera/media-library sources (mp4/gif/jpg — gif and jpg sample into the texture as an `<img>`, not a `<video>`; camera supports a device picker + resolution), a house master dim/blackout/**blind**, and an audio-owner mute policy. One instance runs per physical screen, addressed by `?screen=<id>` in its URL. | `enginetab.maxpat` + `vlayer.maxpat` (all 9 stages) + `td.rota.jxs` + `pointmask01.js` + the corner-pin/mesh warp editors + `clipcontrol.maxpat` + `cam1`/`cam2` |
| `panel/` | The projection-deck operator UI described above: Stage (click-to-select + on-stage warp/mask handles), Warp·Mask·FX Inspector, LayerStack + SlotGrid rails, a media-library pane feeding every source picker, and a Show drawer (Presets/Cues/Timers/LFO/MIDI/Media/PiP) plus the command bar (screen selector, master, blackout, blind, connection lamp). | `layergui`/`layertab` + `activelayer.maxpat`'s point editors + `clipcontrol.maxpat` + the preset/cuelist/timer/LFO modules + the MIDI control surface |
| `cast-receiver/` | A DIAL/SSDP responder so a phone's YouTube app sees this as a "Cast" target; casting a video populates a PiP window's state. | *(no VPT8 equivalent — new capability)* |

## Feature set (VPT8 parity)

A 2026-07-12 adversarial audit (`docs/VPT8-PARITY-GAPS.md`) found the earlier "full
parity" claim in `docs/ROADMAP.md` was overstated — ~15 real gaps, a bug, and a
regression. All of them were subsequently closed (`docs/REMAINING-WORK.md` tracks the
task-by-task history). The shipped feature set:

- **Layers** — opacity, all 24 `shaders/v001 Mixers/` blend modes ported formula-by-
  formula, and per-layer copy/paste of the whole "look" (opacity, blend, mask, every FX
  value).
- **FX per layer** — flip/tile/zoom (non-uniform, with anchor) + continuous rotation,
  pan, brightness/contrast/saturation, gaussian blur, motion-blur (temporal trail **or**
  directional-slide), edge-blend (with invert), and independent per-stage on/off bypass
  so a preset amount can be toggled without losing its value.
- **Masking** — rectangle, ellipse, or an arbitrary polygon with an on-canvas vertex
  editor (drag a point, insert one on the outline, delete the selected one), plus invert
  and a luminance/video-matte mode (mask alpha driven from another source's luminance).
- **Warp** — corner-pin and a smooth Catmull-Rom mesh, density 2–10, both editable with
  on-stage handles, at **both** the layer level and the per-screen/output level.
- **Sources** — media (mp4/gif/jpg), camera (device picker + resolution), solid color,
  an 8-slot shared source bank with per-slot clip transport (play/rate/loop
  off·loop·palindrome·once/pan/vol/loop-in-out/scrub-seek), A/B mix inputs (camera and
  color allowed as mix/slot inputs), source-bank presets (save/recall the 8 slots),
  per-source resolution downscale, next/prev/random clip triggers, and per-layer
  playlists.
- **Show control** — presets; a cue-list interpreter with 7 cue types (`recall` / `fade`
  / `wait` / `goto` / `source` — recall a source-bank preset / `paramFade` — tween one
  bound parameter / `osc` — send a raw OSC message) and manual-GO checkpoints
  (`autoContinue` per cue); wall-clock timers (cueGo / recall / source); an LFO rack of 6
  oscillators plus waveform mixers, tempo/BPM sync, phase offset, and waveform invert;
  WebMIDI CC-learn mapping; and bidirectional OSC (listens **and** mirrors state out, for
  TouchOSC-style surfaces with feedback).
- **Output** — master dim, blackout, and **blind** (freeze the projector's last committed
  frame while you build the next look off-air, without interrupting the preview stream),
  a multi-screen selector with independent per-screen warp, PiP (YouTube/cast) windows,
  and a live confidence-monitor preview.

**Not verifiable from this environment** (headless/no hardware — see the "What's
verified" section below): a physical camera, a real MIDI controller, real Chromecast
hardware, and Docker/GPU execution on a real machine. A14's camera record-to-disk is
implemented but needs a real camera to confirm end to end.

**Explicit non-goals** (confirmed correctly scoped out, not gaps — see
`docs/VPT8-PARITY-GAPS.md` and `docs/ROADMAP.md`): Art-Net/DMX, serial/sensor input,
Syphon (macOS), the 7 Mac-only `.mxo` externals, the HAP codec (transcode to a standard
web codec instead), and reverse/negative playback rate (no browser exposes a negative
`playbackRate` — a hard platform limit VPT8 itself doesn't face).

## Architecture decisions made along the way

- **Compositing is client-side, per screen.** Each render client renders the full layer
  stack itself and applies only its own screen's warp — this mirrors VPT8's own model
  (one shared composited scene, sliced/warped per output) without needing a server-side
  GPU video-encoding pipeline this scope doesn't call for.
- **Warping never touches the projector screen directly.** The panel drags handles
  against a small, throttled JPEG preview pushed by the render client over the same
  WebSocket (`{"type":"preview", screenId, frame}`) — never the full-res output, and
  never requiring the operator to be standing in front of that screen. The Stage's
  click-to-select hit-tests the same normalized warp-corner geometry already in state, so
  no image analysis is needed to know what you clicked.
- **Corner-pin is bilinear, not a full projective homography.** Both corner-pin and
  mesh warp share one renderer: corner-pin is literally a 2×2 mesh (the mesh itself is
  Catmull-Rom-smoothed, density 2–10). Good enough for room-decoration-scale correction;
  not a substitute for a real projective transform on large professional installs.
- **YouTube is a DOM overlay, not a WebGL layer.** A cross-origin iframe's pixels can't
  be read into a WebGL texture (or drawn into the preview capture canvas — the preview
  of a PiP window will show as empty even when the video is actually playing), so PiP
  windows can be moved/resized as a rectangle but never masked or warped like a real
  layer, and won't show their actual video content in the operator's preview.
- **One audio owner at a time.** `audioOwnerScreenId` in state designates a single
  screen's render client to un-mute; every other client mutes its own video/PiP audio,
  so the same movie playing across multiple screens doesn't double up or drift.
- **The DIAL cast receiver needs host networking.** SSDP discovery is UDP multicast; a
  phone on the LAN can't discover a receiver stuck behind Docker's isolated bridge
  network. `docker-compose.yml` runs `cast-receiver` with `network_mode: host` and reads
  `CAST_RECEIVER_HOST` for the LAN IP to advertise.
- **Media uploads/downloads are plain HTTP, not framed over the WebSocket.** `POST
  /api/media` accepts a raw request body (no multipart-parsing dependency) with the
  filename carried in an `X-File-Name` header; `GET /media/:filename` streams straight
  off disk with Range support. Keeping binary transfer off the socket that carries JSON
  state deltas means a large upload or a video seek can't get wedged behind (or block)
  state-sync traffic.
- **The shared source bank is a hybrid, not a full replacement for per-layer sources.**
  Layers default to a direct source assignment; optionally, a layer can instead point at
  one of 8 shared `sourceBank` slots (mirroring VPT8's shared/hot-swappable bank), so
  several layers can share one live clip's transport state at once.

## State shape

```json
{
  "layers": {
    "layer-1": {
      "id": "layer-1", "name": "...", "order": 1,
      "source": { "type": "video", "url": "..." },
      "opacity": 1, "blendMode": "screen",
      "sourceMode": "single",
      "mask": {
        "enabled": false, "shape": "ellipse", "invert": false,
        "cx": 0.5, "cy": 0.5, "rx": 0.4, "ry": 0.4, "feather": 0.08,
        "polygon": [], "source": null
      },
      "warp": { "mode": "corner", "corners": [...], "mesh": { "size": 4, "points": [...] } },
      "fx": {
        "flipH": false, "flipV": false, "tileX": 1, "tileY": 1,
        "zoom": 1, "zoomX": 1, "zoomY": 1, "rotationDeg": 0, "anchorX": 0.5, "anchorY": 0.5,
        "panX": 0, "panY": 0, "blur": 0, "motionBlur": 0, "motionBlurMode": "trail",
        "brightness": 1, "contrast": 1, "saturation": 1,
        "edgeBlend": { "left": 0, "right": 0, "top": 0, "bottom": 0, "gamma": 2, "invert": false },
        "enabled": { "transform": true, "color": true, "edgeBlend": true, "mask": true }
      },
      "transport": { "playing": true, "rate": 1, "loopMode": "loop", "pan": 0, "vol": 1, "loopIn": 0, "loopOut": 1, "seek": null },
      "playlist": { "items": [], "index": 0 }
    }
  },
  "screens": {
    "screen-1": { "id": "screen-1", "name": "Screen 1", "warp": { "mode": "corner", "corners": [...], "mesh": { "size": 4, "points": [...] } } }
  },
  "sourceBank": {
    "slot-1": { "id": "slot-1", "content": { "type": "media", "mediaId": "media-1" }, "transport": {...} }
  },
  "sourceBankPresets": { "preset-1": { "id": "preset-1", "name": "Set A", "snapshot": { "slot-1": {...} } } },
  "pip": { "pip-1": { "id": "pip-1", "screenId": "screen-1", "title": "...", "videoId": null, "x": 0.55, "y": 0.12, "width": 0.36, "height": 0.2, "visible": false } },
  "audioOwnerScreenId": "screen-1",
  "master": 1, "blackout": false, "blind": false,
  "presets": { "preset-1": { "id": "preset-1", "name": "Evening chill", "snapshot": { "layers": {...}, "screens": {...}, "pip": {...}, "audioOwnerScreenId": "..." } } },
  "media": { "media-1": { "id": "media-1", "name": "Ambient loop.mp4", "filename": "media-1.mp4", "kind": "video", "size": 148734821, "uploadedAt": "2026-07-06T18:22:00.000Z" } },
  "automation": {
    "cues": [ { "id": "cue-1", "label": "Build", "type": "fade", "presetId": "preset-1", "seconds": 12, "autoContinue": false } ],
    "cursor": -1, "running": false,
    "timers": { "timer-1": { "id": "timer-1", "enabled": true, "time": "18:30", "action": "cueGo", "presetId": "" } }
  },
  "lfos": { "lfo-1": { "id": "lfo-1", "enabled": true, "kind": "osc", "wave": "sine", "rateHz": 0.25, "syncNote": null, "phase": 0, "waveInvert": false, "min": 0.4, "max": 0.9, "target": "layers.layer-1.opacity" } },
  "tempoBpm": 120,
  "midiMap": { "map-1": { "id": "map-1", "channel": 0, "controller": 21, "target": "layers.layer-1.opacity", "min": 0, "max": 1 } },
  "oscOut": { "enabled": false, "host": "127.0.0.1", "port": 9001 }
}
```

- All collections are keyed by **id**, not array index — layer stack order is the
  explicit `order` field, not object-key insertion order.
- `source.type` is `"video"` (needs `url` — either an uploaded `media` entry's
  `/media/<filename>` or an arbitrary external URL), `"color"` (needs `color: [r,g,b]`,
  0–1), or `"camera"` (getUserMedia; Chrome prompts once per origin, video only, never
  owns audio; supports a `deviceId` + resolution constraint for a picked camera).
- A layer's `sourceMode` is `"single"` (its own `source`, or a `sourceBankRef` pointing
  at a shared slot) or `"playlist"` (an ordered `playlist.items` list that auto-advances:
  still images on a server-side wall-clock timer, video on the audio-owner render-client
  relaying the native `ended` event, since the server has no other way to know a video
  finished).
- `media` entries are uploaded files, `kind` (`"video"`/`"gif"`/`"image"`) derived from
  the extension at upload time, not from `source.type` (which stays `"video"` regardless).
  The render client samples `kind: "video"` as a `<video>` element and `"gif"`/`"image"`
  as an `<img>` (a still image uploads its texture once; a gif re-samples every frame to
  track whichever frame the browser is currently showing) — this applies identically
  whether the source is a layer's own or a shared `sourceBank` slot's.
- `layers`/`screens`/`pip`/`audioOwnerScreenId` together form a preset snapshot;
  `presets` itself is excluded (recalling a preset doesn't recursively touch presets),
  and so are `automation`/`lfos`/`midiMap`/`sourceBank`/`sourceBankPresets` (a preset
  shouldn't rewrite your cue list or your shared source-bank setup — that's what
  `sourceBankPresets` is separately for).
- `master`/`blackout`/`blind` are the house-level output controls: `master` dims every
  render client's final warped output (0 = black, 1 = full); `blackout` is an instant
  hard cut; `blind` freezes each render client's last committed projector frame in place
  while it keeps compositing and pushing the low-res preview stream, so the operator can
  build the next look without it hitting live output. All three are deliberately **not**
  part of preset snapshots — recalls and cue fades never move them; only the command
  bar's controls (or an LFO/OSC update targeting `master`) do.
- `layer.fx` is the per-layer effects chain, applied in vlayer.maxpat's stage order:
  flip → tile → zoom/rotate/pan → brightness/contrast/saturation + edge-blend → blur →
  motion-trail/slide, with mask baked into alpha before layer warp deforms it. Each
  grouped stage (`fx.enabled.{transform,color,edgeBlend,mask}`) can be switched off
  independently of its value, so a preset amount survives a bypass toggle. All values
  above are the "stage off" defaults; the server backfills missing `fx` (and the other
  new containers) into older `state.json` files on load.
- `mask.shape` is `"rect"` / `"ellipse"` / `"polygon"` (`mask.polygon` is a list of
  normalized `{x,y}` vertices, editable on-stage: drag a point, insert one on the
  outline, delete the selected one); `mask.invert` flips inside/outside; `mask.source`,
  when set, points at another source whose luminance drives this layer's mask alpha
  instead of the shape (a video/image matte).
- Cue `type`s: `recall` (cut to preset), `fade` (interpolate every numeric leaf toward
  the preset over `seconds`, then land exactly), `wait` (delay), `goto` (jump to cue
  index — loops are a `goto` backwards), `source` (recall a `sourceBankPresets` entry),
  `paramFade` (tween one dotted state path from a start value to an end value over
  `seconds`), `osc` (send a raw OSC message out). `autoContinue` (default `false`) marks
  whether a cue chains to the next one on its own once it completes, or holds for the
  next manual GO. Transport state (`cursor`/`running`) always boots as stopped.
- LFO waves: `sine`, `triangle`, `square`, `saw`, `random` (sample-and-hold per cycle).
  An LFO's `kind` is `"osc"` (a plain oscillator — rate as free-running `rateHz` or
  tempo-synced via `syncNote` against the top-level `tempoBpm`, plus `phase` offset and
  `waveInvert`) or `"mixer"` (combines two other LFOs' current values with a blend
  operator instead of oscillating itself). LFO/fade ticks are broadcast but never trigger
  disk persistence.

## WebSocket protocol

- `{"type":"state","state":{...}}` — server → client on connect, full snapshot.
- `{"type":"update","path":"layers.layer-1.opacity","value":0.8}` — either direction;
  patches an **existing** leaf (dotted path, array indices work as plain numeric keys).
  Renaming a media item is just this, targeting `media.<id>.name` — no dedicated message
  type.
- `{"type":"create","path":"layers","value":{...}}` — client → server; adds a new entry,
  keyed by `value.id`. Server broadcasts back `{"type":"create","path","key","value"}`
  (layers get `order` auto-assigned if omitted).
- `{"type":"delete","path":"layers.layer-2"}` — client → server; removes an entry, server
  broadcasts the same message.
- `{"type":"presetSave","name":"Evening chill"}` → server captures the current
  layers/screens/pip/audioOwnerScreenId as a new preset (broadcast as a `create` on
  `presets`).
- `{"type":"presetRecall","presetId":"preset-1"}` → server replaces those same fields
  from the preset snapshot and broadcasts a full `{"type":"state",...}`.
- `{"type":"preview","screenId":"screen-1","frame":"data:image/jpeg;base64,..."}` — a
  render client's live low-res confidence-monitor frame, relayed to every *other*
  connected client (never persisted, never sent back to its own sender) — this is what
  the Stage renders and hit-tests for click-to-select.
- `{"type":"batch","updates":[{"path":"...","value":...},...]}` — server → clients;
  one message per 30 Hz engine tick carrying every fade/LFO value change at once.
  Clients apply all patches, then re-derive once.
- `{"type":"cueGo"}` / `{"type":"cueStop"}` / `{"type":"cueJump","index":2}` — cue-list
  transport. GO starts the interpreter (or skips ahead if already running — an active
  fade completes instantly first); STOP halts where it is; JUMP arms the cursor so the
  next GO runs `cues[index]`. A cue with `autoContinue: false` (the default) holds at its
  end for the next GO rather than chaining automatically.

`GET /state` returns the current state as JSON; `GET /health` is a liveness check;
`POST /api/pip/:pipId/cast` with `{"videoId": "...", "title": "..."}` is the hook the
cast-receiver (or anything else outside the WS protocol) uses to push a video into a PiP
window without needing its own WebSocket client.

The media library (`server/src/media.js`) is three more HTTP endpoints, deliberately
outside the WS protocol:

- `POST /api/media` — body is the raw file bytes, filename in an `X-File-Name` header.
  The extension decides `kind` and must be in the allowlist (`mp4`/`gif`/`jpg`/`jpeg`,
  case-insensitive) or the upload is rejected with 400. Size is capped at
  `MEDIA_MAX_BYTES` (default 1 GiB): checked against `Content-Length` up front, and
  against actual bytes written as a fallback (aborts + deletes the partial file, 413,
  if the declared length was missing or wrong). On success it writes the file under
  `MEDIA_DIR` as a server-generated `media-<id>.<ext>` (the client-supplied name is
  metadata only, never a path), returns `{"ok": true, "media": {...}}` with the created
  entry, and broadcasts it as a WS `create` on `media`.
- `GET /media/:filename` — serves the file, `filename` validated against the
  server-generated-name pattern before touching disk (an invalid or missing filename is
  a bare 404, no headers). Supports **HTTP Range** (needed for `<video>` seeking) and,
  on a successful or range response, sends `Access-Control-Allow-Origin: *`, required
  because the render client samples video/gif/image sources into a WebGL texture via
  `crossOrigin: "anonymous"`, which taints the canvas without CORS.
- `DELETE /api/media/:id` — deletes the file off disk and its `media` state entry,
  broadcasts a WS `delete`. Renaming isn't a fourth endpoint — see the WS `update` note
  above.

### OSC

The server listens for OSC over UDP (default port `9000`, set `OSC_PORT`, `0` disables)
so TouchOSC/QLab/anything OSC can drive it without a WebSocket client, **and** can mirror
state changes back out for bidirectional surfaces (a TouchOSC layout with feedback, a
lighting console):

- `/layers/layer-1/opacity 0.8` — any address maps to the dotted state path, first
  argument (f/i/d/s/T/F supported, `#bundle` unwrapped) is the value.
- `/cue/go`, `/cue/stop`, `/cue/jump 2`, `/preset/recall preset-1` — transport controls.
- OSC **output** (`server/src/osc-out.js`) is configured via `state.oscOut` (`enabled`,
  `host`, `port`); when enabled it mirrors state changes out as they happen (throttled,
  not per-tick) so an external surface's own display stays in sync with the panel, and a
  cue-list `osc` step can send an arbitrary one-off OSC message.

This WS + OSC pair is also the integration surface any future hardware bridge
(Art-Net/DMX, serial sensors) would target from outside the browser sandbox.

## Running it

### Docker (matches how this is meant to actually run)

```sh
CAST_RECEIVER_HOST=<this-machine's-LAN-IP> docker compose up --build
```

- Control-plane: `ws://localhost:8080` (state at `http://localhost:8080/state`)
- Render client (one per physical screen): `http://localhost:8081/index.html?screen=screen-1&ws=ws://localhost:8080`
- Control panel: `http://localhost:8082/index.html?ws=ws://localhost:8080`
- Cast receiver: SSDP on UDP 1900, DIAL HTTP on `:8090` — cast a YouTube video from a
  phone on the same LAN and it should show up as `pip-1`'s window (open it from the Show
  drawer's PiP tab to make it visible/position it).

### Locally without Docker

```sh
cd server && npm install && npm start                          # control-plane on :8080
cd render-client && npx serve -l 8081 .                         # any static server works
cd panel && npm install && npm run dev                          # React/Vite panel on :8082
cd cast-receiver && CONTROL_PLANE_URL=http://localhost:8080 CAST_RECEIVER_HOST=<this-machine's-LAN-IP> npm start
```

`CAST_RECEIVER_HOST` defaults to `localhost` if omitted, which only a phone running on
the same machine could reach — set it to the machine's real LAN IP so phones elsewhere
on the network can discover and load the DIAL device description.

`panel/package.json` also has `npm run build` (`tsc --noEmit` + `vite build`), `npm run
lint` (ESLint), and `npm run storybook` (component stories for `Stage`, `Inspector`,
`LayerStack`, `SlotGrid`, and the rest of `panel/src/components/`). `server/` and
`e2e/` each have `npm test` (`node --test` for the server; `playwright test` for e2e —
see below).

Open the panel and a render client side by side — dragging a warp handle or an opacity
slider in the panel should visibly change the render client's output live, and the
render client's preview should appear on the panel's Stage within ~250ms.

## Fullscreen kiosk

The render client requests fullscreen on double-click for manual testing. For a real
projector machine, launch Chromium directly in kiosk mode instead of relying on that:

```sh
chromium --kiosk --autoplay-policy=no-user-gesture-required \
  "http://<control-plane-host>:8081/index.html?screen=screen-1&ws=ws://<control-plane-host>:8080"
```

(`--autoplay-policy` is needed because the render client plays `<video>` elements
programmatically, with no user click on the kiosk machine to satisfy the browser's
default autoplay gesture requirement.)

## What's verified vs. spec-complete-but-untested-live

Everything above was exercised end-to-end with plain Node processes and headless
Chromium via Playwright: state create/update/delete/preset-save/recall, multi-layer
blend+mask+warp compositing, the full per-layer fx chain (edge-blend/brcosa/zoom/pan
confirmed at the pixel level via screenshots), the cue-list interpreter (fade
interpolation ticks, exact landing on the preset, wait, goto, transport), the timer
bank firing on a wall-clock minute, LFO batch ticks staying inside [min,max], OSC
datagrams landing as state updates, the live preview loop from render client to panel,
the deck's click-to-select and on-stage warp/mask editing driving real state, the audio-
owner mute toggle, hardened patch paths (primitive-leaf walks and `__proto__` injection
are rejected without crashing), and the DIAL receiver's SSDP response + HTTP app-launch
flow (via a real UDP M-SEARCH and a simulated launch POST).

`control-panel/e2e/` is this project's Playwright harness: one spec file per subsystem
(warp/mask geometry, layer-vs-screen warp independence, blend modes + mix-source
compositing, clip transport + playlist, media compositing), each spawning a real server
+ render-client with isolated per-spec state. Server test suite covers state validation
(including a `blend-modes-parity` check that the render-client and panel agree on all 24
blend-mode names/order and the source-bank mix-cycle guard's structural soundness —
`wouldCreateMixCycle` in `server/src/state.js`, which went through 8 rounds of
adversarial review before converging on a sound design; see
`docs/superpowers/plans/2026-07-08-parity-finish-line-plan.md`'s Task 7 for why), cue
types, timers, LFO oscillators/mixers, OSC in and out, source-bank presets, and media
upload/serve/delete. A documented, environment-specific skip remains for one mix-source
pixel check pending an HTTP-multipart test-fixture helper, and a headless-Chromium
gif-frame-advancement limitation affects one spec — neither is an app bug (see this
repo's session memory on "Headless WebGL flaky GPU").

Not verifiable from this environment, by nature of what they are:

- **Real YouTube playback inside the PiP iframe** — the embed URL and DOM wiring are
  correct, but actually loading video from youtube.com wasn't exercised.
- **An actual phone's YouTube app casting to the receiver** — the DIAL protocol
  implementation is spec-correct for the subset YouTube uses, but real-app compatibility
  (some details of YouTube's Leanback launch flow are reverse-engineered, not officially
  documented) hasn't been tested against a real device.
- **Docker execution** — the Dockerfiles and compose file are written and reviewed but not
  run under a Docker daemon (none available in the dev environment).
- **GPU execution — VERIFIED on real hardware (2026-07-13).** The four services were brought
  up locally on a Windows box with a discrete GPU (Node processes, no Docker): the render
  client obtained a hardware WebGL2 context — `ANGLE (AMD, AMD Radeon RX 9070 XT, Direct3D11)`,
  no context loss — and composited a driven scene end-to-end (color sources + `screen` blend +
  a feathered ellipse mask, pixel-verified), while the control panel connected to the
  control-plane, drove the scene, and showed the render client's live preview in its Stage, and
  the cast-receiver served its DIAL `dd.xml`. Only Docker-daemon packaging remains unrun.
- **Real hardware at the edges** — a physical camera on a projector machine (the
  getUserMedia + device-picker path is written but headless has no camera; the
  record-to-disk button is implemented but unverified against a real device), a hardware
  MIDI controller against the learn flow (WebMIDI needs Chrome + a device), real
  Chromecast hardware, and Art-Net/DMX/serial (no browser API exists — these need a
  small bridge process speaking the WS/OSC protocol above, which is deliberately left
  until hardware is actually in the room).

For the historical record of what parity gaps existed and how each was closed, see
`docs/VPT8-PARITY-GAPS.md` (the audit) and `docs/REMAINING-WORK.md` (the task-by-task
finish log).

## License

MIT — see [`LICENSE`](LICENSE). This applies to `control-panel/` only; the original VPT8
Max/MSP source elsewhere in this repo is licensed separately (CC BY-NC-SA 3.0, see
`vpt8 source code/VPT8-sourcecode-readme.rtf`) — `control-panel/` is an independent
rewrite, not a derivative of that source, and does not inherit its terms.
