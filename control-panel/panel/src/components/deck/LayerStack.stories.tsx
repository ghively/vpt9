import type { Meta, StoryObj } from "@storybook/react";
import { sampleLayers, noop } from "../fixtures";
import { LayerStack } from "./LayerStack";

// fixtures.ts's sampleLayers is order-ascending (bottom-of-stack first); LayerStack's
// contract requires top-of-stack-first, same as the sort App performs.
const topFirstLayers = [...sampleLayers].reverse();

const meta: Meta<typeof LayerStack> = {
  title: "Panel/LayerStack",
  component: LayerStack,
  decorators: [(Story) => <div style={{ width: 232 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof LayerStack>;

export const Default: Story = {
  args: { layers: topFirstLayers, selectedId: null, onSelect: noop, onAddLayer: () => {}, onMoveLayer: () => {}, onRemoveLayer: () => {} },
};
export const Selected: Story = {
  args: {
    layers: topFirstLayers,
    selectedId: topFirstLayers[0].id,
    onSelect: noop,
    onAddLayer: () => {},
    onMoveLayer: () => {},
    onRemoveLayer: () => {},
  },
};
