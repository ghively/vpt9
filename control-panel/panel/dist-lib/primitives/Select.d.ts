export interface SelectOption {
    value: string;
    label: string;
}
export interface SelectProps {
    value: string;
    options: SelectOption[];
    onChange?: (value: string) => void;
    className?: string;
}
/** A themed native select (source type, blend mode). */
export declare function Select({ value, options, onChange, className }: SelectProps): import("react").JSX.Element;
