import { Fader } from "./primitives/Fader";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { TransportControls } from "./TransportControls";
import type { Fx, Mask, MediaItem, Playlist, PlaylistItem, Transport } from "./types";

export interface FxDrawerProps {
  fx: Fx;
  /** Mask geometry lives here too (center/size/feather); enable + shape stay on the
   *  strip. Optional so existing fx-only usage keeps working. */
  mask?: Mask;
  /** Clip transport (play/rate/loop/pan/vol/loop-in/loop-out/scrub). Optional so existing
   *  fx-only usage keeps working; the section renders once a caller supplies it. */
  transport?: Transport;
  /** Live playback position in seconds for the selected layer (transportStatus telemetry),
   *  shown as the scrub readout. */
  transportPosition?: number;
  /** "single" | "playlist" — which source-selection mode the layer is in. */
  sourceMode?: "single" | "playlist";
  /** Ordered clip queue for playlist mode. */
  playlist?: Playlist;
  /** Per-source render downscale divisor (task A15 — VPT8's `p adapt`): 1/2/4/8. Absent
   *  means full (1). Rendered as a small "Adapt" section select. */
  downscale?: number;
  /** Library items offered by the playlist item picker — the same list LayerStrip's own
   *  source picker already receives, threaded through unchanged. */
  media?: MediaItem[];
  /** Field paths are relative to the layer ("fx.zoom", "mask.feather") so the container
   *  can prefix them with "layers.<id>." unchanged. */
  onUpdate?: (field: string, value: unknown) => void;
  /** Opens the on-canvas mask editor for this layer (Screen tab). */
  onEditMask?: () => void;
  /** Opens the on-canvas warp editor for this layer (Screen tab). */
  onEditWarp?: () => void;
  /** Switches this layer between a single fixed source and a playlist. */
  onSetSourceMode?: (mode: "single" | "playlist") => void;
  /** Replaces the whole playlist item queue (it's one state leaf, like the cue list). */
  onSetPlaylist?: (items: PlaylistItem[]) => void;
  /** Manual clip trigger (task A15): advance/retreat/randomize the playlist cursor live. */
  onTriggerClip?: (which: "next" | "prev" | "random") => void;
}

// Per-source downscale presets (task A15 — VPT8's `p adapt` F..1/16). Value is the integer
// divisor the render-client reduces the layer's decode/upload by.
const DOWNSCALE_OPTIONS = [
  { value: "1", label: "Full" },
  { value: "2", label: "1/2" },
  { value: "4", label: "1/4" },
  { value: "8", label: "1/8" },
];

interface SliderSpec {
  label: string;
  field: string;
  min: number;
  max: number;
  step?: number;
  /** Neutral value shown dimmed (stage off). */
  neutral: number;
}

const TRANSFORM_SLIDERS: SliderSpec[] = [
  { label: "TILE X", field: "fx.tileX", min: 1, max: 8, step: 1, neutral: 1 },
  { label: "TILE Y", field: "fx.tileY", min: 1, max: 8, step: 1, neutral: 1 },
  { label: "ZOOM", field: "fx.zoom", min: 0.1, max: 4, step: 0.01, neutral: 1 },
  { label: "ZOOM X", field: "fx.zoomX", min: 0.1, max: 4, step: 0.01, neutral: 1 },
  { label: "ZOOM Y", field: "fx.zoomY", min: 0.1, max: 4, step: 0.01, neutral: 1 },
  { label: "ROTATION", field: "fx.rotationDeg", min: -180, max: 180, step: 1, neutral: 0 },
  { label: "ANCHOR X", field: "fx.anchorX", min: 0, max: 1, step: 0.01, neutral: 0.5 },
  { label: "ANCHOR Y", field: "fx.anchorY", min: 0, max: 1, step: 0.01, neutral: 0.5 },
  { label: "PAN X", field: "fx.panX", min: -1, max: 1, step: 0.01, neutral: 0 },
  { label: "PAN Y", field: "fx.panY", min: -1, max: 1, step: 0.01, neutral: 0 },
];

const COLOR_SLIDERS: SliderSpec[] = [
  { label: "BLUR", field: "fx.blur", min: 0, max: 1, step: 0.01, neutral: 0 },
  { label: "TRAIL", field: "fx.motionBlur", min: 0, max: 0.95, step: 0.01, neutral: 0 },
  { label: "BRIGHT", field: "fx.brightness", min: 0, max: 3, step: 0.01, neutral: 1 },
  { label: "CONTRAST", field: "fx.contrast", min: 0, max: 3, step: 0.01, neutral: 1 },
  { label: "SAT", field: "fx.saturation", min: 0, max: 3, step: 0.01, neutral: 1 },
  { label: "HUE", field: "fx.hue", min: -180, max: 180, step: 1, neutral: 0 },
];

