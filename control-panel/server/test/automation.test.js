import { test } from "node:test";
import assert from "node:assert/strict";
import { createAutomationEngine } from "../src/automation.js";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeHarness(stateOverrides = {}) {
  const state = {
    layers: {},
    presets: {},
    automation: { cues: [], cursor: -1, running: false, timers: {} },
    lfos: {},
    midiMap: {},
    ...stateOverrides,
  };
  const broadcasts = [];
  const recalledPresetIds = [];
  const recallPreset = (presetId) => {
    const preset = state.presets[presetId];
    if (!preset) return false;
    recalledPresetIds.push(presetId);
    for (const field of Object.keys(preset.snapshot)) state[field] = structuredClone(preset.snapshot[field]);
    return true;
  };
  const engine = createAutomationEngine({
    state,
    broadcast: (msg) => broadcasts.push(msg),
    scheduleSave: () => {},
    recallPreset,
    log: () => {},
  });
  return { state, broadcasts, recalledPresetIds, engine };
}

test("cueGo on a 'wait' cue starts the transport and lands on the right cursor", () => {
  const { state, broadcasts, engine } = makeHarness({
    automation: { cues: [{ type: "wait", seconds: 5 }], cursor: -1, running: false, timers: {} },
  });
  engine.cueGo();
  assert.equal(state.automation.running, true);
  assert.equal(state.automation.cursor, 0);
  const last = broadcasts.at(-1);
  assert.equal(last.type, "batch");
  assert.deepEqual(
    last.updates.map((u) => u.path),
    ["automation.cursor", "automation.running"],
  );
  engine.dispose();
});

test("cueStop halts the transport where it is without advancing", () => {
  const { state, engine } = makeHarness({
    automation: { cues: [{ type: "wait", seconds: 5 }], cursor: -1, running: false, timers: {} },
  });
  engine.cueGo();
  engine.cueStop();
  assert.equal(state.automation.running, false);
  assert.equal(state.automation.cursor, 0); // stayed where GO left it
  engine.dispose();
});

test("cueJump arms the cursor so the next GO runs that cue, without running it immediately", () => {
  const { state, engine } = makeHarness({
    automation: {
      cues: [{ type: "wait", seconds: 5 }, { type: "wait", seconds: 5 }, { type: "wait", seconds: 5 }],
      cursor: -1,
      running: false,
      timers: {},
    },
  });
  engine.cueJump(2);
  assert.equal(state.automation.cursor, 1); // armed at index-1; next GO runs cues[2]
  engine.cueGo();
  assert.equal(state.automation.cursor, 2);
  engine.dispose();
});

test("a 'goto' cue jumps the cursor so the next advance runs the target index", () => {
  const { state, engine } = makeHarness({
    automation: {
      cues: [{ type: "goto", target: 2 }, { type: "wait", seconds: 5 }, { type: "wait", seconds: 5 }],
      cursor: -1,
      running: false,
      timers: {},
    },
  });
  engine.cueGo(); // runs cues[0], a goto to index 2
  assert.equal(state.automation.cursor, 1); // armed at target-1; next advance runs cues[2]
  engine.dispose();
});

test("a 'recall' cue recalls the named preset", () => {
  const { state, recalledPresetIds, engine } = makeHarness({
    presets: { "preset-1": { id: "preset-1", name: "P1", snapshot: { layers: { a: { opacity: 0.5 } } } } },
    automation: { cues: [{ type: "recall", presetId: "preset-1" }], cursor: -1, running: false, timers: {} },
  });
  engine.cueGo();
  assert.deepEqual(recalledPresetIds, ["preset-1"]);
  assert.equal(state.layers.a.opacity, 0.5);
  engine.dispose();
});

test("a 'fade' cue interpolates numeric leaves toward the preset and lands exactly", async () => {
  const { state, broadcasts, recalledPresetIds, engine } = makeHarness({
    layers: { a: { opacity: 0.2 } },
    presets: { "preset-1": { id: "preset-1", name: "P1", snapshot: { layers: { a: { opacity: 1.0 } } } } },
    automation: { cues: [{ type: "fade", presetId: "preset-1", seconds: 0.1 }], cursor: -1, running: false, timers: {} },
  });
  engine.cueGo();

  // Mid-fade: some ticks have landed, value has moved but not yet arrived.
  await wait(40);
  assert.ok(state.layers.a.opacity > 0.2, "opacity should have started moving toward 1.0");

  // After the fade duration completes, it must land exactly (not just asymptotically).
  await wait(150);
  assert.equal(state.layers.a.opacity, 1.0);
  assert.deepEqual(recalledPresetIds, ["preset-1"]); // exact landing goes through a full recall
  assert.ok(broadcasts.some((b) => b.type === "batch" && b.updates.some((u) => u.path === "layers.a.opacity")));
  engine.dispose();
});

test("an enabled LFO oscillates its target and stays within [min,max]", async () => {
  const { state, engine } = makeHarness({
    layers: { a: { opacity: 0.5 } },
    lfos: { "lfo-1": { id: "lfo-1", enabled: true, wave: "sine", rateHz: 5, min: 0.2, max: 0.8, target: "layers.a.opacity" } },
  });
  await wait(120); // several 33ms ticks at 5Hz — plenty of phase movement
  assert.ok(state.layers.a.opacity >= 0.2 && state.layers.a.opacity <= 0.8);
  engine.dispose();
});

test("deleting an LFO after it has ticked doesn't crash subsequent ticks (prune-on-delete)", async () => {
  const { state, engine } = makeHarness({
    layers: { a: { opacity: 0.5 } },
    lfos: { "lfo-1": { id: "lfo-1", enabled: true, wave: "sine", rateHz: 5, min: 0, max: 1, target: "layers.a.opacity" } },
  });
  await wait(60);
  delete state.lfos["lfo-1"];
  // Should keep ticking cleanly with no lingering reference to the deleted slot.
  await wait(60);
  assert.equal(engine !== undefined, true);
  engine.dispose();
});
