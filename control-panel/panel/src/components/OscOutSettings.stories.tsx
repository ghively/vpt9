import type { Meta, StoryObj } from "@storybook/react";
import { OscOutSettings } from "./OscOutSettings";
import { noop } from "./fixtures";

const meta: Meta<typeof OscOutSettings> = {
  title: "Panel/OscOutSettings",
  component: OscOutSettings,
  decorators: [(Story) => <div style={{ padding: 16, width: 320 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof OscOutSettings>;

export const Enabled: Story = {
  args: { enabled: true, host: "192.168.0.50", port: 9000, onUpdate: noop },
};
export const Disabled: Story = {
  args: { enabled: false, host: "127.0.0.1", port: 9000, onUpdate: noop },
};
