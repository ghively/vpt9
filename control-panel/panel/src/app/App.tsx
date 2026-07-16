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
  LookBar,
  MasterControl,
  MediaBin,
  MediaLibrary,
  MidiMapPanel,
  MobileTabBar,
  OscOutSettings,
  PipWindows,
  PresetsBar,
  ScreenSelect,
  ShowDrawer,
  SlotGrid,
  SourceBankPresets,
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
import { mediaSourceUrl, type MediaDragPayload } from "../components/deck/dnd";
import { addToCollection } from "../components/collections";
import type { Layer, MediaItem } from "../components/types";
import { applyBatch, applyCreate, applyDelete, applyUpdate, emptyState, type PanelState } from "./store";
import { useSocket, type SocketMessage } from "./useSocket";
import { usePreviewBus } from "./usePreviewBus";
import { useMidi } from "./useMidi";
import { useIsMobile } from "./useIsMobile";
import { useCameraDevices } from "./useCameraDevices";
import { createActions } from "./actions";
import { useSelection } from "./useSelection";

/** The layer-look fields copy/paste moves between layers (not source/name/order).
 *  Recovered verbatim from the pre-deck-redesign App.tsx (see git show 2cd91e7). */
type LayerLook = Pick<Layer, "opacity" | "blendMode" | "mask" | "fx">;

/** Numeric per-layer paths offered by the LFO/MIDI target pickers. Recovered verbatim
 *  from the pre-Task-1 flat-layout App.tsx (see git show 3dcc100). */
