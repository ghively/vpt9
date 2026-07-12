import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { WarpHandle } from "./WarpHandle";
import type { Mask, Point } from "./types";

export interface MaskShapeOverlayProps {
  mask: Mask;
  onDragStart?: () => void;
  onChange?: (patch: Partial<Pick<Mask, "cx" | "cy" | "rx" | "ry" | "points">>) => void;
  onDragEnd?: () => void;
}

const pct = (v: number) => `${v * 100}%`;
const clampR = (v: number) => Math.min(1, Math.max(0.02, v));
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const POLY_INSERT_THRESHOLD = 0.03;

function clonePoints(points: Point[]) {
  return points.map((p) => ({ x: p.x, y: p.y }));
}

function segmentDistance(a: Point, b: Point, p: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const denom = dx * dx + dy * dy || 1e-9;
  const t = Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / denom));
  const x = a.x + t * dx;
  const y = a.y + t * dy;
  return { dist: Math.hypot(x - p.x, y - p.y), x, y };
}

/** A draggable mask shape drawn over the confidence monitor, in tungsten (the layer
 *  stack's color). Rect/ellipse keep the original body + edge drags; polygon mode adds
 *  vertex handles, outline insertion, and delete-key removal. */
export function MaskShapeOverlay({ mask, onDragStart, onChange, onDragEnd }: MaskShapeOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const featherRef = useRef<HTMLDivElement>(null);
  const geom = useRef({ cx: mask.cx, cy: mask.cy, rx: mask.rx, ry: mask.ry, feather: mask.feather });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  geom.current = { cx: mask.cx, cy: mask.cy, rx: mask.rx, ry: mask.ry, feather: mask.feather };

  const points = useMemo(() => mask.points ?? [], [mask.points]);
  const isPolygon = mask.shape === "polygon";

  useEffect(() => {
    if (!isPolygon) {
      setSelectedIndex(null);
      return;
    }
    if (selectedIndex == null) return;
    if (points.length === 0) setSelectedIndex(null);
    else if (selectedIndex >= points.length) setSelectedIndex(points.length - 1);
  }, [isPolygon, points.length, selectedIndex]);

  useEffect(() => {
    if (!isPolygon || selectedIndex == null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, [contenteditable='true']")) return;
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (points.length <= 3) return;
      const next = clonePoints(points);
      next.splice(selectedIndex, 1);
      onChange?.({ points: next });
      setSelectedIndex(Math.min(selectedIndex, next.length - 1));
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPolygon, onChange, points, selectedIndex]);

  const paint = () => {
    const { cx, cy, rx, ry, feather } = geom.current;
    const shape = shapeRef.current;
    const featherNode = featherRef.current;
    if (shape) {
      shape.style.left = pct(cx - rx);
      shape.style.top = pct(cy - ry);
      shape.style.width = pct(rx * 2);
      shape.style.height = pct(ry * 2);
      shape.style.borderRadius = mask.shape === "rect" ? "2px" : "50%";
    }
    if (featherNode) {
      featherNode.style.left = pct(cx - (rx + feather));
      featherNode.style.top = pct(cy - (ry + feather));
      featherNode.style.width = pct((rx + feather) * 2);
      featherNode.style.height = pct((ry + feather) * 2);
      featherNode.style.borderRadius = mask.shape === "rect" ? "2px" : "50%";
    }
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, apply: (nx: number, ny: number) => void) => {
    event.stopPropagation();
    const stage = rootRef.current?.parentElement;
    if (!stage) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    onDragStart?.();
    const rect = stage.getBoundingClientRect();
    const onMove = (e: PointerEvent) => {
      const nx = clamp01((e.clientX - rect.left) / rect.width);
      const ny = clamp01((e.clientY - rect.top) / rect.height);
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
    target.addEventListener("pointercancel", onUp);
  };

  const updatePoints = (next: Point[]) => {
    onChange?.({ points: next });
  };

  const insertPoint = (nx: number, ny: number) => {
    if (points.length < 2) return;
    const p = { x: clamp01(nx), y: clamp01(ny) };
    let bestIndex = 0;
    let best = { dist: Number.POSITIVE_INFINITY, x: p.x, y: p.y };
    for (let i = 0; i < points.length; i++) {
      const hit = segmentDistance(points[i], points[(i + 1) % points.length], p);
      if (hit.dist < best.dist) {
        best = hit;
        bestIndex = i;
      }
    }
    if (best.dist > POLY_INSERT_THRESHOLD) return;
    const next = clonePoints(points);
    next.splice(bestIndex + 1, 0, { x: best.x, y: best.y });
    updatePoints(next);
    setSelectedIndex(bestIndex + 1);
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
    <div
      ref={rootRef}
      className="mask-shape-root"
      onPointerDown={(e) => {
        if (!isPolygon || e.target !== e.currentTarget) return;
        const stage = rootRef.current?.parentElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        insertPoint((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
      }}
    >
      {isPolygon ? (
        <>
          <svg className="mask-shape__poly" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
            <polygon points={points.map((p) => `${p.x},${p.y}`).join(" ")} />
          </svg>
          {points.map((p, i) => (
            <WarpHandle
              key={`${i}-${p.x}-${p.y}`}
              x={p.x}
              y={p.y}
              selected={selectedIndex === i}
              className="mask-point"
              cornerTag={String(i + 1)}
              onSelect={() => setSelectedIndex(i)}
              onDragStart={onDragStart}
              onDragTo={(x, y) => {
                const next = clonePoints(points);
                next[i] = { x: clamp01(x), y: clamp01(y) };
                updatePoints(next);
              }}
              onDragEnd={onDragEnd}
            />
          ))}
        </>
      ) : (
        <>
          <div ref={featherRef} className="mask-shape__feather" style={style(mask.feather)} aria-hidden="true" />
          <div ref={shapeRef} className="mask-shape" style={style(0)}>
            {/* "deck-handle" (alongside each element's own class) is a no-op outside the deck
             *  Stage (Task 6) â€” that's the only place a background-click/hover-outline handler
             *  looks for it, to keep it from firing underneath a drag handle. */}
            <div
              className="mask-shape__body deck-handle"
              onPointerDown={(e) => startDrag(e, (nx, ny) => { geom.current.cx = nx; geom.current.cy = ny; onChange?.({ cx: nx, cy: ny }); })}
            />
            <div
              className="mask-shape__edge mask-shape__edge--right deck-handle"
              onPointerDown={(e) => startDrag(e, (nx) => { const rx = clampR(nx - geom.current.cx); geom.current.rx = rx; onChange?.({ rx }); })}
            />
            <div
              className="mask-shape__edge mask-shape__edge--bottom deck-handle"
              onPointerDown={(e) => startDrag(e, (_nx, ny) => { const ry = clampR(ny - geom.current.cy); geom.current.ry = ry; onChange?.({ ry }); })}
            />
          </div>
        </>
      )}
    </div>
  );
}
