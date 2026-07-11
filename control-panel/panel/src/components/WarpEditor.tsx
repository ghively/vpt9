import { forwardRef, useEffect, useState } from "react";
import { Chip } from "./primitives/Chip";
import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { Button } from "./primitives/Button";
import { ConfidenceMonitor, type ConfidenceMonitorHandle } from "./ConfidenceMonitor";
import { WarpHandle } from "./WarpHandle";
import { MaskShapeOverlay } from "./MaskShapeOverlay";
import type { Layer, Point, Screen } from "./types";

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
  /** When set, the stage edits this layer's mask shape instead of warp handles. */
  maskEditLayer?: Layer | null;
  onMaskChange?: (field: string, value: unknown) => void;
  onMaskEditDone?: () => void;
  /** When set, the stage edits this layer's own corner-pin/mesh warp instead of the
   *  selected screen's. */
  warpEditLayer?: Layer | null;
  onLayerSetMode?: (mode: "corner" | "mesh") => void;
  onLayerSetMeshSize?: (size: number) => void;
  onLayerResetWarp?: () => void;
  onLayerMovePoint?: (index: number, x: number, y: number) => void;
  onWarpEditDone?: () => void;
}

const MESH_SIZES = [3, 4, 6, 8].map((n) => ({ value: String(n), label: `${n}×${n}` }));
const CORNER_TAGS = ["TL", "TR", "BR", "BL"]; // index order matches the identity corners

function CoordInput({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n)) onCommit(Math.min(1, Math.max(0, n)));
  };
  return (
    <label className="warp-coord-field mono">
      {label}
      <input
        type="number"
        step="0.001"
        min={0}
        max={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
    </label>
  );
}

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
      maskEditLayer,
      onMaskChange,
      onMaskEditDone,
      warpEditLayer,
      onLayerSetMode,
      onLayerSetMeshSize,
      onLayerResetWarp,
      onLayerMovePoint,
      onWarpEditDone,
    },
    ref,
  ) {
    const activeWarp = warpEditLayer ? warpEditLayer.warp : screen?.warp;
    const isMesh = activeWarp?.mode === "mesh";
    const points: Point[] = isMesh ? activeWarp?.mesh.points ?? [] : activeWarp?.corners ?? [];
    const size = activeWarp?.mesh.size ?? 4;
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    // Reset the selection synchronously during render (not in a useEffect) when the point set
    // changes identity — e.g. mesh resize or corner/mesh mode switch. A useEffect runs AFTER
    // render, so for one frame the old index could still be in-bounds of the new points[] and
    // read a different point's data (stale highlight + coord row). This is React's documented
    // "adjusting state when a prop changes" pattern: track the previous trigger values in state
    // (not a ref — a ref mutated during render doesn't replay correctly under StrictMode's
    // dev-mode double-render) and call setState directly, before the JSX below reads `selected`.
    const resetKey = `${warpEditLayer ? `layer:${warpEditLayer.id}` : `screen:${screen?.id ?? ""}`}|${activeWarp?.mode ?? ""}|${size}`;
    const [prevResetKey, setPrevResetKey] = useState(resetKey);
    if (prevResetKey !== resetKey) {
      setPrevResetKey(resetKey);
      if (selectedPoint !== null) setSelectedPoint(null);
    }
    const selected = selectedPoint != null && selectedPoint < points.length ? points[selectedPoint] : null;
    const selectedLabel =
      selectedPoint == null ? "" : isMesh ? `R${Math.floor(selectedPoint / size) + 1}·C${(selectedPoint % size) + 1}` : CORNER_TAGS[selectedPoint];

    return (
      <div id="warp-editor">
        {maskEditLayer && (
          <div className="mask-edit-banner">
            <span className="mono">Editing mask — {maskEditLayer.name || maskEditLayer.id}</span>
            <Button label="Done" onClick={onMaskEditDone} />
          </div>
        )}
        {warpEditLayer && (
          <div className="mask-edit-banner">
            <span className="mono">Editing warp — {warpEditLayer.name || warpEditLayer.id}</span>
            <Button label="Done" onClick={onWarpEditDone} />
          </div>
        )}
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
          <Chip
            label="Corner pin"
            active={activeWarp?.mode !== "mesh"}
            onClick={() => (warpEditLayer ? onLayerSetMode : onSetMode)?.("corner")}
          />
          <Chip
            label="Mesh"
            active={activeWarp?.mode === "mesh"}
            onClick={() => (warpEditLayer ? onLayerSetMode : onSetMode)?.("mesh")}
          />
          {isMesh && (
            <Select
              className="mesh-size-select"
              value={String(activeWarp?.mesh.size ?? 4)}
              options={MESH_SIZES}
              onChange={(v) => (warpEditLayer ? onLayerSetMeshSize : onSetMeshSize)?.(Number(v))}
            />
          )}
          <Chip label="Reset" onClick={() => (warpEditLayer ? onLayerResetWarp : onReset)?.()} />
        </div>
        <ConfidenceMonitor ref={ref} previewFrame={previewFrame}>
          {maskEditLayer ? (
            <MaskShapeOverlay
              mask={maskEditLayer.mask}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onChange={(patch) => {
                for (const [k, v] of Object.entries(patch)) onMaskChange?.(`mask.${k}`, v);
              }}
            />
          ) : (
            points.map((p, i) => (
              <WarpHandle
                key={i}
                x={p.x}
                y={p.y}
                selected={i === selectedPoint}
                cornerTag={isMesh ? undefined : CORNER_TAGS[i]}
                coordTag={isMesh ? `R${Math.floor(i / size) + 1}·C${(i % size) + 1}` : undefined}
                onSelect={() => setSelectedPoint(i)}
                onDragStart={onDragStart}
                onDragTo={(x, y) => (warpEditLayer ? onLayerMovePoint : onMovePoint)?.(i, x, y)}
                onDragEnd={onDragEnd}
              />
            ))
          )}
        </ConfidenceMonitor>
        {selected && !maskEditLayer && (
          <div className="warp-coord-entry">
            <span className="warp-coord-tag mono">{selectedLabel}</span>
            <CoordInput
              label="X"
              value={selected.x}
              onCommit={(x) => (warpEditLayer ? onLayerMovePoint : onMovePoint)?.(selectedPoint!, x, selected.y)}
            />
            <CoordInput
              label="Y"
              value={selected.y}
              onCommit={(y) => (warpEditLayer ? onLayerMovePoint : onMovePoint)?.(selectedPoint!, selected.x, y)}
            />
          </div>
        )}
      </div>
    );
  },
);
