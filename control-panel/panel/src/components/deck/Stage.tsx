import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { ConfidenceMonitorHandle } from "../ConfidenceMonitor";
import { pointInQuad, type Quad } from "./layerGeometry";
import { hasMediaDrag, getMediaDrag, type MediaDragPayload } from "./dnd";
import { useContextMenu, type MenuItem } from "./ContextMenu";
import type { EditMode } from "./Inspector";

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
   *  action underneath it. `point` is the normalized 0..1 position, already corrected
   *  for zoom/pan — Stage owns that state internally, so callers never need to know it
   *  exists (mirrors `onDropMedia`'s contract below, which was already point-based). */
  onBackgroundPointerDown: (point: { x: number; y: number }) => void;
  /** On-stage Warp · Mask · FX chips (top-center) — the same mode state the Inspector's
   *  sections drive, surfaced where the operator is already looking. Omit (screen-warp
   *  target, no selection) to hide them. */
  modeChips?: { mode: EditMode; onChange: (mode: EditMode) => void } | null;
  /** A MediaBin item dropped onto the stage: `point` is the normalized 0..1 drop
   *  position, so the container can assign to whichever layer's quad is under it. */
  onDropMedia?: (point: { x: number; y: number }, payload: MediaDragPayload) => void;
  /** Right-click menu entries for the stage (mode switches, reset warp, …) — built by
   *  the container from the current selection. Omit/empty = browser default menu. */
  contextItems?: MenuItem[];
}

const MODE_CHIPS: Array<{ key: EditMode; label: string }> = [
  { key: "warp", label: "Warp" },
  { key: "mask", label: "Mask" },
  { key: "fx", label: "FX" },
];

// Stage zoom/pan (MapMap comparison, task 34): dragging a handle at whatever pixel size
// the browser window happens to render is the real precision ceiling behind "the mask
// circle doesn't quite line up" — zooming in lets a fraction of a normalized unit cover
// many more screen pixels. Local view-only state (like a code editor's zoom level, not
// synced to the server or other operators). 1 = fit exactly to the frame (today's only
// option); can't zoom OUT below that since there'd be empty space to pan into for no
// benefit.
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
type StageView = { zoom: number; pan: { x: number; y: number } };
const DEFAULT_VIEW: StageView = { zoom: 1, pan: { x: 0, y: 0 } };

