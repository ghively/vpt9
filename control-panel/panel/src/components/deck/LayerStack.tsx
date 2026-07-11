import type { PanelActions } from "../../app/actions";
import { ToggleSquare } from "../primitives/ToggleSquare";
import type { Layer } from "../types";

export interface LayerStackProps {
  /** Pre-sorted top-of-stack-first by the caller (App) — index 0 renders first/topmost. */
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  actions: PanelActions;
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Compact left-rail layer list: a color swatch (or gradient placeholder) thumbnail,
 *  name, blend/index meta, and an opacity bar per layer. Rows are selectable (driving
 *  the stage handles + inspector in later tasks) and carry reorder/remove affordances
 *  that call straight into the existing `actions` write path — no new message types. */
export function LayerStack({ layers, selectedId, onSelect, actions }: LayerStackProps) {
  return (
    <>
      <div className="sec-head label">
        Layer stack
        <span className="count mono">top first</span>
      </div>
      <div className="layers">
        {layers.map((layer, i) => {
          const isColor = layer.source?.type === "color";
          const thumbBg = isColor
            ? rgbToHex(layer.source?.color ?? [0.5, 0.5, 0.5])
            : "linear-gradient(135deg,#12283b,#0c1620)";
          const opacityPct = Math.round((layer.opacity ?? 1) * 100);
          const stackIndex = layers.length - i;
          const isSelected = layer.id === selectedId;

          return (
            <div key={layer.id} className="layer" data-selected={isSelected}>
              <button
                type="button"
                className="layer-hit"
                aria-selected={isSelected}
                onClick={() => onSelect(layer.id)}
              >
                <span className="thumb" style={{ background: thumbBg }} />
                <span className="layer-info">
                  <span className="nm">{layer.name}</span>
                  <span className="meta">
                    {layer.blendMode ?? "normal"} · L{stackIndex}
                  </span>
                </span>
                <span className="layer-op">
                  <span className="op mono">{opacityPct}%</span>
                  <span className="opbar">
                    <i style={{ width: `${opacityPct}%` }} />
                  </span>
                </span>
              </button>
              <div className="layer-ops">
                <ToggleSquare
                  className="move-btn"
                  label="▲"
                  title="Move toward front"
                  disabled={i === 0}
                  onClick={() => actions.moveLayer(layer.id, "up")}
                />
                <ToggleSquare
                  className="move-btn"
                  label="▼"
                  title="Move toward back"
                  disabled={i === layers.length - 1}
                  onClick={() => actions.moveLayer(layer.id, "down")}
                />
                <ToggleSquare
                  className="remove-btn"
                  label="×"
                  title="Remove layer"
                  onClick={() => actions.removeLayer(layer.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" className="addbtn" onClick={() => actions.addLayer()}>
        + Add layer
      </button>
    </>
  );
}
