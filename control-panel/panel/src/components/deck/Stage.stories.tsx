import type { Meta, StoryObj } from "@storybook/react";
import { noop } from "../fixtures";
import { Stage } from "./Stage";

// A tiny inline SVG data-URL stands in for a render-client preview JPEG frame — avoids
// checking in a binary fixture just for the story.
const sampleFrameSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
    <defs>
      <radialGradient id="g" cx="35%" cy="40%" r="75%">
        <stop offset="0%" stop-color="#3a1e6e"/>
        <stop offset="100%" stop-color="#0b0c0e"/>
      </radialGradient>
    </defs>
    <rect width="320" height="180" fill="url(#g)"/>
    <circle cx="230" cy="130" r="70" fill="#0d3d5c" opacity="0.55"/>
  </svg>
`;
const sampleFrame = `data:image/svg+xml;utf8,${encodeURIComponent(sampleFrameSvg)}`;

const meta: Meta<typeof Stage> = {
  title: "Panel/Stage",
  component: Stage,
  decorators: [(Story) => <div style={{ width: 960 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Stage>;

export const Live: Story = {
  args: {
    screenId: "screen-1",
    frame: sampleFrame,
    width: 1280,
    height: 720,
    overlay: null,
    onBackgroundPointerDown: noop,
  },
};

export const NoSignal: Story = {
  args: {
    screenId: "screen-1",
    frame: null,
    width: 1280,
    height: 720,
    overlay: null,
    onBackgroundPointerDown: noop,
  },
};
