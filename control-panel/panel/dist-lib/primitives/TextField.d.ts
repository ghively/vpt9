export interface TextFieldProps {
    value: string;
    placeholder?: string;
    /** Fires on blur or Enter (matches the vanilla panel's commit-on-change semantics),
     *  not on every keystroke — so a layer name isn't re-sent character by character. */
    onCommit?: (value: string) => void;
    className?: string;
}
/** A text input that keeps a local draft and commits on blur/Enter. Re-syncs when the
 *  external value changes (e.g. a preset recall) but never mid-keystroke. */
export declare function TextField({ value, placeholder, onCommit, className }: TextFieldProps): import("react").JSX.Element;
