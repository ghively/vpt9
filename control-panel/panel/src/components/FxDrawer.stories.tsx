import type { Meta, StoryObj } from "@storybook/react";
import { FxDrawer } from "./FxDrawer";
import { defaultFx, sampleLayers, noop } from "./fixtures";

const meta: Meta<typeof FxDrawer> = {
  title: "Panel/FxDrawer",
  component: FxDrawer,
  decorators: [(Story) => <div style={{ width: 960 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof FxDrawer>;

export const Active: Story = {
  args: {
    fx: sampleLayers[0].fx,
    transport: sampleLayers[0].transport,
    sourceMode: "single",
    downscale: 1,
    onUpdate: noop,
  },
};

export const AllNeutral: Story = {
  args: {
    fx: defaultFx,
    onUpdate: noop,
  },
};
