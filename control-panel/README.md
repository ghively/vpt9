# VPT control panel — modernization scaffold (Phase 1)

This is the start of the VPT8 modernization discussed in `docs/`: a browser-based,
Docker-deployable replacement for the Max/MSP application, aimed at running headless
with projector outputs as fullscreen browsers and a separate control panel (eventually
warpable per screen, YouTube PiP, phone-cast, etc — see the design conversation this
scaffold came out of).

This directory is **not** part of the VPT8 Max/MSP source under discussion elsewhere in
this repo — it's new code for the replacement system.

## What Phase 1 actually is

Just the foundation, per the phased plan:

- **`server/`** — the control-plane: an in-memory (file-persisted) state store plus a
  WebSocket broadcast hub. This is the direct analogue of VPT8's `pattrstorage`/send-
  receive bus, minus the accumulated cruft.
- **`render-client/`** — a WebGL2 compositor running in the browser. Right now it
  renders exactly one layer (opacity + a video/image source), with a procedural test
  pattern fallback so the whole pipeline is verifiable without a real media file.
  `test-control.html` is a bare debug harness (a slider) for driving state changes —
  **it is not the designed control panel** (that's the dark, console-style mockup from
  the design conversation; wiring the real UI to this state protocol is a later step).

Not yet built: the multi-layer stack/blend modes, masking, warp, sources beyond a
single URL, YouTube PiP, phone-cast, presets, and everything else in the later phases.

## State protocol

The server holds a JSON state tree, currently just:

```json
{ "layers": { "layer-1": { "id": "layer-1", "name": "...", "source": { "type": "video", "url": "..." }, "opacity": 1, "blendMode": "normal" } } }
```

Layers are keyed by **id**, not array index, specifically so update messages stay valid
regardless of client-side ordering.

WebSocket messages, both directions:

- Server → client on connect: `{"type":"state","state":{...}}` (full snapshot)
- Either direction: `{"type":"update","path":"layers.layer-1.opacity","value":0.8}`
  (dotted-path patch; the server applies it, persists it, and rebroadcasts it to every
  connected client)

`GET /state` on the control-plane's HTTP port returns the current state as JSON; `GET
/health` is a liveness check.

## Running it

### Docker (matches how this is meant to actually run)

```sh
docker compose up --build
```

- Control-plane: `ws://localhost:8080` (state at `http://localhost:8080/state`)
- Render client: `http://localhost:8081/index.html?layer=layer-1&ws=ws://localhost:8080`
- Test harness: `http://localhost:8081/test-control.html?layer=layer-1&ws=ws://localhost:8080`

### Locally without Docker

```sh
cd server && npm install && npm start        # control-plane on :8080
cd render-client && npx serve -l 8081 .      # any static file server works
```

Open the render client and the test harness (URLs above) side by side — dragging the
harness's opacity slider should visibly fade the render client's canvas live.

## Fullscreen kiosk

The render client requests fullscreen on double-click for manual testing. For a real
projector machine, launch Chromium directly in kiosk mode instead of relying on that:

```sh
chromium --kiosk --autoplay-policy=no-user-gesture-required \
  "http://<control-plane-host>:8081/index.html?layer=layer-1&ws=ws://<control-plane-host>:8080"
```

(`--autoplay-policy` is needed because the render client plays `<video>` elements
programmatically, with no user click on the kiosk machine to satisfy the browser's
default autoplay gesture requirement.)
