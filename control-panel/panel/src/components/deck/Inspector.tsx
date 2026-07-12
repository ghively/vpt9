import { useState } from "react";
import { Select } from "../primitives/Select";
import { Fader } from "../primitives/Fader";
import { TextField } from "../primitives/TextField";
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

interface InspectorSharedProps {
  /** Fired when the Layer/Screen toggle at the top is clicked. The container binds
   *  this to the SAME `selection.editTarget` setter that drives StageSelectionOverlay,
   *  so one click swaps both the inspector body and which handles show on the stage. */
  onSetEditTarget: (target: EditTarget) => void;
}

export interface InspectorLayerProps extends InspectorSharedProps {
  /** Shows the selected LAYER's controls (default, pre-Task-12 behavior below). */
  editTarget: "layer";
  /** The selected layer, or `null` when nothing is selected (empty state). */
  layer: Layer | null;
  mode: EditMode;
  /** Fired when the Warp/Mask/FX segment is clicked. The container binds this to the
   *  SAME `selection.stageEditMode` setter that drives StageSelectionOverlay, so one
   *  click swaps both the inspector body and the on-stage handles at once. */
  onModeChange: (mode: EditMode) => void;
  /** Library items offered in the source picker when the layer source is a URL/slot. */
  media?: MediaItem[];
  sourceBank?: SourceBankSlot[];
  /** Enumerated video-input devices (task A14) for a camera layer source's device picker. */
  cameraDevices?: CameraDevice[];
  /** Live playback position (seconds) for the selected layer — the FX drawer's Transport
   *  scrub readout (task A11). From the transportStatus telemetry relay. */
  transportPosition?: number;
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

export interface InspectorScreenProps extends InspectorSharedProps {
  /** Shows the active SCREEN's warp controls instead (Task 12). */
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
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="togglepill">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** The Warp · Mask · FX segment. Highlights `mode` and calls `onModeChange` — the
 *  container binds this straight to `selection.setStageEditMode`. */
function ModeSegment({ mode, onModeChange }: { mode: EditMode; onModeChange: (mode: EditMode) => void }) {
  const options: { key: EditMode; label: string }[] = [
    { key: "warp", label: "Warp" },
    { key: "mask", label: "Mask" },
    { key: "fx", label: "FX" },
  ];
  return (
    <div className="modes" role="group" aria-label="Edit mode">
      {options.map((o) => (
        <button key={o.key} type="button" aria-pressed={mode === o.key} onClick={() => onModeChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
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
  // Start in External mode only if the current url is a non-empty, non-library url.
  const [externalMode, setExternalMode] = useState(currentUrl !== "" && !isLibraryUrl);

  return (
    <div className="source-group">
      <Select
        className="source-type"
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
            value={layer.source.slotId ?? ""}
            options={sourceBank.map((s) => ({ value: s.id, label: s.name }))}
            onChange={(v) => onUpdate?.("source", { type: "slot", slotId: v })}
          />
        ) : isColor ? (
          <input
            type="color"
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
              value={externalMode || !isLibraryUrl ? "__external__" : currentUrl}
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
            {(externalMode || !isLibraryUrl) && (
              <TextField
                value={currentUrl}
                placeholder="/media/video.mp4 or https://…"
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
}: {
  warp: Warp | undefined;
  onSetWarpMode?: (mode: "corner" | "mesh") => void;
  onSetMeshSize?: (size: number) => void;
  onResetWarp?: () => void;
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
        options={[
          { value: "corner", label: "Corner" },
          { value: "mesh", label: "Mesh" },
        ]}
        value={isMesh ? "mesh" : "corner"}
        onChange={(v) => onSetWarpMode?.(v as "corner" | "mesh")}
      />
      {isMesh && (
        <Select className="mesh-size-select" value={String(size)} options={MESH_SIZES} onChange={(v) => onSetMeshSize?.(Number(v))} />
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
          options={[
            { value: "ellipse", label: "Ellipse" },
            { value: "rect", label: "Rect" },
            { value: "polygon", label: "Polygon" },
          ]}
          value={mask.shape}
          onChange={(v) => onUpdate?.("mask.shape", v)}
        />
      </div>
      <div className="mini">
        <span className="label">Invert</span>
        <TogglePill
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
              <Fader value={mask.feather} min={0} max={0.5} step={0.005} ariaLabel="Mask feather" onChange={(v) => onUpdate?.("mask.feather", v)} />
              <span className="mono">{mask.feather.toFixed(2)}</span>
            </div>
          </div>
          {isPolygon ? (
            <p className="mask-note">Drag the polygon points on the stage. Click near an edge to insert a vertex. Delete removes the selected vertex.</p>
          ) : (
            <div className="coords">
              <div className="coord">
                <span className="t">CENTER</span>
                <span className="v mono">
                  {mask.cx.toFixed(2)} · {mask.cy.toFixed(2)}
                </span>
              </div>
              <div className="coord">
                <span className="t">RADIUS</span>
                <span className="v mono">
                  {mask.rx.toFixed(2)} · {mask.ry.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

/** The Layer/Screen toggle (Task 12) shown at the top of the Inspector regardless of
 *  which target is active — lets the operator switch between editing the selected
 *  layer's own warp/mask/fx and the active screen's projector warp. */
function TargetSegment({ target, onChange }: { target: EditTarget; onChange: (target: EditTarget) => void }) {
  return (
    <div className="insp-target">
      <TogglePill
        options={[
          { value: "layer", label: "Layer" },
          { value: "screen", label: "Screen" },
        ]}
        value={target}
        onChange={(v) => onChange(v as EditTarget)}
      />
    </div>
  );
}

/** The contextual right-rail Inspector (Task 7; Task 12 adds the screen-warp target):
 *  shows the selected LAYER's controls — header (swatch/name/index/source line), the
 *  common Source/Opacity/Blend fields every layer has, the Warp · Mask · FX segment,
 *  and a body that swaps with the segment — OR, when `editTarget === "screen"`, the
 *  active SCREEN's warp controls (name, corner/mesh mode, mesh size, reset, coord
 *  readout). The layer segment's `onModeChange` is bound (by the container) to the
 *  SAME `selection.stageEditMode` state that drives StageSelectionOverlay, so
 *  switching it swaps both the inspector body and which handles show on the stage at
 *  once; `onSetEditTarget` does the analogous thing for `selection.editTarget`.
 *
 *  Presentational/decoupled: no `src/app/` import. Every write goes out through a narrow
 *  callback prop, the same "container maps callback -> real action" pattern
 *  StageSelectionOverlay and ChannelRack/LayerStrip already use — App.tsx wires these to
 *  `actions.updateLayer` / the layer-warp actions / the SCREEN warp actions unchanged,
 *  no new WS message types. */
export function Inspector(props: InspectorProps) {
  // Common to both union members — safe to pull out before narrowing.
  const { editTarget, onSetEditTarget } = props;
  const targetSegment = <TargetSegment target={editTarget} onChange={onSetEditTarget} />;

  // Narrow on `props.editTarget` directly (not a destructured copy) so TS actually
  // narrows the union.
  if (props.editTarget === "screen") {
    const { screen, onRenameScreen, onSetScreenWarpMode, onSetScreenMeshSize, onResetScreenWarp } = props;
    if (!screen) {
      return (
        <>
          {targetSegment}
          <div className="insp-empty">
            <span className="mono">Select a screen</span>
          </div>
        </>
      );
    }
    return (
      <>
        {targetSegment}
        <div className="insp-head">
          <div className="insp-title">
            <TextField
              className="screen-name-input"
              value={screen.name ?? ""}
              placeholder="Screen name"
              onCommit={(v) => onRenameScreen?.(v)}
            />
            <span className="ix mono">{screen.id}</span>
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
    transportPosition,
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
      <>
        {targetSegment}
        <div className="insp-empty">
          <span className="mono">Select a layer</span>
        </div>
      </>
    );
  }

  const isColor = layer.source?.type === "color";
  const swatchBg = isColor ? rgbToHex(layer.source?.color ?? [0.5, 0.5, 0.5]) : "linear-gradient(135deg,#12283b,#0c1620)";
  const opacityPct = Math.round((layer.opacity ?? 1) * 100);

  return (
    <>
      {targetSegment}
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
          <SourceControl layer={layer} media={media} sourceBank={sourceBank} cameraDevices={cameraDevices} onUpdate={onUpdate} />
        </div>
        <div className="field">
          <span className="label">Opacity</span>
          <div className="row">
            <Fader value={layer.opacity ?? 1} ariaLabel="Layer opacity" onChange={(v) => onUpdate?.("opacity", v)} />
            <span className="mono">{opacityPct}%</span>
          </div>
        </div>
        <div className="field">
          <span className="label">Blend</span>
          <Select
            className="blend-select"
            value={layer.blendMode ?? "normal"}
            options={BLEND_MODES.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) }))}
            onChange={(v) => onUpdate?.("blendMode", v)}
          />
        </div>

        <div className="field">
          <span className="label">Edit on stage</span>
          <ModeSegment mode={mode} onModeChange={onModeChange} />
        </div>

        <div className="ctx">
          {mode === "warp" && (
            <WarpBody warp={layer.warp} onSetWarpMode={onSetWarpMode} onSetMeshSize={onSetMeshSize} onResetWarp={onResetWarp} />
          )}
          {mode === "mask" && <MaskBody layer={layer} media={media} sourceBank={sourceBank} onUpdate={onUpdate} />}
          {mode === "fx" && (
            <FxDrawer
              fx={layer.fx}
              mask={layer.mask}
              transport={layer.transport}
              transportPosition={transportPosition}
              sourceMode={layer.sourceMode}
              playlist={layer.playlist}
              downscale={layer.downscale}
              media={media}
              onUpdate={(field, value) => {
                if (field === "__cornerPreset__") onApplyCornerPreset?.(value as string);
                else onUpdate?.(field, value);
              }}
              onEditMask={() => onModeChange("mask")}
              onEditWarp={() => onModeChange("warp")}
              onSetSourceMode={onSetSourceMode}
              onSetPlaylist={onSetPlaylist}
              onTriggerClip={onTriggerClip}
            />
          )}
        </div>
      </div>
    </>
  );
}
