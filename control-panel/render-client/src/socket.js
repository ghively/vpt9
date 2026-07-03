export function connectControlPlane(url, { onState, onUpdate, onStatus }) {
  const socket = new WebSocket(url);

  socket.addEventListener("open", () => onStatus?.("connected"));
  socket.addEventListener("close", () => onStatus?.("disconnected"));
  socket.addEventListener("error", () => onStatus?.("error"));

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "state") onState(message.state);
    else if (message.type === "update") onUpdate(message.path, message.value);
  });

  return socket;
}
