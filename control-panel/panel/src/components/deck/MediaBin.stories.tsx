import type { Meta, StoryObj } from "@storybook/react";
import { MediaBin } from "./MediaBin";
import { noop, sampleMedia } from "../fixtures";

const tagged = sampleMedia.map((m, i) => ({
  ...m,
  tags: i === 0 ? ["collection:Openers", "ambient"] : i === 1 ? ["collection:Openers", "loop"] : ["logo"],
}));

const meta: Meta<typeof MediaBin> = {
  title: "Panel/MediaBin",
  component: MediaBin,
  decorators: [(Story) => <div style={{ padding: 16, width: 320, height: 520 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof MediaBin>;

export const Library: Story = {
  args: {
    media: tagged,
    mediaBase: "",
    uploadUrl: "/upload",
    onUseOnSelected: noop,
    onRemove: noop,
    onSetTags: noop,
    onImportUrl: noop,
    imports: [],
    onDismissImport: noop,
  },
};
export const Empty: Story = {
  args: { media: [], mediaBase: "", uploadUrl: "/upload", onImportUrl: noop, imports: [] },
};
