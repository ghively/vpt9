// Animated-gif playback for WebGL sampling (the "gifs frozen on the projector" fix).
//
// The old gif path re-uploaded an off-screen <img> to the texture every render frame,
// assuming the browser would hand texImage2D whatever animation frame the gif was
// currently showing. It doesn't: for an animated image, WebGL uploads (and 2D-canvas
// drawImage) always use the image's DEFAULT frame — the first one — per the HTML spec,
// so the wall showed a gif's first frame forever while the panel's native <img>
// thumbnails happily animated. The only way to sample gif frames from GL is to decode
// them ourselves: WebCodecs' ImageDecoder gives per-frame VideoFrames with real
// durations, which we paint into a small offscreen canvas on the gif's own clock; the
// upload paths then sample that canvas exactly like they would an <img>.
//
// Callers keep the plain-<img> path as a fallback (first frame beats a black layer)
// when ImageDecoder is unavailable (Safari, older engines) or the decode fails —
// check `gifPlayerSupported()` before constructing, and prefer `player.ready ?
// player.canvas : imgEl` at upload time.
export function gifPlayerSupported() {
  return typeof window !== "undefined" && "ImageDecoder" in window;
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
    this._start(url);
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
      // Leave `ready` false forever — the caller's <img> fallback keeps showing the
      // first frame, which is the pre-fix behavior, just without the animation.
      console.warn(`[gif] animated decode failed for "${url}" (falling back to static frame):`, err?.message ?? err);
    }
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
    this._teardownDecoder();
  }
}
