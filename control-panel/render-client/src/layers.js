import { createProgram, createFullscreenQuad, bindFullscreenQuad, createTexture, createFramebuffer } from "./gl-utils.js";
import { FxPasses, FxChain, fxNeedsChain } from "./fx.js";
import { SourceBank } from "./source-bank.js";
import { applyVideoTransport, clearTransportState } from "./transport.js";
import { cameraConstraints, cameraKey } from "./camera.js";

// Order is load-bearing: BLEND_INDEX derives each mode's shader-side integer from
// array position, and panel/src/components/types.ts's BLEND_MODES must list the exact
// same 24 names in the exact same order (checked by
// server/test/blend-modes-parity.test.js) so the panel's dropdown selects the mode it
// visually shows. Formulas ported from vpt8 source code/shaders/v001 Mixers/*.fp.glsl —
// see this plan's Global Constraints for the exact adaptation rule (myInput->top,
// previousmix->base, outer amount-mix wrapper dropped, divisions guarded against 0).
const BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "difference", "add",
  "average", "brightlight", "burn", "darken", "dodge", "exclude",
  "freeze", "glow", "hardlight", "heat", "inverse", "lighten",
  "lumablend", "negate", "reflect", "softlight", "stamp", "subtractive",
];
const BLEND_INDEX = Object.fromEntries(BLEND_MODES.map((mode, i) => [mode, i]));

// Treat a source URL by its file extension. Library files always carry a correct,
// server-generated extension; external streams without a known image extension fall
// through to "video" so arbitrary URLs keep working exactly as before.
function mediaKindFromUrl(url) {
  const clean = String(url).split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  const ext = dot < 0 ? "" : clean.slice(dot + 1).toLowerCase();
  if (ext === "gif") return "gif";
  // Library uploads only allow jpg/jpeg, but external URLs can be any still format —
  // routing e.g. a .png through the <video> path renders an opaque black layer.
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "bmp") return "image";
  return "video";
}

// True when a corner-pin warp is a no-op (unwarped identity quad) — used to keep an
// untouched layer off the FxChain path, matching fxNeedsChain's zero-cost-when-default intent.
function isIdentityCorners(corners) {
  const id = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
  return corners.length === 4 && corners.every((c, i) => c.x === id[i].x && c.y === id[i].y);
}

const BLEND_VERT = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// Blends one layer over the scene accumulated so far. The blend formulas mirror the
// handful of VPT8 ships as separate .jxs files under shaders/v001 Mixers/ — branches of
// one shader here instead of one file per mode, simpler to maintain at this scope.
const BLEND_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform sampler2D u_layer;
uniform float u_opacity;
uniform int u_blendMode;
uniform bool u_isColor;
uniform vec3 u_layerColor;

out vec4 outColor;

