import { ReactNode } from 'react';
export interface ChipProps {
    /** Text or node shown in the chip. */
    label: ReactNode;
    /** Tungsten-highlighted when true (selected screen, active mode, audio owner). */
    active?: boolean;
    onClick?: () => void;
}
/** A small mono pill used for mode/screen selection and the audio-owner picker. */
export declare function Chip({ label, active, onClick }: ChipProps): import("react").JSX.Element;
