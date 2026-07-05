import type { Preview } from "@storybook/react";
import "../src/styles.css";

// Stories render on the venue-black ground so the projection-desk palette reads true —
// and so design-sync's preview capture matches the real app background.
const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "venue",
      values: [{ name: "venue", value: "#08090b" }],
    },
  },
};

export default preview;
