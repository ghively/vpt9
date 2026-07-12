import { useState } from "react";
import { SourceBankSlotEditor } from "../SourceBankSlotEditor";
import { otherSlotOptions } from "../sourceBank";
import type { MediaItem, SourceBankSlot } from "../types";

export interface SlotGridProps {
  slots: SourceBankSlot[];
  /** Library items, needed to render a filled slot's media name and to populate the
   *  inline editor's pickers. Defaults to empty (grid still renders, editor just has
   *  nothing to offer for "media"/mix content). */
  media?: MediaItem[];
  /** Same write paths `SourceBankPanel` already uses — reused unchanged by the inline
   *  editor below. */
  onRename?: (index: number, name: string) => void;
  onSetContent?: (slotId: string, index: number, content: SourceBankSlot["content"]) => void;
  /** Fired with the clicked slot's index whenever a cell is clicked (open or re-toggle),
   *  so a container can react (e.g. a future show drawer cross-highlighting the slot).
   *  The inline editor below the grid is opened/closed independently, from local state. */
  onEditSlot?: (index: number) => void;
}

function slotSummary(slot: SourceBankSlot, media: MediaItem[]): string | null {
  const content = slot.content;
  if (!content) return null;
  if (content.type === "mix") return "MIX";
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
export function SlotGrid({ slots, media = [], onRename, onSetContent, onEditSlot }: SlotGridProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingSlot = editingIndex != null ? slots[editingIndex] : undefined;

  const handleClick = (index: number) => {
    setEditingIndex((current) => (current === index ? null : index));
    onEditSlot?.(index);
  };

  return (
    <>
      <div className="sec-head label">
        Source bank
        <span className="count mono">{slots.length}</span>
      </div>
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
              aria-expanded={isEditing}
              onClick={() => handleClick(i)}
            >
              <span className="n">{summary ?? `SLOT ${i + 1}`}</span>
            </button>
          );
        })}
      </div>
      {editingSlot && editingIndex != null && (
        <div className="slot-editor-inline">
          <SourceBankSlotEditor
            slot={editingSlot}
            index={editingIndex}
            media={media}
            otherSlots={otherSlotOptions(slots, editingSlot.id)}
            onRename={onRename}
            onSetContent={onSetContent}
          />
        </div>
      )}
    </>
  );
}
