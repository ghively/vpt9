// Sample data for Storybook stories (and design-sync preview capture). Not used by the
// app — purely to render components in isolation.
import type { Layer, Pip, Preset, Screen } from "./types";

export const sampleLayers: Layer[] = [
  {
    id: "layer-1",
    name: "Ambient loop",
    order: 1,
    source: { type: "video", url: "/media/sample.mp4" },
    opacity: 0.7,
    blendMode: "screen",
    mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
  },
  {
    id: "layer-2",
    name: "Starfield",
    order: 2,
    source: { type: "color", color: [0.6, 0.2, 0.9] },
    opacity: 0.33,
    blendMode: "multiply",
    mask: { enabled: true, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
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

export const noop = () => {};
