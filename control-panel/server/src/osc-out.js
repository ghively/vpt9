import dgram from "node:dgram";
import { encodeMessage } from "./osc.js";

// OSC OUTPUT / state mirroring (task A17) — the send-side counterpart to osc.js's
// receive-only listener. Two jobs:
//   1. `observe(message)` mirrors every scalar leaf change the control plane broadcasts
//      (WS "update" / automation "batch") out as an OSC message to a configurable host/
//      port, so external gear (lighting desks, other VJ apps, TouchOSC feedback) can
//      follow the show. THROTTLED: changes are coalesced per-path and flushed on a short
//      timer, so a fader drag emitting 100 updates/sec never floods the wire.
//   2. `sendRaw(address, args)` fires one explicit OSC message immediately — the `osc`
//      cue type's payload.
//
// `enabled` gates the continuous mirror only; an explicit `sendRaw` (a cue the operator
// deliberately placed) fires whenever a valid destination host/port exists. The real UDP
// socket is created lazily; tests inject a fake `send` to assert on the bytes without a
// live listener.

// Reverse of osc.js's incoming map (address → dotted path): a dotted state path becomes
// an OSC address, so "layers.layer-1.opacity" → "/layers/layer-1/opacity".
export function pathToOscAddress(path) {
  return "/" + String(path).replaceAll(".", "/");
}

export function createOscOut({ state, send, log = console.log, flushMs = 25 } = {}) {
  let socket = null;
  const realSend = (buf, port, host) => {
    if (!socket) {
      socket = dgram.createSocket("udp4");
      // A dgram socket emits async, socket-level 'error' events (network unreachable, a
      // permission error) OUT OF BAND from the per-send callback below. An 'error' event
      // with no listener is thrown as an uncaughtException — mirror osc.js's receive socket
      // and swallow-with-log so the OSC-out path can never crash the control plane.
      socket.on("error", (err) => log("[osc-out] socket error:", err.message));
    }
    socket.send(buf, port, host, (err) => {
      if (err) log("[osc-out] send error:", err.message);
    });
  };
  const sendFn = typeof send === "function" ? send : realSend;

  const pending = new Map(); // dotted path -> latest value (coalesced; last write wins)
  let flushTimer = null;

  // A valid destination { host, port } (ignores `enabled`), or null. Reads defensively —
  // a LAN client can set oscOut.port to any JSON; only a sane integer port is honored.
  function destination() {
    const c = state?.oscOut;
    if (!c || typeof c !== "object") return null;
    const port = Number(c.port);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;
    const host = typeof c.host === "string" && c.host ? c.host : "127.0.0.1";
    return { host, port };
  }

  // Destination only when continuous mirroring is enabled.
  function mirrorTarget() {
    if (!state?.oscOut?.enabled) return null;
    return destination();
  }

  function emit(address, args, opts, target) {
    let buf;
    try {
      buf = encodeMessage(address, args, opts);
    } catch (err) {
      log("[osc-out] encode error:", err.message);
      return;
    }
    sendFn(buf, target.port, target.host);
  }

  function flush() {
    flushTimer = null;
    const target = mirrorTarget();
    if (!target) {
      pending.clear();
      return;
    }
    for (const [path, value] of pending) {
      const opts = typeof value === "number" ? { forceFloat: true } : undefined;
      emit(pathToOscAddress(path), [value], opts, target);
    }
    pending.clear();
  }

  // Queue one leaf change for the next flush. Only scalar leaves mirror — objects/arrays
  // are structural (a wholesale source/warp swap) and have no single OSC value.
  function mirror(path, value) {
    if (!mirrorTarget()) return;
    if (typeof path !== "string" || !path) return;
    const t = typeof value;
    if (t !== "number" && t !== "string" && t !== "boolean") return;
    pending.set(path, value);
    if (flushTimer == null) {
      flushTimer = setTimeout(flush, flushMs);
      flushTimer.unref?.(); // never hold the event loop open for a pending flush
    }
  }

  // Broadcast interceptor: mirror the two message shapes that carry leaf changes.
  function observe(message) {
    if (!message || !mirrorTarget()) return;
    if (message.type === "update") {
      mirror(message.path, message.value);
    } else if (message.type === "batch") {
      for (const u of message.updates ?? []) mirror(u?.path, u?.value);
    }
  }

  // Explicit one-shot send (the `osc` cue). Fires whenever a destination is configured,
  // independent of the `enabled` mirror gate. Returns whether it went out.
  function sendRaw(address, args = []) {
    const target = destination();
    if (!target) return false;
    if (typeof address !== "string" || !address.startsWith("/")) return false;
    emit(address, Array.isArray(args) ? args : [], undefined, target);
    return true;
  }

  return {
    observe,
    mirror,
    sendRaw,
    flush,
    pathToOscAddress,
    dispose() {
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = null;
      if (socket) socket.close();
      socket = null;
    },
  };
}
