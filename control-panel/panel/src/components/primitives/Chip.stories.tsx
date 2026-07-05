import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "./Chip";

const meta: Meta<typeof Chip> = { title: "Primitives/Chip", component: Chip };
export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = { args: { label: "Screen 1", active: false } };
export const Active: Story = { args: { label: "Screen 1", active: true } };
