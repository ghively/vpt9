import type { Meta, StoryObj } from "@storybook/react";
import { SourceBankPresets } from "./SourceBankPresets";
import type { SourceBankPreset } from "./types";
import { noop } from "./fixtures";

const slot = (id: string, name: string, mediaId: string) => ({
  id,
  name,
  content: { type: "media" as const, mediaId },
});

const presets: SourceBankPreset[] = [
  { id: "snap-1", name: "Openers", slots: [slot("s1", "A", "media-a1"), slot("s2", "B", "media-b2")] },
  { id: "snap-2", name: "Peak set", slots: [slot("s1", "A", "media-c3")] },
  { id: "snap-3", name: "Ambient", slots: [] },
];

const meta: Meta<typeof SourceBankPresets> = {
  title: "Panel/SourceBankPresets",
  component: SourceBankPresets,
  decorators: [(Story) => <div style={{ padding: 16, width: 360 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SourceBankPresets>;

export const WithSnapshots: Story = {
  args: { presets, cursor: 1, onSave: noop, onRecall: noop, onRename: noop, onRemove: noop, onNext: noop, onPrev: noop },
};
export const Empty: Story = {
  args: { presets: [], cursor: -1, onSave: noop, onRecall: noop, onRename: noop, onRemove: noop, onNext: noop, onPrev: noop },
};
