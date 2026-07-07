import { LayerStrip } from "./LayerStrip";
import { Button } from "./primitives/Button";
import type { Layer, MediaItem } from "./types";

export interface ChannelRackProps {
  layers: Layer[];
  onUpdateLayer?: (id: string, field: string, value: unknown) => void;
  onMoveLayer?: (id: string, dir: "up" | "down") => void;
  onRemoveLayer?: (id: string) => void;
  onAddLayer?: () => void;
  /** Layer-look copy/paste (opacity/blend/mask/fx) — clipboard lives in the container. */
  onCopyLayer?: (id: string) => void;
  onPasteLayer?: (id: string) => void;
  canPaste?: boolean;
  /** Library items, threaded to each strip's source picker. */
  media?: MediaItem[];
  /** Opens the on-canvas mask editor for a given layer. */
  onEditMaskLayer?: (id: string) => void;
}

/** The full layer rack: strips shown top-of-stack first, plus an add button. */
export function ChannelRack({
  layers,
  onUpdateLayer,
  onMoveLayer,
  onRemoveLayer,
  onAddLayer,
  onCopyLayer,
  onPasteLayer,
  canPaste,
  media,
  onEditMaskLayer,
}: ChannelRackProps) {
  // `order` ascends bottom→top; show the top of the stack first, like the vanilla panel.
  const ascending = [...layers].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const display = [...ascending].reverse();

  return (
    <div id="layer-rack">
      <div className="rack-title">Layer rack — top of stack first</div>
      {display.map((layer) => {
        const i = ascending.findIndex((l) => l.id === layer.id);
        const neighbors = { above: i < ascending.length - 1, below: i > 0 };
        return (
          <LayerStrip
            key={layer.id}
            layer={layer}
            neighbors={neighbors}
            media={media}
            onUpdate={(field, value) => onUpdateLayer?.(layer.id, field, value)}
            onMove={(dir) => onMoveLayer?.(layer.id, dir)}
            onRemove={() => onRemoveLayer?.(layer.id)}
            onCopy={() => onCopyLayer?.(layer.id)}
            onPaste={() => onPasteLayer?.(layer.id)}
            canPaste={canPaste}
            onEditMask={() => onEditMaskLayer?.(layer.id)}
          />
        );
      })}
      <Button label="+ Add layer" onClick={onAddLayer} />
    </div>
  );
}
