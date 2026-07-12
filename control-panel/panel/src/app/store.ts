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

export function applyUpdate(state: PanelState, path: string, value: unknown): boolean {
  const keys = path.split(".");
  const last = keys.pop()!;
  if (UNSAFE_KEYS.has(last)) return false;
  const node = walkToParent(state, keys);
  if (node == null || !Object.hasOwn(node, last)) return false;
  if (node[last] === value) return false;
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
  if (node == null || !Object.hasOwn(node, last)) return false;
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
