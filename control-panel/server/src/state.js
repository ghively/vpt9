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
    // Non-uniform zoom, an off-center pivot, and rotation — ported from VPT8's `p zoom`
    // stage (td.rota.jxs: zoom + xzoom/yzoom + xanchor/yanchor + rota). `zoom` above stays
    // the overall uniform multiplier (existing LFO/MIDI targets, presets, and state.json
    // all reference `fx.zoom` and must keep working); zoomX/zoomY are applied ON TOP of it
    // (effective per-axis scale = zoom * zoomX / zoom * zoomY), so old shows that never set
    // these new leaves render byte-identical to before.
    zoomX: 1,
    zoomY: 1,
    anchorX: 0.5,
    anchorY: 0.5,
    rotationDeg: 0,
    panX: 0,
    panY: 0,
    blur: 0,
    motionBlur: 0,
    // Directional-slide motion-blur variant (VPT8 parity, task A21b) alongside the
    // temporal-feedback "trail" above: "trail" (default) keeps existing behavior for
    // every show that never touches this; "slide" smears along motionBlurAngle instead.
    motionBlurMode: "trail",
    motionBlurAngle: 0,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    edgeBlend: { left: 0, right: 0, top: 0, bottom: 0, gamma: 2, invert: false },
    // Per-stage enable/bypass (task A7 — VPT8 parity: a `pattr on` per stage, decoupled
    // from its value). All default true so an untouched layer's chain behaves exactly as
    // before this field existed.
    enabled: { transform: true, color: true, edgeBlend: true },
  };
}

// Per-layer mask defaults — rect/ellipse cover VPT8's `layermask.maxpat` shape/inv
// vocabulary; `polygon` (task A4a) adds the free-form-vertex shape from
// `code/pointmask01.js`. `points` is only meaningful when shape === "polygon" (an
// empty array for rect/ellipse — populated by the on-canvas polygon editor, task
// A4b); `invert` mirrors `layermask.maxpat`'s `pattr inv` and applies to every shape.
// Both are included here (not left `undefined`) so a freshly-created layer's mask
// object already OWNS these keys — applyUpdate only ever patches an existing leaf,
// so a later "mask.points"/"mask.invert" WS update would silently no-op otherwise.
export function defaultMask() {
  // `source` is the optional luminance/video matte (VPT8 layermask.maxpat's `pattr source`
  // + cc.alphaglue.jxs's `lum2alpha`, task A5): when set to a {type,mediaId/slotId} ref the
  // mask alpha is driven by that source's luminance instead of the geometric shape. Owned
  // as an explicit `null` key (like points/invert) so a later "mask.source" WS update
  // patches an existing leaf — applyUpdate never creates keys, so an absent one would no-op.
  return { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08, points: [], invert: false, source: null };
}

export function defaultWarp() {
  return {
    mode: "corner",
    corners: structuredClone(IDENTITY_CORNERS),
    mesh: { size: 4, points: identityMeshPoints(4) },
  };
}

// Per-layer / per-slot transport: play/pause + rate/loop/pan/vol + scrub for the current
// source. Defaults are "stopped, neutral" — a freshly created or backfilled layer/slot
// never starts itself playing or looping on its own.
//
// `loopMode` (task A10, VPT8 parity): "off"/"once" play through and stop (no native
// loop); "loop"/"palindrome" native-loop. `seek` (task A11) is a scrub request: a 0..1
// fraction of the clip's duration the render-client seeks to once when it changes, then
// leaves in place (see render-client/src/transport.js for the "track last-applied"
// approach). null = no pending seek.
export function defaultTransport() {
  return { playing: false, rate: 1, loopIn: null, loopOut: null, loopMode: "off", pan: 0, vol: 1, seek: null };
}

