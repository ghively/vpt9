import { WarpHandle } from "../WarpHandle";
import { MaskShapeOverlay } from "../MaskShapeOverlay";
import { layerQuad, warpQuad, type Quad } from "./layerGeometry";
import type { Layer, Mask, Screen, Warp } from "../types";

/** Which stage-editing mode the Inspector (Task 7) has selected for the currently
 *  selected layer. Mirrors `src/app/useSelection.ts`'s `EditMode` — redeclared here
 *  (rather than imported) because components/ never imports from src/app/ (see the
 *  module doc below); the two must be kept in sync by hand. Only meaningful when
 *  `editTarget === "layer"` — a screen only ever shows its warp (see below). */
export type StageEditMode = "warp" | "mask" | "fx";

/** Which object the overlay is currently drawing handles for (Task 12): the selected
 *  LAYER (warp/mask/fx, unchanged from pre-Task-12) or the active SCREEN's projector
 *  warp (corner-pin/mesh over the composited output — warp-only, screens have no
 *  mask/fx). Mirrors `src/app/useSelection.ts`'s `EditTarget` — redeclared here for the
 *  same decoupling reason as `StageEditMode` above. */
export type StageEditTarget = "layer" | "screen";

export interface StageSelectionOverlayProps {
  /** "layer" (default-shaped, pre-Task-12 behavior) or "screen" (Task 12: renders ONLY
   *  the active screen's warp handles — no mask/fx, and no layer overlay at the same
   *  time). */
  editTarget: StageEditTarget;
  /** The layer currently selected in the rail/on the stage. Required when
   *  editTarget === "layer" (ignored otherwise). */
  layer?: Layer | null;
  mode: StageEditMode;
  /** Fired when a LAYER warp handle (corner or mesh point) is dragged to a new
   *  normalized 0..1 position — `index` is the point's index into `layer.warp.corners`
   *  (corner mode) or `layer.warp.mesh.points` (mesh mode), exactly like `WarpEditor`'s
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
  /** The screen currently selected (Task 12). Required when editTarget === "screen"
   *  (ignored otherwise). */
  screen?: Screen | null;
  /** Fired when a SCREEN warp handle is dragged — SAME index convention as
   *  `onWarpCorner` above (into `screen.warp.corners` or `.mesh.points`). The container
   *  maps this onto `actions.moveWarpPoint(screen.id, index, x, y)` — the EXISTING
   *  screen warp action `WarpEditor` used to call, unchanged, just triggered from the
   *  stage instead of the (now-deleted) rail-side warp editor. */
  onScreenWarpCorner?: (index: number, x: number, y: number) => void;
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
  // y = the top edge (midpoint of TL/TR), so the label floats with the selected layer.
  // SelLabel's own `Math.max(y, 0.06)` keeps it from clipping off the top of the stage —
  // don't fold that floor into this min (that would pin every label to a constant y).
  return { x: (quad[0].x + quad[1].x) / 2, y: Math.min(quad[0].y, quad[1].y) };
}

function SelLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <div className="sel-label" style={{ left: `${x * 100}%`, top: `${Math.max(y, 0.06) * 100}%` }}>
      {text}
    </div>
  );
}

/** Renders one warp target's drag handles — corner-pin's 4 fixed handles (tagged
 *  TL/TR/BR/BL) or an NxN mesh grid (tagged with row/column, like WarpEditor's
 *  coordTag). This is the generic bit a LAYER's own warp and the active SCREEN's
 *  projector warp share (Task 12): both are the exact same `Warp` shape, so one
 *  component, parameterized by `warp` + a single `onPoint(index, x, y)` callback,
 *  serves either — the caller decides which real action `onPoint` maps onto. Reuses
 *  `WarpHandle` verbatim (same pointerdown/move/up/cancel drag machinery WarpEditor's
 *  rail-side corner drag already used), so a drag here goes out over the identical
 *  update path, just triggered from the stage instead of the rail. */
function WarpHandles({
  warp,
  onPoint,
  onDragStart,
  onDragEnd,
}: {
  warp: Warp;
  onPoint?: (index: number, x: number, y: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const isMesh = warp.mode === "mesh";
  const points = isMesh ? warp.mesh.points : warp.corners;
  const size = warp.mesh?.size ?? 4;
  return (
    <>
      {points.map((p, i) => (
        <WarpHandle
          key={i}
          x={p.x}
          y={p.y}
          className={isMesh ? undefined : CORNER_CLASSES[i]}
          cornerTag={isMesh ? undefined : CORNER_TAGS[i]}
          coordTag={isMesh ? `R${Math.floor(i / size) + 1}·C${(i % size) + 1}` : undefined}
          onDragStart={onDragStart}
          onDragTo={(x, y) => onPoint?.(i, x, y)}
          onDragEnd={onDragEnd}
        />
      ))}
    </>
  );
}

/** Selection overlay (Task 6; generalized for screen warp in Task 12): draws the
 *  currently selected object's warp handles, mask shape, or FX bounding box directly
 *  on the stage, in the same normalized 0..1 space Task 5's hover outline uses.
 *  Presentational only: no `src/app/` import, no direct `send`/`actions` — the
 *  container (App) supplies narrow callbacks and maps them onto the real actions. */
export function StageSelectionOverlay({
  editTarget,
  layer,
  mode,
  onWarpCorner,
  onMask,
  screen,
  onScreenWarpCorner,
  onDragStart,
  onDragEnd,
}: StageSelectionOverlayProps) {
  // Screen warp (Task 12): the active screen's projector corner-pin/mesh over the
  // composited output. Screens carry no mask/fx, so this is the ONLY body screen mode
  // ever renders — App only mounts this component with editTarget === "screen" when
  // there's a screen to show, and never mounts a layer overlay alongside it.
  if (editTarget === "screen") {
    if (!screen) return null;
    const anchor = labelAnchor(warpQuad(screen.warp));
    return (
      <>
        <SelLabel x={anchor.x} y={anchor.y} text={`${screen.name || screen.id} · screen warp`} />
        <WarpHandles warp={screen.warp} onPoint={onScreenWarpCorner} onDragStart={onDragStart} onDragEnd={onDragEnd} />
      </>
    );
  }

  if (!layer) return null;

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
  const anchor = labelAnchor(layerQuad(layer));
  return (
    <>
      <SelLabel x={anchor.x} y={anchor.y} text={`${layer.name || layer.id} · warp`} />
      <WarpHandles warp={layer.warp} onPoint={onWarpCorner} onDragStart={onDragStart} onDragEnd={onDragEnd} />
    </>
  );
}
