import { ConfidenceMonitorHandle } from './ConfidenceMonitor';
import { Screen } from './types';
export interface WarpEditorProps {
    /** The screen being warped (undefined until one is selected). */
    screen?: Screen;
    /** All screens, for the selector tabs. */
    screens: Screen[];
    previewFrame?: string;
    onSelectScreen?: (id: string) => void;
    onSetMode?: (mode: "corner" | "mesh") => void;
    onReset?: () => void;
    onDragStart?: () => void;
    onMovePoint?: (index: number, x: number, y: number) => void;
    onDragEnd?: () => void;
}
/** Corner-pin / mesh warp editor over the confidence monitor. The forwarded ref reaches
 *  the monitor so the container can push preview frames into it. */
export declare const WarpEditor: import('react').ForwardRefExoticComponent<WarpEditorProps & import('react').RefAttributes<ConfidenceMonitorHandle>>;
