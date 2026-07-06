import { useState } from "react";
import { TextField } from "./TextField";
import type { TargetOption } from "../types";

export interface TargetPickerProps {
  /** The bound dotted state path ("" = unbound). */
  value: string;
  /** Selectable numeric paths, optgrouped by `group` (usually one group per layer). */
  options: TargetOption[];
  onChange?: (value: string) => void;
  className?: string;
}

const CUSTOM = "__custom__";

/** Picks a modulation/binding target from the live state's numeric paths (LFO + MIDI
 *  rows) with a "custom path…" escape hatch that reveals a free-text field — so the
 *  common case is discoverable and the raw dotted-path ability stays available. */
export function TargetPicker({ value, options, onChange, className }: TargetPickerProps) {
  const known = options.some((o) => o.value === value);
  // Free-text mode sticks once chosen (or when the bound path isn't in the list) until
  // the operator picks a listed target again.
  const [customMode, setCustomMode] = useState(() => value !== "" && !known);
  const showText = customMode || (value !== "" && !known);

  const groups = new Map<string, TargetOption[]>();
  for (const option of options) {
    const list = groups.get(option.group) ?? [];
    list.push(option);
    groups.set(option.group, list);
  }

  return (
    <div className={className ? `target-picker ${className}` : "target-picker"}>
      <select
        value={showText ? CUSTOM : value}
        onChange={(e) => {
          if (e.target.value === CUSTOM) {
            setCustomMode(true);
          } else {
            setCustomMode(false);
            onChange?.(e.target.value);
          }
        }}
      >
        <option value="">(no target)</option>
        {[...groups.entries()].map(([group, list]) => (
          <optgroup key={group} label={group}>
            {list.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM}>custom path…</option>
      </select>
      {showText && (
        <TextField
          value={value}
          placeholder="layers.layer-1.opacity"
          onCommit={(v) => onChange?.(v)}
        />
      )}
    </div>
  );
}
