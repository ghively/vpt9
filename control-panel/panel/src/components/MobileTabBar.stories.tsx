import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MobileTabBar, type MobileTab } from "./MobileTabBar";

const meta: Meta<typeof MobileTabBar> = {
  title: "Panel/MobileTabBar",
  component: MobileTabBar,
  decorators: [(Story) => <div style={{ width: 390, padding: 0 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof MobileTabBar>;

export const Interactive: Story = {
  render: function Render() {
    const [active, setActive] = useState<MobileTab>("layers");
    return <MobileTabBar active={active} onSelect={setActive} />;
  },
};
