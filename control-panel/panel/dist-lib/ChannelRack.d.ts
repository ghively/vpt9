import { Layer } from './types';
export interface ChannelRackProps {
    layers: Layer[];
    onUpdateLayer?: (id: string, field: string, value: unknown) => void;
    onMoveLayer?: (id: string, dir: "up" | "down") => void;
    onRemoveLayer?: (id: string) => void;
    onAddLayer?: () => void;
}
/** The full layer rack: strips shown top-of-stack first, plus an add button. */
export declare function ChannelRack({ layers, onUpdateLayer, onMoveLayer, onRemoveLayer, onAddLayer, }: ChannelRackProps): import("react").JSX.Element;
