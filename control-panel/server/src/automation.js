import { applyUpdate } from "./state.js";

// Whole-app automation: one 30 Hz tick loop driving the cue-list interpreter, the
// wall-clock timer bank, active preset fades, and the LFO modulation rack. This is the
// control-panel equivalent of VPT8's cuelist script interpreter (C/F/D/L letter codes),
// its 15-alarm timer bank, and its 10-slot LFO rack — reshaped for the state-path model:
// everything here ultimately just patches dotted state paths and broadcasts them.
//
// Persistence policy: transport changes (cursor/running) persist like operator edits;
// per-tick fade/LFO value writes are ephemeral — broadcast in a single "batch" message
// per tick and never scheduled for disk, so a running LFO doesn't grind state.json.

const TICK_MS = 33;

function waveValue(wave, t, slot) {
  switch (wave) {
    case "triangle":
      return t < 0.5 ? t * 2 : 2 - t * 2;
    case "square":
      return t < 0.5 ? 1 : 0;
    case "saw":
      return t;
    case "random":
      return slot.randValue;
    case "sine":
    default:
      return (Math.sin(2 * Math.PI * t) + 1) / 2;
  }
}

// Collect every numeric leaf that differs between the live state and a preset snapshot
// — those interpolate during a fade. Strings/booleans/structural differences are NOT
// faded; the full recall at fade completion lands them exactly.
function collectNumericDiffs(current, target, basePath, out) {
  for (const [key, targetValue] of Object.entries(target ?? {})) {
    const path = basePath ? `${basePath}.${key}` : key;
    const currentValue = current?.[key];
    if (typeof targetValue === "number" && typeof currentValue === "number") {
      if (currentValue !== targetValue) out.push({ path, from: currentValue, to: targetValue });
    } else if (
      targetValue && typeof targetValue === "object" &&
      currentValue && typeof currentValue === "object"
    ) {
      collectNumericDiffs(currentValue, targetValue, path, out);
    }
  }
}

