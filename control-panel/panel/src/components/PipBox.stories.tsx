import type { Meta, StoryObj } from "@storybook/react";
import { PipBox } from "./PipBox";
import { samplePips, noop } from "./fixtures";

const meta: Meta<typeof PipBox> = {
  title: "Panel/PipBox",
  component: PipBox,
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: 16 }}>
        <div className="stage">
          <div className="stage__frame" />
          <Story />
        </div>
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof PipBox>;

export const Default: Story = {
  args: { pip: samplePips[0], onDragStart: noop, onMove: noop, onResize: noop, onDragEnd: noop },
};
