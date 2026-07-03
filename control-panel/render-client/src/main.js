import { Compositor } from "./compositor.js";
import { connectControlPlane } from "./socket.js";
import { PipOverlay } from "./pip.js";
import { applyUpdate, applyCreate, applyDelete } from "./patch.js";

const canvas = document.getElementById("stage");
const statusEl = document.getElementById("status");
const pipRoot = document.getElementById("pip-root");

const compositor = new Compositor(canvas);
compositor.start();

const params = new URLSearchParams(location.search);
const screenId = params.get("screen") || "screen-1";
const wsUrl = params.get("ws") || `ws://${location.hostname}:8080`;

const pipOverlay = new PipOverlay(pipRoot, screenId);

let state = { layers: {}, screens: {}, pip: {}, audioOwnerScreenId: null };

function applyDerivedState() {
  const isAudioOwner = state.audioOwnerScreenId === screenId;
  compositor.setLayers(state.layers);
  compositor.setWarp(state.screens?.[screenId]?.warp);
  compositor.setMuted(!isAudioOwner);
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
});

// Preview pusher for the control panel's warp editor: a small, infrequent JPEG of this
// screen's actual composited+warped output, sent as its own message type (never stored
// in `state` — it's the confidence-monitor feed described in the design conversation,
// not part of the persisted scene).
setInterval(() => {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "preview", screenId, frame: compositor.capturePreview(320) }));
}, 250);

document.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) canvas.requestFullscreen?.();
  else document.exitFullscreen?.();
});
