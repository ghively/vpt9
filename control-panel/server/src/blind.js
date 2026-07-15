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
// The snapshot covers the LOOK: layers, screens, pip, the shared source bank, plus
// `audioOwnerScreenId` and `sourceBankPresetCursor` — a preset recall fired while blind
// (look-bar chips work off-air) writes those two, so a discard must put them back or the
// audience's audio ownership / the OSC sources-next cursor would keep the previewed
// values. It deliberately excludes `master` (blackout is an independent house control —
// discarding a blind session must not un-blackout the wall), automation/LFO/MIDI config
// (show wiring, not a look), and the media library (uploads that happened while blind
// should survive a discard — only their *use* in a layer is reverted).
const BLIND_FIELDS = ["layers", "screens", "pip", "sourceBank", "audioOwnerScreenId", "sourceBankPresetCursor"];

export function createBlindSession({ state, broadcast, scheduleSave }) {
  let snapshot = null;

  return {
    // Call BEFORE applyUpdate lands a client/OSC write, so the pre-write value of
    // `state.blind` is still observable. Only the `blind` path is interesting:
    // false→true captures the snapshot; a write to false (a commit) drops it.
    // Non-boolean values are ignored to mirror applyUpdate's `blind` boolean pin
    // (state.js corruptsStructure): acting on a write the state layer then REJECTS
    // desynced the snapshot from reality — e.g. an OSC `/blind 0` from an int-sending
    // controller destroyed the snapshot while the wall stayed frozen, so DISCARD
    // could no longer restore the pre-blind look. (index.js normalizes numeric OSC
    // blind values to booleans before calling this, so those still work.)
    noteUpdate(path, value) {
      if (path !== "blind" || typeof value !== "boolean") return;
      const next = value;
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
