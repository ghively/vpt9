import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { WebSocketServer } from "ws";
import { loadState, saveState, applyUpdate, applyCreate, applyDelete, nextLayerOrder, ensureLayerDefaults, walkToParent, resetShowState } from "./state.js";
import { writeFileTags } from "./media-tags.js";
import { SAFE_FILENAME } from "./media.js";
import { createAutomationEngine } from "./automation.js";
import { startOsc } from "./osc.js";
import { createOscOut } from "./osc-out.js";
import { createMediaRouter } from "./media.js";
import { createMediaImporter } from "./media-import.js";
import { createSourceBankPresets } from "./source-bank-presets.js";
import { createBlindSession } from "./blind.js";

// At most one console.warn per key per second, so a misbehaving/hostile client can't
// flood the log — while a maintainer debugging "why isn't my update landing" still
// gets a signal instead of a silent drop.
const lastWarnAt = new Map();
function warnRateLimited(key, ...args) {
  const now = Date.now();
  if (now - (lastWarnAt.get(key) || 0) < 1000) return;
  lastWarnAt.set(key, now);
  console.warn(...args);
}

const PORT = process.env.PORT || 8080;
const STATE_FILE = process.env.STATE_FILE || "./state.json";
const OSC_PORT = Number(process.env.OSC_PORT ?? 9000); // 0 disables the OSC listener

// Last-resort net: the known crash sites are fixed at the source (state-shape validation
// in applyUpdate, the automation tick's own try/catch, and per-handler try/catch below),
// but an unforeseen throw should still not kill a live-show server. Log and keep running;
// a real startup bind failure is handled separately by wss.on("error") which does exit.
process.on("uncaughtException", (err) => console.error("[control-plane] uncaughtException (continuing):", err?.stack || err));
process.on("unhandledRejection", (reason) => console.error("[control-plane] unhandledRejection (continuing):", reason?.stack || reason));

const state = loadState(STATE_FILE);

const MEDIA_DIR = process.env.MEDIA_DIR || "./media";
const MEDIA_MAX_BYTES = Number(process.env.MEDIA_MAX_BYTES ?? 1024 * 1024 * 1024);
mkdirSync(MEDIA_DIR, { recursive: true });

// Non-layer/screen/pip fields a preset snapshot does NOT capture (e.g. we don't want
// recalling a preset to also move audio ownership around unless it's explicitly part
// of the snapshot fields listed below).
const PRESET_FIELDS = ["layers", "screens", "pip", "audioOwnerScreenId"];

// Drags emit updates at pointer-move rate; writing the file synchronously per message
// would block the event loop for no benefit. Trailing debounce, flushed on shutdown.
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveState(STATE_FILE, state);
  }, 250);
}

function flushSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  saveState(STATE_FILE, state);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    flushSave();
    process.exit(0);
  });
}

// These endpoints carry tiny JSON control bodies (a videoId, a URL). Cap accumulation so a
// LAN client can't stream an unbounded body and exhaust memory — the file-upload path
// already enforces its own byte cap; the JSON bodies didn't. Settle on premature close too.
function readJsonBody(req, maxBytes = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let size = 0;
    let settled = false;
    const settle = (fn, arg) => { if (settled) return; settled = true; fn(arg); };
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) { settle(reject, new Error("request body too large")); req.destroy(); return; }
      raw += chunk;
    });
    req.on("end", () => {
      if (settled) return;
      if (!raw) return settle(resolve, {});
      try { settle(resolve, JSON.parse(raw)); } catch (err) { settle(reject, err); }
    });
    req.on("error", (err) => settle(reject, err));
    req.on("close", () => { if (!req.complete) settle(reject, new Error("connection closed before body complete")); });
  });
}

