import { useState } from "react";
import { Button } from "./primitives/Button";
import { useContextMenu, longPressHandlers, type MenuItem } from "./deck/ContextMenu";
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

/** Source-bank preset bar (task A12 — VPT8's `pattrstorage sources` + sourcenext/prev):
 *  Save the current 8-slot bank as a named snapshot, recall one (chips), rename/delete, and
 *  step Prev/Next through them. Modeled on `PresetsBar`, but snapshots the source bank
 *  (content + per-slot transport) rather than the scene look. Rename/delete are reachable
 *  on touch via a long-press context menu (no hover / reliable double-tap there), same as
 *  PresetsBar/LookBar. */
export function SourceBankPresets({ presets, cursor, onSave, onRecall, onRename, onRemove, onNext, onPrev }: SourceBankPresetsProps) {
  const [name, setName] = useState("");
  const ctx = useContextMenu();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startRename = (preset: SourceBankPreset) => {
    setDraft(preset.name);
    setRenamingId(preset.id);
  };
  const commitRename = (preset: SourceBankPreset) => {
    const next = draft.trim();
    if (next && next !== preset.name) onRename?.(preset.id, next);
    setRenamingId(null);
  };

  const presetMenu = (preset: SourceBankPreset): MenuItem[] => [
    ...(onRecall ? [{ label: "Recall", onSelect: () => onRecall(preset.id) }] : []),
    ...(onRename ? [{ label: "Rename…", onSelect: () => startRename(preset) }] : []),
    ...(onRemove ? ["separator" as const, { label: "Delete snapshot", danger: true, onSelect: () => onRemove(preset.id) }] : []),
  ];

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
        {presets.map((preset, i) =>
          renamingId === preset.id ? (
            <input
              key={preset.id}
              type="text"
              className="preset-rename-input"
              value={draft}
              autoFocus
              aria-label="Snapshot name"
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
                data-active={i === cursor}
                title="Recall these sources — double-click to rename · right-click / long-press to manage"
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
                  title="Delete source-bank snapshot"
                  aria-label={`Delete snapshot ${preset.name}`}
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
          placeholder="Snapshot name"
          aria-label="New snapshot name"
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
      {ctx.menu}
    </div>
  );
}
