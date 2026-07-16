import { useState } from "react";
import { useContextMenu, longPressHandlers, type MenuItem } from "./ContextMenu";
import type { Preset } from "../types";

export interface LookBarProps {
  /** Scene presets in insertion order — chip N recalls looks[N-1], matching the 1-9
   *  keyboard shortcuts the container installs. */
  looks: Preset[];
  onRecall?: (id: string) => void;
  /** Snapshot the current scene as a new look (the container names it "Look N"). */
  onSave?: () => void;
  /** Context-menu management (right-click a chip): rename in place / delete. Click
   *  stays trigger-only so nothing on the live surface fires destructively by accident. */
  onRename?: (id: string, name: string) => void;
  onRemove?: (id: string) => void;
  /** Focus mode (VDMX's closable-inspectors pattern): hide the rails/drawer so the
   *  stage + looks are the whole surface during the show. */
  focus?: boolean;
  onToggleFocus?: () => void;
  /** While blind, recalls/saves happen off-air — tint the bar amber to say so. */
  blind?: boolean;
}

/** The look bar — Resolume's deck-switching idea in preset form: the whole scene
 *  (layers/screens/pip) banked behind one chip, recallable by a single click or its
 *  number key mid-show. Sits directly above the stage so firing a look and watching it
 *  land are one glance. Left-click is deliberately trigger-only (grandMA's "executors
 *  vs. programmer" split); management lives behind the right-click menu and the Show
 *  drawer's Looks tab. */
export function LookBar({ looks, onRecall, onSave, onRename, onRemove, focus = false, onToggleFocus, blind = false }: LookBarProps) {
  const ctx = useContextMenu();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const commitRename = (look: Preset) => {
    const name = draft.trim();
    if (name && name !== look.name) onRename?.(look.id, name);
    setRenamingId(null);
  };

  // Shared by right-click and touch long-press (mobile has no right-click).
  const lookMenu = (look: Preset): MenuItem[] => [
    ...(onRecall ? [{ label: "Recall", onSelect: () => onRecall(look.id) }] : []),
    ...(onRename ? [{ label: "Rename…", onSelect: () => { setDraft(look.name); setRenamingId(look.id); } }] : []),
    ...(onRemove ? ["separator" as const, { label: "Delete look", danger: true, onSelect: () => onRemove(look.id) }] : []),
  ];

  return (
    <div className="lookbar" data-blind={blind}>
      <span className="lookbar__label label">Looks</span>
      <div className="lookbar__chips">
        {looks.length === 0 && <span className="lookbar__empty mono">none saved — build a look, press save</span>}
        {looks.map((look, i) =>
          renamingId === look.id ? (
            <input
              key={look.id}
              type="text"
              className="look-rename-input"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commitRename(look)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename(look);
                if (e.key === "Escape") setRenamingId(null);
              }}
            />
          ) : (
            <button
              key={look.id}
              type="button"
              className="look-chip"
              title={i < 9 ? `Recall (key ${i + 1}) · right-click / long-press to manage` : "Recall · right-click / long-press to manage"}
              onClick={() => onRecall?.(look.id)}
              onContextMenu={(e) => ctx.open(e, lookMenu(look))}
              {...longPressHandlers((x, y) => ctx.openAt(x, y, lookMenu(look)))}
            >
              {i < 9 && <span className="look-chip__key mono">{i + 1}</span>}
              <span className="look-chip__name">{look.name}</span>
            </button>
          ),
        )}
        <button type="button" className="look-save mono" title="Snapshot the current scene as a new look" onClick={() => onSave?.()}>
          + save
        </button>
      </div>
      <button
        type="button"
        className="look-focus mono"
        aria-pressed={focus}
        title={focus ? "Show the rails again (F)" : "Hide rails/drawer — stage + looks only (F)"}
        onClick={() => onToggleFocus?.()}
      >
        {focus ? "exit focus" : "focus"}
      </button>
      {ctx.menu}
    </div>
  );
}
