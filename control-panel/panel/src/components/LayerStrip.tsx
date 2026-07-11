import { useState } from "react";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Fader } from "./primitives/Fader";
import { Select } from "./primitives/Select";
import { TextField } from "./primitives/TextField";
import { FxDrawer } from "./FxDrawer";
import { BLEND_MODES, type Layer, type MediaItem, type SourceBankSlot } from "./types";

export interface LayerNeighbors {
  /** Whether a move toward the front / back of the stack is possible. */
  above: boolean;
  below: boolean;
}

export interface LayerStripProps {
  layer: Layer;
  neighbors: LayerNeighbors;
  onUpdate?: (field: string, value: unknown) => void;
  onMove?: (dir: "up" | "down") => void;
  onRemove?: () => void;
  /** Copy this layer's look (opacity/blend/mask/fx) to the rack clipboard. */
  onCopy?: () => void;
  /** Paste the rack clipboard onto this layer; hidden while the clipboard is empty. */
  onPaste?: () => void;
  canPaste?: boolean;
  /** Library items offered in the source picker when the layer source is a URL. */
  media?: MediaItem[];
  /** Source-bank slots offered in the source picker when the layer source is "Shared Slot". */
  sourceBank?: SourceBankSlot[];
  /** Opens the on-canvas mask editor for this layer. */
  onEditMask?: () => void;
  /** Opens the on-canvas warp editor for this layer. */
  onEditWarp?: () => void;
  /** Applies a named corner-pin preset (from the FX drawer's Warp section) to this layer. */
  onApplyCornerPreset?: (preset: string) => void;
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** One layer as a mixer channel strip: index, reorder, name, source, blend, opacity,
 *  mask/fx toggles, copy/paste, remove. The FX button expands the effects drawer. */
export function LayerStrip({
  layer,
  neighbors,
  onUpdate,
  onMove,
  onRemove,
  onCopy,
  onPaste,
  canPaste,
  media,
  sourceBank,
  onEditMask,
  onEditWarp,
  onApplyCornerPreset,
}: LayerStripProps) {
  const isColor = layer.source?.type === "color";
  const [fxOpen, setFxOpen] = useState(false);
  const mediaOptions = (media ?? []).map((m) => ({ value: `/media/${m.filename}`, label: m.name }));
  const currentUrl = layer.source?.url ?? "";
  const isLibraryUrl = mediaOptions.some((o) => o.value === currentUrl);
  // Start in External mode only if the current url is a non-empty, non-library url.
  const [externalMode, setExternalMode] = useState(currentUrl !== "" && !isLibraryUrl);

  return (
    <div className="strip" data-fx-open={fxOpen}>
      <div className="strip-main">
        <div className="idx mono">{String(layer.order ?? 0).padStart(2, "0")}</div>

        <div className="move-group">
          <ToggleSquare className="move-btn" label="▲" title="Move toward front" disabled={!neighbors.above} onClick={() => onMove?.("up")} />
          <ToggleSquare className="move-btn" label="▼" title="Move toward back" disabled={!neighbors.below} onClick={() => onMove?.("down")} />
        </div>

        <div className="meta">
          <TextField className="name-input" value={layer.name ?? ""} onCommit={(v) => onUpdate?.("name", v)} />
        </div>

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
                      ? { type: "slot", slotId: sourceBank?.[0]?.id ?? "slot-1" }
                      : { type: "video", url: layer.source?.url ?? "" },
              )
            }
          />
          <div className="source-field">
            {layer.source?.type === "camera" ? (
              <span className="mono source-note">live capture</span>
            ) : layer.source?.type === "slot" ? (
              <Select
                value={layer.source.slotId ?? ""}
                options={(sourceBank ?? []).map((s) => ({ value: s.id, label: s.name }))}
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

        <Select
          className="blend-select"
          value={layer.blendMode ?? "normal"}
          options={BLEND_MODES.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) }))}
          onChange={(v) => onUpdate?.("blendMode", v)}
        />

        <div className="opacity-field">
          <Fader value={layer.opacity ?? 1} ariaLabel="Layer opacity" onChange={(v) => onUpdate?.("opacity", v)} />
          <span className="opacity-val mono">{Math.round((layer.opacity ?? 1) * 100)}%</span>
        </div>
      </div>

      <div className="strip-actions">
        <div className="action-group">
          <ToggleSquare
            label="M"
            title="Mask"
            active={!!layer.mask?.enabled}
            onClick={() => onUpdate?.("mask", { ...layer.mask, enabled: !layer.mask?.enabled })}
          />
          <ToggleSquare
            label={layer.mask?.shape === "rect" ? "□" : "○"}
            title="Mask shape"
            onClick={() => onUpdate?.("mask", { ...layer.mask, shape: layer.mask?.shape === "rect" ? "ellipse" : "rect" })}
          />
          <ToggleSquare label="FX" title="Effects chain" active={fxOpen} onClick={() => setFxOpen((open) => !open)} />
        </div>
        <div className="action-group">
          <ToggleSquare label="⧉" title="Copy layer look" onClick={onCopy} />
          <ToggleSquare label="⇩" title="Paste layer look" disabled={!canPaste} onClick={onPaste} />
        </div>
        <ToggleSquare className="remove-btn" label="×" title="Remove layer" onClick={onRemove} />
      </div>

      {fxOpen && layer.fx && (
        <FxDrawer
          fx={layer.fx}
          mask={layer.mask}
          onUpdate={(field, value) => {
            if (field === "__cornerPreset__") onApplyCornerPreset?.(value as string);
            else onUpdate?.(field, value);
          }}
          onEditMask={onEditMask}
          onEditWarp={onEditWarp}
        />
      )}
    </div>
  );
}
