import { useState } from "react";
import { useContextMenu, longPressHandlers, type MenuItem } from "./deck/ContextMenu";
import type { Preset } from "./types";

export interface PresetsBarProps {
  presets: Preset[];
  onRecall?: (id: string) => void;
  onSave?: (name: string) => void;
  /** Double-click (desktop) or the context menu (right-click / touch long-press) to rename. */
  onRename?: (id: string, name: string) => void;
  /** The hover × (desktop) or the context menu (touch). Removing a preset never touches
   *  the live scene. */
  onRemove?: (id: string) => void;
}

/** Recall cue buttons plus a name field and save button for capturing the current scene.
 *  Chips rename on double-click and delete via the hover ×; on touch (no hover / reliable
 *  double-tap) the SAME rename/delete are reachable through a long-press context menu —
 *  the pattern LookBar/MediaBin/LayerStack already use — so nothing is desktop-only. */
export function PresetsBar({ presets, onRecall, onSave, onRename, onRemove }: PresetsBarProps) {
  const [name, setName] = useState("");
  const ctx = useContextMenu();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startRename = (preset: Preset) => {
    setDraft(preset.name);
    setRenamingId(preset.id);
  };
  const commitRename = (preset: Preset) => {
    const next = draft.trim();
    if (next && next !== preset.name) onRename?.(preset.id, next);
    setRenamingId(null);
  };

  // Shared by right-click and touch long-press (mobile has no right-click and double-tap
  // is zoom-prone), so preset management is fully reachable on touch.
  const presetMenu = (preset: Preset): MenuItem[] => [
    ...(onRecall ? [{ label: "Recall", onSelect: () => onRecall(preset.id) }] : []),
    ...(onRename ? [{ label: "Rename…", onSelect: () => startRename(preset) }] : []),
    ...(onRemove ? ["separator" as const, { label: "Delete preset", danger: true, onSelect: () => onRemove(preset.id) }] : []),
  ];

  const save = () => {
    let auto = "";
    if (!name.trim()) {
      const names = new Set(presets.map((p) => p.name));
      let n = 1;
      while (names.has(`Preset ${n}`)) n++; // smallest free — `length+1` collided after a delete
      auto = `Preset ${n}`;
    }
    onSave?.(name.trim() || auto);
    setName("");
  };

  return (
    <div id="presets-bar">
      <div className="bar">
        {presets.length === 0 && (
          <span className="empty-note mono">no presets — set a look, name it, save</span>
        )}
        {presets.map((preset) =>
          renamingId === preset.id ? (
            <input
              key={preset.id}
              type="text"
              className="preset-rename-input"
              value={draft}
              autoFocus
              aria-label="Preset name"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commitRename(preset)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename(preset);
                if (e.key === "Escape") setRenamingId(null);
              }}
            />
          ) : (
            <span className="preset-chip" key={preset.id}>
              <button
                className="preset"
                title="Recall — double-click to rename · right-click / long-press to manage"
                onClick={() => onRecall?.(preset.id)}
                onDoubleClick={() => startRename(preset)}
                onContextMenu={(e) => ctx.open(e, presetMenu(preset))}
                {...longPressHandlers((x, y) => ctx.openAt(x, y, presetMenu(preset)))}
              >
                {preset.name}
              </button>
              {onRemove && (
                <button
                  className="preset-remove"
                  title="Delete preset"
                  aria-label={`Delete preset ${preset.name}`}
                  onClick={() => onRemove(preset.id)}
                >
                  ×
                </button>
              )}
            </span>
          ),
        )}
        <input
          type="text"
          className="preset-name-input"
          placeholder="Preset name"
          aria-label="New preset name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
        />
        <button className="save-btn" onClick={save}>
          + Save current
        </button>
      </div>
      {ctx.menu}
    </div>
  );
}
