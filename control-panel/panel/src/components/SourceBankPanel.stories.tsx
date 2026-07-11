import type { Meta, StoryObj } from "@storybook/react";
import { SourceBankPanel } from "./SourceBankPanel";
import { sampleMedia, noop } from "./fixtures";

const meta: Meta<typeof SourceBankPanel> = {
  title: "Panel/SourceBankPanel",
  component: SourceBankPanel,
  decorators: [(Story) => <div style={{ width: 720, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SourceBankPanel>;

const emptySlots = Array.from({ length: 8 }, (_, i) => ({ id: `slot-${i + 1}`, name: `Slot ${i + 1}`, content: null }));

export const Empty: Story = { args: { slots: emptySlots, media: sampleMedia, onRename: noop, onSetContent: noop } };
export const WithMix: Story = {
  args: {
    slots: [
      { id: "slot-1", name: "Slot 1", content: { type: "media", mediaId: sampleMedia[0]?.id ?? "media-1" } },
      { id: "slot-2", name: "Slot 2", content: { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: null, blendMode: "multiply", mix: 0.5 } },
      ...emptySlots.slice(2),
    ],
    media: sampleMedia,
    onRename: noop,
    onSetContent: noop,
  },
};
