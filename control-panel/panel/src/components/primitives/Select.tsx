export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  className?: string;
  /** Accessible name for the control. Most Selects sit next to a visual `.label` span
   *  that isn't programmatically associated, so pass what the setting is (e.g. "Blend
   *  mode", "Source type") to name it for assistive tech and native tooltips. */
  ariaLabel?: string;
  /** Disables the control (e.g. no options available yet). */
  disabled?: boolean;
}

/** A themed native select (source type, blend mode). */
export function Select({ value, options, onChange, className, ariaLabel, disabled }: SelectProps) {
  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
