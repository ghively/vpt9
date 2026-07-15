import type { Preset } from "../types";

export interface LookBarProps {
  /** Scene presets in insertion order — chip N recalls looks[N-1], matching the 1-9
   *  keyboard shortcuts the container installs. */
  looks: Preset[];
  onRecall?: (id: string) => void;
  /** Snapshot the current scene as a new look (the container names it "Look N"). */
  onSave?: () => void;
  /** Focus mode (VDMX's closable-inspectors pattern): hide the rails/drawer so the
   *  stage + looks are the whole surface during the show. */
  focus?: boolean;
  onToggleFocus?: () => void;
  /** While blind, recalls/saves happen off-air — tint the bar amber to say so. */
  blind?: boolean;
}

/** The look bar — Resolume's deck-switching idea in preset form: the whole scene
 *  (layers/screens/pip) banked behind one chip, recallable by a single click or its
 *  number key mid-show. Sits directly above the stage so firing a look and watching it
 *  land are one glance. Deeper preset management (rename/delete) stays in the Show
 *  drawer's Presets tab; this strip is deliberately trigger-only — grandMA's "executors
 *  vs. programmer" split — so nothing here can destroy a look during a show. */
export function LookBar({ looks, onRecall, onSave, focus = false, onToggleFocus, blind = false }: LookBarProps) {
  return (
    <div className="lookbar" data-blind={blind}>
      <span className="lookbar__label label">Looks</span>
      <div className="lookbar__chips">
        {looks.length === 0 && <span className="lookbar__empty mono">none saved — build a look, press save</span>}
        {looks.map((look, i) => (
          <button
            key={look.id}
            type="button"
            className="look-chip"
            title={i < 9 ? `Recall (key ${i + 1})` : "Recall"}
            onClick={() => onRecall?.(look.id)}
          >
            {i < 9 && <span className="look-chip__key mono">{i + 1}</span>}
            <span className="look-chip__name">{look.name}</span>
          </button>
        ))}
        <button type="button" className="look-save mono" title="Snapshot the current scene as a new look" onClick={() => onSave?.()}>
          + save
        </button>
      </div>
      <button
        type="button"
        className="look-focus mono"
        aria-pressed={focus}
        title={focus ? "Show the rails again (F)" : "Hide rails/drawer — stage + looks only (F)"}
        onClick={() => onToggleFocus?.()}
      >
        {focus ? "exit focus" : "focus"}
      </button>
    </div>
  );
}
