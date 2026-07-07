# VPT control panel — modernization scaffold

A browser-based, Docker-deployable replacement for the Max/MSP VPT8 application: it
runs headless, projector outputs are fullscreen browsers, and warping/layer control
happens from a separate control panel — including warping a screen you're not standing
in front of, and casting YouTube from a phone to a virtual window. See `docs/` for the
architecture audit of the original VPT8 this replaces, and the design conversation that
shaped these decisions.

This directory is **not** part of the VPT8 Max/MSP source discussed elsewhere in this
repo — it's new code for the replacement system.

This file is the **developer** reference (architecture, state shape, protocol, build &
run). If you're running a show rather than building the software, see
[`OPERATOR_GUIDE.md`](OPERATOR_GUIDE.md) instead.

## Services

| Service | What it is | VPT8 analogue |
|---|---|---|
| `server/` | State store (file-persisted) + WebSocket broadcast hub + the automation engine (cue-list interpreter, wall-clock timers, preset fades, LFO rack), an OSC/UDP listener, and an HTTP surface for the cast receiver and the media library (upload/serve/delete video, gif, and jpg files under `MEDIA_DIR`). | `pattrstorage` + the app-wide send/receive bus + the cuelist/timer/LFO modules |
| `render-client/` | Browser WebGL2 compositor: multi-layer stack, per-layer effects chain (flip, tile, zoom/pan, blur, motion-trail, brightness/contrast/saturation, edge-blend), blend modes, per-layer masking, a house master dim/blackout, per-screen warp (corner-pin or mesh), video/color/camera/media-library sources (mp4/gif/jpg — gif and jpg sample into the texture as an `<img>`, not a `<video>`), a YouTube PiP overlay, and an audio-owner mute policy. One instance runs per physical screen, addressed by `?screen=<id>` in its URL. | `enginetab.maxpat` + `vlayer.maxpat` (all 9 stages) + the corner-pin/mesh warp editors + `cam1`/`cam2` |
| `panel/` | The actual operator UI: a persistent media-library pane (upload/rename/delete video, gif, and jpg files, feeding every layer's source picker), layer rack with per-strip FX drawer (incl. mask geometry and an on-canvas draggable mask-shape editor) and layer-look copy/paste, warp editor (drag corner/mesh handles against a live low-res preview pulled from the render client, selectable mesh density, screen add/rename), PiP window manager, a tabbed show-control section (presets / cues / timers / LFO / MIDI, one at a time instead of five stacked cards), house master fader + blackout, audio-owner selector, and a WebMIDI learn-based CC map with a state-built target picker. Below 720px, a bottom tab bar (Layers/Screen/Media/Show) replaces the two-column desktop layout. | `layergui`/`layertab` + `activelayer.maxpat`'s point editors + the preset/cuelist/timer modules + the MIDI control surface |
| `cast-receiver/` | A DIAL/SSDP responder so a phone's YouTube app sees this as a "Cast" target; casting a video populates a PiP window's state. | *(no VPT8 equivalent — new capability)* |

## Architecture decisions made along the way

- **Compositing is client-side, per screen.** Each render client renders the full layer
  stack itself and applies only its own screen's warp — this mirrors VPT8's own model
  (one shared composited scene, sliced/warped per output) without needing a server-side
  GPU video-encoding pipeline this scope doesn't call for.
- **Warping never touches the projector screen directly.** The panel drags handles
  against a small, throttled JPEG preview pushed by the render client over the same
  WebSocket (`{"type":"preview", screenId, frame}`) — never the full-res output, and
  never requiring the operator to be standing in front of that screen.
- **Corner-pin is bilinear, not a full projective homography.** Both corner-pin and
  mesh warp share one renderer: corner-pin is literally a 2×2 mesh. Good enough for
  room-decoration-scale correction; not a substitute for a real projective transform on
  large professional installs.
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

## State shape

```json
{
  "layers": {
    "layer-1": {
      "id": "layer-1", "name": "...", "order": 1,
      "source": { "type": "video", "url": "..." } ,
      "opacity": 1, "blendMode": "screen",
      "mask": { "enabled": false, "shape": "ellipse", "cx": 0.5, "cy": 0.5, "rx": 0.4, "ry": 0.4, "feather": 0.08 },
      "fx": {
        "flipH": false, "flipV": false, "tileX": 1, "tileY": 1,
        "zoom": 1, "panX": 0, "panY": 0, "blur": 0, "motionBlur": 0,
        "brightness": 1, "contrast": 1, "saturation": 1,
        "edgeBlend": { "left": 0, "right": 0, "top": 0, "bottom": 0, "gamma": 2 }
      }
    }
  },
  "screens": {
    "screen-1": { "id": "screen-1", "name": "Screen 1", "warp": { "mode": "corner", "corners": [...], "mesh": { "size": 4, "points": [...] } } }
  },
  "pip": { "pip-1": { "id": "pip-1", "screenId": "screen-1", "title": "...", "videoId": null, "x": 0.55, "y": 0.12, "width": 0.36, "height": 0.2, "visible": false } },
  "audioOwnerScreenId": "screen-1",
  "master": 1,
  "presets": { "preset-1": { "id": "preset-1", "name": "Evening chill", "snapshot": { "layers": {...}, "screens": {...}, "pip": {...}, "audioOwnerScreenId": "..." } } },
  "media": { "media-1": { "id": "media-1", "name": "Ambient loop.mp4", "filename": "media-1.mp4", "kind": "video", "size": 148734821, "uploadedAt": "2026-07-06T18:22:00.000Z" } },
  "automation": {
    "cues": [ { "id": "cue-1", "label": "Build", "type": "fade", "presetId": "preset-1", "seconds": 12 } ],
    "cursor": -1, "running": false,
    "timers": { "timer-1": { "id": "timer-1", "enabled": true, "time": "18:30", "action": "cueGo", "presetId": "" } }
  },
  "lfos": { "lfo-1": { "id": "lfo-1", "enabled": true, "wave": "sine", "rateHz": 0.25, "min": 0.4, "max": 0.9, "target": "layers.layer-1.opacity" } },
  "midiMap": { "map-1": { "id": "map-1", "channel": 0, "controller": 21, "target": "layers.layer-1.opacity", "min": 0, "max": 1 } }
}
```

- All collections are keyed by **id**, not array index — layer stack order is the
  explicit `order` field, not object-key insertion order.
- `source.type` is `"video"` (needs `url` — either an uploaded `media` entry's
  `/media/<filename>` or an arbitrary external URL), `"color"` (needs `color: [r,g,b]`,
  0–1), or `"camera"` (getUserMedia; Chrome prompts once per origin, video only, never
  owns audio).
- `media` entries are uploaded files, `kind` (`"video"`/`"gif"`/`"image"`) derived from
  the extension at upload time, not from `source.type` (which stays `"video"` regardless).
  The render client samples `kind: "video"` as a `<video>` element and `"gif"`/`"image"`
  as an `<img>` (a still image uploads its texture once; a gif re-samples every frame to
  track whichever frame the browser is currently showing).
- `layers`/`screens`/`pip`/`audioOwnerScreenId` together form a preset snapshot;
  `presets` itself is excluded (recalling a preset doesn't recursively touch presets),
  and so are `automation`/`lfos`/`midiMap` (a preset shouldn't rewrite your cue list).
- `master` is the house dim (0 = blackout, 1 = full): every render client multiplies its
  final warped output by it. Deliberately **not** part of preset snapshots — recalls and
  cue fades never move it; the panel's faceplate fader/BLACKOUT button (or an LFO/OSC
  update targeting `master`) is the only thing that does.
- `layer.fx` is the per-layer effects chain, applied in vlayer.maxpat's stage order:
  flip → tile → zoom/pan → brightness/contrast/saturation + edge-blend → blur →
  motion-trail. All values above are the "stage off" defaults; the server backfills
  missing `fx` (and the other new containers) into older `state.json` files on load.
- Cue `type`s: `recall` (cut to preset), `fade` (interpolate every numeric leaf toward
  the preset over `seconds`, then land exactly), `wait` (delay), `goto` (jump to cue
  index — loops are a `goto` backwards). Transport state (`cursor`/`running`) always
  boots as stopped.
- LFO waves: `sine`, `triangle`, `square`, `saw`, `random` (sample-and-hold per cycle).
  LFO/fade ticks are broadcast but never trigger disk persistence.

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
  connected client (never persisted, never sent back to its own sender).
- `{"type":"batch","updates":[{"path":"...","value":...},...]}` — server → clients;
  one message per 30 Hz engine tick carrying every fade/LFO value change at once.
  Clients apply all patches, then re-derive once.
- `{"type":"cueGo"}` / `{"type":"cueStop"}` / `{"type":"cueJump","index":2}` — cue-list
  transport. GO starts the interpreter (or skips ahead if already running — an active
  fade completes instantly first); STOP halts where it is; JUMP arms the cursor so the
  next GO runs `cues[index]`.

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

The server also listens for OSC over UDP (default port `9000`, set `OSC_PORT`, `0`
disables) so TouchOSC/QLab/anything OSC can drive it without a WebSocket client:

- `/layers/layer-1/opacity 0.8` — any address maps to the dotted state path, first
  argument (f/i/d/s/T/F supported, `#bundle` unwrapped) is the value.
- `/cue/go`, `/cue/stop`, `/cue/jump 2`, `/preset/recall preset-1` — transport controls.

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
  phone on the same LAN and it should show up as `pip-1`'s window (see the PiP manager
  in the panel to make it visible/position it).

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

Open the panel and a render client side by side — dragging a warp handle or an opacity
slider in the panel should visibly change the render client's output live, and the
render client's preview should appear in the panel's warp editor within ~250ms.

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
the new panel sections driving real state, drag-based warp/PiP editing through the real
UI, the audio-owner mute toggle, hardened patch paths (primitive-leaf walks and
`__proto__` injection are rejected without crashing), and the DIAL receiver's SSDP
response + HTTP app-launch flow (via a real UDP M-SEARCH and a simulated launch POST).

The 2026-07-05/06 panel UI overhaul (two-column console layout, house master +
blackout, the FX drawer's mask-geometry section, mesh-density selector, preset
rename/delete, screen add/rename, and the LFO/MIDI target picker) added its own
scripted Playwright pass against a live server and browser: master fader → `state.master`,
blackout-and-restore, mask faders → the layer's `mask` object, preset save → rename →
delete round-trip, cue GO advancing `automation.cursor`, mesh-size change producing a
correctly-sized identity grid in one atomic update, screen rename/add, and an enabled
LFO actually oscillating a bound layer's opacity over time — all 8 checks pass with no
browser console errors.

Not verifiable from this environment, by nature of what they are:

- **Real YouTube playback inside the PiP iframe** — the embed URL and DOM wiring are
  correct, but actually loading video from youtube.com wasn't exercised.
- **An actual phone's YouTube app casting to the receiver** — the DIAL protocol
  implementation is spec-correct for the subset YouTube uses, but real-app compatibility
  (some details of YouTube's Leanback launch flow are reverse-engineered, not officially
  documented) hasn't been tested against a real device.
- **Docker/GPU execution** — the Dockerfiles and compose file are written and reviewed
  but not run in this environment (no Docker daemon available).
- **Real hardware at the edges** — a physical camera on a projector machine (the
  getUserMedia path is written but headless has no camera), a hardware MIDI controller
  against the learn flow (WebMIDI needs Chrome + a device), real Chromecast hardware,
  and Art-Net/DMX/serial (no browser API exists — these need a small bridge process
  speaking the WS/OSC protocol above, which is deliberately left until hardware is
  actually in the room).
