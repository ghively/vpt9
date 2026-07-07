import { useRef, type PointerEvent as ReactPointerEvent } from "react";

export interface WarpHandleProps {
  /** Normalised 0–1 position on the stage. */
  x: number;
  y: number;
  active?: boolean;
  /** Highlighted as the currently-selected point (Task 14). */
  selected?: boolean;
  /** Always-visible tag (corner mode: TL/TR/BR/BL). */
  cornerTag?: string;
  /** Revealed on hover/drag (mesh mode: R2·C3). */
  coordTag?: string;
  /** Fired on pointer-down so a tap can select the point for exact entry. */
  onSelect?: () => void;
  onDragStart?: () => void;
  onDragTo?: (x: number, y: number) => void;
  onDragEnd?: () => void;
}

/** A tungsten registration reticle. Positions itself imperatively during a drag so the
 *  container can suppress re-renders mid-gesture without the handle appearing to freeze. */
export function WarpHandle({ x, y, active = false, selected = false, cornerTag, coordTag, onSelect, onDragStart, onDragTo, onDragEnd }: WarpHandleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const stage = el.parentElement; // .stage
    if (!stage) return;
    onSelect?.();
    el.setPointerCapture(event.pointerId);
    el.dataset.active = "true";
    onDragStart?.();

    const onMove = (moveEvent: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (moveEvent.clientX - rect.left) / rect.width));
      const ny = Math.min(1, Math.max(0, (moveEvent.clientY - rect.top) / rect.height));
      el.style.left = `${nx * 100}%`;
      el.style.top = `${ny * 100}%`;
      if (badgeRef.current) badgeRef.current.textContent = `x ${nx.toFixed(2)} · y ${ny.toFixed(2)}`;
      onDragTo?.(nx, ny);
    };
    const onUp = () => {
      el.dataset.active = "false";
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      onDragEnd?.();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={ref}
      className="handle"
      data-active={active}
      data-selected={selected}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      onPointerDown={onPointerDown}
    >
      {cornerTag && <span className="handle__tag mono">{cornerTag}</span>}
      {coordTag && <span className="handle__coord mono">{coordTag}</span>}
      <div ref={badgeRef} className="handle__badge mono">{`x ${x.toFixed(2)} · y ${y.toFixed(2)}`}</div>
    </div>
  );
}
