import { SourceBankSlotEditor } from "./SourceBankSlotEditor";
import type { SourceBankSlot, MediaItem } from "./types";

export interface SourceBankPanelProps {
  slots: SourceBankSlot[];
  media: MediaItem[];
  onRename?: (index: number, name: string) => void;
  onSetContent?: (slotId: string, index: number, content: SourceBankSlot["content"]) => void;
}

export function SourceBankPanel({ slots, media, onRename, onSetContent }: SourceBankPanelProps) {
  return (
    <section id="source-bank" className="sc-card">
      <div className="media-head">
        <h3>Source bank</h3>
      </div>
      {slots.map((slot, i) => {
        const otherSlots = slots.filter((s) => s.id !== slot.id).map((s) => ({ id: s.id, name: s.name }));
        return (
          <SourceBankSlotEditor
            key={slot.id}
            slot={slot}
            index={i}
            media={media}
            otherSlots={otherSlots}
            onRename={onRename}
            onSetContent={onSetContent}
          />
        );
      })}
    </section>
  );
}