export function createAutomationEngine({ state, broadcast, scheduleSave, recallPreset, log = console.log }) {
  let fade = null; // { paths: [{path,from,to}], startMs, durMs, presetId }
  let waitUntil = 0; // epoch ms; 0 = not waiting
  const lfoSlots = new Map(); // lfo id -> { phase, cycle, randValue }
  const timerFired = new Map(); // timer id -> minute key last fired
  let lastTickMs = Date.now();

  const auto = () => state.automation;

  function pushTransport() {
    broadcast({
      type: "batch",
      updates: [
        { path: "automation.cursor", value: auto().cursor },
        { path: "automation.running", value: auto().running },
      ],
    });
    scheduleSave();
  }

  function cancelActivity() {
    fade = null;
    waitUntil = 0;
  }

  // Runs the cue at `index`. Returns immediately; fades/waits complete over later ticks.
  function runCue(index) {
    const cues = auto().cues;
    if (!Array.isArray(cues) || index < 0 || index >= cues.length) {
      auto().running = false;
      auto().cursor = -1;
      pushTransport();
      return;
    }
    auto().cursor = index;
    const cue = cues[index] ?? {};
    switch (cue.type) {
      case "recall": {
        if (!recallPreset(cue.presetId)) log(`[automation] cue ${index}: preset "${cue.presetId}" missing, skipped`);
        break;
      }
      case "fade": {
        const preset = state.presets?.[cue.presetId];
        if (!preset) {
          log(`[automation] cue ${index}: preset "${cue.presetId}" missing, skipped`);
          break;
        }
        const paths = [];
        for (const field of Object.keys(preset.snapshot ?? {})) {
          collectNumericDiffs(state[field], preset.snapshot[field], field, paths);
        }
        fade = {
          paths,
          startMs: Date.now(),
          durMs: Math.max(0.01, Number(cue.seconds) || 0) * 1000,
          presetId: cue.presetId,
        };
        break;
      }
      case "wait": {
        waitUntil = Date.now() + Math.max(0, Number(cue.seconds) || 0) * 1000;
        break;
      }
      case "goto": {
        // Jump: the next advance runs cues[target]. Loops are just a goto backwards.
        const target = Number.isInteger(cue.target) ? cue.target : 0;
        auto().cursor = target - 1;
        break;
      }
      default:
        log(`[automation] cue ${index}: unknown type "${cue.type}", skipped`);
    }
    pushTransport();
  }

  // Transport controls (wired to "cueGo"/"cueStop"/"cueJump" protocol messages + OSC).
  function cueGo() {
    // GO while a fade/wait is active skips to the next cue immediately (a fade first
    // completes instantly so the state lands where the cue intended).
    if (fade) recallPreset(fade.presetId);
    cancelActivity();
    auto().running = true;
    runCue((auto().cursor ?? -1) + 1);
  }

  function cueStop() {
    // Theatrical stop: halt where we are — a half-finished fade stays half-finished.
    cancelActivity();
    auto().running = false;
    pushTransport();
  }

  function cueJump(index) {
    if (!Number.isInteger(index)) return;
    cancelActivity();
    auto().cursor = index - 1; // next GO (or the running loop) executes cues[index]
    pushTransport();
  }

  function tickFade(now, batch) {
    if (!fade) return;
    const t = Math.min(1, (now - fade.startMs) / fade.durMs);
    for (const { path, from, to } of fade.paths) {
      const value = from + (to - from) * t;
      if (applyUpdate(state, path, value)) batch.push({ path, value });
    }
    if (t >= 1) {
      const presetId = fade.presetId;
      fade = null;
      // Land exactly on the snapshot (covers non-numeric + structural differences).
      recallPreset(presetId);
    }
  }

  function tickCues(now) {
    if (!auto().running || fade || waitUntil) return;
    runCue((auto().cursor ?? -1) + 1);
  }

  // Deleted LFOs/timers never came back to clear their Map entry (ids are minted
  // fresh with Date.now(), never reused), so a long-running server that accumulates
  // many delete-and-recreate cycles would otherwise grow these two Maps forever.
  // Sweep whichever ids no longer exist in live state before each tick uses them.
  function pruneStaleSlots(map, liveIds) {
    for (const id of map.keys()) {
      if (!liveIds.has(id)) map.delete(id);
    }
  }

  function tickTimers(now) {
    pruneStaleSlots(timerFired, new Set(Object.keys(auto().timers ?? {})));
    const d = new Date(now);
    const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const minuteKey = `${d.toDateString()} ${hhmm}`;
    for (const timer of Object.values(auto().timers ?? {})) {
      if (!timer?.enabled || timer.time !== hhmm) continue;
      if (timerFired.get(timer.id) === minuteKey) continue;
      timerFired.set(timer.id, minuteKey);
      log(`[automation] timer "${timer.id}" fired at ${hhmm}`);
      if (timer.action === "recall") {
        if (!recallPreset(timer.presetId)) log(`[automation] timer "${timer.id}": preset "${timer.presetId}" missing`);
      } else {
        cueGo();
      }
    }
  }

  // layerId -> { cursor, startedAt }: which item we're timing and when it started. Keying
  // the start time to a specific cursor is what makes an *external* cursor change (a
  // clipEnded() advance, or an operator jumping the playlist) reset the timer — a plain
  // "ms the current item started" would keep a stale start time and skip the newly-
  // selected item within one tick. See automation.test.js "stale-timer regression".
  const playlistTiming = new Map();

  function tickPlaylists(now) {
    // Same leak-prevention pattern tickTimers already uses for timerFired: a layer
    // deleted entirely (not just switched out of playlist mode) would otherwise leave
    // its entry in this Map forever, since the loop below only ever visits ids still
    // present in state.layers.
    pruneStaleSlots(playlistTiming, new Set(Object.keys(state.layers ?? {})));
    for (const [id, layer] of Object.entries(state.layers ?? {})) {
      // A layer can be null in a hand-corrupted state.json; never deref it blindly here —
      // this tick has no error boundary of its own beyond the interval's try/catch.
      if (!layer || layer.sourceMode !== "playlist") { playlistTiming.delete(id); continue; }
      const pl = layer.playlist;
      if (!pl?.items?.length) { playlistTiming.delete(id); continue; }
      const item = pl.items[pl.cursor];
      if (!item?.duration) continue; // video items ("play through to end") only advance via clipEnded()
      const timing = playlistTiming.get(id);
      // First time we see this cursor (fresh item, or the cursor moved out from under us):
      // start its clock now rather than inheriting the previous item's start time.
      if (!timing || timing.cursor !== pl.cursor) { playlistTiming.set(id, { cursor: pl.cursor, startedAt: now }); continue; }
      if (now - timing.startedAt >= item.duration * 1000) {
        const nextCursor = (pl.cursor + 1) % pl.items.length;
        state.layers[id].playlist = { ...pl, cursor: nextCursor };
        playlistTiming.set(id, { cursor: nextCursor, startedAt: now });
        broadcast({ type: "update", path: `layers.${id}.playlist`, value: state.layers[id].playlist });
      }
    }
  }

  // Called when a render client (the audio owner for this layer) reports its <video>
  // firing the native `ended` event — the only way the server can know a video-mode
  // playlist item finished, since it never observes playback directly.
  function clipEnded(layerId) {
    const layer = state.layers?.[layerId];
    if (layer?.sourceMode !== "playlist") return;
    const pl = layer.playlist;
    if (!pl?.items?.length) return;
    const nextCursor = (pl.cursor + 1) % pl.items.length;
    state.layers[layerId].playlist = { ...pl, cursor: nextCursor };
    broadcast({ type: "update", path: `layers.${layerId}.playlist`, value: state.layers[layerId].playlist });
  }

  function tickLfos(now, dtSeconds, batch) {
    pruneStaleSlots(lfoSlots, new Set(Object.keys(state.lfos ?? {})));
    for (const lfo of Object.values(state.lfos ?? {})) {
      if (!lfo?.enabled || typeof lfo.target !== "string" || !lfo.target) continue;
      let slot = lfoSlots.get(lfo.id);
      if (!slot) {
        slot = { phase: 0, cycle: 0, randValue: Math.random() };
        lfoSlots.set(lfo.id, slot);
      }
      const rate = Math.max(0, Number(lfo.rateHz) || 0);
      slot.phase += rate * dtSeconds;
      const cycle = Math.floor(slot.phase);
      if (cycle !== slot.cycle) {
        slot.cycle = cycle;
        slot.randValue = Math.random(); // sample-and-hold, one value per cycle
      }
      const t = slot.phase - cycle;
      const min = Number(lfo.min) || 0;
      const max = Number(lfo.max) || 0;
      const value = min + waveValue(lfo.wave, t, slot) * (max - min);
      if (applyUpdate(state, lfo.target, value)) batch.push({ path: lfo.target, value });
    }
  }

  const interval = setInterval(() => {
    // This loop runs for the life of the process. A throw here used to be fatal (no
    // uncaughtException handler), so a single bad state shape could take the whole control
    // plane down mid-show. Contain it: log once (rate-limited) and keep ticking — a
    // degraded automation tick beats a dark stage.
    try {
      const now = Date.now();
      const dtSeconds = Math.min(1, (now - lastTickMs) / 1000);
      lastTickMs = now;

      if (waitUntil && now >= waitUntil) waitUntil = 0;

      const batch = [];
      tickFade(now, batch);
      tickLfos(now, dtSeconds, batch);
      tickCues(now);
      tickTimers(now);
      tickPlaylists(now);
      if (batch.length) broadcast({ type: "batch", updates: batch });
    } catch (err) {
      log(`[automation] tick error (continuing): ${err?.stack || err}`);
    }
  }, TICK_MS);

  return {
    cueGo,
    cueStop,
    cueJump,
    clipEnded,
    dispose() {
      clearInterval(interval);
    },
  };
}
