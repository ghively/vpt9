import type { Layer, Screen, Pip, Preset, Automation, Lfo, MidiMapping } from "../components/types";

/** The panel's mirror of the control-plane state (server/src/state.js). Held in a mutable
 *  ref and patched in place — exactly like the vanilla panel — with React re-renders
 *  driven explicitly by the container, so the ~250ms preview stream never forces one. */
export interface PanelState {
  layers: Record<string, Layer>;
  screens: Record<string, Screen>;
  pip: Record<string, Pip>;
  presets: Record<string, Preset>;
  audioOwnerScreenId: string | null;
  automation: Automation;
  lfos: Record<string, Lfo>;
  midiMap: Record<string, MidiMapping>;
}

export function emptyState(): PanelState {
  return {
    layers: {},
    screens: {},
    pip: {},
    presets: {},
    audioOwnerScreenId: null,
    automation: { cues: [], cursor: -1, running: false, timers: {} },
    lfos: {},
    midiMap: {},
  };
}

// Dotted-path patch helpers — a direct port of patch.js / server/src/state.js, with the
// same hardening: no prototype-chain traversal, no crash when a path dots through a
// primitive leaf.
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

export function applyUpdate(state: PanelState, path: string, value: unknown): boolean {
  const keys = path.split(".");
  const last = keys.pop()!;
  if (UNSAFE_KEYS.has(last)) return false;
  const node = walkToParent(state, keys);
  if (node == null) return false;
  node[last] = value;
  return true;
}

export function applyCreate(state: PanelState, containerPath: string, key: string, value: unknown): boolean {
  if (typeof key !== "string" || UNSAFE_KEYS.has(key)) return false;
  const node = walkToParent(state, containerPath.split("."));
  if (node == null) return false;
  node[key] = value;
  return true;
}

export function applyDelete(state: PanelState, path: string): boolean {
  const keys = path.split(".");
  const last = keys.pop()!;
  if (UNSAFE_KEYS.has(last)) return false;
  const node = walkToParent(state, keys);
  if (node == null) return false;
  delete node[last];
  return true;
}

/** Batch of updates (server fade/LFO engine ticks): apply all, report if any landed. */
export function applyBatch(state: PanelState, updates: Array<{ path: string; value: unknown }>): boolean {
  let changed = false;
  for (const { path, value } of updates ?? []) {
    if (typeof path === "string" && applyUpdate(state, path, value)) changed = true;
  }
  return changed;
}
