// Task 9 (deck redesign): the deck's four collapsible surfaces — the left rail's two
// sections (Layers, Slots), the right rail (Inspector), and the Show drawer — each get
// their own bottom-sheet tab. Renamed from the pre-deck flat layout's "screen"/"media"
// tabs (see `git show 3dcc100`), which mapped onto that layout's own aside/media panes
// and no longer apply to the deck's Stage-always-visible structure.
export type MobileTab = "layers" | "slots" | "inspector" | "show";

export interface MobileTabBarProps {
  active: MobileTab;
  onSelect: (tab: MobileTab) => void;
}

const TABS: Array<[MobileTab, string]> = [
  ["layers", "Layers"],
  // "slots" key kept; label says "Media" because this tab shows the media library (bin)
  // AND the source-bank slots — the old "Slots" label hid the whole media library.
  ["slots", "Media"],
  ["inspector", "Inspector"],
  ["show", "Show"],
];

/** Fixed bottom navigation for narrow viewports: switches which bottom-sheet section is
 *  visible below the (always-visible, dominant) deck Stage. In the thumb zone; buttons
 *  meet the coarse-pointer tap minimum (`--tap-min`, see panel.css). */
export function MobileTabBar({ active, onSelect }: MobileTabBarProps) {
  return (
    <nav className="mobile-tabbar" role="tablist">
      {TABS.map(([value, label]) => (
        <button
          key={value}
          className="mobile-tab"
          role="tab"
          aria-selected={active === value}
          data-active={active === value}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
