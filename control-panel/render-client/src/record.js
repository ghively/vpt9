// Camera record-to-disk (task A14b — VPT8's camera capture). Wraps MediaRecorder around a
// live camera MediaStream (the render-client already owns these — see layers.js /
// source-bank.js), buffers the encoded chunks, and on stop POSTs the finished clip to the
// control-plane's media-upload endpoint (server/src/media.js), where it lands in the shared
// media library like any uploaded file. Nothing here is persisted in control-plane state;
// the record start/stop trigger is a relay-only WS message (see server index.js `record`).
//
// VERIFIED with a SYNTHETIC camera (e2e/camera-record.spec.js): on localhost (a secure
// context) with Chromium's `--use-fake-device-for-media-stream`, getUserMedia yields a fake
// stream and MediaRecorder DOES encode it, so the full seam — record → encode → POST →
// media-library entry — runs headless end to end. Only a REAL camera's footage is the
// irreducible remainder. Still written defensively (every entry point guards for missing
// MediaRecorder / stream) so on a browser that lacks them it degrades to a logged no-op
// rather than throwing into the render loop.

// Prefer an mp4 container when the browser can produce one (Safari/some Chrome builds), else
// fall back to webm (Chrome's default). The server accepts both (media.js MEDIA_TYPES).
function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const type of ["video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      /* isTypeSupported can throw on some engines — treat as unsupported */
    }
  }
  return null;
}

function extForMime(mime) {
  return mime && mime.startsWith("video/mp4") ? "mp4" : "webm";
}

export class CameraRecorder {
  // getMediaOrigin: () => string — the http origin of the control plane (main.js derives it
  // from the ?ws= host); resolved lazily so a reconnect/host change is always honored.
  // getStream: () => MediaStream|null — supplies the camera stream to record at start time.
  constructor(getMediaOrigin, getStream) {
    this._getMediaOrigin = getMediaOrigin;
    this._getStream = getStream;
    this._recorder = null;
    this._chunks = [];
    this._mime = null;
  }

  get recording() {
    return !!this._recorder && this._recorder.state === "recording";
  }

  start() {
    if (this.recording) return false;
    const mime = pickMimeType();
    if (!mime) {
      console.warn("[record] MediaRecorder is unavailable in this browser — cannot record");
      return false;
    }
    const stream = this._getStream?.();
    if (!stream || typeof stream.getVideoTracks !== "function" || stream.getVideoTracks().length === 0) {
      console.warn("[record] no active camera stream to record (add a camera source first)");
      return false;
    }
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime });
    } catch (err) {
      console.warn("[record] could not start MediaRecorder:", err?.message ?? err);
      return false;
    }
    this._chunks = [];
    this._mime = mime;
    recorder.addEventListener("dataavailable", (e) => {
      if (e.data && e.data.size > 0) this._chunks.push(e.data);
    });
    recorder.addEventListener("stop", () => this._finish());
    recorder.addEventListener("error", (e) => console.warn("[record] recorder error:", e?.error?.message ?? e));
    try {
      recorder.start();
    } catch (err) {
      console.warn("[record] recorder.start() failed:", err?.message ?? err);
      this._recorder = null;
      return false;
    }
    this._recorder = recorder;
    return true;
  }

  stop() {
    if (!this._recorder) return false;
    try {
      // The "stop" event handler (this._finish) does the upload — stopping only requests it.
      if (this._recorder.state !== "inactive") this._recorder.stop();
    } catch (err) {
      console.warn("[record] recorder.stop() failed:", err?.message ?? err);
    }
    return true;
  }

  // Assembles the buffered chunks into one Blob and uploads it, then clears state. Split from
  // stop() because MediaRecorder flushes its final chunk asynchronously via a trailing
  // dataavailable BEFORE the stop event, so the complete clip is only ready here.
  _finish() {
    const recorder = this._recorder;
    this._recorder = null;
    const chunks = this._chunks;
    this._chunks = [];
    const mime = this._mime;
    // Free the just-stopped recorder's reference; the camera stream itself is owned/torn down
    // by layers.js / source-bank.js, so we deliberately do NOT stop its tracks here.
    void recorder;
    if (!chunks.length) {
      console.warn("[record] nothing captured (no data) — skipping upload");
      return;
    }
    const blob = new Blob(chunks, { type: mime || "video/webm" });
    this._upload(blob, extForMime(mime));
  }

  _upload(blob, ext) {
    const origin = this._getMediaOrigin?.() || "";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    // X-File-Name only supplies the EXTENSION the server keys off (it always regenerates the
    // stored name as media-<token>.<ext>); a human-readable base keeps the library legible.
    const fileName = `camera-${stamp}.${ext}`;
    fetch(`${origin}/api/media`, {
      method: "POST",
      headers: { "X-File-Name": fileName },
      body: blob,
    })
      .then(async (res) => {
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { msg = (await res.json()).error || msg; } catch { /* keep status */ }
          console.warn("[record] upload rejected:", msg);
        } else {
          console.log("[record] recording uploaded to the media library");
        }
      })
      .catch((err) => console.warn("[record] upload failed:", err?.message ?? err));
  }
}
