import type { Cue, Fx, Point, PlaylistItem } from "../components/types";
import type { PanelState } from "./store";
import type { SocketMessage } from "./useSocket";

const IDENTITY_CORNERS: Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

// Mirrors server/src/state.js defaultFx() — every value is "stage off".
function defaultFx(): Fx {
  return {
    flipH: false,
    flipV: false,
    tileX: 1,
    tileY: 1,
    zoom: 1,
    zoomX: 1,
    zoomY: 1,
    anchorX: 0.5,
    anchorY: 0.5,
    rotationDeg: 0,
    panX: 0,
    panY: 0,
    blur: 0,
    motionBlur: 0,
    motionBlurMode: "trail",
    motionBlurAngle: 0,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    hue: 0,
    edgeBlend: { left: 0, right: 0, top: 0, bottom: 0, gamma: 2, invert: false },
    enabled: { transform: true, color: true, edgeBlend: true },
  };
}

/** VPT8's mesh order range is 2–10; clamp so a stored `size` (and its point grid) can never
 *  be a divide-by-zero (<=1) or an absurd value from a non-UI write path. */
function clampMeshSize(size: number): number {
  return Math.max(2, Math.min(10, Math.round(size) || 2));
}

function identityMeshPoints(size: number): Point[] {
  // Guard the divisor: size <= 1 makes `col / (size - 1)` divide by 0 → NaN coordinates,
  // which blank the layer's geometry (the render mesh and warpQuad's Math.min go NaN). The
  // Inspector Select only offers 2–10, but a programmatic/OSC path could pass anything.
  const n = clampMeshSize(size);
  const points: Point[] = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) points.push({ x: col / (n - 1), y: row / (n - 1) });
  }
  return points;
}

/** All state mutations go out as WebSocket messages; the server echoes them back and the
 *  store applies them. `getState` reads the current mirror for actions that need to (layer
 *  reorder, warp reset/point path). Mirrors app.js's `actions` object. */
