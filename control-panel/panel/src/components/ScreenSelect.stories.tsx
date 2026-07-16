import type { Meta, StoryObj } from "@storybook/react";
import { ScreenSelect } from "./ScreenSelect";
import { noop, sampleScreens } from "./fixtures";

const meta: Meta<typeof ScreenSelect> = {
  title: "Panel/ScreenSelect",
  component: ScreenSelect,
  decorators: [(Story) => <div style={{ padding: 16, width: 360 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ScreenSelect>;

export const TwoScreens: Story = {
  args: { screens: sampleScreens, selectedId: "screen-1", onSelect: noop, onAdd: noop },
};
export const NoneSelected: Story = {
  args: { screens: sampleScreens, selectedId: null, onSelect: noop, onAdd: noop },
};
