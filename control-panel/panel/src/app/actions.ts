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
    edgeBlend: { left: 0, right: 0, top: 0, bottom: 0, gamma: 2, invert: false },
    enabled: { transform: true, color: true, edgeBlend: true },
  };
}

function identityMeshPoints(size: number): Point[] {
  const points: Point[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) points.push({ x: col / (size - 1), y: row / (size - 1) });
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
        },
      });
    },
    updateLayer(id: string, field: string, value: unknown) {
      send({ type: "update", path: `layers.${id}.${field}`, value });
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
      if (warp?.mode === "mesh") {
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
      if (warp?.mode === "mesh") {
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
      send({ type: "update", path: `layers.${id}.warp.mesh`, value: { size, points: identityMeshPoints(size) } });
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
      send({
        type: "update",
        path: `screens.${screenId}.warp.mesh`,
        value: { size, points: identityMeshPoints(size) },
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
    addLfo() {
      send({
        type: "create",
        path: "lfos",
        value: { id: `lfo-${Date.now()}`, enabled: false, wave: "sine", rateHz: 0.2, min: 0, max: 1, target: "" },
      });
    },
    updateLfo(id: string, field: string, value: unknown) {
      send({ type: "update", path: `lfos.${id}.${field}`, value });
    },
    removeLfo(id: string) {
      send({ type: "delete", path: `lfos.${id}` });
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

    // ── Clip transport + playlist ───────────────────────────────────────────
    // `layers.<id>.transport.<field>` is reachable via the existing generic
    // `updateLayer(id, \`transport.${field}\`, value)` above — no dedicated wrapper needed.
    setSourceMode(id: string, mode: "single" | "playlist") {
      send({ type: "update", path: `layers.${id}.sourceMode`, value: mode });
    },
    setPlaylist(id: string, items: PlaylistItem[]) {
      send({ type: "update", path: `layers.${id}.playlist`, value: { items, cursor: 0 } });
    },
  };
}

export type PanelActions = ReturnType<typeof createActions>;
