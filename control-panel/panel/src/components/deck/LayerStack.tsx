import { memo, useState, type DragEvent, type KeyboardEvent } from "react";
import { ToggleSquare } from "../primitives/ToggleSquare";
import { Fader } from "../primitives/Fader";
import { useFaderEcho } from "../primitives/useFaderEcho";
import { rgbToHex } from "../color";
import { MediaThumb } from "./MediaThumb";
import { SectionHead } from "./SectionHead";
import { useContextMenu, longPressHandlers, type MenuItem } from "./ContextMenu";
import { hasMediaDrag, getMediaDrag, hasLayerDrag, getLayerDrag, setLayerDrag, type MediaDragPayload } from "./dnd";
import type { Layer, MediaItem } from "../types";

/** The visibility eye — inline SVG (an emoji eye would break the instrument voice).
 *  Open = composited; slashed = hidden (playback continues underneath). */
function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" opacity={open ? 1 : 0} />
      {!open && <line x1="4" y1="20" x2="20" y2="4" />}
    </svg>
  );
}

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
  /** The visibility eye: toggle whether the layer is composited at all. */
  onToggleVisible?: (id: string, visible: boolean) => void;
  /** Row play/pause for a video/gif layer — writes layers.<id>.transport.playing.
   *  (Previously only reachable via Inspector → FX → Transport, three levels deep.) */
  onSetLayerPlaying?: (id: string, playing: boolean) => void;
  /** Row opacity fader — writes layers.<id>.opacity. (Previously read-only on the row.) */
  onSetLayerOpacity?: (id: string, value: number) => void;
  /** Drag guard (App's isDraggingRef), threaded to every row's opacity fader. */
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** Drag-to-reorder (rows are draggable): writes the dragged layer's new `order`. */
  onSetLayerOrder?: (id: string, order: number) => void;
  /** Context menu "Duplicate": clone the layer to the top of the stack. */
  onDuplicateLayer?: (id: string) => void;
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
  /** Desktop rail collapse: when `onToggleCollapse` is set the header folds the section. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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
 *  Resolume/preset chip here) — no trip to a form field somewhere else. `forceEdit`
 *  lets the row's context menu ("Rename") open the same editor. */
function LayerName({
  layer,
  onRename,
  forceEdit,
  onEditDone,
}: {
  layer: Layer;
  onRename?: (id: string, name: string) => void;
  forceEdit?: boolean;
  onEditDone?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(layer.name ?? "");
  const [wasForced, setWasForced] = useState(false);
  if (forceEdit && !wasForced) {
    // Entering via the context menu: refresh the draft from the current name.
    setWasForced(true);
    setDraft(layer.name ?? "");
  } else if (!forceEdit && wasForced) {
    setWasForced(false);
  }
  const active = editing || forceEdit;
  if (!active) {
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
  const stop = () => {
    setEditing(false);
    onEditDone?.();
  };
  const commit = () => {
    const name = draft.trim();
    if (name && name !== layer.name) onRename?.(layer.id, name);
    stop();
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
        if (e.key === "Escape") stop();
      }}
    />
  );
}

/** A row's opacity fader + % readout. Its own component (not inline in the row map)
 *  because the readout needs a local drag echo (useFaderEcho — a hook, so it can't live
 *  inside the map): while the drag guard suppresses store re-renders, the % would
 *  otherwise freeze mid-drag. */
