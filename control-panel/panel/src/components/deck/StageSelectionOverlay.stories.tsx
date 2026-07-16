import type { Meta, StoryObj } from "@storybook/react";
import { StageSelectionOverlay } from "./StageSelectionOverlay";
import { noop, sampleLayers, sampleScreens } from "../fixtures";

// The overlay renders absolutely-positioned warp/mask handles, so it needs a sized,
// position:relative stage box under it (the real app is the live-preview Stage).
const stage = (Story: () => JSX.Element) => (
  <div style={{ position: "relative", width: 480, height: 270, background: "#111", margin: 16 }}>
    <Story />
  </div>
);

const meta: Meta<typeof StageSelectionOverlay> = {
  title: "Panel/StageSelectionOverlay",
  component: StageSelectionOverlay,
  decorators: [stage],
};
export default meta;
type Story = StoryObj<typeof StageSelectionOverlay>;

export const LayerWarp: Story = {
  args: { editTarget: "layer", layer: sampleLayers[0], mode: "warp", onWarpCorner: noop, onMask: noop, onDragStart: noop, onDragEnd: noop },
};
export const LayerMask: Story = {
  args: { editTarget: "layer", layer: { ...sampleLayers[0], mask: { ...sampleLayers[0].mask, enabled: true } }, mode: "mask", onWarpCorner: noop, onMask: noop, onDragStart: noop, onDragEnd: noop },
};
export const ScreenWarp: Story = {
  args: { editTarget: "screen", screen: sampleScreens[0], onScreenWarpCorner: noop, onDragStart: noop, onDragEnd: noop },
};
