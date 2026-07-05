import type { Meta, StoryObj } from "@storybook/react";
import { MidiMapPanel } from "./MidiMapPanel";
import { sampleMidiMappings, noop } from "./fixtures";

const meta: Meta<typeof MidiMapPanel> = {
  title: "Panel/MidiMapPanel",
  component: MidiMapPanel,
  decorators: [(Story) => <div style={{ width: 520 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof MidiMapPanel>;

export const Default: Story = {
  args: {
    mappings: sampleMidiMappings,
    learningId: "map-2",
    midiAvailable: true,
    onAdd: noop,
    onUpdate: noop,
    onRemove: noop,
    onLearn: noop,
  },
};

export const Unavailable: Story = {
  args: {
    mappings: [],
    learningId: null,
    midiAvailable: false,
    onAdd: noop,
    onUpdate: noop,
    onRemove: noop,
    onLearn: noop,
  },
};
