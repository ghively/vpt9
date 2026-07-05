import type { Meta, StoryObj } from "@storybook/react";
import { ToggleSquare } from "./ToggleSquare";

const meta: Meta<typeof ToggleSquare> = { title: "Primitives/ToggleSquare", component: ToggleSquare };
export default meta;
type Story = StoryObj<typeof ToggleSquare>;

export const Off: Story = { args: { label: "M", active: false } };
export const On: Story = { args: { label: "M", active: true } };
export const Live: Story = { args: { label: "R", active: true, tone: "live" } };
export const Disabled: Story = { args: { label: "▲", disabled: true } };
