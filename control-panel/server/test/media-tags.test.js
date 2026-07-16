import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, copyFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileTags, writeFileTags, exiftoolAvailable } from "../src/media-tags.js";

// Tags-in-the-file (owner decision 2026-07-16): XMP-dc:Subject keywords embedded via
// exiftool are the durable tag store; state.json is only the runtime index. These
// round-trip against the real e2e fixtures (a real gif + a real mp4 — exiftool refuses
// junk bytes, which is the point: the store is the actual media file).

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "..", "e2e", "fixtures");
const HAVE_EXIFTOOL = await exiftoolAvailable();

function withCopy(fixture, run) {
  return async () => {
    const dir = mkdtempSync(join(tmpdir(), "vpt-tags-test-"));
    const file = join(dir, fixture.replace("media-fixture", "media-copy"));
    copyFileSync(join(FIXTURES, fixture), file);
    try {
      await run(file, dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

for (const fixture of ["media-fixture-blink.gif", "media-fixture-clip.mp4"]) {
  test(`tags round-trip through ${fixture.split(".").pop()} XMP (write, read back, no backup litter)`, { skip: !HAVE_EXIFTOOL || !existsSync(join(FIXTURES, fixture)) }, withCopy(fixture, async (file, dir) => {
    assert.deepEqual(await readFileTags(file), [], "fixture starts untagged");
    assert.equal(await writeFileTags(file, ["space", "Night Sky", " loop "]), true);
    assert.deepEqual(await readFileTags(file), ["space", "Night Sky", "loop"]);
    // replace, not append
    assert.equal(await writeFileTags(file, ["calm"]), true);
    assert.deepEqual(await readFileTags(file), ["calm"]);
    // clearing works and -overwrite_original leaves no `_original` backups behind
    assert.equal(await writeFileTags(file, []), true);
    assert.deepEqual(await readFileTags(file), []);
    assert.deepEqual(readdirSync(dir).filter((f) => f.includes("_original")), []);
  }));
}

test("readFileTags returns [] for a file exiftool can't parse (never breaks an upload)", { skip: !HAVE_EXIFTOOL }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "vpt-tags-test-"));
  try {
    const junk = join(dir, "media-junk.mp4");
    const { writeFileSync } = await import("node:fs");
    writeFileSync(junk, Buffer.from([1, 2, 3]));
    assert.deepEqual(await readFileTags(junk), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
