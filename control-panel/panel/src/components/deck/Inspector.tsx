import { memo, useState, type ReactNode } from "react";
import { Select } from "../primitives/Select";
import { Fader } from "../primitives/Fader";
import { TextField } from "../primitives/TextField";
import { ToggleSquare } from "../primitives/ToggleSquare";
import { FxDrawer } from "../FxDrawer";
import { CameraPicker } from "../CameraPicker";
import { rgbToHex } from "../color";
import { BLEND_MODES, type CameraDevice, type Layer, type MediaItem, type PlaylistItem, type Screen, type SourceBankSlot, type SourceRef, type Warp } from "../types";

/** Which stage-editing mode the segment (and, via `onModeChange`, the Stage's
 *  StageSelectionOverlay — Task 6) is showing for the selected layer. Mirrors
 *  `src/app/useSelection.ts`'s `EditMode` / `StageSelectionOverlay`'s `StageEditMode` —
 *  redeclared here (not imported) because components/ never imports from src/app/, and
 *  this file stays decoupled from StageSelectionOverlay too (no cross-import needed for
 *  a 3-string union). The three must be kept in sync by hand. */
export type EditMode = "warp" | "mask" | "fx";

/** Which object the Inspector is editing (Task 12): the selected LAYER (unchanged) or
 *  the active SCREEN's projector warp. Mirrors `src/app/useSelection.ts`'s
 *  `EditTarget` / `StageSelectionOverlay`'s `StageEditTarget` — redeclared here for the
 *  same decoupling reason as `EditMode` above. */
export type EditTarget = "layer" | "screen";

export interface InspectorLayerProps {
  /** Shows the selected LAYER's controls (default, pre-Task-12 behavior below). */
  editTarget: "layer";
  /** The selected layer, or `null` when nothing is selected (empty state). */
  layer: Layer | null;
  mode: EditMode;
  /** Fired when a Warp/Mask/FX section header is clicked. The container binds this to
   *  the SAME `selection.stageEditMode` setter that drives StageSelectionOverlay, so one
   *  click both expands the section and swaps the on-stage handles at once. */
  onModeChange: (mode: EditMode) => void;
  /** Library items offered in the source picker when the layer source is a URL/slot. */
  media?: MediaItem[];
  sourceBank?: SourceBankSlot[];
  /** Enumerated video-input devices (task A14) for a camera layer source's device picker. */
  cameraDevices?: CameraDevice[];
  /** The screen registry, for the per-layer screen-routing chips (owner request
   *  2026-07-16): which physical outputs this layer composites on. */
  allScreens?: { id: string; name?: string }[];
  /** Live playback position (seconds) for the selected layer — the FX drawer's Transport
   *  scrub readout (task A11). From the transportStatus telemetry relay. */
  transportPosition?: number;
  /** Clip duration (seconds) from the same relay, so the scrub thumb can track the playhead. */
  transportDuration?: number;
  /** Field paths are relative to the layer ("opacity", "blendMode", "source",
   *  "mask.feather", "fx.zoom", ...) — the SAME write path LayerStrip's `onUpdate` and
   *  FxDrawer's `onUpdate` already use. The container wires this to
   *  `actions.updateLayer(layer.id, field, value)`, exactly like ChannelRack does for
   *  LayerStrip. */
  onUpdate?: (field: string, value: unknown) => void;
  /** FX drawer's Playlist section — same callbacks ChannelRack threads to LayerStrip. */
  onSetSourceMode?: (mode: "single" | "playlist") => void;
  onSetPlaylist?: (items: PlaylistItem[]) => void;
  /** Manual clip trigger (task A15): advance/retreat/randomize a playlist layer's cursor.
   *  Wired to `actions.triggerClip(layer.id, which)`. */
  onTriggerClip?: (which: "next" | "prev" | "random") => void;
  /** FX drawer's Warp section (corner-pin preset menu) — same callback ChannelRack
   *  threads to LayerStrip, wired to `actions.applyLayerCornerPreset(layer.id, preset)`. */
  onApplyCornerPreset?: (preset: string) => void;
  /** Warp mode body — the SAME layer-warp actions WarpEditor's `warpEditLayer` path
   *  calls (`setLayerWarpMode` / `setLayerMeshSize` / `resetLayerWarp`). Per-corner drag
   *  itself happens on the stage (Task 6's StageSelectionOverlay, via
   *  `moveLayerWarpPoint`); this panel only shows a live read-only readout of the
   *  resulting coordinates, so no move-point callback is needed here. */
  onSetWarpMode?: (mode: "corner" | "mesh") => void;
  onSetMeshSize?: (size: number) => void;
  onResetWarp?: () => void;
}

