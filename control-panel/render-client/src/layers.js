import { createProgram, createFullscreenQuad, bindFullscreenQuad, createTexture, createFramebuffer } from "./gl-utils.js";
import { FxPasses, FxChain, fxNeedsChain } from "./fx.js";
import { SourceBank } from "./source-bank.js";

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
  if (ext === "jpg" || ext === "jpeg") return "image";
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
  if (mode == 12) return clamp(1.0 - pow(1.0 - base, 2.0) / max(top, 0.0001), 0.0, 1.0);
  if (mode == 13) return clamp((top * top) / max(1.0 - base, 0.0001), 0.0, 1.0);
  if (mode == 14) {
    float luminance = dot(base, vec3(0.2125, 0.7154, 0.0721));
    float mixAmount = clamp((luminance - 0.45) * 10.0, 0.0, 1.0);
    return mix(2.0 * top * base, 1.0 - 2.0 * (1.0 - top) * (1.0 - base), vec3(mixAmount));
  }
  if (mode == 15) return clamp(1.0 - pow(1.0 - top, 2.0) / max(base, 0.0001), 0.0, 1.0);
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
  }

  setMediaOrigin(origin) {
    this.mediaOrigin = origin || "";
    this.sourceBank.setMediaOrigin(origin);
  }

  setSourceContext(slots, media) {
    this.slots = slots ?? [];
    this.media = media ?? {};
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
      entry.videoEl = null;
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

  setLayerSource(id, source) {
    const entry = this._entry(id);
    if (source?.type === "video") {
      const url = this._resolveUrl(source.url);
      const kind = mediaKindFromUrl(source.url);
      if (entry.currentUrl === url) return;
      entry.currentUrl = url;
      this._stopSource(entry);
      if (kind === "video") {
        const video = document.createElement("video");
        video.src = url;
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true; // corrected by setLayerMuted() per the audio-owner policy
        video.playsInline = true;
        video.play().catch((err) => console.warn(`[layers] could not play "${url}":`, err.message));
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
      // never participates in the audio-owner policy.
      if (entry.currentUrl === "camera:") return;
      entry.currentUrl = "camera:";
      this._stopSource(entry);
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      entry.videoEl = video;
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (entry.currentUrl !== "camera:") {
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
    if (entry?.videoEl) entry.videoEl.muted = muted;
  }

  removeLayer(id) {
    const entry = this.entries.get(id);
    if (!entry) return;
    this._stopSource(entry);
    entry.fxChain?.dispose();
    this.entries.delete(id);
  }

  _uploadVideoFrame(entry) {
    const gl = this.gl;
    const hasVideo = entry.videoEl && entry.videoEl.readyState >= 2;
    if (!hasVideo) return false;
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, entry.videoEl);
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
    if (entry.imgKind === "image" && entry.imgUploaded) return true;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    entry.imgUploaded = true;
    return true;
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

    for (const layer of layers) {
      const entry = this._entry(layer.id);
      const isColor = layer.source?.type === "color";
      const isSlot = layer.source?.type === "slot";
      let sourceTexture = entry.texture;
      if (isSlot) {
        sourceTexture = this.sourceBank.resolveTexture(layer.source.slotId, this.slots, this.media) ?? entry.texture;
      } else if (!isColor) {
        this._uploadSourceFrame(entry);
      }

      // Effects chain: only entered when some stage is active. For color layers the
      // chain's point pass synthesizes the fill, so the blend pass then treats the
      // result as an ordinary texture.
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

    return this.pingpong[readIdx].texture;
  }
}

export { BLEND_MODES };
