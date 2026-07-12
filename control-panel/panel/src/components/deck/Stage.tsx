import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

export interface StageProps {
  /** Selected screen id (e.g. "screen-1") — shown in the LIVE badge. Display only; Stage
   *  has no other dependency on the store/app layer (see the module doc below). */
  screenId: string;
  /** Latest preview JPEG data-URL for this screen, or `null` before any frame has
   *  arrived — renders the NO-SIGNAL placeholder in that case. */
  frame: string | null;
  /** Intended internal render size (e.g. 1280×720) for the resolution readout in the
   *  corner badge. Display only — Stage doesn't measure or affect the actual render. */
  width: number;
  height: number;
  /** Selection/warp/mask handles (Tasks 5 & 6), absolutely positioned over the frame. */
  overlay: ReactNode;
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
 *  caller (App) reads off the preview bus; Stage renders whatever it's given. */
export function Stage({ screenId, frame, width, height, overlay, onBackgroundPointerDown }: StageProps) {
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest(".deck-handle")) return;
    onBackgroundPointerDown(e);
  };

  return (
    <div className="deck-stage" data-live={frame != null} onPointerDown={handlePointerDown}>
      {/* src omitted when there's no frame so panel.css's `.preview-img:not([src])` rule
       *  hides the broken-image glyph instead of showing one. */}
      <img className="preview-img" src={frame ?? undefined} alt="" />
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
        <span className="dot" /> LIVE · {screenId.replace(/-/g, " ").toUpperCase()}
      </div>
      <div className="stage-fps mono">
        {width}×{height}
      </div>
      <div className="stage-overlay">{overlay}</div>
    </div>
  );
}
