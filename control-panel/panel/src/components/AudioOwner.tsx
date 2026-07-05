import { Chip } from "./primitives/Chip";

export interface AudioOwnerScreen {
  id: string;
  name: string;
}

export interface AudioOwnerProps {
  screens: AudioOwnerScreen[];
  /** The single screen currently allowed to un-mute; null if none. */
  ownerId: string | null;
  onSelect?: (screenId: string) => void;
}

/** Picks the one screen that owns audio (every other render client mutes itself). */
export function AudioOwner({ screens, ownerId, onSelect }: AudioOwnerProps) {
  return (
    <div id="audio-owner">
      <span className="label">Audio on:&nbsp;</span>
      {screens.map((s) => (
        <Chip
          key={s.id}
          label={s.name}
          active={ownerId === s.id}
          onClick={() => onSelect?.(s.id)}
        />
      ))}
    </div>
  );
}
