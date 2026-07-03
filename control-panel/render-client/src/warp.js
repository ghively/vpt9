import { createProgram } from "./gl-utils.js";

// Corner-pin is treated as a 2x2 mesh (a single quad whose 4 vertices are the corner
// points) so one renderer handles both modes — see control-panel/README.md for why this
// is bilinear corner interpolation, not a full perspective-correct homography: good
// enough for room-decoration-scale corrections, not for large professional installs.
const WARP_VERT = `#version 300 es
in vec2 a_uv;
in vec2 a_dest; // destination position in 0..1 screen space, (0,0) = top-left
out vec2 v_sceneUv;
void main() {
  gl_Position = vec4(a_dest.x * 2.0 - 1.0, 1.0 - a_dest.y * 2.0, 0.0, 1.0);
  v_sceneUv = vec2(a_uv.x, 1.0 - a_uv.y);
}`;

const WARP_FRAG = `#version 300 es
precision highp float;
in vec2 v_sceneUv;
uniform sampler2D u_scene;
out vec4 outColor;
void main() {
  outColor = texture(u_scene, v_sceneUv);
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
  render(sceneTexture, warp, viewportWidth, viewportHeight) {
    const gl = this.gl;
    let size, points;
    if (warp?.mode === "mesh" && warp.mesh?.points?.length) {
      size = warp.mesh.size;
      points = warp.mesh.points;
    } else {
      const c = warp?.corners ?? IDENTITY_CORNERS;
      size = 2;
      points = [c[0], c[1], c[3], c[2]]; // TL, TR, BL, BR -> row-major grid order
    }
    this._ensureGrid(size);

    const dest = new Float32Array(size * size * 2);
    for (let i = 0; i < size * size; i++) {
      dest[i * 2] = points[i]?.x ?? 0;
      dest[i * 2 + 1] = points[i]?.y ?? 0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.destBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, dest, gl.DYNAMIC_DRAW);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.enableVertexAttribArray(this.a_uv);
    gl.vertexAttribPointer(this.a_uv, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.destBuffer);
    gl.enableVertexAttribArray(this.a_dest);
    gl.vertexAttribPointer(this.a_dest, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
    gl.uniform1i(this.u_scene, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }
}
