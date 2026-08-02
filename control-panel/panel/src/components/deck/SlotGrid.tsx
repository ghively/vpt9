import { memo, useState, type DragEvent } from "react";
import { SourceBankSlotEditor } from "../SourceBankSlotEditor";
import { otherSlotOptions } from "../sourceBank";
import { MediaThumb } from "./MediaThumb";
import { SectionHead } from "./SectionHead";
import { rgbToHex } from "../color";
import { useContextMenu, longPressHandlers, type MenuItem } from "./ContextMenu";
import { hasMediaDrag, getMediaDrag } from "./dnd";
import type { CameraDevice, MediaItem, SourceBankSlot } from "../types";

export interface SlotGridProps {
  slots: SourceBankSlot[];
  /** Library items, needed to render a filled slot's media name and to populate the
   *  inline editor's pickers. Defaults to empty (grid still renders, editor just has
   *  nothing to offer for "media"/mix content). */
  media?: MediaItem[];
  /** Enumerated video-input devices (task A14) for the inline editor's camera pickers. */
  cameraDevices?: CameraDevice[];
  /** Same write paths `SourceBankPanel` already uses — reused unchanged by the inline
   *  editor below. */
  onRename?: (index: number, name: string) => void;
  onSetContent?: (slotId: string, index: number, content: SourceBankSlot["content"]) => void;
  /** Per-slot transport write (task A9): `sourceBank.<index>.transport.<field>`. */
  onSetTransport?: (index: number, field: string, value: unknown) => void;
  /** Drag guard (App's isDraggingRef), threaded to the inline editor's faders. */
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** Library origin for rendering a filled media slot's REAL thumbnail. */
  mediaBase?: string;
  /** Fired with the clicked slot's index whenever a cell is clicked (open or re-toggle),
   *  so a container can react (e.g. a future show drawer cross-highlighting the slot).
   *  The inline editor below the grid is opened/closed independently, from local state. */
  onEditSlot?: (index: number) => void;
  /** Desktop rail collapse: when `onToggleCollapse` is set the header folds the section. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function slotSummary(slot: SourceBankSlot, media: MediaItem[]): string | null {
  const content = slot.content;
  if (!content) return null;
  if (content.type === "mix") return "MIX";
  if (content.type === "camera") return "CAM";
  if (content.type === "color") return "COLOR";
  // A media slot only counts as filled once its mediaId resolves to a real library
  // item — an empty mediaId, or one pointing at deleted/not-yet-loaded media, must
  // render as an empty slot rather than a fake "Media" label (see Fix 1).
  return media.find((m) => m.id === content.mediaId)?.name ?? null;
}

/** Compact left-rail source-bank grid: the 8 slots as a tight 2-col grid (vs.
 *  `SourceBankPanel`'s full-width rows). Clicking a cell expands the SAME per-slot
 *  editor inline below the grid — `SourceBankSlotEditor`, extracted from
 *  `SourceBankPanel` — so editing keeps using the existing `onRename`/`onSetContent`
 *  write paths unchanged rather than a second, drifting implementation. */
function SlotGridView({ slots, media = [], cameraDevices = [], onRename, onSetContent, onSetTransport, onDragStart, onDragEnd, onEditSlot, mediaBase, collapsed = false, onToggleCollapse }: SlotGridProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const editingSlot = editingIndex != null ? slots[editingIndex] : undefined;
  const ctx = useContextMenu();

  const handleClick = (index: number) => {
    setEditingIndex((current) => (current === index ? null : index));
    onEditSlot?.(index);
  };

  // Shared by right-click and touch long-press (mobile has no right-click).
  const slotMenu = (i: number): MenuItem[] => {
    const slot = slots[i];
    return [
      { label: editingIndex === i ? "Close editor" : "Open editor", onSelect: () => handleClick(i) },
      ...(onSetContent && slot?.content
        ? ["separator" as const, { label: "Clear slot", danger: true, onSelect: () => onSetContent(slot.id, i, null) }]
        : []),
    ];
  };

  // A filled slot shows what it actually HOLDS: the media's own thumbnail, the solid
  // color, or a CAM/MIX badge — not just a name (media-first redesign).
  const slotFace = (slot: SourceBankSlot) => {
    const content = slot.content;
    if (!content) return null;
    if (content.type === "media" && mediaBase) {
      const item = media.find((m) => m.id === content.mediaId);
      if (item) return <MediaThumb item={item} mediaBase={mediaBase} className="slot__thumb" />;
    }
    if (content.type === "color") {
      return <span className="slot__thumb" style={{ background: rgbToHex(content.color ?? [0.5, 0.5, 0.5]) }} />;
    }
    return null;
  };

  return (
    <>
      <SectionHead title="Shared slots" count={slots.length} collapsed={collapsed} onToggle={onToggleCollapse} />
      {!collapsed && (
      <div className="slots">
        {slots.map((slot, i) => {
          const summary = slotSummary(slot, media);
          const isEditing = editingIndex === i;
          return (
            <button
              key={slot.id}
              type="button"
              className="slot"
              data-filled={summary != null}
              data-editing={isEditing}
              data-drop={dropIndex === i}
              aria-expanded={isEditing}
              title={summary ? `${slot.name} · ${summary}` : `${slot.name} — click to set up, or drop media here`}
              onClick={() => handleClick(i)}
              onContextMenu={(e) => ctx.open(e, slotMenu(i))}
              {...longPressHandlers((x, y) => ctx.openAt(x, y, slotMenu(i)))}
              onDragOver={(e: DragEvent) => {
                if (!onSetContent || !hasMediaDrag(e)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                setDropIndex(i);
              }}
              onDragLeave={() => setDropIndex((cur) => (cur === i ? null : cur))}
              onDrop={(e: DragEvent) => {
                const payload = getMediaDrag(e);
                setDropIndex(null);
                if (!payload || !onSetContent) return;
                e.preventDefault();
                onSetContent(slot.id, i, { type: "media", mediaId: payload.mediaId });
              }}
            >
              {slotFace(slot)}
              <span className="n">{summary ?? `SLOT ${i + 1}`}</span>
            </button>
          );
        })}
      </div>
      )}
      {!collapsed && editingSlot && editingIndex != null && (
        <div className="slot-editor-inline">
          <SourceBankSlotEditor
            slot={editingSlot}
            index={editingIndex}
            media={media}
            otherSlots={otherSlotOptions(slots, editingSlot.id)}
            cameraDevices={cameraDevices}
            onRename={onRename}
            onSetContent={onSetContent}
            onSetTransport={onSetTransport}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        </div>
      )}
      {ctx.menu}
    </>
  );
}

export const SlotGrid = memo(SlotGridView);
