import { useEffect, useState, type ReactNode } from "react";

/** The secondary show-control panels, unmounted from the flat layout (Task 1) and
 *  relocated here (Task 8). Order matches the tab strip left-to-right. "pip" (Task 13)
 *  restores the PiP (picture-in-picture) window manager that Task 1 dropped entirely. */
export type ShowTab = "presets" | "sources" | "cues" | "timers" | "lfo" | "midi" | "media" | "pip";

// Tab labels match the feature the panel actually is, so the word tells you what opens
// (the old "Motion"/"Cast" gave no hint they were the LFO rack / PiP-cast manager). Keys
// unchanged.
const SHOW_DRAWER_TABS: Array<[ShowTab, string]> = [
  ["presets", "Looks"],
  // "Snapshots" (not "Sources"): this tab opens the source-BANK SNAPSHOT store (its own
  // panel heading is "Source snapshots"), NOT where you set up sources — that's the
  // left-rail "Shared slots" grid + the "Media" library. "Sources" read as the latter and
  // sent operators to the wrong place.
  ["sources", "Snapshots"],
  ["cues", "Cues"],
  ["timers", "Timers"],
  ["lfo", "LFO"],
  ["midi", "MIDI/OSC"],
  ["media", "Media"],
  ["pip", "PiP"],
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
  /** "Start fresh" (owner request 2026-07-16): wipe the show back to defaults, keeping
   *  the media library + screen registry. Destructive, so the button self-arms: first
   *  click arms ("sure?"), second click within 4s fires, anything else disarms. */
  onResetShow?: () => void;
}

/** Collapsible bottom sheet spanning the deck body's width: a tab strip
 *  (Presets · Cues · Timers · LFO · MIDI · Media · PiP) that's one tap away, not
 *  permanently cluttering the 3-zone deck (LayerStack/SlotGrid rails, Stage, Inspector)
 *  above it.
 *  Picking a tab while collapsed opens the drawer to that tab; the toggle button
 *  collapses/expands independently of which tab is selected. */
export function ShowDrawer({ tab, onTab, open, onToggle, children, onResetShow }: ShowDrawerProps) {
  // Two-step confirm for the destructive reset (same spirit as blackout being a
  // deliberate click): armed state auto-disarms after 4s of hesitation.
  const [resetArmed, setResetArmed] = useState(false);
  useEffect(() => {
    if (!resetArmed) return;
    const t = setTimeout(() => setResetArmed(false), 4000);
    return () => clearTimeout(t);
  }, [resetArmed]);
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
        {onResetShow && (
          <button
            type="button"
            className="show-drawer-reset mono"
            data-armed={resetArmed}
            title={resetArmed ? "Click again to wipe the show (media library survives)" : "Start fresh: clear every layer, slot, look, cue and warp — the media library survives"}
            onClick={() => {
              if (!resetArmed) { setResetArmed(true); return; }
              setResetArmed(false);
              onResetShow();
            }}
          >
            {resetArmed ? "sure? reset" : "reset show"}
          </button>
        )}
      </div>
      {open && <div className="show-drawer-body">{children}</div>}
    </div>
  );
}