const LAYER_TARGET_FIELDS: Array<[string, string]> = [
  ["opacity", "opacity"],
  ["fx.zoom", "zoom"],
  ["fx.zoomX", "zoom x"],
  ["fx.zoomY", "zoom y"],
  ["fx.rotationDeg", "rotation"],
  ["fx.anchorX", "anchor x"],
  ["fx.anchorY", "anchor y"],
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
  // Focus mode (VDMX's closable-inspectors pattern): hide the rails + Show drawer so the
  // stage and look bar are the entire surface during the show. Desktop-only — the mobile
  // layout already shows one surface at a time.
  const [focusMode, setFocusMode] = useState(false);
  // Video-input devices for the camera pickers (task A14) — the panel enumerates them
  // (it's already in a browser) and threads the list to the Inspector + SlotGrid editors.
  const cameraDevices = useCameraDevices();
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
  // Import-by-link started from inside a collection folder: url -> collection name,
  // applied when the import's "done" relay (which carries the new media id) arrives.
  const pendingImportCollections = useRef(new Map<string, string>());
  // Task A2: per-layer copy/paste clipboard (VPT8's copypaste.maxpat parity — see
  // docs/VPT8-PARITY-GAPS.md §3). Holds a structuredClone of one layer's LOOK fields
  // (opacity/blendMode/mask/fx — not source/name/order/id) so it can be stamped onto
  // other layers. A ref (not state) since the clipboard contents themselves never drive
  // a render; `hasClipboard` is the bit of that which does (gates the paste button).
  const clipboardRef = useRef<LayerLook | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);

  const preview = usePreviewBus(() => selectedRef.current);

  // Import-by-link progress, keyed by URL: "requesting" is set locally the moment the
  // POST goes out; the server's mediaImportStatus relays take over (downloading → done/
  // error). "done" clears the entry — the library's own create broadcast adds the item.
  const [mediaImports, setMediaImports] = useState<Record<string, { status: string; error?: string }>>({});

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
  // Coalesced through requestAnimationFrame: a 30 Hz LFO/fade batch (or any message
  // burst) previously forced a full-tree re-render PER MESSAGE on every connected panel;
  // now at most one render lands per displayed frame no matter the inbound rate. The
  // drag guard is re-checked at flush time — a gesture that started after scheduling
  // still suppresses the render, and endDrag's own forceRender reconciles afterward.
  const renderQueuedRef = useRef(false);
  const rerender = useCallback(() => {
    if (isDraggingRef.current || renderQueuedRef.current) return;
    renderQueuedRef.current = true;
    requestAnimationFrame(() => {
      renderQueuedRef.current = false;
      if (!isDraggingRef.current) forceRender();
    });
  }, []);

  const { send: rawSend } = useSocket(wsUrl, {
    onState(next) {
      stateRef.current = next;
      const screenIds = Object.keys(next.screens ?? {});
      if (!selectedRef.current || !next.screens?.[selectedRef.current]) {
        const nextId = screenIds[0] ?? null;
        if (nextId !== selectedRef.current) {
          setSelectedScreenId(nextId); // triggers a render itself
          return;
        }
      }
      // Route through the drag-guarded, coalesced rerender — a reconnect snapshot
      // landing mid-gesture must not yank the DOM out from under an active drag (the
      // same rule every other message type follows); endDrag reconciles afterward.
      rerender();
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
    onMediaImportStatus(url, importStatus, error, id) {
      // An import started from inside a collection folder gets filed into it once the
      // entry exists (the create broadcast lands before "done", so state.media has it).
      if (importStatus === "done" && id) {
        const collection = pendingImportCollections.current.get(url);
        pendingImportCollections.current.delete(url);
        const entry = stateRef.current.media?.[id];
        if (collection && entry) actions.setMediaTags(id, addToCollection(entry.tags, collection));
      }
      setMediaImports((prev) => {
        if (importStatus === "done") {
          const next = { ...prev };
          delete next[url];
          return next;
        }
        return { ...prev, [url]: { status: importStatus, error } };
      });
    },
    onTransportStatus(layerId, position) {
      transportPositionsRef.current[layerId] = position;
      // The Inspector's Transport scrub readout renders this value, so an otherwise-idle
      // panel needs a repaint or the seconds counter freezes. rerender() is rAF-coalesced
      // and drag-guarded, so this ~2 Hz telemetry costs at most one render per frame.
      rerender();
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
        // Re-render when the local apply changed something: the server echo will no-op
        // (applyUpdate's value-identity check) and so can never trigger the render
        // itself — without this, a scalar write like `blind` or `master` mutated the
        // mirror but left the UI stale until the next unrelated message. Coalesced and
        // drag-guarded by `rerender`, so pointer-rate writes stay cheap.
        if (applyUpdate(stateRef.current, message.path, message.value)) rerender();
      }
      return sent;
    },
    [rawSend, rerender],
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

  // Task A20 + true blind editing: toggle blind (preview) mode — freeze the projector,
  // keep building off-air. Toggling OFF is the COMMIT (the server drops its pre-blind
  // snapshot); discardBlind reverts to that snapshot instead.
  const toggleBlind = useCallback(() => {
    actions.setBlind(!(stateRef.current.blind ?? false));
  }, [actions]);
  const discardBlind = useCallback(() => {
    actions.blindDiscard();
  }, [actions]);

  // Import-by-link: POST the URL; all progress comes back over the WS as
  // mediaImportStatus relays (see the socket handler above).
  const importMediaUrl = useCallback(
    (url: string, collection?: string) => {
      const trimmed = url.trim();
      if (!/^https?:\/\/\S+$/i.test(trimmed)) return;
      if (collection) pendingImportCollections.current.set(trimmed, collection);
      setMediaImports((prev) => ({ ...prev, [trimmed]: { status: "requesting" } }));
      fetch(`${httpBase}/api/media/import`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      }).catch(() => {
        setMediaImports((prev) => ({ ...prev, [trimmed]: { status: "error", error: "could not reach the server" } }));
      });
    },
    [httpBase],
  );
  const dismissMediaImport = useCallback((url: string) => {
    setMediaImports((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  }, []);

  // Paste a link ANYWHERE (outside a text field) and it imports — the "just paste a
  // YouTube link" flow. The media bin's own link field remains the discoverable path.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const text = e.clipboardData?.getData("text")?.trim() ?? "";
      if (/^https?:\/\/\S+$/i.test(text)) {
        importMediaUrl(text);
        e.preventDefault();
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [importMediaUrl]);

  // Look bar save: snapshot the current scene under an auto-name. Renaming/deleting
  // stays in the Show drawer's Presets tab — the bar itself is trigger-only.
  const saveLook = useCallback(() => {
    const n = Object.keys(stateRef.current.presets ?? {}).length + 1;
    actions.savePreset(`Look ${n}`);
  }, [actions]);

  // Show-control keyboard shortcuts: 1-9 fire looks, B toggles blind, F toggles focus.
  // Guarded off anything editable (typing a preset name must not fire look 1); arrows
  // are deliberately NOT handled here — the stage overlay owns point nudging. Blackout
  // has NO shortcut on purpose: a destructive full-output cut stays a deliberate click.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      // No auto-repeat: a held B would machine-gun blind toggles, and every OFF edge is
      // a COMMIT that destroys the server's pre-blind snapshot.
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key >= "1" && e.key <= "9") {
        const looks = Object.values(stateRef.current.presets ?? {});
        const look = looks[Number(e.key) - 1];
        if (look) {
          actions.recallPreset(look.id);
          e.preventDefault();
        }
        return;
      }
      if (e.key === "b" || e.key === "B") {
        toggleBlind();
        e.preventDefault();
        return;
      }
      if (e.key === "f" || e.key === "F") {
        setFocusMode((f) => !f);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions, toggleBlind]);

  // Task A14b: camera record-to-disk. The render-client owning the camera stream does the
  // actual MediaRecorder capture + upload; this only fires the relay trigger and tracks the
  // button's lit state locally (there's no success round-trip — the new library item is the
  // confirmation). Toggling off requests the stop+upload.
  const [recording, setRecording] = useState(false);
  const toggleRecord = useCallback(() => {
    setRecording((on) => {
      if (on) actions.recordStop();
      else actions.recordStart();
      return !on;
    });
  }, [actions]);

  // Task A2: copy/paste a layer's look. Recovered verbatim from the pre-deck-redesign
  // App.tsx (git show 2cd91e7) — copyLayer snapshots the four LOOK fields off the
  // source layer, pasteLayer writes each of them onto the target layer through the
  // SAME per-field update path (`actions.updateLayer(id, field, value)`) every other
  // control in the deck already uses, so no new WS message type is needed. The
  // optimistic-echo `send` wrapper (see above) applies each write to the local mirror
  // immediately, same as any other Inspector/LayerStack edit.
  const copyLayer = useCallback((id: string) => {
    const layer = stateRef.current.layers[id];
    if (!layer) return;
    clipboardRef.current = structuredClone({
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      mask: layer.mask,
      fx: layer.fx,
    });
    setHasClipboard(true);
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
  const screens = Object.values(state.screens ?? {});
  // Show drawer (Task 8) derived state — recovered verbatim from the pre-Task-1
  // App.tsx (git show 3dcc100): presets/automation/media feed the six relocated panels,
  // targetOptions feeds LfoRack's and MidiMapPanel's target pickers.
  const presets = Object.values(state.presets ?? {});
  const automation = state.automation ?? { cues: [], cursor: -1, running: false, timers: {} };
  const media = Object.values(state.media ?? {});
  const targetOptions = buildTargetOptions(state);
  // Source-bank snapshots (task A12) + the recall cursor Next/Prev step from.
  const sourceBankPresets = Object.values(state.sourceBankPresets ?? {});
  const sourceBankPresetCursor = state.sourceBankPresetCursor ?? -1;
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
          <MasterControl
            master={state.master ?? 1}
            onChange={actions.setMaster}
            onToggleBlackout={toggleBlackout}
            blind={state.blind ?? false}
            onToggleBlind={toggleBlind}
            onDiscardBlind={discardBlind}
          />
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

  // Direct manipulation (the MadMapper/Resolume pattern): media thumbnails drag out of
  // the MediaBin onto a layer row, a source-bank slot, or the stage itself — all landing
  // on the SAME source write path the Inspector's picker uses. Double-click in the bin
  // assigns to the selected layer (the pointer-only/touch fallback).
  const assignMediaToLayer = useCallback(
    (layerId: string, payload: { filename: string }) => {
      actions.updateLayer(layerId, "source", { type: "video", url: mediaSourceUrl(payload) });
    },
    [actions],
  );
  const onStageDropMedia = useCallback(
    (point: { x: number; y: number }, payload: MediaDragPayload) => {
      // Prefer the layer whose warped quad is under the drop point (topmost wins),
      // falling back to the current selection for drops on empty background.
      const topFirst = Object.values(stateRef.current.layers).sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
      const hitId = pickTopLayer(topFirst, point);
      const targetId = hitId ?? selection.selectedLayerId;
      if (targetId) assignMediaToLayer(targetId, payload);
    },
    [assignMediaToLayer, selection],
  );
  const useMediaOnSelected = useCallback(
    (item: MediaItem) => {
      if (selection.selectedLayerId) assignMediaToLayer(selection.selectedLayerId, item);
    },
    [assignMediaToLayer, selection],
  );
  const renameLayer = useCallback(
    (id: string, name: string) => {
      actions.updateLayer(id, "name", name);
    },
    [actions],
  );
  // The visibility eye + drag-to-reorder (GIMP layer-panel conventions) — both plain
  // leaf writes on the existing update path. Reorder uses fractional orders so a drop
  // between two rows is one write, no stack renumbering.
  const toggleLayerVisible = useCallback(
    (id: string, visible: boolean) => {
      actions.updateLayer(id, "visible", visible);
    },
    [actions],
  );
  const setLayerOrder = useCallback(
    (id: string, order: number) => {
      actions.updateLayer(id, "order", order);
    },
    [actions],
  );
  const duplicateLayer = useCallback(
    (id: string) => {
      actions.duplicateLayer(id);
    },
    [actions],
  );

  // Flattened selection model: the LayerStack's pinned OUTPUT row selects the screen
  // target; selecting any layer row (or clicking a layer on the stage) returns to the
  // layer target. Replaces the old Inspector-buried Layer/Screen toggle — the stack now
  // lists everything selectable in one place: the output, then the layers inside it.
  const selectLayer = useCallback(
    (id: string) => {
      selection.setSelectedLayerId(id);
      selection.setEditTarget("layer");
    },
    [selection],
  );
  const selectOutput = useCallback(() => {
    selection.setEditTarget("screen");
  }, [selection]);

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
    (patch: Partial<{ cx: number; cy: number; rx: number; ry: number; points: { x: number; y: number }[] }>) => {
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
  const onInspectorTriggerClip = useCallback(
    (which: "next" | "prev" | "random") => {
      if (selectedLayer) actions.triggerClip(selectedLayer.id, which);
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
    case "sources":
      activePanel = (
        <section className="sc-card">
          <h3>Source snapshots</h3>
          <SourceBankPresets
            presets={sourceBankPresets}
            cursor={sourceBankPresetCursor}
            onSave={actions.saveSourceBankPreset}
            onRecall={actions.recallSourceBankPreset}
            onRename={actions.renameSourceBankPreset}
            onRemove={actions.removeSourceBankPreset}
            onNext={actions.nextSourceBankPreset}
            onPrev={actions.prevSourceBankPreset}
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
            sourcePresets={sourceBankPresets}
            targetOptions={targetOptions}
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
            sourcePresets={sourceBankPresets}
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
            tempoBpm={state.tempoBpm ?? 120}
            targetOptions={targetOptions}
            onAdd={actions.addLfo}
            onUpdate={actions.updateLfo}
            onRemove={actions.removeLfo}
            onSetTempo={actions.setTempo}
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
          <OscOutSettings
            enabled={!!state.oscOut?.enabled}
            host={state.oscOut?.host ?? "127.0.0.1"}
            port={state.oscOut?.port ?? 9001}
            onUpdate={actions.setOscOut}
          />
        </section>
      );
      break;
    case "media":
      activePanel = (
        <MediaLibrary
          media={media}
          uploadUrl={`${httpBase}/api/media`}
          onRename={actions.renameMedia}
          onSetTags={actions.setMediaTags}
          onRemove={removeMedia}
          recording={recording}
          onToggleRecord={toggleRecord}
        />
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
      selectedId={selection.editTarget === "screen" ? null : selection.selectedLayerId}
      onSelect={selectLayer}
      onAddLayer={actions.addLayer}
      onMoveLayer={actions.moveLayer}
      onRemoveLayer={actions.removeLayer}
      onCopyLayer={copyLayer}
      onPasteLayer={pasteLayer}
      hasClipboard={hasClipboard}
      onRenameLayer={renameLayer}
      onDropMedia={assignMediaToLayer}
      onToggleVisible={toggleLayerVisible}
      onSetLayerOrder={setLayerOrder}
      onDuplicateLayer={duplicateLayer}
      media={media}
      mediaBase={httpBase}
      outputName={selectedScreen ? selectedScreen.name || selectedScreen.id : null}
      outputSelected={selection.editTarget === "screen"}
      onSelectOutput={selectOutput}
    />
  );
  const mediaBinEl = (
    <MediaBin
      media={media}
      mediaBase={httpBase}
      uploadUrl={`${httpBase}/api/media`}
      onUseOnSelected={useMediaOnSelected}
      onRemove={removeMedia}
      onSetTags={actions.setMediaTags}
      onImportUrl={importMediaUrl}
      imports={Object.entries(mediaImports).map(([url, s]) => ({ url, ...s }))}
      onDismissImport={dismissMediaImport}
    />
  );
  const slotGridEl = (
    <SlotGrid
      slots={state.sourceBank}
      media={Object.values(state.media)}
      cameraDevices={cameraDevices}
      mediaBase={httpBase}
      onRename={actions.renameSourceBankSlot}
      onSetContent={actions.setSourceBankSlotContent}
      onSetTransport={actions.setSourceBankSlotTransport}
    />
  );
  // The look bar rides directly above the stage in both layouts — firing a look and
  // watching it land are one glance. Trigger-only by design (see LookBar's module doc).
  const lookBarEl = (
    <LookBar
      looks={presets}
      onRecall={actions.recallPreset}
      onSave={saveLook}
      onRename={actions.renamePreset}
      onRemove={actions.removePreset}
      focus={focusMode}
      onToggleFocus={() => setFocusMode((f) => !f)}
      blind={state.blind ?? false}
    />
  );
  const stageEl = selectedScreenId && (
    <Stage
      ref={preview.warpMonitor}
      screenId={selectedScreenId}
      frame={preview.frameFor(selectedScreenId) ?? null}
      blind={state.blind ?? false}
      overlay={
        // Task 12: screen edit target shows ONLY the active screen's warp handles — no
        // layer overlay renders alongside it, even if a layer is also selected.
        selection.editTarget === "screen" ? (
          selectedScreen ? (
            <StageSelectionOverlay
              editTarget="screen"
              screen={selectedScreen}
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
      modeChips={
        selection.editTarget === "layer" && selectedLayer
          ? { mode: selection.stageEditMode, onChange: selection.setStageEditMode }
          : null
      }
      onDropMedia={onStageDropMedia}
      contextItems={
        selection.editTarget === "screen"
          ? selectedScreen
            ? [{ label: "Reset screen warp", onSelect: onInspectorResetScreenWarp }]
            : []
          : selectedLayer
            ? [
                { label: "Edit warp", onSelect: () => selection.setStageEditMode("warp") },
                { label: "Edit mask", onSelect: () => selection.setStageEditMode("mask") },
                { label: "Edit FX", onSelect: () => selection.setStageEditMode("fx") },
                "separator",
                { label: "Reset layer warp", onSelect: onInspectorResetWarp },
                {
                  label: selectedLayer.visible === false ? "Show layer" : "Hide layer",
                  onSelect: () => toggleLayerVisible(selectedLayer.id, selectedLayer.visible === false),
                },
              ]
            : []
      }
    />
  );
  // Task-12-final type-tighten: Inspector's props are now a discriminated union keyed
  // on editTarget (see Inspector.tsx), so — unlike before — the layer- and screen-only
  // props can't both be passed in one call. Split into the same
  // `editTarget === "screen" ? ... : ...` shape the Stage's overlay prop above already
  // uses; each branch passes exactly the props that editTarget's union member declares,
  // so this renders identically to the single always-both-props call it replaces.
  const inspectorEl =
    selection.editTarget === "screen" ? (
      <Inspector
        editTarget="screen"
        screen={selectedScreen}
        onRenameScreen={onInspectorRenameScreen}
        onSetScreenWarpMode={onInspectorSetScreenWarpMode}
        onSetScreenMeshSize={onInspectorSetScreenMeshSize}
        onResetScreenWarp={onInspectorResetScreenWarp}
      />
    ) : (
      <Inspector
        editTarget="layer"
        layer={selectedLayer}
        mode={selection.stageEditMode}
        onModeChange={selection.setStageEditMode}
        media={Object.values(state.media)}
        sourceBank={state.sourceBank}
        cameraDevices={cameraDevices}
        allScreens={Object.values(state.screens ?? {})}
        transportPosition={selectedLayer ? transportPositionsRef.current[selectedLayer.id] : undefined}
        onUpdate={onInspectorUpdate}
        onSetSourceMode={onInspectorSetSourceMode}
        onSetPlaylist={onInspectorSetPlaylist}
        onTriggerClip={onInspectorTriggerClip}
        onApplyCornerPreset={onInspectorApplyCornerPreset}
        onSetWarpMode={onInspectorSetWarpMode}
        onSetMeshSize={onInspectorSetMeshSize}
        onResetWarp={onInspectorResetWarp}
      />
    );
  const showDrawerEl = (
    <ShowDrawer tab={showTab} onTab={setShowTab} open={showDrawerOpen} onToggle={() => setShowDrawerOpen((o) => !o)} onResetShow={actions.resetShow}>
      {activePanel}
    </ShowDrawer>
  );

  return (
    <div className="deck" data-mobile={isMobile} data-focus={!isMobile && focusMode}>
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
            <main className="stage-wrap">
              {lookBarEl}
              {stageEl}
            </main>
            <div className="sheet">
              {mobileTab === "layers" && <aside className="rail rail-l">{layerStackEl}</aside>}
              {mobileTab === "slots" && (
                <aside className="rail rail-l">
                  {mediaBinEl}
                  {slotGridEl}
                </aside>
              )}
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
              {mediaBinEl}
              {slotGridEl}
            </aside>
            <main className="stage-wrap">
              {lookBarEl}
              {stageEl}
            </main>
            <aside className="rail rail-r insp">{inspectorEl}</aside>
          </div>
          {showDrawerEl}
        </>
      )}
    </div>
  );
}
