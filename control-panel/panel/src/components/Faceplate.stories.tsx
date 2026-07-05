import type { Meta, StoryObj } from "@storybook/react";
import { Faceplate } from "./Faceplate";
import { AudioOwner } from "./AudioOwner";
import { StatusLamp } from "./primitives/StatusLamp";
import { sampleScreens, noop } from "./fixtures";

const meta: Meta<typeof Faceplate> = {
  title: "Panel/Faceplate",
  component: Faceplate,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof Faceplate>;

export const Default: Story = {
  args: {
    center: <AudioOwner screens={sampleScreens} ownerId="screen-1" onSelect={noop} />,
    right: <StatusLamp state="connected" label="connected · ws://localhost:8080" />,
  },
};
