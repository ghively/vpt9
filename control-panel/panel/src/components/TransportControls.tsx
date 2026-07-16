import { useRef, useState } from "react";
import { Fader } from "./primitives/Fader";
import { Button } from "./primitives/Button";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { TextField } from "./primitives/TextField";
import type { Transport } from "./types";

export interface TransportControlsProps {
  transport: Transport;
  /** Field paths are RELATIVE to the transport object ("playing", "rate", "loopMode",
   *  "loopIn", "seek", …). The caller prefixes them — `layers.<id>.transport.` for a
   *  layer, `sourceBank.<index>.transport.` for a slot — so the same control drives both. */
  onUpdate: (field: string, value: unknown) => void;
  /** Live playback position in seconds (from the transportStatus telemetry relay), shown
   *  as a read-only readout next to the scrub. Per-layer only — shared slots have no
   *  position telemetry, so this is omitted there. */
  position?: number;
  /** Clip duration in seconds (same telemetry relay) — lets the scrub thumb track the
   *  live playhead (position/duration) instead of sitting frozen at the last seek. */
  duration?: number;
}

// off → loop → palindrome → once → off. Mirrors VPT8's loop-mode set plus the "once"
// added in task A10.
const LOOP_CYCLE: Record<Transport["loopMode"], Transport["loopMode"]> = {
  off: "loop",
  loop: "palindrome",
  palindrome: "once",
  once: "off",
};
const LOOP_LABEL: Record<Transport["loopMode"], string> = {
  off: "Off",
  loop: "Loop",
  palindrome: "Pal",
  once: "Once",
};

/** A labeled fader row matching FxDrawer's `.fx-control` markup, so both transport UIs
 *  read identically. `neutral` dims the row when the value is at its rest position. */
function TransportFader({
  label,
  value,
  min,
  max,
  step,
  neutral,
  digits,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  neutral: number;
  digits: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="fx-control" data-neutral={value === neutral}>
      <span className="fx-label">{label}</span>
      <Fader value={value} min={min} max={max} step={step} ariaLabel={label} onChange={onChange} />
      <span className="fx-val mono">{value.toFixed(digits)}</span>
    </label>
  );
}

/** A blank-able numeric field committed on blur/Enter (loop in/out), where "no fixed
 *  point" (null) must stay representable. */
function NumField({ value, placeholder, onCommit }: { value: number | null | undefined; placeholder?: string; onCommit: (v: number | null) => void }) {
  return (
    <TextField
      className="fx-num"
      value={value != null ? String(value) : ""}
      placeholder={placeholder}
      onCommit={(v) => onCommit(v.trim() === "" ? null : Math.max(0, Number(v) || 0))}
    />
  );
}

/** Shared clip-transport control cluster (VPT8 parity, tasks A9/A10/A11): Play/Pause,
 *  rate, pan, vol, a loop-mode cycle (off/loop/palindrome/once), loop in/out, and a
 *  normalized 0..1 scrub. Used by both the layer FX drawer's Transport section and the
 *  source-bank slot editor so the two never drift. */
export function TransportControls({ transport, onUpdate, position, duration }: TransportControlsProps) {
  const loopMode = transport.loopMode ?? "off";
  const seek = transport.seek ?? 0;
  // The scrub thumb follows the live playhead (position/duration) when playing; while the
  // operator is dragging it we show the drag value and clear it a beat after the last change
  // so the thumb resumes tracking. Falls back to `seek` when there's no duration telemetry
  // (a paused/never-played clip, or a shared slot with no position relay).
  const [scrubDrag, setScrubDrag] = useState<number | null>(null);
  const scrubTimer = useRef<number | null>(null);
  const playhead = duration && duration > 0 && position != null ? Math.min(1, Math.max(0, position / duration)) : seek;
  const scrubValue = scrubDrag ?? playhead;
  const onScrub = (v: number) => {
    setScrubDrag(v);
    onUpdate("seek", v);
    if (scrubTimer.current != null) clearTimeout(scrubTimer.current);
    scrubTimer.current = window.setTimeout(() => setScrubDrag(null), 500);
  };
  return (
    <>
      <Button label={transport.playing ? "Pause" : "Play"} onClick={() => onUpdate("playing", !transport.playing)} />
      <TransportFader label="RATE" value={transport.rate ?? 1} min={0.1} max={4} step={0.05} neutral={1} digits={2} onChange={(v) => onUpdate("rate", v)} />
      <TransportFader label="PAN" value={transport.pan ?? 0} min={-1} max={1} step={0.01} neutral={0} digits={2} onChange={(v) => onUpdate("pan", v)} />
      <TransportFader label="VOL" value={transport.vol ?? 1} min={0} max={1} step={0.01} neutral={1} digits={2} onChange={(v) => onUpdate("vol", v)} />
      <ToggleSquare
        label={LOOP_LABEL[loopMode]}
        title="Cycle loop mode: off / loop / palindrome / once"
        active={loopMode !== "off"}
        onClick={() => onUpdate("loopMode", LOOP_CYCLE[loopMode])}
      />
      <label className="fx-control">
        <span className="fx-label">LOOP IN</span>
        <NumField value={transport.loopIn} placeholder="sec" onCommit={(v) => onUpdate("loopIn", v)} />
      </label>
      <label className="fx-control">
        <span className="fx-label">LOOP OUT</span>
        <NumField value={transport.loopOut} placeholder="sec" onCommit={(v) => onUpdate("loopOut", v)} />
      </label>
      <label className="fx-control" data-neutral={scrubValue === 0}>
        <span className="fx-label">SCRUB</span>
        <Fader value={scrubValue} min={0} max={1} step={0.001} ariaLabel="Scrub" onChange={onScrub} />
        <span className="fx-val mono">{position != null ? `${position.toFixed(1)}s` : `${Math.round(scrubValue * 100)}%`}</span>
      </label>
    </>
  );
}
