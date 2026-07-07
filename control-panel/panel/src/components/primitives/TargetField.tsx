import { TargetPicker } from "./TargetPicker";
import { TextField } from "./TextField";
import type { TargetOption } from "../types";

export interface TargetFieldProps {
  className?: string;
  value: string;
  /** Numeric state paths for the picker. When empty/omitted, falls back to a free-text
   *  dotted-path field — used by LfoRack and MidiMapPanel for the same "target" concept. */
  targetOptions?: TargetOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

/** A modulation/binding target field: the discoverable `TargetPicker` when
 *  `targetOptions` are available, otherwise a free-text dotted-path `TextField`. */
export function TargetField({ className, value, targetOptions, placeholder = "layers.layer-1.opacity", onChange }: TargetFieldProps) {
  return targetOptions?.length ? (
    <TargetPicker className={className} value={value} options={targetOptions} onChange={onChange} />
  ) : (
    <TextField className={className} value={value} placeholder={placeholder} onCommit={onChange} />
  );
}
