import { createProgram, createFullscreenQuad, bindFullscreenQuad, createTexture, createFramebuffer } from "./gl-utils.js";

const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "difference", "add"];
const BLEND_INDEX = Object.fromEntries(BLEND_MODES.map((mode, i) => [mode, i]));

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

uniform bool u_maskEnabled;
uniform int u_maskShape; // 0 = rect, 1 = ellipse
uniform vec2 u_maskCenter;
uniform vec2 u_maskRadius;
uniform float u_maskFeather;

out vec4 outColor;

float maskAlpha() {
  if (!u_maskEnabled) return 1.0;
  vec2 d = (v_uv - u_maskCenter) / max(u_maskRadius, vec2(0.0001));
  float dist = (u_maskShape == 1) ? length(d) : max(abs(d.x), abs(d.y));
  return 1.0 - smoothstep(1.0 - u_maskFeather, 1.0, dist);
}

vec3 blend(vec3 base, vec3 top, int mode) {
  if (mode == 1) return base * top;
  if (mode == 2) return 1.0 - (1.0 - base) * (1.0 - top);
  if (mode == 3) return mix(2.0 * base * top, 1.0 - 2.0 * (1.0 - base) * (1.0 - top), step(0.5, base));
  if (mode == 4) return abs(base - top);
  if (mode == 5) return min(base + top, 1.0);
  return top;
}

void main() {
  vec4 prev = texture(u_prev, v_uv);
  vec4 layer = u_isColor ? vec4(u_layerColor, 1.0) : texture(u_layer, v_uv);
  float a = clamp(u_opacity, 0.0, 1.0) * layer.a * maskAlpha();
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
        ["u_isColor", "isColor"], ["u_layerColor", "layerColor"], ["u_maskEnabled", "maskEnabled"],
        ["u_maskShape", "maskShape"], ["u_maskCenter", "maskCenter"], ["u_maskRadius", "maskRadius"],
        ["u_maskFeather", "maskFeather"],
      ].map(([glName, key]) => [key, gl.getUniformLocation(this.program, glName)])
    );

    this.width = 0;
    this.height = 0;
    this.pingpong = [null, null];
    this.groundColor = [0x0a / 255, 0x0c / 255, 0x11 / 255];
    this.entries = new Map(); // layer id -> { texture, videoEl, currentUrl }
  }

  resize(width, height) {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    const gl = this.gl;
    this.pingpong = [createFramebuffer(gl, width, height), createFramebuffer(gl, width, height)];
  }

  _entry(id) {
    if (!this.entries.has(id)) {
      this.entries.set(id, { texture: createTexture(this.gl), videoEl: null, currentUrl: null });
    }
    return this.entries.get(id);
  }

  setLayerSource(id, source) {
    const entry = this._entry(id);
    if (source?.type === "video") {
      if (entry.currentUrl === source.url) return;
      entry.currentUrl = source.url;
      if (entry.videoEl) {
        entry.videoEl.pause();
        entry.videoEl.removeAttribute("src");
        entry.videoEl.load();
      }
      const video = document.createElement("video");
      video.src = source.url;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true; // corrected by setLayerMuted() per the audio-owner policy
      video.playsInline = true;
      video.play().catch((err) => console.warn(`[layers] could not play "${source.url}":`, err.message));
      entry.videoEl = video;
    } else {
      entry.currentUrl = null;
      if (entry.videoEl) entry.videoEl.pause();
      entry.videoEl = null;
    }
  }

  setLayerMuted(id, muted) {
    const entry = this.entries.get(id);
    if (entry?.videoEl) entry.videoEl.muted = muted;
  }

  removeLayer(id) {
    const entry = this.entries.get(id);
    if (entry?.videoEl) entry.videoEl.pause();
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

    gl.useProgram(this.program);
    bindFullscreenQuad(gl, this.program, this.quad);

    for (const layer of layers) {
      const entry = this._entry(layer.id);
      const isColor = layer.source?.type === "color";
      if (!isColor) this._uploadVideoFrame(entry);

      const writeIdx = 1 - readIdx;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingpong[writeIdx].framebuffer);
      gl.viewport(0, 0, this.width, this.height);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.pingpong[readIdx].texture);
      gl.uniform1i(u.prev, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, entry.texture);
      gl.uniform1i(u.layer, 1);

      gl.uniform1f(u.opacity, layer.opacity ?? 1);
      gl.uniform1i(u.blendMode, BLEND_INDEX[layer.blendMode] ?? 0);
      gl.uniform1i(u.isColor, isColor ? 1 : 0);
      gl.uniform3fv(u.layerColor, isColor ? layer.source.color : [0, 0, 0]);

      const mask = layer.mask || {};
      gl.uniform1i(u.maskEnabled, mask.enabled ? 1 : 0);
      gl.uniform1i(u.maskShape, mask.shape === "rect" ? 0 : 1);
      gl.uniform2f(u.maskCenter, mask.cx ?? 0.5, mask.cy ?? 0.5);
      gl.uniform2f(u.maskRadius, mask.rx ?? 0.5, mask.ry ?? 0.5);
      gl.uniform1f(u.maskFeather, mask.feather ?? 0.05);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      readIdx = writeIdx;
    }

    return this.pingpong[readIdx].texture;
  }
}

export { BLEND_MODES };
