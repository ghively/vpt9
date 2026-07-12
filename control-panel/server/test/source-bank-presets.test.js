import test from "node:test";
import assert from "node:assert/strict";
import { createSourceBankPresets } from "../src/source-bank-presets.js";
import { applyUpdate, applyCreate, ensureStateDefaults } from "../src/state.js";

// Task A12 — source-bank presets (VPT8's `pattrstorage sources` + sourcenext/prev). The
// save/recall/step logic is a pure factory (server/src/source-bank-presets.js), so these
// drive it with a fake broadcast/scheduleSave and assert on the mutated state + messages,
// no live server needed. Also verifies the state.js structural guards for the new
// `sourceBankPresets` container.

function slot(id, content = null) {
  return { id, name: id, content, transport: { playing: true, rate: 1, loopIn: null, loopOut: null, loopMode: "loop", pan: 0, vol: 1, seek: null } };
}

function fixture() {
  const state = {
    sourceBank: [slot("slot-1", { type: "media", mediaId: "media-1" }), slot("slot-2"), slot("slot-3")],
    sourceBankPresets: {},
    sourceBankPresetCursor: -1,
  };
  const broadcasts = [];
  const engine = createSourceBankPresets({
    state,
    broadcast: (m) => broadcasts.push(m),
    scheduleSave: () => {},
  });
  return { state, engine, broadcasts };
}

test("save snapshots a deep copy of the live sourceBank (later mutation doesn't leak into it)", () => {
  const { state, engine } = fixture();
  const key = engine.save({ id: "sbp-1", name: "Cams" });
  assert.equal(key, "sbp-1");
  assert.equal(state.sourceBankPresets["sbp-1"].name, "Cams");
  // Mutate the live bank AFTER saving — the snapshot must be untouched (structuredClone).
  state.sourceBank[0].content = { type: "camera", deviceId: "cam-x" };
  assert.deepEqual(state.sourceBankPresets["sbp-1"].slots[0].content, { type: "media", mediaId: "media-1" });
});

test("save broadcasts a create message with the stored preset", () => {
  const { engine, broadcasts } = fixture();
  engine.save({ id: "sbp-1", name: "Cams" });
  const msg = broadcasts.find((m) => m.type === "create");
  assert.ok(msg);
  assert.equal(msg.path, "sourceBankPresets");
  assert.equal(msg.key, "sbp-1");
  assert.equal(msg.value.name, "Cams");
});

test("save → mutate the live bank → recall restores the exact snapshot", () => {
  const { state, engine } = fixture();
  engine.save({ id: "sbp-1", name: "Original" });
  // Operator rearranges the bank live.
  applyUpdate(state, "sourceBank.0.content", { type: "color", color: [1, 0, 0] });
  applyUpdate(state, "sourceBank.1.content", { type: "media", mediaId: "media-9" });
  assert.notDeepEqual(state.sourceBank[0].content, { type: "media", mediaId: "media-1" });
  // Recall pulls the whole bank back.
  assert.equal(engine.recall("sbp-1"), true);
  assert.deepEqual(state.sourceBank[0].content, { type: "media", mediaId: "media-1" });
  assert.equal(state.sourceBank[1].content, null);
});

test("recall points the cursor at the recalled preset's index and broadcasts full state", () => {
  const { state, engine, broadcasts } = fixture();
  engine.save({ id: "sbp-1", name: "A" });
  engine.save({ id: "sbp-2", name: "B" });
  broadcasts.length = 0;
  assert.equal(engine.recall("sbp-2"), true);
  assert.equal(state.sourceBankPresetCursor, 1);
  assert.ok(broadcasts.some((m) => m.type === "state"));
});

test("recall of an unknown id returns false and broadcasts nothing", () => {
  const { engine, broadcasts } = fixture();
  broadcasts.length = 0;
  assert.equal(engine.recall("nope"), false);
  assert.equal(broadcasts.length, 0);
});

