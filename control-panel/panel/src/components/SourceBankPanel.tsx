import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import type { SourceBankSlot, MediaItem, SourceRef } from "./types";
import { BLEND_MODES } from "./types";

export interface SourceBankPanelProps {
  slots: SourceBankSlot[];
  media: MediaItem[];
  onRename?: (index: number, name: string) => void;
  onSetContent?: (slotId: string, index: number, content: SourceBankSlot["content"]) => void;
}

function RefPicker({ value, media, otherSlots, onChange }: { value: SourceRef | null; media: MediaItem[]; otherSlots: { id: string; name: string }[]; onChange: (ref: SourceRef | null) => void }) {
  const options = [
    { value: "", label: "—" },
    ...media.map((m) => ({ value: `media:${m.id}`, label: m.name })),
    ...otherSlots.map((s) => ({ value: `slot:${s.id}`, label: s.name })),
  ];
  const current = value ? `${value.type}:${value.type === "media" ? value.mediaId : value.slotId}` : "";
  return (
    <Select
      value={current}
      options={options}
      onChange={(v) => {
        if (!v) return onChange(null);
        const [type, id] = v.split(":");
        onChange(type === "media" ? { type: "media", mediaId: id } : { type: "slot", slotId: id });
      }}
    />
  );
}

export function SourceBankPanel({ slots, media, onRename, onSetContent }: SourceBankPanelProps) {
  return (
    <section id="source-bank" className="sc-card">
      <div className="media-head">
        <h3>Source bank</h3>
      </div>
      {slots.map((slot, i) => {
        const otherSlots = slots.filter((s) => s.id !== slot.id).map((s) => ({ id: s.id, name: s.name }));
        const isMix = slot.content?.type === "mix";
        return (
          <div className="media-row source-slot-row" key={slot.id}>
            <TextField className="media-name" value={slot.name} onCommit={(v) => onRename?.(i, v)} />
            <Select
              className="source-slot-type"
              value={slot.content?.type ?? ""}
              options={[{ value: "", label: "Empty" }, { value: "media", label: "Media" }, { value: "mix", label: "Mix" }]}
              onChange={(v) => {
                if (v === "media") onSetContent?.(slot.id, i, { type: "media", mediaId: media[0]?.id ?? "" });
                else if (v === "mix") onSetContent?.(slot.id, i, { type: "mix", a: null, b: null, blendMode: "normal", mix: 0.5 });
                else onSetContent?.(slot.id, i, null);
              }}
            />
            {slot.content?.type === "media" && (
              <Select
                value={slot.content.mediaId}
                options={media.map((m) => ({ value: m.id, label: m.name }))}
                onChange={(v) => onSetContent?.(slot.id, i, { type: "media", mediaId: v })}
              />
            )}
            {isMix && slot.content?.type === "mix" && (
              <>
                <RefPicker value={slot.content.a} media={media} otherSlots={otherSlots} onChange={(a) => onSetContent?.(slot.id, i, { ...slot.content, a } as SourceBankSlot["content"])} />
                <RefPicker value={slot.content.b} media={media} otherSlots={otherSlots} onChange={(b) => onSetContent?.(slot.id, i, { ...slot.content, b } as SourceBankSlot["content"])} />
                <Select
                  value={slot.content.blendMode}
                  options={BLEND_MODES.map((m) => ({ value: m, label: m }))}
                  onChange={(v) => onSetContent?.(slot.id, i, { ...slot.content, blendMode: v } as SourceBankSlot["content"])}
                />
              </>
            )}
          </div>
        );
      })}
    </section>
  );
}
