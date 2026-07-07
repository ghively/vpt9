export type MobileTab = "layers" | "screen" | "media" | "show";

export interface MobileTabBarProps {
  active: MobileTab;
  onSelect: (tab: MobileTab) => void;
}

const TABS: Array<[MobileTab, string]> = [
  ["layers", "Layers"],
  ["screen", "Screen"],
  ["media", "Media"],
  ["show", "Show"],
];

/** Fixed bottom navigation for narrow viewports: one full-height section at a time.
 *  48px tall, in the thumb zone; buttons meet the coarse-pointer tap minimum. */
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