function clampZoom(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

// Keeps the scaled content covering the viewport at all times — no panning into empty
// space beyond the content's own edges. At zoom=1 this collapses to exactly {0,0}.
function clampPan(x: number, y: number, zoom: number, width: number, height: number) {
  const minX = width * (1 - zoom);
  const minY = height * (1 - zoom);
  return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
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
  { screenId, frame, blind = false, overlay, hitLayers, onBackgroundPointerDown, modeChips, onDropMedia, contextItems },
  ref,
) {
  const ctx = useContextMenu();
  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const resRef = useRef<HTMLDivElement>(null);
  const resTextRef = useRef("");
  const aspectRef = useRef("");
  const [hoverQuad, setHoverQuad] = useState<Quad | null>(null);
  const [dropArmed, setDropArmed] = useState(false);
  const [view, setView] = useState<StageView>(DEFAULT_VIEW);
  // Synchronous mirror for the wheel handler below, which needs to read the CURRENT zoom
  // before deciding whether to hijack a plain scroll for panning — reading `view` itself
  // there would see a stale closure between renders.
  const viewRef = useRef(view);
  viewRef.current = view;

  // Switching screens resets the view — a zoomed/panned crop left over from the PREVIOUS
  // screen's calibration would just be confusing framing on a screen it was never set on.
  useEffect(() => {
    setView(DEFAULT_VIEW);
  }, [screenId]);

  // Ctrl/Cmd+scroll zooms (centered on the cursor, so the point under it stays under it);
  // plain scroll pans, but only once zoomed in — at 1:1 the wheel does nothing here, so
  // normal page/rail scrolling is untouched. Native listener (not JSX onWheel): React
  // marks wheel listeners passive by default, which silently no-ops preventDefault().
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const zooming = e.ctrlKey || e.metaKey;
      if (!zooming && viewRef.current.zoom <= MIN_ZOOM) return; // let the page scroll normally
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setView((prev) => {
        if (zooming) {
          // A real mouse sends one notch as deltaY ~=100; trackpads stream many small
          // deltas per gesture. 0.0015 tunes a single notch to roughly a 15% zoom step
          // (exp(-100*0.0015) ~= 0.86) — 0.01 (10x more sensitive) jumped straight to
          // MAX_ZOOM on one notch, which is unusable with a real mouse.
          const newZoom = clampZoom(prev.zoom * Math.exp(-e.deltaY * 0.0015));
          // Solve for the pan that keeps the content point under the cursor fixed on
          // screen: that point was (mx - pan) / zoom before, so newPan = mx - newZoom * that.
          const cx = (mx - prev.pan.x) / prev.zoom;
          const cy = (my - prev.pan.y) / prev.zoom;
          const pan = clampPan(mx - newZoom * cx, my - newZoom * cy, newZoom, rect.width, rect.height);
          return { zoom: newZoom, pan };
        }
        const pan = clampPan(prev.pan.x - e.deltaX, prev.pan.y - e.deltaY, prev.zoom, rect.width, rect.height);
        return { ...prev, pan };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // content-space point (both 0..1 fraction of the FRAME, not the viewport) for a pixel
  // position relative to the outer .deck-stage box — shared by hover, background-click,
  // and media-drop below, all of which used to assume box-rect === content-rect (true
  // only at zoom 1).
  const toContentPoint = (px: number, py: number, rect: DOMRect) => {
    const { zoom, pan } = viewRef.current;
    return {
      x: (px - pan.x) / zoom / rect.width,
      y: (py - pan.y) / zoom / rect.height,
    };
  };

  const zoomBy = (factor: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setView((prev) => {
      const newZoom = clampZoom(prev.zoom * factor);
      // Zoom the buttons apply from the viewport's own center, not the last cursor spot.
      const cx = (rect.width / 2 - prev.pan.x) / prev.zoom;
      const cy = (rect.height / 2 - prev.pan.y) / prev.zoom;
      const pan = clampPan(rect.width / 2 - newZoom * cx, rect.height / 2 - newZoom * cy, newZoom, rect.width, rect.height);
      return { zoom: newZoom, pan };
    });
  };
  const resetZoom = () => setView(DEFAULT_VIEW);

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
      // No cached frame for this screen yet — fall back to the default 16:9 box (see
      // deck.css) rather than keeping the PREVIOUS screen's aspect ratio around.
      aspectRef.current = "";
      stageRef.current?.style.removeProperty("--frame-ratio");
    }
  }, [screenId, frame]);

  // Honest resolution readout: the ACTUAL preview frame size, measured off the decoded
  // image (its predecessor showed a hardcoded "1280×720" while displaying a 320px-wide
  // JPEG). Imperative like setFrame itself — frames arrive outside the React render loop,
  // so the badge updates the same way, and only when the size actually changes.
  //
  // Also drives the stage box's OWN aspect ratio (via --frame-ratio, read by .deck-stage
  // in deck.css) from this same measurement. The render-client's canvas is sized off its
  // real browser window/screen (compositor.js's `canvas.width = clientWidth * dpr`), and
  // capturePreview()'s downsample preserves that exact ratio — so a screen that ISN'T
  // 16:9 (a non-standard projector resolution, an odd-shaped surface, even just a
  // slightly-off browser window) sent a preview whose real shape didn't match this box's
  // hardcoded 16:9. `object-fit: cover` masked that by silently CROPPING the preview to
  // fit — invisible as a viewing glitch, but every on-stage coordinate (mask drag, warp
  // handle drag, click-to-select, media drag-drop) is computed as a fraction of THIS
  // box's rect and assumes it maps 1:1 onto the full frame, which becomes wrong the
  // moment cover has to crop anything: the operator drags to where they SEE a point,
  // but that point sits at a different fraction of the real (cropped) image, so the
  // value that lands on the mask/warp/layer is offset from where they clicked. Matching
  // the box's own shape to the real frame eliminates the crop entirely, so box-fraction
  // and image-fraction are always the same number.
  const onFrameLoad = () => {
    const img = imgRef.current;
    const res = resRef.current;
    if (!img || !res || !img.naturalWidth || !img.naturalHeight) return;
    const text = `preview ${img.naturalWidth}×${img.naturalHeight}`;
    if (resTextRef.current !== text) {
      resTextRef.current = text;
      res.textContent = text;
    }
    const ratio = `${img.naturalWidth} / ${img.naturalHeight}`;
    if (aspectRef.current !== ratio) {
      aspectRef.current = ratio;
      stageRef.current?.style.setProperty("--frame-ratio", ratio);
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // .stage-zoom sits in a fixed corner over the frame — without this, clicking +/−/reset
    // would ALSO hit-test whatever layer quad happens to be under that corner and silently
    // reassign the selection as a side effect of zooming.
    if (target.closest(".deck-handle, .stage-zoom")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onBackgroundPointerDown(toContentPoint(e.clientX - rect.left, e.clientY - rect.top, rect));
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
    const p = toContentPoint(e.clientX - rect.left, e.clientY - rect.top, rect);
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
      data-drop={dropArmed}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => {
        if (contextItems?.length) ctx.open(e, contextItems);
      }}
      onDragOver={(e: DragEvent) => {
        if (!onDropMedia || !hasMediaDrag(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDropArmed(true);
      }}
      onDragLeave={() => setDropArmed(false)}
      onDrop={(e: DragEvent) => {
        setDropArmed(false);
        const payload = getMediaDrag(e);
        if (!payload || !onDropMedia) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        onDropMedia(toContentPoint(e.clientX - rect.left, e.clientY - rect.top, rect), payload);
      }}
    >
      {/* Everything that should zoom/pan together lives in here — the preview frame and
       *  every on-stage handle. Chrome below (badges/ticks/reg grid/zoom control) stays
       *  outside, so it never moves. */}
      <div
        className="deck-stage__content"
        style={view.zoom !== 1 || view.pan.x !== 0 || view.pan.y !== 0 ? { transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.zoom})` } : undefined}
      >
        {/* src omitted when there's no frame so panel.css's `.preview-img:not([src])` rule
         *  hides the broken-image glyph instead of showing one. */}
        <img ref={imgRef} className="preview-img" src={frame || undefined} alt="" onLoad={onFrameLoad} />
        <div className="stage-overlay">
          {hoverQuad && (
            <svg className="deck-hover-outline" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
              <polygon points={hoverQuad.map((pt) => `${pt.x},${pt.y}`).join(" ")} />
            </svg>
          )}
          {overlay}
        </div>
      </div>
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
      {modeChips && (
        <div className="stage-modes" role="group" aria-label="Stage edit mode">
          {MODE_CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              className="stage-mode-chip"
              aria-pressed={modeChips.mode === c.key}
              onClick={() => modeChips.onChange(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      {blind && <div className="stage-blind-note mono">wall frozen · edits off-air · go live commits · discard reverts</div>}
      <div className="stage-zoom" role="group" aria-label="Stage zoom">
        <button type="button" onClick={() => zoomBy(1 / 1.4)} disabled={view.zoom <= MIN_ZOOM} aria-label="Zoom out">
          −
        </button>
        <button type="button" className="stage-zoom__pct mono" onClick={resetZoom} disabled={view.zoom === MIN_ZOOM} aria-label="Reset zoom to 100%">
          {Math.round(view.zoom * 100)}%
        </button>
        <button type="button" onClick={() => zoomBy(1.4)} disabled={view.zoom >= MAX_ZOOM} aria-label="Zoom in">
          +
        </button>
      </div>
      {ctx.menu}
    </div>
  );
});
