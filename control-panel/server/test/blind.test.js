import test from "node:test";
import assert from "node:assert/strict";
import { createBlindSession } from "../src/blind.js";

// Minimal live-scene state for snapshot/restore assertions. The blind session only
// touches layers/screens/pip/sourceBank + the `blind` flag itself.
function makeState() {
  return {
    blind: false,
    master: 1,
    layers: { "layer-1": { id: "layer-1", opacity: 1 } },
    screens: { "screen-1": { id: "screen-1", warp: { mode: "corner", corners: [{ x: 0, y: 0 }] } } },
    pip: {},
    sourceBank: [{ id: "slot-1", name: "A", content: null }],
    media: { "m-1": { id: "m-1", name: "keep-me" } },
  };
}

function makeHarness() {
  const state = makeState();
  const broadcasts = [];
  let saves = 0;
  const session = createBlindSession({
    state,
    broadcast: (msg) => broadcasts.push(msg),
    scheduleSave: () => saves++,
  });
  return { state, broadcasts, saves: () => saves, session };
}

test("engaging blind captures a snapshot; committing (blind=false) drops it", () => {
  const { state, session } = makeHarness();

  session.noteUpdate("blind", true);
  state.blind = true; // the caller's applyUpdate lands after noteUpdate
  assert.equal(session.hasSnapshot(), true);

  // Edits while blind…
  state.layers["layer-1"].opacity = 0.2;

  // …and a commit: plain blind=false update. Snapshot dropped, edits stay.
  session.noteUpdate("blind", false);
  state.blind = false;
  assert.equal(session.hasSnapshot(), false);
  assert.equal(state.layers["layer-1"].opacity, 0.2);
});

test("discard restores the pre-blind look, unfreezes, and broadcasts full state", () => {
  const { state, broadcasts, session } = makeHarness();

  session.noteUpdate("blind", true);
  state.blind = true;

  // Off-air edits across every snapshotted container:
  state.layers["layer-1"].opacity = 0.2;
  state.layers["layer-9"] = { id: "layer-9", opacity: 1 };
  state.screens["screen-1"].warp.corners[0].x = 0.5;
  state.sourceBank[0].content = { type: "media", mediaId: "m-1" };
  // …and to fields the snapshot must NOT touch:
  state.master = 0;
  state.media["m-2"] = { id: "m-2", name: "uploaded-while-blind" };

  assert.equal(session.discard(), true);

  assert.equal(state.blind, false);
  assert.equal(session.hasSnapshot(), false);
  assert.equal(state.layers["layer-1"].opacity, 1, "layer edit reverted");
  assert.equal(state.layers["layer-9"], undefined, "layer added while blind removed");
  assert.equal(state.screens["screen-1"].warp.corners[0].x, 0, "screen warp reverted");
  assert.equal(state.sourceBank[0].content, null, "source bank reverted");
  assert.equal(state.master, 0, "master (blackout) untouched by discard");
  assert.equal(state.media["m-2"].name, "uploaded-while-blind", "media library untouched");

  assert.equal(broadcasts.length, 1);
  assert.equal(broadcasts[0].type, "state", "discard broadcasts the whole restored state");
  assert.equal(broadcasts[0].state.blind, false);
});

test("discard while not blind is a no-op", () => {
  const { state, broadcasts, session } = makeHarness();
  assert.equal(session.discard(), false);
  assert.equal(broadcasts.length, 0);
  assert.equal(state.blind, false);
});

test("discard with no snapshot (server restarted mid-session) still unfreezes", () => {
  const { state, broadcasts, session } = makeHarness();
  state.blind = true; // loaded from disk blind, no in-memory snapshot
  state.layers["layer-1"].opacity = 0.3;

  assert.equal(session.discard(), false);
  assert.equal(state.blind, false, "never leaves the operator stuck frozen");
  assert.equal(state.layers["layer-1"].opacity, 0.3, "nothing to restore — edits stay");
  assert.deepEqual(broadcasts, [{ type: "update", path: "blind", value: false }]);
});

test("re-engaging blind after a commit snapshots the NEW live look", () => {
  const { state, session } = makeHarness();

  session.noteUpdate("blind", true);
  state.blind = true;
  state.layers["layer-1"].opacity = 0.5;
  session.noteUpdate("blind", false); // commit
  state.blind = false;

  session.noteUpdate("blind", true);
  state.blind = true;
  state.layers["layer-1"].opacity = 0.1;
  session.discard();
  assert.equal(state.layers["layer-1"].opacity, 0.5, "restores the committed look, not the original");
});

test("a redundant blind=true write while already blind does not re-snapshot", () => {
  const { state, session } = makeHarness();

  session.noteUpdate("blind", true);
  state.blind = true;
  state.layers["layer-1"].opacity = 0.2;

  session.noteUpdate("blind", true); // echo/duplicate engage — must keep the ORIGINAL snapshot
  state.layers["layer-1"].opacity = 0.05;

  session.discard();
  assert.equal(state.layers["layer-1"].opacity, 1, "snapshot is from the first engage");
});
