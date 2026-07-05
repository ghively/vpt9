import { ConfidenceMonitorHandle } from './ConfidenceMonitor';
import { Pip } from './types';
export interface PipWindowsProps {
    screenId: string;
    /** PiP windows belonging to this screen. */
    pips: Pip[];
    previewFrame?: string;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onUpdatePip?: (id: string, field: string, value: unknown) => void;
    onMovePip?: (id: string, x: number, y: number) => void;
    onResizePip?: (id: string, width: number, height: number) => void;
    onRemovePip?: (id: string) => void;
    onAddPip?: () => void;
}
/** Manages the PiP (cast) windows for a screen: a monitor with draggable boxes plus a
 *  row of controls per window. */
export declare const PipWindows: import('react').ForwardRefExoticComponent<PipWindowsProps & import('react').RefAttributes<ConfidenceMonitorHandle>>;
