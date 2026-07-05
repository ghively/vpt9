import type { Point } from "../components/types";
import type { PanelState } from "./store";
import type { SocketMessage } from "./useSocket";

const IDENTITY_CORNERS: Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

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
    setAudioOwner(screenId: string) {
      send({ type: "update", path: "audioOwnerScreenId", value: screenId });
    },
  };
}

export type PanelActions = ReturnType<typeof createActions>;
