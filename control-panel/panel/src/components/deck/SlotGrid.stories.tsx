import type { Meta, StoryObj } from "@storybook/react";
import { sampleMedia, noop } from "../fixtures";
import { SlotGrid } from "./SlotGrid";
import type { SourceBankSlot } from "../types";

const slots: SourceBankSlot[] = [
  { id: "slot-1", name: "Slot 1", content: null },
  { id: "slot-2", name: "Slot 2", content: null },
  { id: "slot-3", name: "Slot 3", content: { type: "media", mediaId: sampleMedia[0].id } },
  { id: "slot-4", name: "Slot 4", content: null },
  { id: "slot-5", name: "Slot 5", content: { type: "mix", a: { type: "media", mediaId: sampleMedia[1].id }, b: { type: "media", mediaId: sampleMedia[2].id }, blendMode: "screen", mix: 0.5 } },
  { id: "slot-6", name: "Slot 6", content: null },
  { id: "slot-7", name: "Slot 7", content: null },
  { id: "slot-8", name: "Slot 8", content: null },
];

const meta: Meta<typeof SlotGrid> = {
  title: "Panel/SlotGrid",
  component: SlotGrid,
  decorators: [(Story) => <div style={{ width: 232 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SlotGrid>;

export const Default: Story = {
  args: { slots, media: sampleMedia, onRename: noop, onSetContent: noop, onEditSlot: noop },
};

export const AllEmpty: Story = {
  args: {
    slots: Array.from({ length: 8 }, (_, i) => ({ id: `slot-${i + 1}`, name: `Slot ${i + 1}`, content: null })),
    media: sampleMedia,
    onRename: noop,
    onSetContent: noop,
    onEditSlot: noop,
  },
};
