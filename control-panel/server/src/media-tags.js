import { execFile } from "node:child_process";

// Tags live IN THE FILES, not (only) in state.json (owner decision 2026-07-16): the
// media library must stay portable — copy the files elsewhere, re-upload them, feed
// them from a generator — without tags living in a sidecar DB nobody migrates.
//
// Standard: XMP Dublin Core Subject (XMP-dc:Subject), THE cross-format keyword field —
// exiftool, Adobe apps, digiKam, darktable all read/write it, and it embeds cleanly in
// every format this library accepts except webm (Matroska is read-only in exiftool;
// webm — camera-recorder output — keeps state-only tags).
//
// Flow: upload/import READS embedded keywords to seed media.<id>.tags; a tag edit in
// the panel WRITES BACK to the file. state.json remains the fast runtime index; the
// file is the durable truth. Everything degrades gracefully when exiftool is missing —
// tags then simply live in state only, exactly the pre-feature behavior.

let exiftoolChecked = false;
let exiftoolPresent = false;

function run(args) {
  return new Promise((resolve, reject) => {
    execFile("exiftool", args, { timeout: 15_000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

export async function exiftoolAvailable() {
  if (exiftoolChecked) return exiftoolPresent;
  exiftoolChecked = true;
  try {
    await run(["-ver"]);
    exiftoolPresent = true;
  } catch {
    exiftoolPresent = false;
  }
  return exiftoolPresent;
}

const sane = (t) => typeof t === "string" && t.trim().length > 0;

// Embedded keywords from a media file: XMP-dc:Subject first (the standard), falling
// back to IPTC:Keywords (older jpg taggers) and QuickTime Keys keywords (mp4 encoders
// that use -metadata style atoms). Returns [] on any failure — reading tags must never
// break an upload.
export async function readFileTags(filePath) {
  if (!(await exiftoolAvailable())) return [];
  try {
    const raw = await run(["-json", "-XMP-dc:Subject", "-IPTC:Keywords", "-Keys:Keywords", "-QuickTime:Comment", filePath]);
    const data = JSON.parse(raw)?.[0] ?? {};
    for (const field of ["Subject", "Keywords"]) {
      const v = data[field];
      if (Array.isArray(v) && v.some(sane)) return v.filter(sane).map((t) => t.trim());
      if (sane(v)) return v.split(",").map((t) => t.trim()).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

// Write the full tag list into the file as XMP-dc:Subject (replacing what was there).
// -overwrite_original: no `_original` backup litter next to the library files. Errors
// are reported (false) but never thrown — a tag edit must never take the show down,
// and state.json still carries the tags for this session either way.
export async function writeFileTags(filePath, tags) {
  if (!(await exiftoolAvailable())) return false;
  const clean = (Array.isArray(tags) ? tags : []).filter(sane).map((t) => t.trim());
  try {
    // Replace-list idiom: repeated plain `=` assignments rebuild the list wholesale
    // (a bare `-Tag=` clears it). NOT `-Tag= -Tag+=…` — mixing delete and += in one
    // command APPENDS to the existing list instead of replacing (verified in-container).
    await run([
      "-overwrite_original",
      ...(clean.length ? clean.map((t) => `-XMP-dc:Subject=${t}`) : ["-XMP-dc:Subject="]),
      filePath,
    ]);
    return true;
  } catch (err) {
    console.warn(`[media-tags] could not write tags into "${filePath}":`, err?.message);
    return false;
  }
}
