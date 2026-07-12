import { WarpHandle } from "../WarpHandle";
import { MaskShapeOverlay } from "../MaskShapeOverlay";
import { layerQuad, type Quad } from "./layerGeometry";
import type { Layer, Mask } from "../types";

/** Which stage-editing mode the Inspector (Task 7) has selected for the currently
 *  selected layer. Mirrors `src/app/useSelection.ts`'s `EditMode` — redeclared here
 *  (rather than imported) because components/ never imports from src/app/ (see the
 *  module doc below); the two must be kept in sync by hand. */
export type StageEditMode = "warp" | "mask" | "fx";

export interface StageSelectionOverlayProps {
  /** The layer currently selected in the rail/on the stage. */
  layer: Layer;
  mode: StageEditMode;
  /** Fired when a warp handle (corner or mesh point) is dragged to a new normalized
   *  0..1 position — `index` is the point's index into `layer.warp.corners` (corner
   *  mode) or `layer.warp.mesh.points` (mesh mode), exactly like `WarpEditor`'s
   *  `onLayerMovePoint`. The container maps this straight onto
   *  `actions.moveLayerWarpPoint(layer.id, index, x, y)` — the SAME action `WarpEditor`
   *  uses for a layer warp target, so this emits the identical
   *  `layers.<id>.warp.corners.<i>` / `.mesh.points.<i>` update path. */
  onWarpCorner?: (index: number, x: number, y: number) => void;
  /** Fired when the mask shape is dragged — a partial `{cx,cy,rx,ry}` patch, exactly
   *  `MaskShapeOverlay`'s own `onChange` contract. The container fans this out over
   *  `actions.updateLayer(layer.id, \`mask.${k}\`, v)` per key, mirroring
   *  `WarpEditor`'s existing `onMaskChange` wiring for `maskEditLayer`. */
  onMask?: (patch: Partial<Pick<Mask, "cx" | "cy" | "rx" | "ry">>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const CORNER_TAGS = ["TL", "TR", "BR", "BL"]; // index order matches Warp.corners (see WarpEditor)
const CORNER_CLASSES = ["tl", "tr", "br", "bl"]; // e2e targets ".deck-handle.tl" etc.

/** Top-center label anchor for a quad, matching the mockup's `addLabel(name, cxp,
 *  Math.min(pts[0].y, pts[1].y))`: the midpoint of the TL/TR edge. Works unmodified for
 *  both a real 4-corner warp quad and `layerQuad`'s synthetic mesh/fx bounding quad,
 *  since both use the same [TL,TR,BR,BL] ordering. */
function labelAnchor(quad: Quad) {
  return { x: (quad[0].x + quad[1].x) / 2, y: Math.min(quad[0].y, quad[1].y, 0.06) };
}

function SelLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <div className="sel-label" style={{ left: `${x * 100}%`, top: `${Math.max(y, 0.06) * 100}%` }}>
      {text}
    </div>
  );
}

/** Selection overlay (Task 6): draws the currently selected layer's warp handles, mask
 *  shape, or FX bounding box directly on the stage, in the same normalized 0..1 space
 *  Task 5's hover outline uses. Reuses `WarpHandle` and `MaskShapeOverlay` verbatim —
 *  the exact same handle components (and their pointerdown/move/up/cancel drag
 *  machinery) `WarpEditor` already uses for a layer's own warp/mask — so a drag here
 *  goes out over the identical update path, just triggered from the stage instead of
 *  the rail. Presentational only: no `src/app/` import, no direct `send`/`actions` — the
 *  container (App) supplies narrow callbacks and maps them onto the real actions. */
export function StageSelectionOverlay({ layer, mode, onWarpCorner, onMask, onDragStart, onDragEnd }: StageSelectionOverlayProps) {
  if (mode === "mask") {
    const { mask } = layer;
    const anchor = { x: mask.cx, y: mask.cy - mask.ry };
    return (
      <>
        <SelLabel x={anchor.x} y={anchor.y} text={`${layer.name || layer.id} · mask`} />
        <MaskShapeOverlay mask={mask} onDragStart={onDragStart} onDragEnd={onDragEnd} onChange={onMask} />
      </>
    );
  }

  if (mode === "fx") {
    const quad = layerQuad(layer);
    const xs = quad.map((p) => p.x), ys = quad.map((p) => p.y);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const anchor = labelAnchor(quad);
    return (
      <>
        <SelLabel x={anchor.x} y={anchor.y} text={`${layer.name || layer.id} · fx`} />
        <div
          className="fx-bbox"
          aria-hidden="true"
          style={{ left: `${minx * 100}%`, top: `${miny * 100}%`, width: `${(maxx - minx) * 100}%`, height: `${(maxy - miny) * 100}%` }}
        />
      </>
    );
  }

  // mode === "warp" — corner-pin (4 fixed handles, tagged TL/TR/BR/BL) or mesh (an
  // NxN grid of handles, tagged with their row/column like WarpEditor's coordTag).
  const isMesh = layer.warp.mode === "mesh";
  const points = isMesh ? layer.warp.mesh.points : layer.warp.corners;
  const size = layer.warp.mesh?.size ?? 4;
  const anchor = labelAnchor(layerQuad(layer));

  return (
    <>
      <SelLabel x={anchor.x} y={anchor.y} text={`${layer.name || layer.id} · warp`} />
      {points.map((p, i) => (
        <WarpHandle
          key={i}
          x={p.x}
          y={p.y}
          className={isMesh ? undefined : CORNER_CLASSES[i]}
          cornerTag={isMesh ? undefined : CORNER_TAGS[i]}
          coordTag={isMesh ? `R${Math.floor(i / size) + 1}·C${(i % size) + 1}` : undefined}
          onDragStart={onDragStart}
          onDragTo={(x, y) => onWarpCorner?.(i, x, y)}
          onDragEnd={onDragEnd}
        />
      ))}
    </>
  );
}
