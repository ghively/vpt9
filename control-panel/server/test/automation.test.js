import { test } from "node:test";
import assert from "node:assert/strict";
import { createAutomationEngine, syncNoteToRate } from "../src/automation.js";

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

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
  const recalledSourceIds = [];
  const sentOsc = [];
  const recallPreset = (presetId) => {
    const preset = state.presets[presetId];
    if (!preset) return false;
    recalledPresetIds.push(presetId);
    for (const field of Object.keys(preset.snapshot)) state[field] = structuredClone(preset.snapshot[field]);
    return true;
  };
  const recallSourceBankPreset = (presetId) => {
    if (!state.sourceBankPresets?.[presetId]) return false;
    recalledSourceIds.push(presetId);
    return true;
  };
  const sendOsc = (address, args) => {
    sentOsc.push({ address, args });
    return true;
  };
  const engine = createAutomationEngine({
    state,
    broadcast: (msg) => broadcasts.push(msg),
    scheduleSave: () => {},
    recallPreset,
    recallSourceBankPreset,
    sendOsc,
    log: () => {},
  });
  return { state, broadcasts, recalledPresetIds, recalledSourceIds, sentOsc, engine };
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

test("a still-image playlist item advances after its configured duration", async () => {
  const { state, engine } = makeHarness({
    layers: {
      "layer-1": {
        sourceMode: "playlist",
        playlist: {
          items: [
            { ref: { type: "media", mediaId: "a" }, duration: 0.1 },
            { ref: { type: "media", mediaId: "b" }, duration: 0.1 },
          ],
          cursor: 0,
        },
      },
    },
  });
  await wait(180);
  assert.equal(state.layers["layer-1"].playlist.cursor, 1);
  engine.dispose();
});

test("a video playlist item does NOT advance on wall-clock time alone (no duration set)", async () => {
  const { state, engine } = makeHarness({
    layers: {
      "layer-1": {
        sourceMode: "playlist",
        playlist: { items: [{ ref: { type: "media", mediaId: "a" } }, { ref: { type: "media", mediaId: "b" } }], cursor: 0 },
      },
    },
  });
  await wait(180);
  assert.equal(state.layers["layer-1"].playlist.cursor, 0); // unchanged — no duration means "play through to end", which only clipEnded() advances
  engine.dispose();
});

test("clipEnded() advances a video playlist item and wraps at the end", () => {
  const { state, engine } = makeHarness({
    layers: {
      "layer-1": {
        sourceMode: "playlist",
        playlist: { items: [{ ref: { type: "media", mediaId: "a" } }, { ref: { type: "media", mediaId: "b" } }], cursor: 1 },
      },
    },
  });
  engine.clipEnded("layer-1");
  assert.equal(state.layers["layer-1"].playlist.cursor, 0); // wraps
  engine.dispose();
});

test("clipEnded() on a layer not in playlist mode is a no-op", () => {
  const { state, engine } = makeHarness({ layers: { "layer-1": { sourceMode: "single", playlist: { items: [], cursor: -1 } } } });
  engine.clipEnded("layer-1"); // must not throw
  assert.equal(state.layers["layer-1"].playlist.cursor, -1);
  engine.dispose();
});

// ── A18: cue autoContinue (manual-GO checkpoints) ────────────────────────────────────

test("A18: a cue flagged autoContinue chains to the next cue on its own", async () => {
  const { state, recalledPresetIds, engine } = makeHarness({
    presets: {
      p1: { id: "p1", name: "P1", snapshot: { layers: { a: { opacity: 0.1 } } } },
      p2: { id: "p2", name: "P2", snapshot: { layers: { a: { opacity: 0.9 } } } },
    },
    automation: {
      cues: [{ type: "recall", presetId: "p1", autoContinue: true }, { type: "recall", presetId: "p2" }],
      cursor: -1,
      running: false,
      timers: {},
    },
  });
  engine.cueGo(); // runs cue 0 (autoContinue) → a tick then chains to cue 1
  await wait(120);
  assert.deepEqual(recalledPresetIds, ["p1", "p2"]);
  assert.equal(state.automation.cursor, 1); // then holds at cue 1 (no autoContinue)
  engine.dispose();
});

