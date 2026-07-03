import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Layers/screens/pip windows/presets are all keyed by id (never array index) so a
// WebSocket path like "layers.layer-1.opacity" stays valid regardless of client-side
// ordering. Layer stack order is explicit via `order` (ascending = bottom to top),
// not object-key insertion order, so reordering never requires rebuilding the object.
//
// All layers composite into ONE shared scene; screens don't get their own layer
// stacks. Each screen only differs in its final warp (corner-pin or mesh) applied to
// that same composited output — see docs/architecture/00-overview.md's "multiscreen
// dividers" precedent and the design conversation that settled on this model.
const IDENTITY_CORNERS = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

function identityMeshPoints(size) {
  const points = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      points.push({ x: col / (size - 1), y: row / (size - 1) });
    }
  }
  return points;
}

const DEFAULT_STATE = {
  layers: {
    "layer-1": {
      id: "layer-1",
      name: "Ambient loop",
      order: 1,
      source: { type: "video", url: "/media/sample.mp4" },
      opacity: 0.82,
      blendMode: "screen",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
    },
    "layer-2": {
      id: "layer-2",
      name: "Starfield",
      order: 2,
      source: { type: "color", color: [0.35, 0.16, 0.55] },
      opacity: 0.46,
      blendMode: "multiply",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
    },
  },

  screens: {
    "screen-1": {
      id: "screen-1",
      name: "Screen 1",
      warp: { mode: "corner", corners: structuredClone(IDENTITY_CORNERS), mesh: { size: 4, points: identityMeshPoints(4) } },
    },
    "screen-2": {
      id: "screen-2",
      name: "Screen 2",
      warp: { mode: "corner", corners: structuredClone(IDENTITY_CORNERS), mesh: { size: 4, points: identityMeshPoints(4) } },
    },
  },

  // Floating YouTube-style overlay windows. Not part of the WebGL layer stack (can't be
  // masked/warped — see the CORS constraint documented in control-panel/README.md);
  // each is pinned to one screen via screenId.
  pip: {
    "pip-1": {
      id: "pip-1",
      screenId: "screen-1",
      title: "YouTube",
      videoId: null,
      x: 0.55,
      y: 0.12,
      width: 0.36,
      height: (0.36 * 9) / 16,
      visible: false,
    },
  },

  // Only this screen's render client plays audio; every other client mutes itself.
  audioOwnerScreenId: "screen-1",

  presets: {},
};

export function loadState(filePath) {
  if (existsSync(filePath)) {
    try {
      return JSON.parse(readFileSync(filePath, "utf8"));
    } catch (err) {
      console.error(`[state] failed to parse ${filePath}, falling back to defaults:`, err.message);
    }
  }
  return structuredClone(DEFAULT_STATE);
}

export function saveState(filePath, state) {
  writeFileSync(filePath, JSON.stringify(state, null, 2));
}

function walkToParent(state, keys) {
  let node = state;
  for (const key of keys) {
    if (node == null) return null;
    node = node[key];
  }
  return node;
}

// Patches an EXISTING leaf ("layers.layer-1.opacity"). Never creates new keys —
// use applyCreate for that. Returns true if the path was valid and the value changed.
export function applyUpdate(state, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const node = walkToParent(state, keys);
  if (node == null || !(last in node)) return false;
  if (node[last] === value) return false;
  node[last] = value;
  return true;
}

// Creates a new entry at a container path ("layers", "pip", "presets"), keyed by
// value.id (falls back to the next path segment if given as "layers.layer-3").
// Returns the created key, or null if the container path doesn't resolve to an object.
export function applyCreate(state, containerPath, value) {
  const keys = containerPath.split(".");
  const node = walkToParent(state, keys);
  if (node == null || typeof node !== "object") return null;
  const key = value?.id ?? String(Date.now());
  node[key] = value;
  return key;
}

// Deletes an entry at an exact path ("layers.layer-2"). Returns true if it existed.
export function applyDelete(state, path) {
  const keys = path.split(".");
  const last = keys.pop();
  const node = walkToParent(state, keys);
  if (node == null || !(last in node)) return false;
  delete node[last];
  return true;
}

export function nextLayerOrder(state) {
  const orders = Object.values(state.layers).map((l) => l.order ?? 0);
  return orders.length ? Math.max(...orders) + 1 : 1;
}
