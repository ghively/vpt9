import { readFileSync, writeFileSync, renameSync, copyFileSync, existsSync } from "node:fs";

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

// Per-layer effects chain defaults — every value here is "stage off". Mirrors
// vlayer.maxpat's stage order (flip → tile → zoom/pan → brcosa/edge-blend → blur →
// motion-blur); leaves are flat so LFO/MIDI/OSC targets are simple dotted paths.
export function defaultFx() {
  return {
    flipH: false,
    flipV: false,
    tileX: 1,
    tileY: 1,
    zoom: 1,
    panX: 0,
    panY: 0,
    blur: 0,
    motionBlur: 0,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    edgeBlend: { left: 0, right: 0, top: 0, bottom: 0, gamma: 2 },
  };
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
      fx: defaultFx(),
    },
    "layer-2": {
      id: "layer-2",
      name: "Starfield",
      order: 2,
      source: { type: "color", color: [0.35, 0.16, 0.55] },
      opacity: 0.46,
      blendMode: "multiply",
      mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
      fx: defaultFx(),
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

  // Master dim: every render client multiplies its final output by this (0 = blackout).
  // Deliberately NOT in PRESET_FIELDS — preset recalls and cue fades must never yank
  // the house blackout around; only the operator (or an explicit LFO/OSC target) moves it.
  master: 1,

  presets: {},

  // Whole-app automation: the cue-list interpreter + wall-clock timer bank. `cursor`
  // and `running` are transport state — persisted for visibility but reset to stopped
  // on boot (a power-cycled installation shouldn't resume mid-cue-list on its own).
  automation: { cues: [], cursor: -1, running: false, timers: {} },

  // Modulation rack: each slot oscillates one numeric state path between min/max.
  lfos: {},

  // WebMIDI CC bindings (the panel browser owns the MIDI hardware; mappings live in
  // shared state so they survive reloads and can be edited from any panel).
  midiMap: {},
};

// `applyUpdate` only patches EXISTING leaves, so state loaded from an older
// state.json (or a layer created by an older client) must be backfilled with any
// fields this version knows about — otherwise the new controls would have nothing
// to patch. Also applied to preset snapshots, which are just captured layer maps.
function fillMissing(target, defaults) {
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in target)) {
      target[key] = structuredClone(value);
    } else if (value && typeof value === "object" && !Array.isArray(value) && target[key] && typeof target[key] === "object") {
      fillMissing(target[key], value);
    }
  }
}

export function ensureLayerDefaults(layer) {
  fillMissing(layer, { fx: defaultFx() });
}

export function ensureStateDefaults(state) {
  fillMissing(state, {
    automation: { cues: [], cursor: -1, running: false, timers: {} },
    lfos: {},
    midiMap: {},
    master: 1,
  });
  for (const layer of Object.values(state.layers ?? {})) ensureLayerDefaults(layer);
  for (const preset of Object.values(state.presets ?? {})) {
    for (const layer of Object.values(preset?.snapshot?.layers ?? {})) ensureLayerDefaults(layer);
  }
  state.automation.running = false;
  return state;
}

export function loadState(filePath) {
  if (existsSync(filePath)) {
    try {
      return ensureStateDefaults(JSON.parse(readFileSync(filePath, "utf8")));
    } catch (err) {
      console.error(`[state] failed to parse ${filePath}, falling back to defaults:`, err.message);
      // Don't just discard a corrupt file — a crash mid-write shouldn't silently erase
      // a show's saved layers/presets/cues with no way to recover them.
      const backupPath = `${filePath}.corrupt-${Date.now()}`;
      try {
        copyFileSync(filePath, backupPath);
        console.error(`[state] corrupt file preserved at ${backupPath} for inspection`);
      } catch (copyErr) {
        console.error(`[state] could not preserve corrupt file:`, copyErr.message);
      }
    }
  }
  return structuredClone(DEFAULT_STATE);
}

// Write-to-temp-then-rename so a process kill mid-write never leaves state.json
// truncated/corrupt — rename is atomic on both POSIX and NTFS. The temp file lives
// next to the target so the rename stays on the same filesystem/volume.
export function saveState(filePath, state) {
  const tmpPath = `${filePath}.tmp-${process.pid}`;
  writeFileSync(tmpPath, JSON.stringify(state, null, 2));
  renameSync(tmpPath, filePath);
}

// Paths come from untrusted LAN clients: refuse segments that would walk into the
// prototype chain ("__proto__", "constructor.prototype") instead of the state tree.
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isUnsafePath(keys) {
  return keys.some((key) => UNSAFE_KEYS.has(key));
}

export function walkToParent(state, keys) {
  let node = state;
  for (const key of keys) {
    // Only traverse actual containers; a path that dots through a primitive leaf
    // (e.g. "layers.layer-1.opacity.x") is invalid, not a crash.
    if (node == null || typeof node !== "object" || !Object.hasOwn(node, key)) return null;
    node = node[key];
  }
  return node;
}

// Patches an EXISTING leaf ("layers.layer-1.opacity"). Never creates new keys —
// use applyCreate for that. Returns true if the path was valid and the value changed.
export function applyUpdate(state, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  if (isUnsafePath(keys) || UNSAFE_KEYS.has(last)) return false;
  const node = walkToParent(state, keys);
  if (node == null || typeof node !== "object" || !Object.hasOwn(node, last)) return false;
  if (node[last] === value) return false;
  node[last] = value;
  return true;
}

// Creates a new entry at a container path ("layers", "pip", "presets"), keyed by
// value.id. Returns the created key, or null if the container path doesn't resolve
// to an object or the value has no usable id (downstream code assumes entries carry
// their own id).
export function applyCreate(state, containerPath, value) {
  const keys = containerPath.split(".");
  if (isUnsafePath(keys)) return null;
  const node = walkToParent(state, keys);
  if (node == null || typeof node !== "object") return null;
  const key = value?.id;
  if (typeof key !== "string" || !key || UNSAFE_KEYS.has(key)) return null;
  node[key] = value;
  return key;
}

// Deletes an entry at an exact path ("layers.layer-2"). Returns true if it existed.
export function applyDelete(state, path) {
  const keys = path.split(".");
  const last = keys.pop();
  if (isUnsafePath(keys) || UNSAFE_KEYS.has(last)) return false;
  const node = walkToParent(state, keys);
  if (node == null || typeof node !== "object" || !Object.hasOwn(node, last)) return false;
  delete node[last];
  return true;
}

export function nextLayerOrder(state) {
  const orders = Object.values(state.layers).map((l) => l.order ?? 0);
  return orders.length ? Math.max(...orders) + 1 : 1;
}
