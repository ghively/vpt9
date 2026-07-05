import type { ReactNode } from "react";

export interface ButtonProps {
  label: ReactNode;
  /** "default" → the mono `.btn`; "save" → the preset `.save-btn`. */
  variant?: "default" | "save";
  onClick?: () => void;
}

/** A full-width-ish mono action button ("+ Add layer", "+ Save current"). */
export function Button({ label, variant = "default", onClick }: ButtonProps) {
  return (
    <button className={variant === "save" ? "save-btn" : "btn"} onClick={onClick}>
      {label}
    </button>
  );
}
