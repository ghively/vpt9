import { TextField } from "./primitives/TextField";
import { TargetPicker } from "./primitives/TargetPicker";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import type { MidiMapping, TargetOption } from "./types";

export interface MidiMapPanelProps {
  mappings: MidiMapping[];
  /** Mapping currently armed for learn — its next incoming CC fills channel/controller. */
  learningId?: string | null;
  /** False when the browser has no WebMIDI (anything but Chrome/Edge, or no permission). */
  midiAvailable?: boolean;
  /** Numeric state paths for the target picker (built by the container from live state).
   *  When empty/omitted, targets fall back to a free-text path field. */
  targetOptions?: TargetOption[];
  onAdd?: () => void;
  onUpdate?: (id: string, field: string, value: unknown) => void;
  onRemove?: (id: string) => void;
  onLearn?: (id: string) => void;
}

/** WebMIDI CC bindings: hardware knobs → state paths. The panel's browser owns the MIDI
 *  hardware; mappings live in shared state so they survive reloads. */
export function MidiMapPanel({ mappings, learningId, midiAvailable = true, targetOptions, onAdd, onUpdate, onRemove, onLearn }: MidiMapPanelProps) {
  const num = (v: string, fallback: number) => (Number.isFinite(Number(v)) && v !== "" ? Number(v) : fallback);

  return (
    <div id="midi-map">
      <h3>MIDI map</h3>

      {!midiAvailable && (
        <div className="empty-note mono">webmidi unavailable in this browser</div>
      )}
      {midiAvailable && mappings.length === 0 && (
        <div className="empty-note mono">no bindings — add one, hit learn, twist a knob</div>
      )}

      {mappings.map((mapping) => (
        <div className="midi-row" key={mapping.id}>
          <ToggleSquare
            label="L"
            tone="live"
            title="Learn: next CC binds here"
            active={learningId === mapping.id}
            onClick={() => onLearn?.(mapping.id)}
          />
          <span className="midi-binding mono">
            ch{mapping.channel + 1} cc{mapping.controller}
          </span>
          <TextField
            className="midi-num"
            value={String(mapping.min ?? 0)}
            placeholder="min"
            onCommit={(v) => onUpdate?.(mapping.id, "min", num(v, 0))}
          />
          <TextField
            className="midi-num"
            value={String(mapping.max ?? 1)}
            placeholder="max"
            onCommit={(v) => onUpdate?.(mapping.id, "max", num(v, 1))}
          />
          {targetOptions?.length ? (
            <TargetPicker
              className="midi-target"
              value={mapping.target ?? ""}
              options={targetOptions}
              onChange={(v) => onUpdate?.(mapping.id, "target", v)}
            />
          ) : (
            <TextField
              className="midi-target"
              value={mapping.target ?? ""}
              placeholder="layers.layer-1.opacity"
              onCommit={(v) => onUpdate?.(mapping.id, "target", v)}
            />
          )}
          <ToggleSquare className="remove-btn" label="×" title="Remove binding" onClick={() => onRemove?.(mapping.id)} />
        </div>
      ))}

      <Button label="+ Add binding" onClick={onAdd} />
    </div>
  );
}
