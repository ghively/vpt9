export interface WarpHandleProps {
    /** Normalised 0–1 position on the stage. */
    x: number;
    y: number;
    /** Initial active (glowing) state — the live drag also toggles this imperatively. */
    active?: boolean;
    onDragStart?: () => void;
    onDragTo?: (x: number, y: number) => void;
    onDragEnd?: () => void;
}
/** A tungsten registration reticle. During a drag it positions itself imperatively
 *  (mirroring the vanilla panel) so the container can suppress re-renders mid-gesture
 *  without the handle appearing to freeze. */
export declare function WarpHandle({ x, y, active, onDragStart, onDragTo, onDragEnd }: WarpHandleProps): import("react").JSX.Element;