export interface InspectorScreenProps {
  /** Shows the active SCREEN's warp controls instead (Task 12). Selected via the
   *  LayerStack's pinned OUTPUT row — the old in-Inspector Layer/Screen toggle is gone. */
  editTarget: "screen";
  /** The active screen, or `null`/undefined before the first screen snapshot arrives. */
  screen?: Screen | null;
  /** Screen warp controls (Task 12) — the EXISTING screen warp actions
   *  (`setWarpMode`/`setMeshSize`/`resetWarp`/`renameScreen`) WarpEditor used to call
   *  for its default (non-layer) target, now driven from here instead. Same shape as
   *  the layer-warp callbacks above, just scoped to the active screen; per-corner drag
   *  itself happens on the stage (StageSelectionOverlay's screen-warp handles). */
  onRenameScreen?: (name: string) => void;
  onSetScreenWarpMode?: (mode: "corner" | "mesh") => void;
  onSetScreenMeshSize?: (size: number) => void;
  onResetScreenWarp?: () => void;
  /** Omitted/no-op-disabled when only one screen remains — a show always needs at
   *  least one output (the server refuses the delete too; this just avoids a dead
   *  click). */
  onRemoveScreen?: () => void;
  screenCount?: number;
}

/** Discriminated union keyed on `editTarget` (type-tighten cleanup): a "layer" props
 *  object requires `layer` and the layer callbacks (`mode`, `onModeChange`, `onUpdate`,
 *  etc.) and forbids the screen-only fields; a "screen" props object requires `screen`
 *  and forbids the layer-only fields. Makes the invalid combos the old optional-
 *  everything shape allowed (e.g. `editTarget: "screen"` with layer-only `mode`) a
 *  compile error instead of a silent no-op. */
export type InspectorProps = InspectorLayerProps | InspectorScreenProps;

function sourceSummary(source: Layer["source"]): string {
  if (!source) return "";
  switch (source.type) {
    case "video":
      return `Video · ${source.url || "no url"}`;
    case "color":
      return `Color · ${rgbToHex(source.color ?? [0.5, 0.5, 0.5])}`;
    case "camera":
      return "Camera · live capture";
    case "slot":
      return `Shared Slot · ${source.slotId ?? ""}`;
    default:
      return "";
  }
}

/** A 2-state (or N-state) segmented toggle — the mockup's `.togglepill` (corner/mesh,
 *  mask on/off, mask shape). Not a shared primitive (yet): scoped to this file since
 *  it's the only consumer so far. */
function TogglePill({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  /** Names the group of pills for assistive tech — without it, two "On/Off" pills in the
   *  same section (mask Enabled + Invert) are indistinguishable to a screen reader. */
  label?: string;
}) {
  return (
    <div className="togglepill" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** One always-visible Warp/Mask/FX section: a header row (title + live summary +
 *  chevron) that is ALWAYS on screen, with the body expanded only while active. This
 *  replaces the old exclusive Warp·Mask·FX segment — every capability now announces
 *  itself (with its current state) instead of hiding behind an unselected toggle, and
 *  activating a section still drives the same `selection.stageEditMode`, so the on-stage
 *  handles follow the expanded section exactly as they followed the segment. */
function InspectorSection({
  title,
  summary,
  active,
  defaultOpen = false,
  onActivate,
  children,
}: {
  title: string;
  summary: string;
  /** True when THIS section owns the on-stage handles (stage edit mode). Independent of
   *  whether the section is expanded — sections open/close independently now (de-modal
   *  2026-07-16: the old accordion showed only one at a time, hiding 2/3 of the controls). */
  active: boolean;
  defaultOpen?: boolean;
  onActivate: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="insp-sec" data-active={active} data-open={open}>
      <button
        type="button"
        className="insp-sec__head"
        aria-label={title}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => {
            // Only re-point the on-stage handles when EXPANDING (or re-touching the already-
            // active section). Clicking purely to COLLAPSE a section must not hijack the
            // stage edit mode away from whatever the operator was actually editing.
            if (!o || active) onActivate();
            return !o;
          });
        }}
      >
        <span className="insp-sec__title">{title}</span>
        <span className="insp-sec__sum mono">{summary}</span>
        <span className="insp-sec__chev" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && <div className="insp-sec__body ctx">{children}</div>}
    </section>
  );
}

