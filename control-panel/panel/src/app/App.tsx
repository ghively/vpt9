import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import {
  AudioOwner,
  Faceplate,
  LayerStack,
  MasterControl,
  SlotGrid,
  StatusLamp,
  type ConnectionState,
} from "../components";
import { applyBatch, applyCreate, applyDelete, applyUpdate, emptyState, type PanelState } from "./store";
import { useSocket, type SocketMessage } from "./useSocket";
import { usePreviewBus } from "./usePreviewBus";
import { useMidi } from "./useMidi";
import { createActions } from "./actions";
import { useSelection } from "./useSelection";

export function App() {
  const stateRef = useRef<PanelState>(emptyState());
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedScreenId;
  const isDraggingRef = useRef(false);
  const [status, setStatus] = useState<{ state: ConnectionState; label: string }>({
    state: "connecting",
    label: "connecting…",
  });
  // Pre-blackout master level, restored by the blackout toggle.
  const preBlackoutRef = useRef(1);
  // Clip-transport scrub-position telemetry, keyed by layer id. Not `state` — this is
  // high-frequency, non-persisted display telemetry (Task 14's transportStatus relay),
  // so it lives outside the store/rerender path rather than as a reducer-driven field.
  const transportPositionsRef = useRef<Record<string, number>>({});

  const preview = usePreviewBus(() => selectedRef.current);

  const wsUrl = useMemo(
    () => new URLSearchParams(location.search).get("ws") || `ws://${location.hostname}:8080`,
    [],
  );

  // Socket-driven store patches re-render unless a drag is in progress (the isDragging
  // guard), so an echoed update never yanks the DOM out from under an active gesture.
  const rerender = useCallback(() => {
    if (!isDraggingRef.current) forceRender();
  }, []);

  const { send: rawSend } = useSocket(wsUrl, {
    onState(next) {
      stateRef.current = next;
      const screenIds = Object.keys(next.screens ?? {});
      if (!selectedRef.current || !next.screens?.[selectedRef.current]) {
        setSelectedScreenId(screenIds[0] ?? null); // triggers a render itself
      } else {
        forceRender();
      }
    },
    onUpdate(path, value) {
      if (applyUpdate(stateRef.current, path, value)) rerender();
    },
    onCreate(path, key, value) {
      if (applyCreate(stateRef.current, path, key, value)) rerender();
    },
    onDelete(path) {
      if (applyDelete(stateRef.current, path)) rerender();
    },
    onBatch(updates) {
      if (applyBatch(stateRef.current, updates)) rerender();
    },
    onPreview(screenId, frame) {
      preview.push(screenId, frame);
    },
    onTransportStatus(layerId, position) {
      // No forceRender here on purpose — this ticks at playback frame rate and is read
      // directly off the ref by the (future) Transport scrub readout, not the store.
      transportPositionsRef.current[layerId] = position;
    },
    onStatus(state, url) {
      setStatus({ state, label: `${state} · ${url}` });
    },
  });

  // Optimistic local echo: apply an outgoing leaf update to the local mirror immediately.
  // The control then reflects the operator's input right away, and — crucially — a
  // concurrent re-render (e.g. a 30 Hz LFO/fade batch) reads the just-set value instead of
  // snapping the control back to the server's lagging echo. The server still echoes the
  // write; that echo no-ops (applyUpdate returns false when the value is already current).
  const send = useCallback(
    (message: SocketMessage) => {
      const sent = rawSend(message);
      // Only mirror locally when the write actually went out. While disconnected, applying
      // it would show a change the server never received, which the reconnect snapshot then
      // silently reverts — the StatusLamp already signals the disconnect instead.
      if (sent && message.type === "update" && typeof message.path === "string") {
        applyUpdate(stateRef.current, message.path, message.value);
      }
      return sent;
    },
    [rawSend],
  );
  const getState = useCallback(() => stateRef.current, []);
  const actions = useMemo(() => createActions(send, getState), [send, getState]);
  // MIDI-learn wiring runs entirely on its own effect (WebMIDI listeners -> `send`); the
  // (future) MIDI map panel reads its learn/available state once it lands in the rail.
  useMidi(getState, send);

  const toggleBlackout = useCallback(() => {
    const current = stateRef.current.master ?? 1;
    if (current > 0) {
      preBlackoutRef.current = current;
      actions.setMaster(0);
    } else {
      actions.setMaster(preBlackoutRef.current || 1);
    }
  }, [actions]);

  const state = stateRef.current;
  const screens = Object.values(state.screens ?? {});

  const faceplate = (
    <Faceplate
      center={
        <div className="faceplate-center">
          <AudioOwner screens={screens} ownerId={state.audioOwnerScreenId} onSelect={actions.setAudioOwner} />
          <MasterControl master={state.master ?? 1} onChange={actions.setMaster} onToggleBlackout={toggleBlackout} />
        </div>
      }
      right={<StatusLamp state={status.state} label={status.label} />}
    />
  );

  const layersTopFirst = Object.values(stateRef.current.layers).sort(
    (a, b) => (b.order ?? 0) - (a.order ?? 0), // top-of-stack first
  );
  const selection = useSelection(layersTopFirst[0]?.id ?? null);

  return (
    <div className="deck">
      {/* Faceplate already renders its own <header> (wordmark, AudioOwner, MasterControl
          w/ blackout, StatusLamp); a plain div carries the .cmd shell/grid-row styling so
          we don't nest <header> inside <header>. */}
      <div className="cmd">{faceplate}</div>
      <div className="body" data-selected-layer={selection.selectedLayerId ?? undefined}>
        <aside className="rail rail-l">
          <LayerStack
            layers={layersTopFirst}
            selectedId={selection.selectedLayerId}
            onSelect={selection.setSelectedLayerId}
            onAddLayer={actions.addLayer}
            onMoveLayer={actions.moveLayer}
            onRemoveLayer={actions.removeLayer}
          />
          <SlotGrid
            slots={state.sourceBank}
            media={Object.values(state.media)}
            onRename={actions.renameSourceBankSlot}
            onSetContent={actions.setSourceBankSlotContent}
          />
        </aside>
        <main className="stage-wrap">{/* <Stage/> lands here in Task 4 */}</main>
        <aside className="rail rail-r insp">{/* <Inspector/> lands here in Task 7 */}</aside>
      </div>
    </div>
  );
}
