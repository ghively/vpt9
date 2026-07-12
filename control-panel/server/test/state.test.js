import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyUpdate,
  applyCreate,
  applyDelete,
  walkToParent,
  nextLayerOrder,
  ensureLayerDefaults,
  ensureStateDefaults,
  defaultFx,
  defaultWarp,
  defaultTransport,
  defaultMask,
  loadState,
  saveState,
} from "../src/state.js";

function sampleState() {
  return {
    layers: {
      "layer-1": { id: "layer-1", order: 1, opacity: 0.5, fx: defaultFx() },
      "layer-2": { id: "layer-2", order: 3, opacity: 0.8, fx: defaultFx() },
    },
    pip: {},
    automation: { cues: [], cursor: -1, running: false, timers: {} },
    lfos: {},
    midiMap: {},
  };
}

test("applyUpdate patches an existing leaf and reports change", () => {
  const state = sampleState();
  assert.equal(applyUpdate(state, "layers.layer-1.opacity", 0.9), true);
  assert.equal(state.layers["layer-1"].opacity, 0.9);
});

test("applyUpdate is a no-op (returns false) when the value is unchanged", () => {
  const state = sampleState();
  assert.equal(applyUpdate(state, "layers.layer-1.opacity", 0.5), false);
});

test("applyUpdate returns false for a path that doesn't exist", () => {
  const state = sampleState();
  assert.equal(applyUpdate(state, "layers.layer-99.opacity", 1), false);
  assert.equal(applyUpdate(state, "layers.layer-1.nonexistentField", 1), false);
});

test("applyUpdate returns false for a path that dots through a primitive leaf", () => {
  const state = sampleState();
  assert.equal(applyUpdate(state, "layers.layer-1.opacity.x", 1), false);
});

test("applyUpdate refuses __proto__/constructor/prototype segments anywhere in the path", () => {
  const state = sampleState();
  assert.equal(applyUpdate(state, "layers.__proto__.polluted", "yes"), false);
  assert.equal(applyUpdate(state, "layers.layer-1.constructor.prototype.polluted", "yes"), false);
  assert.equal(applyUpdate(state, "__proto__", "yes"), false);
  assert.equal({}.polluted, undefined, "Object.prototype must not be polluted");
});

test("applyCreate adds a new entry keyed by value.id and returns the key", () => {
  const state = sampleState();
  const key = applyCreate(state, "layers", { id: "layer-3", order: 4 });
  assert.equal(key, "layer-3");
  assert.deepEqual(state.layers["layer-3"], { id: "layer-3", order: 4 });
});

test("applyCreate returns null for an unresolvable container path or a value with no id", () => {
  const state = sampleState();
  assert.equal(applyCreate(state, "nope.nested", { id: "x" }), null);
  assert.equal(applyCreate(state, "layers", {}), null);
  assert.equal(applyCreate(state, "layers", { id: 42 }), null);
});

test("applyCreate refuses unsafe container paths and unsafe ids", () => {
  const state = sampleState();
  assert.equal(applyCreate(state, "__proto__", { id: "x" }), null);
  assert.equal(applyCreate(state, "layers", { id: "__proto__" }), null);
});

test("applyDelete removes an existing entry and returns true; false if missing", () => {
  const state = sampleState();
  assert.equal(applyDelete(state, "layers.layer-1"), true);
  assert.equal("layer-1" in state.layers, false);
  assert.equal(applyDelete(state, "layers.layer-1"), false);
});

test("walkToParent resolves nested containers and rejects primitive-leaf traversal", () => {
  const state = sampleState();
  assert.equal(walkToParent(state, ["layers", "layer-1"]), state.layers["layer-1"]);
  assert.equal(walkToParent(state, ["layers", "layer-1", "opacity", "x"]), null);
  assert.equal(walkToParent(state, ["layers", "layer-99"]), null);
});

test("nextLayerOrder returns max+1, or 1 for an empty layer set", () => {
  assert.equal(nextLayerOrder(sampleState()), 4);
  assert.equal(nextLayerOrder({ layers: {} }), 1);
});

test("ensureLayerDefaults backfills fx on a layer missing it entirely", () => {
  const layer = { id: "layer-1", opacity: 1 };
  ensureLayerDefaults(layer);
  assert.deepEqual(layer.fx, defaultFx());
});

