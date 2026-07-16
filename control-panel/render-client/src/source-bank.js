import { createProgram, createFullscreenQuad, bindFullscreenQuad, createTexture, createFramebuffer } from "./gl-utils.js";
import { applyVideoTransport, nativeLoop, clearTransportState } from "./transport.js";
import { cameraConstraints, cameraKey } from "./camera.js";
import { acquireGifPlayer, releaseGifPlayer, gifPlayerSupported } from "./gif.js";

// A slot with no transport in state (older state that predates task A9, or an
// impossible pre-backfill edge) falls back to the pre-A9 behavior — auto-play, whole-clip
// loop — so a shared slot never silently goes dark. Every server-provided slot carries a
// real transport (defaulting to paused), which takes precedence over this.
const FALLBACK_SLOT_TRANSPORT = { playing: true, rate: 1, loopIn: null, loopOut: null, loopMode: "loop", pan: 0, vol: 1, seek: null };

const MIX_VERT = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// Reuses the exact same 24-mode blend() ported in layers.js — duplicated here rather
// than shared via import because GLSL source strings aren't ES module exports; keep
// both copies in lockstep by hand (both are ported straight from the same VPT8 source
// files, see server/test/blend-modes-parity.test.js for the JS-side name-list parity
// check — this GLSL-level duplication has no automated parity check, a known gap).
const MIX_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_a;
uniform sampler2D u_b;
uniform int u_blendMode;
uniform float u_mix;
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
  return top;
}
void main() {
  vec4 a = texture(u_a, v_uv);
  vec4 b = texture(u_b, v_uv);
  vec3 blended = blend(a.rgb, b.rgb, u_blendMode);
  outColor = vec4(mix(a.rgb, blended, u_mix), 1.0);
}`;

// Same 24-name list and order as render-client/src/layers.js's BLEND_MODES and
// panel/src/components/types.ts's BLEND_MODES (server/test/blend-modes-parity.test.js
// checks those two; this third copy has no automated check against them — see this
// plan's Self-Review Notes for that known gap — so any future reordering of one list
// MUST be manually mirrored in the other two or a mix slot's blend-mode picker will
// silently select the wrong visual result).
const MIX_BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "difference", "add",
  "average", "brightlight", "burn", "darken", "dodge", "exclude",
  "freeze", "glow", "hardlight", "heat", "inverse", "lighten",
  "lumablend", "negate", "reflect", "softlight", "stamp", "subtractive",
];

function mediaUrlFor(mediaId, media, mediaOrigin) {
  const item = media?.[mediaId];
  if (!item) return null;
  return `${mediaOrigin}/media/${item.filename}`;
}

export class SourceBank {
  constructor(gl) {
    this.gl = gl;
    this.mixProgram = createProgram(gl, MIX_VERT, MIX_FRAG);
    this.mixQuad = createFullscreenQuad(gl);
    this.mixUniforms = {
      a: gl.getUniformLocation(this.mixProgram, "u_a"),
      b: gl.getUniformLocation(this.mixProgram, "u_b"),
      blendMode: gl.getUniformLocation(this.mixProgram, "u_blendMode"),
      mix: gl.getUniformLocation(this.mixProgram, "u_mix"),
    };
    this.entries = new Map(); // slotId -> { texture, videoEl, imgEl, currentUrl }
    this.mixFbos = new Map(); // slotId -> framebuffer, one per mix-type slot
    this.mediaOrigin = "";
    // Mix render-target size — kept in step with the layer stack's compositing size by
    // LayerStack.resize() so a mix isn't visibly softer than everything around it.
    this.renderWidth = 1280;
    this.renderHeight = 720;
  }

  setRenderSize(width, height) {
    this.renderWidth = Math.max(1, width | 0);
    this.renderHeight = Math.max(1, height | 0);
  }

  setMediaOrigin(origin) {
    this.mediaOrigin = origin || "";
  }

  // First live camera MediaStream held by any slot/mix input (task A14b — the camera
  // recorder captures this when no layer directly sources a camera). Null if none active.
  firstCameraStream() {
    for (const entry of this.entries.values()) {
      if (entry.stream && entry.stream.getVideoTracks?.().length) return entry.stream;
    }
    return null;
  }

  _mediaEntry(slotId) {
    if (!this.entries.has(slotId)) {
      this.entries.set(slotId, {
        texture: createTexture(this.gl), videoEl: null, imgEl: null, imgKind: null, imgUploaded: false,
        gifPlayer: null, stream: null, currentUrl: null,
      });
    }
    return this.entries.get(slotId);
  }

  // Tears down whatever source element(s) an entry currently holds (media <video>/<img>,
  // or a live-camera stream) without touching its GL texture — shared by the media/camera/
  // color decode paths (when content switches type), the per-frame sweep, and dispose().
  // Stopping camera tracks here is what releases the OS camera when a slot stops using it.
  _releaseElements(entry) {
    if (entry.videoEl) {
      entry.videoEl.pause();
      clearTransportState(entry, entry.videoEl); // detach loop handler + reset seek bookkeeping
      entry.videoEl.srcObject = null;
      entry.videoEl.remove();
      entry.videoEl = null;
    }
    if (entry.stream) {
      for (const track of entry.stream.getTracks()) track.stop();
      entry.stream = null;
    }
    if (entry.imgEl) { entry.imgEl.remove(); entry.imgEl = null; }
    if (entry.gifPlayer) { releaseGifPlayer(entry.gifPlayer); entry.gifPlayer = null; }
    entry.imgKind = null;
    entry.imgUploaded = false;
  }

  // Decodes/uploads one media ref's current frame into the entry keyed by `entryKey`.
  // Shared by both direct slot media (keyed by the slot's own id) and a mix's direct-
  // media a/b inputs (keyed by `${slot.id}:a`/`${slot.id}:b`) — factored out so both
  // paths actually decode, fixing an earlier draft where only direct slot media was
  // wired and a mix's own media inputs sampled a never-uploaded (black) texture.
  //
  // Mirrors layers.js's setLayerSource()/_uploadSourceFrame() kind-branching: an
  // <img> (gif/image) or a <video> element, picked by the media library item's own
  // `kind` (a slot always references a mediaId, so the item's server-recorded kind is
  // available directly here — layers.js instead sniffs mediaKindFromUrl(url) because a
  // layer's direct `source` can also be an arbitrary external URL with no media-library
  // entry). Previously this always built a <video>, so a jpg/gif's readyState never
  // reached 2 and the slot rendered black forever.
  _decodeMediaInto(entryKey, mediaId, media, transport) {
    const entry = this._mediaEntry(entryKey);
    const url = mediaUrlFor(mediaId, media, this.mediaOrigin);
    if (!url) return;
    // The slot owns its own transport (task A9) — because many layers can share this
    // slot, play/rate/loop/scrub live here, not on any consuming layer.
    const t = transport ?? FALLBACK_SLOT_TRANSPORT;
    if (entry.currentUrl !== url) {
      entry.currentUrl = url;
      this._releaseElements(entry); // drop any prior media/camera source before rebinding
      const kind = media?.[mediaId]?.kind ?? "video";
      if (kind === "video") {
        const el = document.createElement("video");
        el.src = url;
        el.crossOrigin = "anonymous";
        el.loop = nativeLoop(t); // was hardcoded true; now the slot's loopMode governs (task A9/A10)
        el.muted = true; // shared slots never own audio directly — a layer/mix consuming one does, per the transport work in Task 14
        el.playsInline = true;
        el.preload = "auto"; // decode the first frame even while paused, so a stopped slot shows a frame rather than black
        // No el.play() here — applyVideoTransport() below starts it only if the slot's
        // transport says `playing`, so a paused slot's texture never advances.
        entry.videoEl = el;
      } else {
        // Still image (jpg) or animated gif: sample an <img> into the texture. As in
        // layers.js's setLayerSource, the element is attached to the document
        // (off-screen, invisible) rather than left detached — gif frame-advancement is
        // tied to the element being part of the active render tree in some browser
        // engines, unlike <video>, whose playback is well-defined even while detached.
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.style.cssText = "position: fixed; top: 0; left: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none;";
        img.src = url;
        document.body.appendChild(img);
        entry.imgEl = img;
        entry.imgKind = kind; // "gif" | "image"
        entry.imgUploaded = false;
        // Animated gif in a slot: decode frames with a GifPlayer (a GL upload of an
        // animated <img> only ever takes the FIRST frame — see gif.js); the <img>
        // stays as the static fallback when ImageDecoder is unavailable/fails.
        if (kind === "gif" && gifPlayerSupported()) entry.gifPlayer = acquireGifPlayer(url);
      }
    }
    if (entry.videoEl) {
      // Keep native loop in sync with the slot's loopMode every frame (the layer path
      // resyncs this via setLayerSource; the slot path owns it here). Then drive play/pause,
      // rate, loop-region/palindrome, and scrub seek — a paused slot stops advancing.
      const wantLoop = nativeLoop(t);
      if (entry.videoEl.loop !== wantLoop) entry.videoEl.loop = wantLoop;
      applyVideoTransport(entry.videoEl, t, entry);
      this._uploadVideoFrame(entry);
    } else if (entry.imgEl) {
      this._uploadImageFrame(entry);
    }
  }

  // Decodes/uploads a live-camera ref's current frame into the entry keyed by `entryKey`
  // (task A13/A14 — VPT8's cam1/cam2 as a slot or mix input). Re-acquires getUserMedia only
  // when the device/resolution signature changes (cameraKey), same as layers.js's camera
  // path; a slot camera has no transport (always live, muted, video-only).
  _decodeCameraInto(entryKey, ref) {
    const entry = this._mediaEntry(entryKey);
    const key = cameraKey(ref.deviceId, ref.resolution);
    if (entry.currentUrl !== key) {
      entry.currentUrl = key;
      this._releaseElements(entry);
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      entry.videoEl = video;
      navigator.mediaDevices
        ?.getUserMedia(cameraConstraints(ref.deviceId, ref.resolution))
        .then((stream) => {
          if (entry.currentUrl !== key) {
            for (const track of stream.getTracks()) track.stop();
            return; // slot content changed while the permission prompt was open
          }
          entry.stream = stream;
          video.srcObject = stream;
          video.play().catch((err) => console.warn("[source-bank] camera play failed:", err.message));
        })
        .catch((err) => console.warn("[source-bank] camera unavailable:", err.message));
    }
    if (entry.videoEl) this._uploadVideoFrame(entry);
  }

  // Synthesizes a solid-color 1x1 texture for a color ref (task A13 — VPT8's solid1/solid2).
  // Uploaded once per color value (short-circuited by the "color:<r>,<g>,<b>" signature),
  // then sampled with CLAMP_TO_EDGE so it fills any consumer. `color` is rgb 0..1.
  _synthColorInto(entryKey, color) {
    const entry = this._mediaEntry(entryKey);
    const rgb = Array.isArray(color) ? color : [0, 0, 0];
    const key = `color:${rgb.join(",")}`;
    if (entry.currentUrl === key) return;
    entry.currentUrl = key;
    this._releaseElements(entry);
    const gl = this.gl;
    const byte = (c) => Math.max(0, Math.min(255, Math.round((c ?? 0) * 255)));
    const px = new Uint8Array([byte(rgb[0]), byte(rgb[1]), byte(rgb[2]), 255]);
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
  }

  _uploadVideoFrame(entry) {
    if (entry.videoEl.readyState < 2) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, entry.videoEl);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  _uploadImageFrame(entry) {
    // An animating gif samples its GifPlayer's canvas (the CURRENT decoded frame);
    // stills — and gifs whose player isn't ready/failed — sample the <img> (which for
    // an animated gif is always its first frame).
    const gifCanvas = entry.gifPlayer?.ready ? entry.gifPlayer.canvas : null;
    const img = entry.imgEl;
    if (!gifCanvas && (!img.complete || img.naturalWidth === 0)) return;
    // Static image uploads once; gif re-uploads every frame to catch the current frame.
    if (entry.imgKind === "image" && entry.imgUploaded) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gifCanvas ?? img);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    entry.imgUploaded = true;
  }

  // Decodes/uploads the current frame for every media-type slot AND every mix slot's
  // direct-media a/b inputs. Called once per frame, before layer rendering, mirroring
  // LayerStack's own per-frame upload step.
  updateAll(slots, media) {
    const activeKeys = new Set();
    // Decodes one slot input (a slot's own content, or a mix's `a`/`b` ref) into the entry
    // keyed by `key`, branching on its type. A "slot" ref resolves live in resolveTexture,
    // so it needs no decode entry here. Camera/color are terminal, same as media.
    const decodeInput = (input, key, transport) => {
      if (input?.type === "media") { activeKeys.add(key); this._decodeMediaInto(key, input.mediaId, media, transport); }
      else if (input?.type === "camera") { activeKeys.add(key); this._decodeCameraInto(key, input); }
      else if (input?.type === "color") { activeKeys.add(key); this._synthColorInto(key, input.color); }
    };
    for (const slot of slots ?? []) {
      // One transport per slot (task A9). A mix slot's two inputs (a/b) both obey the slot's
      // single transport — play/pause/rate/loop apply to the pair together (camera/color
      // ignore transport, having no timeline).
      const transport = slot.transport;
      const content = slot.content;
      if (content?.type === "mix") {
        decodeInput(content.a, `${slot.id}:a`, transport);
        decodeInput(content.b, `${slot.id}:b`, transport);
      } else {
        decodeInput(content, slot.id, transport);
      }
    }
    // Release any entry a slot no longer decodes — content cleared, or the slot switched
    // type (which re-keys to `${id}:a`/`:b` for a mix, or drops a camera stream). Without
    // this its <video>/camera keeps decoding invisibly forever. (updateAll runs before
    // resolveTexture in the frame, and only inactive keys are swept, so nothing recreates
    // them this frame.)
    for (const [key, entry] of [...this.entries]) {
      if (activeKeys.has(key)) continue;
      this._releaseElements(entry); // stops <video>/<img> AND live-camera tracks
      if (entry.texture) this.gl.deleteTexture(entry.texture);
      this.entries.delete(key);
    }
    // Free mix framebuffers for slots that are no longer mixes.
    const mixSlotIds = new Set((slots ?? []).filter((s) => s.content?.type === "mix").map((s) => s.id));
    for (const [slotId, fbo] of [...this.mixFbos]) {
      if (mixSlotIds.has(slotId)) continue;
      this.gl.deleteFramebuffer(fbo.framebuffer);
      this.gl.deleteTexture(fbo.texture);
      this.mixFbos.delete(slotId);
    }
  }

  resolveTexture(slotId, slots, media, depth = 0) {
    if (depth > 2) return null;
    const slot = (slots ?? []).find((s) => s.id === slotId);
    if (!slot?.content) return null;
    // media/camera/color all decode into this slot's own entry (keyed by slot.id) in
    // updateAll — return that texture directly.
    if (slot.content.type === "media" || slot.content.type === "camera" || slot.content.type === "color") {
      return this._mediaEntry(slot.id).texture;
    }
    if (slot.content.type === "mix") {
      const { a, b, blendMode, mix } = slot.content;
      // A "slot" ref recurses; media/camera/color resolve to the `${slot.id}:a`/`:b` entry
      // decoded in updateAll. Anything else (or a null ref) is a missing input.
      const resolveSide = (ref, side) =>
        ref?.type === "slot"
          ? this.resolveTexture(ref.slotId, slots, media, depth + 1)
          : (ref?.type === "media" || ref?.type === "camera" || ref?.type === "color")
            ? this._mediaEntry(`${slot.id}:${side}`).texture
            : null;
      const texA = resolveSide(a, "a");
      const texB = resolveSide(b, "b");
      // Missing-input behavior (design spec, Section 2): pass the other input through
      // at full weight rather than rendering black.
      if (!texA && !texB) return null;
      if (!texA) return texB;
      if (!texB) return texA;

      const gl = this.gl;
      // Recreate on size mismatch too (window resize / fullscreen changed the
      // compositing size), not just on first use.
      const stale = this.mixFbos.get(slot.id);
      if (stale && (stale.width !== this.renderWidth || stale.height !== this.renderHeight)) {
        gl.deleteFramebuffer(stale.framebuffer);
        gl.deleteTexture(stale.texture);
        this.mixFbos.delete(slot.id);
      }
      if (!this.mixFbos.has(slot.id)) this.mixFbos.set(slot.id, createFramebuffer(gl, this.renderWidth, this.renderHeight));
      const fbo = this.mixFbos.get(slot.id);
      const modeIndex = MIX_BLEND_MODES.indexOf(blendMode);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
      gl.viewport(0, 0, fbo.width, fbo.height);
      gl.useProgram(this.mixProgram);
      bindFullscreenQuad(gl, this.mixProgram, this.mixQuad);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texA);
      gl.uniform1i(this.mixUniforms.a, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texB);
      gl.uniform1i(this.mixUniforms.b, 1);
      gl.uniform1i(this.mixUniforms.blendMode, Math.max(0, modeIndex));
      gl.uniform1f(this.mixUniforms.mix, mix ?? 0.5);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return fbo.texture;
    }
    return null;
  }

  dispose() {
    const gl = this.gl;
    for (const entry of this.entries.values()) {
      this._releaseElements(entry); // stops <video>/<img> AND live-camera tracks
      if (entry.texture) gl.deleteTexture(entry.texture);
    }
    this.entries.clear();
    for (const fbo of this.mixFbos.values()) {
      gl.deleteFramebuffer(fbo.framebuffer);
      gl.deleteTexture(fbo.texture); // was leaked: only the framebuffer was freed
    }
    this.mixFbos.clear();
    gl.deleteProgram(this.mixProgram);
  }
}
