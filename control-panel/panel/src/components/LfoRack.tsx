import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { TargetPicker } from "./primitives/TargetPicker";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import type { Lfo, LfoWave, TargetOption } from "./types";

export interface LfoRackProps {
  lfos: Lfo[];
  /** Numeric state paths for the target picker (built by the container from live state).
   *  When empty/omitted, targets fall back to a free-text path field. */
  targetOptions?: TargetOption[];
  onAdd?: () => void;
  onUpdate?: (id: string, field: string, value: unknown) => void;
  onRemove?: (id: string) => void;
}

const WAVES: Array<{ value: LfoWave; label: string }> = [
  { value: "sine", label: "Sine" },
  { value: "triangle", label: "Triangle" },
  { value: "square", label: "Square" },
  { value: "saw", label: "Saw" },
  { value: "random", label: "Random" },
];

/** The modulation rack (VPT8's 10-slot LFO module): each slot oscillates one numeric
 *  state path between min and max. The server runs the oscillators; enabling a slot
 *  here starts it everywhere. */
export function LfoRack({ lfos, targetOptions, onAdd, onUpdate, onRemove }: LfoRackProps) {
  const num = (v: string, fallback: number) => (Number.isFinite(Number(v)) && v !== "" ? Number(v) : fallback);

  return (
    <div id="lfo-rack">
      <h3>LFO rack</h3>

      {lfos.length === 0 && <div className="empty-note mono">no lfos — add one below</div>}

      {lfos.map((lfo) => (
        <div className="lfo-row" key={lfo.id}>
          <ToggleSquare
            label="~"
            title={lfo.enabled ? "Running" : "Stopped"}
            active={!!lfo.enabled}
            onClick={() => onUpdate?.(lfo.id, "enabled", !lfo.enabled)}
          />
          <Select
            value={lfo.wave ?? "sine"}
            options={WAVES}
            onChange={(v) => onUpdate?.(lfo.id, "wave", v)}
          />
          <TextField
            className="lfo-num"
            value={String(lfo.rateHz ?? 0)}
            placeholder="Hz"
            onCommit={(v) => onUpdate?.(lfo.id, "rateHz", Math.max(0, num(v, 0)))}
          />
          <TextField
            className="lfo-num"
            value={String(lfo.min ?? 0)}
            placeholder="min"
            onCommit={(v) => onUpdate?.(lfo.id, "min", num(v, 0))}
          />
          <TextField
            className="lfo-num"
            value={String(lfo.max ?? 1)}
            placeholder="max"
            onCommit={(v) => onUpdate?.(lfo.id, "max", num(v, 1))}
          />
          {targetOptions?.length ? (
            <TargetPicker
              className="lfo-target"
              value={lfo.target ?? ""}
              options={targetOptions}
              onChange={(v) => onUpdate?.(lfo.id, "target", v)}
            />
          ) : (
            <TextField
              className="lfo-target"
              value={lfo.target ?? ""}
              placeholder="layers.layer-1.opacity"
              onCommit={(v) => onUpdate?.(lfo.id, "target", v)}
            />
          )}
          <ToggleSquare className="remove-btn" label="×" title="Remove LFO" onClick={() => onRemove?.(lfo.id)} />
        </div>
      ))}

      <Button label="+ Add LFO" onClick={onAdd} />
    </div>
  );
}
