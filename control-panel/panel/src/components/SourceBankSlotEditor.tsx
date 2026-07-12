import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { Fader } from "./primitives/Fader";
import type { SourceBankSlot, MediaItem, SourceRef } from "./types";
import { BLEND_MODES } from "./types";

export interface SourceBankSlotEditorProps {
  slot: SourceBankSlot;
  /** Positional index into the parent slots array — write paths address slots by index. */
  index: number;
  media: MediaItem[];
  /** Every other slot (id + name), offered as an A/B pick target for mix content. */
  otherSlots: { id: string; name: string }[];
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

/** One source-bank slot's full editor row: name, content type, and (for media/mix) the
 *  type-specific controls. Extracted from `SourceBankPanel` so the compact rail
 *  `SlotGrid` can reveal the exact same controls — same markup, same write paths
 *  (`onRename`/`onSetContent`) — instead of a second, drifting implementation. */
export function SourceBankSlotEditor({ slot, index, media, otherSlots, onRename, onSetContent }: SourceBankSlotEditorProps) {
  const isMix = slot.content?.type === "mix";
  return (
    <div className="media-row source-slot-row">
      <TextField className="media-name" value={slot.name} onCommit={(v) => onRename?.(index, v)} />
      <Select
        className="source-slot-type"
        value={slot.content?.type ?? ""}
        options={[{ value: "", label: "Empty" }, { value: "media", label: "Media" }, { value: "mix", label: "Mix" }]}
        onChange={(v) => {
          if (v === "media") onSetContent?.(slot.id, index, { type: "media", mediaId: media[0]?.id ?? "" });
          else if (v === "mix") onSetContent?.(slot.id, index, { type: "mix", a: null, b: null, blendMode: "normal", mix: 0.5 });
          else onSetContent?.(slot.id, index, null);
        }}
      />
      {slot.content?.type === "media" && (
        <Select
          value={slot.content.mediaId}
          options={media.map((m) => ({ value: m.id, label: m.name }))}
          onChange={(v) => onSetContent?.(slot.id, index, { type: "media", mediaId: v })}
        />
      )}
      {isMix && slot.content?.type === "mix" && (
        <>
          <RefPicker value={slot.content.a} media={media} otherSlots={otherSlots} onChange={(a) => onSetContent?.(slot.id, index, { ...slot.content, a } as SourceBankSlot["content"])} />
          <RefPicker value={slot.content.b} media={media} otherSlots={otherSlots} onChange={(b) => onSetContent?.(slot.id, index, { ...slot.content, b } as SourceBankSlot["content"])} />
          <Select
            value={slot.content.blendMode}
            options={BLEND_MODES.map((m) => ({ value: m, label: m }))}
            onChange={(v) => onSetContent?.(slot.id, index, { ...slot.content, blendMode: v } as SourceBankSlot["content"])}
          />
          <div className="source-slot-mix">
            <Fader
              value={slot.content.mix}
              ariaLabel="Crossfade amount"
              onChange={(v) => onSetContent?.(slot.id, index, { ...slot.content, mix: v } as SourceBankSlot["content"])}
            />
            <span className="mono source-slot-mix-val">{Math.round(slot.content.mix * 100)}%</span>
          </div>
        </>
      )}
    </div>
  );
}
