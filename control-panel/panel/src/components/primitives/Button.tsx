import type { ReactNode } from "react";

export interface ButtonProps {
  label: ReactNode;
  /** "default" → the mono `.btn`; "save" → the preset `.save-btn`. */
  variant?: "default" | "save";
  /** Greys the button out and blocks clicks (e.g. Next/Prev with no snapshots). */
  disabled?: boolean;
  onClick?: () => void;
}

/** A full-width-ish mono action button ("+ Add layer", "+ Save current"). */
export function Button({ label, variant = "default", disabled = false, onClick }: ButtonProps) {
  return (
    <button className={variant === "save" ? "save-btn" : "btn"} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}
