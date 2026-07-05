import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = { title: "Primitives/Select", component: Select };
export default meta;
type Story = StoryObj<typeof Select>;

export const BlendMode: Story = {
  args: {
    value: "screen",
    options: [
      { value: "normal", label: "Normal" },
      { value: "multiply", label: "Multiply" },
      { value: "screen", label: "Screen" },
    ],
  },
};