test("defaultWarp returns an identity corner-pin warp", () => {
  const warp = defaultWarp();
  assert.equal(warp.mode, "corner");
  assert.deepEqual(warp.corners, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]);
  assert.equal(warp.mesh.size, 4);
  assert.equal(warp.mesh.points.length, 16);
});

test("ensureLayerDefaults backfills warp on a layer missing it entirely", () => {
  const layer = { id: "layer-1", order: 1, opacity: 0.5, fx: defaultFx() };
  ensureLayerDefaults(layer);
  assert.ok(layer.warp);
  assert.equal(layer.warp.mode, "corner");
});

test("ensureLayerDefaults does not clobber an existing warp", () => {
  const layer = { id: "layer-1", order: 1, fx: defaultFx(), warp: { mode: "mesh", corners: [], mesh: { size: 3, points: [] } } };
  ensureLayerDefaults(layer);
  assert.equal(layer.warp.mode, "mesh");
  assert.equal(layer.warp.mesh.size, 3);
});

test("ensureStateDefaults backfills automation/lfos/midiMap and forces automation.running false", () => {
  const state = { layers: {}, presets: {}, automation: { running: true } };
  ensureStateDefaults(state);
  assert.equal(state.automation.running, false);
  assert.deepEqual(state.lfos, {});
  assert.deepEqual(state.midiMap, {});
  assert.equal(Array.isArray(state.automation.cues), true);
});

