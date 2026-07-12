// Shared UI types for the presentational components. These mirror the control-plane
// state shape (server/src/state.js) but live here, in the design-sync'd component layer,
// so the components carry their own contract with no dependency on the app/container.

export interface LayerSource {
  type: "video" | "color" | "camera" | "slot";
  url?: string;
  color?: [number, number, number];
  slotId?: string;
  /** Camera device id + capture resolution (task A14) — only meaningful when
   *  `type === "camera"`. Absent = system default camera at its default resolution. */
  deviceId?: string;
  resolution?: CameraResolution;
}

/** A camera resolution constraint (task A14). Fed to `getUserMedia`'s width/height
 *  `ideal` constraints; absent means the browser's default capture resolution. */
export interface CameraResolution {
  width: number;
  height: number;
}

/** A video-input device offered in the camera pickers (task A14) — the subset of a
 *  `MediaDeviceInfo` the panel shows. `label` is blank until camera permission is granted. */
export interface CameraDevice {
  deviceId: string;
  label: string;
}

/** A reference to a source. Used by a mix slot's A/B inputs, a playlist item, and a
 *  mask matte. `media`/`slot` are the original two; `camera`/`color` (task A13, VPT8's
 *  cam1/2 + solid1/2 as shared-bank / mix inputs) are terminal — a mix A/B may be any of
 *  media/slot/camera/color but never itself a mix, keeping the no-nested-mix guard sound. */
export interface SourceRef {
  type: "media" | "slot" | "camera" | "color";
  mediaId?: string;
  slotId?: string;
  /** Camera device id (task A14). Absent = system default camera. */
  deviceId?: string;
  /** Camera capture resolution (task A14). Absent = browser default. */
  resolution?: CameraResolution;
  /** Solid-color fill, rgb 0..1 (task A13). */
  color?: [number, number, number];
}

export interface SourceBankSlot {
  id: string;
  name: string;
  content:
    | null
    | { type: "media"; mediaId: string }
    | { type: "camera"; deviceId?: string; resolution?: CameraResolution }
    | { type: "color"; color: [number, number, number] }
    | { type: "mix"; a: SourceRef | null; b: SourceRef | null; blendMode: string; mix: number };
  /** Per-slot clip transport (task A9). Because many layers can point at one slot, its
   *  play/rate/loop/scrub state lives on the slot, not the consuming layer. Optional so
   *  the panel typechecks against state saved before A9 (the server backfills it). */
  transport?: Transport;
}

/** One saved snapshot of all 8 source-bank slots (task A12 — VPT8's `pattrstorage sources`
 *  bank with `sourcenext`/`sourceprev`). Recalling replaces the live `sourceBank`. */
export interface SourceBankPreset {
  id: string;
  name: string;
  slots: SourceBankSlot[];
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
  /** Per-source render downscale (task A15 — VPT8's `p adapt`): the layer's own decode/
   *  upload is reduced by this integer divisor (1 = full, 2 = 1/2, 4 = 1/4, 8 = 1/8),
   *  trading resolution for GPU/decode headroom. Optional so state saved before A15
   *  typechecks (the server backfills 1). Only applies to a layer's DIRECT video/image/
   *  camera source, not a shared-slot source (whose texture is shared across layers). */
  downscale?: number;
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
 *  goto = jump to cue index (loops), source = recall a source-bank snapshot (A16),
 *  paramFade = tween one dotted state path (A16), osc = send a raw OSC message (A17). */
export interface Cue {
  id: string;
  label: string;
  type: "recall" | "fade" | "wait" | "goto" | "source" | "paramFade" | "osc";
  /** recall/fade: scene preset id. source: source-bank preset id (A16). */
  presetId?: string;
  seconds?: number;
  target?: number;
  /** A18: when true this cue chains to the next automatically once it completes; when
   *  false (default, VPT8's behavior) the interpreter holds here until an explicit GO. */
  autoContinue?: boolean;
  /** A16 paramFade: tween the dotted state `path` from `from` → `to` over `seconds`. */
  path?: string;
  from?: number;
  to?: number;
  /** A17 osc: the OSC message this cue emits out the OSC-output socket. */
  address?: string;
  args?: Array<number | string>;
}

/** A wall-clock trigger (VPT8's alarm-clock timer bank): fires once per matching
 *  HH:MM minute while enabled. */
export interface Timer {
  id: string;
  enabled: boolean;
  time: string;
  /** cueGo = fire the cue list; recall = cut to a scene preset; source = recall a
   *  source-bank snapshot (A21c). */
  action: "cueGo" | "recall" | "source";
  /** Target id: a scene preset id when action === "recall", or a source-bank preset id
   *  when action === "source" (reused for both, mirroring how the `source` cue stores its
   *  target — see Cue.presetId). Unused for "cueGo". */
  presetId?: string;
}

export interface Automation {
  cues: Cue[];
  cursor: number;
  running: boolean;
  timers: Record<string, Timer>;
}

export type LfoWave = "sine" | "triangle" | "square" | "saw" | "random";

/** Mixer blend of two oscillators' 0..1 outputs (A19). */
export type LfoBlend = "add" | "mult" | "xfade";

/** One slot of the modulation rack. An `osc` slot (default) oscillates a numeric state path
 *  between min/max; a `mixer` slot (A19) blends two other oscillators' normalized outputs. */
export interface Lfo {
  id: string;
  enabled: boolean;
  wave: LfoWave;
  rateHz: number;
  min: number;
  max: number;
  target: string;
  /** A19: "osc" (default, absent) = a plain oscillator; "mixer" = blend aId & bId. */
  kind?: "osc" | "mixer";
  /** mixer inputs — ids of two `osc`-kind LFOs (referencing a mixer reads 0). */
  aId?: string | null;
  bId?: string | null;
  blend?: LfoBlend;
  /** xfade amount 0..1 (0 = all A, 1 = all B). Only used when blend === "xfade". */
  mix?: number;
  /** Phase offset 0..1, shifts an oscillator along its cycle. */
  phase?: number;
  /** Inverts the (normalized) output: value → 1 - value. */
  waveInvert?: boolean;
  /** Tempo-sync division ("1/4", "1/8", …). When set, the rate derives from the global
   *  tempoBpm and overrides rateHz; null/absent = free-running at rateHz. */
  syncNote?: string | null;
}

/** OSC OUTPUT / state-mirroring config (A17). When `enabled`, scalar leaf changes are
 *  mirrored out as OSC messages to host:port; an `osc` cue always sends to this host:port. */
export interface OscOut {
  enabled: boolean;
  host: string;
  port: number;
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