const EDGE_SLIDERS: SliderSpec[] = [
  { label: "LEFT", field: "fx.edgeBlend.left", min: 0, max: 0.5, step: 0.005, neutral: 0 },
  { label: "RIGHT", field: "fx.edgeBlend.right", min: 0, max: 0.5, step: 0.005, neutral: 0 },
  { label: "TOP", field: "fx.edgeBlend.top", min: 0, max: 0.5, step: 0.005, neutral: 0 },
  { label: "BOTTOM", field: "fx.edgeBlend.bottom", min: 0, max: 0.5, step: 0.005, neutral: 0 },
  { label: "GAMMA", field: "fx.edgeBlend.gamma", min: 0.5, max: 4, step: 0.05, neutral: 2 },
];

// Mask geometry — engine-honored (render client uploads all five as uniforms); the
// "neutral" marks are the server defaults, so an untouched mask reads dimmed.
const MASK_SLIDERS: SliderSpec[] = [
  { label: "CENTER X", field: "mask.cx", min: 0, max: 1, step: 0.005, neutral: 0.5 },
  { label: "CENTER Y", field: "mask.cy", min: 0, max: 1, step: 0.005, neutral: 0.5 },
  { label: "SIZE X", field: "mask.rx", min: 0.02, max: 1, step: 0.005, neutral: 0.4 },
  { label: "SIZE Y", field: "mask.ry", min: 0.02, max: 1, step: 0.005, neutral: 0.4 },
  { label: "FEATHER", field: "mask.feather", min: 0, max: 0.5, step: 0.005, neutral: 0.08 },
];

function readField(root: Record<string, unknown>, field: string): number {
  const keys = field.split(".").slice(1); // drop the "fx."/"mask." prefix
  let node: unknown = root;
  for (const key of keys) node = (node as Record<string, unknown> | undefined)?.[key];
  return typeof node === "number" ? node : 0;
}

function FxSlider({
  spec,
  root,
  onUpdate,
}: {
  spec: SliderSpec;
  root: Record<string, unknown>;
  onUpdate?: FxDrawerProps["onUpdate"];
}) {
  const value = readField(root, spec.field);
  return (
    <label className="fx-control" data-neutral={value === spec.neutral}>
      <span className="fx-label">{spec.label}</span>
      <Fader
        value={value}
        min={spec.min}
        max={spec.max}
        step={spec.step ?? 0.01}
        ariaLabel={spec.label}
        onChange={(v) => onUpdate?.(spec.field, v)}
      />
      <span className="fx-val mono">{spec.step === 1 ? value.toFixed(0) : value.toFixed(2)}</span>
    </label>
  );
}

function FxSection({
  caption,
  enabled,
  onToggleEnabled,
  children,
}: {
  caption: string;
  /** When supplied (alongside onToggleEnabled), renders an ON/OFF ToggleSquare in the
   *  caption row — the per-stage bypass (task A7): decouples "toggle a stage off" from
   *  "lose its preset value", unlike driving the section purely off a neutral value. */
  enabled?: boolean;
  onToggleEnabled?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fx-section">
      <span className="fx-cap eyebrow">
        {caption}
        {onToggleEnabled && (
          <ToggleSquare
            className="fx-section-enable"
            label={enabled ? "ON" : "OFF"}
            title={`${enabled ? "Disable" : "Enable"} the ${caption} stage`}
            active={!!enabled}
            onClick={onToggleEnabled}
          />
        )}
      </span>
      <div className="fx-row">{children}</div>
    </div>
  );
}

/** A plain numeric field committed on blur/Enter (TextField under the hood — there's no
 *  dedicated number-input primitive), used for loop in/out and playlist item duration
 *  where a free-typed value beats a bounded fader. Blank commits `undefined`/`null`
 *  (caller-supplied) so "no fixed point" stays representable. */
function NumField({
  className,
  value,
  placeholder,
  onCommit,
}: {
  className?: string;
  value: number | null | undefined;
  placeholder?: string;
  onCommit: (value: number | null) => void;
}) {
  return (
    <TextField
      className={className}
      value={value != null ? String(value) : ""}
      placeholder={placeholder}
      onCommit={(v) => onCommit(v.trim() === "" ? null : Math.max(0, Number(v) || 0))}
    />
  );
}

function playlistItemLabel(item: PlaylistItem, media: MediaItem[]): string {
  if (item.ref?.type === "media") return media.find((m) => m.id === item.ref?.mediaId)?.name ?? "(missing media)";
  if (item.ref?.type === "slot") return `Slot: ${item.ref.slotId}`;
  return "(empty)";
}

