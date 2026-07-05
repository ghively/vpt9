import { connectControlPlane } from "./socket.js";
import { applyUpdate, applyCreate, applyDelete } from "./patch.js";
import { renderLayerRack } from "./layer-rack.js";
import { renderWarpEditor } from "./warp-editor.js";
import { renderPipManager } from "./pip-manager.js";
import { renderPresetsBar } from "./presets-bar.js";

function identityMeshPoints(size) {
  const points = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) points.push({ x: col / (size - 1), y: row / (size - 1) });
  }
  return points;
}
const IDENTITY_CORNERS = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];

const params = new URLSearchParams(location.search);
const wsUrl = params.get("ws") || `ws://${location.hostname}:8080`;

let state = { layers: {}, screens: {}, pip: {}, presets: {}, audioOwnerScreenId: null };
let selectedScreenId = null;
let isDragging = false;
const latestPreviewByScreen = new Map();

const rackEl = document.getElementById("layer-rack");
const warpEl = document.getElementById("warp-editor");
const pipEl = document.getElementById("pip-manager");
const presetsEl = document.getElementById("presets-bar");
const audioOwnerEl = document.getElementById("audio-owner");
const statusEl = document.getElementById("status");

const { send } = connectControlPlane(wsUrl, {
  onStatus(status) {
    statusEl.textContent = `${status} · ${wsUrl}`;
    statusEl.dataset.state = status; // drives the faceplate lamp colour in index.html
  },
  onState(newState) {
    state = newState;
    if (!selectedScreenId || !state.screens[selectedScreenId]) {
      selectedScreenId = Object.keys(state.screens)[0] ?? null;
    }
    renderAll();
  },
  onUpdate(path, value) {
    if (applyUpdate(state, path, value)) renderAll();
  },
  onCreate(path, key, value) {
    if (applyCreate(state, path, key, value)) renderAll();
  },
  onDelete(path) {
    if (applyDelete(state, path)) renderAll();
  },
  onPreview(screenId, frame) {
    latestPreviewByScreen.set(screenId, frame);
    // Targeted update only — a full re-render here would fight in-progress drags and
    // reset focus in text inputs on every single preview frame (these arrive every
    // ~250ms per connected render client).
    for (const img of document.querySelectorAll(`.preview-img[data-screen="${screenId}"]`)) {
      img.src = frame;
    }
  },
});

const actions = {
  addLayer() {
    send({
      type: "create",
      path: "layers",
      value: {
        id: `layer-${Date.now()}`,
        name: "New layer",
        source: { type: "color", color: [0.5, 0.5, 0.5] },
        opacity: 1,
        blendMode: "normal",
        mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
      },
    });
  },
  updateLayer(id, field, value) {
    send({ type: "update", path: `layers.${id}.${field}`, value });
  },
  removeLayer(id) {
    send({ type: "delete", path: `layers.${id}` });
  },
  moveLayer(layer, neighbor) {
    if (!neighbor) return;
    // Swap `order` values rather than renumbering the whole stack — order only needs
    // to sort correctly, not be contiguous (see server/src/state.js's nextLayerOrder).
    send({ type: "update", path: `layers.${layer.id}.order`, value: neighbor.order });
    send({ type: "update", path: `layers.${neighbor.id}.order`, value: layer.order });
  },
  selectScreen(id) {
    selectedScreenId = id;
    renderAll();
  },
  setWarpMode(screenId, mode) {
    send({ type: "update", path: `screens.${screenId}.warp.mode`, value: mode });
  },
  resetWarp(screenId) {
    const warp = state.screens[screenId]?.warp;
    if (warp?.mode === "mesh") {
      send({ type: "update", path: `screens.${screenId}.warp.mesh.points`, value: identityMeshPoints(warp.mesh.size) });
    } else {
      send({ type: "update", path: `screens.${screenId}.warp.corners`, value: structuredClone(IDENTITY_CORNERS) });
    }
  },
  setWarpPoint(path, value) {
    send({ type: "update", path, value });
  },
  beginDrag() {
    isDragging = true;
  },
  endDrag() {
    isDragging = false;
    renderAll();
  },
  updatePip(id, field, value) {
    send({ type: "update", path: `pip.${id}.${field}`, value });
  },
  removePip(id) {
    send({ type: "delete", path: `pip.${id}` });
  },
  addPip(screenId) {
    send({
      type: "create",
      path: "pip",
      value: { id: `pip-${Date.now()}`, screenId, title: "YouTube", videoId: null, x: 0.1, y: 0.1, width: 0.3, height: (0.3 * 9) / 16, visible: false },
    });
  },
  savePreset(name) {
    send({ type: "presetSave", name });
  },
  recallPreset(id) {
    send({ type: "presetRecall", presetId: id });
  },
  setAudioOwner(screenId) {
    send({ type: "update", path: "audioOwnerScreenId", value: screenId });
  },
};

function renderAudioOwner() {
  audioOwnerEl.innerHTML = "";
  const label = document.createElement("span");
  label.className = "label";
  label.textContent = "Audio on: ";
  audioOwnerEl.appendChild(label);
  for (const screen of Object.values(state.screens || {})) {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = screen.name;
    chip.dataset.active = String(state.audioOwnerScreenId === screen.id);
    chip.addEventListener("click", () => actions.setAudioOwner(screen.id));
    audioOwnerEl.appendChild(chip);
  }
}

function renderAll() {
  if (isDragging) return;
  renderLayerRack(rackEl, state, actions);
  if (selectedScreenId) {
    renderWarpEditor(warpEl, state, { selectedScreenId, latestPreviewByScreen }, actions);
    renderPipManager(pipEl, state, { selectedScreenId, latestPreviewByScreen }, actions);
  }
  renderPresetsBar(presetsEl, state, actions);
  renderAudioOwner();

  // Tag preview images with their screen id so onPreview's targeted updates can find
  // them without going through a full render pass.
  for (const img of document.querySelectorAll(".preview-img")) {
    if (!img.dataset.screen) img.dataset.screen = selectedScreenId;
  }
}
