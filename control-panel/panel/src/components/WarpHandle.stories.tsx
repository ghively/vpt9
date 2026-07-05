import type { Meta, StoryObj } from "@storybook/react";
import { WarpHandle } from "./WarpHandle";

const meta: Meta<typeof WarpHandle> = {
  title: "Panel/WarpHandle",
  component: WarpHandle,
  // A handle is absolutely positioned on a .stage; give it one to sit on.
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
type Story = StoryObj<typeof WarpHandle>;

export const Idle: Story = { args: { x: 0.35, y: 0.4 } };
export const Active: Story = { args: { x: 0.65, y: 0.6, active: true } };