test("A18: a cue without autoContinue holds until an explicit GO", async () => {
  const { state, recalledPresetIds, engine } = makeHarness({
    presets: {
      p1: { id: "p1", name: "P1", snapshot: { layers: { a: { opacity: 0.1 } } } },
      p2: { id: "p2", name: "P2", snapshot: { layers: { a: { opacity: 0.9 } } } },
    },
    automation: {
      cues: [{ type: "recall", presetId: "p1" }, { type: "recall", presetId: "p2" }],
      cursor: -1,
      running: false,
      timers: {},
    },
  });
  engine.cueGo();
  await wait(120);
  assert.deepEqual(recalledPresetIds, ["p1"], "held at cue 0 — did not auto-advance");
  assert.equal(state.automation.cursor, 0);
  engine.cueGo(); // the operator's manual GO advances
  assert.deepEqual(recalledPresetIds, ["p1", "p2"]);
  assert.equal(state.automation.cursor, 1);
  engine.dispose();
});

// ── A16: `source` (source-bank preset recall) + `paramFade` (one-path tween) cues ──────

test("A16: a 'source' cue recalls the named source-bank preset", () => {
  const { recalledSourceIds, engine } = makeHarness({
    sourceBankPresets: { "sbp-1": { id: "sbp-1", name: "look", slots: [] } },
    automation: { cues: [{ type: "source", presetId: "sbp-1" }], cursor: -1, running: false, timers: {} },
  });
  engine.cueGo();
  assert.deepEqual(recalledSourceIds, ["sbp-1"]);
  engine.dispose();
});

test("A16: a 'paramFade' cue tweens ONE path and lands exactly on `to`", async () => {
  const { state, broadcasts, engine } = makeHarness({
    layers: { a: { opacity: 0.2 } },
    automation: {
      cues: [{ type: "paramFade", path: "layers.a.opacity", from: 0.2, to: 1.0, seconds: 0.1 }],
      cursor: -1,
      running: false,
      timers: {},
    },
  });
  engine.cueGo();
  await wait(40);
  assert.ok(state.layers.a.opacity > 0.2 && state.layers.a.opacity < 1.0, "mid-tween");
  await wait(150);
  assert.equal(state.layers.a.opacity, 1.0); // snapped exactly on completion
  assert.ok(broadcasts.some((b) => b.type === "batch" && b.updates.some((u) => u.path === "layers.a.opacity")));
  engine.dispose();
});

test("A16: GO during a paramFade snaps it to `to` before advancing", () => {
  const { state, engine } = makeHarness({
    layers: { a: { opacity: 0 } },
    automation: {
      cues: [{ type: "paramFade", path: "layers.a.opacity", from: 0, to: 1, seconds: 100 }],
      cursor: -1,
      running: false,
      timers: {},
    },
  });
  engine.cueGo(); // starts a very slow tween
  engine.cueGo(); // GO again — should snap opacity to 1 (its `to`) rather than leave it mid-tween
  assert.equal(state.layers.a.opacity, 1);
  engine.dispose();
});

// ── A17: `osc` cue (raw OSC send) ─────────────────────────────────────────────────────

test("A17: an 'osc' cue emits the raw OSC message via sendOsc", () => {
  const { sentOsc, engine } = makeHarness({
    automation: { cues: [{ type: "osc", address: "/go/lights", args: [1, "cue"] }], cursor: -1, running: false, timers: {} },
  });
  engine.cueGo();
  assert.deepEqual(sentOsc, [{ address: "/go/lights", args: [1, "cue"] }]);
  engine.dispose();
});

test("A17: an 'osc' cue with a bad address does not send", () => {
  const { sentOsc, engine } = makeHarness({
    automation: { cues: [{ type: "osc", address: "no-slash", args: [] }], cursor: -1, running: false, timers: {} },
  });
  engine.cueGo();
  assert.deepEqual(sentOsc, []);
  engine.dispose();
});

// ── A19: LFO tempo-sync, mixers, phase, waveform invert ───────────────────────────────

