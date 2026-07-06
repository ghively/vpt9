import { Fader } from "./primitives/Fader";
import { ToggleSquare } from "./primitives/ToggleSquare";

export interface MasterControlProps {
  /** Master output dim: 0 = blackout, 1 = full. */
  master: number;
  onChange?: (value: number) => void;
  /** Toggle blackout (container remembers/restores the pre-blackout level). */
  onToggleBlackout?: () => void;
}

/** The house master: a dim fader + hard blackout toggle on the faceplate. Deliberately
 *  outside preset snapshots — recalls and cue fades never move it. */
export function MasterControl({ master, onChange, onToggleBlackout }: MasterControlProps) {
  const blackout = master <= 0;
  return (
    <div id="master-control" data-blackout={blackout}>
      <span className="label">Master</span>
      <Fader value={master} ariaLabel="Master output level" onChange={onChange} />
      <span className="master-val mono">{Math.round(master * 100)}%</span>
      <ToggleSquare
        className="blackout-btn"
        label="BLACKOUT"
        tone="live"
        active={blackout}
        title={blackout ? "Restore output" : "Cut all output to black"}
        onClick={onToggleBlackout}
      />
    </div>
  );
}
