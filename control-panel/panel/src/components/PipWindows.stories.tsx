import type { Meta, StoryObj } from "@storybook/react";
import { PipWindows } from "./PipWindows";
import { samplePips, noop } from "./fixtures";

const meta: Meta<typeof PipWindows> = {
  title: "Panel/PipWindows",
  component: PipWindows,
  decorators: [(Story) => <div style={{ width: 388, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PipWindows>;

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