function RowOpacity({
  layer,
  onSetLayerOpacity,
  onDragStart,
  onDragEnd,
}: {
  layer: Layer;
  onSetLayerOpacity?: (id: string, value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const drag = useFaderEcho((v) => onSetLayerOpacity?.(layer.id, v), onDragStart, onDragEnd);
  return (
    <>
      <Fader
        value={layer.opacity ?? 1}
        ariaLabel={`${layer.name || layer.id} opacity`}
        onChange={drag.onChange}
        onDragStart={drag.onDragStart}
        onDragEnd={drag.onDragEnd}
      />
      <span className="op mono">{Math.round((drag.echo ?? layer.opacity ?? 1) * 100)}%</span>
    </>
  );
}

/** Compact left-rail layer list: a real content thumbnail, name (double-click to
 *  rename), blend/index meta, and an opacity bar per layer. Rows are selectable
 *  (driving the stage handles + inspector), accept media drops as source assignment,
 *  and carry reorder/remove/copy/paste affordances that call straight into the
 *  existing write path — no new message types. */
function LayerStackView({
  layers,
  selectedId,
  onSelect,
  onAddLayer,
  onMoveLayer,
  onRemoveLayer,
  onCopyLayer,
  onPasteLayer,
  onSetLayerPlaying,
  onSetLayerOpacity,
  onDragStart,
  onDragEnd,
  hasClipboard,
  onRenameLayer,
  onDropMedia,
  onToggleVisible,
  onSetLayerOrder,
  onDuplicateLayer,
  media = [],
  mediaBase,
  outputName,
  outputSelected = false,
  onSelectOutput,
  collapsed = false,
  onToggleCollapse,
}: LayerStackProps) {
  const [dropId, setDropId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const ctx = useContextMenu();

  // The right-click menu — every entry is an existing affordance (dblclick rename, the
  // eye, the ops squares) surfaced where a graphics-tool user first looks for it.
  const layerMenu = (layer: Layer): MenuItem[] => {
    const isVisible = layer.visible !== false;
    const items: MenuItem[] = [];
    if (onRenameLayer) items.push({ label: "Rename…", onSelect: () => setRenamingId(layer.id) });
    if (onToggleVisible) items.push({ label: isVisible ? "Hide layer" : "Show layer", onSelect: () => onToggleVisible(layer.id, !isVisible) });
    if (onDuplicateLayer) items.push({ label: "Duplicate", onSelect: () => onDuplicateLayer(layer.id) });
    items.push("separator");
    items.push({ label: "Copy look", onSelect: () => onCopyLayer(layer.id) });
    items.push({ label: "Paste look", disabled: !hasClipboard, onSelect: () => onPasteLayer(layer.id) });
    items.push("separator");
    items.push({ label: "Remove layer", danger: true, onSelect: () => onRemoveLayer(layer.id) });
    return items;
  };

  // Drag a row onto another row to move it ABOVE that row (GIMP's reorder gesture).
  // Fractional orders keep it a single leaf write — no renumbering of the whole stack.
  const reorderOnto = (draggedId: string, targetId: string) => {
    if (!onSetLayerOrder || draggedId === targetId) return;
    const idx = layers.findIndex((l) => l.id === targetId);
    if (idx < 0) return;
    const target = layers[idx];
    const above = layers[idx - 1]; // visually above = higher order (top-first list)
    if (above?.id === draggedId) return; // already directly above the target
    const newOrder = above ? ((target.order ?? 0) + (above.order ?? 0)) / 2 : (target.order ?? 0) + 1;
    onSetLayerOrder(draggedId, newOrder);
  };

  const dragProps = (layerId: string) => ({
    draggable: !!onSetLayerOrder,
    onDragStart: (e: DragEvent) => {
      // Don't hijack a text-selection drag inside the inline rename input.
      if ((e.target as HTMLElement).closest("input")) {
        e.preventDefault();
        return;
      }
      setLayerDrag(e, layerId);
    },
    onDragOver: (e: DragEvent) => {
      if (!(onDropMedia && hasMediaDrag(e)) && !(onSetLayerOrder && hasLayerDrag(e))) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = hasLayerDrag(e) ? "move" : "copy";
      setDropId(layerId);
    },
    onDragLeave: () => setDropId((cur) => (cur === layerId ? null : cur)),
    onDrop: (e: DragEvent) => {
      setDropId(null);
      const mediaPayload = getMediaDrag(e);
      if (mediaPayload && onDropMedia) {
        e.preventDefault();
        onDropMedia(layerId, mediaPayload);
        return;
      }
      const draggedLayerId = getLayerDrag(e);
      if (draggedLayerId) {
        e.preventDefault();
        reorderOnto(draggedLayerId, layerId);
      }
    },
  });

  return (
    <>
      <SectionHead title="Layer stack" count="top first" collapsed={collapsed} onToggle={onToggleCollapse} />
      {!collapsed && (
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
          const stackIndex = layers.length - i;
          const isSelected = layer.id === selectedId;
          const isVisible = layer.visible !== false;
          const onRowKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(layer.id);
            }
          };

          return (
            <div
              key={layer.id}
              className="layer"
              data-id={layer.id}
              data-selected={isSelected}
              data-hidden={!isVisible}
              data-drop={dropId === layer.id}
              {...dragProps(layer.id)}
              onContextMenu={(e) => ctx.open(e, layerMenu(layer))}
              {...longPressHandlers((x, y) => ctx.openAt(x, y, layerMenu(layer)))}
            >
              {/* A div-with-button-role, not a <button>: the visibility eye nests inside
               *  the hit area (nested <button>s are invalid HTML). */}
              <div
                className={onToggleVisible ? "layer-hit layer-hit--eye" : "layer-hit"}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
                onClick={() => onSelect(layer.id)}
                onKeyDown={onRowKeyDown}
              >
                {onToggleVisible && (
                  <button
                    type="button"
                    className="layer-eye"
                    aria-pressed={isVisible}
                    title={isVisible ? "Hide layer (playback continues underneath)" : "Show layer"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisible(layer.id, !isVisible);
                    }}
                  >
                    <EyeIcon open={isVisible} />
                  </button>
                )}
                <LayerThumb layer={layer} media={media} mediaBase={mediaBase} />
                <span className="layer-info">
                  <LayerName
                    layer={layer}
                    onRename={onRenameLayer}
                    forceEdit={renamingId === layer.id}
                    onEditDone={() => setRenamingId((cur) => (cur === layer.id ? null : cur))}
                  />
                  <span className="meta">
                    {layer.blendMode ?? "normal"} · Layer {stackIndex}
                  </span>
                </span>
              </div>
              {/* Quick controls on EVERY row (not buried in the Inspector): play/pause for a
               *  video/gif layer + a draggable opacity fader. Outside the .layer-hit click
               *  area (stopPropagation) so using them doesn't also select/deselect the row. */}
              <div className="layer-quick" onPointerDown={(e) => e.stopPropagation()}>
                {layer.source?.type === "video" && onSetLayerPlaying && (
                  <button
                    type="button"
                    className="layer-play"
                    title={layer.transport?.playing ? "Pause" : "Play"}
                    aria-label={layer.transport?.playing ? "Pause layer" : "Play layer"}
                    onClick={(e) => { e.stopPropagation(); onSetLayerPlaying(layer.id, !(layer.transport?.playing ?? false)); }}
                  >
                    {layer.transport?.playing ? "⏸" : "▶"}
                  </button>
                )}
                <RowOpacity layer={layer} onSetLayerOpacity={onSetLayerOpacity} onDragStart={onDragStart} onDragEnd={onDragEnd} />
              </div>
              {/* Controls for the SELECTED layer only (GIMP shows tools for the active
               *  layer, not five buttons on every row) — selection is one click away. */}
              {isSelected && (
                <div className="layer-ops">
                  <ToggleSquare
                    className="move-btn"
                    label="▲"
                    title="Move toward front (or drag the row)"
                    disabled={i === 0}
                    onClick={() => onMoveLayer(layer.id, "up")}
                  />
                  <ToggleSquare
                    className="move-btn"
                    label="▼"
                    title="Move toward back (or drag the row)"
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
              )}
            </div>
          );
        })}
      </div>
      )}
      {!collapsed && (
        <button type="button" className="addbtn" onClick={() => onAddLayer()}>
          + Add layer
        </button>
      )}
      {ctx.menu}
    </>
  );
}

export const LayerStack = memo(LayerStackView);
