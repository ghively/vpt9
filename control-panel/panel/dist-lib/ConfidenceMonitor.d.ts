import { ReactNode } from 'react';
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
export declare const ConfidenceMonitor: import('react').ForwardRefExoticComponent<ConfidenceMonitorProps & import('react').RefAttributes<ConfidenceMonitorHandle>>;
