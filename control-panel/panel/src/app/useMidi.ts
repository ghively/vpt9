import { useEffect, useRef, useState } from "react";
import type { PanelState } from "./store";
import type { SocketMessage } from "./useSocket";

// Loose local typings: Web MIDI is Chrome/Edge-only and not guaranteed present in
// lib.dom across TS versions, so we don't lean on ambient MIDIAccess types.
interface MidiInputLike {
  onmidimessage: ((event: { data: Uint8Array | null }) => void) | null;
}
interface MidiAccessLike {
  inputs: Map<string, MidiInputLike>;
  onstatechange: (() => void) | null;
}

/** Owns the panel browser's MIDI hardware. Incoming CC messages either complete a
 *  "learn" (filling the armed mapping's channel/controller) or drive every mapping
 *  bound to that channel+controller, scaling 0–127 to [min,max] on the target path. */
export function useMidi(getState: () => PanelState, send: (message: SocketMessage) => void) {
  const [available, setAvailable] = useState(
    () => typeof navigator !== "undefined" && "requestMIDIAccess" in navigator,
  );
  const [learningId, setLearningId] = useState<string | null>(null);
  const learningRef = useRef<string | null>(null);
  learningRef.current = learningId;

  useEffect(() => {
    if (!("requestMIDIAccess" in navigator)) {
      setAvailable(false);
      return;
    }
    let access: MidiAccessLike | null = null;
    let disposed = false;

    // Coalesce outgoing writes to one-per-target-per-animation-frame. A swept knob/encoder
    // fires 30–200 CC messages/sec (and several mappings can bind the same channel+CC), and
    // emitting a WS `update` per raw event floods the control plane — the exact flood
    // WarpHandle / MaskShapeOverlay / PipBox already rAF-coalesce (MIDI was the one
    // high-rate input that didn't). Keep only the latest value per target between frames.
    const pending = new Map<string, unknown>();
    let raf = 0;
    const flush = () => {
      raf = 0;
      for (const [path, value] of pending) send({ type: "update", path, value });
      pending.clear();
    };
    const emit = (path: string, value: unknown) => {
      pending.set(path, value);
      if (!raf) raf = requestAnimationFrame(flush);
    };

    const onMessage = (event: { data: Uint8Array | null }) => {
      const data = event.data;
      if (!data || data.length < 3) return;
      const status = data[0];
      if ((status & 0xf0) !== 0xb0) return; // control-change only
      const channel = status & 0x0f;
      const controller = data[1];
      const normalized = data[2] / 127;

      const learning = learningRef.current;
      if (learning) {
        send({ type: "update", path: `midiMap.${learning}.channel`, value: channel });
        send({ type: "update", path: `midiMap.${learning}.controller`, value: controller });
        setLearningId(null);
        return;
      }

      for (const mapping of Object.values(getState().midiMap ?? {})) {
        if (mapping.channel !== channel || mapping.controller !== controller || !mapping.target) continue;
        const value = (mapping.min ?? 0) + normalized * ((mapping.max ?? 1) - (mapping.min ?? 0));
        emit(mapping.target, value);
      }
    };

    const attach = () => {
      if (!access) return;
      for (const input of access.inputs.values()) input.onmidimessage = onMessage;
    };

    (navigator as unknown as { requestMIDIAccess: () => Promise<MidiAccessLike> })
      .requestMIDIAccess()
      .then((granted) => {
        if (disposed) return;
        access = granted;
        attach();
        access.onstatechange = attach; // re-attach when devices (un)plug
      })
      .catch(() => setAvailable(false));

    return () => {
      disposed = true;
      if (raf) { cancelAnimationFrame(raf); flush(); } // land the last coalesced value
      if (access) {
        for (const input of access.inputs.values()) input.onmidimessage = null;
        access.onstatechange = null;
      }
    };
  }, [getState, send]);

  return {
    available,
    learningId,
    /** Arm (or disarm, if already armed) a mapping for learn. */
    learn: (id: string) => setLearningId((current) => (current === id ? null : id)),
  };
}
