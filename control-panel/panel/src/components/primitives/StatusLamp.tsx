import type { ConnectionState } from "../types";

export interface StatusLampProps {
  /** Drives the faceplate lamp colour: green / amber / red. */
  state: ConnectionState;
  /** Readout text, e.g. "connected · ws://localhost:8080". */
  label: string;
}

/** The faceplate status readout — a mono line preceded by a state-coloured lamp. */
export function StatusLamp({ state, label }: StatusLampProps) {
  return (
    <div id="status" data-state={state}>
      {label}
    </div>
  );
}
