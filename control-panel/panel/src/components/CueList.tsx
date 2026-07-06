import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import type { Cue, Preset } from "./types";

export interface CueListProps {
  cues: Cue[];
  /** Index of the cue the interpreter last executed (-1 = before the top). */
  cursor: number;
  running: boolean;
  presets: Preset[];
  onGo?: () => void;
  onStop?: () => void;
  /** Arm the list so the NEXT go runs cues[index]. */
  onJump?: (index: number) => void;
  /** Cue edits replace the whole list (it's one state leaf: "automation.cues"). */
  onSetCues?: (cues: Cue[]) => void;
}

const CUE_TYPES = [
  { value: "recall", label: "Cut to preset" },
  { value: "fade", label: "Fade to preset" },
  { value: "wait", label: "Wait" },
  { value: "goto", label: "Go to cue #" },
];

let cueCounter = 0;

/** The sequential cue-list editor + transport — the modern face of VPT8's cuelist
 *  script interpreter. The tungsten row marker tracks the interpreter's cursor. */
export function CueList({ cues, cursor, running, presets, onGo, onStop, onJump, onSetCues }: CueListProps) {
  const presetOptions = presets.map((p) => ({ value: p.id, label: p.name }));

  const patchCue = (index: number, patch: Partial<Cue>) => {
    onSetCues?.(cues.map((cue, i) => (i === index ? { ...cue, ...patch } : cue)));
  };

  const addCue = () => {
    cueCounter += 1;
    onSetCues?.([
      ...cues,
      {
        id: `cue-${Date.now()}-${cueCounter}`,
        label: `Cue ${cues.length + 1}`,
        type: "recall",
        presetId: presets[0]?.id,
        seconds: 5,
        target: 0,
      },
    ]);
  };

  const removeCue = (index: number) => {
    onSetCues?.(cues.filter((_, i) => i !== index));
  };

  // What the next GO will run — the transport readout's whole job.
  const nextIndex = cursor + 1;
  const nextCue = cues[nextIndex];

  return (
    <div id="cue-list">
      <div className="panel-head">
        <h3>Cue list</h3>
      </div>

      <div className="transport">
        <button className="go-btn mono" onClick={onGo} data-running={running}>
          GO
        </button>
        <button className="stop-btn mono" onClick={onStop}>
          STOP
        </button>
        <div className="transport-readout mono" data-running={running}>
          <span className="transport-state">{running ? "RUNNING" : "STANDBY"}</span>
          <span className="transport-next">
            {nextCue
              ? `next ${String(nextIndex).padStart(2, "0")} — ${nextCue.label || nextCue.type}`
              : cues.length
                ? "end of list"
                : "no cues"}
          </span>
        </div>
      </div>

      {cues.length === 0 && <div className="empty-note mono">no cues — add one below</div>}

      {cues.map((cue, index) => (
        <div className="cue-row" key={cue.id} data-current={index === cursor}>
          <button
            className="cue-idx mono"
            title="Arm: next GO starts here"
            onClick={() => onJump?.(index)}
          >
            {String(index).padStart(2, "0")}
          </button>
          <TextField value={cue.label ?? ""} placeholder="Label" onCommit={(v) => patchCue(index, { label: v })} />
          <Select
            value={cue.type}
            options={CUE_TYPES}
            onChange={(v) => patchCue(index, { type: v as Cue["type"] })}
          />
          {(cue.type === "recall" || cue.type === "fade") && (
            <Select
              value={cue.presetId ?? ""}
              options={presetOptions.length ? presetOptions : [{ value: "", label: "(no presets)" }]}
              onChange={(v) => patchCue(index, { presetId: v })}
            />
          )}
          {(cue.type === "fade" || cue.type === "wait") && (
            <TextField
              className="cue-num"
              value={String(cue.seconds ?? 0)}
              placeholder="sec"
              onCommit={(v) => patchCue(index, { seconds: Math.max(0, Number(v) || 0) })}
            />
          )}
          {cue.type === "goto" && (
            <TextField
              className="cue-num"
              value={String(cue.target ?? 0)}
              placeholder="cue #"
              onCommit={(v) => patchCue(index, { target: Math.max(0, Math.trunc(Number(v) || 0)) })}
            />
          )}
          <ToggleSquare className="remove-btn" label="×" title="Remove cue" onClick={() => removeCue(index)} />
        </div>
      ))}

      <Button label="+ Add cue" onClick={addCue} />
    </div>
  );
}
