import { useCallback, useRef } from "react";
import type { ConfidenceMonitorHandle } from "../components/ConfidenceMonitor";

/** Keeps preview frames OUT of the React render loop. The latest frame per screen is
 *  cached, and frames for the currently-selected screen are pushed straight into the two
 *  visible monitors (warp + PiP) via their imperative handles — never through a re-render,
 *  so text-input focus and in-progress drags are never disturbed. */
export function usePreviewBus(getSelectedScreenId: () => string | null) {
  const latest = useRef(new Map<string, string>());
  const warpMonitor = useRef<ConfidenceMonitorHandle>(null);
  const pipMonitor = useRef<ConfidenceMonitorHandle>(null);

  const push = useCallback(
    (screenId: string, frame: string) => {
      latest.current.set(screenId, frame);
      if (screenId === getSelectedScreenId()) {
        warpMonitor.current?.setFrame(frame);
        pipMonitor.current?.setFrame(frame);
      }
    },
    [getSelectedScreenId],
  );

  /** The last known frame for a screen, used to seed a monitor when it first renders or
   *  after the operator switches screens. */
  const frameFor = (screenId: string | null): string | undefined =>
    screenId ? latest.current.get(screenId) : undefined;

  return { warpMonitor, pipMonitor, push, frameFor };
}
