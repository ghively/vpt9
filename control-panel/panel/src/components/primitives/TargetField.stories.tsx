import type { Meta, StoryObj } from "@storybook/react";
import { TargetField } from "./TargetField";
import { noop, sampleTargetOptions } from "../fixtures";

const meta: Meta<typeof TargetField> = {
  title: "Primitives/TargetField",
  component: TargetField,
  decorators: [(Story) => <div style={{ padding: 16, width: 320 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TargetField>;

export const WithOptions: Story = {
  args: { value: "layers.layer-1.opacity", targetOptions: sampleTargetOptions, onChange: noop },
};
export const FreeText: Story = {
  args: { value: "", placeholder: "layers.layer-1.opacity", onChange: noop },
};
