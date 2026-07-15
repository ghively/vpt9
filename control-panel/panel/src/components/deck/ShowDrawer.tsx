import type { ReactNode } from "react";

/** The secondary show-control panels, unmounted from the flat layout (Task 1) and
 *  relocated here (Task 8). Order matches the tab strip left-to-right. "pip" (Task 13)
 *  restores the PiP (picture-in-picture) window manager that Task 1 dropped entirely. */
export type ShowTab = "presets" | "sources" | "cues" | "timers" | "lfo" | "midi" | "media" | "pip";

// Labels speak operator, not implementation: "Looks" are the scene presets the look bar
// fires, "Motion" is the LFO rack, "Cast" is the PiP/cast-window manager. Keys unchanged.
const SHOW_DRAWER_TABS: Array<[ShowTab, string]> = [
  ["presets", "Looks"],
  ["sources", "Source sets"],
  ["cues", "Cues"],
  ["timers", "Timers"],
  ["lfo", "Motion"],
  ["midi", "MIDI"],
  ["media", "Media"],
  ["pip", "Cast"],
];

export interface ShowDrawerProps {
  tab: ShowTab;
  onTab: (tab: ShowTab) => void;
  /** Collapsed by default: only the tab strip shows. */
  open: boolean;
  onToggle: () => void;
  /** The active tab's panel, rendered + wired by the container (App). Presentational —
   *  this component never imports from `src/app/` and knows nothing about what a tab
   *  actually renders. */
  children?: ReactNode;
}

/** Collapsible bottom sheet spanning the deck body's width: a tab strip
 *  (Presets · Cues · Timers · LFO · MIDI · Media · PiP) that's one tap away, not
 *  permanently cluttering the 3-zone deck (LayerStack/SlotGrid rails, Stage, Inspector)
 *  above it.
 *  Picking a tab while collapsed opens the drawer to that tab; the toggle button
 *  collapses/expands independently of which tab is selected. */
export function ShowDrawer({ tab, onTab, open, onToggle, children }: ShowDrawerProps) {
  return (
    <div className="show-drawer" data-open={open}>
      <div className="show-drawer-bar">
        <button
          type="button"
          className="show-drawer-toggle"
          aria-expanded={open}
          onClick={onToggle}
        >
          <span className="show-drawer-chevron" aria-hidden="true" />
          Show
        </button>
        <div className="show-drawer-tabs" role="tablist">
          {SHOW_DRAWER_TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="show-drawer-tab"
              role="tab"
              aria-selected={tab === value}
              data-active={tab === value}
              onClick={() => {
                onTab(value);
                if (!open) onToggle();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {open && <div className="show-drawer-body">{children}</div>}
    </div>
  );
}
