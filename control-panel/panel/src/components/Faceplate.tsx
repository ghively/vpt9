import type { ReactNode } from "react";

export interface FaceplateProps {
  /** Screen-select slot — sits beside the wordmark, e.g. the active-screen segment.
   *  Kept separate from `center` (the audio-owner picker is a different concept: which
   *  screen plays audio vs. which screen you're viewing/editing). */
  screenSelect?: ReactNode;
  /** Center slot — the audio-owner picker in the app. */
  center?: ReactNode;
  /** Right slot — the status readout in the app. */
  right?: ReactNode;
}

/** The equipment faceplate: nameplate + breathing power lamp on the left (with an
 *  optional screen-select segment beside it), center and right slots for the
 *  audio-owner picker and status readout. */
export function Faceplate({ screenSelect, center, right }: FaceplateProps) {
  return (
    <header>
      <div className="nameplate">
        <span className="lamp" aria-hidden="true" />
        <span className="wordmark">
          <b>VPT</b>
          <span className="sep">/</span>
          roomcast
          <span className="desc"> control</span>
        </span>
        {screenSelect}
      </div>
      {center}
      {right}
    </header>
  );
}
