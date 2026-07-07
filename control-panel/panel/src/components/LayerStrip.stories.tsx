import type { Meta, StoryObj } from "@storybook/react";
import { LayerStrip } from "./LayerStrip";
import { sampleLayers, sampleMedia, noop } from "./fixtures";

const meta: Meta<typeof LayerStrip> = {
  title: "Panel/LayerStrip",
  component: LayerStrip,
  decorators: [(Story) => <div style={{ width: 960, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof LayerStrip>;

export const Video: Story = {
  args: { layer: sampleLayers[0], media: sampleMedia, neighbors: { above: true, below: false }, onUpdate: noop, onMove: noop, onRemove: noop },
};
export const SolidColor: Story = {
  args: { layer: sampleLayers[1], neighbors: { above: false, below: true }, onUpdate: noop, onMove: noop, onRemove: noop },
};
export const Narrow: Story = {
  decorators: [(Story) => <div style={{ width: 360, padding: 8 }}><Story /></div>],
  args: { layer: sampleLayers[0], media: sampleMedia, neighbors: { above: true, below: false }, onUpdate: noop, onMove: noop, onRemove: noop },
};
