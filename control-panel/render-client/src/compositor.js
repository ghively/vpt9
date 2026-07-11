import { LayerStack } from "./layers.js";
import { ScreenWarp } from "./warp.js";

const INTERNAL_WIDTH = 1280;
const INTERNAL_HEIGHT = 720;

export class Compositor {
  constructor(canvas) {
    this.canvas = canvas;
    // preserveDrawingBuffer: capturePreview() reads the canvas back via drawImage on a
    // ~250ms interval, outside the rAF that drew the frame — without preservation the
    // buffer contents are undefined after compositing and the preview goes blank.
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
    if (!gl) throw new Error("WebGL2 is not available in this browser");
    this.gl = gl;

    this.layerStack = new LayerStack(gl);
    this.layerStack.resize(INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.screenWarp = new ScreenWarp(gl);

    this.layers = []; // sorted by `order` ascending
    this.warp = null;
    this.muted = true;
    this.master = 1; // final-output dim; 0 = blackout
    this._mediaOrigin = "";
    this._contextLost = false;
    this.onContextRestored = null; // main.js wires this to replay the scene after a GPU reset

    // A GPU reset (driver hiccup, tab backgrounding, or the headless-Chromium GPU death
    // this project's MEMORY.md notes) fires webglcontextlost. Without preventDefault the
    // context never comes back and the projector stays dark until a manual reload. Pause
    // rendering while lost; rebuild GL objects on restore and let main.js replay state.
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this._contextLost = true;
      console.warn("[compositor] WebGL context lost — pausing render until restored");
    });
    canvas.addEventListener("webglcontextrestored", () => {
      console.warn("[compositor] WebGL context restored — reinitializing GL resources");
      this._reinitGl();
      this._contextLost = false;
      this.onContextRestored?.();
    });

    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  // Rebuild every GL-backed sub-renderer after a context loss/restore. The old objects'
  // GL handles are dead; dispose() stops their <video> elements (DOM, still valid) so they
  // don't leak, then fresh programs/buffers/textures are created on the restored context.
  _reinitGl() {
    this.layerStack?.dispose?.();
    this.screenWarp?.dispose?.();
    this.layerStack = new LayerStack(this.gl);
    this.layerStack.resize(INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.layerStack.setMediaOrigin(this._mediaOrigin);
    this.screenWarp = new ScreenWarp(this.gl);
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    this.canvas.height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
  }

  // layersById: state's `layers` map. sourceBank/media: state.sourceBank/state.media,
  // needed so slot-sourced and playlist-media-sourced layers can resolve what they
  // actually display (see LayerStack.effectiveSource/setSourceContext).
  setLayers(layersById, sourceBank, media) {
    const incoming = Object.values(layersById || {}).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const incomingIds = new Set(incoming.map((l) => l.id));

    this.layerStack.setSourceContext(sourceBank, media);
    for (const layer of incoming) {
      const effective = this.layerStack.effectiveSource(layer);
      if (effective) this.layerStack.setLayerSource(layer.id, effective, { loop: this.layerStack.shouldLoop(layer) });
      // No resolvable source (e.g. a playlist item pointing at deleted media, or a cleared
      // source): actively clear it so the previous clip stops, instead of leaving an
      // "undead" video playing while state says the layer moved on.
      else if (this.layerStack.entries.has(layer.id)) this.layerStack.setLayerSource(layer.id, null);
    }
    for (const id of [...this.layerStack.entries.keys()]) {
      if (!incomingIds.has(id)) this.layerStack.removeLayer(id);
    }

    this.layers = incoming;
    this._applyMute();
  }

  setWarp(warp) {
    this.warp = warp;
  }

  setMuted(muted) {
    this.muted = muted;
    this._applyMute();
  }

  setMaster(master) {
    this.master = typeof master === "number" ? master : 1;
  }

  setMediaOrigin(origin) {
    this._mediaOrigin = origin;
    this.layerStack.setMediaOrigin(origin);
  }

  _applyMute() {
    for (const layer of this.layers) this.layerStack.setLayerMuted(layer.id, this.muted);
  }

  start() {
    const loop = () => {
      // The rAF loop MUST re-arm itself every frame no matter what. A single throw here
      // used to leave the trailing requestAnimationFrame unreached, permanently freezing
      // the projector on the last frame with no recovery even after a corrective patch.
      // Contain per-frame errors: log at most once per ~2s and keep the loop alive.
      if (!this._contextLost) {
        try {
          const scene = this.layerStack.render(this.layers);
          this.screenWarp.render(scene, this.warp, this.canvas.width, this.canvas.height, this.master);
        } catch (err) {
          const now = performance.now();
          if (!this._lastRenderErrAt || now - this._lastRenderErrAt > 2000) {
            this._lastRenderErrAt = now;
            console.error("[compositor] render error (continuing):", err);
          }
        }
      }
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
