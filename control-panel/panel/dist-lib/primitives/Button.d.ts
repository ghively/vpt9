import { ReactNode } from 'react';
export interface ButtonProps {
    label: ReactNode;
    /** "default" → the mono `.btn`; "save" → the preset `.save-btn`. */
    variant?: "default" | "save";
    onClick?: () => void;
}
/** A full-width-ish mono action button ("+ Add layer", "+ Save current"). */
export declare function Button({ label, variant, onClick }: ButtonProps): import("react").JSX.Element;
