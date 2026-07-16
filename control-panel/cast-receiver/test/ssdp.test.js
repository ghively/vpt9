import { test } from "node:test";
import assert from "node:assert/strict";
import dgram from "node:dgram";
import { once } from "node:events";
import { startSsdp } from "../src/ssdp.js";

// Verifies the SSDP discovery responder (src/ssdp.js) — the mechanism a phone's YouTube app
// uses to FIND this DIAL device before it ever POSTs a launch. An M-SEARCH for the DIAL
// service type must get an HTTP/1.1 200 OK carrying LOCATION (the dd.xml url) and a USN built
// from the device uuid. This is the discovery half of D3, exercisable without a real phone;
// only a real device's actual discovery/launch flow is the irreducible remainder.

const DIAL_ST = "urn:dial-multiscreen-org:service:dial:1";

function sendMSearch(client, st) {
  const msg = Buffer.from(
    [
      "M-SEARCH * HTTP/1.1",
      "HOST: 239.255.255.250:1900",
      'MAN: "ssdp:discover"',
      "MX: 1",
      `ST: ${st}`,
      "",
      "",
    ].join("\r\n"),
  );
  client.send(msg, 1900, "127.0.0.1");
}

test("SSDP responder answers an M-SEARCH for the DIAL service with LOCATION + USN", async () => {
  const stop = startSsdp({ deviceUrl: "http://10.0.0.7:8090", uuid: "test-uuid-123", log: () => {} });
  const client = dgram.createSocket({ type: "udp4", reuseAddr: true });
  try {
    // Bind the client so the responder has a concrete address:port to reply to.
    client.bind(0, "127.0.0.1");
    await once(client, "listening");

    const recv = once(client, "message");
    sendMSearch(client, DIAL_ST);
    const [buf] = await Promise.race([
      recv,
      new Promise((_, rej) => setTimeout(() => rej(new Error("no SSDP response within 2s")), 2000)),
    ]);
    const text = buf.toString("utf8");
    assert.match(text, /^HTTP\/1\.1 200 OK/, "must be a 200 OK search response");
    assert.match(text, /LOCATION: http:\/\/10\.0\.0\.7:8090\/dd\.xml/, "carries the dd.xml location");
    assert.match(text, /ST: urn:dial-multiscreen-org:service:dial:1/);
    assert.match(text, /USN: uuid:test-uuid-123::urn:dial-multiscreen-org:service:dial:1/);
  } finally {
    client.close();
    stop();
  }
});

test("SSDP responder ignores an M-SEARCH for an unrelated service type", async () => {
  const stop = startSsdp({ deviceUrl: "http://10.0.0.7:8090", uuid: "test-uuid-123", log: () => {} });
  const client = dgram.createSocket({ type: "udp4", reuseAddr: true });
  try {
    client.bind(0, "127.0.0.1");
    await once(client, "listening");

    let got = null;
    client.on("message", (b) => { got = b; });
    sendMSearch(client, "urn:some-other-org:service:printer:1");
    await new Promise((r) => setTimeout(r, 600)); // give it a beat to (not) respond
    assert.equal(got, null, "must NOT respond to an unrelated ST");
  } finally {
    client.close();
    stop();
  }
});
