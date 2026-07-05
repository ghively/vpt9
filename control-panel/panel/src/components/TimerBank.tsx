import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import type { Timer, Preset } from "./types";

export interface TimerBankProps {
  timers: Timer[];
  presets: Preset[];
  onAdd?: () => void;
  onUpdate?: (id: string, field: string, value: unknown) => void;
  onRemove?: (id: string) => void;
}

/** Wall-clock triggers (VPT8's alarm-clock bank): at HH:MM, fire the cue list or cut
 *  to a preset. Fires at most once per matching minute while enabled. */
export function TimerBank({ timers, presets, onAdd, onUpdate, onRemove }: TimerBankProps) {
  const presetOptions = presets.map((p) => ({ value: p.id, label: p.name }));

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
            onCommit={(v) => onUpdate?.(timer.id, "time", v)}
          />
          <Select
            value={timer.action ?? "cueGo"}
            options={[
              { value: "cueGo", label: "Cue GO" },
              { value: "recall", label: "Recall preset" },
            ]}
            onChange={(v) => onUpdate?.(timer.id, "action", v)}
          />
          {timer.action === "recall" && (
            <Select
              value={timer.presetId ?? ""}
              options={presetOptions.length ? presetOptions : [{ value: "", label: "(no presets)" }]}
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
