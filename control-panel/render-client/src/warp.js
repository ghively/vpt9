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

// Task A8 — VPT8 parity: VPT8's mesh warp is a smooth ("NURBS-ish") surface, not the
// faceted piecewise-linear triangle grid the control points alone draw. This subdivides
// the NxN CONTROL grid into a denser RENDER grid via bicubic Catmull-Rom interpolation of
// the control points, so the GPU draws a smooth surface while the control-point count
// (state, drag handles, mesh.size) is unchanged — only the tessellation density grows.
// Deliberately NOT used for corner-pin mode (see cornerFallback in render() below): a
// corner-pin quad is meant to stay a plain 2-triangle affine map (bilinear-ish corner
// interpolation, not a curved surface) — only genuine "mesh" mode gets the smooth
// treatment, matching VPT8's own mode split.
//
// 6 render-samples per control-grid cell edge sits in the brief's suggested 4-8x range:
// smooth enough to read as curved, and bounded (10x10 control -> 55x55 render grid,
// ~3k vertices) even at the top of the widened 2-10 mesh-size range.
const MESH_SUBDIV = 6;

// Standard uniform Catmull-Rom cubic through p1..p2 (p0/p3 are the outer neighbors that
// shape the tangents), t in [0,1]. Passes exactly through p1 at t=0 and p2 at t=1.
function catmullRom1D(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function catmullRomPoint(p0, p1, p2, p3, t) {
  return {
    x: catmullRom1D(p0.x, p1.x, p2.x, p3.x, t),
    y: catmullRom1D(p0.y, p1.y, p2.y, p3.y, t),
  };
}

// Control-grid lookup with a LINEAR-EXTRAPOLATION phantom boundary (row/col one step
// outside [0, size-1] resolves to `2*nearest - nextNearest`, continuing the sequence's own
// local slope) rather than clamping/duplicating the edge point. This is what makes the
// identity mesh subdivide back to itself exactly: for the default, evenly-spaced identity
// grid, extrapolating the phantom point this way keeps the WHOLE extended row/column an
// exact arithmetic sequence, and Catmull-Rom through an evenly-spaced collinear sequence
// reduces algebraically to plain linear interpolation (a well-known Catmull-Rom identity)
// — including at the boundary cells, where a naive duplicate-the-edge-point boundary rule
// would NOT reduce to linear and would visibly bow the mesh's outer edge even when unwarped.
// Recurses at most 2 deep (row-out-of-range resolves via valid-row lookups that may
// themselves need col extrapolation) — cheap, and only ever invoked for the single
// neighbor exactly one step past either edge.
function gridPoint(points, size, row, col) {
  if (row < 0) {
    const p0 = gridPoint(points, size, 0, col);
    const p1 = gridPoint(points, size, 1, col);
    return { x: 2 * p0.x - p1.x, y: 2 * p0.y - p1.y };
  }
  if (row > size - 1) {
    const p0 = gridPoint(points, size, size - 1, col);
    const p1 = gridPoint(points, size, size - 2, col);
    return { x: 2 * p0.x - p1.x, y: 2 * p0.y - p1.y };
  }
  if (col < 0) {
    const p0 = gridPoint(points, size, row, 0);
    const p1 = gridPoint(points, size, row, 1);
    return { x: 2 * p0.x - p1.x, y: 2 * p0.y - p1.y };
  }
  if (col > size - 1) {
    const p0 = gridPoint(points, size, row, size - 1);
    const p1 = gridPoint(points, size, row, size - 2);
    return { x: 2 * p0.x - p1.x, y: 2 * p0.y - p1.y };
  }
  return points[row * size + col] ?? { x: 0, y: 0 };
}

// Bicubic (tensor-product Catmull-Rom) surface value at a continuous (row, col) position
// in control-grid space: 4 rows of 1D Catmull-Rom across columns, then one more 1D
// Catmull-Rom down the resulting 4 row-points. Standard bicubic-spline construction.
function bicubicSurface(points, size, row, col) {
  let ci = Math.floor(col);
  if (ci > size - 2) ci = size - 2;
  if (ci < 0) ci = 0;
  let ri = Math.floor(row);
  if (ri > size - 2) ri = size - 2;
  if (ri < 0) ri = 0;
  const fc = col - ci;
  const fr = row - ri;

  const rows = [];
  for (let dr = -1; dr <= 2; dr++) {
    const p0 = gridPoint(points, size, ri + dr, ci - 1);
    const p1 = gridPoint(points, size, ri + dr, ci);
    const p2 = gridPoint(points, size, ri + dr, ci + 1);
    const p3 = gridPoint(points, size, ri + dr, ci + 2);
    rows.push(catmullRomPoint(p0, p1, p2, p3, fc));
  }
  return catmullRomPoint(rows[0], rows[1], rows[2], rows[3], fr);
}

// Builds the destination-position buffer for a `renderSize` x `renderSize` render grid by
// bicubic-subdividing the `size` x `size` control grid. Row-major, matching buildGridUvs's
// vertex ordering (so the UV grid built at `renderSize` lines up 1:1 with this buffer).
function subdivideMeshDest(points, size, renderSize) {
  const dest = new Float32Array(renderSize * renderSize * 2);
  // (size - 1) / (renderSize - 1): maps render-grid index 0..renderSize-1 onto
  // control-grid space 0..size-1, landing exactly on integers at control-point
  // locations (render index = control index * MESH_SUBDIV) — so the subdivided surface
  // still passes exactly through every control point, it just fills in between smoothly.
  const scale = (size - 1) / (renderSize - 1);
  for (let row = 0; row < renderSize; row++) {
    const gr = row * scale;
    for (let col = 0; col < renderSize; col++) {
      const gc = col * scale;
      const p = bicubicSurface(points, size, gr, gc);
      const idx = (row * renderSize + col) * 2;
      dest[idx] = p.x;
      dest[idx + 1] = p.y;
    }
  }
  return dest;
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
    let size, points, smooth;
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
        smooth = true; // genuine mesh mode (task A8): bicubic-subdivide, see below
      } else {
        ({ size, points } = cornerFallback());
        smooth = false;
      }
    } else {
      ({ size, points } = cornerFallback());
      smooth = false;
    }

    let dest;
    if (smooth) {
      // Task A8: draw a denser, bicubic-subdivided grid instead of the raw control
      // points — the control-point COUNT (and hence the drag handles / state) stays
      // exactly `size`; only the tessellation the GPU draws gets finer.
      const renderSize = (size - 1) * MESH_SUBDIV + 1;
      this._ensureGrid(renderSize);
      dest = subdivideMeshDest(points, size, renderSize);
    } else {
      // Corner-pin (or an invalid/degenerate mesh falling back to it): unchanged —
      // draw the raw 2x2 (or otherwise raw) control grid directly, no subdivision. A
      // corner-pin quad stays a plain 2-triangle affine map, not a curved surface.
      this._ensureGrid(size);
      dest = new Float32Array(size * size * 2);
      for (let i = 0; i < size * size; i++) {
        dest[i * 2] = points[i]?.x ?? 0;
        dest[i * 2 + 1] = points[i]?.y ?? 0;
      }
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
