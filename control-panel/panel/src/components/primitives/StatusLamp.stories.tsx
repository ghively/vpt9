import type { Meta, StoryObj } from "@storybook/react";
import { StatusLamp } from "./StatusLamp";

const meta: Meta<typeof StatusLamp> = { title: "Primitives/StatusLamp", component: StatusLamp };
export default meta;
type Story = StoryObj<typeof StatusLamp>;

export const Connected: Story = { args: { state: "connected", label: "connected · ws://localhost:8080" } };
export const Connecting: Story = { args: { state: "connecting", label: "connecting…" } };
export const Disconnected: Story = { args: { state: "disconnected", label: "disconnected · ws://localhost:8080" } };
