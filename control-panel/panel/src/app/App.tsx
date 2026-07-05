import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import {
  AudioOwner,
  ChannelRack,
  CueList,
  Faceplate,
  LfoRack,
  MidiMapPanel,
  PipWindows,
  PresetsBar,
  StatusLamp,
  TimerBank,
  WarpEditor,
  type ConnectionState,
  type Layer,
} from "../components";
import { applyBatch, applyCreate, applyDelete, applyUpdate, emptyState, type PanelState } from "./store";
import { useSocket } from "./useSocket";
import { usePreviewBus } from "./usePreviewBus";
import { useMidi } from "./useMidi";
import { createActions } from "./actions";

/** The layer-look fields copy/paste moves between layers (not source/name/order). */
type LayerLook = Pick<Layer, "opacity" | "blendMode" | "mask" | "fx">;

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
  const clipboardRef = useRef<LayerLook | null>(null);
  const [canPaste, setCanPaste] = useState(false);

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

  const { send } = useSocket(wsUrl, {
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
    onStatus(state, url) {
      setStatus({ state, label: `${state} · ${url}` });
    },
  });

  const getState = useCallback(() => stateRef.current, []);
  const actions = useMemo(() => createActions(send, getState), [send, getState]);
  const midi = useMidi(getState, send);

  const beginDrag = useCallback(() => {
    isDraggingRef.current = true;
  }, []);
  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
    forceRender();
  }, []);

  const copyLayer = useCallback((id: string) => {
    const layer = stateRef.current.layers[id];
    if (!layer) return;
    clipboardRef.current = structuredClone({
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      mask: layer.mask,
      fx: layer.fx,
    });
    setCanPaste(true);
  }, []);

  const pasteLayer = useCallback(
    (id: string) => {
      const look = clipboardRef.current;
      if (!look) return;
      for (const [field, value] of Object.entries(look)) {
        if (value !== undefined) actions.updateLayer(id, field, structuredClone(value));
      }
    },
    [actions],
  );

  const state = stateRef.current;
  const sid = selectedScreenId ?? "";
  const layers = Object.values(state.layers ?? {});
  const screens = Object.values(state.screens ?? {});
  const screen = selectedScreenId ? state.screens[selectedScreenId] : undefined;
  const pips = Object.values(state.pip ?? {}).filter((p) => p.screenId === selectedScreenId);
  const presets = Object.values(state.presets ?? {});
  const automation = state.automation ?? { cues: [], cursor: -1, running: false, timers: {} };

  return (
    <>
      <Faceplate
        center={
          <AudioOwner
            screens={screens}
            ownerId={state.audioOwnerScreenId}
            onSelect={actions.setAudioOwner}
          />
        }
        right={<StatusLamp state={status.state} label={status.label} />}
      />

      <div className="layout">
        <ChannelRack
          layers={layers}
          onUpdateLayer={actions.updateLayer}
          onMoveLayer={actions.moveLayer}
          onRemoveLayer={actions.removeLayer}
          onAddLayer={actions.addLayer}
          onCopyLayer={copyLayer}
          onPasteLayer={pasteLayer}
          canPaste={canPaste}
        />
        <aside>
          <WarpEditor
            ref={preview.warpMonitor}
            screen={screen}
            screens={screens}
            previewFrame={preview.frameFor(selectedScreenId)}
            onSelectScreen={setSelectedScreenId}
            onSetMode={(mode) => actions.setWarpMode(sid, mode)}
            onReset={() => actions.resetWarp(sid)}
            onDragStart={beginDrag}
            onMovePoint={(index, x, y) => actions.moveWarpPoint(sid, index, x, y)}
            onDragEnd={endDrag}
          />
          <PipWindows
            ref={preview.pipMonitor}
            screenId={sid}
            pips={pips}
            previewFrame={preview.frameFor(selectedScreenId)}
            onDragStart={beginDrag}
            onDragEnd={endDrag}
            onUpdatePip={actions.updatePip}
            onMovePip={actions.movePip}
            onResizePip={actions.resizePip}
            onRemovePip={actions.removePip}
            onAddPip={() => actions.addPip(sid)}
          />
          <div>
            <h3>Presets</h3>
            <PresetsBar
              presets={presets}
              onRecall={actions.recallPreset}
              onSave={actions.savePreset}
            />
          </div>
        </aside>
      </div>

      <div className="layout-lower">
        <CueList
          cues={automation.cues ?? []}
          cursor={automation.cursor ?? -1}
          running={!!automation.running}
          presets={presets}
          onGo={actions.cueGo}
          onStop={actions.cueStop}
          onJump={actions.cueJump}
          onSetCues={actions.setCues}
        />
        <TimerBank
          timers={Object.values(automation.timers ?? {})}
          presets={presets}
          onAdd={actions.addTimer}
          onUpdate={actions.updateTimer}
          onRemove={actions.removeTimer}
        />
        <div className="mod-column">
          <LfoRack
            lfos={Object.values(state.lfos ?? {})}
            onAdd={actions.addLfo}
            onUpdate={actions.updateLfo}
            onRemove={actions.removeLfo}
          />
          <MidiMapPanel
            mappings={Object.values(state.midiMap ?? {})}
            learningId={midi.learningId}
            midiAvailable={midi.available}
            onAdd={actions.addMidiMapping}
            onUpdate={actions.updateMidiMapping}
            onRemove={actions.removeMidiMapping}
            onLearn={midi.learn}
          />
        </div>
      </div>
    </>
  );
}
