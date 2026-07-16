import { useState } from "react";
import { Button } from "./primitives/Button";
import type { SourceBankPreset } from "./types";

export interface SourceBankPresetsProps {
  presets: SourceBankPreset[];
  /** Index into `presets` of the last-recalled snapshot (-1 = none) — highlights the chip
   *  Next/Prev will step from. */
  cursor: number;
  onSave?: (name: string) => void;
  onRecall?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onRemove?: (id: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

function PresetChip({
  preset,
  active,
  onRecall,
  onRename,
  onRemove,
}: {
  preset: SourceBankPreset;
  active: boolean;
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
        data-active={active}
        title="Recall these sources — double-click to rename"
        onClick={() => onRecall?.(preset.id)}
        onDoubleClick={() => {
          setDraft(preset.name);
          setEditing(true);
        }}
      >
        {preset.name}
      </button>
      {onRemove && (
        <button className="preset-remove" title="Delete source-bank snapshot" onClick={() => onRemove(preset.id)}>
          ×
        </button>
      )}
    </span>
  );
}

/** Source-bank preset bar (task A12 — VPT8's `pattrstorage sources` + sourcenext/prev):
 *  Save the current 8-slot bank as a named snapshot, recall one (chips), rename/delete, and
 *  step Prev/Next through them. Modeled on `PresetsBar`, but snapshots the source bank
 *  (content + per-slot transport) rather than the scene look. */
export function SourceBankPresets({ presets, cursor, onSave, onRecall, onRename, onRemove, onNext, onPrev }: SourceBankPresetsProps) {
  const [name, setName] = useState("");

  const save = () => {
    let auto = "";
    if (!name.trim()) {
      const names = new Set(presets.map((p) => p.name));
      let n = 1;
      while (names.has(`Sources ${n}`)) n++; // smallest free — `length+1` collided after a delete
      auto = `Sources ${n}`;
    }
    onSave?.(name.trim() || auto);
    setName("");
  };

  return (
    <div id="source-bank-presets">
      <div className="bar">
        <Button label="◀ Prev" onClick={() => onPrev?.()} disabled={presets.length === 0} />
        <Button label="Next ▶" onClick={() => onNext?.()} disabled={presets.length === 0} />
        {presets.length === 0 && <span className="empty-note mono">no source snapshots — set up the bank, name it, save</span>}
        {presets.map((preset, i) => (
          <PresetChip
            key={preset.id}
            preset={preset}
            active={i === cursor}
            onRecall={onRecall}
            onRename={onRename}
            onRemove={onRemove}
          />
        ))}
        <input
          type="text"
          className="preset-name-input"
          placeholder="Snapshot name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
        />
        <button className="save-btn" onClick={save}>
          + Save sources
        </button>
      </div>
    </div>
  );
}
