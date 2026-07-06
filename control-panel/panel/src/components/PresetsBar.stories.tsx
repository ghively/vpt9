import type { Meta, StoryObj } from "@storybook/react";
import { PresetsBar } from "./PresetsBar";
import { samplePresets, noop } from "./fixtures";

const meta: Meta<typeof PresetsBar> = {
  title: "Panel/PresetsBar",
  component: PresetsBar,
  decorators: [(Story) => <div style={{ width: 388, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PresetsBar>;

export const Default: Story = {
  args: { presets: samplePresets, onRecall: noop, onSave: noop, onRename: noop, onRemove: noop },
};
export const Empty: Story = { args: { presets: [], onRecall: noop, onSave: noop, onRename: noop, onRemove: noop } };
