import { applyCreate } from "./state.js";

// Source-bank presets (task A12 — VPT8's `pattrstorage sources` bank with
// `sourcenext`/`sourceprev`). Factored into its own factory (like createAutomationEngine /
// createMediaRouter) so the save/recall/step logic is unit-testable without index.js's
// top-level listen(): tests pass a fake broadcast/scheduleSave and assert on the mutated
// state + emitted messages.
//
// A snapshot is { id, name, slots } where `slots` is a structuredClone of the live 8-slot
// `sourceBank` (content + per-slot transport). Recalling replaces the live bank wholesale
// and points `sourceBankPresetCursor` at the recalled snapshot so a following next/prev
// steps from there; next/prev wrap around the snapshot list. Kept independent of scene
// `presets` (which never captured sourceBank) so recalling a look and recalling a set of
// sources stay orthogonal.
export function createSourceBankPresets({ state, broadcast, scheduleSave }) {
  function save({ id, name } = {}) {
    const preset = {
      id: id || `sbp-${Date.now()}`,
      name: name || "Sources",
      slots: structuredClone(state.sourceBank),
    };
    const key = applyCreate(state, "sourceBankPresets", preset);
    if (key == null) return null;
    scheduleSave();
    broadcast({ type: "create", path: "sourceBankPresets", key, value: preset });
    return key;
  }

  // Returns false when the id is unknown or its snapshot isn't a well-formed slot array
  // (a hand-corrupted disk state) so callers can warn.
  function recall(presetId) {
    const preset = state.sourceBankPresets?.[presetId];
    if (!preset || !Array.isArray(preset.slots)) return false;
    state.sourceBank = structuredClone(preset.slots);
    state.sourceBankPresetCursor = Object.keys(state.sourceBankPresets).indexOf(presetId);
    scheduleSave();
    broadcast({ type: "state", state }); // whole-array swap — simpler than diffing 8 slots
    return true;
  }

  // sourcenext/sourceprev: wrap around the snapshot list from the current cursor.
  function step(dir) {
    const ids = Object.keys(state.sourceBankPresets ?? {});
    if (!ids.length) return false;
    const cur = Number.isInteger(state.sourceBankPresetCursor) ? state.sourceBankPresetCursor : -1;
    const nextIndex = (((cur + dir) % ids.length) + ids.length) % ids.length;
    return recall(ids[nextIndex]);
  }

  return {
    save,
    recall,
    next: () => step(1),
    prev: () => step(-1),
  };
}
