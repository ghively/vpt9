import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { TargetField } from "./primitives/TargetField";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import { parseNumberOr } from "./numeric";
import type { Lfo, LfoWave, TargetOption } from "./types";

export interface LfoRackProps {
  lfos: Lfo[];
  /** Global tempo (BPM) for tempo-synced slots (A19). */
  tempoBpm?: number;
  /** Numeric state paths for the target picker (built by the container from live state).
   *  When empty/omitted, targets fall back to a free-text path field. */
  targetOptions?: TargetOption[];
  onAdd?: () => void;
  onUpdate?: (id: string, field: string, value: unknown) => void;
  onRemove?: (id: string) => void;
  onSetTempo?: (bpm: number) => void;
}

const WAVES: Array<{ value: LfoWave; label: string }> = [
  { value: "sine", label: "Sine" },
  { value: "triangle", label: "Triangle" },
  { value: "square", label: "Square" },
  { value: "saw", label: "Saw" },
  { value: "random", label: "Random" },
];

const KINDS = [
  { value: "osc", label: "Osc" },
  { value: "mixer", label: "Mixer" },
];

const BLENDS = [
  { value: "add", label: "Add" },
  { value: "mult", label: "Mult" },
  { value: "xfade", label: "XFade" },
];

// value "" = free-running at rateHz; the rest are note divisions parsed server-side.
const SYNC_NOTES = [
  { value: "", label: "Free" },
  { value: "1/1", label: "1/1" },
  { value: "1/2", label: "1/2" },
  { value: "1/4", label: "1/4" },
  { value: "1/8", label: "1/8" },
  { value: "1/16", label: "1/16" },
  { value: "1/32", label: "1/32" },
];

/** The modulation rack (VPT8's 10-slot LFO module): each `osc` slot oscillates one numeric
 *  state path between min and max; a `mixer` slot (A19) blends two oscillators. The server
 *  runs everything; enabling a slot here starts it everywhere. */
export function LfoRack({ lfos, tempoBpm, targetOptions, onAdd, onUpdate, onRemove, onSetTempo }: LfoRackProps) {
  // Oscillator slots are the only valid mixer inputs (referencing a mixer reads 0).
  const oscOptions = [
    { value: "", label: "(none)" },
    ...lfos
      .map((lfo, i) => ({ lfo, i }))
      .filter(({ lfo }) => (lfo.kind ?? "osc") === "osc")
      .map(({ lfo, i }) => ({ value: lfo.id, label: `LFO ${i + 1}` })),
  ];

  return (
    <div id="lfo-rack">
      <div className="lfo-head">
        <h3>LFO rack</h3>
        <label className="lfo-tempo mono">
          BPM
          <TextField
            className="lfo-num"
            value={String(tempoBpm ?? 120)}
            placeholder="bpm"
            onCommit={(v) => onSetTempo?.(Math.max(1, parseNumberOr(v, 120)))}
          />
        </label>
      </div>

      {lfos.length === 0 && <div className="empty-note mono">no lfos — add one below</div>}

      {lfos.map((lfo) => {
        const kind = lfo.kind ?? "osc";
        const synced = !!lfo.syncNote;
        return (
          <div className="lfo-row" key={lfo.id} data-kind={kind}>
            <ToggleSquare
              label="~"
              title={lfo.enabled ? "Running" : "Stopped"}
              active={!!lfo.enabled}
              onClick={() => onUpdate?.(lfo.id, "enabled", !lfo.enabled)}
            />
            <Select value={kind} options={KINDS} onChange={(v) => onUpdate?.(lfo.id, "kind", v)} />

            {kind === "mixer" ? (
              <>
                <Select value={lfo.aId ?? ""} options={oscOptions} onChange={(v) => onUpdate?.(lfo.id, "aId", v || null)} />
                <Select value={lfo.bId ?? ""} options={oscOptions} onChange={(v) => onUpdate?.(lfo.id, "bId", v || null)} />
                <Select value={lfo.blend ?? "add"} options={BLENDS} onChange={(v) => onUpdate?.(lfo.id, "blend", v)} />
                {lfo.blend === "xfade" && (
                  <TextField
                    className="lfo-num"
                    value={String(lfo.mix ?? 0.5)}
                    placeholder="mix"
                    onCommit={(v) => onUpdate?.(lfo.id, "mix", Math.min(1, Math.max(0, parseNumberOr(v, 0.5))))}
                  />
                )}
              </>
            ) : (
              <>
                <Select value={lfo.wave ?? "sine"} options={WAVES} onChange={(v) => onUpdate?.(lfo.id, "wave", v)} />
                <Select
                  value={lfo.syncNote ?? ""}
                  options={SYNC_NOTES}
                  onChange={(v) => onUpdate?.(lfo.id, "syncNote", v || null)}
                />
                {!synced && (
                  <TextField
                    className="lfo-num"
                    value={String(lfo.rateHz ?? 0)}
                    placeholder="Hz"
                    onCommit={(v) => onUpdate?.(lfo.id, "rateHz", Math.max(0, parseNumberOr(v, 0)))}
                  />
                )}
                <TextField
                  className="lfo-num"
                  value={String(lfo.phase ?? 0)}
                  placeholder="phase"
                  onCommit={(v) => onUpdate?.(lfo.id, "phase", Math.min(1, Math.max(0, parseNumberOr(v, 0))))}
                />
                <ToggleSquare
                  label="±"
                  title={lfo.waveInvert ? "Inverted" : "Invert output"}
                  active={!!lfo.waveInvert}
                  onClick={() => onUpdate?.(lfo.id, "waveInvert", !lfo.waveInvert)}
                />
              </>
            )}

            <TextField
              className="lfo-num"
              value={String(lfo.min ?? 0)}
              placeholder="min"
              onCommit={(v) => onUpdate?.(lfo.id, "min", parseNumberOr(v, 0))}
            />
            <TextField
              className="lfo-num"
              value={String(lfo.max ?? 1)}
              placeholder="max"
              onCommit={(v) => onUpdate?.(lfo.id, "max", parseNumberOr(v, 1))}
            />
            <TargetField
              className="lfo-target"
              value={lfo.target ?? ""}
              targetOptions={targetOptions}
              onChange={(v) => onUpdate?.(lfo.id, "target", v)}
            />
            <ToggleSquare className="remove-btn" label="×" title="Remove LFO" onClick={() => onRemove?.(lfo.id)} />
          </div>
        );
      })}

      <Button label="+ Add LFO" onClick={onAdd} />
    </div>
  );
}
