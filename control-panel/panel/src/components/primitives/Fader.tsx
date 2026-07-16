import { useCallback, useEffect, useRef } from "react";

export interface FaderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  ariaLabel?: string;
}

/** A machined-cap range fader (opacity and any other 0–1 control).
 *
 *  onChange is COALESCED to one emission per animation frame. A range input fires an event
 *  per pixel-step of the drag, and each one fans out into a WebSocket update the server
 *  re-broadcasts to every render client — dragging a fader used to flood the network with
 *  hundreds of messages (the warp/mask handles already coalesce this way; faders didn't).
 *  The final value always flushes on release so the committed value is exact. The input
 *  stays controlled, so its thumb still tracks the optimistic per-frame state update. */
export function Fader({ value, min = 0, max = 1, step = 0.01, onChange, ariaLabel }: FaderProps) {
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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

  // Flush any pending value on unmount so a release mid-frame isn't dropped.
  useEffect(() => () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (pendingRef.current != null) onChangeRef.current?.(pendingRef.current);
    }
  }, []);

  const commit = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    flush();
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => emit(Number(e.target.value))}
      onPointerUp={commit}
      onPointerCancel={commit}
      onBlur={commit}
    />
  );
}
