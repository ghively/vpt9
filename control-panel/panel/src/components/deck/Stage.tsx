import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { ConfidenceMonitorHandle } from "../ConfidenceMonitor";
import { pointInQuad, type Quad } from "./layerGeometry";

export interface StageProps {
  /** Selected screen id (e.g. "screen-1") — shown in the LIVE badge. Display only; Stage
   *  has no other dependency on the store/app layer (see the module doc below). */
  screenId: string;
  /** Latest preview JPEG data-URL for this screen, or `null` before any frame has
   *  arrived — renders the NO-SIGNAL placeholder in that case. */
  frame: string | null;
  /** Blind (task A20) — the projector wall is FROZEN while this preview keeps showing
   *  the live off-air look. Flips the stage chrome from the red LIVE tally to an amber
   *  BLIND state so it's unmistakable whether edits are touching what the audience sees
   *  (the grandMA-Blind / QLab-audition convention). */
  blind?: boolean;
  /** Selection/warp/mask handles (Tasks 5 & 6), absolutely positioned over the frame. */
  overlay: ReactNode;
  /** Every layer's on-screen quad, topmost first — used ONLY to draw a faint hover
   *  outline under the pointer (the click-to-select hit-test itself runs in App, which
   *  owns the resulting selection state; Stage stays presentational and just reports
   *  what the pointer is over visually). Optional — omit to skip the hover affordance
   *  (e.g. Storybook demos with no live layers). */
  hitLayers?: Array<{ id: string; quad: Quad }>;
  /** Fires for pointer-downs on the stage background — but NOT for pointer-downs that
   *  land on a Task 6 drag handle (any element carrying `.deck-handle`, checked via
   *  `target.closest`), so grabbing a handle never also triggers a background/select
   *  action underneath it. */
  onBackgroundPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
}

/** The dominant live-preview at the center of the deck: the render-client's low-res
 *  preview frame framed in the confidence-monitor's registration chrome (faint grid,
 *  cyan corner ticks, LIVE badge, resolution readout), held to a fixed 16:9 box so
 *  Tasks 5/6's normalized 0..1 overlay coordinates map onto it cleanly regardless of
 *  the rendered pixel size.
 *
 *  Reuses ConfidenceMonitor's (`../ConfidenceMonitor.tsx`) frame-display building
 *  blocks for consistency: the `.preview-img` class (object-fit/cover, edge-blend
 *  feather mask, and "hidden until a src is set" rule all live as global rules in
 *  panel.css, so reusing the class name here gets that behavior for free) and the same
 *  "NO SIGNAL / awaiting render-client preview" copy. The outer frame is its own
 *  `.deck-stage` (not `.stage`) because `panel.css`'s `.stage`/`.stage__frame` are
 *  sized for the small rail-side confidence monitors (WarpEditor/PipWindows) and
 *  aren't reusable verbatim for this dominant center stage; `.deck-stage` is a fresh,
 *  same-pattern implementation ported from the mockup, scoped under its own class so
 *  it can't collide with (or be broken by) those other monitors.
 *
 *  Presentational only — no imports from `src/app/`. `frame` is a plain prop the
 *  caller (App) reads off the preview bus to SEED the initial render; after that, App
 *  binds this component's ref (a `ConfidenceMonitorHandle`) to the bus so `push()` can
 *  drive the `<img>` directly at the render-client's ~250ms cadence, without a
 *  React re-render (mirrors `ConfidenceMonitor.tsx`'s own `setFrame` contract). */
