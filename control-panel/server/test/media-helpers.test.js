import { test } from "node:test";
import assert from "node:assert/strict";
import { MEDIA_TYPES, SAFE_FILENAME, extOf, mediaTypeForName } from "../src/media.js";

test("extOf returns the lowercase extension without a dot", () => {
  assert.equal(extOf("Clip.MP4"), "mp4");
  assert.equal(extOf("a.b.JPG"), "jpg");
  assert.equal(extOf("noext"), "");
});

test("mediaTypeForName maps each allowed extension to kind + contentType", () => {
  assert.deepEqual(mediaTypeForName("x.mp4"), { kind: "video", contentType: "video/mp4" });
  // webm is accepted as a "video" so the camera recorder's MediaRecorder output uploads (A14b).
  assert.deepEqual(mediaTypeForName("x.webm"), { kind: "video", contentType: "video/webm" });
  assert.deepEqual(mediaTypeForName("x.gif"), { kind: "gif", contentType: "image/gif" });
  assert.deepEqual(mediaTypeForName("x.jpg"), { kind: "image", contentType: "image/jpeg" });
  assert.deepEqual(mediaTypeForName("x.JPEG"), { kind: "image", contentType: "image/jpeg" });
});

test("mediaTypeForName rejects anything not on the allowlist", () => {
  assert.equal(mediaTypeForName("x.png"), null);
  assert.equal(mediaTypeForName("x.mov"), null);
  assert.equal(mediaTypeForName("noext"), null);
});

test("SAFE_FILENAME accepts only server-generated media filenames", () => {
  assert.equal(SAFE_FILENAME.test("media-a1b2c3.mp4"), true);
  assert.equal(SAFE_FILENAME.test("media-a1b2c3.webm"), true); // A14b camera recordings
  assert.equal(SAFE_FILENAME.test("media-a1b2c3.jpeg"), true);
  assert.equal(SAFE_FILENAME.test("../etc/passwd"), false);
  assert.equal(SAFE_FILENAME.test("media-a1b2c3.png"), false);
  assert.equal(SAFE_FILENAME.test("sample.mp4"), false);
});

test("MEDIA_TYPES is the single allowlist source (exactly mp4/webm/gif/jpg/jpeg)", () => {
  assert.deepEqual(Object.keys(MEDIA_TYPES).sort(), ["gif", "jpeg", "jpg", "mp4", "webm"]);
});
