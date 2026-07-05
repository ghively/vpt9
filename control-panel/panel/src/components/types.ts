// Shared UI types for the presentational components. These mirror the control-plane
// state shape (server/src/state.js) but live here, in the design-sync'd component layer,
// so the components carry their own contract with no dependency on the app/container.

export interface LayerSource {
  type: "video" | "color" | "camera";
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

/** Per-layer effects chain — mirrors vlayer.maxpat's stage order (flip → tile → zoom/pan
 *  → brcosa/edge-blend → blur → motion-blur). Leaves are flat so LFO/MIDI/OSC targets
 *  are simple dotted paths like "layers.layer-1.fx.zoom". */
export interface EdgeBlend {
  left: number;
  right: number;
  top: number;
  bottom: number;
  gamma: number;
}

export interface Fx {
  flipH: boolean;
  flipV: boolean;
  tileX: number;
  tileY: number;
  zoom: number;
  panX: number;
  panY: number;
  blur: number;
  motionBlur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  edgeBlend: EdgeBlend;
}

export interface Layer {
  id: string;
  name: string;
  order: number;
  source: LayerSource;
  opacity: number;
  blendMode: string;
  mask: Mask;
  fx: Fx;
}

export interface Point {
  x: number;
  y: number;
}

export interface Warp {
  mode: "corner" | "mesh";
  corners: Point[];
  mesh: { size: number; points: Point[] };
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

/** One cue-list step — the modern equivalent of VPT8's C/F/D/L letter codes:
 *  recall = cut to preset, fade = interpolate to preset over seconds, wait = delay,
 *  goto = jump to cue index (loops). */
export interface Cue {
  id: string;
  label: string;
  type: "recall" | "fade" | "wait" | "goto";
  presetId?: string;
  seconds?: number;
  target?: number;
}

/** A wall-clock trigger (VPT8's alarm-clock timer bank): fires once per matching
 *  HH:MM minute while enabled. */
export interface Timer {
  id: string;
  enabled: boolean;
  time: string;
  action: "cueGo" | "recall";
  presetId?: string;
}

export interface Automation {
  cues: Cue[];
  cursor: number;
  running: boolean;
  timers: Record<string, Timer>;
}

export type LfoWave = "sine" | "triangle" | "square" | "saw" | "random";

/** One slot of the modulation rack: oscillates any numeric state path between min/max. */
export interface Lfo {
  id: string;
  enabled: boolean;
  wave: LfoWave;
  rateHz: number;
  min: number;
  max: number;
  target: string;
}

/** A WebMIDI CC binding: controller value 0–127 scales to [min,max] on the target path. */
export interface MidiMapping {
  id: string;
  channel: number;
  controller: number;
  target: string;
  min: number;
  max: number;
}

export type ConnectionState = "connected" | "connecting" | "disconnected" | "error";

export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "difference",
  "add",
] as const;
