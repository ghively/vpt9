import { createProgram } from "./gl-utils.js";

// Corner-pin is treated as a 2x2 mesh (a single quad whose 4 vertices are the corner
// points) so one renderer handles both modes — see control-panel/README.md for why this
// is bilinear corner interpolation, not a full perspective-correct homography: good
// enough for room-decoration-scale corrections, not for large professional installs.
const WARP_VERT = `#version 300 es
in vec2 a_uv;
in vec2 a_dest; // destination position in 0..1 screen space, (0,0) = top-left
uniform bool u_flipDest; // true when writing to the default framebuffer (GL's bottom-left
                         // origin needs the destination Y flipped); false when writing to
                         // an intermediate FBO (already top-left-origin, no flip needed).
out vec2 v_sceneUv;
void main() {
  float destY = u_flipDest ? (1.0 - a_dest.y * 2.0) : (a_dest.y * 2.0 - 1.0);
  gl_Position = vec4(a_dest.x * 2.0 - 1.0, destY, 0.0, 1.0);
  v_sceneUv = vec2(a_uv.x, u_flipDest ? 1.0 - a_uv.y : a_uv.y);
}`;

const WARP_FRAG = `#version 300 es
precision highp float;
in vec2 v_sceneUv;
uniform sampler2D u_scene;
uniform float u_master; // master dim: 0 = blackout, 1 = full
out vec4 outColor;
void main() {
  vec4 scene = texture(u_scene, v_sceneUv);
  outColor = vec4(scene.rgb * u_master, scene.a);
}`;

function buildGridIndices(size) {
  const indices = [];
  for (let row = 0; row < size - 1; row++) {
    for (let col = 0; col < size - 1; col++) {
      const i0 = row * size + col;
      const i1 = i0 + 1;
      const i2 = i0 + size;
      const i3 = i2 + 1;
      indices.push(i0, i2, i1, i1, i2, i3);
    }
  }
  return new Uint16Array(indices);
}

function buildGridUvs(size) {
  const uvs = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      uvs.push(col / (size - 1), row / (size - 1));
    }
  }
  return new Float32Array(uvs);
}

const IDENTITY_CORNERS = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

export class ScreenWarp {
  constructor(gl) {
    this.gl = gl;
    this.program = createProgram(gl, WARP_VERT, WARP_FRAG);
    this.u_scene = gl.getUniformLocation(this.program, "u_scene");
    this.u_master = gl.getUniformLocation(this.program, "u_master");
    this.u_flipDest = gl.getUniformLocation(this.program, "u_flipDest");
    this.a_uv = gl.getAttribLocation(this.program, "a_uv");
    this.a_dest = gl.getAttribLocation(this.program, "a_dest");

    this.uvBuffer = gl.createBuffer();
    this.destBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
    this.gridSize = 0;
    this.indexCount = 0;
  }

  _ensureGrid(size) {
    if (this.gridSize === size) return;
    this.gridSize = size;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buildGridUvs(size), gl.STATIC_DRAW);
    const indices = buildGridIndices(size);
    this.indexCount = indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }

  // warp: { mode: "corner"|"mesh", corners: [{x,y}x4] TL,TR,BR,BL, mesh: { size, points } }
  // target: null (default framebuffer, on-screen orientation) | { framebuffer, width, height }
  //   (an offscreen FBO, source-orientation, no display flip) — used by the per-layer warp
  //   stage (render-client/src/layers.js) so the same geometry math serves both roles.
  render(sceneTexture, warp, viewportWidth, viewportHeight, master = 1, target = null) {
    const gl = this.gl;
    const cornerFallback = () => {
      const c = warp?.corners ?? IDENTITY_CORNERS;
      return { size: 2, points: [c[0], c[1], c[3], c[2]] }; // TL, TR, BL, BR -> row-major grid order
    };
    let size, points;
    if (warp?.mode === "mesh" && warp.mesh?.points?.length) {
      // Derive the grid dimension from the points array, NOT warp.mesh.size: a client
      // (e.g. an OSC sender) can write mesh.size on its own and desync it from points.
      // Indexing past the data would collapse the mesh to (0,0), and a NaN size (size
      // undefined) would throw building the vertex buffer. Require a perfect square;
      // otherwise fall back to corner-pin rather than render garbage.
      const derived = Math.round(Math.sqrt(warp.mesh.points.length));
      if (derived >= 2 && derived * derived === warp.mesh.points.length) {
        size = derived;
        points = warp.mesh.points;
      } else {
        ({ size, points } = cornerFallback());
      }
    } else {
      ({ size, points } = cornerFallback());
    }
    this._ensureGrid(size);

    const dest = new Float32Array(size * size * 2);
    for (let i = 0; i < size * size; i++) {
      dest[i * 2] = points[i]?.x ?? 0;
      dest[i * 2 + 1] = points[i]?.y ?? 0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.destBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, dest, gl.DYNAMIC_DRAW);

    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clearColor(0, 0, 0, target ? 0 : 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniform1i(this.u_flipDest, target ? 0 : 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.enableVertexAttribArray(this.a_uv);
    gl.vertexAttribPointer(this.a_uv, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.destBuffer);
    gl.enableVertexAttribArray(this.a_dest);
    gl.vertexAttribPointer(this.a_dest, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
    gl.uniform1i(this.u_scene, 0);
    gl.uniform1f(this.u_master, Math.min(1, Math.max(0, master)));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  // Frees this warp's GL program + buffers. Each FxChain owns a ScreenWarp (fx.js), so
  // without this a per-layer fx chain leaked a whole program + 3 buffers on every removal.
  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteBuffer(this.uvBuffer);
    gl.deleteBuffer(this.destBuffer);
    gl.deleteBuffer(this.indexBuffer);
  }
}