test("A19: syncNoteToRate derives Hz from a note division and the tempo", () => {
  assert.equal(syncNoteToRate("1/4", 120), 2); // one quarter-note cycle at 120bpm = 2Hz
  assert.equal(syncNoteToRate("1/8", 120), 4);
  assert.equal(syncNoteToRate("1/1", 120), 0.5);
  assert.equal(syncNoteToRate("1/4", 60), 1);
  assert.equal(syncNoteToRate("bad", 120), null);
  assert.equal(syncNoteToRate("1/4", 0), null);
  assert.equal(syncNoteToRate("1/4", -5), null);
  assert.equal(syncNoteToRate(null, 120), null);
});

test("A19: a tempo-synced LFO oscillates even with rateHz 0 (sync overrides rateHz)", async () => {
  const { state, engine } = makeHarness({
    vals: { synced: 0, frozen: 0 },
    tempoBpm: 120,
    lfos: {
      synced: { id: "synced", enabled: true, kind: "osc", wave: "saw", rateHz: 0, syncNote: "1/4", min: 0, max: 1, target: "vals.synced", phase: 0, waveInvert: false },
      frozen: { id: "frozen", enabled: true, kind: "osc", wave: "saw", rateHz: 0, syncNote: null, min: 0, max: 1, target: "vals.frozen", phase: 0, waveInvert: false },
    },
  });
  await wait(120);
  assert.ok(state.vals.synced > 0.001, "sync-driven saw advanced past 0");
  assert.equal(state.vals.frozen, 0, "rateHz 0 with no sync stays frozen at phase 0");
  engine.dispose();
});

test("A19: mixer LFOs blend two oscillators (add/mult/xfade) from pass-1 outputs", async () => {
  const { state, engine } = makeHarness({
    vals: { a: 0, b: 0, add: 0, mult: 0, xfade: 0 },
    tempoBpm: 120,
    lfos: {
      a: { id: "a", enabled: true, kind: "osc", wave: "sine", rateHz: 3, min: 0, max: 1, target: "vals.a", phase: 0, waveInvert: false, syncNote: null },
      b: { id: "b", enabled: true, kind: "osc", wave: "saw", rateHz: 2, min: 0, max: 1, target: "vals.b", phase: 0.1, waveInvert: false, syncNote: null },
      mAdd: { id: "mAdd", enabled: true, kind: "mixer", blend: "add", aId: "a", bId: "b", min: 0, max: 1, target: "vals.add", waveInvert: false },
      mMult: { id: "mMult", enabled: true, kind: "mixer", blend: "mult", aId: "a", bId: "b", min: 0, max: 1, target: "vals.mult", waveInvert: false },
      mXfade: { id: "mXfade", enabled: true, kind: "mixer", blend: "xfade", mix: 0.25, aId: "a", bId: "b", min: 0, max: 1, target: "vals.xfade", waveInvert: false },
    },
  });
  await wait(90);
  const { a, b, add, mult, xfade } = state.vals;
  // Every triple is written within one tick, so a/b are exactly the inputs the mixers saw.
  assert.ok(Math.abs(add - clamp01(a + b)) < 1e-9, `add: ${add} vs ${clamp01(a + b)}`);
  assert.ok(Math.abs(mult - a * b) < 1e-9, `mult: ${mult} vs ${a * b}`);
  assert.ok(Math.abs(xfade - (a * 0.75 + b * 0.25)) < 1e-9, `xfade: ${xfade} vs ${a * 0.75 + b * 0.25}`);
  engine.dispose();
});

test("A19: a mixer referencing another mixer reads 0 for it (no mixer→mixer cycle)", async () => {
  const { state, engine } = makeHarness({
    vals: { a: 0, m1: 0, m2: 0 },
    tempoBpm: 120,
    lfos: {
      a: { id: "a", enabled: true, kind: "osc", wave: "sine", rateHz: 3, min: 0, max: 1, target: "vals.a", phase: 0, waveInvert: false, syncNote: null },
      m1: { id: "m1", enabled: true, kind: "mixer", blend: "add", aId: "a", bId: "a", min: 0, max: 1, target: "vals.m1", waveInvert: false },
      m2: { id: "m2", enabled: true, kind: "mixer", blend: "add", aId: "m1", bId: "a", min: 0, max: 1, target: "vals.m2", waveInvert: false },
    },
  });
  await wait(90);
  const { a, m1, m2 } = state.vals;
  assert.ok(Math.abs(m1 - clamp01(a + a)) < 1e-9);
  assert.ok(Math.abs(m2 - clamp01(0 + a)) < 1e-9, "m1 (a mixer) contributed 0, not its value");
  engine.dispose();
});