test("recall tolerates a snapshot whose slots isn't an array (returns false, no throw)", () => {
  const { state, engine } = fixture();
  state.sourceBankPresets["sbp-bad"] = { id: "sbp-bad", name: "Bad", slots: "not-an-array" };
  assert.doesNotThrow(() => assert.equal(engine.recall("sbp-bad"), false));
});

test("next/prev wrap around the snapshot list from the cursor", () => {
  const { state, engine } = fixture();
  engine.save({ id: "sbp-1", name: "A" });
  engine.save({ id: "sbp-2", name: "B" });
  engine.save({ id: "sbp-3", name: "C" });
  // Fresh cursor is -1 → next lands on index 0, then 1, 2, and wraps back to 0.
  assert.equal(engine.next(), true);
  assert.equal(state.sourceBankPresetCursor, 0);
  engine.next();
  assert.equal(state.sourceBankPresetCursor, 1);
  engine.next();
  assert.equal(state.sourceBankPresetCursor, 2);
  engine.next();
  assert.equal(state.sourceBankPresetCursor, 0); // wrapped
  // prev from 0 wraps to the last (2).
  engine.prev();
  assert.equal(state.sourceBankPresetCursor, 2);
});

test("next/prev with no presets is a no-op returning false", () => {
  const { engine } = fixture();
  assert.equal(engine.next(), false);
  assert.equal(engine.prev(), false);
});

test("recall then next steps from the recalled position, not from -1", () => {
  const { state, engine } = fixture();
  engine.save({ id: "sbp-1", name: "A" });
  engine.save({ id: "sbp-2", name: "B" });
  engine.save({ id: "sbp-3", name: "C" });
  engine.recall("sbp-2"); // cursor -> 1
  engine.next(); // -> 2
  assert.equal(state.sourceBankPresetCursor, 2);
});

// --- state.js structural guards for the new container -------------------------------

test("applyUpdate refuses to replace sourceBankPresets with a non-object", () => {
  const state = ensureStateDefaults({});
  assert.equal(applyUpdate(state, "sourceBankPresets", 0), false);
  assert.equal(applyUpdate(state, "sourceBankPresets", "x"), false);
  assert.ok(state.sourceBankPresets && typeof state.sourceBankPresets === "object");
});

test("applyUpdate refuses a scalar sourceBankPresets entry but allows an object", () => {
  const state = ensureStateDefaults({});
  state.sourceBankPresets["sbp-1"] = { id: "sbp-1", name: "A", slots: [] };
  assert.equal(applyUpdate(state, "sourceBankPresets.sbp-1", 5), false);
  assert.equal(applyUpdate(state, "sourceBankPresets.sbp-1", { id: "sbp-1", name: "B", slots: [] }), true);
});

test("applyUpdate refuses a non-array slots on a source-bank preset but allows an array", () => {
  const state = ensureStateDefaults({});
  state.sourceBankPresets["sbp-1"] = { id: "sbp-1", name: "A", slots: [] };
  assert.equal(applyUpdate(state, "sourceBankPresets.sbp-1.slots", "nope"), false);
  assert.equal(applyUpdate(state, "sourceBankPresets.sbp-1.slots", { not: "array" }), false);
  assert.deepEqual(state.sourceBankPresets["sbp-1"].slots, []); // both rejected — unchanged
  assert.equal(applyUpdate(state, "sourceBankPresets.sbp-1.slots", [{ id: "slot-1", content: null }]), true);
});

test("applyCreate seeds a new preset entry (the save path), keyed by value.id", () => {
  const state = ensureStateDefaults({});
  const key = applyCreate(state, "sourceBankPresets", { id: "sbp-1", name: "A", slots: [] });
  assert.equal(key, "sbp-1");
  assert.deepEqual(state.sourceBankPresets["sbp-1"], { id: "sbp-1", name: "A", slots: [] });
});

test("ensureStateDefaults backfills sourceBankPresets + cursor onto older state", () => {
  const state = ensureStateDefaults({ layers: {}, sourceBank: [] });
  assert.deepEqual(state.sourceBankPresets, {});
  assert.equal(state.sourceBankPresetCursor, -1);
});
