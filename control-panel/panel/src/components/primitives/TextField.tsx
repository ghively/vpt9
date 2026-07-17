import { useEffect, useState } from "react";

export interface TextFieldProps {
  value: string;
  placeholder?: string;
  /** Native tooltip. */
  title?: string;
  /** Accessible name. Placeholder text is NOT a reliable accessible name (it isn't
   *  consistently announced and vanishes once the field has content), so fields that are
   *  labeled only by a placeholder should pass this so assistive tech can identify them. */
  ariaLabel?: string;
  /** Fires on blur or Enter (matches the vanilla panel's commit-on-change semantics),
   *  not on every keystroke — so a layer name isn't re-sent character by character. */
  onCommit?: (value: string) => void;
  className?: string;
  /** Native input type — "text" (default) or "number" for numeric fields. */
  inputMode?: "text" | "numeric" | "decimal";
}

/** A text input that keeps a local draft and commits on blur/Enter. Re-syncs when the
 *  external value changes (e.g. a preset recall) but never mid-keystroke. */
export function TextField({ value, placeholder, title, ariaLabel, onCommit, className, inputMode }: TextFieldProps) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft !== value) onCommit?.(draft);
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      title={title ?? ariaLabel}
      aria-label={ariaLabel}
      inputMode={inputMode}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}
