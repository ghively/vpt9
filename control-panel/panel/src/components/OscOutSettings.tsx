import { TextField } from "./primitives/TextField";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { parseNumberOr } from "./numeric";

export interface OscOutSettingsProps {
  enabled: boolean;
  host: string;
  port: number;
  /** Patches one oscOut leaf (server path `oscOut.<field>`). */
  onUpdate?: (field: "enabled" | "host" | "port", value: unknown) => void;
}

/** OSC OUTPUT / state-mirroring settings (A17). When enabled, every scalar leaf change is
 *  mirrored out as an OSC message to host:port; an `osc` cue always sends to this host:port
 *  regardless of the toggle. Lives in the Show drawer's MIDI tab. */
export function OscOutSettings({ enabled, host, port, onUpdate }: OscOutSettingsProps) {
  return (
    <div id="osc-out">
      <h3>OSC output</h3>
      <div className="osc-out-row">
        <ToggleSquare
          label="→"
          tone="live"
          title={enabled ? "Mirroring state out over OSC" : "Mirror off"}
          active={enabled}
          onClick={() => onUpdate?.("enabled", !enabled)}
        />
        <span className="osc-out-state mono">{enabled ? "MIRRORING" : "OFF"}</span>
        <TextField
          className="osc-out-host"
          value={host ?? ""}
          placeholder="host"
          onCommit={(v) => onUpdate?.("host", v)}
        />
        <TextField
          className="osc-out-port"
          value={String(port ?? 0)}
          placeholder="port"
          onCommit={(v) => onUpdate?.("port", Math.trunc(Math.max(0, parseNumberOr(v, 0))))}
        />
      </div>
      <div className="empty-note mono">mirrors scalar changes + sends `osc` cues to host:port</div>
    </div>
  );
}