/** Header-summary helpers — one glance tells the operator each section's state without
 *  expanding it (HeavyM's consolidated-effects lesson: browsable, not buried). */
function warpSummary(warp: Warp | undefined): string {
  if (!warp) return "corner";
  return warp.mode === "mesh" ? `mesh ${warp.mesh?.size ?? 4}×${warp.mesh?.size ?? 4}` : "corner";
}
function maskSummary(layer: Layer): string {
  if (!layer.mask?.enabled) return "off";
  const shape = layer.mask.source ? "matte" : layer.mask.shape;
  return layer.mask.invert ? `${shape} · inverted` : shape;
}
function fxSummary(layer: Layer): string {
  const enabled = layer.fx?.enabled;
  if (!enabled) return "";
  const groups = [enabled.transform && "transform", enabled.color && "color", enabled.edgeBlend && "edge"].filter(Boolean);
  return groups.length === 3 ? "all on" : groups.length ? groups.join(" · ") : "bypassed";
}

/** The Source field: type select + per-type detail control. Mirrors LayerStrip's
 *  inline source picker verbatim (same primitives, same `onUpdate("source", {...})`
 *  value shapes) — duplicated rather than imported because LayerStrip doesn't export it
 *  as a subcomponent; keep the two in sync by hand if the source model changes. */
