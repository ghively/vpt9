import type { Meta, StoryObj } from "@storybook/react";
import { createActions } from "../../app/actions";
import { emptyState } from "../../app/store";
import { sampleLayers, noop } from "../fixtures";
import { LayerStack } from "./LayerStack";

// Real actions object (no-op send) — matches the exact prop shape App passes in, so the
// story exercises the real moveLayer/removeLayer/addLayer wiring rather than a stub.
const actions = createActions(() => {}, () => emptyState());

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
  args: { layers: topFirstLayers, selectedId: null, onSelect: noop, actions },
};
export const Selected: Story = {
  args: { layers: topFirstLayers, selectedId: sampleLayers[0].id, onSelect: noop, actions },
};
