import { createProgram, createFullscreenQuad, bindFullscreenQuad, createFramebuffer } from "./gl-utils.js";
import { ScreenWarp } from "./warp.js";

// Per-layer effects chain — the WebGL port of vlayer.maxpat's processing stages, in the
// same order: flip → tile → zoom/pan → brcosa + edge-blend → blur → motion-blur → mask
// → per-layer warp. Mask precedes warp to match VPT8's vlayer order (mask, then mesh),
// so the mask deforms along with the warp. (Blend-mode compositing stays in the
// LayerStack blend pass; the separate screen-level mesh warp — the house master fader —
// still lives in ScreenWarp, reused here via its generalized offscreen-target render().)
//
// Cost model: a layer whose fx are all defaults never enters this file (see
// fxNeedsChain). When any stage is active, the point-wise stages (flip/tile/zoom/pan/
// brcosa/edge-blend) are ONE shader pass; gaussian blur adds two separable passes and
// motion-blur one feedback pass, each only when non-zero.

const QUAD_VERT = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// Scene-space orientation note: y=1 is the top (videos are uploaded with FLIP_Y and the
// screen warp flips back) — so the "top" edge-blend ramp keys off (1 - v_uv.y).
const POINT_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform bool u_isColor;
uniform vec3 u_color;
uniform bvec2 u_flip;      // (flipH, flipV)
uniform vec2 u_tile;       // repeat counts, 1 = off
uniform float u_zoom;
uniform vec2 u_pan;
uniform vec3 u_brcosa;     // brightness, contrast, saturation
uniform vec4 u_edges;      // left, right, top, bottom fractional widths
uniform float u_edgeGamma;
out vec4 outColor;

void main() {
  // Inverse of the image-space op chain flip -> tile -> zoom/pan: undo zoom/pan, then
  // tiling, then flip, and sample there.
  vec2 uv = (v_uv - 0.5) / max(u_zoom, 0.001) + 0.5 - u_pan;

  float border = 1.0;
  vec2 suv;
  if (u_tile.x > 1.0) {
    suv.x = fract(uv.x * u_tile.x);
  } else {
    suv.x = uv.x;
    if (uv.x < 0.0 || uv.x > 1.0) border = 0.0; // zoomed/panned past the frame: transparent
  }
  if (u_tile.y > 1.0) {
    suv.y = fract(uv.y * u_tile.y);
  } else {
    suv.y = uv.y;
    if (uv.y < 0.0 || uv.y > 1.0) border = 0.0;
  }
  if (u_flip.x) suv.x = 1.0 - suv.x;
  if (u_flip.y) suv.y = 1.0 - suv.y;

  vec4 c = u_isColor ? vec4(u_color, 1.0) : texture(u_src, clamp(suv, 0.0, 1.0));

  // brcosa: contrast about mid-grey, then brightness gain, then saturation vs. luma.
  c.rgb = (c.rgb - 0.5) * u_brcosa.y + 0.5;
  c.rgb *= u_brcosa.x;
  float luma = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  c.rgb = mix(vec3(luma), c.rgb, u_brcosa.z);

  // Edge-blend: per-edge gamma-shaped alpha ramp (projector-overlap feathering).
  float e = 1.0;
  if (u_edges.x > 0.0) e *= pow(clamp(v_uv.x / u_edges.x, 0.0, 1.0), u_edgeGamma);
  if (u_edges.y > 0.0) e *= pow(clamp((1.0 - v_uv.x) / u_edges.y, 0.0, 1.0), u_edgeGamma);
  if (u_edges.z > 0.0) e *= pow(clamp((1.0 - v_uv.y) / u_edges.z, 0.0, 1.0), u_edgeGamma);
  if (u_edges.w > 0.0) e *= pow(clamp(v_uv.y / u_edges.w, 0.0, 1.0), u_edgeGamma);

  outColor = vec4(c.rgb, c.a * border * e);
}`;

// Mask bake: same formula as layers.js's former maskAlpha(), moved here so masking
// deforms along with per-layer warp (matching VPT8's vlayer order: mask, then mesh).
const MASK_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform bool u_maskEnabled;
uniform int u_maskShape; // 0 = rect, 1 = ellipse
uniform vec2 u_maskCenter;
uniform vec2 u_maskRadius;
uniform float u_maskFeather;
out vec4 outColor;
void main() {
  vec4 c = texture(u_src, v_uv);
  if (!u_maskEnabled) { outColor = c; return; }
  vec2 d = (v_uv - u_maskCenter) / max(u_maskRadius, vec2(0.0001));
  float dist = (u_maskShape == 1) ? length(d) : max(abs(d.x), abs(d.y));
  float a = 1.0 - smoothstep(1.0 - u_maskFeather, 1.0, dist);
  outColor = vec4(c.rgb, c.a * a);
}`;

// 9-tap separable gaussian; u_dir carries both the axis and the per-tap spread.
const BLUR_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform vec2 u_dir;
out vec4 outColor;

