import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";

export interface ConfidenceMonitorHandle {
  /** Push a preview frame straight to the <img> without a React re-render — used by the
   *  live container for ~250ms preview frames so they never reset input focus or fight
   *  an in-progress drag. */
  setFrame: (dataUrl: string) => void;
}

export interface ConfidenceMonitorProps {
  /** Initial/static frame (Storybook and design-sync pass this; the live app uses the
   *  imperative setFrame handle instead). */
  previewFrame?: string;
  /** Overlays positioned on the stage: warp handles or PiP boxes. */
  children?: ReactNode;
}

/** The signature element: a projectionist's confidence monitor — recessed well, faint
 *  registration grid, cyan corner crop-marks, and an edge-blend-feathered preview.
 *  Until a frame arrives it reads NO SIGNAL, so an idle monitor never looks broken. */
export const ConfidenceMonitor = forwardRef<ConfidenceMonitorHandle, ConfidenceMonitorProps>(
  function ConfidenceMonitor({ previewFrame, children }, ref) {
    const imgRef = useRef<HTMLImageElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        setFrame: (dataUrl: string) => {
          if (imgRef.current) imgRef.current.src = dataUrl;
          // Imperative on purpose (setFrame's no-re-render contract): flag the stage
          // live so CSS hides the NO SIGNAL readout.
          stageRef.current?.setAttribute("data-live", "true");
        },
      }),
      [],
    );

    return (
      <div className="stage" ref={stageRef} data-live={!!previewFrame}>
        <div className="stage__frame">
          {/* src omitted when empty so the CSS `:not([src])` rule hides the broken glyph. */}
          <img ref={imgRef} className="preview-img" src={previewFrame || undefined} alt="" />
        </div>
        <div className="stage__nosignal" aria-hidden="true">
          <span className="mono">NO SIGNAL</span>
          <span className="stage__nosignal-sub mono">awaiting render-client preview</span>
        </div>
        {children}
      </div>
    );
  },
);
