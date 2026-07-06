import { forwardRef } from "react";
import { Chip } from "./primitives/Chip";
import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { ConfidenceMonitor, type ConfidenceMonitorHandle } from "./ConfidenceMonitor";
import { WarpHandle } from "./WarpHandle";
import type { Point, Screen } from "./types";

export interface WarpEditorProps {
  /** The screen being warped (undefined until one is selected). */
  screen?: Screen;
  /** All screens, for the selector tabs. */
  screens: Screen[];
  previewFrame?: string;
  onSelectScreen?: (id: string) => void;
  /** Creates the next screen-N (a render client addresses it via ?screen=<id>). */
  onAddScreen?: () => void;
  onRenameScreen?: (name: string) => void;
  onSetMode?: (mode: "corner" | "mesh") => void;
  /** Mesh density change — resets the mesh points to identity at the new size. */
  onSetMeshSize?: (size: number) => void;
  onReset?: () => void;
  onDragStart?: () => void;
  onMovePoint?: (index: number, x: number, y: number) => void;
  onDragEnd?: () => void;
}

const MESH_SIZES = [3, 4, 6, 8].map((n) => ({ value: String(n), label: `${n}×${n}` }));

/** Corner-pin / mesh warp editor over the confidence monitor. The forwarded ref reaches
 *  the monitor so the container can push preview frames into it. */
export const WarpEditor = forwardRef<ConfidenceMonitorHandle, WarpEditorProps>(
  function WarpEditor(
    {
      screen,
      screens,
      previewFrame,
      onSelectScreen,
      onAddScreen,
      onRenameScreen,
      onSetMode,
      onSetMeshSize,
      onReset,
      onDragStart,
      onMovePoint,
      onDragEnd,
    },
    ref,
  ) {
    const warp = screen?.warp;
    const isMesh = warp?.mode === "mesh";
    const points: Point[] = isMesh ? warp?.mesh.points ?? [] : warp?.corners ?? [];

    return (
      <div id="warp-editor">
        <div className="panel-head">
          <h3>Warp</h3>
          <div className="mode-group">
            {screens.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                active={s.id === screen?.id}
                onClick={() => onSelectScreen?.(s.id)}
              />
            ))}
            {onAddScreen && <Chip label="+" onClick={onAddScreen} />}
          </div>
        </div>
        {screen && (
          <div className="screen-name-row">
            <TextField
              className="screen-name-input"
              value={screen.name ?? ""}
              placeholder="Screen name"
              onCommit={(v) => onRenameScreen?.(v)}
            />
            <span className="screen-id mono">{screen.id}</span>
          </div>
        )}
        <div className="mode-group">
          <Chip label="Corner pin" active={warp?.mode !== "mesh"} onClick={() => onSetMode?.("corner")} />
          <Chip label="Mesh" active={warp?.mode === "mesh"} onClick={() => onSetMode?.("mesh")} />
          {isMesh && (
            <Select
              className="mesh-size-select"
              value={String(warp?.mesh.size ?? 4)}
              options={MESH_SIZES}
              onChange={(v) => onSetMeshSize?.(Number(v))}
            />
          )}
          <Chip label="Reset" onClick={onReset} />
        </div>
        <ConfidenceMonitor ref={ref} previewFrame={previewFrame}>
          {points.map((p, i) => (
            <WarpHandle
              key={i}
              x={p.x}
              y={p.y}
              onDragStart={onDragStart}
              onDragTo={(x, y) => onMovePoint?.(i, x, y)}
              onDragEnd={onDragEnd}
            />
          ))}
        </ConfidenceMonitor>
      </div>
    );
  },
);
