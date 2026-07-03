import { Compositor } from "./compositor.js";
import { connectControlPlane } from "./socket.js";

const canvas = document.getElementById("stage");
const statusEl = document.getElementById("status");

const compositor = new Compositor(canvas);
compositor.start();

const params = new URLSearchParams(location.search);
const layerId = params.get("layer") || "layer-1";
const wsUrl = params.get("ws") || `ws://${location.hostname}:8080`;

function applyLayer(layer) {
  if (!layer) return;
  compositor.setOpacity(layer.opacity ?? 1);
  compositor.setSourceUrl(layer.source?.url);
}

connectControlPlane(wsUrl, {
  onStatus(status) {
    if (statusEl) statusEl.textContent = `${status} · ${wsUrl} · layer "${layerId}"`;
  },
  onState(state) {
    applyLayer(state.layers?.[layerId]);
  },
  onUpdate(path, value) {
    if (path === `layers.${layerId}.opacity`) compositor.setOpacity(value);
    else if (path === `layers.${layerId}.source.url`) compositor.setSourceUrl(value);
  },
});

document.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) canvas.requestFullscreen?.();
  else document.exitFullscreen?.();
});
