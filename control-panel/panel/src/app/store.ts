import type { Layer, Screen, Pip, Preset, Automation, Lfo, MidiMapping, MediaItem, SourceBankSlot, SourceBankPreset, OscOut } from "../components/types";

/** The panel's mirror of the control-plane state (server/src/state.js). Held in a mutable
 *  ref and patched in place — exactly like the vanilla panel — with React re-renders
 *  driven explicitly by the container, so the ~250ms preview stream never forces one. */
export interface PanelState {
  layers: Record<string, Layer>;
  screens: Record<string, Screen>;
  pip: Record<string, Pip>;
  presets: Record<string, Preset>;
  audioOwnerScreenId: string | null;
  /** Master output dim (0 = blackout, 1 = full); mirrored by every render client. */
  master: number;
  /** Blind / preview mode (task A20): when true the projector output freezes on its last
   *  frame while compositing + the confidence-monitor preview keep running live. Like
   *  `master`, never captured by preset snapshots. */
  blind: boolean;
  automation: Automation;
  lfos: Record<string, Lfo>;
  /** Global tempo (BPM) for LFO tempo-sync (A19). */
  tempoBpm: number;
  /** OSC output / state-mirroring config (A17). */
  oscOut: OscOut;
  midiMap: Record<string, MidiMapping>;
  /** Uploaded media library (server/src/media.js), keyed by id. */
  media: Record<string, MediaItem>;
  /** Fixed-length source-bank slots (server/src/state.js), addressed positionally —
   *  same shape/positional convention as Lane A's `sourceBank` state. Declared here so
   *  the panel typechecks standalone; Lane C only reads/writes this by dotted path and
   *  never imports server code, per the parity-finish-line plan's lane-independence note. */
  sourceBank: SourceBankSlot[];
  /** Saved source-bank snapshots (task A12), keyed by id, plus the recall cursor that
   *  `sourceBankPresetNext`/`Prev` step through. */
  sourceBankPresets: Record<string, SourceBankPreset>;
  sourceBankPresetCursor: number;
}

export function emptyState(): PanelState {
  return {
    layers: {},
    screens: {},
    pip: {},
    presets: {},
    audioOwnerScreenId: null,
    master: 1,
    blind: false,
    automation: { cues: [], cursor: -1, running: false, timers: {} },
    lfos: {},
    tempoBpm: 120,
    oscOut: { enabled: false, host: "127.0.0.1", port: 9001 },
    midiMap: {},
    media: {},
    sourceBank: [],
    sourceBankPresets: {},
    sourceBankPresetCursor: -1,
  };
}

// Dotted-path patch helpers — a direct port of patch.js / server/src/state.js, with the
// same hardening: no prototype-chain traversal, no crash when a path dots through a
// primitive leaf, applyUpdate only patches an EXISTING leaf (no-op if unchanged),
// applyDelete only reports true if the key existed. Kept in parity with
// server/src/state.js and render-client/src/patch.js by
// server/test/state-patch-parity.test.js — mirror any change to one there too.
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function walkToParent(state: unknown, keys: string[]): Record<string, unknown> | null {
  let node: unknown = state;
  for (const key of keys) {
    if (UNSAFE_KEYS.has(key)) return null;
    if (node == null || typeof node !== "object" || !Object.hasOwn(node, key)) return null;
    node = (node as Record<string, unknown>)[key];
  }
  if (node == null || typeof node !== "object") return null;
  return node as Record<string, unknown>;
}

// Copy-on-write walk: shallow-clone every container from the root down to (and returning)
// the leaf's parent, rewiring each parent to point at its clone. The root object keeps its
// identity (we only reassign its keys), but every ANCESTOR of the mutated leaf gets a NEW
// identity. That is what makes React + useMemo work: `Object.values(state.media)` only
// changes reference when `media` actually changed, so memoized children skip reconcile on
// unrelated updates instead of the whole tree re-rendering (perf 2026-07-16). Callers must
// first confirm via walkToParent that the path exists / the value differs, so an unchanged
// write clones nothing and preserves the no-op semantics memoization depends on.
function cowParent(state: PanelState, keys: string[]): Record<string, unknown> | null {
  let parent = state as unknown as Record<string, unknown>;
  for (const key of keys) {
    if (UNSAFE_KEYS.has(key)) return null;
    const child = parent[key];
    if (child == null || typeof child !== "object" || !Object.hasOwn(parent, key)) return null;
    const cloned = Array.isArray(child) ? child.slice() : { ...(child as Record<string, unknown>) };
    parent[key] = cloned;
    parent = cloned as Record<string, unknown>;
  }
  return parent;
}

export function applyUpdate(state: PanelState, path: string, value: unknown): boolean {
  const keys = path.split(".");
  const last = keys.pop()!;
  if (UNSAFE_KEYS.has(last)) return false;
  const read = walkToParent(state, keys); // read-only existence/no-op check before any clone
  if (read == null || !Object.hasOwn(read, last)) return false;
  if (read[last] === value) return false;
  const parent = cowParent(state, keys)!;
  parent[last] = value;
  return true;
}

export function applyCreate(state: PanelState, containerPath: string, key: string, value: unknown): boolean {
  if (typeof key !== "string" || UNSAFE_KEYS.has(key)) return false;
  const keys = containerPath.split(".");
  if (walkToParent(state, keys) == null) return false;
  const parent = cowParent(state, keys)!;
  parent[key] = value;
  return true;
}

export function applyDelete(state: PanelState, path: string): boolean {
  const keys = path.split(".");
  const last = keys.pop()!;
  if (UNSAFE_KEYS.has(last)) return false;
  const read = walkToParent(state, keys);
  if (read == null || !Object.hasOwn(read, last)) return false;
  const parent = cowParent(state, keys)!;
  delete parent[last];
  return true;
}

/** Read-only dotted-path lookup (undo/redo history capture in App.tsx's `send` wrapper
 *  needs the value at a path BEFORE applyUpdate overwrites it). Same prototype-pollution
 *  guard as the write paths above; returns undefined for anything missing rather than
 *  throwing, since a path can legitimately point at a leaf that doesn't exist yet. */
export function readAtPath(state: unknown, path: string): unknown {
  let node: unknown = state;
  for (const key of path.split(".")) {
    if (UNSAFE_KEYS.has(key)) return undefined;
    if (node == null || typeof node !== "object" || !Object.hasOwn(node, key)) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

/** Batch of updates (server fade/LFO engine ticks): apply all, report if any landed. */
export function applyBatch(state: PanelState, updates: Array<{ path: string; value: unknown }>): boolean {
  let changed = false;
  for (const { path, value } of updates ?? []) {
    if (typeof path === "string" && applyUpdate(state, path, value)) changed = true;
  }
  return changed;
}
