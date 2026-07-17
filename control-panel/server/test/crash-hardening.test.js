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

// A layer's fixed-shape structural containers. ensureLayerDefaults normalizes an explicit
// null back to defaults at create/load, but applyUpdate had no equivalent guard — so a
// post-creation `{path:"layers.<id>.fx", value:null}` re-introduced a null the panel then
// dereferenced (mask.feather.toFixed → crash) and every later `layers.<id>.fx.*` update
// silently no-op'd against. Now pinned to a plain object; valid object replacement stays OK.
test("layer fx/warp/mask/transport/playlist containers reject null/scalar/array but allow objects", () => {
  const layer = {
    id: "layer-1",
    mask: { enabled: false, feather: 0 },
    fx: { zoom: 1 },
    warp: { mode: "corner" },
    transport: { playing: false },
    playlist: { items: [], cursor: -1 },
  };
  const state = { layers: { "layer-1": layer } };
  for (const key of ["mask", "fx", "warp", "transport", "playlist"]) {
    assert.equal(applyUpdate(state, `layers.layer-1.${key}`, null), false, `${key} accepted null`);
    assert.equal(applyUpdate(state, `layers.layer-1.${key}`, 3), false, `${key} accepted a scalar`);
    assert.equal(applyUpdate(state, `layers.layer-1.${key}`, []), false, `${key} accepted an array`);
  }
  // The containers are untouched by the rejected writes...
  assert.deepEqual(state.layers["layer-1"].fx, { zoom: 1 });
  // ...and sub-leaf writes + whole-object replacement (setPlaylist's shape) still work.
  assert.equal(applyUpdate(state, "layers.layer-1.fx.zoom", 2), true);
  assert.equal(applyUpdate(state, "layers.layer-1.playlist", { items: [{ ref: null }], cursor: 0 }), true);
});

// A PARTIAL object passes the isPlainObject pin (isPlainObject({}) === true) but would
// leave nested leaves the panel/render-client dereference unconditionally
// (fx.edgeBlend.invert, mask.feather.toFixed, warp.corners.map) undefined → a white-screen
// crash on every connected panel. applyUpdate backfills a partial whole-object write from
// the defaults so the stored (and re-broadcast) object always has the full shape.
test("partial fx/mask/warp whole-object writes are backfilled to the full shape (no undefined nested leaves)", () => {
  const layer = {
    id: "layer-1",
    mask: { enabled: false, feather: 0 },
    fx: { zoom: 1 },
    warp: { mode: "corner", corners: [] },
    transport: { playing: false },
    playlist: { items: [], cursor: -1 },
  };
  const state = { layers: { "layer-1": layer } };

  // An empty fx object is accepted but completed: the leaves the panel derefs must exist.
  assert.equal(applyUpdate(state, "layers.layer-1.fx", {}), true);
  const fx = state.layers["layer-1"].fx;
  assert.equal(typeof fx.edgeBlend, "object");
  assert.equal(typeof fx.edgeBlend.invert, "boolean"); // FxDrawer reads `!!fx.edgeBlend.invert`
  assert.equal(typeof fx.zoom, "number");

  // A partial mask keeps the caller's value AND gains the missing leaves.
  assert.equal(applyUpdate(state, "layers.layer-1.mask", { enabled: true }), true);
  const mask = state.layers["layer-1"].mask;
  assert.equal(mask.enabled, true);
  assert.equal(typeof mask.feather, "number"); // Inspector reads `mask.feather.toFixed(2)`

  // A partial warp gains a corners array so StageSelectionOverlay's `points.map` never
  // dereferences undefined.
  assert.equal(applyUpdate(state, "layers.layer-1.warp", { mode: "mesh" }), true);
  const warp = state.layers["layer-1"].warp;
  assert.equal(warp.mode, "mesh");
  assert.ok(Array.isArray(warp.corners));
  assert.equal(typeof warp.mesh, "object");
});

// House master dim: the one leaf that scales every screen's final output. The render
// client's setMaster guards non-numbers but NOT NaN (typeof NaN === "number"), so a NaN/
// Infinity master (reachable via an OSC float arg) blacks the whole wall and persists as
// JSON null. Pinned to a finite number at the sole enforcement point.
test("master is pinned to a finite number (NaN/Infinity/wrong-type rejected)", () => {
  const state = { master: 1 };
  assert.equal(applyUpdate(state, "master", NaN), false);
  assert.equal(applyUpdate(state, "master", Infinity), false);
  assert.equal(applyUpdate(state, "master", "1"), false);
  assert.equal(applyUpdate(state, "master", null), false);
  assert.equal(state.master, 1);
  assert.equal(applyUpdate(state, "master", 0.5), true);
  assert.equal(state.master, 0.5);
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

// Media tags (media.<id>.tags): the panel's tag-filter chips iterate + string-compare
// these, so the leaf is pinned to an array of strings.
test("applyUpdate accepts a string array for media tags and refuses everything else", () => {
  const state = { media: { "media-1": { id: "media-1", name: "clip.mp4", tags: [] } } };
  assert.equal(applyUpdate(state, "media.media-1.tags", ["intro", "loop"]), true);
  assert.deepEqual(state.media["media-1"].tags, ["intro", "loop"]);
  assert.equal(applyUpdate(state, "media.media-1.tags", "intro"), false);
  assert.equal(applyUpdate(state, "media.media-1.tags", null), false);
  assert.equal(applyUpdate(state, "media.media-1.tags", [1, "x"]), false);
  assert.equal(applyUpdate(state, "media.media-1.tags", { intro: true }), false);
  assert.deepEqual(state.media["media-1"].tags, ["intro", "loop"]);
});
