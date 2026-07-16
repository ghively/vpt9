import type { Meta, StoryObj } from "@storybook/react";
import { ContextMenu, type MenuItem } from "./ContextMenu";
import { noop } from "../fixtures";

const items: MenuItem[] = [
  { label: "Use on selected layer", onSelect: noop },
  { label: "Send to slot", onSelect: noop },
  "separator",
  { label: "Rename", onSelect: noop },
  { label: "Edit tags", onSelect: noop, disabled: true },
  "separator",
  { label: "Delete", onSelect: noop, danger: true },
];

const meta: Meta<typeof ContextMenu> = {
  title: "Panel/ContextMenu",
  component: ContextMenu,
  decorators: [(Story) => <div style={{ position: "relative", width: 320, height: 260 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = { args: { x: 24, y: 24, items, onClose: noop } };
