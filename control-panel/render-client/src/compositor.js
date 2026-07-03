const VERT = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = vec2(a_position.x * 0.5 + 0.5, 1.0 - (a_position.y * 0.5 + 0.5));
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_opacity;
uniform vec3 u_ground;
out vec4 outColor;
void main() {
  vec4 tex = texture(u_tex, v_uv);
  vec3 composited = mix(u_ground, tex.rgb, clamp(u_opacity, 0.0, 1.0) * tex.a);
  outColor = vec4(composited, 1.0);
}`;

// Matches the control-panel design tokens' --ink (#0a0c11), so an empty/transparent
// stage reads as the same dark ground the operator UI uses, not a stray WebGL black/grey.
const GROUND = [0x0a / 255, 0x0c / 255, 0x11 / 255];

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${info}`);
  }
  return shader;
}

function createProgram(gl, vertSrc, fragSrc) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

export class Compositor {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL2 is not available in this browser");
    this.gl = gl;

    this.program = createProgram(gl, VERT, FRAG);
    gl.useProgram(this.program);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    this.u_opacity = gl.getUniformLocation(this.program, "u_opacity");
    this.u_ground = gl.getUniformLocation(this.program, "u_ground");
    gl.uniform3fv(this.u_ground, GROUND);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.opacity = 1;
    this.videoEl = null;

    // Procedural test pattern used whenever no video source is configured or it fails to
    // load — lets the whole state -> render pipeline be verified without a real media file.
    this.fallbackCanvas = document.createElement("canvas");
    this.fallbackCanvas.width = 256;
    this.fallbackCanvas.height = 144;
    this.fallbackCtx = this.fallbackCanvas.getContext("2d");
    this._drawFallback(0);

    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    this.canvas.height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  setOpacity(value) {
    this.opacity = value;
  }

  setSourceUrl(url) {
    this._detachVideo();
    if (!url) return;
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true; // autoplay policy; audio-owner routing is a later-phase concern
    video.playsInline = true;
    video
      .play()
      .then(() => {
        this.videoEl = video;
      })
      .catch((err) => {
        console.warn(`[compositor] could not play "${url}", showing test pattern:`, err.message);
      });
  }

  _detachVideo() {
    if (this.videoEl) {
      this.videoEl.pause();
      this.videoEl.removeAttribute("src");
      this.videoEl.load();
    }
    this.videoEl = null;
  }

  _drawFallback(t) {
    const ctx = this.fallbackCtx;
    const { width, height } = this.fallbackCanvas;
    const hue = (t * 20) % 360;
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, `hsl(${hue}, 55%, 22%)`);
    g.addColorStop(1, `hsl(${(hue + 140) % 360}, 55%, 10%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "16px monospace";
    ctx.fillText("no source — test pattern", 12, height - 16);
  }

  start() {
    const gl = this.gl;
    const loop = (t) => {
      const hasVideo = this.videoEl && this.videoEl.readyState >= 2;
      if (!hasVideo) this._drawFallback(t / 1000);

      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hasVideo ? this.videoEl : this.fallbackCanvas);

      gl.useProgram(this.program);
      gl.uniform1f(this.u_opacity, this.opacity);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
