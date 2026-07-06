import type { Meta, StoryObj } from "@storybook/react";
import { WarpEditor } from "./WarpEditor";
import { sampleScreens, noop } from "./fixtures";

const meta: Meta<typeof WarpEditor> = {
  title: "Panel/WarpEditor",
  component: WarpEditor,
  decorators: [(Story) => <div style={{ width: 388, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof WarpEditor>;

export const CornerPin: Story = {
  args: {
    screen: sampleScreens[0],
    screens: sampleScreens,
    onSelectScreen: noop,
    onAddScreen: noop,
    onRenameScreen: noop,
    onSetMode: noop,
    onSetMeshSize: noop,
    onReset: noop,
    onMovePoint: noop,
    onDragStart: noop,
    onDragEnd: noop,
  },
};

export const Mesh: Story = {
  args: {
    ...CornerPin.args,
    screen: {
      ...sampleScreens[0],
      warp: {
        mode: "mesh",
        corners: sampleScreens[0].warp.corners,
        mesh: {
          size: 4,
          points: Array.from({ length: 16 }, (_, i) => ({ x: (i % 4) / 3, y: Math.floor(i / 4) / 3 })),
        },
      },
    },
  },
};
