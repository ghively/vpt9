import { forwardRef } from "react";
import { ConfidenceMonitor, type ConfidenceMonitorHandle } from "./ConfidenceMonitor";
import { PipBox } from "./PipBox";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { TextField } from "./primitives/TextField";
import { Button } from "./primitives/Button";
import type { Pip } from "./types";

export interface PipWindowsProps {
  screenId: string;
  /** PiP windows belonging to this screen. */
  pips: Pip[];
  previewFrame?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onUpdatePip?: (id: string, field: string, value: unknown) => void;
  onMovePip?: (id: string, x: number, y: number) => void;
  onResizePip?: (id: string, width: number, height: number) => void;
  onRemovePip?: (id: string) => void;
  onAddPip?: () => void;
}

/** Manages the PiP (cast) windows for a screen: a monitor with draggable boxes plus a
 *  row of controls per window. */
export const PipWindows = forwardRef<ConfidenceMonitorHandle, PipWindowsProps>(
  function PipWindows(
    { screenId, pips, previewFrame, onDragStart, onDragEnd, onUpdatePip, onMovePip, onResizePip, onRemovePip, onAddPip },
    ref,
  ) {
    return (
      <div id="pip-manager">
        <h3>Windows — {screenId}</h3>
        <ConfidenceMonitor ref={ref} previewFrame={previewFrame}>
          {pips.map((pip) => (
            <PipBox
              key={pip.id}
              pip={pip}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onMove={(x, y) => onMovePip?.(pip.id, x, y)}
              onResize={(w, h) => onResizePip?.(pip.id, w, h)}
            />
          ))}
        </ConfidenceMonitor>

        {pips.map((pip) => (
          <div className="pip-row" key={pip.id}>
            <ToggleSquare
              label="V"
              title="Visible"
              active={!!pip.visible}
              onClick={() => onUpdatePip?.(pip.id, "visible", !pip.visible)}
            />
            <TextField
              value={pip.title ?? ""}
              placeholder="Title"
              onCommit={(v) => onUpdatePip?.(pip.id, "title", v)}
            />
            <TextField
              value={pip.videoId ?? ""}
              placeholder="YouTube video ID"
              onCommit={(v) => onUpdatePip?.(pip.id, "videoId", v)}
            />
            <ToggleSquare label="×" title="Remove window" onClick={() => onRemovePip?.(pip.id)} />
          </div>
        ))}

        <Button label="+ Add window" onClick={onAddPip} />
      </div>
    );
  },
);
