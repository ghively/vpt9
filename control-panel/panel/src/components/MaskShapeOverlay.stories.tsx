import type { Meta, StoryObj } from "@storybook/react";
import { MaskShapeOverlay } from "./MaskShapeOverlay";
import { noop } from "./fixtures";

const meta: Meta<typeof MaskShapeOverlay> = {
  title: "Panel/MaskShapeOverlay",
  component: MaskShapeOverlay,
  decorators: [
    (Story) => (
      <div className="stage" style={{ position: "relative", width: 480, aspectRatio: "16 / 9" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof MaskShapeOverlay>;

export const Ellipse: Story = {
  args: { mask: { enabled: true, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.3, ry: 0.25, feather: 0.08 }, onChange: noop },
};
export const Rect: Story = {
  args: { mask: { enabled: true, shape: "rect", cx: 0.4, cy: 0.45, rx: 0.25, ry: 0.3, feather: 0.05 }, onChange: noop },
};
