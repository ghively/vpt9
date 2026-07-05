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
export function startOsc({ port, handle, log = console.log }) {
  const socket = dgram.createSocket("udp4");

  socket.on("message", (buf) => {
    let messages;
    try {
      messages = parsePacket(buf);
    } catch {
      return; // malformed datagram: not our problem
    }
    for (const { address, args } of messages) handle(address, args);
  });

  socket.on("error", (err) => log("[osc] socket error:", err.message));

  socket.bind(port, () => {
    log(`[osc] listening on udp :${port}`);
  });

  return () => socket.close();
}
