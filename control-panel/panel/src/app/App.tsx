import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  AudioOwner,
  CueList,
  Faceplate,
  Inspector,
  LayerStack,
  LfoRack,
  MasterControl,
  MediaLibrary,
  MidiMapPanel,
  MobileTabBar,
  PipWindows,
  PresetsBar,
  ScreenSelect,
  ShowDrawer,
  SlotGrid,
  Stage,
  StageSelectionOverlay,
  StatusLamp,
  TimerBank,
  type ConnectionState,
  type MobileTab,
  type ShowTab,
  type TargetOption,
} from "../components";
import { layerQuad, pickTopLayer } from "../components/deck/layerGeometry";
import { applyBatch, applyCreate, applyDelete, applyUpdate, emptyState, type PanelState } from "./store";
import { useSocket, type SocketMessage } from "./useSocket";
import { usePreviewBus } from "./usePreviewBus";
import { useMidi } from "./useMidi";
import { useIsMobile } from "./useIsMobile";
import { createActions } from "./actions";
import { useSelection } from "./useSelection";

/** Numeric per-layer paths offered by the LFO/MIDI target pickers. Recovered verbatim
 *  from the pre-Task-1 flat-layout App.tsx (see git show 3dcc100). */
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
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedScreenId;
  const isDraggingRef = useRef(false);
  const [status, setStatus] = useState<{ state: ConnectionState; label: string }>({
    state: "connecting",
    label: "connecting…",
  });
  // Show drawer (Task 8): which secondary panel is active + whether the bottom sheet
  // is expanded. Collapsed by default so it doesn't compete with the deck above it.
  const [showTab, setShowTab] = useState<ShowTab>("presets");
  const [showDrawerOpen, setShowDrawerOpen] = useState(false);
  // Mobile pass (Task 9): below the useIsMobile() breakpoint the 3-zone `.body` grid
  // collapses to a single column with the Stage dominant at top; the left rail
  // (Layers/Slots), Inspector, and Show drawer become bottom-sheet tabs picked by
  // MobileTabBar instead of all being visible at once. `isMobile` also gates the DOM
  // structure `.body` renders (see the return statement below) — deck.css's mobile
  // overrides key off the `data-mobile` attribute that mirrors this same boolean, so the
  // CSS and the actual rendered tree can never disagree about which layout is showing.
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>("layers");
  // Selecting the "Show" bottom tab also expands the Show drawer itself (it's collapsed
  // by default — see above) so the operator sees its content immediately instead of just
  // its collapsed tab strip on first tap.
  const selectMobileTab = useCallback((tab: MobileTab) => {
    setMobileTab(tab);
    if (tab === "show") setShowDrawerOpen(true);
  }, []);
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

  // The media API lives on the same host as the control plane; derive its HTTP origin
  // from the ws url. Upload + delete are HTTP (not WS); rename is a WS update. Recovered
  // verbatim from the pre-Task-1 App.tsx (git show 3dcc100).
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
  // MIDI-learn wiring runs entirely on its own effect (WebMIDI listeners -> `send`);
  // the returned learn/available state is read by MidiMapPanel in the Show drawer's
  // "midi" tab (Task 8 — previously discarded here since the panel wasn't mounted).
  const midi = useMidi(getState, send);

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
  // Show drawer (Task 8) derived state — recovered verbatim from the pre-Task-1
  // App.tsx (git show 3dcc100): presets/automation/media feed the six relocated panels,
  // targetOptions feeds LfoRack's and MidiMapPanel's target pickers.
  const presets = Object.values(state.presets ?? {});
  const automation = state.automation ?? { cues: [], cursor: -1, running: false, timers: {} };
  const media = Object.values(state.media ?? {});
  const targetOptions = buildTargetOptions(state);
  // Task 13: PiP (picture-in-picture cast) windows for the currently selected screen —
  // recovered verbatim from the pre-Task-1 App.tsx (git show 3dcc100), where these fed a
  // permanently-mounted <PipWindows> next to WarpEditor in the screen aside. `sid` mirrors
  // that original's `selectedScreenId ?? ""` fallback so screenId/onAddPip never see null.
  const pips = Object.values(state.pip ?? {}).filter((p) => p.screenId === selectedScreenId);
  const sid = selectedScreenId ?? "";

  const faceplate = (
    <Faceplate
      screenSelect={
        <ScreenSelect
          screens={screens}
          selectedId={selectedScreenId}
          onSelect={setSelectedScreenId}
          onAdd={actions.addScreen}
        />
      }
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
  //
  // Task 12: while editTarget === "screen" the stage is showing the ACTIVE SCREEN's
  // warp handles, not any layer's — a background click (i.e. one that misses every
  // .deck-handle, see Stage's own handlePointerDown guard) must not silently reassign
  // the hidden layer selection underneath the operator while they're lining up a
  // projector corner. Documented choice: ignore background clicks entirely in screen
  // mode, rather than switching back to layer mode on a layer hit — a stray click
  // switching targets mid-drag would be more surprising than a no-op.
  const onBackgroundPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (selection.editTarget === "screen") return;
      const rect = e.currentTarget.getBoundingClientRect();
      const p = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
      const topFirst = Object.values(stateRef.current.layers).sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
      selection.setSelectedLayerId(pickTopLayer(topFirst, p));
    },
    [selection],
  );
  // Not memoized: layersTopFirst is itself a fresh array every render (see above), so
  // there'd be nothing stable to key a memo off; this is a cheap map over a handful of
  // layers, not worth the added complexity. Suppressed in screen mode (Task 12) — the
  // per-layer hover outline would be misleading when hovering/clicking a layer's region
  // doesn't do anything (see onBackgroundPointerDown above).
  const hitLayers = selection.editTarget === "screen" ? [] : layersTopFirst.map((layer) => ({ id: layer.id, quad: layerQuad(layer) }));
  const selectedLayer = layersTopFirst.find((l) => l.id === selection.selectedLayerId) ?? null;
  const selectedScreen = (selectedScreenId && state.screens?.[selectedScreenId]) || null;

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
  // Task 12: the SCREEN-warp equivalent of onWarpCorner above — maps
  // StageSelectionOverlay's screen-mode drag callback onto `actions.moveWarpPoint`, the
  // EXISTING screen warp action (unchanged since before this redesign; previously only
  // called from the now-deleted rail-side WarpEditor).
  const onScreenWarpCorner = useCallback(
    (index: number, x: number, y: number) => {
      if (selectedScreenId) actions.moveWarpPoint(selectedScreenId, index, x, y);
    },
    [actions, selectedScreenId],
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

  // Task 12: the SCREEN-warp equivalents of the four Inspector callbacks above — same
  // shape, scoped to the active screen, wired to the EXISTING screen warp actions
  // (renameScreen/setWarpMode/setMeshSize/resetWarp) rather than the layer-warp ones.
  const onInspectorRenameScreen = useCallback(
    (name: string) => {
      if (selectedScreenId) actions.renameScreen(selectedScreenId, name);
    },
    [actions, selectedScreenId],
  );
  const onInspectorSetScreenWarpMode = useCallback(
    (mode: "corner" | "mesh") => {
      if (selectedScreenId) actions.setWarpMode(selectedScreenId, mode);
    },
    [actions, selectedScreenId],
  );
  const onInspectorSetScreenMeshSize = useCallback(
    (size: number) => {
      if (selectedScreenId) actions.setMeshSize(selectedScreenId, size);
    },
    [actions, selectedScreenId],
  );
  const onInspectorResetScreenWarp = useCallback(() => {
    if (selectedScreenId) actions.resetWarp(selectedScreenId);
  }, [actions, selectedScreenId]);

  // Task 8: the Show drawer's active-tab panel — each case wired with the EXACT
  // props/callbacks the pre-Task-1 flat layout used (git show 3dcc100), just relocated
  // from an always-on `.show-control` band into the collapsible bottom drawer. Cues/
  // Timers/LFO/MIDI already render their own <h3> internally (see their source), so
  // only Presets — which doesn't — gets an explicit heading here, matching the original.
  // MediaLibrary also already self-wraps in a `.sc-card` section, so it's rendered bare.
  let activePanel: ReactNode;
  switch (showTab) {
    case "presets":
      activePanel = (
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
      );
      break;
    case "cues":
      activePanel = (
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
      );
      break;
    case "timers":
      activePanel = (
        <section className="sc-card">
          <TimerBank
            timers={Object.values(automation.timers ?? {})}
            presets={presets}
            onAdd={actions.addTimer}
            onUpdate={actions.updateTimer}
            onRemove={actions.removeTimer}
          />
        </section>
      );
      break;
    case "lfo":
      activePanel = (
        <section className="sc-card">
          <LfoRack
            lfos={Object.values(state.lfos ?? {})}
            targetOptions={targetOptions}
            onAdd={actions.addLfo}
            onUpdate={actions.updateLfo}
            onRemove={actions.removeLfo}
          />
        </section>
      );
      break;
    case "midi":
      activePanel = (
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
      );
      break;
    case "media":
      activePanel = (
        <MediaLibrary media={media} uploadUrl={`${httpBase}/api/media`} onRename={actions.renameMedia} onRemove={removeMedia} />
      );
      break;
    case "pip":
      // Task 13: PiP windows, dropped entirely by Task 1 and restored here. Same
      // component, same props/callbacks as the pre-Task-1 App.tsx (git show 3dcc100) —
      // only its home changed, from a permanently-mounted <aside> next to WarpEditor to
      // this Show-drawer tab. `preview.pipMonitor` (usePreviewBus) is still the ref that
      // receives pushed frames for the confidence monitor, same as before.
      activePanel = (
        <section className="sc-card">
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
        </section>
      );
      break;
  }

  // Task 9: the deck's four collapsible surfaces, hoisted into element variables so
  // desktop and mobile can arrange the SAME components differently below — desktop packs
  // layerStackEl/slotGridEl into one rail-l aside and shows all four at once; mobile
  // renders exactly one of them at a time (picked by mobileTab) inside the bottom sheet,
  // below the always-visible Stage. No component internals change between the two.
  const layerStackEl = (
    <LayerStack
      layers={layersTopFirst}
      selectedId={selection.selectedLayerId}
      onSelect={selection.setSelectedLayerId}
      onAddLayer={actions.addLayer}
      onMoveLayer={actions.moveLayer}
      onRemoveLayer={actions.removeLayer}
    />
  );
  const slotGridEl = (
    <SlotGrid
      slots={state.sourceBank}
      media={Object.values(state.media)}
      onRename={actions.renameSourceBankSlot}
      onSetContent={actions.setSourceBankSlotContent}
    />
  );
  const stageEl = selectedScreenId && (
    <Stage
      ref={preview.warpMonitor}
      screenId={selectedScreenId}
      frame={preview.frameFor(selectedScreenId) ?? null}
      width={1280}
      height={720}
      overlay={
        // Task 12: screen edit target shows ONLY the active screen's warp handles — no
        // layer overlay renders alongside it, even if a layer is also selected.
        selection.editTarget === "screen" ? (
          selectedScreen ? (
            <StageSelectionOverlay
              editTarget="screen"
              screen={selectedScreen}
              mode={selection.stageEditMode}
              onScreenWarpCorner={onScreenWarpCorner}
              onDragStart={beginDrag}
              onDragEnd={endDrag}
            />
          ) : null
        ) : selectedLayer ? (
          <StageSelectionOverlay
            editTarget="layer"
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
  );
  const inspectorEl = (
    <Inspector
      editTarget={selection.editTarget}
      onSetEditTarget={selection.setEditTarget}
      layer={selectedLayer}
      screen={selectedScreen}
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
      onRenameScreen={onInspectorRenameScreen}
      onSetScreenWarpMode={onInspectorSetScreenWarpMode}
      onSetScreenMeshSize={onInspectorSetScreenMeshSize}
      onResetScreenWarp={onInspectorResetScreenWarp}
    />
  );
  const showDrawerEl = (
    <ShowDrawer tab={showTab} onTab={setShowTab} open={showDrawerOpen} onToggle={() => setShowDrawerOpen((o) => !o)}>
      {activePanel}
    </ShowDrawer>
  );

  return (
    <div className="deck" data-mobile={isMobile}>
      {/* Faceplate already renders its own <header> (wordmark, AudioOwner, MasterControl
          w/ blackout, StatusLamp); a plain div carries the .cmd shell/grid-row styling so
          we don't nest <header> inside <header>. */}
      <div className="cmd">{faceplate}</div>
      {isMobile ? (
        <>
          {/* Mobile: single column, Stage dominant at top (always visible regardless of
              which bottom tab is active), the active tab's panel in a scrollable sheet
              below it. `data-selected-layer` stays on `.body` (not just the desktop
              variant) so deck-panel.spec.js's selection assertions keep working
              unchanged if it's ever run at a narrow viewport. */}
          <div className="body" data-selected-layer={selection.selectedLayerId ?? undefined}>
            <main className="stage-wrap">{stageEl}</main>
            <div className="sheet">
              {mobileTab === "layers" && <aside className="rail rail-l">{layerStackEl}</aside>}
              {mobileTab === "slots" && <aside className="rail rail-l">{slotGridEl}</aside>}
              {mobileTab === "inspector" && <aside className="rail rail-r insp">{inspectorEl}</aside>}
              {mobileTab === "show" && showDrawerEl}
            </div>
          </div>
          <MobileTabBar active={mobileTab} onSelect={selectMobileTab} />
        </>
      ) : (
        <>
          {/* Desktop: UNCHANGED 3-zone body (left rail / stage / right inspector) + the
              always-mounted Show drawer below it. */}
          <div className="body" data-selected-layer={selection.selectedLayerId ?? undefined}>
            <aside className="rail rail-l">
              {layerStackEl}
              {slotGridEl}
            </aside>
            <main className="stage-wrap">{stageEl}</main>
            <aside className="rail rail-r insp">{inspectorEl}</aside>
          </div>
          {showDrawerEl}
        </>
      )}
    </div>
  );
}
