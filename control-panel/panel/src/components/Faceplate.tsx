import type { ReactNode } from "react";

export interface FaceplateProps {
  /** Center slot — the audio-owner picker in the app. */
  center?: ReactNode;
  /** Right slot — the status readout in the app. */
  right?: ReactNode;
}

/** The equipment faceplate: nameplate + breathing power lamp on the left, with center
 *  and right slots for the audio-owner picker and status readout. */
export function Faceplate({ center, right }: FaceplateProps) {
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
      </div>
      {center}
      {right}
    </header>
  );
}
