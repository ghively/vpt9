import type { Meta, StoryObj } from "@storybook/react";
import { TransportControls } from "./TransportControls";
import { noop, defaultTransport } from "./fixtures";

const meta: Meta<typeof TransportControls> = {
  title: "Panel/TransportControls",
  component: TransportControls,
  decorators: [(Story) => <div className="fx-drawer" style={{ padding: 16, width: 320 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TransportControls>;

export const Playing: Story = {
  args: { transport: { ...defaultTransport, playing: true }, onUpdate: noop, position: 5, duration: 10 },
};
export const Paused: Story = {
  args: { transport: { ...defaultTransport, playing: false }, onUpdate: noop },
};
export const Palindrome: Story = {
  args: { transport: { ...defaultTransport, loopMode: "palindrome", rate: 1.5, loopIn: 2, loopOut: 8 }, onUpdate: noop, position: 3, duration: 10 },
};
