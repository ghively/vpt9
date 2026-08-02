import { useCallback, useEffect, useRef, useState } from "react";

export interface FaderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  /** Drag-guard hooks (same contract as WarpHandle's): fired on pointer-down / gesture
   *  end so the container can suppress store-driven re-renders for the gesture's
   *  duration (App's isDraggingRef) — without them, every echoed/unrelated WS update
   *  forced a full-tree re-render per frame for the whole drag, and a concurrent
   *  update (another operator, an LFO tick) could yank the value mid-gesture. */
  onDragStart?: () => void;
  onDragEnd?: () => void;
  ariaLabel?: string;
}

/** A machined-cap range fader (opacity and any other 0–1 control).
 *
 *  onChange is COALESCED to one emission per animation frame. A range input fires an event
 *  per pixel-step of the drag, and each one fans out into a WebSocket update the server
 *  re-broadcasts to every render client — dragging a fader used to flood the network with
 *  hundreds of messages (the warp/mask handles already coalesce this way; faders didn't).
 *  The final value always flushes on release so the committed value is exact.
 *
 *  While a pointer drag is active the shown value is a LOCAL echo (dragValue): the
 *  container suppresses its own re-renders during the gesture (onDragStart/onDragEnd),
 *  so the `value` prop goes stale mid-drag — and React restores a controlled input to
 *  its last-rendered prop after every change event, which would freeze the thumb. The
 *  local echo keeps the input controlled AND live; drag end clears it and the
 *  container's reconciling render takes back over. */
export function Fader({ value, min = 0, max = 1, step = 0.01, onChange, onDragStart, onDragEnd, ariaLabel }: FaderProps) {
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;
  const draggingRef = useRef(false);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const flush = useCallback(() => {
    rafRef.current = null;
    if (pendingRef.current != null) {
      const v = pendingRef.current;
      pendingRef.current = null;
      onChangeRef.current?.(v);
    }
  }, []);

  const emit = useCallback(
    (v: number) => {
      pendingRef.current = v;
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(flush);
    },
    [flush],
  );

  // Flush any pending value on unmount so a release mid-frame isn't dropped — and
  // release the drag guard if the fader unmounts mid-gesture (selection change,
  // section collapse), else the container's isDraggingRef wedges true and every
  // store-driven re-render silently stops (the MaskShapeOverlay bug's cousin).
  useEffect(() => () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (pendingRef.current != null) onChangeRef.current?.(pendingRef.current);
    }
    if (draggingRef.current) {
      draggingRef.current = false;
      onDragEndRef.current?.();
    }
  }, []);

  const startDrag = () => {
    if (draggingRef.current) return;
    draggingRef.current = true;
    onDragStartRef.current?.();
  };

  const commit = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    flush();
    if (draggingRef.current) {
      draggingRef.current = false;
      setDragValue(null);
      onDragEndRef.current?.();
    }
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={dragValue ?? value}
      aria-label={ariaLabel}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (draggingRef.current) setDragValue(v);
        emit(v);
      }}
      onPointerDown={startDrag}
      onPointerUp={commit}
      onPointerCancel={commit}
      onBlur={commit}
    />
  );
}
