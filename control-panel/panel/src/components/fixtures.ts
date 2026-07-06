// Sample data for Storybook stories (and design-sync preview capture). Not used by the
// app — purely to render components in isolation.
import type { Cue, Fx, Layer, Lfo, MidiMapping, Pip, Preset, Screen, TargetOption, Timer } from "./types";

export const defaultFx: Fx = {
  flipH: false,
  flipV: false,
  tileX: 1,
  tileY: 1,
  zoom: 1,
  panX: 0,
  panY: 0,
  blur: 0,
  motionBlur: 0,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  edgeBlend: { left: 0, right: 0, top: 0, bottom: 0, gamma: 2 },
};

export const sampleLayers: Layer[] = [
  {
    id: "layer-1",
    name: "Ambient loop",
    order: 1,
    source: { type: "video", url: "/media/sample.mp4" },
    opacity: 0.7,
    blendMode: "screen",
    mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
    fx: { ...defaultFx, zoom: 1.4, blur: 0.2, edgeBlend: { ...defaultFx.edgeBlend, right: 0.15 } },
  },
  {
    id: "layer-2",
    name: "Starfield",
    order: 2,
    source: { type: "color", color: [0.6, 0.2, 0.9] },
    opacity: 0.33,
    blendMode: "multiply",
    mask: { enabled: true, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
    fx: defaultFx,
  },
];

const identityCorners = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

export const sampleScreens: Screen[] = [
  { id: "screen-1", name: "Screen 1", warp: { mode: "corner", corners: identityCorners, mesh: { size: 4, points: [] } } },
  { id: "screen-2", name: "Screen 2", warp: { mode: "corner", corners: identityCorners, mesh: { size: 4, points: [] } } },
];

export const samplePips: Pip[] = [
  {
    id: "pip-1",
    screenId: "screen-1",
    title: "Test Cast",
    videoId: "dQw4w9WgXcQ",
    x: 0.55,
    y: 0.12,
    width: 0.36,
    height: 0.2,
    visible: true,
  },
];

export const samplePresets: Preset[] = [
  { id: "preset-1", name: "Evening chill" },
  { id: "preset-2", name: "Peak" },
];

export const sampleCues: Cue[] = [
  { id: "cue-1", label: "House open", type: "recall", presetId: "preset-1" },
  { id: "cue-2", label: "Hold", type: "wait", seconds: 30 },
  { id: "cue-3", label: "Build to peak", type: "fade", presetId: "preset-2", seconds: 12 },
  { id: "cue-4", label: "Loop", type: "goto", target: 0 },
];

export const sampleTimers: Timer[] = [
  { id: "timer-1", enabled: true, time: "18:30", action: "cueGo" },
  { id: "timer-2", enabled: false, time: "23:00", action: "recall", presetId: "preset-1" },
];

export const sampleLfos: Lfo[] = [
  { id: "lfo-1", enabled: true, wave: "sine", rateHz: 0.25, min: 0.4, max: 0.9, target: "layers.layer-1.opacity" },
  { id: "lfo-2", enabled: false, wave: "random", rateHz: 1, min: 0, max: 1, target: "layers.layer-2.fx.zoom" },
];

export const sampleMidiMappings: MidiMapping[] = [
  { id: "map-1", channel: 0, controller: 21, target: "layers.layer-1.opacity", min: 0, max: 1 },
  { id: "map-2", channel: 0, controller: 22, target: "layers.layer-1.fx.blur", min: 0, max: 1 },
];

export const sampleTargetOptions: TargetOption[] = [
  { value: "master", label: "master dim", group: "Global" },
  { value: "layers.layer-1.opacity", label: "opacity", group: "Ambient loop" },
  { value: "layers.layer-1.fx.zoom", label: "zoom", group: "Ambient loop" },
  { value: "layers.layer-1.fx.blur", label: "blur", group: "Ambient loop" },
  { value: "layers.layer-2.opacity", label: "opacity", group: "Starfield" },
  { value: "layers.layer-2.fx.zoom", label: "zoom", group: "Starfield" },
];

export const noop = () => {};
