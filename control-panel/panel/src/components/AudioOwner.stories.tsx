import type { Meta, StoryObj } from "@storybook/react";
import { AudioOwner } from "./AudioOwner";
import { sampleScreens, noop } from "./fixtures";

const meta: Meta<typeof AudioOwner> = { title: "Panel/AudioOwner", component: AudioOwner };
export default meta;
type Story = StoryObj<typeof AudioOwner>;

export const Default: Story = { args: { screens: sampleScreens, ownerId: "screen-1", onSelect: noop } };
