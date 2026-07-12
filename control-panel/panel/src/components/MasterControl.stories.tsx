import type { Meta, StoryObj } from "@storybook/react";
import { MasterControl } from "./MasterControl";
import { noop } from "./fixtures";

const meta: Meta<typeof MasterControl> = {
  title: "Panel/MasterControl",
  component: MasterControl,
  decorators: [(Story) => <div style={{ padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof MasterControl>;

export const Full: Story = {
  args: { master: 1, onChange: noop, onToggleBlackout: noop, blind: false, onToggleBlind: noop },
};

export const Dimmed: Story = {
  args: { master: 0.4, onChange: noop, onToggleBlackout: noop, blind: false, onToggleBlind: noop },
};

export const Blackout: Story = {
  args: { master: 0, onChange: noop, onToggleBlackout: noop, blind: false, onToggleBlind: noop },
};

export const Blind: Story = {
  args: { master: 1, onChange: noop, onToggleBlackout: noop, blind: true, onToggleBlind: noop },
};
