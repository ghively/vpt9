// Shared UI types for the presentational components. These mirror the control-plane
// state shape (server/src/state.js) but live here, in the design-sync'd component layer,
// so the components carry their own contract with no dependency on the app/container.

export interface LayerSource {
  type: "video" | "color" | "camera" | "slot";
  url?: string;
  color?: [number, number, number];
  slotId?: string;
}

export interface SourceRef {
  type: "media" | "slot";
  mediaId?: string;
  slotId?: string;
}

export interface SourceBankSlot {
  id: string;
  name: string;
  content:
    | null
    | { type: "media"; mediaId: string }
    | { type: "mix"; a: SourceRef | null; b: SourceRef | null; blendMode: string; mix: number };
}

export type MediaKind = "video" | "gif" | "image";

/** One uploaded library file. Mirrors the server's media entry (server/src/media.js).
 *  `kind` is derived from the extension at upload; `filename` is server-generated. */
export interface MediaItem {
  id: string;
  name: string;
  filename: string;
  kind: MediaKind;
  size: number;
  uploadedAt: string;
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
  /** Non-uniform zoom multipliers applied on top of `zoom` (VPT8's td.rota.jxs
   *  xzoom/yzoom). 1 = off. */
  zoomX: number;
  zoomY: number;
  /** Zoom/rotate pivot, in uv space (VPT8's xanchor/yanchor). (0.5, 0.5) = center. */
  anchorX: number;
  anchorY: number;
  /** Rotation about (anchorX, anchorY), in degrees (VPT8's `rota`). 0 = off. */
  rotationDeg: number;
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
  warp: Warp;
  transport: Transport;
  sourceMode: "single" | "playlist";
  playlist: Playlist;
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

/** Per-layer clip transport (play/rate/loop/pan/vol) — mirrors
 *  `server/src/state.js`'s `defaultTransport()` shape exactly. */
export interface Transport {
  playing: boolean;
  rate: number;
  loopIn: number | null;
  loopOut: number | null;
  loopMode: "off" | "loop" | "palindrome";
  pan: number;
  vol: number;
}

/** One playlist entry: a source reference (matches `SourceRef`'s media/slot shape) plus
 *  an optional fixed duration in seconds — set for stills (auto-advance timer), absent
 *  for video (advances on the native `ended` event instead; see
 *  render-client/src/layers.js's `shouldLoop()`). */
export interface PlaylistItem {
  ref: SourceRef | null;
  duration?: number;
}

/** Per-layer clip queue — mirrors `server/src/state.js`'s `defaultTransport`-adjacent
 *  `playlist: { items: [], cursor: -1 }` layer default. `cursor` indexes the item
 *  currently playing (-1 = none); advanced server-side by `automation.js`'s
 *  `tickPlaylists` (stills) or by the render-client's `ended`-event relay (video). */
export interface Playlist {
  items: PlaylistItem[];
  cursor: number;
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

/** One selectable modulation/binding target — a numeric dotted state path with a
 *  human-readable label, optgrouped (usually per layer) in the TargetPicker. */
export interface TargetOption {
  value: string;
  label: string;
  group: string;
}

export const BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "difference", "add",
  "average", "brightlight", "burn", "darken", "dodge", "exclude",
  "freeze", "glow", "hardlight", "heat", "inverse", "lighten",
  "lumablend", "negate", "reflect", "softlight", "stamp", "subtractive",
] as const;
