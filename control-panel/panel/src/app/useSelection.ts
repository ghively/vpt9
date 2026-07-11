import { useState, useCallback } from "react";

export type EditMode = "warp" | "mask" | "fx";

export function useSelection(firstLayerId: string | null) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(firstLayerId);
  const [stageEditMode, setStageEditMode] = useState<EditMode>("warp");
  const select = useCallback((id: string | null) => setSelectedLayerId(id), []);
  return { selectedLayerId, setSelectedLayerId: select, stageEditMode, setStageEditMode };
}
