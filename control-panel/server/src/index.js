import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { loadState, saveState, applyUpdate, applyCreate, applyDelete, nextLayerOrder, ensureLayerDefaults } from "./state.js";
import { createAutomationEngine } from "./automation.js";
import { startOsc } from "./osc.js";

const PORT = process.env.PORT || 8080;
const STATE_FILE = process.env.STATE_FILE || "./state.json";
const OSC_PORT = Number(process.env.OSC_PORT ?? 9000); // 0 disables the OSC listener

const state = loadState(STATE_FILE);

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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const httpServer = createServer(async (req, res) => {
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
    if (!state.pip[pipId]) {
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

    applyUpdate(state, `pip.${pipId}.videoId`, body.videoId);
    applyUpdate(state, `pip.${pipId}.visible`, true);
    if (typeof body.title === "string") applyUpdate(state, `pip.${pipId}.title`, body.title);
    scheduleSave();
    broadcast({ type: "update", path: `pip.${pipId}.videoId`, value: body.videoId });
    broadcast({ type: "update", path: `pip.${pipId}.visible`, value: true });
    if (typeof body.title === "string") broadcast({ type: "update", path: `pip.${pipId}.title`, value: body.title });

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, pip: state.pip[pipId] }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

function broadcast(message, exclude) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client !== exclude && client.readyState === client.OPEN) client.send(payload);
  }
}

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
  const stored = state[message.path]?.[key] ?? value;
  scheduleSave();
  broadcast({ type: "create", path: message.path, key, value: stored });
}

function handleDelete(message) {
  if (!applyDelete(state, message.path)) return;
  scheduleSave();
  broadcast({ type: "delete", path: message.path });
}

function handlePresetSave(message) {
  const snapshot = {};
  for (const field of PRESET_FIELDS) snapshot[field] = structuredClone(state[field]);
  const preset = { id: message.id || `preset-${Date.now()}`, name: message.name || "Untitled", snapshot };
  const key = applyCreate(state, "presets", preset);
  scheduleSave();
  broadcast({ type: "create", path: "presets", key, value: preset });
}

// Shared by the WS message handler, the automation engine (recall/fade cues, timers)
// and OSC. Returns false when the preset doesn't exist so callers can warn.
function recallPreset(presetId) {
  const preset = state.presets[presetId];
  if (!preset) return false;
  for (const field of PRESET_FIELDS) state[field] = structuredClone(preset.snapshot[field]);
  scheduleSave();
  broadcast({ type: "state", state });
  return true;
}

const engine = createAutomationEngine({ state, broadcast, scheduleSave, recallPreset });

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "state", state }));

  socket.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (message.type) {
      case "update": {
        if (typeof message.path !== "string") return;
        if (applyUpdate(state, message.path, message.value)) {
          scheduleSave();
          broadcast({ type: "update", path: message.path, value: message.value });
        }
        return;
      }
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
        // Confidence-monitor frames for the warp editor: relayed live, never persisted
        // or stored in `state` — high-frequency and disposable by design.
        if (typeof message.screenId === "string" && typeof message.frame === "string") {
          broadcast({ type: "preview", screenId: message.screenId, frame: message.frame }, socket);
        }
        return;
      default:
        return;
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

  const path = address.replace(/^\//, "").replaceAll("/", ".");
  const value = args[0];
  if (value === undefined) return;
  if (applyUpdate(state, path, value)) {
    scheduleSave();
    broadcast({ type: "update", path, value });
  }
}

if (OSC_PORT > 0) startOsc({ port: OSC_PORT, handle: handleOscMessage });

httpServer.listen(PORT, () => {
  console.log(`[control-plane] listening on :${PORT}`);
});
