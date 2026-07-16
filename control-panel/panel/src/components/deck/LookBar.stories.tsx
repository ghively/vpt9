import type { Meta, StoryObj } from "@storybook/react";
import { LookBar } from "./LookBar";
import { noop, samplePresets } from "../fixtures";

const meta: Meta<typeof LookBar> = {
  title: "Panel/LookBar",
  component: LookBar,
  decorators: [(Story) => <div style={{ padding: 16, width: 640 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof LookBar>;

export const Looks: Story = {
  args: { looks: samplePresets, onRecall: noop, onSave: noop, onRename: noop, onRemove: noop, focus: false, onToggleFocus: noop, blind: false },
};
export const FocusMode: Story = {
  args: { looks: samplePresets, onRecall: noop, onSave: noop, onRename: noop, onRemove: noop, focus: true, onToggleFocus: noop, blind: false },
};
export const Blind: Story = {
  args: { looks: samplePresets, onRecall: noop, onSave: noop, onRename: noop, onRemove: noop, focus: false, onToggleFocus: noop, blind: true },
};
