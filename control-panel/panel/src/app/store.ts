import type { Layer, Screen, Pip, Preset } from "../components/types";

/** The panel's mirror of the control-plane state (server/src/state.js). Held in a mutable
 *  ref and patched in place — exactly like the vanilla panel — with React re-renders
 *  driven explicitly by the container, so the ~250ms preview stream never forces one. */
export interface PanelState {
  layers: Record<string, Layer>;
  screens: Record<string, Screen>;
  pip: Record<string, Pip>;
  presets: Record<string, Preset>;
  audioOwnerScreenId: string | null;
}

export function emptyState(): PanelState {
  return { layers: {}, screens: {}, pip: {}, presets: {}, audioOwnerScreenId: null };
}

// Dotted-path patch helpers — a direct port of patch.js / server/src/state.js.
function walkToParent(state: unknown, keys: string[]): Record<string, unknown> | null {
  let node: unknown = state;
  for (const key of keys) {
    if (node == null) return null;
    node = (node as Record<string, unknown>)[key];
  }
  return (node as Record<string, unknown>) ?? null;
}

export function applyUpdate(state: PanelState, path: string, value: unknown): boolean {
  const keys = path.split(".");
  const last = keys.pop()!;
  const node = walkToParent(state, keys);
  if (node == null) return false;
  node[last] = value;
  return true;
}

export function applyCreate(state: PanelState, containerPath: string, key: string, value: unknown): boolean {
  const node = walkToParent(state, containerPath.split("."));
  if (node == null || typeof node !== "object") return false;
  node[key] = value;
  return true;
}

export function applyDelete(state: PanelState, path: string): boolean {
  const keys = path.split(".");
  const last = keys.pop()!;
  const node = walkToParent(state, keys);
  if (node == null) return false;
  delete node[last];
  return true;
}
