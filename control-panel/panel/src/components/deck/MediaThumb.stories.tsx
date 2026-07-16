import type { Meta, StoryObj } from "@storybook/react";
import { MediaThumb } from "./MediaThumb";
import { sampleMedia } from "../fixtures";

const meta: Meta<typeof MediaThumb> = {
  title: "Panel/MediaThumb",
  component: MediaThumb,
  decorators: [(Story) => <div style={{ padding: 16, width: 120 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof MediaThumb>;

// Poster src points at the server's /thumb endpoint — in Storybook there's no server, so
// the <img> shows its broken-image frame; the card still captures the thumb's sizing/shape.
export const Video: Story = { args: { item: sampleMedia[0], mediaBase: "" } };
export const Gif: Story = { args: { item: sampleMedia[1], mediaBase: "" } };
export const Image: Story = { args: { item: sampleMedia[2], mediaBase: "" } };
