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

/** Picks the one "playback owner" screen. Audio was removed, but this screen still drives
 *  playlist advance (clip-ended relay), transport/scrub telemetry, and camera record — so
 *  on a multi-screen show it must be set to a screen that actually shows the routed content,
 *  or those go dead. (Was mislabeled "Audio on:".) */
export function AudioOwner({ screens, ownerId, onSelect }: AudioOwnerProps) {
  return (
    <div id="audio-owner" title="Screen that drives playlist advance, transport telemetry, and camera record">
      <span className="label">Playback:&nbsp;</span>
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
