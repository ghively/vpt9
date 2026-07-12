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

// Tempo-sync (task A19): a note division like "1/4" → an oscillation rate in Hz, derived
// from the global tempo. A whole note ("1/1") spans 4 beats, so beats = (num/den) * 4 and
// the LFO's cycle period is `beats` beats long: rate = bpm / (60 * beats). At 120 bpm a
// "1/4" LFO completes one cycle per quarter-note (2 Hz). Returns null for an unparseable
// note or a non-positive tempo, so the caller falls back to the slot's manual rateHz.
export function syncNoteToRate(note, bpm) {
  const m = /^(\d+)\/(\d+)$/.exec(typeof note === "string" ? note.trim() : "");
  if (!m) return null;
  const num = Number(m[1]);
  const den = Number(m[2]);
  const tempo = Number(bpm);
  if (!num || !den || !(tempo > 0)) return null;
  const beats = (num / den) * 4;
  if (!(beats > 0)) return null;
  return tempo / (60 * beats);
}

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

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

export function createAutomationEngine({
  state,
  broadcast,
  scheduleSave,
  recallPreset,
  // Recall a source-bank snapshot by id (task A16 `source` cue) — wired to
  // createSourceBankPresets().recall in index.js; a no-op in unit harnesses that don't need it.
  recallSourceBankPreset = () => false,
  // Emit one raw OSC message (task A17 `osc` cue) — wired to createOscOut().sendRaw.
  sendOsc = () => false,
  log = console.log,
}) {
  // { paths: [{path,from,to}], startMs, durMs, presetId }. `presetId` is a string for a
  // scene `fade` cue (lands via a full recall) or null for a `paramFade` (lands by snapping
  // each path to its `to`).
  let fade = null;
  let waitUntil = 0; // epoch ms; 0 = not waiting
  // A18: whether the cue the interpreter last executed permits automatic continuation.
  // VPT8's default cue holds for GO; only a cue flagged `autoContinue` chains on its own.
  let autoAdvance = false;
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
    autoAdvance = false;
  }

  // Runs the cue at `index`. Returns immediately; fades/waits complete over later ticks.
  function runCue(index) {
    const cues = auto().cues;
    if (!Array.isArray(cues) || index < 0 || index >= cues.length) {
      auto().running = false;
      auto().cursor = -1;
      autoAdvance = false;
      pushTransport();
      return;
    }
    auto().cursor = index;
    const cue = cues[index] ?? {};
    // A18: does THIS cue chain to the next on its own, or hold for a manual GO? Set before
    // the switch so it's the cue that just ran (a `goto` moves the cursor, so reading it
    // back off the post-switch cursor would check the wrong cue).
    autoAdvance = !!cue.autoContinue;
    switch (cue.type) {
      case "recall": {
        if (!recallPreset(cue.presetId)) log(`[automation] cue ${index}: preset "${cue.presetId}" missing, skipped`);
        break;
      }
      case "source": {
        // A16: recall a source-bank snapshot (VPT8's `pattrstorage sources`).
        if (!recallSourceBankPreset(cue.presetId)) log(`[automation] cue ${index}: source preset "${cue.presetId}" missing, skipped`);
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
      case "paramFade": {
        // A16: tween ONE dotted state path from `from` → `to` over `seconds`, reusing the
        // same fade-tick machinery as a scene `fade` (presetId null → lands by snapping).
        const path = cue.path;
        const from = Number(cue.from);
        const to = Number(cue.to);
        if (typeof path !== "string" || !path || !Number.isFinite(from) || !Number.isFinite(to)) {
          log(`[automation] cue ${index}: invalid paramFade (path/from/to), skipped`);
          break;
        }
        fade = {
          paths: [{ path, from, to }],
          startMs: Date.now(),
          durMs: Math.max(0.01, Number(cue.seconds) || 0) * 1000,
          presetId: null,
        };
        break;
      }
      case "osc": {
        // A17: send one raw OSC message (address + args) out the OSC-output socket.
        if (typeof cue.address === "string" && cue.address.startsWith("/")) {
          if (!sendOsc(cue.address, Array.isArray(cue.args) ? cue.args : [])) {
            log(`[automation] cue ${index}: osc "${cue.address}" not sent (no OSC-out destination)`);
          }
        } else {
          log(`[automation] cue ${index}: invalid osc address, skipped`);
        }
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

  // Lands the active fade exactly, then clears it. A scene `fade` recalls its preset (covers
  // non-numeric + structural diffs); a `paramFade` (presetId null) snaps each path to its
  // `to` and broadcasts. Used both when a fade completes and when a GO cuts it short.
  function landFade() {
    const f = fade;
    fade = null;
    if (!f) return;
    if (f.presetId) {
      recallPreset(f.presetId);
      return;
    }
    const updates = [];
    for (const { path, to } of f.paths) {
      if (applyUpdate(state, path, to)) updates.push({ path, value: to });
    }
    if (updates.length) broadcast({ type: "batch", updates });
  }

  // Transport controls (wired to "cueGo"/"cueStop"/"cueJump" protocol messages + OSC).
  function cueGo() {
    // GO while a fade/wait is active skips to the next cue immediately (a fade first
    // lands instantly so the state ends where the cue intended).
    if (fade) landFade();
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
    if (t >= 1) landFade(); // exact landing (recall for a scene fade, snap for a paramFade)
  }

  function tickCues() {
    if (!auto().running || fade || waitUntil) return;
    // A18: only chain to the next cue automatically when the cue that just completed is
    // flagged autoContinue; otherwise hold here until the operator hits GO.
    if (!autoAdvance) return;
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
      } else if (timer.action === "source") {
        // A21c: recall a source-bank snapshot (VPT8's `pattrstorage sources`) — same call the
        // `source` cue and the panel's Source snapshots use. Reuses `presetId` as the target id
        // (a source-bank preset id), mirroring how the `source` CUE stores its target.
        if (!recallSourceBankPreset(timer.presetId)) log(`[automation] timer "${timer.id}": source preset "${timer.presetId}" missing`);
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

  // Two-pass modulation rack (task A19). Pass 1 evaluates every plain oscillator
  // (`kind` "osc"/absent), honoring per-slot phase offset, waveform invert, and tempo-sync
  // (syncNote → rate from the global tempoBpm, overriding rateHz), writing each one's target
  // AND recording its normalized 0..1 output. Pass 2 evaluates `mixer` LFOs by blending two
  // pass-1 outputs (add/mult/xfade). Because pass 1 only records oscillators, a mixer that
  // references another mixer reads an absent input (→ 0): no mixer→mixer cycle is possible.
  function writeLfo(lfo, norm, batch) {
    if (typeof lfo.target !== "string" || !lfo.target) return;
    const min = Number(lfo.min) || 0;
    const max = Number(lfo.max) || 0;
    const value = min + norm * (max - min);
    if (applyUpdate(state, lfo.target, value)) batch.push({ path: lfo.target, value });
  }

  function tickLfos(dtSeconds, batch) {
    pruneStaleSlots(lfoSlots, new Set(Object.keys(state.lfos ?? {})));
    const bpm = Number(state.tempoBpm) > 0 ? Number(state.tempoBpm) : 120;
    const oscOutputs = new Map(); // osc lfo id -> normalized 0..1 output (mixer inputs)

    // Pass 1 — oscillators.
    for (const lfo of Object.values(state.lfos ?? {})) {
      if (!lfo || !lfo.enabled) continue;
      if (lfo.kind && lfo.kind !== "osc") continue; // mixers handled in pass 2
      let slot = lfoSlots.get(lfo.id);
      if (!slot) {
        slot = { phase: 0, cycle: 0, randValue: Math.random() };
        lfoSlots.set(lfo.id, slot);
      }
      const synced = syncNoteToRate(lfo.syncNote, bpm);
      const rate = synced != null ? synced : Math.max(0, Number(lfo.rateHz) || 0);
      slot.phase += rate * dtSeconds;
      const cycle = Math.floor(slot.phase);
      if (cycle !== slot.cycle) {
        slot.cycle = cycle;
        slot.randValue = Math.random(); // sample-and-hold, one value per cycle
      }
      // Phase offset (0..1) shifts the waveform along its cycle; kept out of the cycle
      // counter above so sample-and-hold still fires once per underlying cycle.
      let t = slot.phase - cycle + (Number(lfo.phase) || 0);
      t -= Math.floor(t);
      let norm = waveValue(lfo.wave, t, slot);
      if (lfo.waveInvert) norm = 1 - norm;
      oscOutputs.set(lfo.id, norm);
      writeLfo(lfo, norm, batch);
    }

    // Pass 2 — mixers.
    for (const lfo of Object.values(state.lfos ?? {})) {
      if (!lfo || !lfo.enabled || lfo.kind !== "mixer") continue;
      const a = oscOutputs.get(lfo.aId) ?? 0;
      const b = oscOutputs.get(lfo.bId) ?? 0;
      let norm;
      switch (lfo.blend) {
        case "mult":
          norm = a * b;
          break;
        case "xfade": {
          const x = clamp01(Number(lfo.mix) || 0);
          norm = a * (1 - x) + b * x;
          break;
        }
        case "add":
        default:
          norm = a + b;
          break;
      }
      norm = clamp01(norm);
      if (lfo.waveInvert) norm = 1 - norm;
      writeLfo(lfo, norm, batch);
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
      tickLfos(dtSeconds, batch);
      tickCues();
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
