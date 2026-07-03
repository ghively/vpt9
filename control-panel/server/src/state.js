import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Layers are keyed by id (not array index) so a WebSocket update path like
// "layers.layer-1.opacity" stays valid no matter what order clients see layers in.
// Insertion order of the keys is the compositing stack order.
const DEFAULT_STATE = {
  layers: {
    "layer-1": {
      id: "layer-1",
      name: "Ambient loop",
      source: { type: "video", url: "/media/sample.mp4" },
      opacity: 1,
      blendMode: "normal",
    },
  },
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

// Applies a dotted path update ("layers.0.opacity") to state in place.
// Returns true if the path was valid and the value changed.
export function applyUpdate(state, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  let node = state;
  for (const key of keys) {
    if (node == null) return false;
    node = node[key];
  }
  if (node == null || !(last in node)) return false;
  if (node[last] === value) return false;
  node[last] = value;
  return true;
}
