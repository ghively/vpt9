import type { Meta, StoryObj } from "@storybook/react";
import { VenueGround } from "./VenueGround";

const meta: Meta<typeof VenueGround> = {
  title: "Panel/VenueGround",
  component: VenueGround,
};
export default meta;
type Story = StoryObj<typeof VenueGround>;

// VenueGround is the dark projection-desk backdrop every panel surface sits on — it's the
// design-sync provider wrapper. The story just shows the ground with sample content.
export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: 24, color: "#e6e6e6", font: "13px system-ui" }}>
        <strong>Venue ground</strong>
        <p style={{ opacity: 0.7 }}>The near-black stage the deck renders against.</p>
      </div>
    ),
  },
};
