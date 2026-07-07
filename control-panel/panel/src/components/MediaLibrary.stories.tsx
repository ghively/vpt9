import type { Meta, StoryObj } from "@storybook/react";
import { MediaLibrary } from "./MediaLibrary";
import { sampleMedia } from "./fixtures";
import { noop } from "./fixtures";

const meta: Meta<typeof MediaLibrary> = {
  title: "Panel/MediaLibrary",
  component: MediaLibrary,
  decorators: [(Story) => <div style={{ width: 720, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof MediaLibrary>;

export const Populated: Story = {
  args: { media: sampleMedia, uploadUrl: "http://localhost:8080/api/media", onRename: noop, onRemove: noop },
};
export const Empty: Story = {
  args: { media: [], uploadUrl: "http://localhost:8080/api/media", onRename: noop, onRemove: noop },
};
