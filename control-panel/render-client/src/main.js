import { Compositor } from "./compositor.js";
import { connectControlPlane } from "./socket.js";
import { PipOverlay } from "./pip.js";
import { CameraRecorder } from "./record.js";
import { applyUpdate, applyCreate, applyDelete, applyBatch } from "./patch.js";

const canvas = document.getElementById("stage");
const statusEl = document.getElementById("status");
const pipRoot = document.getElementById("pip-root");

const params = new URLSearchParams(location.search);
const screenId = params.get("screen") || "screen-1";
const wsUrl = params.get("ws") || `ws://${location.hostname}:8080`;

// Optional fixed compositing resolution, e.g. ?res=1920x1080. Default (absent/invalid)
// composites at the output canvas's own pixel size — see compositor.js's internal-size
// notes. Use the override for weak projector GPUs or to pin a show's master resolution.
function parseRes(raw) {
  const m = /^(\d{2,5})x(\d{2,5})$/i.exec(raw ?? "");
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

// Compositor construction acquires the WebGL2 context and throws if it can't (getContext
// returns null: hardware acceleration disabled, the GPU is blocklisted, or too many live
// WebGL contexts already exist). At module top-level an uncaught throw here kills the whole
// render client — a silent black projector whose only trace is one console error, easily
// buried under browser-extension noise. Surface it ON the canvas so the operator can see
// WHAT failed and act on it, then rethrow (there is nothing to render without a context).
let compositor;
try {
  compositor = new Compositor(canvas, { internalRes: parseRes(params.get("res")) });
} catch (err) {
  if (statusEl) {
    statusEl.textContent = `render failed: ${err.message}. Enable the browser's hardware acceleration (GPU) and reload.`;
    statusEl.style.display = "";
    statusEl.style.color = "#ff6b6b";
    statusEl.style.fontSize = "14px";
  }
  throw err;
}
compositor.start();

// Library sources are stored as host-independent "/media/<file>" paths; resolve them
// against the same host this client talks WebSocket to.
const mediaOrigin = new URL(wsUrl.replace(/^ws/, "http")).origin;
compositor.setMediaOrigin(mediaOrigin);

const pipOverlay = new PipOverlay(pipRoot, screenId);

// Camera record-to-disk (task A14b). Records whichever camera stream the compositor's layer
// stack currently holds and POSTs the clip to the media library. Only the audio-owner screen
// records, so a camera shown on several screens uploads exactly one clip, not one per screen.
const recorder = new CameraRecorder(
  () => mediaOrigin,
  () => compositor.layerStack.firstCameraStream(),
);

let state = { layers: {}, screens: {}, pip: {}, audioOwnerScreenId: null };

let isAudioOwner = false;

// PiP windows are DOM iframes stacked OVER the GL canvas, outside the blind held-frame
// freeze — without holding them, an off-air pip move/show while blind would be visible
// to the audience immediately. Hold the pre-blind arrangement while blind; a commit
// (blind=false) syncs to the live state, a discard restores state anyway.
let heldPip = null;
function syncPipOverlay() {
  lastBlind = !!state.blind; // keep the light path's edge detector in step (see below)
  if (state.blind) {
    if (!heldPip) heldPip = structuredClone(state.pip);
    pipOverlay.sync(heldPip, isAudioOwner);
  } else {
    heldPip = null;
    pipOverlay.sync(state.pip, isAudioOwner);
  }
}

// Per-layer screen routing: a layer with `screens: null` (the default) composites on
// every screen — the pre-routing behavior; an array composites only on the listed screen
// ids. Filtered HERE (each render client knows its own ?screen= identity) so a routed-away
// layer never even decodes on this screen — its media element is torn down like a deleted
// layer's, not just hidden.
function layersForThisScreen(layersById) {
  const mine = {};
  for (const [id, layer] of Object.entries(layersById ?? {})) {
    const routes = layer?.screens;
    if (routes == null || (Array.isArray(routes) && routes.includes(screenId))) mine[id] = layer;
  }
  return mine;
}

function applyDerivedState() {
  isAudioOwner = state.audioOwnerScreenId === screenId;
  compositor.setLayers(layersForThisScreen(state.layers), state.sourceBank, state.media);
  compositor.setWarp(state.screens?.[screenId]?.warp);
  compositor.setMuted(!isAudioOwner);
  compositor.setMaster(state.master ?? 1);
  compositor.setBlind(state.blind ?? false); // task A20: freeze the wall, keep preview live
  syncPipOverlay();
}

// Cheap subset of applyDerivedState for high-frequency leaf updates (warp/mask drags,
// 30 Hz LFO batches). The compositor reads layer warp/mask/fx/opacity/transport (and the
// screen-warp object) PER FRAME off the very objects applyUpdate just mutated in place,
// so those changes are already visible to the next rendered frame — the only work left
// is re-running the trivial scalar setters. Skipping setLayers() here matters: the full
// path re-sorts and re-resolves EVERY layer's source on every message, which at drag
// pointer rates was a real per-message CPU cost competing with the rAF render loop.
let lastBlind = false;
function applyDerivedStateLight() {
  compositor.setWarp(state.screens?.[screenId]?.warp);
  compositor.setMaster(state.master ?? 1);
  compositor.setBlind(state.blind ?? false);
  // Blind toggles arrive as a light-path leaf; the PiP hold must still engage/release on
  // that edge (edge-detected so 30 Hz LFO batches don't re-sync the pip DOM every tick).
  if (!!state.blind !== lastBlind) {
    lastBlind = !!state.blind;
    syncPipOverlay();
  }
}

// Paths whose new values are read per-frame straight off the shared state objects (see
// applyDerivedStateLight above). Everything else — layer create/delete/order/source/
// playlist changes, sourceBank content, media, pip, audio owner — still takes the full
// applyDerivedState() so sources re-resolve exactly as before.
const RENDER_TIME_LEAF =
  /^(?:master$|blind$|tempoBpm$|layers\.[^.]+\.(?:warp|mask|fx|opacity|blendMode|transport|downscale|name|visible)(?:\.|$)|screens\.[^.]+\.(?:warp|name)(?:\.|$)|sourceBank\.\d+\.transport(?:\.|$))/;

// The confidence-monitor preview switches to its faster "interactive" cadence for a
// short window after any control-plane write lands (see the preview pusher below).
let lastControlActivity = 0;
function noteControlActivity() {
  lastControlActivity = performance.now();
}

// The status line is a diagnostic, not a watermark: it must never sit over a live
// projection. Show it while connecting/disconnected/erroring; on "connected", flash it
// briefly (so a tech pointing a browser at the wall gets confirmation) then hide.
let statusHideTimer = null;
function showStatus(status) {
  if (!statusEl) return;
  statusEl.textContent = `${status} · ${wsUrl} · screen "${screenId}"`;
  statusEl.style.display = "";
  if (statusHideTimer) {
    clearTimeout(statusHideTimer);
    statusHideTimer = null;
  }
  if (status === "connected") {
    statusHideTimer = setTimeout(() => {
      statusEl.style.display = "none";
    }, 2500);
  }
}

const socket = connectControlPlane(wsUrl, {
  onStatus(status) {
    showStatus(status);
    // Identify this connection as a render client (on every (re)connect): the server
    // then skips it when relaying panel-only telemetry — every screen's ~10fps 640px
    // preview JPEGs and transport positions used to be mirrored to every projector,
    // which silently dropped them all.
    if (status === "connected") {
      socket.send(JSON.stringify({ type: "hello", role: "render", screenId }));
    }
  },
  onState(newState) {
    state = newState;
    noteControlActivity();
    applyDerivedState();
  },
  onUpdate(path, value) {
    if (applyUpdate(state, path, value)) {
      noteControlActivity();
      if (RENDER_TIME_LEAF.test(path)) applyDerivedStateLight();
      else applyDerivedState();
    }
  },
  onCreate(path, key, value) {
    if (applyCreate(state, path, key, value)) {
      noteControlActivity();
      applyDerivedState();
    }
  },
  onDelete(path) {
    if (applyDelete(state, path)) {
      noteControlActivity();
      applyDerivedState();
    }
  },
  onBatch(updates) {
    if (applyBatch(state, updates)) {
      noteControlActivity();
      if (updates.every((u) => u && typeof u.path === "string" && RENDER_TIME_LEAF.test(u.path))) {
        applyDerivedStateLight();
      } else {
        applyDerivedState();
      }
    }
  },
  onRecord(action) {
    // Task A14b: only the audio owner records + uploads, so a camera shown on multiple
    // screens produces a single clip. The recorder itself no-ops (with a warning) if no
    // camera stream is active or MediaRecorder is unavailable.
    if (!isAudioOwner) return;
    if (action === "start") recorder.start();
    else if (action === "stop") recorder.stop();
  },
});

// Wire the layer stack's clip-ended relay. Re-run after a WebGL context restore, which
// replaces compositor.layerStack with a fresh instance (whose onClipEnded starts null).
function wireLayerStack() {
  compositor.layerStack.onClipEnded = (layerId) => {
    if (!isAudioOwner || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "clipEnded", layerId }));
  };
}
wireLayerStack();

