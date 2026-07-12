import type { Meta, StoryObj } from "@storybook/react";
import { sampleLayers, sampleMedia, noop } from "../fixtures";
import { Inspector } from "./Inspector";

const meta: Meta<typeof Inspector> = {
  title: "Panel/Inspector",
  component: Inspector,
  decorators: [(Story) => <div style={{ width: 288 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Inspector>;

const layerWithMesh = {
  ...sampleLayers[0],
  warp: {
    mode: "mesh" as const,
    corners: sampleLayers[0].warp.corners,
    mesh: {
      size: 4,
      points: Array.from({ length: 16 }, (_, i) => ({ x: (i % 4) / 3, y: Math.floor(i / 4) / 3 })),
    },
  },
};

const baseArgs = {
  media: sampleMedia,
  onModeChange: noop,
  onUpdate: noop,
  onSetSourceMode: noop,
  onSetPlaylist: noop,
  onApplyCornerPreset: noop,
  onSetWarpMode: noop,
  onSetMeshSize: noop,
  onResetWarp: noop,
};

export const Warp: Story = {
  args: { ...baseArgs, layer: sampleLayers[0], mode: "warp" },
};

export const WarpMesh: Story = {
  args: { ...baseArgs, layer: layerWithMesh, mode: "warp" },
};

export const Mask: Story = {
  args: { ...baseArgs, layer: sampleLayers[1], mode: "mask" },
};

export const Fx: Story = {
  args: { ...baseArgs, layer: sampleLayers[0], mode: "fx" },
};

export const Empty: Story = {
  args: { ...baseArgs, layer: null, mode: "warp" },
};
