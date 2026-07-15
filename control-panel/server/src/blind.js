// True blind editing (the grandMA-Blind / switcher preview-program workflow, extending
// task A20's wall-freeze): engaging blind snapshots what was live at that instant, so the
// operator can build the next look off-air and then either COMMIT it (plain `blind: false`
// update — the wall unfreezes onto the edited scene, snapshot dropped) or DISCARD it (the
// `blindDiscard` message — the pre-blind scene is restored wholesale and the wall unfreezes
// onto exactly what the audience was already seeing).
//
// Factored into its own factory (like createSourceBankPresets / createAutomationEngine) so
// the snapshot/restore rules are unit-testable without index.js's top-level listen().
//
// The snapshot covers the LOOK: layers, screens, pip and the shared source bank. It
// deliberately excludes `master` (blackout is an independent house control — discarding a
// blind session must not un-blackout the wall), automation/LFO/MIDI config (show wiring,
// not a look), and the media library (uploads that happened while blind should survive a
// discard — only their *use* in a layer is reverted).
const BLIND_FIELDS = ["layers", "screens", "pip", "sourceBank"];

export function createBlindSession({ state, broadcast, scheduleSave }) {
  let snapshot = null;

  return {
    // Call BEFORE applyUpdate lands a client/OSC write, so the pre-write value of
    // `state.blind` is still observable. Only the `blind` path is interesting:
    // false→true captures the snapshot; any write to false (a commit) drops it.
    noteUpdate(path, value) {
      if (path !== "blind") return;
      const next = !!value;
      if (next && !state.blind) {
        snapshot = {};
        for (const field of BLIND_FIELDS) snapshot[field] = structuredClone(state[field]);
      } else if (!next) {
        snapshot = null; // commit: whatever was built while blind is now the live scene
      }
    },

    // The `blindDiscard` message. Restores the pre-blind scene and unfreezes. Returns
    // false when there's nothing to discard (not blind, or the server restarted mid-
    // session and the in-memory snapshot is gone — in that case blind is still cleared,
    // as a plain leaf update, so the operator is never stuck frozen).
    discard() {
      if (!state.blind) return false;
      if (!snapshot) {
        state.blind = false;
        scheduleSave();
        broadcast({ type: "update", path: "blind", value: false });
        return false;
      }
      for (const field of BLIND_FIELDS) state[field] = structuredClone(snapshot[field]);
      snapshot = null;
      state.blind = false;
      scheduleSave();
      broadcast({ type: "state", state }); // whole-scene swap — same shape preset recall uses
      return true;
    },

    // Test/introspection hook: whether a pre-blind snapshot is currently held.
    hasSnapshot: () => snapshot !== null,
  };
}