test("saveState writes atomically (temp file renamed into place, no partial file left)", () => {
  const dir = mkdtempSync(join(tmpdir(), "vpt-state-test-"));
  const filePath = join(dir, "state.json");
  try {
    saveState(filePath, { hello: "world" });
    assert.deepEqual(JSON.parse(readFileSync(filePath, "utf8")), { hello: "world" });
    // No leftover temp file after a successful save.
    const leftovers = readdirSync(dir).filter((f) => f.includes(".tmp-"));
    assert.deepEqual(leftovers, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadState round-trips a saved file", () => {
  const dir = mkdtempSync(join(tmpdir(), "vpt-state-test-"));
  const filePath = join(dir, "state.json");
  try {
    saveState(filePath, { layers: {}, presets: {}, automation: { running: true } });
    const loaded = loadState(filePath);
    assert.equal(loaded.automation.running, false); // ensureStateDefaults resets transport
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadState preserves a corrupt file as a .corrupt-<timestamp> backup instead of discarding it silently", () => {
  const dir = mkdtempSync(join(tmpdir(), "vpt-state-test-"));
  const filePath = join(dir, "state.json");
  try {
    writeFileSync(filePath, "{ not valid json");
    const loaded = loadState(filePath);
    // Falls back to defaults...
    assert.equal("layer-1" in loaded.layers, true);
    // ...but the corrupt original is preserved alongside it, not lost.
    const backups = readdirSync(dir).filter((f) => f.startsWith("state.json.corrupt-"));
    assert.equal(backups.length, 1, "expected exactly one corrupt-file backup");
    assert.equal(readFileSync(join(dir, backups[0]), "utf8"), "{ not valid json");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("DEFAULT_STATE (via loadState fallback) includes an empty media container", () => {
  const dir = mkdtempSync(join(tmpdir(), "vpt-state-test-"));
  try {
    const loaded = loadState(join(dir, "state.json")); // no file -> defaults
    assert.deepEqual(loaded.media, {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ensureStateDefaults backfills media as {} on an older state without it", () => {
  const state = { layers: {}, presets: {}, automation: { running: false } };
  ensureStateDefaults(state);
  assert.deepEqual(state.media, {});
});

test("DEFAULT_STATE has 8 empty source-bank slots", () => {
  const state = structuredClone(loadState("/nonexistent/path/for/test.json"));
  assert.equal(state.sourceBank.length, 8);
  assert.equal(state.sourceBank[0].id, "slot-1");
  assert.equal(state.sourceBank[0].content, null);
});

test("ensureStateDefaults backfills sourceBank as 8 empty slots on an older state without it", () => {
  const state = { layers: {}, presets: {} };
  ensureStateDefaults(state);
  assert.equal(state.sourceBank.length, 8);
});

test("defaultTransport returns a paused, forward, un-looped, centered transport with a null scrub seek", () => {
  const t = defaultTransport();
  assert.equal(t.playing, false);
  assert.equal(t.rate, 1);
  assert.equal(t.loopIn, null);
  assert.equal(t.loopOut, null);
  assert.equal(t.loopMode, "off");
  assert.equal(t.pan, 0);
  assert.equal(t.vol, 1);
  assert.equal(t.seek, null); // task A11: no pending scrub
});

test("applyUpdate accepts loopMode 'once' on a layer transport (task A10)", () => {
  const state = sampleState();
  ensureLayerDefaults(state.layers["layer-1"]);
  assert.equal(applyUpdate(state, "layers.layer-1.transport.loopMode", "once"), true);
  assert.equal(state.layers["layer-1"].transport.loopMode, "once");
});

test("applyUpdate accepts a scrub seek fraction on a layer transport, and clearing it to null (task A11)", () => {
  const state = sampleState();
  ensureLayerDefaults(state.layers["layer-1"]);
  assert.equal(applyUpdate(state, "layers.layer-1.transport.seek", 0.42), true);
  assert.equal(state.layers["layer-1"].transport.seek, 0.42);
  assert.equal(applyUpdate(state, "layers.layer-1.transport.seek", null), true);
  assert.equal(state.layers["layer-1"].transport.seek, null);
});

test("DEFAULT_STATE source-bank slots each carry their own defaultTransport (task A9)", () => {
  const state = structuredClone(loadState("/nonexistent/path/for/test-a9.json"));
  assert.equal(state.sourceBank.length, 8);
  for (const slot of state.sourceBank) {
    assert.deepEqual(slot.transport, defaultTransport());
  }
});

test("ensureStateDefaults backfills a per-slot transport onto a sourceBank saved before task A9", () => {
  const state = { layers: {}, presets: {}, sourceBank: [{ id: "slot-1", name: "Slot 1", content: null }] };
  ensureStateDefaults(state);
  assert.deepEqual(state.sourceBank[0].transport, defaultTransport());
});

test("ensureStateDefaults backfills a missing seek leaf onto a slot transport saved before task A11, without touching existing fields", () => {
  const state = {
    layers: {}, presets: {},
    sourceBank: [{ id: "slot-1", name: "Slot 1", content: null, transport: { playing: true, rate: 2, loopIn: null, loopOut: null, loopMode: "loop", pan: 0, vol: 1 } }],
  };
  ensureStateDefaults(state);
  assert.equal(state.sourceBank[0].transport.seek, null); // backfilled
  assert.equal(state.sourceBank[0].transport.playing, true); // pre-existing, untouched
  assert.equal(state.sourceBank[0].transport.rate, 2);
  assert.equal(state.sourceBank[0].transport.loopMode, "loop");
});

test("applyUpdate writes per-slot transport fields addressed by index (task A9)", () => {
  const state = structuredClone(loadState("/nonexistent/path/for/test-a9-write.json"));
  assert.equal(applyUpdate(state, "sourceBank.0.transport.playing", true), true);
  assert.equal(applyUpdate(state, "sourceBank.0.transport.loopMode", "palindrome"), true);
  assert.equal(applyUpdate(state, "sourceBank.0.transport.seek", 0.75), true);
  assert.equal(state.sourceBank[0].transport.playing, true);
  assert.equal(state.sourceBank[0].transport.loopMode, "palindrome");
  assert.equal(state.sourceBank[0].transport.seek, 0.75);
});

test("applyUpdate refuses to null/scalar a sourceBank slot's transport container, but still allows its leaves (crash-hardening, task A9)", () => {
  const state = structuredClone(loadState("/nonexistent/path/for/test-a9-guard.json"));
  assert.equal(applyUpdate(state, "sourceBank.0.transport", null), false);
  assert.equal(applyUpdate(state, "sourceBank.0.transport", 7), false);
  assert.equal(applyUpdate(state, "sourceBank.0.transport", []), false);
  assert.ok(state.sourceBank[0].transport && typeof state.sourceBank[0].transport === "object");
  // A structural swap to a well-formed object is allowed, and a leaf write is unaffected.
  assert.equal(applyUpdate(state, "sourceBank.0.transport.rate", 0.5), true);
  assert.equal(state.sourceBank[0].transport.rate, 0.5);
});

test("ensureLayerDefaults backfills transport, sourceMode, and playlist on an older layer", () => {
  const layer = { id: "layer-1", order: 1, fx: defaultFx(), warp: defaultWarp() };
  ensureLayerDefaults(layer);
  assert.ok(layer.transport);
  assert.equal(layer.sourceMode, "single");
  assert.deepEqual(layer.playlist, { items: [], cursor: -1 });
});

test("defaultFx includes rotation, anchor, and non-uniform zoom, all at their neutral/off values", () => {
  const fx = defaultFx();
  assert.equal(fx.rotationDeg, 0);
  assert.equal(fx.anchorX, 0.5);
  assert.equal(fx.anchorY, 0.5);
  assert.equal(fx.zoomX, 1);
  assert.equal(fx.zoomY, 1);
  // The pre-existing overall zoom field must be untouched — old LFO/MIDI targets and
  // presets that reference "fx.zoom" must keep working unchanged.
  assert.equal(fx.zoom, 1);
});

test("ensureLayerDefaults backfills rotation/anchor/non-uniform-zoom onto an fx object saved before this feature existed", () => {
  const layer = {
    id: "layer-1",
    order: 1,
    warp: defaultWarp(),
    fx: {
      flipH: false, flipV: false, tileX: 1, tileY: 1, zoom: 1.5, panX: 0, panY: 0,
      blur: 0, motionBlur: 0, brightness: 1, contrast: 1, saturation: 1,
      edgeBlend: { left: 0, right: 0, top: 0, bottom: 0, gamma: 2 },
    },
  };
  ensureLayerDefaults(layer);
  assert.equal(layer.fx.rotationDeg, 0);
  assert.equal(layer.fx.anchorX, 0.5);
  assert.equal(layer.fx.anchorY, 0.5);
  assert.equal(layer.fx.zoomX, 1);
  assert.equal(layer.fx.zoomY, 1);
  // The old value on the pre-existing field must survive the backfill untouched.
  assert.equal(layer.fx.zoom, 1.5);
});

test("ensureLayerDefaults backfills fx.enabled, edgeBlend.invert, and motionBlurMode/Angle onto an fx object saved before those features existed (A6/A7/A21b)", () => {
  const layer = {
    id: "layer-1",
    order: 1,
    warp: defaultWarp(),
    fx: {
      flipH: false, flipV: false, tileX: 1, tileY: 1, zoom: 1.5, zoomX: 1, zoomY: 1,
      anchorX: 0.5, anchorY: 0.5, rotationDeg: 0, panX: 0, panY: 0,
      blur: 0, motionBlur: 0.4, brightness: 1, contrast: 1, saturation: 1,
      edgeBlend: { left: 0, right: 0, top: 0, bottom: 0, gamma: 2 },
    },
  };
  ensureLayerDefaults(layer);
  assert.deepEqual(layer.fx.enabled, { transform: true, color: true, edgeBlend: true });
  assert.equal(layer.fx.edgeBlend.invert, false);
  assert.equal(layer.fx.motionBlurMode, "trail");
  assert.equal(layer.fx.motionBlurAngle, 0);
  // Old values on pre-existing fields must survive the backfill untouched.
  assert.equal(layer.fx.zoom, 1.5);
  assert.equal(layer.fx.motionBlur, 0.4);
});

test("defaultMask is a rect/ellipse-shaped mask with empty points and invert off", () => {
  const mask = defaultMask();
  assert.equal(mask.shape, "ellipse");
  assert.deepEqual(mask.points, []);
  assert.equal(mask.invert, false);
});

test("ensureLayerDefaults backfills mask on a layer missing it entirely", () => {
  const layer = { id: "layer-1", order: 1, fx: defaultFx(), warp: defaultWarp() };
  ensureLayerDefaults(layer);
  assert.deepEqual(layer.mask, defaultMask());
});

test("ensureLayerDefaults backfills points/invert onto a mask saved before polygon-mask support existed, without touching its existing fields", () => {
  const layer = {
    id: "layer-1", order: 1, fx: defaultFx(), warp: defaultWarp(),
    mask: { enabled: true, shape: "rect", cx: 0.5, cy: 0.5, rx: 0.3, ry: 0.3, feather: 0.1 },
  };
  ensureLayerDefaults(layer);
  assert.deepEqual(layer.mask.points, []);
  assert.equal(layer.mask.invert, false);
  // Pre-existing fields must survive the backfill untouched.
  assert.equal(layer.mask.enabled, true);
  assert.equal(layer.mask.shape, "rect");
  assert.equal(layer.mask.cx, 0.5);
  assert.equal(layer.mask.rx, 0.3);
  assert.equal(layer.mask.feather, 0.1);
});

test("applyUpdate accepts a polygon mask.shape and mask.points on a freshly created layer", () => {
  const state = sampleState();
  ensureLayerDefaults(state.layers["layer-1"]);
  const points = [{ x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 }, { x: 0.5, y: 0.7 }];
  assert.equal(applyUpdate(state, "layers.layer-1.mask.shape", "polygon"), true);
  assert.equal(applyUpdate(state, "layers.layer-1.mask.points", points), true);
  assert.equal(applyUpdate(state, "layers.layer-1.mask.invert", true), true);
  assert.equal(state.layers["layer-1"].mask.shape, "polygon");
  assert.deepEqual(state.layers["layer-1"].mask.points, points);
  assert.equal(state.layers["layer-1"].mask.invert, true);
});

test("defaultMask owns a null matte source (so applyUpdate can later patch it)", () => {
  const mask = defaultMask();
  // Present (owns the key) but null = no matte. Included like points/invert so a
  // "mask.source" WS update patches an existing leaf instead of silently no-op'ing.
  assert.ok("source" in mask);
  assert.equal(mask.source, null);
});

test("ensureLayerDefaults backfills mask.source=null onto a mask saved before matte support, without touching existing fields", () => {
  const layer = {
    id: "layer-1", order: 1, fx: defaultFx(), warp: defaultWarp(),
    mask: { enabled: true, shape: "rect", cx: 0.5, cy: 0.5, rx: 0.3, ry: 0.3, feather: 0.1, points: [], invert: false },
  };
  ensureLayerDefaults(layer);
  assert.equal(layer.mask.source, null);
  assert.equal(layer.mask.enabled, true);
  assert.equal(layer.mask.shape, "rect");
});

test("ensureLayerDefaults does not clobber an existing mask.source matte reference", () => {
  const layer = {
    id: "layer-1", order: 1, fx: defaultFx(), warp: defaultWarp(),
    mask: { ...defaultMask(), source: { type: "media", mediaId: "m1" } },
  };
  ensureLayerDefaults(layer);
  assert.deepEqual(layer.mask.source, { type: "media", mediaId: "m1" });
});

test("applyUpdate accepts a valid media/slot mask.source matte ref and clearing it back to null", () => {
  const state = sampleState();
  ensureLayerDefaults(state.layers["layer-1"]);
  assert.equal(applyUpdate(state, "layers.layer-1.mask.source", { type: "media", mediaId: "m1" }), true);
  assert.deepEqual(state.layers["layer-1"].mask.source, { type: "media", mediaId: "m1" });
  assert.equal(applyUpdate(state, "layers.layer-1.mask.source", { type: "slot", slotId: "slot-2" }), true);
  assert.deepEqual(state.layers["layer-1"].mask.source, { type: "slot", slotId: "slot-2" });
  assert.equal(applyUpdate(state, "layers.layer-1.mask.source", null), true);
  assert.equal(state.layers["layer-1"].mask.source, null);
});

test("applyUpdate rejects garbage at mask.source (crash-hardening: it's dereferenced as a source ref)", () => {
  const state = sampleState();
  ensureLayerDefaults(state.layers["layer-1"]);
  // Scalars, arrays, unknown types, and refs missing their id are all refused; the
  // pre-existing null leaf survives untouched.
  for (const bad of [7, "media", [], { type: "bogus" }, { type: "media" }, { type: "slot" }, { mediaId: "m1" }]) {
    assert.equal(applyUpdate(state, "layers.layer-1.mask.source", bad), false, `accepted ${JSON.stringify(bad)}`);
  }
  assert.equal(state.layers["layer-1"].mask.source, null);
});

test("applyUpdate does NOT restrict a layer's own top-level source (only mask.source is validated)", () => {
  // Guard against the mask.source validator over-reaching onto layer.source, which must
  // stay freely swappable (see crash-hardening.test.js).
  const state = sampleState();
  state.layers["layer-1"].source = { type: "video", url: "/a.mp4" };
  assert.equal(applyUpdate(state, "layers.layer-1.source", { type: "color", color: [0, 0, 0] }), true);
  assert.deepEqual(state.layers["layer-1"].source, { type: "color", color: [0, 0, 0] });
});
