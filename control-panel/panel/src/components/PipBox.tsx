import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Pip } from "./types";

export interface PipBoxProps {
  pip: Pip;
  onDragStart?: () => void;
  onMove?: (x: number, y: number) => void;
  onResize?: (width: number, height: number) => void;
  onDragEnd?: () => void;
}

/** A movable/resizable cyan PiP window overlay on the confidence monitor. Like the warp
 *  handles, it drags itself imperatively so re-renders can be suppressed mid-gesture. */
export function PipBox({ pip, onDragStart, onMove, onResize, onDragEnd }: PipBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);

  const beginMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const box = boxRef.current;
    const stage = box?.parentElement;
    if (!box || !stage) return;
    const bar = event.currentTarget as HTMLElement;
    bar.setPointerCapture(event.pointerId);
    onDragStart?.();
    const rect = stage.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = pip.x;
    const originY = pip.y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / rect.width;
      const dy = (moveEvent.clientY - startY) / rect.height;
      const nx = Math.min(1 - pip.width, Math.max(0, originX + dx));
      const ny = Math.min(1 - pip.height, Math.max(0, originY + dy));
      box.style.left = `${nx * 100}%`;
      box.style.top = `${ny * 100}%`;
      onMove?.(nx, ny);
    };
    const onPointerUp = () => {
      bar.removeEventListener("pointermove", onPointerMove);
      bar.removeEventListener("pointerup", onPointerUp);
      bar.removeEventListener("pointercancel", onPointerUp);
      onDragEnd?.();
    };
    bar.addEventListener("pointermove", onPointerMove);
    bar.addEventListener("pointerup", onPointerUp);
    bar.addEventListener("pointercancel", onPointerUp); // release the drag if the gesture is canceled (see WarpHandle)
  };

  const beginResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const box = boxRef.current;
    const stage = box?.parentElement;
    if (!box || !stage) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    onDragStart?.();
    const rect = stage.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originW = pip.width;
    const originH = pip.height;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / rect.width;
      const dy = (moveEvent.clientY - startY) / rect.height;
      const nw = Math.max(0.05, Math.min(1 - pip.x, originW + dx));
      const nh = Math.max(0.05, Math.min(1 - pip.y, originH + dy));
      box.style.width = `${nw * 100}%`;
      box.style.height = `${nh * 100}%`;
      onResize?.(nw, nh);
    };
    const handle = event.currentTarget as HTMLElement;
    const onPointerUp = () => {
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      handle.removeEventListener("pointercancel", onPointerUp);
      onDragEnd?.();
    };
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
    handle.addEventListener("pointercancel", onPointerUp); // release the drag if the gesture is canceled (see WarpHandle)
  };

  return (
    <div
      ref={boxRef}
      className="pip-box"
      style={{
        left: `${pip.x * 100}%`,
        top: `${pip.y * 100}%`,
        width: `${pip.width * 100}%`,
        height: `${pip.height * 100}%`,
      }}
    >
      <div className="pip-box__bar" onPointerDown={beginMove}>
        <span>{pip.title || "PiP"}</span>
      </div>
      <div className="pip-box__resize" onPointerDown={beginResize} />
    </div>
  );
}
