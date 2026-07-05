import type { Meta, StoryObj } from "@storybook/react";
import { TextField } from "./TextField";

const meta: Meta<typeof TextField> = {
  title: "Primitives/TextField",
  component: TextField,
  decorators: [(Story) => <div style={{ width: 220 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof TextField>;

export const WithValue: Story = { args: { value: "Ambient loop" } };
export const Empty: Story = { args: { value: "", placeholder: "/media/video.mp4" } };