vec3 blend(vec3 base, vec3 top, int mode) {
  if (mode == 1) return base * top;
  if (mode == 2) return 1.0 - (1.0 - base) * (1.0 - top);
  if (mode == 3) return mix(2.0 * base * top, 1.0 - 2.0 * (1.0 - base) * (1.0 - top), step(0.5, base));
  if (mode == 4) return abs(base - top);
  if (mode == 5) return min(base + top, 1.0);
  if (mode == 6) return base + top * 0.5;
  if (mode == 7) return (1.0 - base) * base * top + base * (1.0 - (1.0 - base) * (1.0 - top));
  if (mode == 8) return clamp(1.0 - (1.0 - base) / max(top, 0.0001), 0.0, 1.0);
  if (mode == 9) return min(base, top);
  if (mode == 10) return clamp(base / max(1.0 - top, 0.0001), 0.0, 1.0);
  if (mode == 11) return base + top - 2.0 * base * top;
  if (mode == 12) return clamp(1.0 - pow(1.0 - base, vec3(2.0)) / max(top, 0.0001), 0.0, 1.0);
  if (mode == 13) return clamp((top * top) / max(1.0 - base, 0.0001), 0.0, 1.0);
  if (mode == 14) {
    float luminance = dot(base, vec3(0.2125, 0.7154, 0.0721));
    float mixAmount = clamp((luminance - 0.45) * 10.0, 0.0, 1.0);
    return mix(2.0 * top * base, 1.0 - 2.0 * (1.0 - top) * (1.0 - base), vec3(mixAmount));
  }
  if (mode == 15) return clamp(1.0 - pow(1.0 - top, vec3(2.0)) / max(base, 0.0001), 0.0, 1.0);
  if (mode == 16) return clamp(top / max(1.0 - base, 0.0001), 0.0, 1.0);
  if (mode == 17) return max(base, top);
  if (mode == 18) return mix(base, top, dot(base, vec3(0.2125, 0.7154, 0.0721)));
  if (mode == 19) return 1.0 - abs(1.0 - base - top);
  if (mode == 20) return clamp((base * base) / max(1.0 - top, 0.0001), 0.0, 1.0);
  if (mode == 21) return 2.0 * base * top + base * base - 2.0 * base * base * top;
  if (mode == 22) return base + 2.0 * top - 1.0;
  if (mode == 23) return base + top - 1.0;
  return top; // mode 0, normal
}

