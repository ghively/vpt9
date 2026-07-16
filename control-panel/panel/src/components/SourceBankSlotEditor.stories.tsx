import type { Meta, StoryObj } from "@storybook/react";
import { SourceBankSlotEditor } from "./SourceBankSlotEditor";
import type { SourceBankSlot } from "./types";
import { noop, sampleMedia, defaultTransport } from "./fixtures";

const mediaSlot: SourceBankSlot = {
  id: "slot-1",
  name: "Deck A",
  content: { type: "media", mediaId: "media-a1" },
  transport: { ...defaultTransport, seek: null },
};
const emptySlot: SourceBankSlot = { id: "slot-2", name: "Deck B", content: null };
const otherSlots = [{ id: "slot-2", name: "Deck B" }];

const meta: Meta<typeof SourceBankSlotEditor> = {
  title: "Panel/SourceBankSlotEditor",
  component: SourceBankSlotEditor,
  decorators: [(Story) => <div style={{ padding: 16, width: 360 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SourceBankSlotEditor>;

export const MediaSource: Story = {
  args: { slot: mediaSlot, index: 0, media: sampleMedia, otherSlots, cameraDevices: [], onRename: noop, onSetContent: noop, onSetTransport: noop },
};
export const Empty: Story = {
  args: { slot: emptySlot, index: 1, media: sampleMedia, otherSlots: [], cameraDevices: [], onRename: noop, onSetContent: noop, onSetTransport: noop },
};
