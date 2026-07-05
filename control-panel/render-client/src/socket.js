// Control-plane connection with auto-reconnect: a projector machine must survive a
// control-plane restart without anyone walking over to reload the browser. The server
// re-sends the full state snapshot on every (re)connect, so recovery needs no extra
// sync protocol. Returns a handle whose send() silently drops while disconnected.
export function connectControlPlane(url, { onState, onUpdate, onCreate, onDelete, onBatch, onStatus }) {
  let socket = null;
  let attempts = 0;

  function connect() {
    socket = new WebSocket(url);

    socket.addEventListener("open", () => {
      attempts = 0;
      onStatus?.("connected");
    });
    socket.addEventListener("close", () => {
      onStatus?.("disconnected");
      // Capped exponential backoff: 0.5s, 1s, 2s, 4s, then every 5s.
      const delay = Math.min(500 * 2 ** attempts, 5000);
      attempts += 1;
      setTimeout(connect, delay);
    });
    socket.addEventListener("error", () => onStatus?.("error"));

    socket.addEventListener("message", (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.type === "state") onState(message.state);
      else if (message.type === "update") onUpdate(message.path, message.value);
      else if (message.type === "create") onCreate?.(message.path, message.key, message.value);
      else if (message.type === "delete") onDelete?.(message.path);
      else if (message.type === "batch") onBatch?.(message.updates);
    });
  }

  connect();

  return {
    get readyState() {
      return socket.readyState;
    },
    send(payload) {
      if (socket.readyState === WebSocket.OPEN) socket.send(payload);
    },
  };
}
