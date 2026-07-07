import { test } from "node:test";
import assert from "node:assert/strict";
import dgram from "node:dgram";
import { parsePacket, startOsc } from "../src/osc.js";

// OSC strings are null-terminated then padded to a 4-byte boundary; numeric args are
// big-endian. Minimal builder for hand-crafting test datagrams — mirrors osc.js's own
// readPaddedString so we're testing against the real wire format, not a simplification.
function padString(str) {
  const withNul = Buffer.concat([Buffer.from(str, "ascii"), Buffer.from([0])]);
  const padded = Math.ceil(withNul.length / 4) * 4;
  return Buffer.concat([withNul, Buffer.alloc(padded - withNul.length)]);
}

function buildMessage(address, tags, argBuffers = []) {
  return Buffer.concat([padString(address), padString(`,${tags}`), ...argBuffers]);
}

function f32(n) {
  const b = Buffer.alloc(4);
  b.writeFloatBE(n);
  return b;
}
function i32(n) {
  const b = Buffer.alloc(4);
  b.writeInt32BE(n);
  return b;
}
function f64(n) {
  const b = Buffer.alloc(8);
  b.writeDoubleBE(n);
  return b;
}

test("parsePacket decodes a float-arg message", () => {
  const buf = buildMessage("/layers/layer-1/opacity", "f", [f32(0.75)]);
  const [msg] = parsePacket(buf);
  assert.equal(msg.address, "/layers/layer-1/opacity");
  assert.ok(Math.abs(msg.args[0] - 0.75) < 1e-6);
});

test("parsePacket decodes int/double/string/bool args", () => {
  const buf = buildMessage("/x", "idsTF", [i32(-7), f64(3.5), padString("hello")]);
  const [msg] = parsePacket(buf);
  assert.equal(msg.args[0], -7);
  assert.equal(msg.args[1], 3.5);
  assert.equal(msg.args[2], "hello");
  assert.equal(msg.args[3], true);
  assert.equal(msg.args[4], false);
});

test("parsePacket returns an address with no args when there's no type-tag string", () => {
  const [msg] = parsePacket(padString("/cue/go"));
  assert.equal(msg.address, "/cue/go");
  assert.deepEqual(msg.args, []);
});

test("parsePacket returns [] for a buffer with no valid OSC address", () => {
  assert.deepEqual(parsePacket(Buffer.from("not an osc packet")), []);
});

test("parsePacket recurses through a #bundle, including nested bundles", () => {
  const msgA = buildMessage("/a", "i", [i32(1)]);
  const msgB = buildMessage("/b", "i", [i32(2)]);
  const innerBundle = Buffer.concat([padString("#bundle"), Buffer.alloc(8), i32(msgB.length), msgB]);
  const outerBundle = Buffer.concat([
    padString("#bundle"),
    Buffer.alloc(8),
    i32(msgA.length),
    msgA,
    i32(innerBundle.length),
    innerBundle,
  ]);
  const messages = parsePacket(outerBundle);
  assert.deepEqual(
    messages.map((m) => m.address),
    ["/a", "/b"],
  );
});

test("parsePacket throws on a truncated numeric arg (caller, not parsePacket, is responsible for catching)", () => {
  // Type tag claims a float arg but no bytes follow — matches the real contract:
  // startOsc's socket handler catches this; parsePacket itself does not.
  assert.throws(() => parsePacket(buildMessage("/x", "f", [])));
});

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = dgram.createSocket("udp4");
    probe.on("error", reject);
    probe.bind(0, () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

test("startOsc decodes a real UDP datagram and routes it to handle()", async () => {
  const port = await getFreePort();
  const received = [];
  const stop = startOsc({ port, handle: (address, args) => received.push({ address, args }), log: () => {} });
  try {
    await new Promise((resolve) => setTimeout(resolve, 50)); // let bind land
    const sender = dgram.createSocket("udp4");
    const buf = buildMessage("/cue/go", "");
    await new Promise((resolve, reject) =>
      sender.send(buf, port, "127.0.0.1", (err) => (err ? reject(err) : resolve())),
    );
    sender.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(received.length, 1);
    assert.equal(received[0].address, "/cue/go");
  } finally {
    stop();
  }
});

test("startOsc's malformed-datagram warning is rate-limited to at most once per second under a burst", async () => {
  const port = await getFreePort();
  const warnings = [];
  const stop = startOsc({ port, handle: () => {}, log: () => {}, warn: (...args) => warnings.push(args) });
  try {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const sender = dgram.createSocket("udp4");
    // Well-formed address+tag header claiming a float arg, but with the arg bytes cut
    // off — parsePacket throws on this (see the parsePacket test above), so this is a
    // real repro of the "malformed datagram" path, not a synthetic stand-in.
    const garbage = buildMessage("/x", "f", []);
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve, reject) =>
        sender.send(garbage, port, "127.0.0.1", (err) => (err ? reject(err) : resolve())),
      );
    }
    sender.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(warnings.length, 1, "expected exactly one warning across a fast 5-datagram burst");
  } finally {
    stop();
  }
});
