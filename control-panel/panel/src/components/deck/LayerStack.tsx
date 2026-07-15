import { useState, type DragEvent } from "react";
import { ToggleSquare } from "../primitives/ToggleSquare";
import { rgbToHex } from "../color";
import { MediaThumb } from "./MediaThumb";
import { hasMediaDrag, getMediaDrag, type MediaDragPayload } from "./dnd";
import type { Layer, MediaItem } from "../types";

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
  /** Double-click a layer's name to rename it inline. */
  onRenameLayer?: (id: string, name: string) => void;
  /** A MediaBin item dropped onto a layer row — assign it as that layer's source. */
  onDropMedia?: (id: string, payload: MediaDragPayload) => void;
  /** Library items + serving origin, for rendering each layer's REAL content thumbnail. */
  media?: MediaItem[];
  mediaBase?: string;
  /** The pinned projector OUTPUT row (replaces the old Inspector Layer/Screen toggle):
   *  the active screen appears at the top of the stack as the thing everything below
   *  composites INTO. Selecting it puts the stage + inspector in screen-warp mode.
   *  Omit `outputName` (e.g. Storybook, no screen yet) to hide the row. */
  outputName?: string | null;
  outputSelected?: boolean;
  onSelectOutput?: () => void;
}

/** The layer's thumbnail: its ACTUAL content wherever possible — a color layer shows
 *  its color, a library source shows the media's own thumbnail, camera/slot/external
 *  sources show a labeled tile. Answering "what's on this layer?" by looking is the
 *  media-first redesign's core move. */
function LayerThumb({ layer, media, mediaBase }: { layer: Layer; media: MediaItem[]; mediaBase?: string }) {
  const source = layer.source;
  if (source?.type === "color") {
    return <span className="thumb" style={{ background: rgbToHex(source.color ?? [0.5, 0.5, 0.5]) }} />;
  }
  if (source?.type === "video" && mediaBase) {
    const item = media.find((m) => `/media/${m.filename}` === source.url);
    if (item) {
      return (
        <span className="thumb">
          <MediaThumb item={item} mediaBase={mediaBase} className="thumb__media" />
        </span>
      );
    }
    return <span className="thumb thumb--tag mono">URL</span>;
  }
  if (source?.type === "camera") return <span className="thumb thumb--tag mono">CAM</span>;
  if (source?.type === "slot") return <span className="thumb thumb--tag mono">{source.slotId?.replace("slot-", "S") ?? "SLOT"}</span>;
  return <span className="thumb" />;
}

/** The layer's display name, renamed inline on double-click (like every clip name in
 *  Resolume/preset chip here) — no trip to a form field somewhere else. */
function LayerName({ layer, onRename }: { layer: Layer; onRename?: (id: string, name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(layer.name ?? "");
  if (!editing) {
    return (
      <span
        className="nm"
        title={onRename ? "Double-click to rename" : undefined}
        onDoubleClick={(e) => {
          if (!onRename) return;
          e.stopPropagation();
          setDraft(layer.name ?? "");
          setEditing(true);
        }}
      >
        {layer.name}
      </span>
    );
  }
  const commit = () => {
    setEditing(false);
    const name = draft.trim();
    if (name && name !== layer.name) onRename?.(layer.id, name);
  };
  return (
    <input
      type="text"
      className="layer-rename-input"
      value={draft}
      autoFocus
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
    />
  );
}

/** Compact left-rail layer list: a real content thumbnail, name (double-click to
 *  rename), blend/index meta, and an opacity bar per layer. Rows are selectable
 *  (driving the stage handles + inspector), accept media drops as source assignment,
 *  and carry reorder/remove/copy/paste affordances that call straight into the
 *  existing write path — no new message types. */
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
  onRenameLayer,
  onDropMedia,
  media = [],
  mediaBase,
  outputName,
  outputSelected = false,
  onSelectOutput,
}: LayerStackProps) {
  const [dropId, setDropId] = useState<string | null>(null);

  const dragProps = (layerId: string) =>
    onDropMedia
      ? {
          onDragOver: (e: DragEvent) => {
            if (!hasMediaDrag(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setDropId(layerId);
          },
          onDragLeave: () => setDropId((cur) => (cur === layerId ? null : cur)),
          onDrop: (e: DragEvent) => {
            const payload = getMediaDrag(e);
            setDropId(null);
            if (!payload) return;
            e.preventDefault();
            onDropMedia(layerId, payload);
          },
        }
      : {};

  return (
    <>
      <div className="sec-head label">
        Layer stack
        <span className="count mono">top first</span>
      </div>
      <div className="layers">
        {outputName != null && (
          <div className="layer layer-output" data-selected={outputSelected}>
            <button type="button" className="layer-hit" aria-selected={outputSelected} onClick={() => onSelectOutput?.()}>
              <span className="thumb thumb-output" aria-hidden="true" />
              <span className="layer-info">
                <span className="nm">{outputName}</span>
                <span className="meta">projector output · warp</span>
              </span>
            </button>
          </div>
        )}
        {layers.map((layer, i) => {
          const opacityPct = Math.round((layer.opacity ?? 1) * 100);
          const stackIndex = layers.length - i;
          const isSelected = layer.id === selectedId;

          return (
            <div key={layer.id} className="layer" data-id={layer.id} data-selected={isSelected} data-drop={dropId === layer.id} {...dragProps(layer.id)}>
              <button
                type="button"
                className="layer-hit"
                aria-selected={isSelected}
                onClick={() => onSelect(layer.id)}
              >
                <LayerThumb layer={layer} media={media} mediaBase={mediaBase} />
                <span className="layer-info">
                  <LayerName layer={layer} onRename={onRenameLayer} />
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
                  title="Copy layer look (opacity, blend, mask, FX)"
                  onClick={() => onCopyLayer(layer.id)}
                />
                <ToggleSquare
                  label="⇩"
                  title="Paste copied look onto this layer"
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
