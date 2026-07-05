import { ToggleSquare } from "./primitives/ToggleSquare";
import { Fader } from "./primitives/Fader";
import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { BLEND_MODES, type Layer } from "./types";

export interface LayerNeighbors {
  /** Whether a move toward the front / back of the stack is possible. */
  above: boolean;
  below: boolean;
}

export interface LayerStripProps {
  layer: Layer;
  neighbors: LayerNeighbors;
  onUpdate?: (field: string, value: unknown) => void;
  onMove?: (dir: "up" | "down") => void;
  onRemove?: () => void;
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** One layer as a mixer channel strip: index, reorder, name, source, blend, opacity,
 *  mask toggles, remove. */
export function LayerStrip({ layer, neighbors, onUpdate, onMove, onRemove }: LayerStripProps) {
  const isColor = layer.source?.type === "color";

  return (
    <div className="strip">
      <div className="idx mono">{String(layer.order ?? 0).padStart(2, "0")}</div>

      <div className="move-group">
        <ToggleSquare
          className="move-btn"
          label="▲"
          title="Move toward front"
          disabled={!neighbors.above}
          onClick={() => onMove?.("up")}
        />
        <ToggleSquare
          className="move-btn"
          label="▼"
          title="Move toward back"
          disabled={!neighbors.below}
          onClick={() => onMove?.("down")}
        />
      </div>

      <div className="meta">
        <TextField
          className="name-input"
          value={layer.name ?? ""}
          onCommit={(v) => onUpdate?.("name", v)}
        />
      </div>

      <div className="source-group">
        <Select
          className="source-type"
          value={layer.source?.type ?? "video"}
          options={[
            { value: "video", label: "Video URL" },
            { value: "color", label: "Solid color" },
          ]}
          onChange={(v) =>
            onUpdate?.(
              "source",
              v === "color"
                ? { type: "color", color: layer.source?.color ?? [0.5, 0.5, 0.5] }
                : { type: "video", url: layer.source?.url ?? "" },
            )
          }
        />
        <div className="source-field">
          {isColor ? (
            <input
              type="color"
              value={rgbToHex(layer.source.color ?? [0.5, 0.5, 0.5])}
              onChange={(e) => {
                const hex = e.target.value;
                const color = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
                  number,
                  number,
                  number,
                ];
                onUpdate?.("source", { type: "color", color });
              }}
            />
          ) : (
            <TextField
              value={layer.source?.url ?? ""}
              placeholder="/media/video.mp4"
              onCommit={(v) => onUpdate?.("source", { type: "video", url: v })}
            />
          )}
        </div>
      </div>

      <Select
        className="blend-select"
        value={layer.blendMode ?? "normal"}
        options={BLEND_MODES.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) }))}
        onChange={(v) => onUpdate?.("blendMode", v)}
      />

      <div className="opacity-field">
        <Fader
          value={layer.opacity ?? 1}
          ariaLabel="Layer opacity"
          onChange={(v) => onUpdate?.("opacity", v)}
        />
        <span className="opacity-val mono">{Math.round((layer.opacity ?? 1) * 100)}%</span>
      </div>

      <div className="toggles">
        <ToggleSquare
          label="M"
          title="Mask"
          active={!!layer.mask?.enabled}
          onClick={() => onUpdate?.("mask", { ...layer.mask, enabled: !layer.mask?.enabled })}
        />
        <ToggleSquare
          label={layer.mask?.shape === "rect" ? "□" : "○"}
          title="Mask shape"
          onClick={() =>
            onUpdate?.("mask", {
              ...layer.mask,
              shape: layer.mask?.shape === "rect" ? "ellipse" : "rect",
            })
          }
        />
        <ToggleSquare className="remove-btn" label="×" title="Remove layer" onClick={onRemove} />
      </div>
    </div>
  );
}
