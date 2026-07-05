import type { Meta, StoryObj } from "@storybook/react";
import { Fader } from "./Fader";

const meta: Meta<typeof Fader> = {
  title: "Primitives/Fader",
  component: Fader,
  decorators: [(Story) => <div style={{ width: 200 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Fader>;

export const Half: Story = { args: { value: 0.5 } };
export const Full: Story = { args: { value: 1 } };