void main() {
  vec4 prev = texture(u_prev, v_uv);
  vec4 layer = u_isColor ? vec4(u_layerColor, 1.0) : texture(u_layer, v_uv);
  float a = clamp(u_opacity, 0.0, 1.0) * layer.a;
  vec3 blended = blend(prev.rgb, layer.rgb, u_blendMode);
  outColor = vec4(mix(prev.rgb, blended, a), 1.0);
}`;

export class LayerStack {
  constructor(gl) {
    this.gl = gl;
    this.program = createProgram(gl, BLEND_VERT, BLEND_FRAG);
    this.quad = createFullscreenQuad(gl);
    this.uniforms = Object.fromEntries(
      [
        ["u_prev", "prev"], ["u_layer", "layer"], ["u_opacity", "opacity"], ["u_blendMode", "blendMode"],
        ["u_isColor", "isColor"], ["u_layerColor", "layerColor"],
      ].map(([glName, key]) => [key, gl.getUniformLocation(this.program, glName)])
    );

    this.width = 0;
    this.height = 0;
    this.pingpong = [null, null];
    this.groundColor = [0x0a / 255, 0x0c / 255, 0x11 / 255];
    this.fxPasses = new FxPasses(gl);
    this.entries = new Map(); // layer id -> { texture, videoEl, stream, currentUrl, fxChain }
    this.mediaOrigin = ""; // prefix for /media/... source urls (set from the ?ws= host)
    this.sourceBank = new SourceBank(gl);
    this.slots = [];
    this.media = {};
    // Mask-matte decoders for MEDIA-ref mattes (mask.source of type "media"), keyed by
    // mediaId: { texture, videoEl, imgEl, imgKind, imgUploaded, currentUrl }. Slot-ref
    // mattes reuse the shared source-bank instead, so they never land here. Swept each
    // frame (render()) for mediaIds no layer references anymore.
    this.matteEntries = new Map();
    this.onClipEnded = null; // settable callback: (layerId) => void, wired by compositor.js/main.js
  }

  setMediaOrigin(origin) {
    this.mediaOrigin = origin || "";
    this.sourceBank.setMediaOrigin(origin);
  }

  // First live camera MediaStream currently held by any layer or shared source-bank slot
  // (task A14b — what the camera recorder captures). Returns null when no camera is active.
  firstCameraStream() {
    for (const entry of this.entries.values()) {
      if (entry.stream && entry.stream.getVideoTracks?.().length) return entry.stream;
    }
    return this.sourceBank?.firstCameraStream?.() ?? null;
  }

  setSourceContext(slots, media) {
    this.slots = slots ?? [];
    this.media = media ?? {};
  }

  // When sourceMode is "playlist", the layer's displayed content is
  // playlist.items[cursor].ref, not layer.source directly — layer.source is only the
  // fallback for sourceMode "single". ref shape matches SourceRef: {type:"media",
  // mediaId} resolves through the media library the same way a direct video URL would
  // (media items are served at /media/<filename>, matching mediaUrlFor's convention in
  // source-bank.js); {type:"slot", slotId} resolves through this.sourceBank.
  effectiveSource(layer) {
    if (layer.sourceMode !== "playlist") return layer.source;
    const item = layer.playlist?.items?.[layer.playlist.cursor];
    if (!item) return layer.source;
    const ref = item.ref;
    if (ref?.type === "slot") return { type: "slot", slotId: ref.slotId };
    if (ref?.type === "media") {
      const mediaItem = this.media?.[ref.mediaId];
      return mediaItem ? { type: "video", url: `/media/${mediaItem.filename}` } : null;
    }
    return null;
  }

  // Whether this layer's <video> should natively loop.
  //
  // Playlist mode: a playlist VIDEO item with no fixed duration means "play through to
  // end" — it must NOT loop, or the native `ended` event the playlist relies on to advance
  // never fires; a duration'd (still) item loops as before.
  //
  // Single mode (task A10 — was the always-loop bug: this used to return `true` for every
  // non-playlist layer regardless of loopMode): honor transport.loopMode. Only
  // "loop"/"palindrome" native-loop; "off"/"once" play through once and stop.
  shouldLoop(layer) {
    if (layer.sourceMode === "playlist") {
      const item = layer.playlist?.items?.[layer.playlist.cursor];
      return item?.duration != null;
    }
    const mode = layer.transport?.loopMode;
    return mode === "loop" || mode === "palindrome";
  }

  // Library media is stored as a host-independent "/media/<file>" path so a saved show
  // works regardless of which browser assigned it; resolve it against this render
  // client's own control-plane origin. External absolute URLs pass through untouched.
  _resolveUrl(url) {
    return url && url.startsWith("/media/") ? this.mediaOrigin + url : url;
  }

  resize(width, height) {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    const gl = this.gl;
    this.pingpong = [createFramebuffer(gl, width, height), createFramebuffer(gl, width, height)];
    // Fx chains carry render targets at the old size; rebuild lazily at the new one.
    for (const entry of this.entries.values()) {
      entry.fxChain?.dispose();
      entry.fxChain = null;
    }
  }

  _entry(id) {
    if (!this.entries.has(id)) {
      this.entries.set(id, {
        texture: createTexture(this.gl),
        videoEl: null, stream: null, imgEl: null, imgKind: null, imgUploaded: false,
        currentUrl: null, fxChain: null,
      });
    }
    return this.entries.get(id);
  }

  _stopSource(entry) {
    if (entry.videoEl) {
      entry.videoEl.pause();
      entry.videoEl.srcObject = null;
      entry.videoEl.removeAttribute("src");
      entry.videoEl.load();
      // Loop handler (attached by applyVideoTransport) closes over this specific <video>
      // element — detach it and clear all per-element transport bookkeeping so the next
      // element re-attaches a fresh handler and re-adopts seek cleanly, instead of silently
      // no-op'ing forever because entry._loopHandler is still (falsely) truthy.
      clearTransportState(entry, entry.videoEl);
      entry.videoEl = null;
      if (entry._audioNodes) {
        entry._audioNodes.gainNode.disconnect();
        entry._audioNodes.pannerNode?.disconnect();
        entry._audioNodes = null;
        entry._audioNodesFor = null;
      }
    }
    if (entry.stream) {
      for (const track of entry.stream.getTracks()) track.stop();
      entry.stream = null;
    }
    if (entry.imgEl) {
      entry.imgEl.removeAttribute("src");
      entry.imgEl.remove();
      entry.imgEl = null;
    }
    entry.imgKind = null;
    entry.imgUploaded = false;
  }

  setLayerSource(id, source, { loop = true } = {}) {
    const entry = this._entry(id);
    // Record what was actually resolved and handed to us (the effective source, which
    // for playlist layers differs from the layer's own static `source` field) so render()
    // can key its slot-texture path off the same thing this function branched on, rather
    // than recomputing/trusting layer.source directly.
    entry.sourceType = source?.type ?? null;
    entry.slotId = source?.type === "slot" ? source.slotId : null;
    if (source?.type === "video") {
      const url = this._resolveUrl(source.url);
      const kind = mediaKindFromUrl(source.url);
      if (entry.currentUrl === url) {
        // Same media already loaded, but the loop policy may have changed — e.g. switching a
        // layer single->playlist whose first clip is this same file: single mode loops, but
        // a duration-less playlist video must NOT loop, or its native `ended` event never
        // fires and the playlist can't advance. Keep the element's loop flag in sync.
        if (entry.videoEl && entry.videoEl.loop !== loop) entry.videoEl.loop = loop;
        return;
      }
      entry.currentUrl = url;
      this._stopSource(entry);
      if (kind === "video") {
        const video = document.createElement("video");
        video.src = url;
        video.crossOrigin = "anonymous";
        video.loop = loop;
        video.muted = true; // corrected by setLayerMuted() per the audio-owner policy
        video.playsInline = true;
        video.addEventListener("ended", () => {
          if (this.onClipEnded) this.onClipEnded(id);
        });
        video.play().catch((err) => console.warn(`[layers] could not play "${url}":`, err.message));
        // Born while blind (see setBlindHold): stays muted until the session commits,
        // so cueing a new clip off-air is never audible to the audience.
        entry._bornBlind = this.blindHold;
        entry.videoEl = video;
      } else {
        // Still image (jpg) or animated gif: sample an <img> into the texture. A gif
        // advances its own frames on the browser clock, so re-uploading each render
        // frame picks up the current frame; a static image needs a single upload.
        // The element is attached to the document (off-screen, invisible) rather than
        // left detached: animation-frame advancement for <img> gifs is tied to the
        // element being part of the active render tree in some browser engines, unlike
        // <video>, where playback is well-defined even while detached.
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.style.cssText = "position: fixed; top: 0; left: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none;";
        img.addEventListener("error", () => console.warn(`[layers] could not load "${url}"`));
        img.addEventListener("load", () => { entry.imgUploaded = false; });
        img.src = url;
        document.body.appendChild(img);
        entry.imgEl = img;
        entry.imgKind = kind; // "gif" | "image"
        entry.imgUploaded = false;
      }
    } else if (source?.type === "camera") {
      // Live camera input (VPT8's cam1/cam2). Chrome requires a secure context
      // (localhost counts) and prompts once per origin. Video only — a camera layer
      // never participates in the audio-owner policy. The entry is keyed by device +
      // resolution (task A14) so changing either re-acquires getUserMedia; an unchanged
      // camera ref is a no-op (no re-prompt, no stream churn).
      const key = cameraKey(source.deviceId, source.resolution);
      if (entry.currentUrl === key) return;
      entry.currentUrl = key;
      this._stopSource(entry);
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      entry.videoEl = video;
      navigator.mediaDevices
        ?.getUserMedia(cameraConstraints(source.deviceId, source.resolution))
        .then((stream) => {
          if (entry.currentUrl !== key) {
            for (const track of stream.getTracks()) track.stop();
            return; // source changed while the permission prompt was open
          }
          entry.stream = stream;
          video.srcObject = stream;
          video.play().catch((err) => console.warn("[layers] camera play failed:", err.message));
        })
        .catch((err) => console.warn("[layers] camera unavailable:", err.message));
    } else {
      entry.currentUrl = null;
      this._stopSource(entry);
    }
  }

  setLayerMuted(id, muted) {
    const entry = this.entries.get(id);
    // The blind audio hold overrides the audio-owner policy for elements created during
    // the blind session — they stay muted until commit no matter who owns audio.
    if (entry?.videoEl) entry.videoEl.muted = muted || (this.blindHold && !!entry._bornBlind);
  }

  // Blind audio hold (the audible face of task A20's frozen wall): while the wall is
  // frozen, what the audience HEARS must hold like what they see. Video elements created
  // while blind start and stay muted (a clip cued off-air must not play out loud), and
  // applyTransport freezes vol/pan gains at their pre-blind levels. Elements that were
  // already playing keep their audio running — blind freezes the show, it doesn't cut it.
  // Committing (blind off) clears the tags; the compositor then re-applies the normal
  // audio-owner mute policy, bringing the new clips' audio up. Known limit, documented in
  // the operator guide: pausing/scrubbing a clip that was ALREADY audible before blind is
  // still audible — one decode pipeline can't play two positions at once.
  setBlindHold(on) {
    this.blindHold = !!on;
    if (!this.blindHold) {
      for (const entry of this.entries.values()) entry._bornBlind = false;
    }
  }

  // Applies transport control (play/pause, rate, loop in/out via manual seek, palindrome
  // direction, pan/vol via Web Audio) to a layer's <video> element. Reverse playback
  // (negative rate) is NOT implemented — no browser allows a negative
  // HTMLMediaElement.playbackRate; VPT8's own reverse-rate support has no browser
  // equivalent and is an explicit, stated non-goal (design spec, Section 3).
  applyTransport(layer, entry) {
    const video = entry.videoEl;
    if (!video) return;
    // Resync native `loop` from the layer's CURRENT loopMode every frame (the slot path
    // does the same in source-bank.js). setLayerSource sets it too, but a bare
    // `layers.<id>.transport.loopMode` update takes main.js's render-time-leaf fast path,
    // which skips setLayers()/setLayerSource entirely — without this per-frame resync,
    // toggling Loop off left the wall's <video> looping forever (and off->loop froze on
    // the clip's last frame instead of looping).
    const loop = this.shouldLoop(layer);
    if (video.loop !== loop) video.loop = loop;
    const t = layer.transport;
    if (!t) return;

    // Playback (play/pause, rate, loop-region/palindrome, scrub seek) — shared with the
    // source-bank slot path via transport.js so a slot's private <video> and a layer's
    // private <video> obey the identical rules. Native `video.loop` is NOT set here (the
    // layer path derives it from shouldLoop(), set on the element in setLayerSource — a
    // playlist video item must not native-loop or its `ended` advance never fires).
    applyVideoTransport(video, t, entry);

    // One shared AudioContext for the whole LayerStack (this.audioCtx, created lazily
    // below), not one per layer — browsers cap the number of live AudioContexts (around
    // 6 in Chrome), and this render client can have far more layers than that.
    // entry._audioNodes is tied to THIS video element's identity (entry._audioNodesFor)
    // so a source change that replaces entry.videoEl (via _stopSource) gets fresh nodes
    // instead of silently keeping pan/vol routed to a dead element — createMediaElementSource
    // can only be called once per element for its lifetime, so this check must never
    // re-call it on the same still-live element either.
    if (entry._audioNodesFor !== video && window.AudioContext) {
      try {
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        const source = this.audioCtx.createMediaElementSource(video);
        const gainNode = this.audioCtx.createGain();
        const pannerNode = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;
        if (pannerNode) { source.connect(pannerNode); pannerNode.connect(gainNode); }
        else source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        entry._audioNodes = { gainNode, pannerNode };
        entry._audioNodesFor = video;
      } catch {
        entry._audioNodes = null;
        entry._audioNodesFor = video; // still mark as "attempted for this element" so we don't retry every frame
      }
    }
    // Autoplay policy: a context created before any user gesture starts "suspended" and
    // outputs SILENCE — and createMediaElementSource has already rerouted the element's
    // audio into it, so the audio-owner screen would stay mute forever. Retry resume()
    // each frame: it succeeds immediately under kiosk autoplay flags, or on the first
    // frame after any user gesture (click/fullscreen dblclick) otherwise.
    if (this.audioCtx && this.audioCtx.state === "suspended") this.audioCtx.resume().catch(() => {});
    // Blind audio hold: vol/pan freeze at their pre-blind levels while the wall is
    // frozen — an off-air fader move must not be audible. Values resume tracking the
    // live state on the first frame after commit/discard.
    if (this.blindHold) return;
    if (entry._audioNodes) {
      entry._audioNodes.gainNode.gain.value = t.vol ?? 1;
      if (entry._audioNodes.pannerNode) entry._audioNodes.pannerNode.pan.value = t.pan ?? 0;
    } else {
      video.volume = t.vol ?? 1;
    }
  }

  removeLayer(id) {
    const entry = this.entries.get(id);
    if (!entry) return;
    this._stopSource(entry);
    entry.fxChain?.dispose();
    if (entry.texture) this.gl.deleteTexture(entry.texture); // was leaked on every layer add/remove
    this.entries.delete(id);
  }

  // Full teardown: stop every layer's source and free its GL resources, plus the shared
  // source-bank and AudioContext. Used when the WebGL context is lost (the compositor
  // rebuilds a fresh LayerStack on restore) and for any explicit teardown.
  dispose() {
    for (const id of [...this.entries.keys()]) this.removeLayer(id);
    this._sweepMatteEntries(new Set()); // tear down every matte decoder + its texture
    this.sourceBank?.dispose?.();
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch { /* already closed */ }
      this.audioCtx = null;
    }
  }

  // Per-source downscale (task A15 — VPT8's `p adapt`): when entry.downscale > 1, draw the
  // source element into a reusable offscreen 2D canvas at 1/divisor size and return THAT
  // to upload, so the GPU texture holds fewer pixels. divisor 1 (the default for every
  // untouched layer) short-circuits to the element itself — the pre-A15 path, byte-identical.
  // Returns the element unchanged if its dimensions aren't known yet (nothing to scale).
  _maybeDownscale(entry, el, srcW, srcH) {
    const divisor = entry.downscale ?? 1;
    if (divisor <= 1 || !srcW || !srcH) return el;
    const w = Math.max(1, Math.floor(srcW / divisor));
    const h = Math.max(1, Math.floor(srcH / divisor));
    if (!this._scaleCanvas) {
      this._scaleCanvas = document.createElement("canvas");
      this._scaleCtx = this._scaleCanvas.getContext("2d");
    }
    this._scaleCanvas.width = w;
    this._scaleCanvas.height = h;
    this._scaleCtx.drawImage(el, 0, 0, w, h);
    return this._scaleCanvas;
  }

  _uploadVideoFrame(entry) {
    const gl = this.gl;
    const hasVideo = entry.videoEl && entry.videoEl.readyState >= 2;
    if (!hasVideo) return false;
    const src = this._maybeDownscale(entry, entry.videoEl, entry.videoEl.videoWidth, entry.videoEl.videoHeight);
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    return true;
  }

  _uploadSourceFrame(entry) {
    if (entry.videoEl) return this._uploadVideoFrame(entry);
    if (entry.imgEl) return this._uploadImageFrame(entry);
    return false;
  }

  _uploadImageFrame(entry) {
    const img = entry.imgEl;
    if (!img || !img.complete || img.naturalWidth === 0) return false;
    // Static image uploads once; gif re-uploads every frame to catch the current frame.
    // (A downscale change resets imgUploaded in render() so a still re-uploads at the new
    // size — see the `entry.downscale !== divisor` reset there.)
    if (entry.imgKind === "image" && entry.imgUploaded) return true;
    const gl = this.gl;
    const src = this._maybeDownscale(entry, img, img.naturalWidth, img.naturalHeight);
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    entry.imgUploaded = true;
    return true;
  }

  // Resolves a mask matte source ref (mask.source) to a texture for the current frame, or
  // null when unresolvable. SLOT refs reuse the shared source-bank (already frame-updated
  // by sourceBank.updateAll() before the layer loop — essentially free). MEDIA refs decode
  // through the per-mediaId matte cache below, mirroring setLayerSource's kind-branching.
  _resolveMatteTexture(source) {
    if (!source || typeof source !== "object") return null;
    if (source.type === "slot") {
      return this.sourceBank.resolveTexture(source.slotId, this.slots, this.media) ?? null;
    }
    if (source.type === "media") {
      return this._matteMediaTexture(source.mediaId);
    }
    return null;
  }

  // Decodes/uploads a media-library item's current frame into a cached texture keyed by
  // mediaId, and returns it (null if the item is missing). Reuses this.media's server-
  // recorded `kind` to branch <img> (gif/image) vs <video> — the same fix as
  // source-bank.js's _decodeMediaInto — and reuses this stack's own _uploadSourceFrame for
  // the per-frame GL upload rather than duplicating texImage2D code.
  _matteMediaTexture(mediaId) {
    const item = this.media?.[mediaId];
    if (!item) return null;
    const url = this._resolveUrl(`/media/${item.filename}`);
    let entry = this.matteEntries.get(mediaId);
    if (!entry) {
      entry = { texture: createTexture(this.gl), videoEl: null, imgEl: null, imgKind: null, imgUploaded: false, currentUrl: null };
      this.matteEntries.set(mediaId, entry);
    }
    if (entry.currentUrl !== url) {
      entry.currentUrl = url;
      if (entry.videoEl) { entry.videoEl.pause(); entry.videoEl.remove(); entry.videoEl = null; }
      if (entry.imgEl) { entry.imgEl.remove(); entry.imgEl = null; }
      entry.imgKind = null;
      entry.imgUploaded = false;
      const kind = item.kind ?? "video";
      if (kind === "video") {
        const el = document.createElement("video");
        el.src = url;
        el.crossOrigin = "anonymous";
        el.loop = true; // a matte plays continuously; it has no transport of its own
        el.muted = true;
        el.playsInline = true;
        el.play().catch(() => {});
        entry.videoEl = el;
      } else {
        // Still image (jpg/png) or animated gif: same off-screen-but-attached <img> the
        // source paths use so gif frame-advancement works in engines that need it.
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.style.cssText = "position: fixed; top: 0; left: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none;";
        img.addEventListener("load", () => { entry.imgUploaded = false; });
        img.src = url;
        document.body.appendChild(img);
        entry.imgEl = img;
        entry.imgKind = kind; // "gif" | "image"
      }
    }
    this._uploadSourceFrame(entry);
    return entry.texture;
  }

  // Frees any matte decoder for a mediaId no layer references this frame (mirrors
  // source-bank's updateAll sweep) — otherwise its <video>/<img> keeps decoding forever.
  _sweepMatteEntries(activeMatteMediaIds) {
    for (const [mediaId, entry] of [...this.matteEntries]) {
      if (activeMatteMediaIds.has(mediaId)) continue;
      if (entry.videoEl) { entry.videoEl.pause(); entry.videoEl.remove(); }
      if (entry.imgEl) entry.imgEl.remove();
      if (entry.texture) this.gl.deleteTexture(entry.texture);
      this.matteEntries.delete(mediaId);
    }
  }

  // layers: array of layer state objects, sorted by `order` ascending (bottom -> top).
  // Returns the WebGLTexture holding the fully composited scene.
  render(layers) {
    const gl = this.gl;
    const u = this.uniforms;
    gl.viewport(0, 0, this.width, this.height);

    let readIdx = 0;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingpong[readIdx].framebuffer);
    gl.clearColor(...this.groundColor, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.sourceBank.updateAll(this.slots, this.media);
    const activeMatteMediaIds = new Set();

    for (const layer of layers) {
      const entry = this._entry(layer.id);
      const isColor = layer.source?.type === "color";
      // Read from entry.sourceType/slotId (set by setLayerSource from the resolved
      // effective source), not layer.source — for playlist layers the two can differ, and
      // entry is the single source of truth for what's actually currently loaded.
      const isSlot = entry.sourceType === "slot";
      // Per-source downscale (task A15): applies only to a layer's DIRECT video/image/
      // camera upload, not a shared-slot source (whose texture is shared across layers).
      // Reset imgUploaded when it changes so a static image re-uploads at the new size.
      const divisor = Math.max(1, Math.floor(layer.downscale ?? 1));
      if (entry.downscale !== divisor) { entry.downscale = divisor; entry.imgUploaded = false; }
      let sourceTexture = entry.texture;
      if (isSlot) {
        sourceTexture = this.sourceBank.resolveTexture(entry.slotId, this.slots, this.media) ?? entry.texture;
      } else if (!isColor) {
        this._uploadSourceFrame(entry);
      }

      if (!isColor && !isSlot) this.applyTransport(layer, entry);

      // Effects chain: only entered when some stage is active. For color layers the
      // chain's point pass synthesizes the fill, so the blend pass then treats the
      // result as an ordinary texture.
      // Resolve the mask matte (VPT8 layermask `source` + cc.alphaglue lum2alpha): when
      // mask.source is set on an enabled mask, its luminance drives the alpha instead of
      // the geometric shape. Resolve just before process() so the texture is current.
      let matteTexture = null;
      if (layer.mask?.enabled && layer.mask.source) {
        matteTexture = this._resolveMatteTexture(layer.mask.source);
        if (layer.mask.source.type === "media" && layer.mask.source.mediaId) {
          activeMatteMediaIds.add(layer.mask.source.mediaId);
        }
      }

      let layerTexture = sourceTexture;
      let blendAsColor = isColor;
      const needsMaskOrWarp = layer.mask?.enabled || layer.warp?.mode === "mesh" || (layer.warp?.corners && !isIdentityCorners(layer.warp.corners));
      if (fxNeedsChain(layer.fx) || needsMaskOrWarp) {
        if (!entry.fxChain) entry.fxChain = new FxChain(gl, this.fxPasses, this.width, this.height);
        layerTexture = entry.fxChain.process(sourceTexture, layer.fx, {
          isColor,
          color: isColor ? layer.source.color : [0, 0, 0],
          mask: layer.mask,
          warp: layer.warp,
          matteTexture,
        });
        blendAsColor = false;
      }

      // (Re)bind the blend program per layer — the fx passes above use their own
      // programs and attribute state.
      gl.useProgram(this.program);
      bindFullscreenQuad(gl, this.program, this.quad);

      const writeIdx = 1 - readIdx;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingpong[writeIdx].framebuffer);
      gl.viewport(0, 0, this.width, this.height);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.pingpong[readIdx].texture);
      gl.uniform1i(u.prev, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, layerTexture);
      gl.uniform1i(u.layer, 1);

      gl.uniform1f(u.opacity, layer.opacity ?? 1);
      gl.uniform1i(u.blendMode, BLEND_INDEX[layer.blendMode] ?? 0);
      gl.uniform1i(u.isColor, blendAsColor ? 1 : 0);
      gl.uniform3fv(u.layerColor, blendAsColor ? layer.source.color : [0, 0, 0]);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      readIdx = writeIdx;
    }

    this._sweepMatteEntries(activeMatteMediaIds);
    return this.pingpong[readIdx].texture;
  }
}
