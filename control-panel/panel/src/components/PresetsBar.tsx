import { useState } from "react";
import type { Preset } from "./types";

export interface PresetsBarProps {
  presets: Preset[];
  onRecall?: (id: string) => void;
  onSave?: (name: string) => void;
  /** Double-click a preset to rename it inline. */
  onRename?: (id: string, name: string) => void;
  /** The hover ×. Removing a preset never touches the live scene. */
  onRemove?: (id: string) => void;
}

function PresetChip({
  preset,
  onRecall,
  onRename,
  onRemove,
}: {
  preset: Preset;
  onRecall?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onRemove?: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(preset.name);

  const commit = () => {
    setEditing(false);
    const name = draft.trim();
    if (name && name !== preset.name) onRename?.(preset.id, name);
  };

  if (editing) {
    return (
      <input
        type="text"
        className="preset-rename-input"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  return (
    <span className="preset-chip">
      <button
        className="preset"
        title="Recall — double-click to rename"
        onClick={() => onRecall?.(preset.id)}
        onDoubleClick={() => {
          setDraft(preset.name);
          setEditing(true);
        }}
      >
        {preset.name}
      </button>
      {onRemove && (
        <button
          className="preset-remove"
          title="Delete preset"
          onClick={() => onRemove(preset.id)}
        >
          ×
        </button>
      )}
    </span>
  );
}

/** Recall cue buttons plus a name field and save button for capturing the current scene.
 *  Chips rename on double-click and delete via the hover ×. */
export function PresetsBar({ presets, onRecall, onSave, onRename, onRemove }: PresetsBarProps) {
  const [name, setName] = useState("");

  const save = () => {
    onSave?.(name.trim() || `Preset ${presets.length + 1}`);
    setName("");
  };

  return (
    <div id="presets-bar">
      <div className="bar">
        {presets.length === 0 && (
          <span className="empty-note mono">no presets — set a look, name it, save</span>
        )}
        {presets.map((preset) => (
          <PresetChip
            key={preset.id}
            preset={preset}
            onRecall={onRecall}
            onRename={onRename}
            onRemove={onRemove}
          />
        ))}
        <input
          type="text"
          className="preset-name-input"
          placeholder="Preset name"
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
    </div>
  );
}
