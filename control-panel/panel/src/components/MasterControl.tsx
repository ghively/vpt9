import { Fader } from "./primitives/Fader";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { useFaderEcho } from "./primitives/useFaderEcho";

export interface MasterControlProps {
  /** Master output dim: 0 = blackout, 1 = full. */
  master: number;
  onChange?: (value: number) => void;
  /** Drag guard (App's isDraggingRef): suppress store re-renders for the fader drag. */
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** Toggle blackout (container remembers/restores the pre-blackout level). */
  onToggleBlackout?: () => void;
  /** Blind / preview mode (task A20 + true blind editing): the projector freezes on its
   *  last frame while the confidence preview keeps updating live. While blind, the
   *  toggle splits into GO LIVE (commit the off-air edits) and DISCARD (restore the
   *  pre-blind look) — the lighting-console Blind / switcher preview-program pattern. */
  blind?: boolean;
  onToggleBlind?: () => void;
  /** Abandon the blind session: revert to what was live when blind was engaged. */
  onDiscardBlind?: () => void;
}

/** The house master: a dim fader + hard blackout toggle + the BLIND / GO LIVE / DISCARD
 *  cluster on the faceplate. Deliberately outside preset snapshots — recalls and cue
 *  fades never move master/blackout/blind. */
export function MasterControl({ master, onChange, onDragStart, onDragEnd, onToggleBlackout, blind = false, onToggleBlind, onDiscardBlind }: MasterControlProps) {
  const blackout = master <= 0;
  const drag = useFaderEcho(onChange, onDragStart, onDragEnd);
  return (
    <div id="master-control" data-blackout={blackout} data-blind={blind}>
      <span className="label">Master</span>
      <Fader value={master} ariaLabel="Master output level" onChange={drag.onChange} onDragStart={drag.onDragStart} onDragEnd={drag.onDragEnd} />
      <span className="master-val mono">{Math.round((drag.echo ?? master) * 100)}%</span>
      {blind ? (
        <>
          <ToggleSquare
            className="blind-btn golive-btn"
            label="GO LIVE"
            active
            title="Commit: unfreeze the wall onto everything built while blind"
            onClick={onToggleBlind}
          />
          <ToggleSquare
            className="blind-btn discard-btn"
            label="DISCARD"
            title="Abandon: restore what was live when BLIND was engaged"
            onClick={onDiscardBlind}
          />
        </>
      ) : (
        <ToggleSquare
          className="blind-btn"
          label="BLIND"
          title="Freeze the wall; build the next look off-air, then GO LIVE or DISCARD"
          onClick={onToggleBlind}
        />
      )}
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
