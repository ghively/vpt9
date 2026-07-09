import { createProgram, createFullscreenQuad, bindFullscreenQuad, createTexture, createFramebuffer } from "./gl-utils.js";

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
  }

  setMediaOrigin(origin) {
    this.mediaOrigin = origin || "";
  }

  _mediaEntry(slotId) {
    if (!this.entries.has(slotId)) {
      this.entries.set(slotId, { texture: createTexture(this.gl), videoEl: null, imgEl: null, currentUrl: null });
    }
    return this.entries.get(slotId);
  }

  // Decodes/uploads one media ref's current frame into the entry keyed by `entryKey`.
  // Shared by both direct slot media (keyed by the slot's own id) and a mix's direct-
  // media a/b inputs (keyed by `${slot.id}:a`/`${slot.id}:b`) — factored out so both
  // paths actually decode, fixing an earlier draft where only direct slot media was
  // wired and a mix's own media inputs sampled a never-uploaded (black) texture.
  _decodeMediaInto(entryKey, mediaId, media) {
    const entry = this._mediaEntry(entryKey);
    const url = mediaUrlFor(mediaId, media, this.mediaOrigin);
    if (!url) return;
    if (entry.currentUrl !== url) {
      entry.currentUrl = url;
      if (entry.videoEl) { entry.videoEl.pause(); entry.videoEl.remove(); entry.videoEl = null; }
      const el = document.createElement("video");
      el.src = url;
      el.crossOrigin = "anonymous";
      el.loop = true;
      el.muted = true; // shared slots never own audio directly — a layer/mix consuming one does, per the transport work in Task 14
      el.playsInline = true;
      el.play().catch(() => {});
      entry.videoEl = el;
    }
    if (entry.videoEl && entry.videoEl.readyState >= 2) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, entry.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, entry.videoEl);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }
  }

  // Decodes/uploads the current frame for every media-type slot AND every mix slot's
  // direct-media a/b inputs. Called once per frame, before layer rendering, mirroring
  // LayerStack's own per-frame upload step.
  updateAll(slots, media) {
    for (const slot of slots ?? []) {
      if (slot.content?.type === "media") {
        this._decodeMediaInto(slot.id, slot.content.mediaId, media);
      } else if (slot.content?.type === "mix") {
        if (slot.content.a?.type === "media") this._decodeMediaInto(`${slot.id}:a`, slot.content.a.mediaId, media);
        if (slot.content.b?.type === "media") this._decodeMediaInto(`${slot.id}:b`, slot.content.b.mediaId, media);
      }
    }
  }

  resolveTexture(slotId, slots, media, depth = 0) {
    if (depth > 2) return null;
    const slot = (slots ?? []).find((s) => s.id === slotId);
    if (!slot?.content) return null;
    if (slot.content.type === "media") {
      return this._mediaEntry(slot.id).texture;
    }
    if (slot.content.type === "mix") {
      const { a, b, blendMode, mix } = slot.content;
      const texA = a?.type === "slot" ? this.resolveTexture(a.slotId, slots, media, depth + 1) : a?.type === "media" ? this._mediaEntry(`${slot.id}:a`).texture : null;
      const texB = b?.type === "slot" ? this.resolveTexture(b.slotId, slots, media, depth + 1) : b?.type === "media" ? this._mediaEntry(`${slot.id}:b`).texture : null;
      // Missing-input behavior (design spec, Section 2): pass the other input through
      // at full weight rather than rendering black.
      if (!texA && !texB) return null;
      if (!texA) return texB;
      if (!texB) return texA;

      const gl = this.gl;
      if (!this.mixFbos.has(slot.id)) this.mixFbos.set(slot.id, createFramebuffer(gl, 1280, 720));
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
    for (const fbo of this.mixFbos.values()) this.gl.deleteFramebuffer(fbo.framebuffer);
  }
}
