import { Layer } from './types';
export interface LayerNeighbors {
    /** Whether a move toward the front / back of the stack is possible. */
    above: boolean;
    below: boolean;
}
export interface LayerStripProps {
    layer: Layer;
    neighbors: LayerNeighbors;
    onUpdate?: (field: string, value: unknown) => void;
    onMove?: (dir: "up" | "down") => void;
    onRemove?: () => void;
}
/** One layer as a mixer channel strip: index, reorder, name, source, blend, opacity,
 *  mask toggles, remove. */
export declare function LayerStrip({ layer, neighbors, onUpdate, onMove, onRemove }: LayerStripProps): import("react").JSX.Element;
