import type { Screen } from "./types";

export interface ScreenSelectProps {
  screens: Screen[];
  /** Which screen the Stage previews/edits right now; null before the first screen
   *  arrives from the server. */
  selectedId: string | null;
  onSelect: (screenId: string) => void;
  onAdd: () => void;
}

/** Active-screen picker on the command bar — which screen the Stage previews and (once
 *  wired) edits. Distinct from `AudioOwner` ("AUDIO ON"), which picks the one screen
 *  allowed to un-mute; this picks which screen YOU are looking at/working on. Multiple
 *  screens can exist with a single audio owner, so the two pickers can disagree. */
export function ScreenSelect({ screens, selectedId, onSelect, onAdd }: ScreenSelectProps) {
  return (
    <div className="screen-select">
      <div className="seg" role="group" aria-label="Screen">
        {screens.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={selectedId === s.id}
            onClick={() => onSelect(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <button type="button" className="screen-select-add" onClick={onAdd} title="Add screen">
        +
      </button>
    </div>
  );
}
