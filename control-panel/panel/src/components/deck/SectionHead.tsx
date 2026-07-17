import type { ReactNode } from "react";

export interface SectionHeadProps {
  /** Section title (e.g. "Layer stack", "Media", "Shared slots"). */
  title: string;
  /** Optional trailing count / status shown mono-styled at the right. */
  count?: ReactNode;
  /** Collapsed state — only meaningful when `onToggle` is provided (desktop rail). */
  collapsed?: boolean;
  /** When provided, the header becomes a collapse toggle button with a chevron. Omit to
   *  render a plain, non-interactive header (mobile, where each rail section is its own
   *  full-height sheet tab and collapsing would just hide the tab). */
  onToggle?: () => void;
}

/** The `.sec-head` rail-section header. With `onToggle` it's a collapse control (a
 *  button with a rotating chevron + aria-expanded) so a desktop operator can fold the
 *  left rail's Layers / Media / Shared-slots sections and keep the ones they need in view
 *  at once — the VJ/DAW rack pattern. Without it, the original static header. */
export function SectionHead({ title, count, collapsed = false, onToggle }: SectionHeadProps) {
  if (!onToggle) {
    return (
      <div className="sec-head label">
        {title}
        {count != null && <span className="count mono">{count}</span>}
      </div>
    );
  }
  return (
    <button
      type="button"
      className="sec-head label sec-head--toggle"
      aria-expanded={!collapsed}
      onClick={onToggle}
    >
      <span className="sec-head__chev" aria-hidden="true" data-collapsed={collapsed || undefined}>▾</span>
      {title}
      {count != null && <span className="count mono">{count}</span>}
    </button>
  );
}
