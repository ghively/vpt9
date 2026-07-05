import { useEffect, useRef } from "react";
import type { ConnectionState } from "../components/types";
import type { PanelState } from "./store";

export interface SocketMessage {
  type: string;
  [key: string]: unknown;
}

export interface SocketHandlers {
  onState: (state: PanelState) => void;
  onUpdate: (path: string, value: unknown) => void;
  onCreate: (path: string, key: string, value: unknown) => void;
  onDelete: (path: string) => void;
  onPreview: (screenId: string, frame: string) => void;
  onStatus: (status: ConnectionState, url: string) => void;
}

/** Connects to the control-plane WebSocket and routes messages to the handlers. Handlers
 *  are read through a ref so the socket isn't torn down when they change identity. */
export function useSocket(url: string, handlers: SocketHandlers): { send: (message: SocketMessage) => void } {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const sendRef = useRef<(message: SocketMessage) => void>(() => {});

  useEffect(() => {
    const socket = new WebSocket(url);
    const h = () => handlersRef.current;

    socket.addEventListener("open", () => h().onStatus("connected", url));
    socket.addEventListener("close", () => h().onStatus("disconnected", url));
    socket.addEventListener("error", () => h().onStatus("error", url));
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "state") h().onState(message.state);
      else if (message.type === "update") h().onUpdate(message.path, message.value);
      else if (message.type === "create") h().onCreate(message.path, message.key, message.value);
      else if (message.type === "delete") h().onDelete(message.path);
      else if (message.type === "preview") h().onPreview(message.screenId, message.frame);
    });

    sendRef.current = (message) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    };

    return () => socket.close();
  }, [url]);

  return { send: (message) => sendRef.current(message) };
}
