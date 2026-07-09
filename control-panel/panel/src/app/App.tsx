import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import {
  AudioOwner,
  ChannelRack,
  CueList,
  Faceplate,
  LfoRack,
  MasterControl,
  MediaLibrary,
  MidiMapPanel,
  MobileTabBar,
  PipWindows,
  PresetsBar,
  SourceBankPanel,
  StatusLamp,
  TimerBank,
  WarpEditor,
  type ConnectionState,
  type Layer,
  type MobileTab,
  type TargetOption,
} from "../components";
import { applyBatch, applyCreate, applyDelete, applyUpdate, emptyState, type PanelState } from "./store";
import { useSocket } from "./useSocket";
import { usePreviewBus } from "./usePreviewBus";
import { useMidi } from "./useMidi";
import { useIsMobile } from "./useIsMobile";
import { createActions } from "./actions";

/** The layer-look fields copy/paste moves between layers (not source/name/order). */
type LayerLook = Pick<Layer, "opacity" | "blendMode" | "mask" | "fx">;

/** What the screen-aside canvas is currently editing on top of the confidence monitor:
 *  a layer's mask shape, a layer's own corner-pin/mesh warp, or nothing (screen warp). */
type CanvasEditTarget = { kind: "mask"; layerId: string } | { kind: "warp"; layerId: string } | null;

type ShowTab = "presets" | "cues" | "timers" | "lfo" | "midi";
const SHOW_TABS: Array<[ShowTab, string]> = [
  ["presets", "Presets"],
  ["cues", "Cues"],
  ["timers", "Timers"],
  ["lfo", "LFO"],
  ["midi", "MIDI"],
];

/** Numeric per-layer paths offered by the LFO/MIDI target pickers. */
const LAYER_TARGET_FIELDS: Array<[string, string]> = [
  ["opacity", "opacity"],
  ["fx.zoom", "zoom"],
  ["fx.panX", "pan x"],
  ["fx.panY", "pan y"],
  ["fx.blur", "blur"],
  ["fx.motionBlur", "trail"],
  ["fx.brightness", "brightness"],
  ["fx.contrast", "contrast"],
  ["fx.saturation", "saturation"],
  ["fx.tileX", "tile x"],
  ["fx.tileY", "tile y"],
  ["fx.edgeBlend.left", "edge left"],
  ["fx.edgeBlend.right", "edge right"],
  ["fx.edgeBlend.top", "edge top"],
  ["fx.edgeBlend.bottom", "edge bottom"],
  ["fx.edgeBlend.gamma", "edge gamma"],
  ["mask.cx", "mask center x"],
  ["mask.cy", "mask center y"],
  ["mask.rx", "mask size x"],
  ["mask.ry", "mask size y"],
  ["mask.feather", "mask feather"],
];

function buildTargetOptions(state: PanelState): TargetOption[] {
  const options: TargetOption[] = [{ value: "master", label: "master dim", group: "Global" }];
  const layers = Object.values(state.layers ?? {}).sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  for (const layer of layers) {
    const group = layer.name || layer.id;
    for (const [field, label] of LAYER_TARGET_FIELDS) {
      options.push({ value: `layers.${layer.id}.${field}`, label, group });
    }
  }
  return options;
}

