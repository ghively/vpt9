import { useState } from "react";
import type { Preset } from "./types";

export interface PresetsBarProps {
  presets: Preset[];
  onRecall?: (id: string) => void;
  onSave?: (name: string) => void;
}

/** Recall cue buttons plus a name field and save button for capturing the current scene. */
export function PresetsBar({ presets, onRecall, onSave }: PresetsBarProps) {
  const [name, setName] = useState("");

  const save = () => {
    onSave?.(name.trim() || `Preset ${presets.length + 1}`);
    setName("");
  };

  return (
    <div id="presets-bar">
      <div className="bar">
        {presets.map((preset) => (
          <button key={preset.id} className="preset" onClick={() => onRecall?.(preset.id)}>
            {preset.name}
          </button>
        ))}
        <input
          type="text"
          className="preset-name-input"
          placeholder="Preset name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="save-btn" onClick={save}>
          + Save current
        </button>
      </div>
    </div>
  );
}
