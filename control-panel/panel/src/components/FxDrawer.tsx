import { Fader } from "./primitives/Fader";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import { Select } from "./primitives/Select";
import type { Fx, Mask, Transport } from "./types";

export interface FxDrawerProps {
  fx: Fx;
  /** Mask geometry lives here too (center/size/feather); enable + shape stay on the
   *  strip. Optional so existing fx-only usage keeps working. */
  mask?: Mask;
  /** Clip transport (play/rate/loop/pan/vol). Optional — server support for
   *  `layers.<id>.transport` lands on a sibling branch; this section renders once a
   *  caller supplies it. */
  transport?: Transport;
  /** "single" | "playlist" — which source-selection mode the layer is in. */
  sourceMode?: string;
  /** Ordered clip queue for playlist mode. */
  playlist?: { items: Array<{ ref: unknown; duration?: number }> };
  /** Field paths are relative to the layer ("fx.zoom", "mask.feather") so the container
   *  can prefix them with "layers.<id>." unchanged. */
  onUpdate?: (field: string, value: unknown) => void;
  /** Opens the on-canvas mask editor for this layer (Screen tab). */
  onEditMask?: () => void;
  /** Opens the on-canvas warp editor for this layer (Screen tab). */
  onEditWarp?: () => void;
}

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
  { label: "PAN X", field: "fx.panX", min: -1, max: 1, step: 0.01, neutral: 0 },
  { label: "PAN Y", field: "fx.panY", min: -1, max: 1, step: 0.01, neutral: 0 },
];

const COLOR_SLIDERS: SliderSpec[] = [
  { label: "BLUR", field: "fx.blur", min: 0, max: 1, step: 0.01, neutral: 0 },
  { label: "TRAIL", field: "fx.motionBlur", min: 0, max: 0.95, step: 0.01, neutral: 0 },
  { label: "BRIGHT", field: "fx.brightness", min: 0, max: 3, step: 0.01, neutral: 1 },
  { label: "CONTRAST", field: "fx.contrast", min: 0, max: 3, step: 0.01, neutral: 1 },
  { label: "SAT", field: "fx.saturation", min: 0, max: 3, step: 0.01, neutral: 1 },
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
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fx-section">
      <span className="fx-cap eyebrow">{caption}</span>
      <div className="fx-row">{children}</div>
    </div>
  );
}

/** The per-layer effects chain controls (vlayer.maxpat's stages) in captioned sections:
 *  TRANSFORM (flip/tile/zoom/pan), COLOR (blur/trail/brcosa), EDGE BLEND (projector
 *  ramps) and MASK geometry. Rendered inside an expanded LayerStrip. */
export function FxDrawer({ fx, mask, transport, onUpdate, onEditMask, onEditWarp }: FxDrawerProps) {
  const fxRoot = fx as unknown as Record<string, unknown>;
  return (
    <div className="fx-drawer">
      <FxSection caption="Transform">
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
      <FxSection caption="Color">
        {COLOR_SLIDERS.map((spec) => (
          <FxSlider key={spec.field} spec={spec} root={fxRoot} onUpdate={onUpdate} />
        ))}
      </FxSection>
      <FxSection caption="Edge blend">
        {EDGE_SLIDERS.map((spec) => (
          <FxSlider key={spec.field} spec={spec} root={fxRoot} onUpdate={onUpdate} />
        ))}
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
            label={mask.shape === "rect" ? "□" : "○"}
            title="Mask shape"
            onClick={() => onUpdate?.("mask.shape", mask.shape === "rect" ? "ellipse" : "rect")}
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
          <Button label={transport.playing ? "Pause" : "Play"} onClick={() => onUpdate?.("transport.playing", !transport.playing)} />
          <FxSlider spec={{ label: "RATE", field: "transport.rate", min: 0.1, max: 4, step: 0.05, neutral: 1 }} root={transport as unknown as Record<string, unknown>} onUpdate={onUpdate} />
          <FxSlider spec={{ label: "PAN", field: "transport.pan", min: -1, max: 1, step: 0.01, neutral: 0 }} root={transport as unknown as Record<string, unknown>} onUpdate={onUpdate} />
          <FxSlider spec={{ label: "VOL", field: "transport.vol", min: 0, max: 1, step: 0.01, neutral: 1 }} root={transport as unknown as Record<string, unknown>} onUpdate={onUpdate} />
          <ToggleSquare
            label={transport.loopMode === "off" ? "Off" : transport.loopMode === "loop" ? "Loop" : "Pal"}
            title="Cycle loop mode: off / loop / palindrome"
            onClick={() =>
              onUpdate?.("transport.loopMode", transport.loopMode === "off" ? "loop" : transport.loopMode === "loop" ? "palindrome" : "off")
            }
          />
        </FxSection>
      )}
    </div>
  );
}
