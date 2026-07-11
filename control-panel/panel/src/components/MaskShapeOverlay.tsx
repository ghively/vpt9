import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Mask } from "./types";

export interface MaskShapeOverlayProps {
  mask: Mask;
  onDragStart?: () => void;
  onChange?: (patch: Partial<Pick<Mask, "cx" | "cy" | "rx" | "ry">>) => void;
  onDragEnd?: () => void;
}

const pct = (v: number) => `${v * 100}%`;
const clampR = (v: number) => Math.min(1, Math.max(0.02, v));

/** A draggable mask shape drawn over the confidence monitor, in tungsten (the layer
 *  stack's color). Drag the body to move (cx/cy), the right edge to resize rx, the bottom
 *  edge to resize ry — matching the FX drawer's mask sliders exactly. Updates the DOM
 *  imperatively during a drag (like WarpHandle) so a suppressed re-render never freezes
 *  the gesture; onChange also emits each change for the container to persist. */
export function MaskShapeOverlay({ mask, onDragStart, onChange, onDragEnd }: MaskShapeOverlayProps) {
  const shapeRef = useRef<HTMLDivElement>(null);
  const featherRef = useRef<HTMLDivElement>(null);
  const geom = useRef({ cx: mask.cx, cy: mask.cy, rx: mask.rx, ry: mask.ry, feather: mask.feather });
  geom.current = { cx: mask.cx, cy: mask.cy, rx: mask.rx, ry: mask.ry, feather: mask.feather };

  const paint = () => {
    const { cx, cy, rx, ry, feather } = geom.current;
    const s = shapeRef.current;
    const f = featherRef.current;
    if (s) { s.style.left = pct(cx - rx); s.style.top = pct(cy - ry); s.style.width = pct(rx * 2); s.style.height = pct(ry * 2); }
    if (f) { f.style.left = pct(cx - (rx + feather)); f.style.top = pct(cy - (ry + feather)); f.style.width = pct((rx + feather) * 2); f.style.height = pct((ry + feather) * 2); }
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, apply: (nx: number, ny: number) => void) => {
    event.stopPropagation();
    const stage = shapeRef.current?.parentElement;
    if (!stage) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    onDragStart?.();
    const rect = stage.getBoundingClientRect();
    const onMove = (e: PointerEvent) => {
      const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      apply(nx, ny);
      paint();
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
      onDragEnd?.();
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp); // release the drag if the gesture is canceled (see WarpHandle)
  };

  const radius = mask.shape === "rect" ? "2px" : "50%";
  const style = (extra: number) => ({
    left: pct(mask.cx - (mask.rx + extra)),
    top: pct(mask.cy - (mask.ry + extra)),
    width: pct((mask.rx + extra) * 2),
    height: pct((mask.ry + extra) * 2),
    borderRadius: radius,
  });

  return (
    <>
      <div ref={featherRef} className="mask-shape__feather" style={style(mask.feather)} aria-hidden="true" />
      <div ref={shapeRef} className="mask-shape" style={style(0)}>
        <div
          className="mask-shape__body"
          onPointerDown={(e) => startDrag(e, (nx, ny) => { geom.current.cx = nx; geom.current.cy = ny; onChange?.({ cx: nx, cy: ny }); })}
        />
        <div
          className="mask-shape__edge mask-shape__edge--right"
          // Signed delta (not Math.abs): once the pointer crosses back over cx, this clamps
          // at clampR's 0.02 floor instead of growing again — Math.abs would make the two
          // sides of center symmetric, so dragging the right handle past cx would mirror
          // into re-expanding the shape leftward instead of just bottoming out.
          onPointerDown={(e) => startDrag(e, (nx) => { const rx = clampR(nx - geom.current.cx); geom.current.rx = rx; onChange?.({ rx }); })}
        />
        <div
          className="mask-shape__edge mask-shape__edge--bottom"
          onPointerDown={(e) => startDrag(e, (_nx, ny) => { const ry = clampR(ny - geom.current.cy); geom.current.ry = ry; onChange?.({ ry }); })}
        />
      </div>
    </>
  );
}
