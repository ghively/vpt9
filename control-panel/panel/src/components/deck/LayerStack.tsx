import { ToggleSquare } from "../primitives/ToggleSquare";
import { rgbToHex } from "../color";
import type { Layer } from "../types";

export interface LayerStackProps {
  /** Pre-sorted top-of-stack-first by the caller (App) — index 0 renders first/topmost. */
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddLayer: () => void;
  onMoveLayer: (id: string, dir: "up" | "down") => void;
  onRemoveLayer: (id: string) => void;
  /** Copy this layer's look (opacity/blendMode/mask/fx) to the app-level clipboard. */
  onCopyLayer: (id: string) => void;
  /** Paste the app-level clipboard's look onto this layer. */
  onPasteLayer: (id: string) => void;
  /** Whether the clipboard currently holds a copied look — gates the paste button. */
  hasClipboard: boolean;
}

/** Compact left-rail layer list: a color swatch (or gradient placeholder) thumbnail,
 *  name, blend/index meta, and an opacity bar per layer. Rows are selectable (driving
 *  the stage handles + inspector in later tasks) and carry reorder/remove/copy/paste
 *  affordances that call straight into the existing write path — no new message types. */
export function LayerStack({
  layers,
  selectedId,
  onSelect,
  onAddLayer,
  onMoveLayer,
  onRemoveLayer,
  onCopyLayer,
  onPasteLayer,
  hasClipboard,
}: LayerStackProps) {
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
                  onClick={() => onMoveLayer(layer.id, "up")}
                />
                <ToggleSquare
                  className="move-btn"
                  label="▼"
                  title="Move toward back"
                  disabled={i === layers.length - 1}
                  onClick={() => onMoveLayer(layer.id, "down")}
                />
                <ToggleSquare
                  label="⧉"
                  title="Copy layer look"
                  onClick={() => onCopyLayer(layer.id)}
                />
                <ToggleSquare
                  label="⇩"
                  title="Paste layer look"
                  disabled={!hasClipboard}
                  onClick={() => onPasteLayer(layer.id)}
                />
                <ToggleSquare
                  className="remove-btn"
                  label="×"
                  title="Remove layer"
                  onClick={() => onRemoveLayer(layer.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" className="addbtn" onClick={() => onAddLayer()}>
        + Add layer
      </button>
    </>
  );
}