void main() {
  float w[5];
  w[0] = 0.227027; w[1] = 0.1945946; w[2] = 0.1216216; w[3] = 0.054054; w[4] = 0.016216;
  vec4 sum = texture(u_src, v_uv) * w[0];
  for (int i = 1; i < 5; i++) {
    sum += texture(u_src, v_uv + u_dir * float(i)) * w[i];
    sum += texture(u_src, v_uv - u_dir * float(i)) * w[i];
  }
  outColor = sum;
}`;

// Feedback trail: mix the fresh frame with the previous accumulated frame.
const FEEDBACK_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform sampler2D u_prev;
uniform float u_amount;
out vec4 outColor;

void main() {
  outColor = mix(texture(u_src, v_uv), texture(u_prev, v_uv), u_amount);
}`;

/** True when any fx stage differs from "off" — the gate that keeps default layers on
 *  the zero-cost path. */
export function fxNeedsChain(fx) {
  if (!fx) return false;
  const eb = fx.edgeBlend ?? {};
  return Boolean(
    fx.flipH || fx.flipV ||
    (fx.tileX ?? 1) !== 1 || (fx.tileY ?? 1) !== 1 ||
    (fx.zoom ?? 1) !== 1 || (fx.panX ?? 0) !== 0 || (fx.panY ?? 0) !== 0 ||
    (fx.blur ?? 0) > 0 || (fx.motionBlur ?? 0) > 0 ||
    (fx.brightness ?? 1) !== 1 || (fx.contrast ?? 1) !== 1 || (fx.saturation ?? 1) !== 1 ||
    (eb.left ?? 0) > 0 || (eb.right ?? 0) > 0 || (eb.top ?? 0) > 0 || (eb.bottom ?? 0) > 0
  );
}

/** Compiled programs + quad, shared by every layer's FxChain (one per GL context). */
export class FxPasses {
  constructor(gl) {
    this.gl = gl;
    this.quad = createFullscreenQuad(gl);
    this.point = createProgram(gl, QUAD_VERT, POINT_FRAG);
    this.blur = createProgram(gl, QUAD_VERT, BLUR_FRAG);
    this.feedback = createProgram(gl, QUAD_VERT, FEEDBACK_FRAG);
    this.mask = createProgram(gl, QUAD_VERT, MASK_FRAG);
    this.u = {
      point: Object.fromEntries(
        ["u_src", "u_isColor", "u_color", "u_flip", "u_tile", "u_zoom", "u_pan", "u_brcosa", "u_edges", "u_edgeGamma"]
          .map((name) => [name, gl.getUniformLocation(this.point, name)])
      ),
      blur: Object.fromEntries(
        ["u_src", "u_dir"].map((name) => [name, gl.getUniformLocation(this.blur, name)])
      ),
      feedback: Object.fromEntries(
        ["u_src", "u_prev", "u_amount"].map((name) => [name, gl.getUniformLocation(this.feedback, name)])
      ),
      mask: Object.fromEntries(
        ["u_src", "u_maskEnabled", "u_maskShape", "u_maskCenter", "u_maskRadius", "u_maskFeather"]
          .map((name) => [name, gl.getUniformLocation(this.mask, name)])
      ),
    };
  }
}

/** Per-layer render targets for the chain. Lazily built by LayerStack the first time a
 *  layer has active fx; owns its FBOs (including the motion-blur feedback pair). */
export class FxChain {
  constructor(gl, passes, width, height) {
    this.gl = gl;
    this.passes = passes;
    this.width = width;
    this.height = height;
    this.pointFbo = createFramebuffer(gl, width, height);
    this.blurFbo = null;     // pair, allocated on first blur
    this.feedbackFbo = null; // pair, allocated on first motion-blur
    this.feedbackIdx = 0;
    this.maskFbo = null;
    this.warpRenderer = new ScreenWarp(gl);
    this.warpFbo = null;
  }

