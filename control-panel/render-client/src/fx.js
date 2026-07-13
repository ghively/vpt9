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
uniform vec2 u_zoomXY;     // non-uniform zoom multipliers (on top of u_zoom), 1 = off
uniform vec2 u_anchor;     // zoom/rotate pivot, in uv space; (0.5, 0.5) = center
uniform float u_rotation;  // radians, about u_anchor
uniform vec2 u_pan;
uniform vec3 u_brcosa;     // brightness, contrast, saturation
uniform vec4 u_edges;      // left, right, top, bottom fractional widths
uniform float u_edgeGamma;
uniform bool u_edgeInvert; // fade the CENTER instead of the edges (VPT8 tr.edgeblend01.jxs)
// Per-stage enable/bypass (task A7 — VPT8 parity: a "pattr on" per stage, decoupled from
// its value so a preset amount can be toggled off without losing it). All default true —
// an untouched layer (fx.enabled absent, or every flag true) renders exactly as before
// these uniforms existed.
uniform bool u_enTransform; // gates flip/tile/zoom/pan/rotation
uniform bool u_enBrcosa;    // gates brightness/contrast/saturation
uniform bool u_enEdge;      // gates the edge-blend ramp (+ invert)
out vec4 outColor;

void main() {
  // Inverse of the image-space op chain flip -> tile -> rotate/zoom/pan: undo pan, then
  // rotation and non-uniform zoom about the anchor pivot (VPT8's td.rota.jxs: rota +
  // xzoom/yzoom + xanchor/yanchor, composed with the overall zoom), then tiling, then
  // flip, and sample there.
  //
  // At the defaults (u_rotation=0, u_zoomXY=(1,1), u_anchor=(0.5,0.5)) this reduces
  // algebraically to the original (v_uv - 0.5) / u_zoom + 0.5 - u_pan — old shows that
  // never touch the new fields render byte-identical to before.
  float border = 1.0;
  vec2 suv;
  if (u_enTransform) {
    vec2 rel = v_uv - u_anchor;
    float rad = -u_rotation; // inverse-rotate to find the source sample, not the destination
    float cs = cos(rad), sn = sin(rad);
    vec2 relRot = vec2(cs * rel.x - sn * rel.y, sn * rel.x + cs * rel.y);
    vec2 scale = vec2(max(u_zoom, 0.001)) * max(u_zoomXY, vec2(0.001));
    vec2 uv = relRot / scale + u_anchor - u_pan;

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
  } else {
    // Transform stage bypassed: sample straight through, untransformed.
    suv = v_uv;
  }

  vec4 c = u_isColor ? vec4(u_color, 1.0) : texture(u_src, clamp(suv, 0.0, 1.0));

  // brcosa: contrast about mid-grey, then brightness gain, then saturation vs. luma.
  if (u_enBrcosa) {
    c.rgb = (c.rgb - 0.5) * u_brcosa.y + 0.5;
    c.rgb *= u_brcosa.x;
    float luma = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    c.rgb = mix(vec3(luma), c.rgb, u_brcosa.z);
  }

  // Edge-blend: per-edge gamma-shaped alpha ramp (projector-overlap feathering), with an
  // optional invert that fades the CENTER instead (VPT8's tr.edgeblend01.jxs: mix(alph,
  // 1.-alph, invert)). Bypassed entirely (e stays 1.0, no-op) when the stage is disabled.
  float e = 1.0;
  if (u_enEdge) {
    if (u_edges.x > 0.0) e *= pow(clamp(v_uv.x / u_edges.x, 0.0, 1.0), u_edgeGamma);
    if (u_edges.y > 0.0) e *= pow(clamp((1.0 - v_uv.x) / u_edges.y, 0.0, 1.0), u_edgeGamma);
    if (u_edges.z > 0.0) e *= pow(clamp((1.0 - v_uv.y) / u_edges.z, 0.0, 1.0), u_edgeGamma);
    if (u_edges.w > 0.0) e *= pow(clamp(v_uv.y / u_edges.w, 0.0, 1.0), u_edgeGamma);
    // Invert the ramp only when at least one edge width is set. With no edges, e is 1.0
    // everywhere and inverting it (1.0 - e = 0.0) would blank the whole layer on a bare
    // invert toggle with no edges configured.
    bool anyEdge = u_edges.x > 0.0 || u_edges.y > 0.0 || u_edges.z > 0.0 || u_edges.w > 0.0;
    if (u_edgeInvert && anyEdge) e = 1.0 - e;
  }

  outColor = vec4(c.rgb, c.a * border * e);
}`;

// Mask bake: same formula as layers.js's former maskAlpha(), moved here so masking
// deforms along with per-layer warp (matching VPT8's vlayer order: mask, then mesh).
//
// Polygon shape (task A4a — VPT8 parity: code/pointmask01.js's free-form draggable
// mask): points are normalized 0..1 content-UV vertices, uploaded as a fixed-size
// uniform array with a separate live count (MASK_MAX_POINTS is a generous cap — the
// on-canvas editor, task A4b, is expected to work with far fewer). Containment is a
// standard even-odd ray-cast; the feather band reuses the SAME u_maskFeather knob as
// rect/ellipse, measured as an actual distance (in uv units) to the nearest polygon
// edge rather than a normalized 0..1 shape-space radius (there's no natural "radius"
// for an arbitrary polygon) — a signed distance (negative inside) run through the
// same smoothstep shape gives an equivalent soft edge.
const MASK_MAX_POINTS = 32;
const MASK_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform sampler2D u_matte; // luminance/video matte source (bound to a DISTINCT unit)
uniform bool u_maskEnabled;
uniform bool u_maskUseMatte; // true = alpha from u_matte's luminance, ignoring the shape
uniform int u_maskShape; // 0 = rect, 1 = ellipse, 2 = polygon
uniform vec2 u_maskCenter;
uniform vec2 u_maskRadius;
uniform float u_maskFeather;
uniform vec2 u_maskPoints[${MASK_MAX_POINTS}];
uniform int u_maskCount;
uniform float u_maskInvert; // 0 = normal, 1 = inverted (mixed in below for every shape)
out vec4 outColor;

// Even-odd ray-cast point-in-polygon test over the first u_maskCount points (winding
// order doesn't matter). A fixed-size loop with an early break at the live count —
// standard practice for a small, dynamically-sized point set in GLSL ES 300.
bool maskPolygonContains(vec2 p) {
  bool inside = false;
  for (int i = 0; i < ${MASK_MAX_POINTS}; i++) {
    if (i >= u_maskCount) break;
    int j = (i == 0) ? (u_maskCount - 1) : (i - 1);
    vec2 pi = u_maskPoints[i];
    vec2 pj = u_maskPoints[j];
    if (((pi.y > p.y) != (pj.y > p.y)) &&
        (p.x < (pj.x - pi.x) * (p.y - pi.y) / (pj.y - pi.y) + pi.x)) {
      inside = !inside;
    }
  }
  return inside;
}

// Shortest distance from p to any polygon edge segment — the feather band's basis.
float maskPolygonEdgeDist(vec2 p) {
  float minDist = 1.0e6;
  for (int i = 0; i < ${MASK_MAX_POINTS}; i++) {
    if (i >= u_maskCount) break;
    int j = (i == 0) ? (u_maskCount - 1) : (i - 1);
    vec2 a = u_maskPoints[i];
    vec2 b = u_maskPoints[j];
    vec2 ab = b - a;
    vec2 ap = p - a;
    float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1.0e-6), 0.0, 1.0);
    minDist = min(minDist, length(ap - ab * t));
  }
  return minDist;
}

void main() {
  vec4 c = texture(u_src, v_uv);
  if (!u_maskEnabled) { outColor = c; return; }
  float a;
  if (u_maskUseMatte) {
    // Luminance/video matte (VPT8 layermask 'source' + cc.alphaglue lum2alpha): the mask
    // alpha is the matte source's luminance, REPLACING the geometric shape entirely.
    // Rec.601 luma weights — the classic luminance-key weighting VPT8's alphaglue uses.
    vec3 m = texture(u_matte, v_uv).rgb;
    a = dot(m, vec3(0.299, 0.587, 0.114));
  } else if (u_maskShape == 2) {
    if (u_maskCount < 3) {
      // Fewer than 3 vertices is not a polygon — show the layer fully instead of blanking
      // it (a freshly-enabled polygon mask before any vertices are placed would otherwise
      // go fully transparent). invert below still applies.
      a = 1.0;
    } else {
      bool inside = maskPolygonContains(v_uv);
      float edgeDist = maskPolygonEdgeDist(v_uv);
      float signedDist = inside ? -edgeDist : edgeDist;
      a = 1.0 - smoothstep(0.0, u_maskFeather, signedDist);
    }
  } else {
    vec2 d = (v_uv - u_maskCenter) / max(u_maskRadius, vec2(0.0001));
    float dist = (u_maskShape == 1) ? length(d) : max(abs(d.x), abs(d.y));
    a = 1.0 - smoothstep(1.0 - u_maskFeather, 1.0, dist);
  }
  // invert: flips which side is visible, for every shape AND the matte (VPT8's layermask.maxpat pattr inv).
  a = mix(a, 1.0 - a, u_maskInvert);
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
  const en = fx.enabled;
  // A stage explicitly switched OFF must still enter the chain even if its own value is
  // neutral — that's the whole point of a decoupled on/off (task A7): toggling a preset
  // stage off has to actually suppress it, not silently no-op because "neutral value +
  // chain skipped" looks the same as "on at neutral" from here. Untouched layers (no
  // `enabled` object, or every flag true) fall through to the plain value checks below,
  // so they stay on the old zero-cost path.
  if (en && (en.transform === false || en.color === false || en.edgeBlend === false)) return true;
  return Boolean(
    fx.flipH || fx.flipV ||
    (fx.tileX ?? 1) !== 1 || (fx.tileY ?? 1) !== 1 ||
    (fx.zoom ?? 1) !== 1 || (fx.panX ?? 0) !== 0 || (fx.panY ?? 0) !== 0 ||
    (fx.zoomX ?? 1) !== 1 || (fx.zoomY ?? 1) !== 1 ||
    (fx.anchorX ?? 0.5) !== 0.5 || (fx.anchorY ?? 0.5) !== 0.5 ||
    (fx.rotationDeg ?? 0) !== 0 ||
    (fx.blur ?? 0) > 0 || (fx.motionBlur ?? 0) > 0 ||
    (fx.brightness ?? 1) !== 1 || (fx.contrast ?? 1) !== 1 || (fx.saturation ?? 1) !== 1 ||
    (eb.left ?? 0) > 0 || (eb.right ?? 0) > 0 || (eb.top ?? 0) > 0 || (eb.bottom ?? 0) > 0 ||
    Boolean(eb.invert)
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
        [
          "u_src", "u_isColor", "u_color", "u_flip", "u_tile",
          "u_zoom", "u_zoomXY", "u_anchor", "u_rotation", "u_pan",
          "u_brcosa", "u_edges", "u_edgeGamma", "u_edgeInvert",
          "u_enTransform", "u_enBrcosa", "u_enEdge",
        ].map((name) => [name, gl.getUniformLocation(this.point, name)])
      ),
      blur: Object.fromEntries(
        ["u_src", "u_dir"].map((name) => [name, gl.getUniformLocation(this.blur, name)])
      ),
      feedback: Object.fromEntries(
        ["u_src", "u_prev", "u_amount"].map((name) => [name, gl.getUniformLocation(this.feedback, name)])
      ),
      mask: {
        ...Object.fromEntries(
          ["u_src", "u_matte", "u_maskEnabled", "u_maskUseMatte", "u_maskShape", "u_maskCenter", "u_maskRadius", "u_maskFeather", "u_maskCount", "u_maskInvert"]
            .map((name) => [name, gl.getUniformLocation(this.mask, name)])
        ),
        // Array uniforms: query the first element explicitly ("name[0]") — the portable
        // form across WebGL implementations, vs. relying on the bare array name resolving
        // to index 0. gl.uniform2fv from this location fills consecutive array slots.
        u_maskPoints: gl.getUniformLocation(this.mask, "u_maskPoints[0]"),
      },
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
    gl.uniform2f(u.u_zoomXY, fx.zoomX ?? 1, fx.zoomY ?? 1);
    gl.uniform2f(u.u_anchor, fx.anchorX ?? 0.5, fx.anchorY ?? 0.5);
    gl.uniform1f(u.u_rotation, ((fx.rotationDeg ?? 0) * Math.PI) / 180);
    gl.uniform2f(u.u_pan, fx.panX ?? 0, fx.panY ?? 0);
    gl.uniform3f(u.u_brcosa, fx.brightness ?? 1, fx.contrast ?? 1, fx.saturation ?? 1);
    gl.uniform4f(u.u_edges, eb.left ?? 0, eb.right ?? 0, eb.top ?? 0, eb.bottom ?? 0);
    gl.uniform1f(u.u_edgeGamma, eb.gamma ?? 2);
    gl.uniform1i(u.u_edgeInvert, eb.invert ? 1 : 0);
    const en = fx.enabled ?? {};
    gl.uniform1i(u.u_enTransform, en.transform !== false ? 1 : 0);
    gl.uniform1i(u.u_enBrcosa, en.color !== false ? 1 : 0);
    gl.uniform1i(u.u_enEdge, en.edgeBlend !== false ? 1 : 0);
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

  // Directional-slide motion blur (task A21b — VPT8 parity: an alternate motion-blur
  // variant alongside the temporal-feedback "trail" above). BLUR_FRAG is already a
  // generic 9-tap smear along an arbitrary `u_dir` vector — _runBlur just happens to call
  // it twice with axis-aligned dirs to approximate an isotropic gaussian. Reused here,
  // unmodified, for a SINGLE pass along `angleDeg` instead: a short directional smear
  // scaled by `amount`, same tap spread convention (amount*4 texels) as _runBlur. Writes
  // into the feedback FBO pair's slot 0 as scratch (stateless — no ping-pong needed) so
  // switching a layer between "trail" and "slide" doesn't need its own dedicated FBO.
  _runSlide(srcTexture, amount, angleDeg) {
    const gl = this.gl;
    const u = this.passes.u.blur;
    if (!this.feedbackFbo) {
      this.feedbackFbo = [createFramebuffer(gl, this.width, this.height), createFramebuffer(gl, this.width, this.height)];
    }
    const rad = (angleDeg * Math.PI) / 180;
    const spread = amount * 4;
    const dir = [(Math.cos(rad) * spread) / this.width, (Math.sin(rad) * spread) / this.height];
    gl.useProgram(this.passes.blur);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    gl.uniform1i(u.u_src, 0);
    gl.uniform2f(u.u_dir, dir[0], dir[1]);
    const target = this.feedbackFbo[0];
    this._draw(this.passes.blur, target);
    return target.texture;
  }

  _runMask(srcTexture, mask, matteTexture) {
    const gl = this.gl;
    const u = this.passes.u.mask;
    // A matte only replaces the geometric alpha when a source is set AND resolved to a
    // texture (an unresolvable/deleted matte ref falls back to the geometric shape).
    const useMatte = Boolean(mask?.source && matteTexture);
    gl.useProgram(this.passes.mask);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    gl.uniform1i(u.u_src, 0);
    // Matte sampler on a DISTINCT unit. Every declared sampler needs a valid texture
    // bound even when unread (WebGL undefined-behavior otherwise); when there's no matte
    // we bind the source there as a harmless stand-in and gate reads with u_maskUseMatte.
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, matteTexture ?? srcTexture);
    gl.uniform1i(u.u_matte, 1);
    gl.uniform1i(u.u_maskUseMatte, useMatte ? 1 : 0);
    gl.uniform1i(u.u_maskEnabled, mask?.enabled ? 1 : 0);
    gl.uniform1i(u.u_maskShape, mask?.shape === "rect" ? 0 : mask?.shape === "polygon" ? 2 : 1);
    gl.uniform2f(u.u_maskCenter, mask?.cx ?? 0.5, mask?.cy ?? 0.5);
    gl.uniform2f(u.u_maskRadius, mask?.rx ?? 0.5, mask?.ry ?? 0.5);
    gl.uniform1f(u.u_maskFeather, mask?.feather ?? 0.05);
    gl.uniform1f(u.u_maskInvert, mask?.invert ? 1 : 0);
    const points = Array.isArray(mask?.points) ? mask.points : [];
    const count = Math.min(points.length, MASK_MAX_POINTS);
    gl.uniform1i(u.u_maskCount, count);
    if (count > 0) {
      const flat = new Float32Array(count * 2);
      for (let i = 0; i < count; i++) {
        flat[i * 2] = points[i].x;
        flat[i * 2 + 1] = points[i].y;
      }
      gl.uniform2fv(u.u_maskPoints, flat);
    }
    if (!this.maskFbo) this.maskFbo = createFramebuffer(gl, this.width, this.height);
    this._draw(this.passes.mask, this.maskFbo);
    // Restore GL state: unbind the matte unit and return the active unit to 0 so the next
    // pass (warp/blend) starts from a clean, conventional state instead of a stray unit-1 binding.
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
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
  process(srcTexture, fx, { isColor = false, color = [0, 0, 0], mask = null, warp = null, matteTexture = null } = {}) {
    const f = fx ?? {};
    let tex = this._runPoint(srcTexture, f, isColor, color);
    // Color stage bypass (task A7): blur + motion-blur (trail/slide) + brcosa (brcosa is
    // gated in-shader, see u_enBrcosa) all live under the Color section's single on/off.
    const colorEnabled = f.enabled?.color !== false;
    if (colorEnabled && (f.blur ?? 0) > 0) tex = this._runBlur(tex, f.blur);
    if (colorEnabled && (f.motionBlur ?? 0) > 0) {
      // Directional-slide variant (task A21b) vs. the original temporal-feedback trail —
      // same amount knob (fx.motionBlur), different render path.
      tex = f.motionBlurMode === "slide"
        ? this._runSlide(tex, f.motionBlur, f.motionBlurAngle ?? 0)
        : this._runFeedback(tex, f.motionBlur);
    }
    if (mask?.enabled) tex = this._runMask(tex, mask, matteTexture);
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
