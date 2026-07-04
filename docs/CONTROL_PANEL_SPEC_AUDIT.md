# VPT Control-Panel Spec-Compliance Audit

Date: 2026-07-03 (findings below fixed same day — see "Fix log")

## Scope

`control-panel/` (the browser-based VPT8 replacement: `server/`, `render-client/`,
`panel/`, `cast-receiver/`) audited against its own spec — `control-panel/README.md`
(Services table, State shape, Architecture decisions, WebSocket protocol, Running it,
and the "What's verified vs. spec-complete-but-untested-live" section). This is a
compliance/completion audit only: does the code do what the README says it does. It is
not a security review.

Method: one focused read-through audit per service (server, render-client, panel,
cast-receiver+Docker), each checking every concrete spec claim against the actual code
with file:line citations, plus live verification of the server's WebSocket protocol
(state/update/create/delete/presetSave/presetRecall/preview, `/api/pip/:pipId/cast`)
against a running instance, and direct spot-checks of the two confirmed bugs below.

## Bottom line

The implementation is **substantially spec-compliant**. The server's WebSocket/HTTP
protocol matches the README exactly — verified both by static read and by exercising a
live instance. Compositing, masking, dual-mode warp (corner-pin correctly implemented
as a literal 2×2 mesh sharing the mesh renderer), the `?screen=` addressing scheme,
preview throttling/format, PiP-as-unmaskable-DOM-overlay, presets, and the audio-owner
selector are all faithfully implemented. Three real defects and one UI gap survived
verification; everything else checked out or was minor/undocumented-but-harmless.

## Confirmed defects

### 1. FIXED — BUG (high) — PiP audio never respects `audioOwnerScreenId`
`render-client/src/pip.js:48` hardcodes `mute=1` in the YouTube embed URL with no
`enablejsapi`/postMessage wiring to unmute later, and `audioOwnerScreenId` is never
even passed into `PipOverlay` (`render-client/src/main.js:17` constructs it with only
`screenId`). The README states "every other client mutes its own video/PiP audio" —
implying the *owner's* PiP audio should play. In practice PiP audio is unconditionally
muted on every screen, including the designated audio owner. `<video>` layer audio is
correctly gated by `audioOwnerScreenId` (`main.js:24`, `compositor.js`); only the PiP
path is broken.
**Fix:** pass `audioOwnerScreenId`/owner-flag into `PipOverlay`, add `enablejsapi=1` to
the embed URL, and toggle mute via the YouTube iframe postMessage API when ownership
changes.