compositor.onContextRestored = () => {
  wireLayerStack();
  applyDerivedState(); // rebuild all layer sources/warp from the current state
};

// Per-layer playback-position telemetry: mirrors the ~250ms preview interval below, but
// much less frequent since it's just a number, not a JPEG, and only the audio-owner
// screen's positions are authoritative (see the audio-owner policy in README).
setInterval(() => {
  if (!isAudioOwner || socket.readyState !== WebSocket.OPEN) return;
  for (const [layerId, entry] of compositor.layerStack.entries) {
    if (entry.videoEl && !entry.videoEl.paused) {
      socket.send(JSON.stringify({ type: "transportStatus", layerId, position: entry.videoEl.currentTime }));
    }
  }
}, 500);

// Preview pusher for the control panel's stage: a JPEG of this screen's actual
// composited+warped output, sent as its own message type (never stored in `state` —
// it's the confidence-monitor feed described in the design conversation, not part of
// the persisted scene).
//
// ADAPTIVE cadence: while control-plane writes are landing (an operator dragging a
// warp/mask handle, an LFO running), frames go out ~10x/sec so the stage tracks the
// gesture; once the plane goes quiet the cadence relaxes to ~2.5x/sec. The capture
// itself is a synchronous GPU→CPU readback, so the idle rate stays low on purpose.
//
// capturePreview() reads the canvas back via toDataURL(); if any video source's media
// server doesn't send CORS headers, drawing it taints the canvas and toDataURL() throws
// a SecurityError on every tick thereafter. An unguarded loop here becomes a
// permanently-broken, console-spamming preview with no explanation. Warn once and stop.
const PREVIEW_WIDTH = 640; // was 320 — 320px stretched across the deck's dominant stage read as "super compressed"
const PREVIEW_ACTIVE_MS = 100; // ~10 fps while the operator is adjusting
const PREVIEW_IDLE_MS = 400; // ~2.5 fps once the control plane is quiet
const PREVIEW_ACTIVE_WINDOW_MS = 1500; // how long after the last write the fast cadence holds
let previewDisabled = false;
function pushPreview() {
  if (previewDisabled) return;
  const active = performance.now() - lastControlActivity < PREVIEW_ACTIVE_WINDOW_MS;
  if (socket.readyState === WebSocket.OPEN) {
    try {
      const frame = compositor.capturePreview(PREVIEW_WIDTH);
      socket.send(JSON.stringify({ type: "preview", screenId, frame }));
    } catch (err) {
      // A tainted canvas (video source without CORS headers) throws SecurityError on
      // EVERY capture forever — that one is latched off permanently. Any other throw
      // (e.g. a transient failure during a GPU reset window) is recoverable: log it
      // rate-limited by the pause below and keep the loop alive.
      if (err?.name === "SecurityError") {
        previewDisabled = true;
        console.error(
          "[preview] disabling confidence-monitor preview — canvas capture failed " +
            "(a video source missing CORS headers taints the canvas):",
          err.message,
        );
        return;
      }
      console.warn("[preview] capture failed (retrying):", err?.message);
      setTimeout(pushPreview, 1000); // back off before retrying a non-fatal failure
      return;
    }
  }
  setTimeout(pushPreview, active ? PREVIEW_ACTIVE_MS : PREVIEW_IDLE_MS);
}
setTimeout(pushPreview, PREVIEW_IDLE_MS);


document.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) canvas.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// Hide the mouse cursor over the projector output while fullscreen (VPT8's `cursor:none`
// on the output window) — an idle pointer must never show up in a live projection. Restore
// it on exit so the windowed client stays usable. Applied to both the canvas and <body> so
// the cursor stays hidden even in the letterbox margins around the fullscreened canvas.
document.addEventListener("fullscreenchange", () => {
  const hide = document.fullscreenElement ? "none" : "";
  canvas.style.cursor = hide;
  document.body.style.cursor = hide;
});
