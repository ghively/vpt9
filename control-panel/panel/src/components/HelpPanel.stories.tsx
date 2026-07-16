import type { Meta, StoryObj } from "@storybook/react";
import { HelpPanel } from "./HelpPanel";
import { noop } from "./fixtures";

const meta: Meta<typeof HelpPanel> = {
  title: "Panel/HelpPanel",
  component: HelpPanel,
  decorators: [(Story) => <div style={{ padding: 16, maxWidth: 520 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof HelpPanel>;

export const Default: Story = { args: { onClose: noop } };
