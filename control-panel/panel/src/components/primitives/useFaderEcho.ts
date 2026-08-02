import { useRef, useState } from "react";

/** Local display echo for a Fader with an adjacent numeric readout.
 *
 *  While a fader drag is in progress the container suppresses its store-driven
 *  re-renders (the drag guard threaded through Fader's onDragStart/onDragEnd), so a
 *  readout derived from store props would freeze mid-drag and jump on release. This
 *  hook echoes the dragged value into local state — a cheap, subtree-only re-render —
 *  so the number stays live under the operator's pointer, then clears on drag end so
 *  the container's reconciling render takes back over. Non-drag changes (keyboard
 *  steps) bypass the echo entirely: those aren't guarded, so the store value stays
 *  authoritative for them.
 *
 *  Returns the wrapped callbacks to spread onto the Fader plus `echo` (null outside a
 *  drag) for the readout: display `echo ?? storeValue`. */
export function useFaderEcho(
  onChange?: (value: number) => void,
  onDragStart?: () => void,
  onDragEnd?: () => void,
): {
  echo: number | null;
  onChange: (value: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
} {
  const draggingRef = useRef(false);
  const [echo, setEcho] = useState<number | null>(null);
  return {
    echo,
    onChange: (v: number) => {
      if (draggingRef.current) setEcho(v);
      onChange?.(v);
    },
    onDragStart: () => {
      draggingRef.current = true;
      onDragStart?.();
    },
    onDragEnd: () => {
      draggingRef.current = false;
      setEcho(null);
      onDragEnd?.();
    },
  };
}
