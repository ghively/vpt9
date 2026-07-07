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
