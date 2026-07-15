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
  /** Extra class(es) appended after the always-present "handle deck-handle" pair — e.g.
   *  the deck's StageSelectionOverlay (Task 6) adds a per-corner "tl"/"tr"/"br"/"bl" tag
   *  so the e2e drag test can target a specific corner. */
  className?: string;
  /** Fired on pointer-down so a tap can select the point for exact entry. */
  onSelect?: () => void;
  onDragStart?: () => void;
  onDragTo?: (x: number, y: number) => void;
  onDragEnd?: () => void;
}

/** A tungsten registration reticle. Positions itself imperatively during a drag so the
 *  container can suppress re-renders mid-gesture without the handle appearing to freeze.
 *
 *  Always carries "deck-handle" (in addition to "handle") — the deck Stage (Task 6) uses
 *  that marker to make background clicks/hover-outline ignore drag handles; carrying it
 *  unconditionally is a no-op everywhere else (WarpEditor's rail-side monitor doesn't
 *  look for it). */
export function WarpHandle({ x, y, active = false, selected = false, cornerTag, coordTag, className, onSelect, onDragStart, onDragTo, onDragEnd }: WarpHandleProps) {
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

    // Coalesce onDragTo (which fans out into a WebSocket update per call) to one emission
    // per animation frame. High-poll-rate pointers fire pointermove well above 60 Hz, and
    // emitting per event flooded the control plane (60-120+ msgs/sec per drag) — the same
    // flood server/src/osc-out.js throttles on its side. The handle's own DOM position and
    // badge still track every raw event, so the gesture feels perfectly live locally.
    let raf = 0;
    let pending: [number, number] | null = null;
    const flush = () => {
      raf = 0;
      if (!pending) return;
      const [px, py] = pending;
      pending = null;
      onDragTo?.(px, py);
    };
    const onMove = (moveEvent: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      let nx = Math.min(1, Math.max(0, (moveEvent.clientX - rect.left) / rect.width));
      let ny = Math.min(1, Math.max(0, (moveEvent.clientY - rect.top) / rect.height));
      // Ctrl-drag snaps to a 1/40 grid (Resolume's snap-with-modifier pattern, inverted:
      // snapping is opt-in here since free placement is the common case). Combined with
      // tap-then-arrow-key nudging this covers coarse/aligned/exact placement.
      if (moveEvent.ctrlKey) {
        nx = Math.round(nx * 40) / 40;
        ny = Math.round(ny * 40) / 40;
      }
      el.style.left = `${nx * 100}%`;
      el.style.top = `${ny * 100}%`;
      if (badgeRef.current) badgeRef.current.textContent = `x ${nx.toFixed(2)} · y ${ny.toFixed(2)}`;
      pending = [nx, ny];
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onUp = () => {
      if (raf) cancelAnimationFrame(raf);
      flush(); // the release position must always go out, coalesced or not
      el.dataset.active = "false";
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      onDragEnd?.();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    // pointercancel fires INSTEAD of pointerup when the browser takes over the gesture
    // (edge back-swipe, scroll takeover, palm rejection on touch). Without handling it,
    // onDragEnd never runs, so App's isDraggingRef stays true and every server-echoed
    // update silently stops re-rendering the panel until another full drag completes.
    el.addEventListener("pointercancel", onUp);
  };

  return (
    <div
      ref={ref}
      className={["handle", "deck-handle", className].filter(Boolean).join(" ")}
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
