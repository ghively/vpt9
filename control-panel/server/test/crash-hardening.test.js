import { test } from "node:test";
import assert from "node:assert/strict";
import { applyUpdate, resolveDanglingSourceRefs, nextLayerOrder } from "../src/state.js";
import { createAutomationEngine } from "../src/automation.js";

// These guard against a class of unauthenticated single-message crashes: applyUpdate
// used to validate only the path (existence + prototype-safety), never the value — so a
// LAN client could replace a structural container/entry with null or a scalar and later
// crash a tick or an HTTP handler that iterates it. See the audit's C1/C2/C3.

test("C1: applyUpdate refuses to replace a layer entry with null", () => {
  const state = { layers: { "layer-1": { id: "layer-1", sourceMode: "single" } } };
  assert.equal(applyUpdate(state, "layers.layer-1", null), false);
  assert.deepEqual(state.layers["layer-1"], { id: "layer-1", sourceMode: "single" });
});

test("C1: applyUpdate refuses to replace a layer entry with a scalar", () => {
  const state = { layers: { "layer-1": { id: "layer-1" } } };
  assert.equal(applyUpdate(state, "layers.layer-1", 7), false);
  assert.equal(typeof state.layers["layer-1"], "object");
});

test("C3: applyUpdate refuses to replace the layers container with a non-object", () => {
  const state = { layers: { "layer-1": {} } };
  assert.equal(applyUpdate(state, "layers", null), false);
  assert.equal(applyUpdate(state, "layers", 5), false);
  assert.ok(state.layers["layer-1"]);
});

test("C2: applyUpdate refuses to replace sourceBank with a non-array", () => {
  const state = { sourceBank: [{ id: "slot-1", content: null }] };
  assert.equal(applyUpdate(state, "sourceBank", 0), false);
  assert.equal(applyUpdate(state, "sourceBank", { nope: true }), false);
  assert.ok(Array.isArray(state.sourceBank));
});

test("C2: applyUpdate refuses to replace a sourceBank slot with null", () => {
  const state = { sourceBank: [{ id: "slot-1", content: null }] };
  assert.equal(applyUpdate(state, "sourceBank.0", null), false);
  assert.ok(state.sourceBank[0]);
});

test("other top-level collections are pinned to objects too", () => {
  const state = { screens: {}, pip: {}, presets: {}, media: {}, lfos: {}, midiMap: {}, automation: { cues: [] }, oscOut: {} };
  for (const key of ["screens", "pip", "presets", "media", "lfos", "midiMap", "automation", "oscOut"]) {
    assert.equal(applyUpdate(state, key, null), false, `${key} accepted null`);
    assert.equal(applyUpdate(state, key, 3), false, `${key} accepted a scalar`);
  }
});

test("A17: oscOut is pinned to an object but its leaves stay writable", () => {
  const state = { oscOut: { enabled: false, host: "127.0.0.1", port: 9001 } };
  assert.equal(applyUpdate(state, "oscOut", "x"), false); // structural guard
  assert.equal(applyUpdate(state, "oscOut.enabled", true), true);
  assert.equal(applyUpdate(state, "oscOut.host", "10.0.0.5"), true);
  assert.equal(applyUpdate(state, "oscOut.port", 7000), true);
  assert.deepEqual(state.oscOut, { enabled: true, host: "10.0.0.5", port: 7000 });
});

test("A19: tempoBpm rejects non-positive / non-numeric writes but accepts a valid tempo", () => {
  const state = { tempoBpm: 120 };
  for (const bad of [null, "fast", 0, -20, NaN]) {
    assert.equal(applyUpdate(state, "tempoBpm", bad), false, `accepted ${JSON.stringify(bad)}`);
  }
  assert.equal(state.tempoBpm, 120);
  assert.equal(applyUpdate(state, "tempoBpm", 140), true);
  assert.equal(state.tempoBpm, 140);
});

// The validation must NOT over-reach: leaf data (including legitimately-null loop points,
// or a source object swapped wholesale) stays writable.
test("applyUpdate still allows nulling a non-structural leaf (loop point)", () => {
  const state = { layers: { "layer-1": { transport: { loopIn: 2, loopOut: 5 } } } };
  assert.equal(applyUpdate(state, "layers.layer-1.transport.loopOut", null), true);
  assert.equal(state.layers["layer-1"].transport.loopOut, null);
});

test("applyUpdate still allows replacing a layer's source object wholesale", () => {
  const state = { layers: { "layer-1": { source: { type: "video", url: "/a.mp4" } } } };
  assert.equal(applyUpdate(state, "layers.layer-1.source", { type: "color", color: [0, 0, 0] }), true);
  assert.deepEqual(state.layers["layer-1"].source, { type: "color", color: [0, 0, 0] });
});

// Defense in depth: even a state.json hand-corrupted past applyUpdate must not throw in
// the paths that iterate these containers.
test("resolveDanglingSourceRefs tolerates a corrupt sourceBank", () => {
  for (const bad of [0, null, "x", [null], [undefined], [{ content: null }, null]]) {
    const state = { sourceBank: bad, media: {} };
    assert.doesNotThrow(() => resolveDanglingSourceRefs(state, "media", "m1"), `threw on ${JSON.stringify(bad)}`);
  }
});

test("nextLayerOrder tolerates a corrupt layers container", () => {
  assert.doesNotThrow(() => nextLayerOrder({ layers: null }));
  assert.equal(nextLayerOrder({ layers: null }), 1);
  assert.doesNotThrow(() => nextLayerOrder({ layers: { a: null, b: { order: 4 } } }));
});

test("the automation tick does not crash on a null layer element", async () => {
  const state = {
    layers: { "layer-1": null }, // e.g. loaded from a corrupt state.json
    presets: {},
    automation: { cues: [], cursor: -1, running: false, timers: {} },
    lfos: {},
    midiMap: {},
    sourceBank: [],
  };
  let crashed = null;
  const onUnhandled = (e) => { crashed = e; };
  process.on("uncaughtException", onUnhandled);
  const engine = createAutomationEngine({ state, broadcast: () => {}, scheduleSave: () => {}, recallPreset: () => true, log: () => {} });
  await new Promise((r) => setTimeout(r, 90));
  engine.dispose();
  process.off("uncaughtException", onUnhandled);
  assert.equal(crashed, null);
});
