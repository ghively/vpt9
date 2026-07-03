import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { loadState, saveState, applyUpdate, applyCreate, applyDelete, nextLayerOrder } from "./state.js";

const PORT = process.env.PORT || 8080;
const STATE_FILE = process.env.STATE_FILE || "./state.json";

const state = loadState(STATE_FILE);

// Non-layer/screen/pip fields a preset snapshot does NOT capture (e.g. we don't want
// recalling a preset to also move audio ownership around unless it's explicitly part
// of the snapshot fields listed below).
const PRESET_FIELDS = ["layers", "screens", "pip", "audioOwnerScreenId"];

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
    saveState(STATE_FILE, state);
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
  if (message.path === "layers" && value.order == null) value.order = nextLayerOrder(state);
  const key = applyCreate(state, message.path, value);
  if (key == null) return;
  const stored = state[message.path]?.[key] ?? value;
  saveState(STATE_FILE, state);
  broadcast({ type: "create", path: message.path, key, value: stored });
}

function handleDelete(message) {
  if (!applyDelete(state, message.path)) return;
  saveState(STATE_FILE, state);
  broadcast({ type: "delete", path: message.path });
}

function handlePresetSave(message) {
  const snapshot = {};
  for (const field of PRESET_FIELDS) snapshot[field] = structuredClone(state[field]);
  const preset = { id: message.id || `preset-${Date.now()}`, name: message.name || "Untitled", snapshot };
  const key = applyCreate(state, "presets", preset);
  saveState(STATE_FILE, state);
  broadcast({ type: "create", path: "presets", key, value: preset });
}

function handlePresetRecall(message) {
  const preset = state.presets[message.presetId];
  if (!preset) return;
  for (const field of PRESET_FIELDS) state[field] = structuredClone(preset.snapshot[field]);
  saveState(STATE_FILE, state);
  broadcast({ type: "state", state });
}

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
          saveState(STATE_FILE, state);
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
        if (typeof message.presetId === "string") handlePresetRecall(message);
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

httpServer.listen(PORT, () => {
  console.log(`[control-plane] listening on :${PORT}`);
});
