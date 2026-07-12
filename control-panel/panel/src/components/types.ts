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
  /** Per-slot clip transport (task A9). Because many layers can point at one slot, its
   *  play/rate/loop/scrub state lives on the slot, not the consuming layer. Optional so
   *  the panel typechecks against state saved before A9 (the server backfills it). */
  transport?: Transport;
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
  shape: "rect" | "ellipse" | "polygon";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  feather: number;
  /** Polygon vertices, normalized 0..1 in content-UV space. Only meaningful when
   *  `shape === "polygon"` — vertex order/winding doesn't matter (the render-client
   *  does a standard even-odd ray-cast point-in-polygon test). Absent/empty for
   *  rect/ellipse masks. Edited on the stage by the polygon vertex editor (task A4b);
   *  this task (A4a) only wires the shape + shader + inspector invert control. */
  points?: Point[];
  /** Flips which side of the mask shape is visible for ALL shapes: false (default) =
   *  inside visible, true = outside visible. Mirrors VPT8's `layermask.maxpat`
   *  `pattr inv`. */
  invert?: boolean;
  /** Optional luminance/video matte (VPT8's `layermask.maxpat` `pattr source` +
   *  `cc.alphaglue.jxs` `lum2alpha`, task A5). When set, the mask alpha is driven by this
   *  source's luminance instead of the geometric shape (still honoring `enabled`/`invert`);
   *  `null`/absent = geometric mask only. Same `{type,mediaId/slotId}` shape as `SourceRef`. */
  source?: SourceRef | null;
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
  /** Fades the CENTER instead of the edges (VPT8's `tr.edgeblend01.jxs`:
   *  `mix(alph, 1.-alph, invert)`). false (default) = normal edge feather. */
  invert: boolean;
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
  /** Motion-blur render mode: "trail" (temporal feedback, VPT8's default persistence
   *  smear) or "slide" (a directional multi-tap smear along `motionBlurAngle`, VPT8's
   *  alternate directional-slide motion blur). Default "trail". */
  motionBlurMode: "trail" | "slide";
  /** Direction of the "slide" smear, in degrees. Only meaningful when
   *  `motionBlurMode === "slide"`. Default 0. */
  motionBlurAngle: number;
  brightness: number;
  contrast: number;
  saturation: number;
  edgeBlend: EdgeBlend;
  /** Section-level stage bypass — decouples "toggle a stage off" from "lose its preset
   *  value" (VPT8's per-stage `pattr on`). All default true (stage runs, same as before
   *  this field existed). `color` gates blur + motion-blur/trail + brcosa together;
   *  `transform` gates flip/tile/zoom/pan/rotation; mask keeps its own `mask.enabled`. */
  enabled: { transform: boolean; color: boolean; edgeBlend: boolean };
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

/** Per-layer / per-slot clip transport (play/rate/loop/pan/vol/scrub) — mirrors
 *  `server/src/state.js`'s `defaultTransport()` shape exactly. */
export interface Transport {
  playing: boolean;
  rate: number;
  loopIn: number | null;
  loopOut: number | null;
  /** Native-loop policy (VPT8 parity, task A10): "off"/"once" play through once and stop;
   *  "loop"/"palindrome" native-loop (palindrome ping-pongs within [loopIn, loopOut]). */
  loopMode: "off" | "loop" | "palindrome" | "once";
  pan: number;
  vol: number;
  /** Scrub request (task A11): a 0..1 fraction of the clip's duration. Writing a NEW value
   *  makes the render-client seek to `fraction * duration` once; it isn't cleared back to
   *  null (each client tracks the last fraction it applied), so re-seeking the exact same
   *  fraction is a no-op. null = no pending seek. Duration isn't in shared state, so the
   *  scrub is normalized rather than in seconds. */
  seek?: number | null;
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
