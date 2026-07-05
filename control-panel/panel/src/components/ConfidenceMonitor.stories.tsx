import type { Meta, StoryObj } from "@storybook/react";
import { ConfidenceMonitor } from "./ConfidenceMonitor";

const meta: Meta<typeof ConfidenceMonitor> = {
  title: "Panel/ConfidenceMonitor",
  component: ConfidenceMonitor,
  decorators: [(Story) => <div style={{ width: 380, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ConfidenceMonitor>;

// The signature element: recessed well, registration grid, cyan corner crop-marks, and
// edge-blend-feathered preview. Empty here (no live frame) to show the calibration surface.
export const Empty: Story = {};