export function createActions(send: (message: SocketMessage) => void, getState: () => PanelState) {
  return {
    addLayer() {
      send({
        type: "create",
        path: "layers",
        value: {
          id: `layer-${Date.now()}`,
          name: "New layer",
          source: { type: "color", color: [0.5, 0.5, 0.5] },
          opacity: 1,
          blendMode: "normal",
          mask: { enabled: false, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, feather: 0.08 },
          fx: defaultFx(),
          // Include `warp` like `mask`/`fx` above (the server backfills it via
          // ensureLayerDefaults, and the client doesn't optimistically apply creates, so
          // this isn't a live bug) — but `Layer.warp` is required and StageSelectionOverlay's
          // WarpHandles reads `warp.mode` unguarded, so ship the identity warp in the payload
          // rather than depend on the round-trip to fill it.
          warp: {
            mode: "corner",
            corners: IDENTITY_CORNERS.map((p) => ({ ...p })),
            mesh: { size: 4, points: identityMeshPoints(4) },
          },
        },
      });
    },
    updateLayer(id: string, field: string, value: unknown) {
      send({ type: "update", path: `layers.${id}.${field}`, value });
    },
    // GIMP's Duplicate Layer: a full clone (source, look, warp, mask, fx, transport)
    // under a fresh id, placed at the top of the stack (order omitted — the server's
    // handleCreate assigns nextLayerOrder).
    duplicateLayer(id: string) {
      const layer = getState().layers[id];
      if (!layer) return;
      const copy = structuredClone(layer);
      copy.id = `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      copy.name = `${layer.name || layer.id} copy`;
      delete (copy as { order?: number }).order; // server assigns top-of-stack
      send({ type: "create", path: "layers", value: copy });
    },
    removeLayer(id: string) {
      send({ type: "delete", path: `layers.${id}` });
    },
    moveLayer(id: string, dir: "up" | "down") {
      const layers = Object.values(getState().layers).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const i = layers.findIndex((l) => l.id === id);
      const neighbor = dir === "up" ? layers[i + 1] : layers[i - 1];
      const self = layers[i];
      if (!neighbor || !self) return;
      // Swap order values rather than renumber the whole stack (see server nextLayerOrder).
      send({ type: "update", path: `layers.${self.id}.order`, value: neighbor.order });
      send({ type: "update", path: `layers.${neighbor.id}.order`, value: self.order });
    },
    setWarpMode(screenId: string, mode: "corner" | "mesh") {
      send({ type: "update", path: `screens.${screenId}.warp.mode`, value: mode });
    },
    resetWarp(screenId: string) {
      const warp = getState().screens[screenId]?.warp;
      if (warp?.mode === "mesh" && warp.mesh) {
        send({ type: "update", path: `screens.${screenId}.warp.mesh.points`, value: identityMeshPoints(warp.mesh.size) });
      } else {
        send({ type: "update", path: `screens.${screenId}.warp.corners`, value: IDENTITY_CORNERS.map((p) => ({ ...p })) });
      }
    },
    moveWarpPoint(screenId: string, index: number, x: number, y: number) {
      const warp = getState().screens[screenId]?.warp;
      const base =
        warp?.mode === "mesh"
          ? `screens.${screenId}.warp.mesh.points`
          : `screens.${screenId}.warp.corners`;
      send({ type: "update", path: `${base}.${index}`, value: { x, y } });
    },
    setLayerWarpMode(id: string, mode: "corner" | "mesh") {
      send({ type: "update", path: `layers.${id}.warp.mode`, value: mode });
    },
    resetLayerWarp(id: string) {
      const warp = getState().layers[id]?.warp;
      if (warp?.mode === "mesh" && warp.mesh) {
        send({ type: "update", path: `layers.${id}.warp.mesh.points`, value: identityMeshPoints(warp.mesh.size) });
      } else {
        send({ type: "update", path: `layers.${id}.warp.corners`, value: IDENTITY_CORNERS.map((p) => ({ ...p })) });
      }
    },
    moveLayerWarpPoint(id: string, index: number, x: number, y: number) {
      const warp = getState().layers[id]?.warp;
      const base = warp?.mode === "mesh" ? `layers.${id}.warp.mesh.points` : `layers.${id}.warp.corners`;
      send({ type: "update", path: `${base}.${index}`, value: { x, y } });
    },
    setLayerMeshSize(id: string, size: number) {
      const n = clampMeshSize(size);
      send({ type: "update", path: `layers.${id}.warp.mesh`, value: { size: n, points: identityMeshPoints(n) } });
    },
    // VPT8's activelayer.maxpat "p cornerpin_templates" preset menu (full/center/thirds/
    // rotations), applied to layers.<id>.warp.corners as one atomic write.
    applyLayerCornerPreset(id: string, preset: "full" | "center" | "leftThird" | "rightThird" | "rotate90" | "rotate180" | "rotate270") {
      const presets: Record<string, Point[]> = {
        full: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
        center: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, { x: 0.75, y: 0.75 }, { x: 0.25, y: 0.75 }],
        leftThird: [{ x: 0, y: 0 }, { x: 0.333, y: 0 }, { x: 0.333, y: 1 }, { x: 0, y: 1 }],
        rightThird: [{ x: 0.667, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0.667, y: 1 }],
        rotate90: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }],
        rotate180: [{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }],
        rotate270: [{ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
      };
      send({ type: "update", path: `layers.${id}.warp.corners`, value: presets[preset] });
    },
    updatePip(id: string, field: string, value: unknown) {
      send({ type: "update", path: `pip.${id}.${field}`, value });
    },
    movePip(id: string, x: number, y: number) {
      send({ type: "update", path: `pip.${id}.x`, value: x });
      send({ type: "update", path: `pip.${id}.y`, value: y });
    },
    resizePip(id: string, width: number, height: number) {
      send({ type: "update", path: `pip.${id}.width`, value: width });
      send({ type: "update", path: `pip.${id}.height`, value: height });
    },
    removePip(id: string) {
      send({ type: "delete", path: `pip.${id}` });
    },
    addPip(screenId: string) {
      send({
        type: "create",
        path: "pip",
        value: {
          id: `pip-${Date.now()}`,
          screenId,
          title: "YouTube",
          videoId: null,
          x: 0.1,
          y: 0.1,
          width: 0.3,
          height: (0.3 * 9) / 16,
          visible: false,
        },
      });
    },
    savePreset(name: string) {
      send({ type: "presetSave", name });
    },
    recallPreset(id: string) {
      send({ type: "presetRecall", presetId: id });
    },
    renamePreset(id: string, name: string) {
      send({ type: "update", path: `presets.${id}.name`, value: name });
    },
    removePreset(id: string) {
      send({ type: "delete", path: `presets.${id}` });
    },
    setAudioOwner(screenId: string) {
      send({ type: "update", path: "audioOwnerScreenId", value: screenId });
    },
    setMaster(value: number) {
      send({ type: "update", path: "master", value: Math.min(1, Math.max(0, value)) });
    },
    // Blind / preview mode (task A20 + true blind editing): freezes the projector on its
    // last frame while compositing + the confidence preview keep running. Engaging blind
    // makes the server snapshot the live look; setBlind(false) is the COMMIT (edits go
    // live), blindDiscard() reverts to the snapshot instead. Plain top-level leaf write.
    setBlind(value: boolean) {
      send({ type: "update", path: "blind", value: !!value });
    },
    // Abandon the blind session: restore the pre-blind look and unfreeze the wall.
    blindDiscard() {
      send({ type: "blindDiscard" });
    },

    // ── Camera record-to-disk (task A14b) ────────────────────────────────────
    // Relay-only trigger (mirrors preview/transportStatus): the render-client that owns the
    // camera stream records it and POSTs the clip to /api/media, where it appears as a new
    // media-library item. Nothing here is persisted in state.
    recordStart() {
      send({ type: "record", action: "start" });
    },
    recordStop() {
      send({ type: "record", action: "stop" });
    },

    // ── Screens ──────────────────────────────────────────────────────────────
    addScreen() {
      // Smallest free screen-N: render clients address themselves by ?screen=<id>, so
      // predictable ids beat Date.now() ones here.
      let n = 1;
      const screens = getState().screens;
      while (screens[`screen-${n}`]) n += 1;
      send({
        type: "create",
        path: "screens",
        value: {
          id: `screen-${n}`,
          name: `Screen ${n}`,
          warp: {
            mode: "corner",
            corners: IDENTITY_CORNERS.map((p) => ({ ...p })),
            mesh: { size: 4, points: identityMeshPoints(4) },
          },
        },
      });
    },
    renameScreen(screenId: string, name: string) {
      send({ type: "update", path: `screens.${screenId}.name`, value: name });
    },
    setMeshSize(screenId: string, size: number) {
      // A different grid size makes the old points meaningless — reset to identity.
      // One atomic update: size and points must never disagree, even for a frame.
      const n = clampMeshSize(size);
      send({
        type: "update",
        path: `screens.${screenId}.warp.mesh`,
        value: { size: n, points: identityMeshPoints(n) },
      });
    },

    // ── Cue-list transport + editing ─────────────────────────────────────────
    cueGo() {
      send({ type: "cueGo" });
    },
    cueStop() {
      send({ type: "cueStop" });
    },
    cueJump(index: number) {
      send({ type: "cueJump", index });
    },
    // The cue list is one state leaf; edits replace the whole array.
    setCues(cues: Cue[]) {
      send({ type: "update", path: "automation.cues", value: cues });
    },

    // ── Timer bank ───────────────────────────────────────────────────────────
    // New entries carry every editable field: applyUpdate only patches leaves that
    // already exist, so a missing presetId could never be filled in later.
    addTimer() {
      send({
        type: "create",
        path: "automation.timers",
        value: { id: `timer-${Date.now()}`, enabled: false, time: "18:00", action: "cueGo", presetId: "" },
      });
    },
    updateTimer(id: string, field: string, value: unknown) {
      send({ type: "update", path: `automation.timers.${id}.${field}`, value });
    },
    removeTimer(id: string) {
      send({ type: "delete", path: `automation.timers.${id}` });
    },

    // ── LFO rack ─────────────────────────────────────────────────────────────
    // New slots carry every A19 field: applyUpdate only patches leaves that already exist,
    // so a mixer's aId/blend (or phase/syncNote) could never be filled in later otherwise.
    addLfo() {
      send({
        type: "create",
        path: "lfos",
        value: {
          id: `lfo-${Date.now()}`,
          enabled: false,
          wave: "sine",
          rateHz: 0.2,
          min: 0,
          max: 1,
          target: "",
          kind: "osc",
          aId: null,
          bId: null,
          blend: "add",
          mix: 0.5,
          phase: 0,
          waveInvert: false,
          syncNote: null,
        },
      });
    },
    updateLfo(id: string, field: string, value: unknown) {
      send({ type: "update", path: `lfos.${id}.${field}`, value });
    },
    removeLfo(id: string) {
      send({ type: "delete", path: `lfos.${id}` });
    },
    // Global LFO tempo (A19). Guarded server-side to a finite positive number — also
    // guarded here because the optimistic local echo applies whatever we send, so a NaN
    // (Math.max(1, NaN) is NaN) would show a phantom tempo the server actually refused.
    setTempo(bpm: number) {
      if (!Number.isFinite(bpm)) return;
      send({ type: "update", path: "tempoBpm", value: Math.max(1, bpm) });
    },

    // ── OSC output / state mirroring (A17) ───────────────────────────────────
    setOscOut(field: "enabled" | "host" | "port", value: unknown) {
      send({ type: "update", path: `oscOut.${field}`, value });
    },

    // ── MIDI map ─────────────────────────────────────────────────────────────
    addMidiMapping() {
      send({
        type: "create",
        path: "midiMap",
        value: { id: `map-${Date.now()}`, channel: 0, controller: 1, target: "", min: 0, max: 1 },
      });
    },
    updateMidiMapping(id: string, field: string, value: unknown) {
      send({ type: "update", path: `midiMap.${id}.${field}`, value });
    },
    removeMidiMapping(id: string) {
      send({ type: "delete", path: `midiMap.${id}` });
    },

    // ── Media library ────────────────────────────────────────────────────────
    // Rename is a plain leaf update (upload + delete are HTTP, handled in App).
    renameMedia(id: string, name: string) {
      send({ type: "update", path: `media.${id}.name`, value: name });
    },
    // Tags are a whole-array leaf swap (media.<id>.tags) — the server pins the value
    // to an array of strings and backfills the leaf onto pre-tagging entries.
    setMediaTags(id: string, tags: string[]) {
      send({ type: "update", path: `media.${id}.tags`, value: tags });
    },

    // "Start fresh" (owner request 2026-07-16): the server wipes the show back to
    // defaults in one atomic step — keeping the media library + screen registry — and
    // rebroadcasts full state to every client.
    resetShow() {
      send({ type: "resetShow" });
    },

    // ── Source bank ──────────────────────────────────────────────────────────
    // `sourceBank` is a fixed-length array addressed positionally by the existing
    // applyUpdate dotted-path convention, so writes go by `index`; `slotId` is kept as
    // a param too (unused here — prefixed `_` for noUnusedParameters) since callers
    // building `content.a`/`content.b` refs need the id, not the array index, and the
    // signature stays symmetric with `SourceBankPanelProps.onSetContent`.
    setSourceBankSlotContent(_slotId: string, index: number, content: unknown) {
      send({ type: "update", path: `sourceBank.${index}.content`, value: content });
    },
    renameSourceBankSlot(index: number, name: string) {
      send({ type: "update", path: `sourceBank.${index}.name`, value: name });
    },
    // Per-slot clip transport (task A9): `field` is relative to the slot's transport
    // object ("playing", "rate", "loopMode", "loopIn", "seek", …).
    setSourceBankSlotTransport(index: number, field: string, value: unknown) {
      send({ type: "update", path: `sourceBank.${index}.transport.${field}`, value });
    },

    // ── Source-bank presets (task A12 — VPT8's `pattrstorage sources` + sourcenext/prev) ─
    // Save/recall snapshot the whole 8-slot bank server-side (their own message types, like
    // scene presetSave/presetRecall); rename/remove are plain leaf edits on the entry.
    saveSourceBankPreset(name: string) {
      send({ type: "sourceBankPresetSave", name });
    },
    recallSourceBankPreset(id: string) {
      send({ type: "sourceBankPresetRecall", presetId: id });
    },
    renameSourceBankPreset(id: string, name: string) {
      send({ type: "update", path: `sourceBankPresets.${id}.name`, value: name });
    },
    removeSourceBankPreset(id: string) {
      send({ type: "delete", path: `sourceBankPresets.${id}` });
    },
    nextSourceBankPreset() {
      send({ type: "sourceBankPresetNext" });
    },
    prevSourceBankPreset() {
      send({ type: "sourceBankPresetPrev" });
    },

    // ── Clip transport + playlist ───────────────────────────────────────────
    // `layers.<id>.transport.<field>` is reachable via the existing generic
    // `updateLayer(id, \`transport.${field}\`, value)` above — no dedicated wrapper needed.
    setSourceMode(id: string, mode: "single" | "playlist") {
      send({ type: "update", path: `layers.${id}.sourceMode`, value: mode });
    },
    setPlaylist(id: string, items: PlaylistItem[]) {
      // Preserve the live cursor (clamped to the new length) instead of forcing 0 — every
      // playlist edit (reorder, add, remove, duration tweak) funnels through here, and
      // snapping the cursor to 0 restarted the whole playlist on the wall mid-show. The
      // server keys its per-clip timer to the cursor, so keeping it holds the current clip.
      const prev = getState().layers[id]?.playlist?.cursor ?? 0;
      const cursor = items.length ? Math.min(Math.max(0, prev), items.length - 1) : 0;
      send({ type: "update", path: `layers.${id}.playlist`, value: { items, cursor } });
    },
    // Manual clip trigger (task A15 — VPT8's /trig /last /random): advance/retreat/randomize
    // a playlist layer's cursor live. The server's tickPlaylists/clipEnded advance it
    // automatically; this writes the cursor leaf directly for an operator-driven jump. The
    // render-client re-resolves effectiveSource on any cursor change, loading the new clip.
    triggerClip(id: string, which: "next" | "prev" | "random") {
      const layer = getState().layers[id];
      const items = layer?.playlist?.items ?? [];
      if (!items.length) return;
      const cur = layer.playlist.cursor ?? 0;
      const cursor =
        which === "next"
          ? (cur + 1) % items.length
          : which === "prev"
            ? (cur - 1 + items.length) % items.length
            : Math.floor(Math.random() * items.length);
      send({ type: "update", path: `layers.${id}.playlist.cursor`, value: cursor });
    },
  };
}

export type PanelActions = ReturnType<typeof createActions>;