const httpServer = createServer(async (req, res) => {
  // A throw in any handler below (including an async media/cast path) used to reject the
  // request promise with nothing awaiting it → unhandledRejection → process death. Contain
  // it here: log and return a 500 instead of taking the control plane down.
  try {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }

  if (req.url === "/state") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(state, null, 2));
    return;
  }

  // Hook for anything outside the WebSocket protocol to push a PiP video in — used by
  // the DIAL/SSDP cast-receiver service so casting from a phone's YouTube app doesn't
  // need its own WebSocket client.
  const castMatch = req.method === "POST" && req.url?.match(/^\/api\/pip\/([^/]+)\/cast$/);
  if (castMatch) {
    const pipId = decodeURIComponent(castMatch[1]);
    // Object.hasOwn, not `!state.pip[pipId]`: a plain member-access lets inherited
    // Object.prototype keys ("__proto__", "constructor") read as "exists" and slip past
    // the 404 (the write below is then refused by applyUpdate, but the old code still
    // broadcast a phantom update and returned {ok:true}).
    if (!Object.hasOwn(state.pip, pipId)) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: `no pip window with id "${pipId}"` }));
      return;
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "invalid JSON body" }));
      return;
    }
    if (typeof body.videoId !== "string" || !body.videoId) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "body.videoId (string) is required" }));
      return;
    }

    // Only broadcast the writes that actually landed — never announce state changes the
    // server didn't make (which would desync every client).
    const wroteVideo = applyUpdate(state, `pip.${pipId}.videoId`, body.videoId);
    const wroteVisible = applyUpdate(state, `pip.${pipId}.visible`, true);
    const wroteTitle = typeof body.title === "string" && applyUpdate(state, `pip.${pipId}.title`, body.title);
    if (wroteVideo || wroteVisible || wroteTitle) scheduleSave();
    if (wroteVideo) broadcast({ type: "update", path: `pip.${pipId}.videoId`, value: body.videoId });
    if (wroteVisible) broadcast({ type: "update", path: `pip.${pipId}.visible`, value: true });
    if (wroteTitle) broadcast({ type: "update", path: `pip.${pipId}.title`, value: body.title });

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, pip: state.pip[pipId] }));
    return;
  }

  if (await mediaRouter.handle(req, res)) return;

  res.writeHead(404);
  res.end();
  } catch (err) {
    console.error("[http] handler error:", err?.stack || err);
    if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
    if (!res.writableEnded) res.end(JSON.stringify({ error: "internal error" }));
  }
});

const wss = new WebSocketServer({ server: httpServer });

// `ws`'s WebSocketServer, constructed with an existing httpServer, attaches its own
// 'error'/'listening' listeners to that httpServer and re-emits them on `wss` itself —
// so a bind failure (EADDRINUSE/EACCES) surfaces as an 'error' event on `wss`, not on
// `httpServer` directly. An EventEmitter with zero listeners for 'error' throws
// synchronously as soon as one is emitted, and since ws's own internal listener is
// registered before any listener added here, it throws before a plain
// `httpServer.on('error', ...)` handler (registered later) would ever run. This is the
// listener that actually needs to exist for a clean, actionable failure message instead
// of an uncaught-exception stack trace.
wss.on("error", (err) => {
  console.error(`[control-plane] failed to start on :${PORT}: ${err.message}`);
  process.exit(1);
});

// OSC OUTPUT / state mirroring (task A17): watches every broadcast and, when enabled,
// mirrors scalar leaf changes ("update"/"batch") out as coalesced OSC messages. Created
// before broadcast so the interceptor below can reference it.
const oscOut = createOscOut({ state });

function broadcast(message, exclude) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client !== exclude && client.readyState === client.OPEN) client.send(payload);
  }
  // Mirror the same change out over OSC (no-op unless oscOut.enabled). Kept out of the
  // per-client loop so it fires exactly once per broadcast, whoever the exclude is.
  oscOut.observe(message);
}

// Panel-only relay for high-frequency telemetry (preview frames, transport positions):
// render clients identify themselves with a `hello` message and are skipped — without
// this, every screen's ~10fps 640px preview JPEG stream was mirrored to every projector,
// which parsed and dropped all of it. Clients that never send `hello` (panels, e2e
// sockets, older render clients) receive everything, exactly as before.
function broadcastToPanels(message, exclude) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client !== exclude && !client.isRenderClient && client.readyState === client.OPEN) client.send(payload);
  }
}

