import type { ReactNode } from "react";

export interface ToggleSquareProps {
  /** Glyph or short label (e.g. "M", "○", "×", "▲"). */
  label: ReactNode;
  /** Tungsten-highlighted when true. */
  active?: boolean;
  /** "live" switches the active highlight to the record-red tone. */
  tone?: "default" | "live";
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  /** Extra class for layout variants (e.g. "move-btn", "remove-btn"). */
  className?: string;
}

/** A 26px square momentary/toggle control — the panel's workhorse button. */
export function ToggleSquare({
  label,
  active = false,
  tone = "default",
  disabled = false,
  title,
  onClick,
  className,
}: ToggleSquareProps) {
  // Glyph labels ("×", "▲", "→", a decorative node) carry no meaningful accessible name;
  // fall back to the `title` (the human description these buttons already pass) so a
  // screen reader announces the ACTION, not "multiplication sign". Word/alphanumeric
  // labels ("BLIND", "ON", "INV", "L") ARE their own accessible name and are kept as-is —
  // both so they read naturally and so name-based lookups (tests, voice control) still
  // find them by the visible word.
  const glyphOnly = typeof label !== "string" || !/[a-z0-9]/i.test(label);
  const ariaLabel = glyphOnly && title ? title : undefined;
  return (
    <button
      type="button"
      className={className ? `toggle-sq ${className}` : "toggle-sq"}
      data-active={active}
      data-tone={tone === "live" ? "live" : undefined}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
