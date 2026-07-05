import { Pip } from './types';
export interface PipBoxProps {
    pip: Pip;
    onDragStart?: () => void;
    onMove?: (x: number, y: number) => void;
    onResize?: (width: number, height: number) => void;
    onDragEnd?: () => void;
}
/** A movable/resizable cyan PiP window overlay on the confidence monitor. Like the warp
 *  handles, it drags itself imperatively so re-renders can be suppressed mid-gesture. */
export declare function PipBox({ pip, onDragStart, onMove, onResize, onDragEnd }: PipBoxProps): import("react").JSX.Element;
