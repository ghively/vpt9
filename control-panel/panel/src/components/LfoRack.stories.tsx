import type { Meta, StoryObj } from "@storybook/react";
import { LfoRack } from "./LfoRack";
import { sampleLfos, sampleTargetOptions, noop } from "./fixtures";

const meta: Meta<typeof LfoRack> = {
  title: "Panel/LfoRack",
  component: LfoRack,
  decorators: [(Story) => <div style={{ width: 520 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof LfoRack>;

export const Default: Story = {
  args: {
    lfos: sampleLfos,
    targetOptions: sampleTargetOptions,
    onAdd: noop,
    onUpdate: noop,
    onRemove: noop,
  },
};
