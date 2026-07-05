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
 *  registration grid, cyan corner crop-marks, and an edge-blend-feathered preview. */
export const ConfidenceMonitor = forwardRef<ConfidenceMonitorHandle, ConfidenceMonitorProps>(
  function ConfidenceMonitor({ previewFrame, children }, ref) {
    const imgRef = useRef<HTMLImageElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        setFrame: (dataUrl: string) => {
          if (imgRef.current) imgRef.current.src = dataUrl;
        },
      }),
      [],
    );

    return (
      <div className="stage">
        <div className="stage__frame">
          {/* src omitted when empty so the CSS `:not([src])` rule hides the broken glyph. */}
          <img ref={imgRef} className="preview-img" src={previewFrame || undefined} alt="" />
        </div>
        {children}
      </div>
    );
  },
);
