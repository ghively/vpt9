import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMediaRouter } from "../src/media.js";

// Spin the router behind a throwaway http server on an ephemeral port so we exercise the
// real streaming/Range/CORS paths over the wire (index.js auto-listens on import, so we
// wrap the router directly instead).
function withServer(run, { maxBytes } = {}) {
  return async () => {
    const dir = mkdtempSync(join(tmpdir(), "vpt-media-test-"));
    const state = { media: {} };
    const broadcasts = [];
    const router = createMediaRouter({
      mediaDir: dir,
      state,
      broadcast: (m) => broadcasts.push(m),
      scheduleSave: () => {},
      maxBytes,
    });
    const server = createServer(async (req, res) => {
      if (await router.handle(req, res)) return;
      res.writeHead(404);
      res.end();
    });
    await new Promise((r) => server.listen(0, r));
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
      await run({ base, state, broadcasts, dir });
    } finally {
      server.close();
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

async function upload(base, name, bytes) {
  return fetch(`${base}/api/media`, {
    method: "POST",
    headers: { "X-File-Name": name },
    body: Buffer.from(bytes),
  });
}

for (const [name, kind, contentType] of [
  ["clip.mp4", "video", "video/mp4"],
  ["anim.gif", "gif", "image/gif"],
  ["still.jpg", "image", "image/jpeg"],
  ["photo.jpeg", "image", "image/jpeg"],
]) {
  test(`upload ${name} succeeds with kind=${kind} and serves with ${contentType}`, withServer(async ({ base, state, broadcasts }) => {
    const res = await upload(base, name, "hello-bytes");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.media.kind, kind);
    // Landed in state and broadcast a create.
    assert.equal(state.media[body.media.id].kind, kind);
    assert.ok(broadcasts.some((m) => m.type === "create" && m.path === "media" && m.key === body.media.id));
    // Served back with the right Content-Type + CORS + Accept-Ranges.
    const get = await fetch(`${base}/media/${body.media.filename}`);
    assert.equal(get.status, 200);
    assert.equal(get.headers.get("content-type"), contentType);
    assert.equal(get.headers.get("access-control-allow-origin"), "*");
    assert.equal(get.headers.get("accept-ranges"), "bytes");
    assert.equal(await get.text(), "hello-bytes");
  }));
}

test("upload rejects an unrecognized extension with 400", withServer(async ({ base, state }) => {
  const res = await upload(base, "notes.txt", "nope");
  assert.equal(res.status, 400);
  assert.deepEqual(state.media, {});
}));

test("upload rejects an oversize file with 413 and leaves no partial file", withServer(async ({ base, state, dir }) => {
  const res = await upload(base, "big.mp4", "0123456789"); // 10 bytes > 4-byte cap
  assert.equal(res.status, 413);
  assert.deepEqual(state.media, {});
  assert.deepEqual(readdirSync(dir), []); // partial file cleaned up
}, { maxBytes: 4 }));

test("GET supports a Range request (206 + Content-Range)", withServer(async ({ base }) => {
  const up = await (await upload(base, "clip.mp4", "abcdefghij")).json();
  const res = await fetch(`${base}/media/${up.media.filename}`, { headers: { Range: "bytes=2-5" } });
  assert.equal(res.status, 206);
  assert.equal(res.headers.get("content-range"), "bytes 2-5/10");
  assert.equal(await res.text(), "cdef");
}));

test("GET rejects a filename that fails the safe pattern with 404", withServer(async ({ base }) => {
  const res = await fetch(`${base}/media/${encodeURIComponent("../../etc/passwd")}`);
  assert.equal(res.status, 404);
}));

test("DELETE removes both the file and the state entry and broadcasts delete", withServer(async ({ base, state, broadcasts, dir }) => {
  const up = await (await upload(base, "clip.mp4", "bye")).json();
  const id = up.media.id;
  assert.ok(existsSync(join(dir, up.media.filename)));
  const res = await fetch(`${base}/api/media/${id}`, { method: "DELETE" });
  assert.equal(res.status, 200);
  assert.equal(state.media[id], undefined);
  assert.equal(existsSync(join(dir, up.media.filename)), false);
  assert.ok(broadcasts.some((m) => m.type === "delete" && m.path === `media.${id}`));
}));

test("DELETE of an unknown id is a 404", withServer(async ({ base }) => {
  const res = await fetch(`${base}/api/media/media-nope`, { method: "DELETE" });
  assert.equal(res.status, 404);
}));