/** The playlist's ordered item list: media picker + still duration + reorder/remove per
 *  row, "+ Add item" to append. One state leaf ("layers.<id>.playlist") — edits replace
 *  the whole array, same convention as CueList's cue editing. */
function PlaylistEditor({
  items,
  media,
  onChange,
}: {
  items: PlaylistItem[];
  media: MediaItem[];
  onChange: (items: PlaylistItem[]) => void;
}) {
  const patchItem = (index: number, patch: Partial<PlaylistItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const moveItem = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const addItem = () => onChange([...items, { ref: media[0] ? { type: "media", mediaId: media[0].id } : null }]);

  return (
    <div className="playlist-editor">
      {items.length === 0 && <div className="empty-note mono">no items — add one below</div>}
      {items.map((item, index) => (
        <div className="playlist-row" key={index}>
          <span className="playlist-idx mono">{String(index).padStart(2, "0")}</span>
          <Select
            // A slot-type item can't be represented by the media list — show its own option
            // (so the select doesn't misleadingly display the first media as selected) and
            // don't overwrite the slot binding unless the operator actually picks a media.
            value={item.ref?.type === "media" ? (item.ref.mediaId ?? "") : item.ref?.type === "slot" ? "__slot__" : ""}
            options={[
              ...(item.ref?.type === "slot" ? [{ value: "__slot__", label: playlistItemLabel(item, media) }] : []),
              ...(media.length ? media.map((m) => ({ value: m.id, label: m.name })) : [{ value: "", label: "(no media)" }]),
            ]}
            onChange={(v) => { if (v === "__slot__") return; patchItem(index, { ref: v ? { type: "media", mediaId: v } : null }); }}
          />
          <NumField
            className="playlist-duration"
            value={item.duration}
            placeholder="sec (blank = play through)"
            onCommit={(v) => patchItem(index, { duration: v ?? undefined })}
          />
          <ToggleSquare label="▲" title="Move earlier" disabled={index === 0} onClick={() => moveItem(index, -1)} />
          <ToggleSquare label="▼" title="Move later" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} />
          <ToggleSquare className="remove-btn" label="×" title={`Remove "${playlistItemLabel(item, media)}"`} onClick={() => removeItem(index)} />
        </div>
      ))}
      <Button label="+ Add item" onClick={addItem} />
    </div>
  );
}

/** The per-layer effects chain controls (vlayer.maxpat's stages) in captioned sections:
 *  TRANSFORM (flip/tile/zoom/pan), COLOR (blur/trail/brcosa), EDGE BLEND (projector
 *  ramps) and MASK geometry. Rendered inside an expanded LayerStrip. */
