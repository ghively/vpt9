import { Fader } from "./primitives/Fader";
import { ToggleSquare } from "./primitives/ToggleSquare";
import type { Fx } from "./types";

export interface FxDrawerProps {
  fx: Fx;
  /** Field paths are relative to the layer ("fx.zoom", "fx.edgeBlend.left") so the
   *  container can prefix them with "layers.<id>." unchanged. */
  onUpdate?: (field: string, value: unknown) => void;
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
  { label: "EDGE L", field: "fx.edgeBlend.left", min: 0, max: 0.5, step: 0.005, neutral: 0 },
  { label: "EDGE R", field: "fx.edgeBlend.right", min: 0, max: 0.5, step: 0.005, neutral: 0 },
  { label: "EDGE T", field: "fx.edgeBlend.top", min: 0, max: 0.5, step: 0.005, neutral: 0 },
  { label: "EDGE B", field: "fx.edgeBlend.bottom", min: 0, max: 0.5, step: 0.005, neutral: 0 },
  { label: "GAMMA", field: "fx.edgeBlend.gamma", min: 0.5, max: 4, step: 0.05, neutral: 2 },
];

function readField(fx: Fx, field: string): number {
  const keys = field.split(".").slice(1); // drop the "fx." prefix
  let node: unknown = fx;
  for (const key of keys) node = (node as Record<string, unknown> | undefined)?.[key];
  return typeof node === "number" ? node : 0;
}

function FxSlider({ spec, fx, onUpdate }: { spec: SliderSpec; fx: Fx; onUpdate?: FxDrawerProps["onUpdate"] }) {
  const value = readField(fx, spec.field);
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

/** The per-layer effects chain controls (vlayer.maxpat's stages): flip/tile/zoom/pan,
 *  blur/motion-trail/brcosa, and the projector edge-blend ramps. Rendered inside an
 *  expanded LayerStrip. */
export function FxDrawer({ fx, onUpdate }: FxDrawerProps) {
  return (
    <div className="fx-drawer">
      <div className="fx-row">
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
          <FxSlider key={spec.field} spec={spec} fx={fx} onUpdate={onUpdate} />
        ))}
      </div>
      <div className="fx-row">
        {COLOR_SLIDERS.map((spec) => (
          <FxSlider key={spec.field} spec={spec} fx={fx} onUpdate={onUpdate} />
        ))}
      </div>
      <div className="fx-row">
        {EDGE_SLIDERS.map((spec) => (
          <FxSlider key={spec.field} spec={spec} fx={fx} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}
