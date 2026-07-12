import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { Fader } from "./primitives/Fader";
import { TransportControls } from "./TransportControls";
import { CameraPicker } from "./CameraPicker";
import { rgbToHex, hexToRgb } from "./color";
import type { SourceBankSlot, MediaItem, SourceRef, Transport, CameraDevice } from "./types";
import { BLEND_MODES } from "./types";

/** Mirrors `server/src/state.js`'s `defaultTransport()` — used only as a display fallback
 *  for a slot whose `transport` hasn't been backfilled yet (the server always sends one).
 *  Edits still write per-field via `onSetTransport`, patching the real state leaf. */
const DEFAULT_SLOT_TRANSPORT: Transport = {
  playing: false,
  rate: 1,
  loopIn: null,
  loopOut: null,
  loopMode: "off",
  pan: 0,
  vol: 1,
  seek: null,
};

export interface SourceBankSlotEditorProps {
  slot: SourceBankSlot;
  /** Positional index into the parent slots array — write paths address slots by index. */
  index: number;
  media: MediaItem[];
  /** Every other slot (id + name), offered as an A/B pick target for mix content. */
  otherSlots: { id: string; name: string }[];
  /** Enumerated video-input devices (task A14) for camera content + mix camera inputs. */
  cameraDevices?: CameraDevice[];
  onRename?: (index: number, name: string) => void;
  onSetContent?: (slotId: string, index: number, content: SourceBankSlot["content"]) => void;
  /** Writes one per-slot transport field (task A9): `sourceBank.<index>.transport.<field>`.
   *  `field` is relative to the transport object ("playing", "rate", "loopMode", …). */
  onSetTransport?: (index: number, field: string, value: unknown) => void;
}

/** A/B ref picker for mix content. Offers media + other slots (original), plus Camera and
 *  Solid-color (task A13) with their own inline detail control (a device picker / a color
 *  input) when picked — the same terminal ref shapes the render-client resolves. */
function RefPicker({
  value,
  media,
  otherSlots,
  cameraDevices = [],
  onChange,
}: {
  value: SourceRef | null;
  media: MediaItem[];
  otherSlots: { id: string; name: string }[];
  cameraDevices?: CameraDevice[];
  onChange: (ref: SourceRef | null) => void;
}) {
  const options = [
    { value: "", label: "—" },
    ...media.map((m) => ({ value: `media:${m.id}`, label: m.name })),
    ...otherSlots.map((s) => ({ value: `slot:${s.id}`, label: s.name })),
    { value: "camera", label: "Camera" },
    { value: "color", label: "Solid color" },
  ];
  const current =
    value?.type === "media" ? `media:${value.mediaId}`
      : value?.type === "slot" ? `slot:${value.slotId}`
        : value?.type === "camera" ? "camera"
          : value?.type === "color" ? "color"
            : "";
  return (
    <div className="ref-picker">
      <Select
        value={current}
        options={options}
        onChange={(v) => {
          if (!v) return onChange(null);
          if (v === "camera") return onChange({ type: "camera" });
          if (v === "color") return onChange({ type: "color", color: [1, 1, 1] });
          const idx = v.indexOf(":");
          const type = v.slice(0, idx);
          const id = v.slice(idx + 1);
          onChange(type === "media" ? { type: "media", mediaId: id } : { type: "slot", slotId: id });
        }}
      />
      {value?.type === "camera" && (
        <CameraPicker
          deviceId={value.deviceId}
          resolution={value.resolution}
          devices={cameraDevices}
          onDevice={(deviceId) => onChange({ type: "camera", deviceId, resolution: value.resolution })}
          onResolution={(resolution) => onChange({ type: "camera", deviceId: value.deviceId, resolution: resolution ?? undefined })}
        />
      )}
      {value?.type === "color" && (
        <input
          type="color"
          value={rgbToHex(value.color ?? [1, 1, 1])}
          onChange={(e) => onChange({ type: "color", color: hexToRgb(e.target.value) })}
        />
      )}
    </div>
  );
}

/** One source-bank slot's full editor row: name, content type, and (for media/mix) the
 *  type-specific controls. Extracted from `SourceBankPanel` so the compact rail
 *  `SlotGrid` can reveal the exact same controls — same markup, same write paths
 *  (`onRename`/`onSetContent`) — instead of a second, drifting implementation. */
export function SourceBankSlotEditor({ slot, index, media, otherSlots, cameraDevices = [], onRename, onSetContent, onSetTransport }: SourceBankSlotEditorProps) {
  const isMix = slot.content?.type === "mix";
  const transport = slot.transport ?? DEFAULT_SLOT_TRANSPORT;
  return (
    <div className="media-row source-slot-row">
      <TextField className="media-name" value={slot.name} onCommit={(v) => onRename?.(index, v)} />
      <Select
        className="source-slot-type"
        value={slot.content?.type ?? ""}
        options={[
          { value: "", label: "Empty" },
          { value: "media", label: "Media" },
          { value: "camera", label: "Camera" },
          { value: "color", label: "Solid color" },
          { value: "mix", label: "Mix" },
        ]}
        onChange={(v) => {
          if (v === "media") onSetContent?.(slot.id, index, { type: "media", mediaId: media[0]?.id ?? "" });
          else if (v === "camera") onSetContent?.(slot.id, index, { type: "camera" });
          else if (v === "color") onSetContent?.(slot.id, index, { type: "color", color: [1, 1, 1] });
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
      {slot.content?.type === "camera" && (
        <CameraPicker
          deviceId={slot.content.deviceId}
          resolution={slot.content.resolution}
          devices={cameraDevices}
          onDevice={(deviceId) => onSetContent?.(slot.id, index, { type: "camera", deviceId, resolution: slot.content && slot.content.type === "camera" ? slot.content.resolution : undefined })}
          onResolution={(resolution) => onSetContent?.(slot.id, index, { type: "camera", deviceId: slot.content && slot.content.type === "camera" ? slot.content.deviceId : undefined, resolution: resolution ?? undefined })}
        />
      )}
      {slot.content?.type === "color" && (
        <input
          type="color"
          value={rgbToHex(slot.content.color ?? [1, 1, 1])}
          onChange={(e) => onSetContent?.(slot.id, index, { type: "color", color: hexToRgb(e.target.value) })}
        />
      )}
      {isMix && slot.content?.type === "mix" && (
        <>
          <RefPicker value={slot.content.a} media={media} otherSlots={otherSlots} cameraDevices={cameraDevices} onChange={(a) => onSetContent?.(slot.id, index, { ...slot.content, a } as SourceBankSlot["content"])} />
          <RefPicker value={slot.content.b} media={media} otherSlots={otherSlots} cameraDevices={cameraDevices} onChange={(b) => onSetContent?.(slot.id, index, { ...slot.content, b } as SourceBankSlot["content"])} />
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
      {/* Per-slot clip transport (task A9): shown for any content that has playable video
          (media or mix). Slots stay muted (audio-owner policy), so pan/vol round-trip but
          have no audible effect — the render-client applies play/rate/loop/scrub. */}
      {slot.content && (
        <div className="fx-row source-slot-transport">
          <TransportControls transport={transport} onUpdate={(field, value) => onSetTransport?.(index, field, value)} />
        </div>
      )}
    </div>
  );
}