// A source-bank slot's transport (task A9) auto-plays and loops by default, preserving the
// pre-A9 behavior where slot media always ran (it was a hardcoded `loop = true` + autoplay
// in source-bank.js). A slot feeds potentially many layers, so a live-by-default source is
// the useful default; the operator can still pause/change loop mode per slot.
export function defaultSlotTransport() {
  return { ...defaultTransport(), playing: true, loopMode: "loop" };
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
      mask: defaultMask(),
      fx: defaultFx(),
      warp: defaultWarp(),
      transport: defaultTransport(),
      sourceMode: "single",
      playlist: { items: [], cursor: -1 },
      downscale: 1,
    },
    "layer-2": {
      id: "layer-2",
      name: "Starfield",
      order: 2,
      source: { type: "color", color: [0.35, 0.16, 0.55] },
      opacity: 0.46,
      blendMode: "multiply",
      mask: defaultMask(),
      fx: defaultFx(),
      warp: defaultWarp(),
      transport: defaultTransport(),
      sourceMode: "single",
      playlist: { items: [], cursor: -1 },
      downscale: 1,
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

  // Modulation rack: each slot oscillates one numeric state path between min/max. A slot
  // may instead be a `mixer` (task A19) that blends two other oscillators' outputs.
  lfos: {},

  // Global tempo (BPM) for LFO tempo-sync (task A19): a slot with a `syncNote` division
  // ("1/4", "1/8", …) derives its rate from this instead of its manual rateHz.
  tempoBpm: 120,

  // OSC OUTPUT / state mirroring (task A17). When `enabled`, every scalar leaf change is
  // mirrored out as an OSC message to host:port (the send-side face of the OSC listener).
  // `enabled` gates only the continuous mirror; an `osc` cue always sends to this host:port.
  oscOut: { enabled: false, host: "127.0.0.1", port: 9001 },

  // WebMIDI CC bindings (the panel browser owns the MIDI hardware; mappings live in
  // shared state so they survive reloads and can be edited from any panel).
  midiMap: {},

  // Shared, optionally-hot-swappable source slots (VPT8's 8-slot sourcebank.maxpat).
  // Layers default to a direct `source` (unchanged); pointing a layer's source at
  // { type: "slot", slotId } instead makes it track whichever content this slot holds,
  // live. A slot's content is either a media-library reference or a "mix" — two other
  // sources (each a media/camera ref, or a slot reference — but never another mix-
  // holding slot, enforced below) crossfaded by a chosen blend mode. Each slot carries
  // its OWN `transport` (task A9) — because many layers can share one slot, its
  // play/rate/loop state lives on the slot, not the consuming layer.
  sourceBank: Array.from({ length: 8 }, (_, i) => ({ id: `slot-${i + 1}`, name: `Slot ${i + 1}`, content: null, transport: defaultSlotTransport() })),

  // Saved source-bank snapshots (task A12 — VPT8's `pattrstorage sources` bank with
  // `sourcenext`/`sourceprev`). Each entry is { id, name, slots } where `slots` is a
  // full structuredClone of the 8-slot `sourceBank` at save time. Recalling one replaces
  // the live `sourceBank` wholesale; next/prev step through them via the cursor below.
  // Kept separate from scene `presets` (which never captured sourceBank) so recalling a
  // look and recalling a set of sources stay independent operations.
  sourceBankPresets: {},
  // Index into Object.keys(sourceBankPresets) of the last-recalled snapshot (-1 = none),
  // so `sourcenext`/`sourceprev` wrap around the list from wherever recall last landed.
  sourceBankPresetCursor: -1,
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

// Modulation-rack fields added by task A19 (mixer kind + phase/invert/tempo-sync). Backfilled
// onto LFOs saved before A19 so the two-pass tick and the panel's mixer/sync controls have
// existing leaves to read/patch (applyUpdate only ever writes an EXISTING leaf).
export function defaultLfoFields() {
  return { kind: "osc", aId: null, bId: null, blend: "add", mix: 0.5, phase: 0, waveInvert: false, syncNote: null };
}

export function ensureLayerDefaults(layer) {
  fillMissing(layer, {
    mask: defaultMask(),
    fx: defaultFx(),
    warp: defaultWarp(),
    transport: defaultTransport(),
    sourceMode: "single",
    playlist: { items: [], cursor: -1 },
    // Per-source render downscale (task A15 — VPT8's `p adapt`): 1 = full res. Owned as an
    // explicit leaf (not left undefined) so the Inspector's downscale select can patch it —
    // applyUpdate only ever writes an existing leaf.
    downscale: 1,
  });
}

export function ensureStateDefaults(state) {
  fillMissing(state, {
    automation: { cues: [], cursor: -1, running: false, timers: {} },
    lfos: {},
    midiMap: {},
    master: 1,
    media: {},
    tempoBpm: 120,
    oscOut: { enabled: false, host: "127.0.0.1", port: 9001 },
    sourceBank: Array.from({ length: 8 }, (_, i) => ({ id: `slot-${i + 1}`, name: `Slot ${i + 1}`, content: null, transport: defaultSlotTransport() })),
    sourceBankPresets: {},
    sourceBankPresetCursor: -1,
  });
  // Backfill A19 mixer/phase/sync leaves onto LFOs saved before those fields existed.
  for (const lfo of Object.values(state.lfos ?? {})) {
    if (lfo && typeof lfo === "object" && !Array.isArray(lfo)) fillMissing(lfo, defaultLfoFields());
  }
  // Backfill per-slot transport (task A9) onto a sourceBank saved before it existed:
  // fillMissing never recurses into array elements, so each slot object is patched
  // explicitly (adds a whole `transport`, or backfills any missing leaf such as `seek`).
  if (Array.isArray(state.sourceBank)) {
    for (const slot of state.sourceBank) {
      if (slot && typeof slot === "object" && !Array.isArray(slot)) fillMissing(slot, { transport: defaultSlotTransport() });
    }
  }
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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Top-level containers whose *type* is load-bearing: create/reorder, the media &
// source-bank cleanup paths, and the 30 Hz automation tick all iterate these and
// dereference their elements. `applyUpdate` used to validate only the path (existence +
// prototype-safety), never the value — so a single LAN message could replace a container
// with null or a scalar (e.g. `layers` → null, `sourceBank` → 0) and later crash a tick
// or an HTTP handler that iterates it. With no per-tick error boundary that killed the
// whole control plane. These sets pin the shapes; leaf *data* (opacity, a null loop point,
// a source object swapped wholesale, …) stays unrestricted. See
// test/crash-hardening.test.js.
const OBJECT_TOPLEVEL = new Set(["layers", "screens", "pip", "presets", "media", "lfos", "midiMap", "automation", "sourceBankPresets", "oscOut"]);
// Keyed collections whose entries are always objects (never scalars) — so an entry write
// like "layers.<id>" or "pip.<id>" must carry an object, never null/a scalar. (lfos/timers
// are already null-guarded at their read sites, so they're intentionally not pinned here.)
// sourceBankPresets.<id> (task A12) is dereferenced by the recall path, so pin it too.
const KEYED_OBJECT_COLLECTIONS = new Set(["layers", "screens", "pip", "presets", "media", "sourceBankPresets"]);

// A mask's optional matte reference (task A5): either null (no matte) or a source ref
// { type: "media", mediaId } / { type: "slot", slotId }. The render-client dereferences
// this as a source ref, so a LAN client must not be able to wedge a scalar/array/garbage
// object into it — validate the shape here rather than leaving the leaf unrestricted.
function isValidMaskSource(value) {
  if (value === null) return true;
  if (!isPlainObject(value)) return false;
  if (value.type === "media") return typeof value.mediaId === "string";
  if (value.type === "slot") return typeof value.slotId === "string";
  return false;
}

// True when writing `value` at `[...keys].last` would corrupt a structural container's
// shape. `keys` are the parent segments, `last` the final segment.
function corruptsStructure(keys, last, value) {
  if (keys.length === 0) {
    if (OBJECT_TOPLEVEL.has(last)) return !isPlainObject(value);
    if (last === "sourceBank") return !Array.isArray(value);
    // Global LFO tempo (task A19): the two-pass LFO tick divides by it — a null/scalar/NaN
    // would NaN every tempo-synced slot. Pin it to a finite positive number.
    if (last === "tempoBpm") return !(typeof value === "number" && Number.isFinite(value) && value > 0);
    return false;
  }
  if (keys.length === 1) {
    if (KEYED_OBJECT_COLLECTIONS.has(keys[0])) return !isPlainObject(value); // e.g. layers.<id>
    if (keys[0] === "sourceBank") return !isPlainObject(value); // a slot object
  }
  // A source-bank slot's `transport` container (task A9): sourceBank.<n>.transport is a
  // structural object the render-client dereferences per frame — pin it to a plain object
  // so a LAN client can't null/scalar it out and crash the slot transport path. Keyed on
  // the immediate sourceBank-slot parent (keys = ["sourceBank", "<n>"]), so a layer's own
  // `transport` object stays freely swappable, same as before.
  if (last === "transport" && keys.length === 2 && keys[0] === "sourceBank") return !isPlainObject(value);
  // A source-bank preset's `slots` snapshot (task A12): sourceBankPresets.<id>.slots is an
  // array the recall path iterates — pin it to an array so a LAN client can't null/scalar
  // it and (only) desync the panel (recall itself already Array.isArray-guards it).
  if (last === "slots" && keys.length === 2 && keys[0] === "sourceBankPresets") return !Array.isArray(value);
  // "...mask.source" (last === "source" under a "mask" parent) is the matte ref — pinned
  // to null-or-source-ref. Keyed on the immediate parent, so a layer's OWN top-level
  // `source` (parent = the layer id, not "mask") stays unrestricted and freely swappable.
  if (last === "source" && keys[keys.length - 1] === "mask") return !isValidMaskSource(value);
  return false;
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

// A slot's content may be a "mix" of two other sources; a mix's own a/b refs must
// never themselves be — or resolve to, in one hop, or via an inline literal at any
// nesting depth — another mix. Not a general "no cycles in an arbitrary graph" check:
// simply "no mix may reference any mix," full stop, re-verified over the WHOLE
// sourceBank after every write that touches it.
//
// Five earlier rounds each patched one narrower shape of this (self-reference, direct
// mix-of-mix, one-level slot indirection, an ordering hole where the OTHER slot's
// write was never revalidated, a 4-step type-flip dance gated on pre-write state, and
// an inline-literal wrapper that hid a slot ref from the ordering check) and each fix
// left a structurally identical bypass one path/depth/step further out — because each
// attempt reasoned locally about "what could this one write have changed" instead of
// validating the actual resulting state. This replaces all of it — `wouldCreateMixCycle`
// no longer enumerates write shapes at all: it reuses `walkToParent` (the same
// write-simulation primitive `applyUpdate` itself uses, not a reimplementation of path-
// walking) to apply the candidate write exactly the way applyUpdate would, then
// re-validates every mix slot in the resulting array. No recursion or depth cap is
// needed: an inline-nested mix literal is caught by the very first `type === "mix"`
// check on that structure, regardless of how deep it's nested — the mere presence of a
// nested mix is already the violation, nothing further needs tracing. Enforced here,
// the sole write path for client-originated state changes; render-client/src/patch.js
// intentionally does NOT duplicate this guard (see
// docs/superpowers/plans/2026-07-08-parity-finish-line-plan.md Global Constraints — it
// only ever applies server-broadcast, already-validated state).
function refResolvesToMix(ref, candidateSourceBank) {
  if (!ref || typeof ref !== "object") return false;
  if (ref.type === "mix") return true;
  if (ref.type === "slot") {
    // `.some(...)`, not `.find(...)` + optional-chain on the first match: sourceBank is
    // otherwise a fixed-size array of unique-id slots, but nothing at this write layer
    // enforces that uniqueness (see the `path === "sourceBank"` whole-array-replacement
    // case below) — matching only the first same-id slot could let a real mix hide
    // behind an earlier same-id decoy. Matching on ANY same-id slot holding a mix keeps
    // the check correct even if id-uniqueness is ever violated upstream.
    return candidateSourceBank.some((s) => s?.id === ref.slotId && s?.content?.type === "mix");
  }
  return false;
}

export function wouldCreateMixCycle(state, path, value) {
  // Every write that can affect sourceBank content must be reconstructed and
  // re-validated — not just "sourceBank.<n>.content..." sub-paths. Nothing on the wire
  // protocol restricts `path` to a sub-path shape (see index.js's `update` WS handler
  // and OSC handler, which pass any client-supplied path straight through to
  // applyUpdate), so a whole-array replacement at path "sourceBank" itself must be
  // caught too, not just "sourceBank.".
  if (path !== "sourceBank" && !path.startsWith("sourceBank.")) return false;

  const candidateState = { sourceBank: structuredClone(state.sourceBank ?? []) };
  const keys = path.split(".");
  const last = keys.pop();
  const node = walkToParent(candidateState, keys);
  if (node == null || typeof node !== "object" || !Object.hasOwn(node, last)) return false;
  node[last] = value;

  // A whole-array replacement's value isn't necessarily even an array — a client can
  // send any JSON as `value`. A non-array candidate can't contain a mix-of-mix as this
  // invariant defines it, and iterating a non-iterable would throw. Whether sourceBank
  // stays shaped like a well-formed slot array at all is a different, broader
  // structural concern this check isn't chartered to enforce.
  if (!Array.isArray(candidateState.sourceBank)) return false;

  for (const slot of candidateState.sourceBank) {
    if (slot?.content?.type !== "mix") continue;
    if (refResolvesToMix(slot.content.a, candidateState.sourceBank) || refResolvesToMix(slot.content.b, candidateState.sourceBank)) {
      return true;
    }
  }
  return false;
}

// Patches an EXISTING leaf ("layers.layer-1.opacity"). Never creates new keys —
// use applyCreate for that. Returns true if the path was valid and the value changed.
export function applyUpdate(state, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  if (isUnsafePath(keys) || UNSAFE_KEYS.has(last)) return false;
  if (corruptsStructure(keys, last, value)) return false;
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
  // sourceBank is a fixed 8-slot array (see DEFAULT_STATE above) — slots are never
  // created or deleted individually, only their `content`/`name` fields are ever
  // legitimately updated via applyUpdate, addressed by index. applyCreate has no
  // legitimate use case anywhere under sourceBank, and — unlike applyUpdate — it has
  // no mix-cycle guard at all, so leaving it reachable here would let a client inject
  // an arbitrary key into an existing slot or its content object (overwriting `a`/`b`
  // with a self-reference, or replacing a slot's content with a ready-made mix-of-mix)
  // completely unvalidated. Block outright rather than adapting the cycle guard to a
  // second, differently-shaped write primitive — see
  // docs/superpowers/plans/2026-07-08-parity-finish-line-plan.md Task 7.
  if (containerPath === "sourceBank" || containerPath.startsWith("sourceBank.")) return null;
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
  // Tolerate a hand-corrupted state.json (sourceBank not an array, or holding null/sparse
  // slots) — applyUpdate blocks this at the write boundary, but disk state bypasses it.
  const bank = Array.isArray(state.sourceBank) ? state.sourceBank : [];
  for (const slot of bank) {
    if (!slot || !slot.content) continue;
    if (slot.content.type === "media" && kind === "media" && slot.content.mediaId === id) {
      slot.content = null;
    } else if (slot.content.type === "mix") {
      if (refMatches(slot.content.a)) slot.content = { ...slot.content, a: null };
      if (refMatches(slot.content.b)) slot.content = { ...slot.content, b: null };
    }
  }
}

export function nextLayerOrder(state) {
  const layers = isPlainObject(state.layers) ? Object.values(state.layers) : [];
  const orders = layers.filter((l) => l && typeof l === "object").map((l) => l.order ?? 0);
  return orders.length ? Math.max(...orders) + 1 : 1;
}
