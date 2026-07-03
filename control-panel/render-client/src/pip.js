// Floating overlay windows (YouTube, etc). Deliberately NOT part of the WebGL layer
// stack — see control-panel/README.md: a cross-origin iframe's pixels can't be read
// into a WebGL texture, so these can be moved/resized as a rectangle but never masked
// or mesh-warped like a real layer. Position/size/content are driven entirely by
// state pushed from the control panel; this module only ever reflects it.
export class PipOverlay {
  constructor(root, screenId) {
    this.root = root;
    this.screenId = screenId;
    this.windows = new Map(); // pip id -> HTMLElement
  }

  // `isAudioOwner` reflects this render client's screen against state.audioOwnerScreenId
  // (see main.js) — PiP audio follows the same one-audio-owner-at-a-time policy as the
  // <video> layers do, per README.md's "One audio owner at a time" architecture decision.
  sync(pipById, isAudioOwner) {
    const mine = Object.values(pipById || {}).filter((p) => p.screenId === this.screenId);
    const currentIds = new Set(mine.map((p) => p.id));

    for (const [id, el] of this.windows) {
      if (!currentIds.has(id)) {
        el.remove();
        this.windows.delete(id);
      }
    }

    for (const pip of mine) this._upsert(pip, isAudioOwner);
  }

  _upsert(pip, isAudioOwner) {
    let el = this.windows.get(pip.id);
    if (!el) {
      el = document.createElement("div");
      el.className = "pip-window";
      const iframe = document.createElement("iframe");
      iframe.allow = "autoplay; encrypted-media";
      iframe.frameBorder = "0";
      el.appendChild(iframe);
      this.root.appendChild(el);
      this.windows.set(pip.id, el);
    }

    el.style.display = pip.visible ? "block" : "none";
    el.style.left = `${pip.x * 100}%`;
    el.style.top = `${pip.y * 100}%`;
    el.style.width = `${pip.width * 100}%`;
    el.style.height = `${pip.height * 100}%`;

    const iframe = el.querySelector("iframe");
    const muted = !isAudioOwner;
    // enablejsapi=1 lets us toggle mute live via postMessage below instead of reloading
    // the iframe (which would restart playback) whenever audio ownership changes.
    const wantedSrc = pip.videoId
      ? `https://www.youtube.com/embed/${encodeURIComponent(pip.videoId)}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${encodeURIComponent(pip.videoId)}&enablejsapi=1`
      : "";
    if (iframe.dataset.src !== wantedSrc) {
      iframe.dataset.src = wantedSrc;
      iframe.src = wantedSrc;
      iframe.dataset.muted = String(muted);
      return;
    }

    if (wantedSrc && iframe.dataset.muted !== String(muted)) {
      iframe.dataset.muted = String(muted);
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: muted ? "mute" : "unMute", args: [] }),
        "https://www.youtube.com"
      );
    }
  }
}
