import { useRef, type PointerEvent as ReactPointerEvent } from "react";

export interface WarpHandleProps {
  /** Normalised 0–1 position on the stage. */
  x: number;
  y: number;
  /** Initial active (glowing) state — the live drag also toggles this imperatively. */
  active?: boolean;
  onDragStart?: () => void;
  onDragTo?: (x: number, y: number) => void;
  onDragEnd?: () => void;
}

/** A tungsten registration reticle. During a drag it positions itself imperatively
 *  (mirroring the vanilla panel) so the container can suppress re-renders mid-gesture
 *  without the handle appearing to freeze. */
export function WarpHandle({ x, y, active = false, onDragStart, onDragTo, onDragEnd }: WarpHandleProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const stage = el.parentElement; // .stage
    if (!stage) return;
    el.setPointerCapture(event.pointerId);
    el.dataset.active = "true";
    onDragStart?.();

    const onMove = (moveEvent: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (moveEvent.clientX - rect.left) / rect.width));
      const ny = Math.min(1, Math.max(0, (moveEvent.clientY - rect.top) / rect.height));
      el.style.left = `${nx * 100}%`;
      el.style.top = `${ny * 100}%`;
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
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      onPointerDown={onPointerDown}
    />
  );
}
