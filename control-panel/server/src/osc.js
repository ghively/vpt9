import dgram from "node:dgram";

// Minimal OSC 1.0 UDP listener — no dependencies. Supports the argument types a
// control surface actually sends (f/i/s/d/T/F) and unwraps #bundle packets. This is
// the modern stand-in for VPT8's OSC control surface: any OSC sender on the LAN
// (TouchOSC, QLab, SuperCollider, ...) can drive state paths directly — the address
// "/layers/layer-1/opacity" maps to the dotted path "layers.layer-1.opacity".

function readPaddedString(buf, offset) {
  const end = buf.indexOf(0, offset);
  if (end === -1) return null;
  const str = buf.toString("ascii", offset, end);
  // OSC strings are null-terminated then padded to a 4-byte boundary.
  const next = offset + Math.ceil((end - offset + 1) / 4) * 4;
  return { str, next };
}

// Encode one OSC string: the ascii bytes, a null terminator, then zero-padding to the
// next 4-byte boundary (Buffer.alloc zero-fills, so the terminator + padding come free).
// The inverse of readPaddedString — same wire format both directions.
function encodePaddedString(str) {
  const bytes = Buffer.from(String(str), "ascii");
  const padded = Math.ceil((bytes.length + 1) / 4) * 4; // +1 = mandatory null terminator
  const out = Buffer.alloc(padded);
  bytes.copy(out, 0);
  return out;
}

// Encode an OSC 1.0 message: a null-padded address, a "," type-tag string (also padded),
// then the 4-byte-aligned args. Supports the scalar/string types this app mirrors out:
// number → int32 ("i") when integral else float32 ("f"), string → "s", boolean → int32
// 0/1 ("i", OSC-1.0-safe). `forceFloat` sends every number as float32 ("f") regardless of
// integrality — the state mirror uses it so a numeric leaf that momentarily lands on a
// whole number (e.g. opacity 1.0) never flips its wire type from float to int mid-drag.
// null/undefined/object args are skipped (no tag, no bytes) to keep alignment intact.
export function encodeMessage(address, args = [], { forceFloat = false } = {}) {
  if (typeof address !== "string" || !address.startsWith("/")) {
    throw new Error(`OSC address must be a string starting with "/": ${address}`);
  }
  let typetags = ",";
  const argBuffers = [];
  const int32 = (n) => {
    const b = Buffer.alloc(4);
    b.writeInt32BE(n | 0);
    return b;
  };
  const float32 = (n) => {
    const b = Buffer.alloc(4);
    b.writeFloatBE(n);
    return b;
  };
  for (const arg of args ?? []) {
    if (typeof arg === "boolean") {
      typetags += "i";
      argBuffers.push(int32(arg ? 1 : 0));
    } else if (typeof arg === "number" && Number.isFinite(arg)) {
      if (!forceFloat && Number.isInteger(arg)) {
        typetags += "i";
        argBuffers.push(int32(arg));
      } else {
        typetags += "f";
        argBuffers.push(float32(arg));
      }
    } else if (typeof arg === "string") {
      typetags += "s";
      argBuffers.push(encodePaddedString(arg));
    }
    // else: unsupported (null/undefined/object/NaN) — skip to preserve arg alignment.
  }
  return Buffer.concat([encodePaddedString(address), encodePaddedString(typetags), ...argBuffers]);
}

function parseMessage(buf) {
  const addr = readPaddedString(buf, 0);
  if (!addr || !addr.str.startsWith("/")) return null;
  const tags = readPaddedString(buf, addr.next);
  if (!tags || !tags.str.startsWith(",")) return { address: addr.str, args: [] };

  const args = [];
  let offset = tags.next;
  for (const tag of tags.str.slice(1)) {
    switch (tag) {
      case "f":
        args.push(buf.readFloatBE(offset));
        offset += 4;
        break;
      case "i":
        args.push(buf.readInt32BE(offset));
        offset += 4;
        break;
      case "d":
        args.push(buf.readDoubleBE(offset));
        offset += 8;
        break;
      case "s": {
        const s = readPaddedString(buf, offset);
        if (!s) return { address: addr.str, args };
        args.push(s.str);
        offset = s.next;
        break;
      }
      case "T":
        args.push(true);
        break;
      case "F":
        args.push(false);
        break;
      default:
        // Unknown tag: bail on further args (we can't know their width) but keep
        // what parsed so far — enough for the single-argument messages we serve.
        return { address: addr.str, args };
    }
  }
  return { address: addr.str, args };
}

// Returns every OSC message in the datagram (a bare message, or a #bundle's contents —
// bundles nest, so recurse).
export function parsePacket(buf) {
  if (buf.length >= 8 && buf.toString("ascii", 0, 7) === "#bundle") {
    const messages = [];
    let offset = 16; // "#bundle\0" + 8-byte timetag (ignored: we apply immediately)
    while (offset + 4 <= buf.length) {
      const size = buf.readInt32BE(offset);
      offset += 4;
      if (size <= 0 || offset + size > buf.length) break;
      messages.push(...parsePacket(buf.subarray(offset, offset + size)));
      offset += size;
    }
    return messages;
  }
  const message = parseMessage(buf);
  return message ? [message] : [];
}

// handle(address, args) receives each decoded message; the caller (index.js) owns the
// address → state-path / transport-command routing.
export function startOsc({ port, handle, log = console.log, warn = console.warn }) {
  const socket = dgram.createSocket("udp4");
  let lastWarnAt = 0;

  socket.on("message", (buf) => {
    let messages;
    try {
      messages = parsePacket(buf);
    } catch (err) {
      // Malformed datagram: defensible to drop (untrusted LAN senders), but silent
      // forever makes "why isn't OSC landing" hard to debug — warn, rate-limited.
      const now = Date.now();
      if (now - lastWarnAt >= 1000) {
        lastWarnAt = now;
        warn("[osc] dropped malformed datagram:", err.message);
      }
      return;
    }
    for (const { address, args } of messages) handle(address, args);
  });

  socket.on("error", (err) => log("[osc] socket error:", err.message));

  socket.bind(port, () => {
    log(`[osc] listening on udp :${port}`);
  });

  return () => socket.close();
}