// Import-by-link (paste a URL on the panel): direct media files download straight in;
// streaming sites go through yt-dlp when installed. See server/src/media-import.js.
const mediaImporter = createMediaImporter({ mediaDir: MEDIA_DIR, state, broadcast, scheduleSave, maxBytes: MEDIA_MAX_BYTES });
const mediaRouter = createMediaRouter({ mediaDir: MEDIA_DIR, state, broadcast, scheduleSave, maxBytes: MEDIA_MAX_BYTES, importer: mediaImporter });

function handleCreate(socket, message) {
  const value = message.value ?? {};
  if (message.path === "layers") {
    if (value.order == null) value.order = nextLayerOrder(state);
    // Backfill fields an older client's create might not know about (e.g. fx) so
    // every layer in state always has the full set of patchable leaves.
    ensureLayerDefaults(value);
  }
  const key = applyCreate(state, message.path, value);
  if (key == null) return;
  const parent = walkToParent(state, message.path.split("."));
  const stored = parent?.[key] ?? value;
  scheduleSave();
  broadcast({ type: "create", path: message.path, key, value: stored });
}

function handleDelete(message) {
  // The source-bank recall cursor is an INDEX into Object.keys(sourceBankPresets); capture
  // which snapshot it points at BEFORE the delete shifts that key order underneath it, so
  // next/prev don't step from a stale index and skip or repeat a snapshot.
  const cursorTargetId =
    /^sourceBankPresets\.[^.]+$/.test(message.path) && Number.isInteger(state.sourceBankPresetCursor)
      ? Object.keys(state.sourceBankPresets ?? {})[state.sourceBankPresetCursor] ?? null
      : undefined;
  if (!applyDelete(state, message.path)) return;
  if (cursorTargetId !== undefined) {
    // Re-point the cursor at the SAME snapshot by id (−1 if it was the one just deleted),
    // and broadcast it so every panel's mirror stays in sync with the server.
    const next = cursorTargetId === null ? -1 : Object.keys(state.sourceBankPresets ?? {}).indexOf(cursorTargetId);
    if (next !== state.sourceBankPresetCursor) {
      state.sourceBankPresetCursor = next;
      broadcast({ type: "update", path: "sourceBankPresetCursor", value: next });
    }
  }
  scheduleSave();
  broadcast({ type: "delete", path: message.path });
}

