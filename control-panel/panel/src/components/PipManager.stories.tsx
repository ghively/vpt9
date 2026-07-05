import type { Meta, StoryObj } from "@storybook/react";
import { PipManager } from "./PipManager";
import { samplePips, noop } from "./fixtures";

const meta: Meta<typeof PipManager> = {
  title: "Panel/PipManager",
  component: PipManager,
  decorators: [(Story) => <div style={{ width: 388, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PipManager>;

export const Default: Story = {
  args: {
    screenId: "screen-1",
    pips: samplePips,
    onUpdatePip: noop,
    onMovePip: noop,
    onResizePip: noop,
    onRemovePip: noop,
    onAddPip: noop,
    onDragStart: noop,
    onDragEnd: noop,
  },
};
