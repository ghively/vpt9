import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { TargetField } from "./primitives/TargetField";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import type { Cue, Preset, TargetOption } from "./types";

export interface CueListProps {
  cues: Cue[];
  /** Index of the cue the interpreter last executed (-1 = before the top). */
  cursor: number;
  running: boolean;
  presets: Preset[];
  /** Source-bank snapshots (A16) — the `source` cue recalls one of these. */
  sourcePresets?: Preset[];
  /** Numeric state paths for the `paramFade` path picker (A16). */
  targetOptions?: TargetOption[];
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
  { value: "source", label: "Recall sources" },
  { value: "paramFade", label: "Fade parameter" },
  { value: "osc", label: "Send OSC" },
  { value: "wait", label: "Wait" },
  { value: "goto", label: "Go to cue #" },
];

let cueCounter = 0;

/** Parse the comma-separated OSC-args field: numeric tokens become numbers, the rest
 *  stay strings (so "/go, 1, cue" → ["go" is the address elsewhere], [1, "cue"]). */
function parseOscArgs(text: string): Array<number | string> {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => {
      const n = Number(s);
      return Number.isFinite(n) && /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s) ? n : s;
    });
}

/** The sequential cue-list editor + transport — the modern face of VPT8's cuelist
 *  script interpreter. The tungsten row marker tracks the interpreter's cursor. */
export function CueList({ cues, cursor, running, presets, sourcePresets, targetOptions, onGo, onStop, onJump, onSetCues }: CueListProps) {
  const presetOptions = presets.map((p) => ({ value: p.id, label: p.name }));
  const sourceOptions = (sourcePresets ?? []).map((p) => ({ value: p.id, label: p.name }));

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
        autoContinue: false,
        path: "",
        from: 0,
        to: 1,
        address: "/",
        args: [],
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
          <TextField value={cue.label ?? ""} placeholder="Label" ariaLabel="Cue label" onCommit={(v) => patchCue(index, { label: v })} />
          <Select
            ariaLabel="Cue type"
            value={cue.type}
            options={CUE_TYPES}
            onChange={(v) => patchCue(index, { type: v as Cue["type"] })}
          />
          {(cue.type === "recall" || cue.type === "fade") && (
            <Select
              ariaLabel="Preset"
              value={cue.presetId ?? ""}
              options={presetOptions.length ? presetOptions : [{ value: "", label: "(no presets)" }]}
              onChange={(v) => patchCue(index, { presetId: v })}
            />
          )}
          {cue.type === "source" && (
            <Select
              ariaLabel="Source snapshot"
              value={cue.presetId ?? ""}
              options={sourceOptions.length ? sourceOptions : [{ value: "", label: "(no snapshots)" }]}
              onChange={(v) => patchCue(index, { presetId: v })}
            />
          )}
          {(cue.type === "fade" || cue.type === "wait" || cue.type === "paramFade") && (
            <TextField
              className="cue-num"
              value={String(cue.seconds ?? 0)}
              placeholder="sec"
              ariaLabel="Duration (seconds)"
              inputMode="decimal"
              onCommit={(v) => patchCue(index, { seconds: Math.max(0, Number(v) || 0) })}
            />
          )}
          {cue.type === "paramFade" && (
            <>
              <TargetField
                className="cue-target"
                value={cue.path ?? ""}
                targetOptions={targetOptions}
                onChange={(v) => patchCue(index, { path: v })}
              />
              <TextField
                className="cue-num"
                value={String(cue.from ?? 0)}
                placeholder="from"
                ariaLabel="Fade from value"
                inputMode="decimal"
                onCommit={(v) => patchCue(index, { from: Number(v) || 0 })}
              />
              <TextField
                className="cue-num"
                value={String(cue.to ?? 0)}
                placeholder="to"
                ariaLabel="Fade to value"
                inputMode="decimal"
                onCommit={(v) => patchCue(index, { to: Number(v) || 0 })}
              />
            </>
          )}
          {cue.type === "osc" && (
            <>
              <TextField
                value={cue.address ?? "/"}
                placeholder="/osc/address"
                ariaLabel="OSC address"
                onCommit={(v) => patchCue(index, { address: v })}
              />
              <TextField
                value={(cue.args ?? []).join(", ")}
                placeholder="args (comma-sep)"
                ariaLabel="OSC arguments (comma-separated)"
                onCommit={(v) => patchCue(index, { args: parseOscArgs(v) })}
              />
            </>
          )}
          {cue.type === "goto" && (
            <TextField
              className="cue-num"
              value={String(cue.target ?? 0)}
              placeholder="cue #"
              ariaLabel="Go to cue number"
              inputMode="numeric"
              onCommit={(v) => patchCue(index, { target: Math.max(0, Math.trunc(Number(v) || 0)) })}
            />
          )}
          <ToggleSquare
            className="cue-follow"
            label="+"
            title={cue.autoContinue ? "Auto-follow: chains to the next cue" : "Hold: waits for GO"}
            active={!!cue.autoContinue}
            onClick={() => patchCue(index, { autoContinue: !cue.autoContinue })}
          />
          <ToggleSquare className="remove-btn" label="×" title="Remove cue" onClick={() => removeCue(index)} />
        </div>
      ))}

      <Button label="+ Add cue" onClick={addCue} />
    </div>
  );
}