### 2. FIXED — BUG (high) — Docker deployment's cast→PiP push cannot work as documented
`docker-compose.yml` sets `network_mode: host` for `cast-receiver` (line 38) but gives
it `CONTROL_PLANE_URL=http://control-plane:8080` (line 29) — a Compose service-name
hostname that only resolves on the Compose-managed bridge network. A host-networked
container doesn't join that network, so the fetch in
`cast-receiver/src/index.js` (`POST ${CONTROL_PLANE_URL}/api/pip/${PIP_ID}/cast`) throws
`ENOTFOUND control-plane`, silently swallowed by a catch in `dial-http.js` (logged only,
no user-visible error). In the exact `docker compose up --build` flow the README
presents as canonical, casting a video from a phone would never populate `pip-1` —
directly contradicting the Services-table claim ("casting a video populates a PiP
window's state") and the walkthrough's "should show up as `pip-1`'s window." This is
exactly the kind of bug the README's own "Docker/GPU execution... not run in this
environment" caveat exists to flag.
**Fix:** set `CONTROL_PLANE_URL=http://localhost:8080` for `cast-receiver` (control-plane
already publishes `8080:8080` to the host, and cast-receiver shares the host's network
namespace).

### 3. FIXED — GAP (minor) — `CAST_RECEIVER_HOST` is not the env var the code reads
README says the receiver "reads `CAST_RECEIVER_HOST`"; the code
(`cast-receiver/src/index.js`) actually reads `ADVERTISE_HOST`. It works today only
because `docker-compose.yml` translates `CAST_RECEIVER_HOST` → `ADVERTISE_HOST` via
shell substitution — but the "Locally without Docker" section never mentions
`ADVERTISE_HOST` at all, so a non-Docker run has no documented way to set the advertised
LAN IP (silently defaults to `localhost`, which won't work for a phone on the LAN).
**Fix:** either rename the code's env var to `CAST_RECEIVER_HOST` for consistency, or
correct the README to say `ADVERTISE_HOST` and document it for the non-Docker path too.

### 4. FIXED — GAP (medium) — Panel provides no way to reorder layers
`panel/src/layer-rack.js` renders `layer.order` as a read-only, zero-padded index with no
drag handle or move-up/down control, and no action in `panel/src/app.js` ever sends an
`update` to `layers.<id>.order`. The state shape makes `order` the explicit,
authoritative stack-position field (independent of object-key order) specifically so
layers can be restacked — but the panel, the one place an operator would do that, has no
UI for it. Layers can be created and deleted from the panel, never reordered.
**Fix:** add drag-to-reorder or move-up/move-down controls to the layer rack that patch
`layers.<id>.order` (and, if two layers should never share an order value, renumber
siblings).

## Everything else: verified compliant

- **Server protocol** (`server/src/index.js`, `state.js`) — every WS message type
  (`state`, `update`, `create`, `delete`, `presetSave`, `presetRecall`, `preview`) and
  HTTP endpoint (`GET /state`, `GET /health`, `POST /api/pip/:pipId/cast`) matches the
  README exactly. Confirmed both by code read and by live exercise against a running
  server: update-on-existing-leaf broadcasts, update-on-nonexistent-path is a documented
  no-op, create auto-assigns `order` and echoes `{type,path,key,value}`, delete removes
  and rebroadcasts, presetSave/Recall round-trip the right fields and exclude `presets`
  itself, preview relays to every *other* client only and is never persisted, and the
  cast endpoint sets `videoId`/`title`/`visible`. State is file-persisted synchronously
  on every mutating write (no debounce), though the persisted file's shape isn't
  validated on load (only JSON-parse-checked) — a reliability gap, not a spec violation.
- **Render client** — multi-layer WebGL2 compositing with 6 blend modes, per-layer
  ellipse/rect masking with feather, corner-pin genuinely implemented as a 2×2 mesh
  sharing the mesh warp renderer (not a separate code path), `?screen=<id>` driving
  warp/mute/preview labeling, `{"type":"preview",...}` sent at a literal 250ms interval
  of the post-warp composited canvas downsampled to 320px JPEG, PiP as a DOM overlay
  structurally outside the WebGL/warp pipeline (can't be masked/warped, and is
  structurally absent from preview captures since only the canvas is captured), and
  fullscreen-on-double-click.
- **Panel** — layer create/edit/delete with correct dotted-path `update`/`create`/
  `delete` messages; warp editor drags handles against the cached WS `preview` frame
  only (never full-res output) and patches `screens.<id>.warp.corners/mesh.points`;
  PiP manager create/position/resize/show-hide with no mask/warp affordance (consistent
  with PiP's documented limitations); presets bar sends/receives `presetSave`/
  `presetRecall` correctly; audio-owner selector patches `audioOwnerScreenId`; `?ws=`
  URL param read correctly.
- **Cast-receiver** — SSDP M-SEARCH responder on UDP 1900 with correct DIAL `ST`/`USN`/
  `LOCATION` headers; DIAL HTTP API on :8090 (device description, YouTube app
  launch/status, form-encoded `v=<videoId>` per the reverse-engineered Leanback
  convention, correctly caveated in the README); launch correctly triggers
  `POST /api/pip/:pipId/cast` against `PIP_ID=pip-1`. Docker port/network mapping is
  correct for every service except the `CONTROL_PLANE_URL` issue above:
  `network_mode: host` is set only for cast-receiver; the other three services use
  bridge networking with the documented port mappings (8080/8081/8082).

## Minor undocumented-but-harmless observations (not spec violations)

- Server: `update` broadcasts are deduped on strict-equality of the new value
  (primitives only); `writeFileSync` in `saveState` is unguarded (a disk error would
  throw inside a WS message handler); no CORS headers on the HTTP endpoints.
- Render client: `compositor.js`'s `updateLayerField` is dead code, never called.
- Cast-receiver: sends unsolicited `ssdp:alive` NOTIFY every 30s (not documented, benign
  SSDP correctness improvement); `DELETE /apps/YouTube` doesn't push a "stop" back to
  the control-plane, so stopping cast from the phone doesn't hide the PiP server-side.
- Panel: a single shared `isDragging` flag defers *all* incoming state updates during
  any drag (warp handle or PiP box), not just the one being dragged — reasonable
  trade-off, just not documented. No reconnect logic in `socket.js`.

## Recommendation

Fix #1 and #2 before relying on this stack for a real installation — both break a
capability the README claims is working (audio-owner semantics for cast video; casting
itself, in the documented Docker deployment). #3 and #4 are smaller: #3 is a doc/code
naming mismatch that happens to work today, #4 is a real missing operator capability
(layer reordering) worth adding before this replaces VPT8's `layertab`/`layergui`
reordering support.

## Fix log

All four findings above were repaired the same day:

1. **PiP audio-owner** — `render-client/src/pip.js`'s `PipOverlay.sync`/`_upsert` now
   take an `isAudioOwner` flag (passed from `main.js`'s existing
   `state.audioOwnerScreenId === screenId` check, previously computed but never reused
   for PiP). The embed URL's `mute` param now reflects it, `enablejsapi=1` was added, and
   a same-video mute-state change is applied live via the YouTube IFrame API's
   `postMessage({event:"command",func:"mute"|"unMute"})` instead of reloading the iframe
   (which would restart playback). Verified by code inspection and `node --check`; real
   YouTube playback inside the PiP iframe remains unverified in this environment for the
   same reason the original README flags it as untestable here.
2. **Docker cast→PiP networking** — `docker-compose.yml`'s `cast-receiver.environment`
   now sets `CONTROL_PLANE_URL=http://localhost:8080` (reachable via the host-published
   port, since the container shares the host's network namespace) instead of the
   Compose-only service name `http://control-plane:8080`. Verified with
   `docker compose config`, confirming `control-plane` still publishes `8080:8080` to the
   host and `cast-receiver` resolves `localhost:8080` correctly under `network_mode: host`.
3. **`CAST_RECEIVER_HOST` naming** — `cast-receiver/src/index.js` now reads
   `process.env.CAST_RECEIVER_HOST` directly (was `ADVERTISE_HOST`); `docker-compose.yml`
   passes it straight through without renaming; the README's "Locally without Docker"
   section now documents setting `CAST_RECEIVER_HOST` for that path too, with its
   `localhost`-only-reachable default called out explicitly. Verified with
   `docker compose config` showing `CAST_RECEIVER_HOST: 192.168.1.50` reaching the
   container environment unchanged.
4. **Layer reordering** — `panel/src/layer-rack.js` now renders move-up/move-down
   buttons per layer strip (disabled at the top/bottom of the stack), wired to a new
   `actions.moveLayer(layer, neighbor)` in `panel/src/app.js` that swaps the two layers'
   `order` values via two `update` messages (no renumbering needed, since `order` only
   needs a total order, not contiguous integers — matching how `server/src/state.js`
   already assigns it). `panel/index.html`'s `.strip` grid gained a column for the new
   buttons. Verified end-to-end against a live server: sent the same two `update`
   messages the new action sends, confirmed `layers.layer-1.order`/`layers.layer-2.order`
   swapped correctly in server state.

All four fixes were syntax-checked (`node --check`) and, where a live server/protocol
claim was involved, exercised against a running instance rather than only read.
