import { LayerStack } from "./layers.js";
import { ScreenWarp } from "./warp.js";

const INTERNAL_WIDTH = 1280;
const INTERNAL_HEIGHT = 720;

export class Compositor {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL2 is not available in this browser");
    this.gl = gl;

    this.layerStack = new LayerStack(gl);
    this.layerStack.resize(INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.screenWarp = new ScreenWarp(gl);

    this.layers = []; // sorted by `order` ascending
    this.warp = null;
    this.muted = true;

    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    this.canvas.height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
  }

  // layersById: the state's `layers` map (id -> layer object)
  setLayers(layersById) {
    const incoming = Object.values(layersById || {}).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const incomingIds = new Set(incoming.map((l) => l.id));

    for (const layer of incoming) this.layerStack.setLayerSource(layer.id, layer.source);
    for (const id of [...this.layerStack.entries.keys()]) {
      if (!incomingIds.has(id)) this.layerStack.removeLayer(id);
    }

    this.layers = incoming;
    this._applyMute();
  }

  updateLayerField(layerId, field, value) {
    const layer = this.layers.find((l) => l.id === layerId);
    if (!layer) return;
    if (field === "source") this.layerStack.setLayerSource(layerId, value);
    else layer[field] = value;
  }

  setWarp(warp) {
    this.warp = warp;
  }

  setMuted(muted) {
    this.muted = muted;
    this._applyMute();
  }

  _applyMute() {
    for (const layer of this.layers) this.layerStack.setLayerMuted(layer.id, this.muted);
  }

  start() {
    const loop = () => {
      const scene = this.layerStack.render(this.layers);
      this.screenWarp.render(scene, this.warp, this.canvas.width, this.canvas.height);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // Downsamples the current canvas to a small JPEG data URL for the warp-editor's live
  // preview loop in the control panel — never the full-res output, see README.
  capturePreview(maxWidth = 320) {
    const scale = maxWidth / this.canvas.width;
    const width = Math.max(1, Math.round(this.canvas.width * scale));
    const height = Math.max(1, Math.round(this.canvas.height * scale));
    if (!this._previewCanvas) {
      this._previewCanvas = document.createElement("canvas");
      this._previewCtx = this._previewCanvas.getContext("2d");
    }
    this._previewCanvas.width = width;
    this._previewCanvas.height = height;
    this._previewCtx.drawImage(this.canvas, 0, 0, width, height);
    return this._previewCanvas.toDataURL("image/jpeg", 0.6);
  }
}
