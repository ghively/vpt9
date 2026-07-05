import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = { title: "Primitives/Button", component: Button };
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = { args: { label: "+ Add layer" } };
export const Save: Story = { args: { label: "+ Save current", variant: "save" } };
