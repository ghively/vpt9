// Animated-gif playback for WebGL sampling (the "gifs frozen on the projector" fix).
//
// The old gif path re-uploaded an off-screen <img> to the texture every render frame,
// assuming the browser would hand texImage2D whatever animation frame the gif was
// currently showing. It doesn't: for an animated image, WebGL uploads (and 2D-canvas
// drawImage) always use the image's DEFAULT frame — the first one — per the HTML spec,
// so the wall showed a gif's first frame forever while the panel's native <img>
// thumbnails happily animated. The only way to sample gif frames from GL is to decode
// them ourselves, into a small offscreen canvas the upload paths sample like an <img>.
//
// TWO decode paths, picked automatically:
//
// 1. WebCodecs ImageDecoder — per-frame VideoFrames with real durations, fully
//    client-side. But WebCodecs is [SecureContext]-only, and this stack deliberately
//    runs over plain http on a LAN IP (a projector is a LAN instrument, see the
//    runbook) — so on http://<lan-ip> EVERY browser hides ImageDecoder. localhost is a
//    "trustworthy origin", which is why dev and the e2e suite animated while every real
//    projector froze on frame 1.
//
// 2. Server spritesheet — GET <gif-url>/frames returns a manifest (grid + per-frame
//    delays) and <gif-url>/frames.png the sheet, extracted once by the server's ffmpeg
//    (server/src/media-frames.js). Works in any context; used whenever ImageDecoder is
//    missing (and only requires the media server, which the gif itself already came from).
//
// Callers keep the plain-<img> path as a LAST fallback (first frame beats a black
// layer) when both decode paths fail — prefer `player.ready ? player.canvas : imgEl`
// at upload time.
export function gifPlayerSupported() {
  return true; // the spritesheet path needs nothing from the platform
}

export class GifPlayer {
  constructor(url) {
    this.canvas = document.createElement("canvas");
    this.ready = false; // true once the first frame has been painted into `canvas`
    this._ctx = this.canvas.getContext("2d");
    this._disposed = false;
    this._timer = null;
    this._decoder = null;
    this._frameIndex = 0;
    this._frameCount = 1;
    this._sheet = null; // { img, manifest } once the spritesheet path is active
    if (typeof window !== "undefined" && "ImageDecoder" in window) this._start(url);
    else this._startSheet(url);
  }

