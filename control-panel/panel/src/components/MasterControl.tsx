import { Fader } from "./primitives/Fader";
import { ToggleSquare } from "./primitives/ToggleSquare";

export interface MasterControlProps {
  /** Master output dim: 0 = blackout, 1 = full. */
  master: number;
  onChange?: (value: number) => void;
  /** Toggle blackout (container remembers/restores the pre-blackout level). */
  onToggleBlackout?: () => void;
  /** Blind / preview mode (task A20): the projector freezes on its last frame while the
   *  confidence preview keeps updating live. Distinct from blackout. */
  blind?: boolean;
  onToggleBlind?: () => void;
}

/** The house master: a dim fader + hard blackout toggle + a BLIND (preview) toggle on the
 *  faceplate. Deliberately outside preset snapshots — recalls and cue fades never move
 *  master/blackout/blind. */
export function MasterControl({ master, onChange, onToggleBlackout, blind = false, onToggleBlind }: MasterControlProps) {
  const blackout = master <= 0;
  return (
    <div id="master-control" data-blackout={blackout} data-blind={blind}>
      <span className="label">Master</span>
      <Fader value={master} ariaLabel="Master output level" onChange={onChange} />
      <span className="master-val mono">{Math.round(master * 100)}%</span>
      <ToggleSquare
        className="blind-btn"
        label="BLIND"
        active={blind}
        title={blind ? "Resume live output (projector is frozen)" : "Freeze projector output; keep building off-air"}
        onClick={onToggleBlind}
      />
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
