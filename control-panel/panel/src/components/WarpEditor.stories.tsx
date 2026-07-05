import type { Meta, StoryObj } from "@storybook/react";
import { WarpEditor } from "./WarpEditor";
import { sampleScreens, noop } from "./fixtures";

const meta: Meta<typeof WarpEditor> = {
  title: "Panel/WarpEditor",
  component: WarpEditor,
  decorators: [(Story) => <div style={{ width: 388, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof WarpEditor>;

export const CornerPin: Story = {
  args: {
    screen: sampleScreens[0],
    screens: sampleScreens,
    onSelectScreen: noop,
    onSetMode: noop,
    onReset: noop,
    onMovePoint: noop,
    onDragStart: noop,
    onDragEnd: noop,
  },
};
