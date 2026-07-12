// Pure geometry for the Stage's click-to-select interaction (Task 5): resolves a
// layer's on-screen quad from its warp state and hit-tests a normalized 0..1 point
// against it. No React, no app/ import — decoupled like the rest of components/.
import type { Layer } from "../types";

export type Pt = { x: number; y: number };
export type Quad = [Pt, Pt, Pt, Pt];

const UNIT: Quad = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];

/** The layer's on-screen quad (TL, TR, BR, BL), normalized 0..1 against the stage.
 *  Mesh-mode warps don't have 4 fixed corners, so this uses the bounding hull of the
 *  mesh points instead; a layer with no corner-pin/mesh state at all (or an empty
 *  mesh) falls back to the full-frame unit quad. */
export function layerQuad(layer: Layer): Quad {
  const w = layer.warp;
  if (w?.mode === "mesh" && w.mesh?.points?.length) {
    const xs = w.mesh.points.map((p) => p.x), ys = w.mesh.points.map((p) => p.y);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    return [{ x: minx, y: miny }, { x: maxx, y: miny }, { x: maxx, y: maxy }, { x: minx, y: maxy }];
  }
  const c = w?.corners;
  if (Array.isArray(c) && c.length === 4) return [c[0], c[1], c[2], c[3]] as Quad;
  return UNIT;
}

/** Even-odd ray-cast point-in-polygon test over the quad's 4 edges. */
export function pointInQuad(p: Pt, q: Quad): boolean {
  let inside = false;
  for (let i = 0, j = 3; i < 4; j = i++) {
    const a = q[i], b = q[j];
    const hit = (a.y > p.y) !== (b.y > p.y) &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x;
    if (hit) inside = !inside;
  }
  return inside;
}

/** Picks the topmost layer whose quad contains `p`. `layers` must already be sorted
 *  top-of-stack-first (index 0 = topmost) by the caller. Returns `null` on empty space
 *  (deselect). */
export function pickTopLayer(layers: Layer[], p: Pt): string | null {
  for (const layer of layers) if (pointInQuad(p, layerQuad(layer))) return layer.id;
  return null;
}
