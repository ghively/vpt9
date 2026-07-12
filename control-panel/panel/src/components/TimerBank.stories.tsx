import type { Meta, StoryObj } from "@storybook/react";
import { TimerBank } from "./TimerBank";
import { sampleTimers, samplePresets, noop } from "./fixtures";

const meta: Meta<typeof TimerBank> = {
  title: "Panel/TimerBank",
  component: TimerBank,
  decorators: [(Story) => <div style={{ width: 420 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TimerBank>;

export const Default: Story = {
  args: {
    timers: sampleTimers,
    presets: samplePresets,
    sourcePresets: samplePresets,
    onAdd: noop,
    onUpdate: noop,
    onRemove: noop,
  },
};
