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
export function Select({ value, options, onChange, className }: SelectProps) {
  return (
    <select className={className} value={value} onChange={(e) => onChange?.(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