  _draw(program, targetFbo) {
    const gl = this.gl;
    gl.useProgram(program);
    bindFullscreenQuad(gl, program, this.passes.quad);
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo.framebuffer);
    gl.viewport(0, 0, this.width, this.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  _runPoint(srcTexture, fx, isColor, color) {
    const gl = this.gl;
    const u = this.passes.u.point;
    const eb = fx.edgeBlend ?? {};
    gl.useProgram(this.passes.point);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    gl.uniform1i(u.u_src, 0);
    gl.uniform1i(u.u_isColor, isColor ? 1 : 0);
    gl.uniform3fv(u.u_color, isColor ? color : [0, 0, 0]);
    gl.uniform2i(u.u_flip, fx.flipH ? 1 : 0, fx.flipV ? 1 : 0);
    gl.uniform2f(u.u_tile, fx.tileX ?? 1, fx.tileY ?? 1);
    gl.uniform1f(u.u_zoom, fx.zoom ?? 1);
    gl.uniform2f(u.u_pan, fx.panX ?? 0, fx.panY ?? 0);
    gl.uniform3f(u.u_brcosa, fx.brightness ?? 1, fx.contrast ?? 1, fx.saturation ?? 1);
    gl.uniform4f(u.u_edges, eb.left ?? 0, eb.right ?? 0, eb.top ?? 0, eb.bottom ?? 0);
    gl.uniform1f(u.u_edgeGamma, eb.gamma ?? 2);
    this._draw(this.passes.point, this.pointFbo);
    return this.pointFbo.texture;
  }

  _runBlur(srcTexture, amount) {
    const gl = this.gl;
    const u = this.passes.u.blur;
    if (!this.blurFbo) {
      this.blurFbo = [createFramebuffer(gl, this.width, this.height), createFramebuffer(gl, this.width, this.height)];
    }
    // amount 0..1 -> tap spread in texels; 9 taps at up to 4px apart reads wide enough
    // for a heavy stage-wash blur at the 720p internal resolution.
    const spread = amount * 4;
    const passes = [
      { dir: [spread / this.width, 0], target: this.blurFbo[0] },
      { dir: [0, spread / this.height], target: this.blurFbo[1] },
    ];
    let tex = srcTexture;
    for (const { dir, target } of passes) {
      gl.useProgram(this.passes.blur);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(u.u_src, 0);
      gl.uniform2f(u.u_dir, dir[0], dir[1]);
      this._draw(this.passes.blur, target);
      tex = target.texture;
    }
    return tex;
  }

  _runFeedback(srcTexture, amount) {
    const gl = this.gl;
    const u = this.passes.u.feedback;
    if (!this.feedbackFbo) {
      this.feedbackFbo = [createFramebuffer(gl, this.width, this.height), createFramebuffer(gl, this.width, this.height)];
    }
    const write = this.feedbackFbo[this.feedbackIdx];
    const prev = this.feedbackFbo[1 - this.feedbackIdx];
    this.feedbackIdx = 1 - this.feedbackIdx;

    gl.useProgram(this.passes.feedback);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    gl.uniform1i(u.u_src, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, prev.texture);
    gl.uniform1i(u.u_prev, 1);
    // 0.95 cap: a persistence of 1.0 would freeze the trail forever.
    gl.uniform1f(u.u_amount, Math.min(0.95, Math.max(0, amount)));
    this._draw(this.passes.feedback, write);
    return write.texture;
  }

  _runMask(srcTexture, mask) {
    const gl = this.gl;
    const u = this.passes.u.mask;
    gl.useProgram(this.passes.mask);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    gl.uniform1i(u.u_src, 0);
    gl.uniform1i(u.u_maskEnabled, mask?.enabled ? 1 : 0);
    gl.uniform1i(u.u_maskShape, mask?.shape === "rect" ? 0 : 1);
    gl.uniform2f(u.u_maskCenter, mask?.cx ?? 0.5, mask?.cy ?? 0.5);
    gl.uniform2f(u.u_maskRadius, mask?.rx ?? 0.5, mask?.ry ?? 0.5);
    gl.uniform1f(u.u_maskFeather, mask?.feather ?? 0.05);
    if (!this.maskFbo) this.maskFbo = createFramebuffer(gl, this.width, this.height);
    this._draw(this.passes.mask, this.maskFbo);
    return this.maskFbo.texture;
  }

  _runWarp(srcTexture, warp) {
    if (!this.warpFbo) this.warpFbo = createFramebuffer(this.gl, this.width, this.height);
    // master=1: per-layer warp never dims — that's screen-level warp's job (the house
    // master fader), applying it twice here would double-darken a warped layer.
    this.warpRenderer.render(srcTexture, warp, this.width, this.height, 1, this.warpFbo);
    return this.warpFbo.texture;
  }

  /** Runs the active stages; returns the texture the blend pass should composite.
   *  For color layers the point pass doubles as the fill synthesizer. */
  process(srcTexture, fx, { isColor = false, color = [0, 0, 0], mask = null, warp = null } = {}) {
    let tex = this._runPoint(srcTexture, fx ?? {}, isColor, color);
    if ((fx?.blur ?? 0) > 0) tex = this._runBlur(tex, fx.blur);
    if ((fx?.motionBlur ?? 0) > 0) tex = this._runFeedback(tex, fx.motionBlur);
    if (mask?.enabled) tex = this._runMask(tex, mask);
    if (warp && (warp.mode === "mesh" || warp.corners)) tex = this._runWarp(tex, warp);
    return tex;
  }

  dispose() {
    const gl = this.gl;
    for (const fbo of [this.pointFbo, ...(this.blurFbo ?? []), ...(this.feedbackFbo ?? []), this.maskFbo, this.warpFbo]) {
      if (!fbo) continue;
      gl.deleteFramebuffer(fbo.framebuffer);
      gl.deleteTexture(fbo.texture);
    }
    // The ScreenWarp built in the constructor owns a GL program + 3 buffers; free them too.
    this.warpRenderer?.dispose();
    this.warpRenderer = null;
    this.blurFbo = null;
    this.feedbackFbo = null;
    this.maskFbo = null;
    this.warpFbo = null;
  }
}
