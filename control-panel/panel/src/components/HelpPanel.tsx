import { useEffect } from "react";

/** Shortcuts + hidden-gestures reference (owner request 2026-07-16: "I want all stuff like
 *  this found"). Many capabilities are keyboard- or gesture-only with no on-screen
 *  affordance; this modal is the one place they're all written down. Opened by the "?" in
 *  the faceplate, closed by Escape / backdrop / ×. */

const SECTIONS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: "Keyboard",
    rows: [
      ["1 – 9", "Recall look (scene preset) 1–9"],
      ["B", "Toggle Blind (edit off-air, then Go Live)"],
      ["F", "Focus mode (hide rails for a clean stage)"],
      ["Arrow keys", "Nudge a selected warp point / mask vertex (Shift = coarse)"],
      ["Delete / Backspace", "Remove the selected polygon-mask vertex"],
      ["Ctrl + drag", "Snap a warp handle to the grid"],
      ["Esc", "Deselect a handle / close this help"],
    ],
  },
  {
    title: "Mouse & drag",
    rows: [
      ["Drag media → layer row", "Set that layer's source"],
      ["Drag media → slot", "Fill the source-bank slot"],
      ["Drag media → stage", "Assign to the layer under the drop"],
      ["Drag media → folder", "File it into that collection"],
      ["Double-click media", "Use on the selected layer"],
      ["Drag a layer row", "Reorder the stack"],
      ["Right-click", "Context menu (layers, slots, media, looks, stage)"],
      ["Double-click a name", "Rename (layer, look, preset)"],
      ["Paste a URL anywhere", "Import it into the media library"],
      ["Click the OUTPUT row", "Edit the projector (screen) warp"],
    ],
  },
  {
    title: "Where things live",
    rows: [
      ["Play / pause, opacity", "On each layer row"],
      ["Hue / sat / bright / blur / zoom…", "Inspector → FX (per-layer effects)"],
      ["Rate, loop, scrub", "Inspector → FX → Transport"],
      ["Mask & warp", "Inspector, or drag handles on the stage"],
      ["Master / blackout / blind", "Bottom strip"],
      ["Looks, Cues, LFO, MIDI, PiP…", "Bottom Show drawer tabs"],
      ["Collections & tags", "Media bin (folders; right-click → Edit tags)"],
    ],
  },
];

export function HelpPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="help-backdrop" onClick={onClose}>
      <div className="help-panel" role="dialog" aria-label="Shortcuts and gestures" onClick={(e) => e.stopPropagation()}>
        <div className="help-head">
          <span className="help-title">Shortcuts & hidden gestures</span>
          <button type="button" className="help-close" title="Close (Esc)" onClick={onClose}>×</button>
        </div>
        <div className="help-body">
          {SECTIONS.map((s) => (
            <section key={s.title} className="help-section">
              <h4 className="help-section-title">{s.title}</h4>
              <dl className="help-rows">
                {s.rows.map(([k, v]) => (
                  <div className="help-row" key={k}>
                    <dt className="help-key mono">{k}</dt>
                    <dd className="help-desc">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
