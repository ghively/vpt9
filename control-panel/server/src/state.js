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

export function defaultWarp() {
  return {
    mode: "corner",
    corners: structuredClone(IDENTITY_CORNERS),
    mesh: { size: 4, points: identityMeshPoints(4) },
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
      warp: defaultWarp(),
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
      warp: defaultWarp(),
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

  // Uploaded media (mp4/gif/jpg), keyed by id like every other collection. Files live
  // under MEDIA_DIR on disk; this holds the metadata the panel/render-client read.
  media: {},

  // Whole-app automation: the cue-list interpreter + wall-clock timer bank. `cursor`
  // and `running` are transport state — persisted for visibility but reset to stopped
  // on boot (a power-cycled installation shouldn't resume mid-cue-list on its own).
  automation: { cues: [], cursor: -1, running: false, timers: {} },

  // Modulation rack: each slot oscillates one numeric state path between min/max.
  lfos: {},

  // WebMIDI CC bindings (the panel browser owns the MIDI hardware; mappings live in
  // shared state so they survive reloads and can be edited from any panel).
  midiMap: {},

  // Shared, optionally-hot-swappable source slots (VPT8's 8-slot sourcebank.maxpat).
  // Layers default to a direct `source` (unchanged); pointing a layer's source at
  // { type: "slot", slotId } instead makes it track whichever content this slot holds,
  // live. A slot's content is either a media-library reference or a "mix" — two other
  // sources (each a media/camera ref, or a slot reference — but never another mix-
  // holding slot, enforced below) crossfaded by a chosen blend mode.
  sourceBank: Array.from({ length: 8 }, (_, i) => ({ id: `slot-${i + 1}`, name: `Slot ${i + 1}`, content: null })),
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
  fillMissing(layer, { fx: defaultFx(), warp: defaultWarp() });
}

export function ensureStateDefaults(state) {
  fillMissing(state, {
    automation: { cues: [], cursor: -1, running: false, timers: {} },
    lfos: {},
    midiMap: {},
    master: 1,
    media: {},
    sourceBank: Array.from({ length: 8 }, (_, i) => ({ id: `slot-${i + 1}`, name: `Slot ${i + 1}`, content: null })),
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

// A slot's content may be a "mix" of two other sources; a mix's own a/b refs may point
// at a media-holding slot but never at another mix-holding slot (directly, or through
// one level of slot indirection) — otherwise a self- or mutually-referencing mix would
// recurse without bound at render time. Enforced here, the sole write path for
// client-originated state changes; render-client/src/patch.js intentionally does NOT
// duplicate this guard (see docs/superpowers/plans/2026-07-08-parity-finish-line-plan.md
// Global Constraints — it only ever applies server-broadcast, already-validated state).
function slotContentType(state, slotId) {
  const slot = (state.sourceBank ?? []).find((s) => s.id === slotId);
  return slot?.content?.type ?? null;
}

function refIsMixSlot(state, ref) {
  if (ref?.type !== "slot") return false;
  return slotContentType(state, ref.slotId) === "mix";
}

// True if some OTHER slot's mix currently uses `slotId` as an input — i.e. turning
// `slotId` itself into a mix now would retroactively create a mix-of-mix through that
// other slot (the ordering hole described above).
function isUsedAsMixInputElsewhere(state, slotId) {
  return (state.sourceBank ?? []).some((s) => {
    if (s.id === slotId || s.content?.type !== "mix") return false;
    return (s.content.a?.type === "slot" && s.content.a.slotId === slotId) || (s.content.b?.type === "slot" && s.content.b.slotId === slotId);
  });
}

export function wouldCreateMixCycle(state, path, value) {
  // Path shape: "sourceBank.<index>.content" (whole-object replacement) or
  // "sourceBank.<index>.content.a"/".content.b" (granular sub-path write, only
  // reachable via applyUpdate's existing-leaf rule when that key is already present
  // on content — i.e. content is already type "mix").
  const wholeMatch = /^sourceBank\.(\d+)\.content$/.exec(path);
  const subMatch = /^sourceBank\.(\d+)\.content\.(a|b)$/.exec(path);
  if (!wholeMatch && !subMatch) return false;

  const index = Number((wholeMatch ?? subMatch)[1]);
  const thisSlot = state.sourceBank?.[index];
  if (!thisSlot) return false;

  let candidate;
  if (wholeMatch) {
    if (value?.type !== "mix") return false;
    candidate = value;
  } else {
    if (thisSlot.content?.type !== "mix") return false;
    const field = subMatch[2]; // "a" | "b"
    candidate = { ...thisSlot.content, [field]: value };
  }

  // Self-reference: always a cycle, regardless of this slot's current content type.
  if (candidate.a?.type === "slot" && candidate.a.slotId === thisSlot.id) return true;
  if (candidate.b?.type === "slot" && candidate.b.slotId === thisSlot.id) return true;
  // Direct: an input that's itself a mix-holding slot right now.
  if (refIsMixSlot(state, candidate.a) || refIsMixSlot(state, candidate.b)) return true;
  // Ordering hole: this slot is already someone else's mix input — becoming a mix now
  // would make that other slot a mix-of-mix without ever revalidating its own write.
  if (isUsedAsMixInputElsewhere(state, thisSlot.id)) return true;
  return false;
}

// Patches an EXISTING leaf ("layers.layer-1.opacity"). Never creates new keys —
// use applyCreate for that. Returns true if the path was valid and the value changed.
export function applyUpdate(state, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  if (isUnsafePath(keys) || UNSAFE_KEYS.has(last)) return false;
  if (wouldCreateMixCycle(state, path, value)) return false;
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

// Called after a media entry or a source-bank slot is deleted: clears any reference to
// it rather than leaving a dangling id. A slot referencing deleted media becomes empty
// (content: null). A mix slot whose a/b referenced a deleted media/slot passes the
// other input through at full weight rather than rendering black — matches how the
// design spec defines "missing input" behavior for a mix.
export function resolveDanglingSourceRefs(state, kind, id) {
  const refMatches = (ref) => (kind === "media" ? ref?.type === "media" && ref.mediaId === id : ref?.type === "slot" && ref.slotId === id);
  for (const slot of state.sourceBank ?? []) {
    if (!slot.content) continue;
    if (slot.content.type === "media" && kind === "media" && slot.content.mediaId === id) {
      slot.content = null;
    } else if (slot.content.type === "mix") {
      if (refMatches(slot.content.a)) slot.content = { ...slot.content, a: null };
      if (refMatches(slot.content.b)) slot.content = { ...slot.content, b: null };
    }
  }
}

export function nextLayerOrder(state) {
  const orders = Object.values(state.layers).map((l) => l.order ?? 0);
  return orders.length ? Math.max(...orders) + 1 : 1;
}
