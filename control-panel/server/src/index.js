import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { loadState, saveState, applyUpdate } from "./state.js";

const PORT = process.env.PORT || 8080;
const STATE_FILE = process.env.STATE_FILE || "./state.json";

const state = loadState(STATE_FILE);

const httpServer = createServer((req, res) => {
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
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(payload);
  }
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

    if (message.type === "update" && typeof message.path === "string") {
      const changed = applyUpdate(state, message.path, message.value);
      if (changed) {
        saveState(STATE_FILE, state);
        broadcast({ type: "update", path: message.path, value: message.value });
      }
      return;
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[control-plane] listening on :${PORT}`);
});
