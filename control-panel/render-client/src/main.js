import { Compositor } from "./compositor.js";
import { connectControlPlane } from "./socket.js";
import { PipOverlay } from "./pip.js";
import { applyUpdate, applyCreate, applyDelete, applyBatch } from "./patch.js";

const canvas = document.getElementById("stage");
const statusEl = document.getElementById("status");
const pipRoot = document.getElementById("pip-root");

const compositor = new Compositor(canvas);
compositor.start();

const params = new URLSearchParams(location.search);
const screenId = params.get("screen") || "screen-1";
const wsUrl = params.get("ws") || `ws://${location.hostname}:8080`;

// Library sources are stored as host-independent "/media/<file>" paths; resolve them
// against the same host this client talks WebSocket to.
const mediaOrigin = new URL(wsUrl.replace(/^ws/, "http")).origin;
compositor.setMediaOrigin(mediaOrigin);

const pipOverlay = new PipOverlay(pipRoot, screenId);

let state = { layers: {}, screens: {}, pip: {}, audioOwnerScreenId: null };

let isAudioOwner = false;
function applyDerivedState() {
  isAudioOwner = state.audioOwnerScreenId === screenId;
  compositor.setLayers(state.layers, state.sourceBank, state.media);
  compositor.setWarp(state.screens?.[screenId]?.warp);
  compositor.setMuted(!isAudioOwner);
  compositor.setMaster(state.master ?? 1);
  pipOverlay.sync(state.pip, isAudioOwner);
}

const socket = connectControlPlane(wsUrl, {
  onStatus(status) {
    if (statusEl) statusEl.textContent = `${status} · ${wsUrl} · screen "${screenId}"`;
  },
  onState(newState) {
    state = newState;
    applyDerivedState();
  },
  onUpdate(path, value) {
    if (applyUpdate(state, path, value)) applyDerivedState();
  },
  onCreate(path, key, value) {
    if (applyCreate(state, path, key, value)) applyDerivedState();
  },
  onDelete(path) {
    if (applyDelete(state, path)) applyDerivedState();
  },
  onBatch(updates) {
    if (applyBatch(state, updates)) applyDerivedState();
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

// Preview pusher for the control panel's warp editor: a small, infrequent JPEG of this
// screen's actual composited+warped output, sent as its own message type (never stored
// in `state` — it's the confidence-monitor feed described in the design conversation,
// not part of the persisted scene).
//
// capturePreview() reads the canvas back via toDataURL(); if any video source's media
// server doesn't send CORS headers, drawing it taints the canvas and toDataURL() throws
// a SecurityError on every tick thereafter. Browsers keep re-invoking setInterval after
// an uncaught throw inside it, so an unguarded call here becomes a permanently-broken,
// console-spamming preview (4x/sec, forever) with no explanation. Warn once and stop.
let previewDisabled = false;
setInterval(() => {
  if (previewDisabled || socket.readyState !== WebSocket.OPEN) return;
  try {
    const frame = compositor.capturePreview(320);
    socket.send(JSON.stringify({ type: "preview", screenId, frame }));
  } catch (err) {
    previewDisabled = true;
    console.error(
      "[preview] disabling confidence-monitor preview — canvas capture failed " +
        "(likely a video source missing CORS headers, which taints the canvas):",
      err.message,
    );
  }
}, 250);


document.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) canvas.requestFullscreen?.();
  else document.exitFullscreen?.();
});
