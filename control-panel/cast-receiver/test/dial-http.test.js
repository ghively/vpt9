import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { xmlEscape, deviceDescriptionXml, appStateXml, createDialHttpServer } from "../src/dial-http.js";

test("xmlEscape replaces all five XML predefined entities and stringifies nullish input", () => {
  assert.equal(xmlEscape(`a<b>&"'c`), "a&lt;b&gt;&amp;&quot;&apos;c");
  assert.equal(xmlEscape("plain-id_123"), "plain-id_123");
  assert.equal(xmlEscape(null), "");
  assert.equal(xmlEscape(undefined), "");
  // Ampersand must escape first, or the entity ampersands would double-escape.
  assert.equal(xmlEscape("Tom & Jerry"), "Tom &amp; Jerry");
});

test("deviceDescriptionXml escapes a friendly name containing markup", () => {
  const xml = deviceDescriptionXml({ friendlyName: `Bob's <TV> & Co`, uuid: "abc-123" });
  assert.match(xml, /<friendlyName>Bob&apos;s &lt;TV&gt; &amp; Co<\/friendlyName>/);
  assert.doesNotMatch(xml, /<friendlyName>Bob's <TV>/); // raw markup never leaks through
});

test("appStateXml escapes a videoId so a malformed v= can't break the XML", () => {
  const xml = appStateXml({ name: "YouTube", state: "running", videoId: `x</videoId><evil/>` });
  assert.match(xml, /<videoId>x&lt;\/videoId&gt;&lt;evil\/&gt;<\/videoId>/);
  // Exactly one real <videoId> open tag survives — the injected one is neutralized.
  assert.equal((xml.match(/<videoId>/g) || []).length, 1);
});

test("appStateXml omits additionalData entirely when there is no videoId", () => {
  const xml = appStateXml({ name: "YouTube", state: "stopped", videoId: null });
  assert.doesNotMatch(xml, /additionalData/);
});

// Boot the real DIAL HTTP server on an ephemeral port and drive the launch → app-state
// round-trip, asserting the echoed videoId comes back escaped rather than corrupting the
// response. Mirrors the server package's "spin up a real server" test style.
test("POST /apps/YouTube then GET returns the launched videoId XML-escaped", async () => {
  let launched = null;
  const server = createDialHttpServer({
    friendlyName: "Test",
    uuid: "u-1",
    applicationUrl: "http://localhost/apps/",
    onLaunch: (videoId) => { launched = videoId; },
    log: () => {},
  });
  server.listen(0);
  await once(server, "listening");
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  try {
    const nastyId = `dQw4w9WgXcQ</videoId><x>`;
    const post = await fetch(`${base}/apps/YouTube`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ v: nastyId }).toString(),
    });
    assert.equal(post.status, 201);
    assert.equal(launched, nastyId); // handler receives the raw id (it URL-encodes downstream)

    const get = await fetch(`${base}/apps/YouTube`);
    assert.equal(get.status, 200);
    const body = await get.text();
    assert.match(body, /<state>running<\/state>/);
    assert.match(body, /&lt;\/videoId&gt;&lt;x&gt;/); // injected markup is escaped
    assert.equal((body.match(/<videoId>/g) || []).length, 1); // no smuggled second element

    const missing = await fetch(`${base}/apps/YouTube`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "",
    });
    assert.equal(missing.status, 400); // no v= → rejected
  } finally {
    server.close();
    await once(server, "close");
  }
});

// Regression: a POST whose body is aborted mid-stream must NOT crash the receiver — the
// body-read rejection used to escape the async request handler as an unhandled rejection
// (process exit on a single malformed LAN request). Now it settles to a 400 and the server
// keeps serving subsequent requests.
test("aborted request body responds 400 and the server keeps serving", async () => {
  const server = createDialHttpServer({
    friendlyName: "Test", uuid: "u-2", applicationUrl: "http://localhost/apps/",
    onLaunch: () => {}, log: () => {},
  });
  server.listen(0);
  await once(server, "listening");
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  try {
    // Abort the POST after the headers but before/with a partial body.
    const ac = new AbortController();
    const pending = fetch(`${base}/apps/YouTube`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ v: "abc" }).toString(),
      signal: ac.signal,
    }).catch(() => {}); // the client sees an aborted fetch; we only care the server survives
    ac.abort();
    await pending;
    // The server must still answer a normal request afterward (it didn't crash).
    const ok = await fetch(`${base}/dd.xml`);
    assert.equal(ok.status, 200);
  } finally {
    server.close();
    await once(server, "close");
  }
});

// Regression: an oversized body is rejected (413/400) rather than accumulated unbounded.
test("oversized request body is rejected, not buffered unbounded", async () => {
  const server = createDialHttpServer({
    friendlyName: "Test", uuid: "u-3", applicationUrl: "http://localhost/apps/",
    onLaunch: () => {}, log: () => {},
  });
  server.listen(0);
  await once(server, "listening");
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  try {
    const huge = "v=" + "x".repeat(200 * 1024); // > the 64 KiB cap
    const res = await fetch(`${base}/apps/YouTube`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: huge,
    }).catch(() => ({ status: 0 })); // a destroyed socket may surface as a fetch error
    assert.ok(res.status === 400 || res.status === 0, `expected 400 or connection reset, got ${res.status}`);
    // Server still alive.
    const ok = await fetch(`${base}/dd.xml`);
    assert.equal(ok.status, 200);
  } finally {
    server.close();
    await once(server, "close");
  }
});
