// Single source of truth for the upload allowlist. Extension (lowercase, no dot) -> how
// the file is treated. Adding a format later is a one-line edit here (see the spec's
// "the allowlist is a plain array in one place" non-goal note).
export const MEDIA_TYPES = {
  mp4: { kind: "video", contentType: "video/mp4" },
  // webm is accepted primarily so the camera recorder (task A14b) can upload what
  // MediaRecorder produces — Chrome's MediaRecorder defaults to video/webm and only
  // sometimes supports video/mp4. It's treated as an ordinary "video" everywhere (the
  // render-client's mediaKindFromUrl already falls unknown extensions through to "video").
  webm: { kind: "video", contentType: "video/webm" },
  gif: { kind: "gif", contentType: "image/gif" },
  jpg: { kind: "image", contentType: "image/jpeg" },
  jpeg: { kind: "image", contentType: "image/jpeg" },
};

// Filenames are ALWAYS server-generated (media-<token>.<ext>); validate before any fs
// touch so a hand-crafted GET/DELETE can never walk out of MEDIA_DIR (defense in depth —
// ids are server-generated, so this should never reject a legitimate request).
export const SAFE_FILENAME = /^media-[A-Za-z0-9_-]+\.(mp4|webm|gif|jpe?g)$/;

export function extOf(name) {
  const dot = String(name).lastIndexOf(".");
  return dot < 0 ? "" : String(name).slice(dot + 1).toLowerCase();
}

export function mediaTypeForName(name) {
  return MEDIA_TYPES[extOf(name)] ?? null;
}

