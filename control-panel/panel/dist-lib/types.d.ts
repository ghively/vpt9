export interface LayerSource {
    type: "video" | "color";
    url?: string;
    color?: [number, number, number];
}
export interface Mask {
    enabled: boolean;
    shape: "rect" | "ellipse";
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    feather: number;
}
export interface Layer {
    id: string;
    name: string;
    order: number;
    source: LayerSource;
    opacity: number;
    blendMode: string;
    mask: Mask;
}
export interface Point {
    x: number;
    y: number;
}
export interface Warp {
    mode: "corner" | "mesh";
    corners: Point[];
    mesh: {
        size: number;
        points: Point[];
    };
}
export interface Screen {
    id: string;
    name: string;
    warp: Warp;
}
export interface Pip {
    id: string;
    screenId: string;
    title: string;
    videoId: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
}
export interface Preset {
    id: string;
    name: string;
}
export type ConnectionState = "connected" | "connecting" | "disconnected" | "error";
export declare const BLEND_MODES: readonly ["normal", "multiply", "screen", "overlay", "difference", "add"];