export function App() {
  const stateRef = useRef<PanelState>(emptyState());
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [activeShowTab, setActiveShowTab] = useState<ShowTab>("presets");
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("layers");
  const [canvasEditTarget, setCanvasEditTarget] = useState<CanvasEditTarget>(null);
  const isMobile = useIsMobile();
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedScreenId;
  const isDraggingRef = useRef(false);
  const [status, setStatus] = useState<{ state: ConnectionState; label: string }>({
    state: "connecting",
    label: "connecting…",
  });
  const clipboardRef = useRef<LayerLook | null>(null);
  const [canPaste, setCanPaste] = useState(false);
  // Pre-blackout master level, restored by the blackout toggle.
  const preBlackoutRef = useRef(1);

  const preview = usePreviewBus(() => selectedRef.current);

  const wsUrl = useMemo(
    () => new URLSearchParams(location.search).get("ws") || `ws://${location.hostname}:8080`,
    [],
  );

  // The media API lives on the same host as the control plane; derive its HTTP origin
  // from the ws url. Upload + delete are HTTP (not WS); rename is a WS update.
  const httpBase = useMemo(() => wsUrl.replace(/^ws/, "http"), [wsUrl]);
  const removeMedia = useCallback(
    (id: string) => {
      fetch(`${httpBase}/api/media/${id}`, { method: "DELETE" }).catch((err) =>
        console.warn("[media] delete failed:", err.message),
      );
    },
    [httpBase],
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

  const toggleBlackout = useCallback(() => {
    const current = stateRef.current.master ?? 1;
    if (current > 0) {
      preBlackoutRef.current = current;
      actions.setMaster(0);
    } else {
      actions.setMaster(preBlackoutRef.current || 1);
    }
  }, [actions]);

  const editMask = useCallback(
    (id: string) => {
      setCanvasEditTarget({ kind: "mask", layerId: id });
      if (isMobile) setActiveMobileTab("screen");
    },
    [isMobile],
  );
  const editLayerWarp = useCallback(
    (id: string) => {
      setCanvasEditTarget({ kind: "warp", layerId: id });
      if (isMobile) setActiveMobileTab("screen");
    },
    [isMobile],
  );

  const state = stateRef.current;
  const maskEditLayerId = canvasEditTarget?.kind === "mask" ? canvasEditTarget.layerId : null;
  const warpEditLayerId = canvasEditTarget?.kind === "warp" ? canvasEditTarget.layerId : null;
  const sid = selectedScreenId ?? "";
  const layers = Object.values(state.layers ?? {});
  const media = Object.values(state.media ?? {});
  const screens = Object.values(state.screens ?? {});
  const screen = selectedScreenId ? state.screens[selectedScreenId] : undefined;
  const pips = Object.values(state.pip ?? {}).filter((p) => p.screenId === selectedScreenId);
  const presets = Object.values(state.presets ?? {});
  const automation = state.automation ?? { cues: [], cursor: -1, running: false, timers: {} };
  const targetOptions = buildTargetOptions(state);

  const mediaPane = (
    <MediaLibrary
      media={media}
      uploadUrl={`${httpBase}/api/media`}
      onRename={actions.renameMedia}
      onRemove={removeMedia}
    />
  );

  const sourceBankPane = (
    <SourceBankPanel
      slots={state.sourceBank ?? []}
      media={media}
      onRename={actions.renameSourceBankSlot}
      onSetContent={actions.setSourceBankSlotContent}
    />
  );

  const layerRack = (
    <ChannelRack
      layers={layers}
      media={media}
      sourceBank={state.sourceBank}
      onUpdateLayer={actions.updateLayer}
      onMoveLayer={actions.moveLayer}
      onRemoveLayer={actions.removeLayer}
      onAddLayer={actions.addLayer}
      onCopyLayer={copyLayer}
      onPasteLayer={pasteLayer}
      canPaste={canPaste}
      onEditMaskLayer={editMask}
      onEditWarpLayer={editLayerWarp}
      onApplyCornerPresetLayer={(id, preset) =>
        actions.applyLayerCornerPreset(
          id,
          preset as "full" | "center" | "leftThird" | "rightThird" | "rotate90" | "rotate180" | "rotate270",
        )
      }
    />
  );

  const showControl = (
    <div className="show-control">
      <div className="show-tabs" role="tablist">
        {SHOW_TABS.map(([value, label]) => (
          <button
            key={value}
            className="show-tab-btn"
            role="tab"
            aria-selected={activeShowTab === value}
            data-active={activeShowTab === value}
            onClick={() => setActiveShowTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeShowTab === "presets" && (
        <section className="sc-card">
          <h3>Presets</h3>
          <PresetsBar
            presets={presets}
            onRecall={actions.recallPreset}
            onSave={actions.savePreset}
            onRename={actions.renamePreset}
            onRemove={actions.removePreset}
          />
        </section>
      )}
      {activeShowTab === "cues" && (
        <section className="sc-card">
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
        </section>
      )}
      {activeShowTab === "timers" && (
        <section className="sc-card">
          <TimerBank
            timers={Object.values(automation.timers ?? {})}
            presets={presets}
            onAdd={actions.addTimer}
            onUpdate={actions.updateTimer}
            onRemove={actions.removeTimer}
          />
        </section>
      )}
      {activeShowTab === "lfo" && (
        <section className="sc-card">
          <LfoRack
            lfos={Object.values(state.lfos ?? {})}
            targetOptions={targetOptions}
            onAdd={actions.addLfo}
            onUpdate={actions.updateLfo}
            onRemove={actions.removeLfo}
          />
        </section>
      )}
      {activeShowTab === "midi" && (
        <section className="sc-card">
          <MidiMapPanel
            mappings={Object.values(state.midiMap ?? {})}
            learningId={midi.learningId}
            midiAvailable={midi.available}
            targetOptions={targetOptions}
            onAdd={actions.addMidiMapping}
            onUpdate={actions.updateMidiMapping}
            onRemove={actions.removeMidiMapping}
            onLearn={midi.learn}
          />
        </section>
      )}
    </div>
  );

  const screenAside = (
    <aside>
      <WarpEditor
        ref={preview.warpMonitor}
        screen={screen}
        screens={screens}
        previewFrame={preview.frameFor(selectedScreenId)}
        onSelectScreen={setSelectedScreenId}
        onAddScreen={actions.addScreen}
        onRenameScreen={(name) => actions.renameScreen(sid, name)}
        onSetMode={(mode) => actions.setWarpMode(sid, mode)}
        onSetMeshSize={(size) => actions.setMeshSize(sid, size)}
        onReset={() => actions.resetWarp(sid)}
        onDragStart={beginDrag}
        onMovePoint={(index, x, y) => actions.moveWarpPoint(sid, index, x, y)}
        onDragEnd={endDrag}
        maskEditLayer={maskEditLayerId ? state.layers[maskEditLayerId] ?? null : null}
        onMaskChange={(field, value) => { if (maskEditLayerId) actions.updateLayer(maskEditLayerId, field, value); }}
        onMaskEditDone={() => setCanvasEditTarget(null)}
        warpEditLayer={warpEditLayerId ? state.layers[warpEditLayerId] ?? null : null}
        onLayerSetMode={(mode) => { if (warpEditLayerId) actions.setLayerWarpMode(warpEditLayerId, mode); }}
        onLayerSetMeshSize={(size) => { if (warpEditLayerId) actions.setLayerMeshSize(warpEditLayerId, size); }}
        onLayerResetWarp={() => { if (warpEditLayerId) actions.resetLayerWarp(warpEditLayerId); }}
        onLayerMovePoint={(index, x, y) => { if (warpEditLayerId) actions.moveLayerWarpPoint(warpEditLayerId, index, x, y); }}
        onWarpEditDone={() => setCanvasEditTarget(null)}
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
    </aside>
  );

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

  if (isMobile) {
    return (
      <>
        {faceplate}
        <div className="mobile-view">
          {activeMobileTab === "layers" && <main className="workspace">{layerRack}</main>}
          {activeMobileTab === "media" && <main className="workspace">{mediaPane}{sourceBankPane}</main>}
          {activeMobileTab === "show" && <main className="workspace">{showControl}</main>}
          {activeMobileTab === "screen" && screenAside}
        </div>
        <MobileTabBar active={activeMobileTab} onSelect={setActiveMobileTab} />
      </>
    );
  }

  return (
    <>
      {faceplate}
      <div className="layout">
        {/* Left column: the scene (layer rack) + the show (presets/cues/timers/modulation). */}
        <main className="workspace">
          {mediaPane}
          {sourceBankPane}
          {layerRack}
          {showControl}
        </main>

        {/* Right column: the screen machines — warp + PiP windows (cyan territory). */}
        {screenAside}
      </div>
    </>
  );
}