import { createReadStream, createWriteStream, statSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { applyCreate, applyDelete, resolveDanglingSourceRefs } from "./state.js";

const DEFAULT_MAX_BYTES = 1024 * 1024 * 1024; // 1 GiB

// Three HTTP endpoints on the existing hand-rolled server (no multipart lib): raw body +
// X-File-Name, mirroring how readJsonBody is hand-rolled in index.js. Factored out as a
// router so it's testable without index.js's top-level listen().
export function createMediaRouter({ mediaDir, state, broadcast, scheduleSave, maxBytes = DEFAULT_MAX_BYTES, importer = null }) {
  // The panel itself (a separate origin from this server, e.g. :8082 vs :8080) calls
  // upload/delete directly via fetch(), so every JSON response needs the same wildcard
  // CORS policy the GET/serve path already carries for the render-client.
  const sendJson = (res, code, obj) => {
    res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*" });
    res.end(JSON.stringify(obj));
  };

  // A cross-origin POST/DELETE with a custom header (X-File-Name) triggers a browser
  // preflight OPTIONS request before the real request is sent; answer it directly.
  // Content-Type must be allowed too: the upload sends a raw File body with no explicit
  // Content-Type, so the browser auto-sets one from the file (e.g. video/mp4) — not a
  // CORS-safelisted value, so it shows up in the real preflight's Access-Control-Request-Headers.
  function handlePreflight(res) {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, DELETE, OPTIONS",
      "access-control-allow-headers": "X-File-Name, Content-Type",
      "access-control-max-age": "86400",
    });
    res.end();
  }

  function handleUpload(req, res) {
    const fileName = req.headers["x-file-name"];
    const meta = fileName ? mediaTypeForName(fileName) : null;
    if (!meta) {
      sendJson(res, 400, { error: "unsupported or missing file type (allowed: mp4, gif, jpg, jpeg)" });
      return;
    }
    // Reject up front on a declared oversize Content-Length (cheap, avoids a partial write).
    const declared = Number(req.headers["content-length"]);
    if (Number.isFinite(declared) && declared > maxBytes) {
      sendJson(res, 413, { error: `file exceeds ${maxBytes}-byte limit` });
      return;
    }

    const ext = extOf(fileName);
    const id = `media-${randomBytes(8).toString("hex")}`;
    const filename = `${id}.${ext}`; // matches SAFE_FILENAME by construction
    const filePath = join(mediaDir, filename);
    const out = createWriteStream(filePath);
    let written = 0;
    let aborted = false;
    let finished = false;

    const abort = (code, msg) => {
      if (aborted || finished) return;
      aborted = true;
      req.unpipe(out);
      out.destroy();
      try { unlinkSync(filePath); } catch { /* nothing to clean up */ }
      // The client may already be gone (that's often why we're aborting), so a write here
      // can throw/emit on a dead socket — sendJson best-effort, never let cleanup itself fail.
      try { sendJson(res, code, { error: msg }); } catch { /* client already disconnected */ }
    };

    // Re-check against ACTUAL bytes in case Content-Length is absent/wrong.
    req.on("data", (chunk) => {
      written += chunk.length;
      if (written > maxBytes) abort(413, `file exceeds ${maxBytes}-byte limit`);
    });
    req.on("error", () => abort(400, "upload stream error"));
    // A client disconnecting mid-upload doesn't always surface as req "error" — it can
    // surface only as "close" (e.g. the socket is just cut), per Node's docs on IncomingMessage.
    // Without this, that leaves the write stream open (fd leak) and the partial file orphaned
    // on disk. "close" also fires after a NORMAL completed request, so guard on req.complete
    // (true once the whole body has been received) rather than on our own finished/aborted
    // flags alone — the write-to-disk flush (out "finish") can still be pending when a
    // successful request's "close" fires, so that flag isn't reliable for this check.
    req.on("close", () => {
      if (req.complete) return;
      abort(400, "upload stream closed before completion");
    });
    out.on("error", () => abort(500, "could not write file"));
    out.on("finish", () => {
      if (aborted) return;
      finished = true;
      // tags: owned as an explicit empty array (applyUpdate only patches EXISTING leaves,
      // so an absent key would make every later media.<id>.tags write silently no-op).
      const entry = { id, name: fileName, filename, kind: meta.kind, size: written, uploadedAt: new Date().toISOString(), tags: [] };
      applyCreate(state, "media", entry);
      scheduleSave();
      broadcast({ type: "create", path: "media", key: id, value: entry });
      sendJson(res, 200, { ok: true, media: entry });
    });
    req.pipe(out);
  }

  function handleServe(req, res, filename) {
    if (!SAFE_FILENAME.test(filename)) { res.writeHead(404); res.end(); return; }
    const filePath = join(mediaDir, filename);
    if (!existsSync(filePath)) { res.writeHead(404); res.end(); return; }
    const { size } = statSync(filePath);
    const contentType = (MEDIA_TYPES[extOf(filename)] ?? {}).contentType ?? "application/octet-stream";
    // CORS is mandatory: the render-client draws these into a WebGL texture (crossOrigin
    // "anonymous"), which taints the canvas without an allow-origin header.
    const headers = { "access-control-allow-origin": "*", "accept-ranges": "bytes", "content-type": contentType };

    const range = req.headers.range;
    const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Number(m[2]) : size - 1;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || end >= size) {
        res.writeHead(416, { ...headers, "content-range": `bytes */${size}` });
        res.end();
        return;
      }
      res.writeHead(206, { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
      createReadStream(filePath, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { ...headers, "content-length": size });
    createReadStream(filePath).pipe(res);
  }

  function handleDelete(res, id) {
    const entry = state.media?.[id];
    if (!entry) { sendJson(res, 404, { error: `no media with id "${id}"` }); return; }
    if (SAFE_FILENAME.test(entry.filename)) {
      try { unlinkSync(join(mediaDir, entry.filename)); } catch { /* already gone */ }
    }
    applyDelete(state, `media.${id}`);
    resolveDanglingSourceRefs(state, "media", id);
    scheduleSave();
    broadcast({ type: "delete", path: `media.${id}` });
    broadcast({ type: "state", state }); // slot content may have changed too
    sendJson(res, 200, { ok: true });
  }

  // POST /api/media/import { url }: kick off an import-by-link (media-import.js) and
  // return 202 immediately — progress and the final library entry arrive over the WS
  // (mediaImportStatus relays + the normal media create broadcast), so a slow yt-dlp
  // pull never holds an HTTP request open.
  function handleImport(req, res) {
    if (!importer) { sendJson(res, 501, { error: "import-by-link is not enabled" }); return; }
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      let body;
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        sendJson(res, 400, { error: "invalid JSON body" });
        return;
      }
      if (typeof body.url !== "string" || !body.url) {
        sendJson(res, 400, { error: "body.url (string) is required" });
        return;
      }
      // Validate the URL shape synchronously so the caller gets a real 400 for garbage;
      // the download itself runs detached (errors surface as mediaImportStatus events).
      try {
        const parsed = new URL(body.url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
      } catch {
        sendJson(res, 400, { error: "only http(s) links can be imported" });
        return;
      }
      importer.importUrl(body.url).catch((err) => console.warn("[media-import] failed:", err?.message));
      sendJson(res, 202, { ok: true });
    });
    req.on("error", () => sendJson(res, 400, { error: "request stream error" }));
  }

  return {
    async handle(req, res) {
      const url = req.url || "";
      if (req.method === "OPTIONS" && (url === "/api/media" || /^\/api\/media\/([^/?]+)$/.exec(url))) {
        handlePreflight(res);
        return true;
      }
      if (req.method === "POST" && url === "/api/media/import") { handleImport(req, res); return true; }
      if (req.method === "POST" && url === "/api/media") { handleUpload(req, res); return true; }
      const serve = req.method === "GET" && /^\/media\/([^/?]+)/.exec(url);
      if (serve) { handleServe(req, res, decodeURIComponent(serve[1])); return true; }
      const del = req.method === "DELETE" && /^\/api\/media\/([^/?]+)$/.exec(url);
      if (del) { handleDelete(res, decodeURIComponent(del[1])); return true; }
      return false;
    },
  };
}
