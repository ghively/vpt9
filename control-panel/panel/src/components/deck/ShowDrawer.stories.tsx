import type { Meta, StoryObj } from "@storybook/react";
import { useState, type ReactNode } from "react";
import { ShowDrawer, type ShowTab } from "./ShowDrawer";
import { CueList } from "../CueList";
import { LfoRack } from "../LfoRack";
import { MediaLibrary } from "../MediaLibrary";
import { MidiMapPanel } from "../MidiMapPanel";
import { PipWindows } from "../PipWindows";
import { PresetsBar } from "../PresetsBar";
import { SourceBankPresets } from "../SourceBankPresets";
import { TimerBank } from "../TimerBank";
import {
  noop,
  sampleCues,
  sampleLfos,
  sampleMedia,
  sampleMidiMappings,
  samplePips,
  samplePresets,
  sampleTargetOptions,
  sampleTimers,
} from "../fixtures";

const meta: Meta<typeof ShowDrawer> = {
  title: "Panel/ShowDrawer",
  component: ShowDrawer,
  decorators: [(Story) => <div style={{ width: 960 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ShowDrawer>;

// The same per-tab wiring shape App.tsx uses (sc-card wrapper + <h3> for the panels
// that don't render their own — see App.tsx's `activePanel` switch), just fed with
// fixture data/no-op callbacks instead of live store/actions for isolated preview.
const PANEL_BY_TAB: Record<ShowTab, ReactNode> = {
  presets: (
    <section className="sc-card">
      <h3>Presets</h3>
      <PresetsBar presets={samplePresets} onRecall={noop} onSave={noop} onRename={noop} onRemove={noop} />
    </section>
  ),
  sources: (
    <section className="sc-card">
      <h3>Source snapshots</h3>
      <SourceBankPresets
        presets={[
          { id: "sbp-1", name: "Cameras", slots: [] },
          { id: "sbp-2", name: "VJ loops", slots: [] },
        ]}
        cursor={0}
        onSave={noop}
        onRecall={noop}
        onRename={noop}
        onRemove={noop}
        onNext={noop}
        onPrev={noop}
      />
    </section>
  ),
  cues: (
    <section className="sc-card">
      <CueList cues={sampleCues} cursor={1} running={false} presets={samplePresets} onGo={noop} onStop={noop} onJump={noop} onSetCues={noop} />
    </section>
  ),
  timers: (
    <section className="sc-card">
      <TimerBank timers={sampleTimers} presets={samplePresets} onAdd={noop} onUpdate={noop} onRemove={noop} />
    </section>
  ),
  lfo: (
    <section className="sc-card">
      <LfoRack lfos={sampleLfos} targetOptions={sampleTargetOptions} onAdd={noop} onUpdate={noop} onRemove={noop} />
    </section>
  ),
  midi: (
    <section className="sc-card">
      <MidiMapPanel
        mappings={sampleMidiMappings}
        learningId={null}
        midiAvailable
        targetOptions={sampleTargetOptions}
        onAdd={noop}
        onUpdate={noop}
        onRemove={noop}
        onLearn={noop}
      />
    </section>
  ),
  media: <MediaLibrary media={sampleMedia} uploadUrl="http://localhost:8080/api/media" onRename={noop} onRemove={noop} />,
  pip: (
    <section className="sc-card">
      <PipWindows
        screenId="screen-1"
        pips={samplePips}
        onUpdatePip={noop}
        onMovePip={noop}
        onResizePip={noop}
        onRemovePip={noop}
        onAddPip={noop}
        onDragStart={noop}
        onDragEnd={noop}
      />
    </section>
  ),
};

export const Collapsed: Story = {
  args: { tab: "presets", open: false, onTab: noop, onToggle: noop, children: PANEL_BY_TAB.presets },
};

export const PresetsTab: Story = {
  args: { tab: "presets", open: true, onTab: noop, onToggle: noop, children: PANEL_BY_TAB.presets },
};

export const CuesTab: Story = {
  args: { tab: "cues", open: true, onTab: noop, onToggle: noop, children: PANEL_BY_TAB.cues },
};

export const TimersTab: Story = {
  args: { tab: "timers", open: true, onTab: noop, onToggle: noop, children: PANEL_BY_TAB.timers },
};

export const LfoTab: Story = {
  args: { tab: "lfo", open: true, onTab: noop, onToggle: noop, children: PANEL_BY_TAB.lfo },
};

export const MidiTab: Story = {
  args: { tab: "midi", open: true, onTab: noop, onToggle: noop, children: PANEL_BY_TAB.midi },
};

export const MediaTab: Story = {
  args: { tab: "media", open: true, onTab: noop, onToggle: noop, children: PANEL_BY_TAB.media },
};

export const PipTab: Story = {
  args: { tab: "pip", open: true, onTab: noop, onToggle: noop, children: PANEL_BY_TAB.pip },
};

/** Fully interactive: click a tab (opens the drawer to it if collapsed) or the Show
 *  toggle (collapses/expands without changing tab) — mirrors how App.tsx wires the
 *  real `showTab`/`showDrawerOpen` state. */
export const Interactive: Story = {
  render: function Render() {
    const [tab, setTab] = useState<ShowTab>("presets");
    const [open, setOpen] = useState(false);
    return (
      <ShowDrawer tab={tab} onTab={setTab} open={open} onToggle={() => setOpen((o) => !o)}>
        {PANEL_BY_TAB[tab]}
      </ShowDrawer>
    );
  },
};