  async _start(url) {
    try {
      // Buffer the whole file rather than streaming resp.body into the decoder:
      // gifs are small, and a fully-buffered decoder reports a final frameCount
      // immediately instead of growing it as bytes arrive.
      const resp = await fetch(url, { mode: "cors" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.arrayBuffer();
      if (this._disposed) return;
      this._decoder = new ImageDecoder({ data, type: "image/gif" });
      await this._decoder.tracks.ready;
      if (this._disposed) return this._teardownDecoder();
      this._frameCount = Math.max(1, this._decoder.tracks.selectedTrack?.frameCount ?? 1);
      await this._advance();
    } catch (err) {
      // ImageDecoder path failed outright — try the server spritesheet before giving up.
      console.warn(`[gif] ImageDecoder decode failed for "${url}" (trying server frames):`, err?.message ?? err);
      this._startSheet(url);
    }
  }

  // Server-spritesheet path: fetch the manifest + sheet the server extracted with
  // ffmpeg, then step through grid cells on the gif's own delays.
  async _startSheet(url) {
    try {
      const resp = await fetch(`${url}/frames`, { mode: "cors" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const manifest = await resp.json();
      if (this._disposed) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("spritesheet image failed to load"));
        img.src = `${url}/frames.png`;
      });
      if (this._disposed) return;
      this.canvas.width = manifest.frameWidth;
      this.canvas.height = manifest.frameHeight;
      this._frameCount = Math.max(1, manifest.frameCount | 0);
      this._sheet = { img, manifest };
      this._advanceSheet();
    } catch (err) {
      // Leave `ready` false forever — the caller's <img> fallback keeps showing the
      // first frame, which is the pre-fix behavior, just without the animation.
      console.warn(`[gif] animated decode failed for "${url}" (falling back to static frame):`, err?.message ?? err);
    }
  }

  _advanceSheet() {
    const { img, manifest } = this._sheet;
    const i = this._frameIndex;
    const sx = (i % manifest.cols) * manifest.frameWidth;
    const sy = Math.floor(i / manifest.cols) * manifest.frameHeight;
    // Every sheet cell is a complete pre-composited frame (ffmpeg handles gif disposal),
    // but cells can carry transparency — clear so alpha doesn't accumulate across frames.
    this._ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._ctx.drawImage(img, sx, sy, manifest.frameWidth, manifest.frameHeight, 0, 0, manifest.frameWidth, manifest.frameHeight);
    this.ready = true;
    if (this._frameCount <= 1) { this._sheet = null; return; } // single-frame gif: done
    const ms = manifest.delaysMs?.[i] ?? 0;
    this._frameIndex = (this._frameIndex + 1) % this._frameCount;
    // Same timing convention as the ImageDecoder path below.
    this._timer = setTimeout(() => {
      if (!this._disposed && this._sheet) this._advanceSheet();
    }, ms < 20 ? 100 : ms);
  }

  async _advance() {
    const { image } = await this._decoder.decode({ frameIndex: this._frameIndex });
    if (this._disposed) return image.close();
    if (this.canvas.width !== image.displayWidth || this.canvas.height !== image.displayHeight) {
      this.canvas.width = image.displayWidth;
      this.canvas.height = image.displayHeight;
    }
    // The decoder pre-composites disposal/patch frames, so every VideoFrame is the
    // complete image — a plain overwrite (no clearRect) is correct.
    this._ctx.drawImage(image, 0, 0);
    const durationUs = image.duration ?? 0;
    image.close();
    this.ready = true;
    if (this._frameCount <= 1) return this._teardownDecoder(); // single-frame gif: done
    this._frameIndex = (this._frameIndex + 1) % this._frameCount;
    // Match browser <img> timing conventions: a stored delay under ~20ms is bumped to
    // 100ms (the classic "0-delay gif" ends up at ~10fps, not a busy-loop).
    const ms = durationUs / 1000;
    this._timer = setTimeout(() => {
      this._advance().catch((err) => {
        // A truncated/corrupt tail frame: hold the last good frame instead of spamming.
        console.warn("[gif] frame decode failed (holding last frame):", err?.message ?? err);
      });
    }, ms < 20 ? 100 : ms);
  }

  _teardownDecoder() {
    try { this._decoder?.close(); } catch { /* already closed */ }
    this._decoder = null;
  }

  dispose() {
    this._disposed = true;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this._sheet = null;
    this._teardownDecoder();
  }
}

// Shared, refcounted GifPlayers keyed by URL (perf 2026-07-16). The same gif referenced by
// a layer AND a slot AND a matte used to spin up THREE independent GifPlayers — three full
// spritesheet fetches + three decode timers for identical pixels. acquire/release share one
// player across all references; the sheet is fetched and advanced ONCE, and every consumer
// samples the same `player.canvas`. Disposed only when the last reference releases.
const _sharedGifPlayers = new Map(); // url -> { player, refs }

export function acquireGifPlayer(url) {
  let entry = _sharedGifPlayers.get(url);
  if (!entry) {
    entry = { player: new GifPlayer(url), refs: 0 };
    _sharedGifPlayers.set(url, entry);
  }
  entry.refs += 1;
  return entry.player;
}

export function releaseGifPlayer(player) {
  if (!player) return;
  for (const [url, entry] of _sharedGifPlayers) {
    if (entry.player !== player) continue;
    entry.refs -= 1;
    if (entry.refs <= 0) {
      entry.player.dispose();
      _sharedGifPlayers.delete(url);
    }
    return;
  }
  player.dispose?.(); // not shared (defensive) — dispose directly
}
