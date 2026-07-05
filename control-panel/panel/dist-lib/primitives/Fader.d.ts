export interface FaderProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange?: (value: number) => void;
    ariaLabel?: string;
}
/** A machined-cap range fader (opacity and any other 0–1 control). */
export declare function Fader({ value, min, max, step, onChange, ariaLabel }: FaderProps): import("react").JSX.Element;