export const Stage = forwardRef<ConfidenceMonitorHandle, StageProps>(function Stage(
  { screenId, frame, blind = false, overlay, hitLayers, onBackgroundPointerDown },
  ref,
) {
  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const resRef = useRef<HTMLDivElement>(null);
  const resTextRef = useRef("");
  const [hoverQuad, setHoverQuad] = useState<Quad | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      setFrame: (dataUrl: string) => {
        if (imgRef.current) imgRef.current.src = dataUrl;
        stageRef.current?.setAttribute("data-live", "true");
      },
    }),
    [],
  );

  // Reconcile the imperative frame path with React's props: setFrame writes img.src and
  // data-live outside the vDOM, so React's diff still believes src is whatever the last
  // render set — switching to a screen with NO cached frame diffs undefined→undefined
  // and changes nothing, leaving the previous screen's frozen frame under the new
  // screen's badge. This effect re-asserts the prop truth whenever the screen (or its
  // cached frame) changes; live pushes keep flowing through setFrame in between.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (frame) {
      img.src = frame;
      stageRef.current?.setAttribute("data-live", "true");
    } else {
      img.removeAttribute("src");
      stageRef.current?.setAttribute("data-live", "false");
      resTextRef.current = "";
      if (resRef.current) resRef.current.textContent = "";
    }
  }, [screenId, frame]);

  // Honest resolution readout: the ACTUAL preview frame size, measured off the decoded
  // image (its predecessor showed a hardcoded "1280×720" while displaying a 320px-wide
  // JPEG). Imperative like setFrame itself — frames arrive outside the React render loop,
  // so the badge updates the same way, and only when the size actually changes.
  const onFrameLoad = () => {
    const img = imgRef.current;
    const res = resRef.current;
    if (!img || !res || !img.naturalWidth) return;
    const text = `preview ${img.naturalWidth}×${img.naturalHeight}`;
    if (resTextRef.current === text) return;
    resTextRef.current = text;
    res.textContent = text;
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest(".deck-handle")) return;
    onBackgroundPointerDown(e);
  };

  // Faint hover outline so objects on the stage read as clickable before the operator
  // commits to a click — hit-tests the same normalized 0..1 point (against this same
  // box) that App's click handler uses, just locally and read-only. Mirrors
  // handlePointerDown's `.deck-handle` guard: without it, hovering a Task 6 drag handle
  // would paint a hover outline underneath it (the handle sits above whatever layer's
  // quad it belongs to, so that outline would be redundant at best, confusing at worst).
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest(".deck-handle")) { setHoverQuad(null); return; }
    if (!hitLayers?.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
    const hit = hitLayers.find((layer) => pointInQuad(p, layer.quad));
    setHoverQuad(hit?.quad ?? null);
  };
  const handlePointerLeave = () => setHoverQuad(null);

  return (
    <div
      className="deck-stage"
      ref={stageRef}
      data-live={!!frame}
      data-blind={blind}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* src omitted when there's no frame so panel.css's `.preview-img:not([src])` rule
       *  hides the broken-image glyph instead of showing one. */}
      <img ref={imgRef} className="preview-img" src={frame || undefined} alt="" onLoad={onFrameLoad} />
      <div className="deck-stage__nosignal" aria-hidden="true">
        <span className="mono">NO SIGNAL</span>
        <span className="deck-stage__nosignal-sub mono">awaiting render-client preview</span>
      </div>
      <div className="reg" aria-hidden="true" />
      <span className="tick tl" aria-hidden="true" />
      <span className="tick tr" aria-hidden="true" />
      <span className="tick bl" aria-hidden="true" />
      <span className="tick br" aria-hidden="true" />
      <div className="stage-badge">
        <span className="dot" /> {blind ? "BLIND" : "LIVE"} · {screenId.replace(/-/g, " ").toUpperCase()}
      </div>
      <div ref={resRef} className="stage-fps mono" />
      {blind && <div className="stage-blind-note mono">wall frozen · edits off-air · go live commits · discard reverts</div>}
      <div className="stage-overlay">
        {hoverQuad && (
          <svg className="deck-hover-outline" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
            <polygon points={hoverQuad.map((pt) => `${pt.x},${pt.y}`).join(" ")} />
          </svg>
        )}
        {overlay}
      </div>
    </div>
  );
});
