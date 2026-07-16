import { createWriteStream, unlinkSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { applyCreate } from "./state.js";
import { MEDIA_TYPES, extOf } from "./media.js";
import { readFileTags } from "./media-tags.js";
import { createThumbProvider } from "./media-thumbs.js";

// Import-by-link for the media library: paste a URL on the panel and the SERVER pulls it
// into MEDIA_DIR (the panel may be a phone — the file must land where the render clients
// can stream it from, and only the server can write there).
//
// Two paths, chosen by the URL's own extension:
//   - a direct media file (…/clip.mp4, …/loop.gif): plain streamed HTTPS download,
//     size-capped like an upload;
//   - anything else (YouTube, Vimeo, …): handed to `yt-dlp` (best single-file mp4,
//     merged via ffmpeg only when available). If yt-dlp isn't installed the error says
//     exactly that — the feature degrades to direct-file imports.
//
// Progress is relayed as `mediaImportStatus` broadcasts (downloading/done/error) —
// relay-style messages like preview/transportStatus, never persisted. The finished file
// enters the library through the SAME applyCreate + create-broadcast path an upload uses.
//
// Factored like createMediaRouter/createSourceBankPresets so it's unit-testable without
// index.js's top-level listen() — tests inject fetchImpl / ytDlpBin.
export function createMediaImporter({ mediaDir, state, broadcast, scheduleSave, maxBytes, ytDlpBin = "yt-dlp", fetchImpl = fetch }) {
  const active = new Set(); // urls currently importing — dedupes double-pastes
  const thumbs = createThumbProvider({ mediaDir }); // shares the on-disk .thumbs cache with the router

  const status = (url, s, extra = {}) => broadcast({ type: "mediaImportStatus", url, status: s, ...extra });

  async function finalize(tmpPath, ext, name) {
    const id = `media-${randomBytes(8).toString("hex")}`;
    const filename = `${id}.${ext}`; // matches SAFE_FILENAME by construction
    const finalPath = join(mediaDir, filename);
    renameSync(tmpPath, finalPath);
    const entry = {
      id,
      name,
      filename,
      kind: MEDIA_TYPES[ext].kind,
      size: statSync(finalPath).size,
      uploadedAt: new Date().toISOString(),
      // The file is the durable tag store: a downloaded file that already carries
      // XMP-dc:Subject keywords (e.g. produced by a tagging generator and served over
      // HTTP) lands pre-tagged. Owned as an array even when empty — applyUpdate only
      // patches existing leaves.
      tags: await readFileTags(finalPath),
    };
    applyCreate(state, "media", entry);
    scheduleSave();
    thumbs.warm(filename); // extract the bin poster up front, same as the upload path
    broadcast({ type: "create", path: "media", key: id, value: entry });
    return entry;
  }

  async function directDownload(url, ext) {
    const res = await fetchImpl(url, { redirect: "follow" });
    if (!res.ok || !res.body) throw new Error(`download failed (${res.status})`);
    const tmp = join(mediaDir, `import-tmp-${randomBytes(6).toString("hex")}`);
    const out = createWriteStream(tmp);
    let written = 0;
    try {
      for await (const chunk of res.body) {
        written += chunk.length;
        if (written > maxBytes) throw new Error(`file exceeds ${maxBytes}-byte limit`);
        if (!out.write(chunk)) await new Promise((r) => out.once("drain", r));
      }
      await new Promise((resolve, reject) => {
        out.end();
        out.once("finish", resolve);
        out.once("error", reject);
      });
      const rawName = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
      return finalize(tmp, ext, rawName || `import.${ext}`);
    } catch (err) {
      // Wait for the stream to fully tear down before unlinking: createWriteStream opens
      // lazily, and destroying mid-open otherwise leaves an async open() that fires after
      // cleanup (recreating or erroring on the just-removed temp file).
      out.destroy();
      await new Promise((resolve) => (out.closed ? resolve() : out.once("close", resolve)));
      try { unlinkSync(tmp); } catch { /* nothing written yet */ }
      throw err;
    }
  }

  function ytDlpDownload(url) {
    return new Promise((resolve, reject) => {
      const tmp = join(mediaDir, `import-tmp-${randomBytes(6).toString("hex")}.mp4`);
      const args = [
        "--no-playlist",
        // Best single-file mp4 first (no ffmpeg needed); merged best-video+audio only as
        // a fallback, which yt-dlp handles when ffmpeg exists.
        "-f", "b[ext=mp4]/bv*[ext=mp4]+ba[ext=m4a]/b",
        "--merge-output-format", "mp4",
        "--max-filesize", String(maxBytes),
        "--no-simulate", "--print", "title",
        "-o", tmp,
        url,
      ];
      let child;
      try {
        child = spawn(ytDlpBin, args, { stdio: ["ignore", "pipe", "pipe"] });
      } catch (err) {
        reject(err);
        return;
      }
      let title = "";
      let errTail = "";
      child.stdout.on("data", (b) => { title += b.toString(); });
      child.stderr.on("data", (b) => { errTail = (errTail + b.toString()).slice(-4000); });
      child.on("error", (err) => {
        reject(
          err.code === "ENOENT"
            ? new Error("yt-dlp is not installed on the server — install it to import from streaming sites (direct .mp4/.gif/.jpg links still work)")
            : err,
        );
      });
      child.on("close", (code) => {
        if (code !== 0) {
          try { unlinkSync(tmp); } catch { /* nothing written */ }
          const lastLine = errTail.trim().split("\n").filter(Boolean).pop();
          reject(new Error(lastLine || `yt-dlp exited with code ${code}`));
          return;
        }
        try {
          const cleanTitle = title.trim().split("\n")[0] || "imported clip";
          resolve(finalize(tmp, "mp4", `${cleanTitle}.mp4`));
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // Import one URL into the library. Resolves with the created media entry; rejects with
  // an operator-readable error (also broadcast as a mediaImportStatus "error").
  async function importUrl(url) {
    let parsed;
    try {
      parsed = new URL(String(url));
    } catch {
      throw new Error("that isn't a valid link");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("only http(s) links can be imported");
    }
    if (active.has(url)) throw new Error("already importing this link");
    active.add(url);
    status(url, "downloading");
    try {
      const ext = extOf(parsed.pathname);
      const entry = MEDIA_TYPES[ext] ? await directDownload(url, ext) : await ytDlpDownload(url);
      status(url, "done", { name: entry.name, id: entry.id }); // id lets the panel file the import into a collection
      return entry;
    } catch (err) {
      status(url, "error", { error: err?.message ?? String(err) });
      throw err;
    } finally {
      active.delete(url);
    }
  }

  return { importUrl };
}
