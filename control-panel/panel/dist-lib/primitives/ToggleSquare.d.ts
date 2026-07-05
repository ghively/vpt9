import { ReactNode } from 'react';
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
export declare function ToggleSquare({ label, active, tone, disabled, title, onClick, className, }: ToggleSquareProps): import("react").JSX.Element;