function SourceControl({
  layer,
  media = [],
  sourceBank = [],
  cameraDevices = [],
  onUpdate,
}: {
  layer: Layer;
  media?: MediaItem[];
  sourceBank?: SourceBankSlot[];
  cameraDevices?: CameraDevice[];
  onUpdate?: (field: string, value: unknown) => void;
}) {
  const isColor = layer.source?.type === "color";
  const mediaOptions = media.map((m) => ({ value: `/media/${m.filename}`, label: m.name }));
  const currentUrl = layer.source?.url ?? "";
  const isLibraryUrl = mediaOptions.some((o) => o.value === currentUrl);
  // An EMPTY url is "library-first" (show the picker), not external — only a non-empty,
  // non-library url is genuinely external. (A fresh video layer used to open in External-URL
  // mode with a blank text field, hiding the library list.)
  const isExternalUrl = currentUrl !== "" && !isLibraryUrl;
  const [externalMode, setExternalMode] = useState(isExternalUrl);

  return (
    <div className="source-group">
      <Select
        className="source-type"
        ariaLabel="Source type"
        value={layer.source?.type ?? "video"}
        options={[
          { value: "video", label: "Video URL" },
          { value: "color", label: "Solid color" },
          { value: "camera", label: "Camera" },
          { value: "slot", label: "Shared Slot" },
        ]}
        onChange={(v) =>
          onUpdate?.(
            "source",
            v === "color"
              ? { type: "color", color: layer.source?.color ?? [0.5, 0.5, 0.5] }
              : v === "camera"
                ? { type: "camera" }
                : v === "slot"
                  ? { type: "slot", slotId: sourceBank[0]?.id ?? "slot-1" }
                  : { type: "video", url: layer.source?.url ?? "" },
          )
        }
      />
      <div className="source-field">
        {layer.source?.type === "camera" ? (
          <CameraPicker
            deviceId={layer.source.deviceId}
            resolution={layer.source.resolution}
            devices={cameraDevices}
            onDevice={(deviceId) => onUpdate?.("source", { type: "camera", deviceId, resolution: layer.source?.resolution })}
            onResolution={(resolution) => onUpdate?.("source", { type: "camera", deviceId: layer.source?.deviceId, resolution: resolution ?? undefined })}
          />
        ) : layer.source?.type === "slot" ? (
          <Select
            ariaLabel="Shared slot"
            value={layer.source.slotId ?? ""}
            options={sourceBank.map((s) => ({ value: s.id, label: s.name }))}
            onChange={(v) => onUpdate?.("source", { type: "slot", slotId: v })}
          />
        ) : isColor ? (
          <input
            type="color"
            aria-label="Layer color"
            value={rgbToHex(layer.source.color ?? [0.5, 0.5, 0.5])}
            onChange={(e) => {
              const hex = e.target.value;
              const color = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
              onUpdate?.("source", { type: "color", color });
            }}
          />
        ) : (
          <>
            <Select
              className="source-media-select"
              ariaLabel="Source media"
              value={externalMode || isExternalUrl ? "__external__" : currentUrl}
              options={[...mediaOptions, { value: "__external__", label: "External URL…" }]}
              onChange={(v) => {
                if (v === "__external__") {
                  setExternalMode(true);
                } else {
                  setExternalMode(false);
                  onUpdate?.("source", { type: "video", url: v });
                }
              }}
            />
            {(externalMode || isExternalUrl) && (
              <TextField
                value={currentUrl}
                placeholder="/media/video.mp4 or https://…"
                ariaLabel="External media URL"
                onCommit={(v) => onUpdate?.("source", { type: "video", url: v })}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

const CORNER_TAGS = ["TL", "TR", "BR", "BL"]; // index order matches Warp.corners (see WarpEditor/StageSelectionOverlay)
// VPT8's mesh warp order range is 2-10 (task A8 parity); the render-client now
// bicubic-subdivides the control grid (render-client/src/warp.js) so even the sparsest
// 2x2/3x3 control grids render as a smooth surface, not faceted triangles.
const MESH_SIZES = [2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: String(n), label: `${n}×${n}` }));
// Corner-pin quick presets (moved here from the FX drawer's old duplicate Warp section so
// the dedicated Warp section is the ONE place warp is edited). Only meaningful in corner
// mode — they set the four corner positions.
const CORNER_PRESETS = [
  { value: "", label: "Preset…" },
  { value: "full", label: "Full" },
  { value: "center", label: "Center" },
  { value: "leftThird", label: "Left third" },
  { value: "rightThird", label: "Right third" },
  { value: "rotate90", label: "Rotate 90°" },
  { value: "rotate180", label: "Rotate 180°" },
  { value: "rotate270", label: "Rotate 270°" },
];

/** Warp contextual body: corner/mesh mode toggle, mesh size, reset, and a live
 *  READ-ONLY coordinate readout (the actual drag interaction lives on the stage —
 *  Task 6's StageSelectionOverlay — so this panel only mirrors the resulting numbers,
 *  the same way the mockup's `.coords` grid does). Takes a bare `Warp` (Task 12)
 *  rather than a `Layer` so the exact same body serves both a layer's own warp and the
 *  active screen's projector warp — the caller supplies whichever `warp` + action
 *  callbacks belong to its target. */
function WarpBody({
  warp,
  onSetWarpMode,
  onSetMeshSize,
  onResetWarp,
  onApplyCornerPreset,
}: {
  warp: Warp | undefined;
  onSetWarpMode?: (mode: "corner" | "mesh") => void;
  onSetMeshSize?: (size: number) => void;
  onResetWarp?: () => void;
  /** Layer-only corner-pin presets (screens don't wire this — they get no preset menu). */
  onApplyCornerPreset?: (preset: string) => void;
}) {
  const isMesh = warp?.mode === "mesh";
  const size = warp?.mesh?.size ?? 4;
  const points = isMesh ? (warp?.mesh?.points ?? []) : (warp?.corners ?? []);

  return (
    <>
      <div className="subhead">
        Corner-pin
        <button type="button" className="rst" onClick={() => onResetWarp?.()}>
          Reset
        </button>
      </div>
      <TogglePill
        label="Warp mode"
        options={[
          { value: "corner", label: "Corner" },
          { value: "mesh", label: "Mesh" },
        ]}
        value={isMesh ? "mesh" : "corner"}
        onChange={(v) => onSetWarpMode?.(v as "corner" | "mesh")}
      />
      {isMesh ? (
        <Select className="mesh-size-select" ariaLabel="Mesh grid size" value={String(size)} options={MESH_SIZES} onChange={(v) => onSetMeshSize?.(Number(v))} />
      ) : (
        onApplyCornerPreset && (
          <Select
            className="corner-preset-select"
            ariaLabel="Warp corner preset"
            value=""
            options={CORNER_PRESETS}
            onChange={(v) => { if (v) onApplyCornerPreset(v); }}
          />
        )
      )}
      <div className="coords">
        {points.map((p, i) => (
          <div className="coord" key={i}>
            <span className="t">{isMesh ? `R${Math.floor(i / size) + 1}·C${(i % size) + 1}` : (CORNER_TAGS[i] ?? String(i))}</span>
            <span className="v mono">
              {p.x.toFixed(2)} · {p.y.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/** The mask-matte source picker (task A5 — VPT8 parity: `layermask.maxpat`'s `pattr
 *  source` + `cc.alphaglue.jxs` `lum2alpha`). Mirrors `SourceBankSlotEditor`'s `RefPicker`
 *  value-encoding (`media:<id>`/`slot:<id>`, `""` = none) but offers a "None" option to
 *  clear the matte back to the geometric shape. When a matte is set, the render-client
 *  drives the mask alpha from this source's luminance, overriding the shape. */
function MatteSourcePicker({
  value,
  media = [],
  sourceBank = [],
  onChange,
}: {
  value: SourceRef | null | undefined;
  media?: MediaItem[];
  sourceBank?: SourceBankSlot[];
  onChange: (ref: SourceRef | null) => void;
}) {
  const options = [
    { value: "", label: "None (use shape)" },
    ...media.map((m) => ({ value: `media:${m.id}`, label: `Media · ${m.name}` })),
    ...sourceBank.map((s) => ({ value: `slot:${s.id}`, label: `Slot · ${s.name}` })),
  ];
  const current = value ? `${value.type}:${value.type === "media" ? value.mediaId : value.slotId}` : "";
  return (
    <Select
      ariaLabel="Mask matte source"
      value={current}
      options={options}
      onChange={(v) => {
        if (!v) return onChange(null);
        const idx = v.indexOf(":");
        const type = v.slice(0, idx);
        const id = v.slice(idx + 1);
        onChange(type === "media" ? { type: "media", mediaId: id } : { type: "slot", slotId: id });
      }}
    />
  );
}

/** A centered regular hexagon in normalized (0..1) mask space, used to seed a polygon
 *  mask's vertices the moment the shape is switched to "polygon" — an empty polygon has
 *  no draggable handles and (before the render-client's <3-point guard) blanked the layer,
 *  so there was no way to bootstrap one from the UI. The operator then drags/inserts/deletes
 *  these vertices on the stage (MaskShapeOverlay). */
const DEFAULT_POLYGON = Array.from({ length: 6 }, (_, i) => {
  const t = (i / 6) * Math.PI * 2 - Math.PI / 2;
  return { x: 0.5 + 0.3 * Math.cos(t), y: 0.5 + 0.3 * Math.sin(t) };
});

/** Mask contextual body: enable toggle, shape toggle (rect/ellipse/polygon), invert
 *  toggle, feather fader, a matte-source picker (task A5), and — for rect/ellipse only —
 *  a live read-only center/radius readout (dragged on the stage, same rationale as
 *  WarpBody). Enable/shape/feather/invert/source write via `updateLayer(id, "mask.<k>", v)`
 *  — the same path FxDrawer's own MASK_SLIDERS and LayerStrip's mask ToggleSquares use.
 *
 *  Polygon (task A4a — VPT8 parity: code/pointmask01.js's free-form draggable mask +
 *  layermask.maxpat's `pattr inv`) has no cx/cy/rx/ry: its vertices (`mask.points`)
 *  are set programmatically here and will get an on-canvas drag editor in task A4b —
 *  this body only shows a note in their place, no point-editor.
 *
 *  Matte (task A5 — layermask.maxpat's `pattr source` + cc.alphaglue's `lum2alpha`): when
 *  `mask.source` is set, that source's luminance drives the alpha instead of the shape;
 *  the shape/feather controls stay editable but a note flags that the matte overrides them. */
function MaskBody({
  layer,
  media,
  sourceBank,
  onUpdate,
}: {
  layer: Layer;
  media?: MediaItem[];
  sourceBank?: SourceBankSlot[];
  onUpdate?: (field: string, value: unknown) => void;
}) {
  const mask = layer.mask;
  const isPolygon = mask.shape === "polygon";
  const hasMatte = Boolean(mask.source);
  return (
    <>
      <div className="subhead">Mask shape</div>
      <div className="mini">
        <span className="label">Enabled</span>
        <TogglePill
          label="Mask enabled"
          options={[
            { value: "on", label: "On" },
            { value: "off", label: "Off" },
          ]}
          value={mask.enabled ? "on" : "off"}
          onChange={(v) => onUpdate?.("mask.enabled", v === "on")}
        />
      </div>
      <div className="mini">
        <span className="label">Shape</span>
        <TogglePill
          label="Mask shape"
          options={[
            { value: "ellipse", label: "Ellipse" },
            { value: "rect", label: "Rect" },
            { value: "polygon", label: "Polygon" },
          ]}
          value={mask.shape}
          onChange={(v) => {
            onUpdate?.("mask.shape", v);
            // Seed vertices when switching INTO polygon with none yet, so the on-canvas
            // editor has handles to drag (and the layer isn't blanked by an empty polygon).
            if (v === "polygon" && (mask.points?.length ?? 0) < 3) {
              onUpdate?.("mask.points", DEFAULT_POLYGON);
            }
          }}
        />
      </div>
      <div className="mini">
        <span className="label">Invert</span>
        <TogglePill
          label="Mask invert"
          options={[
            { value: "on", label: "On" },
            { value: "off", label: "Off" },
          ]}
          value={mask.invert ? "on" : "off"}
          onChange={(v) => onUpdate?.("mask.invert", v === "on")}
        />
      </div>
      <div className="field">
        <span className="label">Matte</span>
        <MatteSourcePicker
          value={mask.source}
          media={media}
          sourceBank={sourceBank}
          onChange={(ref) => onUpdate?.("mask.source", ref)}
        />
      </div>
      {hasMatte ? (
        <p className="mask-note">Matte active: the mask alpha follows this source&apos;s luminance (bright = visible), overriding the shape. Invert still applies.</p>
      ) : (
        <>
          <div className="field">
            <span className="label">Feather</span>
            <div className="row">
              <Fader key={layer.id} value={mask.feather} min={0} max={0.5} step={0.005} ariaLabel="Mask feather" onChange={(v) => onUpdate?.("mask.feather", v)} />
              <span className="mono">{mask.feather.toFixed(2)}</span>
            </div>
          </div>
          {isPolygon ? (
            <p className="mask-note">Drag the polygon points on the stage. Click near an edge to insert a vertex. Delete removes the selected vertex.</p>
          ) : (
            // Editable center/size (moved here from the FX drawer's old duplicate Mask
            // section, so this dedicated Mask section is the ONE place a rect/ellipse mask
            // is edited numerically — the stage handles remain the direct-manipulation path).
            <>
              <div className="field">
                <span className="label">Center X</span>
                <div className="row">
                  <Fader value={mask.cx} min={0} max={1} step={0.005} ariaLabel="Mask center X" onChange={(v) => onUpdate?.("mask.cx", v)} />
                  <span className="mono">{mask.cx.toFixed(2)}</span>
                </div>
              </div>
              <div className="field">
                <span className="label">Center Y</span>
                <div className="row">
                  <Fader value={mask.cy} min={0} max={1} step={0.005} ariaLabel="Mask center Y" onChange={(v) => onUpdate?.("mask.cy", v)} />
                  <span className="mono">{mask.cy.toFixed(2)}</span>
                </div>
              </div>
              <div className="field">
                <span className="label">Size X</span>
                <div className="row">
                  <Fader value={mask.rx} min={0.02} max={1} step={0.005} ariaLabel="Mask size X" onChange={(v) => onUpdate?.("mask.rx", v)} />
                  <span className="mono">{mask.rx.toFixed(2)}</span>
                </div>
              </div>
              <div className="field">
                <span className="label">Size Y</span>
                <div className="row">
                  <Fader value={mask.ry} min={0.02} max={1} step={0.005} ariaLabel="Mask size Y" onChange={(v) => onUpdate?.("mask.ry", v)} />
                  <span className="mono">{mask.ry.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

/** The contextual right-rail Inspector (Task 7; Task 12 adds the screen-warp target):
 *  shows the selected LAYER's controls — header (swatch/name/index/source line), the
 *  common Source/Opacity/Blend fields every layer has, and the always-visible
 *  Warp/Mask/FX sections (expanded one at a time; every header shows a live summary) —
 *  OR, when `editTarget === "screen"`, the active SCREEN's warp controls (name,
 *  corner/mesh mode, mesh size, reset, coord readout). The screen target is selected
 *  via the LayerStack's pinned OUTPUT row, not an in-Inspector toggle — the old
 *  two-level Layer/Screen → Warp/Mask/FX modality is flattened to a single visible
 *  list of things (output + layers) and a single visible list of capabilities.
 *
 *  The section headers' `onModeChange` is bound (by the container) to the SAME
 *  `selection.stageEditMode` state that drives StageSelectionOverlay, so expanding a
 *  section also swaps which handles show on the stage.
 *
 *  Presentational/decoupled: no `src/app/` import. Every write goes out through a narrow
 *  callback prop, the same "container maps callback -> real action" pattern
 *  StageSelectionOverlay and ChannelRack/LayerStrip already use — App.tsx wires these to
 *  `actions.updateLayer` / the layer-warp actions / the SCREEN warp actions unchanged,
 *  no new WS message types. */
function InspectorView(props: InspectorProps) {
  // Narrow on `props.editTarget` directly (not a destructured copy) so TS actually
  // narrows the union.
  if (props.editTarget === "screen") {
    const { screen, onRenameScreen, onSetScreenWarpMode, onSetScreenMeshSize, onResetScreenWarp, onRemoveScreen, screenCount } = props;
    if (!screen) {
      return (
        <div className="insp-empty">
          <span className="mono">Select a screen</span>
        </div>
      );
    }
    const isLastScreen = (screenCount ?? 2) <= 1;
    return (
      <>
        <div className="insp-head">
          <div className="insp-title">
            <TextField
              className="screen-name-input"
              value={screen.name ?? ""}
              placeholder="Screen name"
              ariaLabel="Screen name"
              onCommit={(v) => onRenameScreen?.(v)}
            />
            <span className="ix mono">{screen.id}</span>
            <ToggleSquare
              className="remove-btn"
              label="×"
              title={isLastScreen ? "Can't remove the only screen" : "Remove screen"}
              disabled={isLastScreen}
              onClick={() => onRemoveScreen?.()}
            />
          </div>
          <div className="insp-sub mono">Projector warp · composited output</div>
        </div>
        <div className="insp-body">
          <div className="ctx">
            <WarpBody warp={screen.warp} onSetWarpMode={onSetScreenWarpMode} onSetMeshSize={onSetScreenMeshSize} onResetWarp={onResetScreenWarp} />
          </div>
        </div>
      </>
    );
  }

  const {
    layer,
    mode,
    onModeChange,
    media,
    sourceBank,
    cameraDevices,
    allScreens,
    transportPosition,
    transportDuration,
    onUpdate,
    onSetSourceMode,
    onSetPlaylist,
    onTriggerClip,
    onApplyCornerPreset,
    onSetWarpMode,
    onSetMeshSize,
    onResetWarp,
  } = props;

  if (!layer) {
    return (
      <div className="insp-empty">
        <span className="mono">Select a layer — or the OUTPUT row to warp the projector</span>
      </div>
    );
  }

  const isColor = layer.source?.type === "color";
  const swatchBg = isColor ? rgbToHex(layer.source?.color ?? [0.5, 0.5, 0.5]) : "linear-gradient(135deg,#12283b,#0c1620)";
  const opacityPct = Math.round((layer.opacity ?? 1) * 100);

  return (
    <>
      <div className="insp-head">
        <div className="insp-title">
          <span className="insp-swatch" style={{ background: swatchBg }} />
          <span className="nm">{layer.name || layer.id}</span>
          <span className="ix mono">L{layer.order ?? 0}</span>
        </div>
        <div className="insp-sub mono">{sourceSummary(layer.source)}</div>
      </div>
      <div className="insp-body">
        <div className="field">
          <span className="label">Source</span>
          {/* key: SourceControl holds per-layer UI state (externalMode) — remount it on
           *  selection change so layer A's "External URL…" choice can't leak onto layer
           *  B's library-sourced picker. */}
          <SourceControl key={layer.id} layer={layer} media={media} sourceBank={sourceBank} cameraDevices={cameraDevices} onUpdate={onUpdate} />
        </div>
        <div className="field">
          <span className="label">Opacity</span>
          <div className="row">
            <Fader key={layer.id} value={layer.opacity ?? 1} ariaLabel="Layer opacity" onChange={(v) => onUpdate?.("opacity", v)} />
            <span className="mono">{opacityPct}%</span>
          </div>
        </div>
        <div className="field">
          <span className="label">Blend</span>
          <Select
            className="blend-select"
            ariaLabel="Blend mode"
            value={layer.blendMode ?? "normal"}
            options={BLEND_MODES.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) }))}
            onChange={(v) => onUpdate?.("blendMode", v)}
          />
        </div>
        {(allScreens?.length ?? 0) > 1 && (
          <div className="field">
            <span className="label">Screens</span>
            <div className="row">
              {allScreens!.map((s) => {
                // null/absent routing = every screen (the default); an array = only those.
                const routed = layer.screens == null || layer.screens.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className="chip mono"
                    data-active={routed}
                    title={routed ? `Shown on ${s.name ?? s.id} — click to remove` : `Hidden on ${s.name ?? s.id} — click to add`}
                    onClick={() => {
                      const all = allScreens!.map((x) => x.id);
                      const current = layer.screens == null ? all : layer.screens;
                      const next = routed ? current.filter((id) => id !== s.id) : [...current, s.id];
                      // Covering every screen normalizes back to null so future screens
                      // are included automatically, matching the default's semantics.
                      onUpdate?.("screens", all.every((id) => next.includes(id)) ? null : next);
                    }}
                  >
                    {s.name ?? s.id}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="insp-sections">
          <InspectorSection title="Warp" summary={warpSummary(layer.warp)} active={mode === "warp"} onActivate={() => onModeChange("warp")}>
            <WarpBody warp={layer.warp} onSetWarpMode={onSetWarpMode} onSetMeshSize={onSetMeshSize} onResetWarp={onResetWarp} onApplyCornerPreset={onApplyCornerPreset} />
          </InspectorSection>
          <InspectorSection title="Mask" summary={maskSummary(layer)} active={mode === "mask"} onActivate={() => onModeChange("mask")}>
            <MaskBody layer={layer} media={media} sourceBank={sourceBank} onUpdate={onUpdate} />
          </InspectorSection>
          <InspectorSection title="FX" summary={fxSummary(layer)} active={mode === "fx"} defaultOpen onActivate={() => onModeChange("fx")}>
            <FxDrawer
              fx={layer.fx}
              transport={layer.transport}
              transportPosition={transportPosition}
              transportDuration={transportDuration}
              sourceMode={layer.sourceMode}
              playlist={layer.playlist}
              downscale={layer.downscale}
              media={media}
              onUpdate={onUpdate}
              onSetSourceMode={onSetSourceMode}
              onSetPlaylist={onSetPlaylist}
              onTriggerClip={onTriggerClip}
            />
          </InspectorSection>
        </div>
      </div>
    </>
  );
}

export const Inspector = memo(InspectorView);
