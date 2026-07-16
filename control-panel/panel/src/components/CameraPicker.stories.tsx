import type { Meta, StoryObj } from "@storybook/react";
import { CameraPicker } from "./CameraPicker";
import { noop } from "./fixtures";

const devices = [
  { deviceId: "cam-a", label: "FaceTime HD Camera" },
  { deviceId: "cam-b", label: "USB Capture HDMI" },
];

const meta: Meta<typeof CameraPicker> = {
  title: "Panel/CameraPicker",
  component: CameraPicker,
  decorators: [(Story) => <div style={{ padding: 16, width: 320 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof CameraPicker>;

export const Selected: Story = {
  args: { deviceId: "cam-b", resolution: { width: 1920, height: 1080 }, devices, onDevice: noop, onResolution: noop },
};
export const NoDeviceChosen: Story = {
  args: { deviceId: undefined, resolution: null, devices, onDevice: noop, onResolution: noop },
};