test("A19: waveInvert flips an oscillator's normalized output (norm + inverted = 1)", async () => {
  const { state, engine } = makeHarness({
    vals: { up: 0, down: 0 },
    tempoBpm: 120,
    lfos: {
      up: { id: "up", enabled: true, kind: "osc", wave: "saw", rateHz: 3, min: 0, max: 1, target: "vals.up", phase: 0, waveInvert: false, syncNote: null },
      down: { id: "down", enabled: true, kind: "osc", wave: "saw", rateHz: 3, min: 0, max: 1, target: "vals.down", phase: 0, waveInvert: true, syncNote: null },
    },
  });
  await wait(90);
  assert.ok(Math.abs(state.vals.up + state.vals.down - 1) < 1e-9);
  engine.dispose();
});

test("A19: a phase offset shifts the waveform (saw at +0.5 differs by half a cycle)", async () => {
  const { state, engine } = makeHarness({
    vals: { p0: 0, p5: 0 },
    tempoBpm: 120,
    lfos: {
      p0: { id: "p0", enabled: true, kind: "osc", wave: "saw", rateHz: 3, min: 0, max: 1, target: "vals.p0", phase: 0, waveInvert: false, syncNote: null },
      p5: { id: "p5", enabled: true, kind: "osc", wave: "saw", rateHz: 3, min: 0, max: 1, target: "vals.p5", phase: 0.5, waveInvert: false, syncNote: null },
    },
  });
  await wait(90);
  assert.ok(Math.abs(Math.abs(state.vals.p0 - state.vals.p5) - 0.5) < 1e-9);
  engine.dispose();
});

test("A19: a targetless oscillator still feeds a mixer", async () => {
  const { state, engine } = makeHarness({
    vals: { probe: 0, m: 0 },
    tempoBpm: 120,
    lfos: {
      // No target — exists only as a mixer input.
      hidden: { id: "hidden", enabled: true, kind: "osc", wave: "sine", rateHz: 3, min: 0, max: 1, target: "", phase: 0, waveInvert: false, syncNote: null },
      // Identical oscillator WITH a target, so we can read the value `hidden` also produced.
      probe: { id: "probe", enabled: true, kind: "osc", wave: "sine", rateHz: 3, min: 0, max: 1, target: "vals.probe", phase: 0, waveInvert: false, syncNote: null },
      m: { id: "m", enabled: true, kind: "mixer", blend: "add", aId: "hidden", bId: "hidden", min: 0, max: 1, target: "vals.m", waveInvert: false },
    },
  });
  await wait(90);
  assert.notEqual(state.vals.probe, 0);
  assert.ok(Math.abs(state.vals.m - clamp01(2 * state.vals.probe)) < 1e-9, "mixer summed the targetless osc's output");
  engine.dispose();
});

test("an image item reached via clipEnded gets its full duration (stale-timer regression)", async () => {
  // Mixed playlist: a timed image followed by a video. After the image advances to the
  // video on wall-clock time and the video later ends (clipEnded advances back to the
  // image), the image's duration timer must be measured from *now*, not from when the
  // previous item started — otherwise the image is skipped within one tick.
  const { state, engine } = makeHarness({
    layers: {
      "layer-1": {
        sourceMode: "playlist",
        playlist: {
          items: [
            { ref: { type: "media", mediaId: "img" }, duration: 0.15 },
            { ref: { type: "media", mediaId: "vid" } }, // no duration -> video item
          ],
          cursor: 0,
        },
      },
    },
  });
  await wait(300); // image (0.15s) advances to the video item
  assert.equal(state.layers["layer-1"].playlist.cursor, 1);
  await wait(300); // video "plays" — the stale timer ages well past the image duration
  assert.equal(state.layers["layer-1"].playlist.cursor, 1); // video does not auto-advance
  engine.clipEnded("layer-1"); // video ended -> back to the image
  assert.equal(state.layers["layer-1"].playlist.cursor, 0);
  await wait(100); // < the image's 150ms duration, but > one 33ms tick
  assert.equal(state.layers["layer-1"].playlist.cursor, 0, "image was skipped by a stale timer");
  engine.dispose();
});
