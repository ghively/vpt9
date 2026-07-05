import type { Meta, StoryObj } from "@storybook/react";
import { ChannelRack } from "./ChannelRack";
import { sampleLayers, noop } from "./fixtures";

const meta: Meta<typeof ChannelRack> = {
  title: "Panel/ChannelRack",
  component: ChannelRack,
  decorators: [(Story) => <div style={{ width: 960 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ChannelRack>;

export const Default: Story = {
  args: {
    layers: sampleLayers,
    onUpdateLayer: noop,
    onMoveLayer: noop,
    onRemoveLayer: noop,
    onAddLayer: noop,
  },
};
