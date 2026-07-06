import type { Meta, StoryObj } from "@storybook/react";
import { TargetPicker } from "./TargetPicker";
import { sampleTargetOptions, noop } from "../fixtures";

const meta: Meta<typeof TargetPicker> = {
  title: "Primitives/TargetPicker",
  component: TargetPicker,
  decorators: [(Story) => <div style={{ width: 320, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TargetPicker>;

export const KnownTarget: Story = {
  args: { value: "layers.layer-1.opacity", options: sampleTargetOptions, onChange: noop },
};

export const Unbound: Story = {
  args: { value: "", options: sampleTargetOptions, onChange: noop },
};

export const CustomPath: Story = {
  args: { value: "pip.pip-1.width", options: sampleTargetOptions, onChange: noop },
};
