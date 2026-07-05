export interface FaderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  ariaLabel?: string;
}

/** A machined-cap range fader (opacity and any other 0–1 control). */
export function Fader({ value, min = 0, max = 1, step = 0.01, onChange, ariaLabel }: FaderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange?.(Number(e.target.value))}
    />
  );
}
