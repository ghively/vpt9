import { useCallback, useEffect, useRef } from "react";
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
  onBatch: (updates: Array<{ path: string; value: unknown }>) => void;
  onPreview: (screenId: string, frame: string) => void;
  onStatus: (status: ConnectionState, url: string) => void;
}

/** Connects to the control-plane WebSocket and routes messages to the handlers. Handlers
 *  are read through a ref so the socket isn't torn down when they change identity.
 *  Auto-reconnects with capped backoff — the server re-sends the full state snapshot on
 *  every (re)connect, so recovery needs no extra sync. */
export function useSocket(url: string, handlers: SocketHandlers): { send: (message: SocketMessage) => void } {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const sendRef = useRef<(message: SocketMessage) => void>(() => {});

  useEffect(() => {
    let socket: WebSocket | null = null;
    let attempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(url);
      const h = () => handlersRef.current;

      socket.addEventListener("open", () => {
        attempts = 0;
        h().onStatus("connected", url);
      });
      socket.addEventListener("close", () => {
        if (disposed) return;
        h().onStatus("disconnected", url);
        const delay = Math.min(500 * 2 ** attempts, 5000);
        attempts += 1;
        reconnectTimer = setTimeout(connect, delay);
      });
      socket.addEventListener("error", () => h().onStatus("error", url));
      socket.addEventListener("message", (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        if (message.type === "state") h().onState(message.state);
        else if (message.type === "update") h().onUpdate(message.path, message.value);
        else if (message.type === "create") h().onCreate(message.path, message.key, message.value);
        else if (message.type === "delete") h().onDelete(message.path);
        else if (message.type === "batch") h().onBatch(message.updates);
        else if (message.type === "preview") h().onPreview(message.screenId, message.frame);
      });
    };

    connect();

    sendRef.current = (message) => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    };

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [url]);

  // Stable identity across renders (sendRef itself never changes) — consumers like
  // useMidi depend on `send` in an effect's dependency array, and an unstable
  // reference here would tear that effect down and re-run it on every render (up to
  // 30x/sec while an LFO/fade is broadcasting `batch` updates).
  const send = useCallback((message: SocketMessage) => sendRef.current(message), []);

  return { send };
}
