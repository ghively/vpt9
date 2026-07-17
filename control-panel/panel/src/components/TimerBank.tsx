import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import type { Timer, Preset } from "./types";

/** Zero-pad an "H:MM"/"HH:MM" wall-clock string to "HH:MM" (what the server tick compares
 *  against). Non-matching input is returned unchanged so the user can keep typing. */
function normalizeHhmm(v: string): string {
  const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(v);
  if (!m) return v;
  const hh = Math.min(23, Number(m[1]));
  const mm = Number(m[2]);
  if (mm > 59) return v;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export interface TimerBankProps {
  timers: Timer[];
  presets: Preset[];
  /** Source-bank snapshots (A21c) — the `source` action recalls one of these. */
  sourcePresets?: Preset[];
  onAdd?: () => void;
  onUpdate?: (id: string, field: string, value: unknown) => void;
  onRemove?: (id: string) => void;
}

/** Wall-clock triggers (VPT8's alarm-clock bank): at HH:MM, fire the cue list, cut to a
 *  scene preset, or recall a source-bank snapshot. Fires at most once per matching minute
 *  while enabled. */
export function TimerBank({ timers, presets, sourcePresets = [], onAdd, onUpdate, onRemove }: TimerBankProps) {
  const presetOptions = presets.map((p) => ({ value: p.id, label: p.name }));
  const sourceOptions = sourcePresets.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div id="timer-bank">
      <h3>Timers</h3>

      {timers.length === 0 && <div className="empty-note mono">no timers — add one below</div>}

      {timers.map((timer) => (
        <div className="timer-row" key={timer.id}>
          <ToggleSquare
            label="●"
            tone="live"
            title={timer.enabled ? "Armed" : "Disarmed"}
            active={!!timer.enabled}
            onClick={() => onUpdate?.(timer.id, "enabled", !timer.enabled)}
          />
          <TextField
            className="timer-time"
            value={timer.time ?? ""}
            placeholder="HH:MM"
            // Normalize to zero-padded HH:MM — the server compares against a padded clock
            // string, so "9:30" would never equal "09:30" and the timer would silently never
            // fire. Leaves anything that doesn't parse as H:MM untouched (still visible/editable).
            onCommit={(v) => onUpdate?.(timer.id, "time", normalizeHhmm(v))}
          />
          <Select
            ariaLabel="Timer action"
            value={timer.action ?? "cueGo"}
            options={[
              { value: "cueGo", label: "Cue GO" },
              { value: "recall", label: "Recall preset" },
              { value: "source", label: "Recall sources" },
            ]}
            onChange={(v) => onUpdate?.(timer.id, "action", v)}
          />
          {timer.action === "recall" && (
            <Select
              ariaLabel="Preset"
              value={timer.presetId ?? ""}
              options={presetOptions.length ? presetOptions : [{ value: "", label: "(no presets)" }]}
              onChange={(v) => onUpdate?.(timer.id, "presetId", v)}
            />
          )}
          {timer.action === "source" && (
            <Select
              ariaLabel="Source snapshot"
              value={timer.presetId ?? ""}
              options={sourceOptions.length ? sourceOptions : [{ value: "", label: "(no snapshots)" }]}
              onChange={(v) => onUpdate?.(timer.id, "presetId", v)}
            />
          )}
          <ToggleSquare className="remove-btn" label="×" title="Remove timer" onClick={() => onRemove?.(timer.id)} />
        </div>
      ))}

      <Button label="+ Add timer" onClick={onAdd} />
    </div>
  );
}
