import { useState, useCallback } from "react";

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
  return { selectedLayerId, setSelectedLayerId: select, stageEditMode, setStageEditMode, editTarget, setEditTarget };
}
