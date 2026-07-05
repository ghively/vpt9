import type { Meta, StoryObj } from "@storybook/react";
import { CueList } from "./CueList";
import { sampleCues, samplePresets, noop } from "./fixtures";

const meta: Meta<typeof CueList> = {
  title: "Panel/CueList",
  component: CueList,
  decorators: [(Story) => <div style={{ width: 520 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof CueList>;

export const Default: Story = {
  args: {
    cues: sampleCues,
    cursor: 2,
    running: true,
    presets: samplePresets,
    onGo: noop,
    onStop: noop,
    onJump: noop,
    onSetCues: noop,
  },
};

export const Empty: Story = {
  args: {
    cues: [],
    cursor: -1,
    running: false,
    presets: samplePresets,
    onGo: noop,
    onStop: noop,
    onJump: noop,
    onSetCues: noop,
  },
};