function handlePresetSave(message) {
  const snapshot = {};
  for (const field of PRESET_FIELDS) snapshot[field] = structuredClone(state[field]);
  // Coerce a non-string id to a generated one instead of letting applyCreate refuse it —
  // the old path broadcast a phantom {key:null} create that every client dropped, so the
  // operator's "saved" look silently vanished. The random suffix matters: two saves in
  // the same millisecond (a double-clicked +save, a scripted setup) used to collide on
  // a bare Date.now() id and the second silently overwrote the first.
  const id =
    typeof message.id === "string" && message.id
      ? message.id
      : `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const preset = { id, name: typeof message.name === "string" && message.name ? message.name : "Untitled", snapshot };
  const key = applyCreate(state, "presets", preset);
  if (key == null) return;
  scheduleSave();
  broadcast({ type: "create", path: "presets", key, value: preset });
}

// Shared by the WS message handler, the automation engine (recall/fade cues, timers)
// and OSC. Returns false when the preset doesn't exist so callers can warn.
function recallPreset(presetId) {
  // Object.hasOwn: an inherited name ("__proto__"/"constructor"/"toString"/…) reads back a
  // truthy Object.prototype member and would slip past `!preset`, then scheduleSave +
  // broadcast a full state snapshot to every client for a recall of nothing (reachable via
  // WS presetRecall and OSC /preset/recall). Treat it as "not found".
  if (!Object.hasOwn(state.presets, presetId)) return false;
  const preset = state.presets[presetId];
  if (!preset) return false;
  // A legacy/partial snapshot may lack a field; structuredClone(undefined) is undefined
  // (no throw), which used to set state.pip / state.audioOwnerScreenId to `undefined` —
  // then Object.hasOwn(state.pip, …) threw (cast route 500) and clients desynced. Only
  // overwrite fields the snapshot actually carries; leave the rest intact.
  for (const field of PRESET_FIELDS) {
    if (preset.snapshot?.[field] !== undefined) state[field] = structuredClone(preset.snapshot[field]);
  }
  scheduleSave();
  broadcast({ type: "state", state });
  return true;
}

// Source-bank presets (task A12 — VPT8's `pattrstorage sources` + sourcenext/prev). The
// save/recall/step logic lives in its own factory so it's unit-testable without this file's
// top-level listen(); see server/test/source-bank-presets.test.js.
const sourceBankPresets = createSourceBankPresets({ state, broadcast, scheduleSave });

// True blind editing (extends task A20): engaging blind snapshots the live look so the
// operator can commit (plain blind=false) or discard (`blindDiscard`) their off-air edits.
// See server/src/blind.js + server/test/blind.test.js.
const blindSession = createBlindSession({ state, broadcast, scheduleSave });

const engine = createAutomationEngine({
  state,
  broadcast,
  scheduleSave,
  recallPreset,
  recallSourceBankPreset: sourceBankPresets.recall, // A16 `source` cue
  sendOsc: (address, args) => oscOut.sendRaw(address, args), // A17 `osc` cue
});

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "state", state }));

  socket.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch (err) {
      warnRateLimited("ws-parse", "[ws] dropped malformed message:", err.message);
      return;
    }

    try {
    switch (message.type) {
      case "update": {
        if (typeof message.path !== "string") return;
        blindSession.noteUpdate(message.path, message.value); // must see pre-write state.blind
        if (applyUpdate(state, message.path, message.value)) {
          scheduleSave();
          broadcast({ type: "update", path: message.path, value: message.value });
          // Tags live IN the media files (media-tags.js): mirror a panel tag edit back
          // into the file's XMP-dc:Subject so the file stays the durable record.
          // Fire-and-forget — the state write + broadcast above already succeeded, and
          // writeFileTags degrades to a warn when exiftool is missing.
          const tagEdit = /^media\.([^.]+)\.tags$/.exec(message.path);
          if (tagEdit) {
            const entry = state.media?.[tagEdit[1]];
            if (entry && SAFE_FILENAME.test(entry.filename)) {
              writeFileTags(join(MEDIA_DIR, entry.filename), message.value);
            }
          }
        }
        return;
      }
      case "resetShow": {
        // Start fresh (owner request): wipe the show, keep the media library + screen
        // registry. Route a blind=false through the session first so a snapshot held by
        // an active blind session is dropped as a commit rather than resurrecting the
        // pre-reset show on the next blind toggle.
        blindSession.noteUpdate("blind", false);
        resetShowState(state);
        scheduleSave();
        broadcast({ type: "state", state });
        return;
      }
      case "blindDiscard":
        blindSession.discard();
        return;
      case "hello":
        // Client self-identification (see broadcastToPanels): render clients opt out of
        // panel-only telemetry relays. Sent on every (re)connect by render-client main.js.
        if (message.role === "render") socket.isRenderClient = true;
        return;
      case "create":
        if (typeof message.path === "string") handleCreate(socket, message);
        return;
      case "delete":
        if (typeof message.path === "string") handleDelete(message);
        return;
      case "presetSave":
        handlePresetSave(message);
        return;
      case "presetRecall":
        if (typeof message.presetId === "string") recallPreset(message.presetId);
        return;
      case "sourceBankPresetSave":
        sourceBankPresets.save(message);
        return;
      case "sourceBankPresetRecall":
        if (typeof message.presetId === "string") sourceBankPresets.recall(message.presetId);
        return;
      case "sourceBankPresetNext":
        sourceBankPresets.next();
        return;
      case "sourceBankPresetPrev":
        sourceBankPresets.prev();
        return;
      case "cueGo":
        engine.cueGo();
        return;
      case "cueStop":
        engine.cueStop();
        return;
      case "cueJump":
        if (Number.isInteger(message.index)) engine.cueJump(message.index);
        return;
      case "preview":
        // Confidence-monitor frames for the warp editor: relayed live to PANELS only
        // (see broadcastToPanels), never persisted or stored in `state` —
        // high-frequency and disposable by design.
        if (typeof message.screenId === "string" && typeof message.frame === "string") {
          broadcastToPanels({ type: "preview", screenId: message.screenId, frame: message.frame }, socket);
        }
        return;
      case "transportStatus":
        // Playback-position telemetry: panel-only relay, never persisted, mirroring the
        // `preview` pattern exactly — see docs/superpowers/specs/2026-07-08-parity-
        // finish-line-design.md Section 3 for why this is NOT part of `state`.
        if (typeof message.layerId === "string" && typeof message.position === "number") {
          broadcastToPanels({ type: "transportStatus", layerId: message.layerId, position: message.position, duration: message.duration }, socket);
        }
        return;
      case "clipEnded":
        if (typeof message.layerId === "string") engine.clipEnded(message.layerId);
        return;
      case "record":
        // Camera record-to-disk trigger (task A14b): relay-only, never persisted — the
        // render-client (audio owner) that actually holds the camera MediaStream records it
        // and POSTs the finished clip to /api/media, exactly like the preview/transportStatus
        // relays. Excludes the panel sender; every render client sees it and self-selects.
        if (message.action === "start" || message.action === "stop") {
          broadcast({ type: "record", action: message.action }, socket);
        }
        return;
      default:
        return;
    }
    } catch (err) {
      // One client's bad message must never crash the process (no uncaughtException net
      // used to exist). Drop it, rate-limited so a hostile client can't flood the log.
      warnRateLimited("ws-handler", "[ws] handler error, dropped message:", err?.message);
    }
  });
});

// OSC routing: transport addresses map to their protocol messages; anything else is
// an address → dotted-state-path update with the first argument as the value.
function handleOscMessage(address, args) {
  if (address === "/cue/go") return engine.cueGo();
  if (address === "/cue/stop") return engine.cueStop();
  if (address === "/cue/jump") {
    if (Number.isInteger(args[0])) engine.cueJump(args[0]);
    return;
  }
  if (address === "/preset/recall") {
    if (typeof args[0] === "string" && !recallPreset(args[0])) {
      console.warn(`[osc] /preset/recall: no preset "${args[0]}"`);
    }
    return;
  }
  // Source-bank preset stepping/recall (task A12) — the OSC face of sourcenext/prev.
  if (address === "/sources/next") return void sourceBankPresets.next();
  if (address === "/sources/prev") return void sourceBankPresets.prev();
  if (address === "/sources/recall") {
    if (typeof args[0] === "string" && !sourceBankPresets.recall(args[0])) {
      console.warn(`[osc] /sources/recall: no source-bank preset "${args[0]}"`);
    }
    return;
  }

  const path = address.replace(/^\//, "").replaceAll("/", ".");
  let value = args[0];
  if (value === undefined) return;
  // OSC toggles overwhelmingly send numeric 0/1 (`i`/`f` tags), but state pins `blind`
  // to a strict boolean — normalize here so `/blind 1` from TouchOSC/QLab actually
  // engages blind instead of being silently refused by applyUpdate.
  if (path === "blind" && typeof value === "number") value = value !== 0;
  blindSession.noteUpdate(path, value); // an OSC /blind write opens/commits a session too
  if (applyUpdate(state, path, value)) {
    scheduleSave();
    broadcast({ type: "update", path, value });
  }
}

if (OSC_PORT > 0) startOsc({ port: OSC_PORT, handle: handleOscMessage });

httpServer.listen(PORT, () => {
  console.log(`[control-plane] listening on :${PORT}`);
});