export function FxDrawer({
  fx,
  mask,
  transport,
  transportPosition,
  sourceMode,
  playlist,
  downscale,
  media,
  onUpdate,
  onEditMask,
  onEditWarp,
  onSetSourceMode,
  onSetPlaylist,
  onTriggerClip,
}: FxDrawerProps) {
  const fxRoot = fx as unknown as Record<string, unknown>;
  return (
    <div className="fx-drawer">
      <FxSection
        caption="Transform"
        enabled={fx.enabled?.transform ?? true}
        onToggleEnabled={() => onUpdate?.("fx.enabled.transform", !(fx.enabled?.transform ?? true))}
      >
        <ToggleSquare
          label="⇋"
          title="Flip horizontal"
          active={!!fx.flipH}
          onClick={() => onUpdate?.("fx.flipH", !fx.flipH)}
        />
        <ToggleSquare
          label="⇵"
          title="Flip vertical"
          active={!!fx.flipV}
          onClick={() => onUpdate?.("fx.flipV", !fx.flipV)}
        />
        {TRANSFORM_SLIDERS.map((spec) => (
          <FxSlider key={spec.field} spec={spec} root={fxRoot} onUpdate={onUpdate} />
        ))}
      </FxSection>
      <FxSection
        caption="Color"
        enabled={fx.enabled?.color ?? true}
        onToggleEnabled={() => onUpdate?.("fx.enabled.color", !(fx.enabled?.color ?? true))}
      >
        {COLOR_SLIDERS.map((spec) => (
          <FxSlider key={spec.field} spec={spec} root={fxRoot} onUpdate={onUpdate} />
        ))}
        <label className="fx-control" data-neutral={(fx.motionBlurMode ?? "trail") === "trail"}>
          <span className="fx-label">BLUR MODE</span>
          <Select
            value={fx.motionBlurMode ?? "trail"}
            options={[
              { value: "trail", label: "Trail" },
              { value: "slide", label: "Slide" },
            ]}
            onChange={(v) => onUpdate?.("fx.motionBlurMode", v)}
          />
        </label>
        {fx.motionBlurMode === "slide" && (
          <FxSlider
            spec={{ label: "ANGLE", field: "fx.motionBlurAngle", min: -180, max: 180, step: 1, neutral: 0 }}
            root={fxRoot}
            onUpdate={onUpdate}
          />
        )}
      </FxSection>
      <FxSection
        caption="Edge blend"
        enabled={fx.enabled?.edgeBlend ?? true}
        onToggleEnabled={() => onUpdate?.("fx.enabled.edgeBlend", !(fx.enabled?.edgeBlend ?? true))}
      >
        {EDGE_SLIDERS.map((spec) => (
          <FxSlider key={spec.field} spec={spec} root={fxRoot} onUpdate={onUpdate} />
        ))}
        <ToggleSquare
          label="INV"
          title="Invert edge blend (fade the center instead of the edges)"
          active={!!fx.edgeBlend.invert}
          onClick={() => onUpdate?.("fx.edgeBlend.invert", !fx.edgeBlend.invert)}
        />
      </FxSection>
      <FxSection caption="Warp">
        <Select
          className="corner-preset-select"
          value=""
          options={[
            { value: "", label: "Preset…" },
            { value: "full", label: "Full" },
            { value: "center", label: "Center" },
            { value: "leftThird", label: "Left third" },
            { value: "rightThird", label: "Right third" },
            { value: "rotate90", label: "Rotate 90°" },
            { value: "rotate180", label: "Rotate 180°" },
            { value: "rotate270", label: "Rotate 270°" },
          ]}
          onChange={(v) => { if (v) onUpdate?.("__cornerPreset__", v); }}
        />
        {onEditWarp && <Button label="Edit on canvas" onClick={onEditWarp} />}
      </FxSection>
      {mask && (
        <FxSection caption="Mask">
          <ToggleSquare
            label={mask.enabled ? "On" : "Off"}
            title="Toggle mask for this layer"
            active={!!mask.enabled}
            onClick={() => onUpdate?.("mask.enabled", !mask.enabled)}
          />
          <ToggleSquare
            label={mask.shape === "polygon" ? "▽" : mask.shape === "rect" ? "□" : "○"}
            title={mask.shape === "polygon" ? "Polygon mask — edit shape in the Inspector's Mask section" : "Mask shape (rect / ellipse)"}
            // This quick toggle only knows rect/ellipse. A polygon mask has its own point
            // editor in the Mask section — clicking here used to silently convert it to a
            // rect and orphan its points. Do nothing for polygon; only flip rect<->ellipse.
            onClick={() => { if (mask.shape !== "polygon") onUpdate?.("mask.shape", mask.shape === "rect" ? "ellipse" : "rect"); }}
          />
          {onEditMask && <Button label="Edit on canvas" onClick={onEditMask} />}
          {MASK_SLIDERS.map((spec) => (
            <FxSlider
              key={spec.field}
              spec={spec}
              root={mask as unknown as Record<string, unknown>}
              onUpdate={onUpdate}
            />
          ))}
        </FxSection>
      )}
      {transport && (
        <FxSection caption="Transport">
          <TransportControls
            transport={transport}
            position={transportPosition}
            onUpdate={(field, value) => onUpdate?.(`transport.${field}`, value)}
          />
        </FxSection>
      )}
      {downscale !== undefined && (
        <FxSection caption="Adapt">
          <label className="fx-control" data-neutral={(downscale ?? 1) === 1}>
            <span className="fx-label">DOWNSCALE</span>
            <Select
              className="downscale-select"
              value={String(downscale ?? 1)}
              options={DOWNSCALE_OPTIONS}
              onChange={(v) => onUpdate?.("downscale", Number(v))}
            />
          </label>
        </FxSection>
      )}
      {sourceMode !== undefined && (
        <FxSection caption="Playlist">
          <ToggleSquare
            label={sourceMode === "playlist" ? "Playlist" : "Single"}
            title="Toggle between a single fixed source and an ordered playlist"
            active={sourceMode === "playlist"}
            onClick={() => onSetSourceMode?.(sourceMode === "playlist" ? "single" : "playlist")}
          />
          {sourceMode === "playlist" && (
            <>
              {/* Manual clip trigger (task A15 — VPT8's /trig /last /random). */}
              <div className="playlist-triggers">
                <Button label="◀ Prev" onClick={() => onTriggerClip?.("prev")} />
                <Button label="Random" onClick={() => onTriggerClip?.("random")} />
                <Button label="Next ▶" onClick={() => onTriggerClip?.("next")} />
              </div>
              <PlaylistEditor
                items={playlist?.items ?? []}
                media={media ?? []}
                onChange={(items) => onSetPlaylist?.(items)}
              />
            </>
          )}
        </FxSection>
      )}
    </div>
  );
}
