import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  AudioOwner,
  Faceplate,
  Inspector,
  LayerStack,
  MasterControl,
  SlotGrid,
  Stage,
  StageSelectionOverlay,
  StatusLamp,
  type ConnectionState,
} from "../components";
import { layerQuad, pickTopLayer } from "../components/deck/layerGeometry";
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

  // Task 7 carry-forward: `useSelection`'s initial state is seeded from
  // `layersTopFirst[0]?.id` above, but that's a useState initializer — it only runs on
  // the very first render, when the WS state hasn't arrived yet and layersTopFirst is
  // still empty. Once the snapshot lands and layers appear, seed the selection exactly
  // once so the Inspector isn't empty on load. The ref guard makes this fire-once: it
  // must NOT re-select after the operator later deselects (clicking empty stage space)
  // or picks a different layer — only the first non-empty arrival seeds anything.
  const seededSelectionRef = useRef(false);
  useEffect(() => {
    if (seededSelectionRef.current) return;
    if (selection.selectedLayerId) {
      seededSelectionRef.current = true;
      return;
    }
    if (layersTopFirst.length === 0) return;
    seededSelectionRef.current = true;
    selection.setSelectedLayerId(layersTopFirst[0].id);
  }, [layersTopFirst, selection]);

  // Task 5: clicking an object on the stage selects its layer — hit-test every
  // layer's warp quad (topmost first) against the normalized click position, mapped
  // against the stage's own box so it lines up with the same 0..1 space the overlay
  // (Task 6) and Stage's hover outline use. Clicking empty space (no quad contains the
  // point) deselects.
  const onBackgroundPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const p = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
      const topFirst = Object.values(stateRef.current.layers).sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
      selection.setSelectedLayerId(pickTopLayer(topFirst, p));
    },
    [selection],
  );
  // Not memoized: layersTopFirst is itself a fresh array every render (see above), so
  // there'd be nothing stable to key a memo off; this is a cheap map over a handful of
  // layers, not worth the added complexity.
  const hitLayers = layersTopFirst.map((layer) => ({ id: layer.id, quad: layerQuad(layer) }));
  const selectedLayer = layersTopFirst.find((l) => l.id === selection.selectedLayerId) ?? null;

  // Task 6: on-stage warp/mask handles (StageSelectionOverlay) drag imperatively via
  // WarpHandle/MaskShapeOverlay's own pointer machinery, the same way the rail-side
  // WarpEditor's handles do — suppress store-driven re-renders for the gesture's
  // duration (the isDraggingRef guard `rerender` already checks above) so a
  // server-echoed update never yanks a handle out from under an in-flight drag, then
  // force one on drag-end to reconcile with whatever the server actually applied.
  const beginDrag = useCallback(() => { isDraggingRef.current = true; }, []);
  const endDrag = useCallback(() => { isDraggingRef.current = false; forceRender(); }, []);

  // Maps StageSelectionOverlay's narrow callbacks onto the SAME layer-warp/mask
  // actions WarpEditor already uses (`moveLayerWarpPoint` / `updateLayer("mask.*")`) —
  // no new update paths, just a new UI surface (the stage) driving the existing ones.
  const onWarpCorner = useCallback(
    (index: number, x: number, y: number) => {
      if (selectedLayer) actions.moveLayerWarpPoint(selectedLayer.id, index, x, y);
    },
    [actions, selectedLayer],
  );
  const onMask = useCallback(
    (patch: Partial<{ cx: number; cy: number; rx: number; ry: number }>) => {
      if (!selectedLayer) return;
      for (const [k, v] of Object.entries(patch)) actions.updateLayer(selectedLayer.id, `mask.${k}`, v);
    },
    [actions, selectedLayer],
  );

  // Task 7: the Inspector's write callbacks — every one maps onto the SAME actions the
  // rail/stage already use for the selected layer (updateLayer / the layer-warp
  // actions), just scoped to whichever layer is currently selected. No new WS message
  // types or update paths.
  const onInspectorUpdate = useCallback(
    (field: string, value: unknown) => {
      if (selectedLayer) actions.updateLayer(selectedLayer.id, field, value);
    },
    [actions, selectedLayer],
  );
  const onInspectorSetSourceMode = useCallback(
    (mode: "single" | "playlist") => {
      if (selectedLayer) actions.setSourceMode(selectedLayer.id, mode);
    },
    [actions, selectedLayer],
  );
  const onInspectorSetPlaylist = useCallback(
    (items: Parameters<typeof actions.setPlaylist>[1]) => {
      if (selectedLayer) actions.setPlaylist(selectedLayer.id, items);
    },
    [actions, selectedLayer],
  );
  const onInspectorApplyCornerPreset = useCallback(
    (preset: string) => {
      if (selectedLayer) actions.applyLayerCornerPreset(selectedLayer.id, preset as Parameters<typeof actions.applyLayerCornerPreset>[1]);
    },
    [actions, selectedLayer],
  );
  const onInspectorSetWarpMode = useCallback(
    (mode: "corner" | "mesh") => {
      if (selectedLayer) actions.setLayerWarpMode(selectedLayer.id, mode);
    },
    [actions, selectedLayer],
  );
  const onInspectorSetMeshSize = useCallback(
    (size: number) => {
      if (selectedLayer) actions.setLayerMeshSize(selectedLayer.id, size);
    },
    [actions, selectedLayer],
  );
  const onInspectorResetWarp = useCallback(() => {
    if (selectedLayer) actions.resetLayerWarp(selectedLayer.id);
  }, [actions, selectedLayer]);

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
        <main className="stage-wrap">
          {selectedScreenId && (
            <Stage
              ref={preview.warpMonitor}
              screenId={selectedScreenId}
              frame={preview.frameFor(selectedScreenId) ?? null}
              width={1280}
              height={720}
              overlay={
                selectedLayer ? (
                  <StageSelectionOverlay
                    layer={selectedLayer}
                    mode={selection.stageEditMode}
                    onWarpCorner={onWarpCorner}
                    onMask={onMask}
                    onDragStart={beginDrag}
                    onDragEnd={endDrag}
                  />
                ) : null
              }
              hitLayers={hitLayers}
              onBackgroundPointerDown={onBackgroundPointerDown}
            />
          )}
        </main>
        <aside className="rail rail-r insp">
          <Inspector
            layer={selectedLayer}
            mode={selection.stageEditMode}
            onModeChange={selection.setStageEditMode}
            media={Object.values(state.media)}
            sourceBank={state.sourceBank}
            onUpdate={onInspectorUpdate}
            onSetSourceMode={onInspectorSetSourceMode}
            onSetPlaylist={onInspectorSetPlaylist}
            onApplyCornerPreset={onInspectorApplyCornerPreset}
            onSetWarpMode={onInspectorSetWarpMode}
            onSetMeshSize={onInspectorSetMeshSize}
            onResetWarp={onInspectorResetWarp}
          />
        </aside>
      </div>
    </div>
  );
}
