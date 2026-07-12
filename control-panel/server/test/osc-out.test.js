import { test } from "node:test";
import assert from "node:assert/strict";
import { createOscOut, pathToOscAddress } from "../src/osc-out.js";
import { parsePacket } from "../src/osc.js";

// OSC OUTPUT / state mirroring (task A17). The send socket is injected as a spy so these
// tests assert on the exact bytes/host/port without binding a real UDP listener.
function makeOut(oscOut, flushMs = 1000) {
  const sent = [];
  const state = { oscOut };
  const out = createOscOut({ state, send: (buf, port, host) => sent.push({ buf, port, host }), log: () => {}, flushMs });
  return { out, sent, state };
}

test("pathToOscAddress maps a dotted path to an OSC address", () => {
  assert.equal(pathToOscAddress("layers.layer-1.opacity"), "/layers/layer-1/opacity");
  assert.equal(pathToOscAddress("master"), "/master");
});

test("mirror + flush sends the changed leaf to the configured host:port as a float", () => {
  const { out, sent } = makeOut({ enabled: true, host: "10.0.0.9", port: 9001 });
  out.mirror("layers.layer-1.opacity", 0.82);
  assert.equal(sent.length, 0, "coalesced — nothing sent until flush");
  out.flush();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].host, "10.0.0.9");
  assert.equal(sent[0].port, 9001);
  const [msg] = parsePacket(sent[0].buf);
  assert.equal(msg.address, "/layers/layer-1/opacity");
  assert.ok(Math.abs(msg.args[0] - 0.82) < 1e-6);
  out.dispose();
});

test("a whole-number leaf still mirrors as a float (forceFloat), never flipping wire type", () => {
  const { out, sent } = makeOut({ enabled: true, host: "127.0.0.1", port: 9001 });
  out.mirror("m", 1); // "/m" → 4-byte address, so the type-tag string starts at byte 4
  out.flush();
  // ",f\0\0" — byte 5 is the tag: 0x66 ('f'), not 0x69 ('i')
  assert.equal(sent[0].buf[5], 0x66);
  out.dispose();
});

test("rapid changes to one path coalesce to a single send of the latest value", () => {
  const { out, sent } = makeOut({ enabled: true, host: "127.0.0.1", port: 9001 });
  for (const v of [0.1, 0.2, 0.3, 0.42]) out.mirror("master", v);
  out.flush();
  assert.equal(sent.length, 1, "a fader drag flushes once, not per change");
  const [msg] = parsePacket(sent[0].buf);
  assert.ok(Math.abs(msg.args[0] - 0.42) < 1e-6);
  out.dispose();
});

test("disabled oscOut mirrors nothing", () => {
  const { out, sent } = makeOut({ enabled: false, host: "127.0.0.1", port: 9001 });
  out.mirror("master", 0.5);
  out.flush();
  assert.equal(sent.length, 0);
  out.dispose();
});

test("mirror ignores non-scalar (object/array/null) values", () => {
  const { out, sent } = makeOut({ enabled: true, host: "127.0.0.1", port: 9001 });
  out.mirror("layers.layer-1.source", { type: "color", color: [0, 0, 0] });
  out.mirror("screens.s.warp.corners", [{ x: 0, y: 0 }]);
  out.mirror("layers.layer-1.transport.loopOut", null);
  out.flush();
  assert.equal(sent.length, 0);
  out.dispose();
});

test("mirror sends string and boolean leaves too", () => {
  const { out, sent } = makeOut({ enabled: true, host: "127.0.0.1", port: 9001 });
  out.mirror("layers.layer-1.blendMode", "screen");
  out.mirror("layers.layer-1.fx.flipH", true);
  out.flush();
  assert.equal(sent.length, 2);
  const byAddr = Object.fromEntries(sent.map((s) => [parsePacket(s.buf)[0].address, parsePacket(s.buf)[0].args[0]]));
  assert.equal(byAddr["/layers/layer-1/blendMode"], "screen");
  assert.equal(byAddr["/layers/layer-1/fx/flipH"], 1); // boolean → int 1
  out.dispose();
});

test("observe() mirrors 'update' and 'batch' broadcast messages, ignores others", () => {
  const { out, sent } = makeOut({ enabled: true, host: "127.0.0.1", port: 9001 });
  out.observe({ type: "update", path: "master", value: 0.5 });
  out.observe({ type: "batch", updates: [{ path: "layers.a.opacity", value: 0.3 }, { path: "layers.b.opacity", value: 0.6 }] });
  out.observe({ type: "state", state: {} }); // must not throw / must not mirror
  out.observe({ type: "preview", screenId: "s", frame: "x" });
  out.flush();
  assert.deepEqual(
    sent.map((s) => parsePacket(s.buf)[0].address).sort(),
    ["/layers/a/opacity", "/layers/b/opacity", "/master"],
  );
  out.dispose();
});

test("a config change to disabled between mirror and flush drops the queued sends", () => {
  const { out, sent, state } = makeOut({ enabled: true, host: "127.0.0.1", port: 9001 });
  out.mirror("master", 0.5);
  state.oscOut.enabled = false;
  out.flush();
  assert.equal(sent.length, 0);
  out.dispose();
});

test("invalid destination (bad port) mirrors nothing", () => {
  for (const port of [0, -1, 70000, "abc", null]) {
    const { out, sent } = makeOut({ enabled: true, host: "127.0.0.1", port });
    out.mirror("master", 0.5);
    out.flush();
    assert.equal(sent.length, 0, `port ${JSON.stringify(port)} should be rejected`);
    out.dispose();
  }
});

test("sendRaw fires one explicit message immediately, even when mirroring is disabled", () => {
  const { out, sent } = makeOut({ enabled: false, host: "127.0.0.1", port: 9001 });
  const ok = out.sendRaw("/cue/lights", [1, "go"]);
  assert.equal(ok, true);
  assert.equal(sent.length, 1);
  const [msg] = parsePacket(sent[0].buf);
  assert.equal(msg.address, "/cue/lights");
  assert.deepEqual(msg.args, [1, "go"]);
  out.dispose();
});

test("sendRaw returns false (no send) with no valid destination or a bad address", () => {
  const { out, sent } = makeOut({ enabled: true, host: "127.0.0.1", port: 0 });
  assert.equal(out.sendRaw("/x", [1]), false);
  assert.equal(sent.length, 0);
  out.dispose();

  const b = makeOut({ enabled: true, host: "127.0.0.1", port: 9001 });
  assert.equal(b.out.sendRaw("no-slash", [1]), false);
  assert.equal(b.sent.length, 0);
  b.out.dispose();
});

test("missing oscOut container is treated as no destination (no throw)", () => {
  const out = createOscOut({ state: {}, send: () => {}, log: () => {} });
  assert.doesNotThrow(() => out.observe({ type: "update", path: "master", value: 1 }));
  assert.equal(out.sendRaw("/x", [1]), false);
  out.dispose();
});
