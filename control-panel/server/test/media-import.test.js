import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMediaImporter } from "../src/media-import.js";

function makeHarness({ fetchImpl, ytDlpBin, maxBytes = 1024 * 1024 } = {}) {
  const mediaDir = mkdtempSync(join(tmpdir(), "vpt-import-test-"));
  const state = { media: {} };
  const broadcasts = [];
  const importer = createMediaImporter({
    mediaDir,
    state,
    broadcast: (m) => broadcasts.push(m),
    scheduleSave: () => {},
    maxBytes,
    ytDlpBin,
    fetchImpl,
  });
  return { mediaDir, state, broadcasts, importer, cleanup: () => rmSync(mediaDir, { recursive: true, force: true }) };
}

// A minimal fetch stub: ok + async-iterable body, the only surface directDownload uses.
function fakeFetch(bytes, { ok = true, status = 200 } = {}) {
  return async () => ({
    ok,
    status,
    body: (async function* () {
      yield Buffer.from(bytes);
    })(),
  });
}

test("direct .mp4 link downloads into the library through the normal create path", async () => {
  const h = makeHarness({ fetchImpl: fakeFetch("fake-mp4-bytes") });
  try {
    const entry = await h.importer.importUrl("http://example.test/clips/sunset%20loop.mp4");
    assert.equal(entry.kind, "video");
    assert.equal(entry.name, "sunset loop.mp4", "name decoded from the url path");
    assert.match(entry.filename, /^media-[a-f0-9]+\.mp4$/);
    assert.equal(readFileSync(join(h.mediaDir, entry.filename), "utf8"), "fake-mp4-bytes");
    assert.equal(h.state.media[entry.id], entry, "entered shared state");
    const types = h.broadcasts.map((b) => `${b.type}${b.status ? ":" + b.status : ""}`);
    assert.deepEqual(types, ["mediaImportStatus:downloading", "create", "mediaImportStatus:done"]);
    assert.equal(readdirSync(h.mediaDir).length, 1, "no temp files left behind");
  } finally {
    h.cleanup();
  }
});

test("oversize direct download aborts, cleans up, and broadcasts an error status", async () => {
  const h = makeHarness({ fetchImpl: fakeFetch(Buffer.alloc(64)), maxBytes: 16 });
  try {
    await assert.rejects(() => h.importer.importUrl("http://example.test/big.mp4"), /exceeds/);
    assert.deepEqual(h.state.media, {}, "nothing entered state");
    assert.equal(readdirSync(h.mediaDir).length, 0, "partial file removed");
    assert.equal(h.broadcasts.at(-1).status, "error");
  } finally {
    h.cleanup();
  }
});

test("non-http and garbage urls are rejected before any download", async () => {
  const h = makeHarness({ fetchImpl: fakeFetch("x") });
  try {
    await assert.rejects(() => h.importer.importUrl("file:///etc/passwd"), /http\(s\)/);
    await assert.rejects(() => h.importer.importUrl("not a url"), /valid link/);
    assert.deepEqual(h.state.media, {});
  } finally {
    h.cleanup();
  }
});

test("a streaming-site url routes to yt-dlp; a missing binary reports an actionable error", async () => {
  const h = makeHarness({ ytDlpBin: "vpt-test-definitely-not-installed" });
  try {
    await assert.rejects(
      () => h.importer.importUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      /yt-dlp is not installed/,
    );
    assert.equal(h.broadcasts.at(-1).status, "error");
    assert.match(h.broadcasts.at(-1).error, /yt-dlp/);
  } finally {
    h.cleanup();
  }
});

test("a fake yt-dlp binary produces a library entry named after the printed title", async () => {
  // Shell shim standing in for yt-dlp: finds its "-o" target, writes the file, prints
  // the title on stdout, exits 0 — exercises the spawn/close/finalize path without the
  // real binary or any network.
  const dir = mkdtempSync(join(tmpdir(), "vpt-fake-ytdlp-"));
  const bin = join(dir, "fake-yt-dlp");
  writeFileSync(
    bin,
    `#!/bin/sh
out=""
prev=""
for a in "$@"; do
  if [ "$prev" = "-o" ]; then out="$a"; fi
  prev="$a"
done
printf 'fake-video' > "$out"
echo "Test Clip Title"
`,
    { mode: 0o755 },
  );
  const h = makeHarness({ ytDlpBin: bin });
  try {
    const entry = await h.importer.importUrl("https://www.youtube.com/watch?v=abc123xyz00");
    assert.equal(entry.name, "Test Clip Title.mp4");
    assert.equal(entry.kind, "video");
    assert.equal(readFileSync(join(h.mediaDir, entry.filename), "utf8"), "fake-video");
    assert.equal(h.broadcasts.at(-1).status, "done");
    assert.equal(readdirSync(h.mediaDir).length, 1, "temp renamed into place, nothing left over");
  } finally {
    rmSync(dir, { recursive: true, force: true });
    h.cleanup();
  }
});
