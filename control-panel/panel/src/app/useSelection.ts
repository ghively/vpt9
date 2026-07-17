import { useState, useCallback, useMemo } from "react";

export type EditMode = "warp" | "mask" | "fx";

/** Which kind of object the Stage/Inspector are currently editing (Task 12): the
 *  selected LAYER (its own warp/mask/fx — the pre-Task-12 default) or the active
 *  SCREEN's projector warp (corner-pin/mesh over the composited output). Screens only
 *  ever expose a warp body — mask/fx stay layer-only — so `stageEditMode` keeps its
 *  existing meaning within "layer" and is simply ignored while `editTarget === "screen"`
 *  (the Inspector/overlay both treat screen mode as warp-only). */
export type EditTarget = "layer" | "screen";

export function useSelection(firstLayerId: string | null) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(firstLayerId);
  const [stageEditMode, setStageEditMode] = useState<EditMode>("warp");
  const [editTarget, setEditTarget] = useState<EditTarget>("layer");
  const select = useCallback((id: string | null) => setSelectedLayerId(id), []);
  // Memoize the returned object so its identity is stable across renders that don't
  // change the selection. The setters (`select` + the two useState setters) are already
  // stable, so App's `useCallback`s that list `selection` as a dep — and the memoized
  // LayerStack/MediaBin that receive those callbacks — no longer re-create/re-render on
  // every unrelated ~8 Hz automation tick (perf: the object literal was a fresh reference
  // each render, silently defeating those memos). Recomputes only when a value changes.
  return useMemo(
    () => ({ selectedLayerId, setSelectedLayerId: select, stageEditMode, setStageEditMode, editTarget, setEditTarget }),
    [selectedLayerId, select, stageEditMode, editTarget],
  );
}
