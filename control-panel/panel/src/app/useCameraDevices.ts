import { useEffect, useState } from "react";
import type { CameraDevice } from "../components/types";

/** Enumerates the browser's video-input devices for the camera pickers (task A14). The
 *  PANEL enumerates (not the render-client) because the panel already runs in a browser
 *  and its pickers are what need the list — no extra WS round-trip. Labels are blank until
 *  camera permission has been granted once (a browser privacy rule); the pickers fall back
 *  to a short id label in that case. Re-enumerates on `devicechange` (camera plugged/
 *  unplugged). Returns [] where `mediaDevices` is unavailable (insecure context / old
 *  browser) so callers just render an empty device list rather than crash. */
export function useCameraDevices(): CameraDevice[] {
  const [devices, setDevices] = useState<CameraDevice[]>([]);

  useEffect(() => {
    const md = navigator.mediaDevices;
    if (!md?.enumerateDevices) return;
    let cancelled = false;

    const refresh = () => {
      md.enumerateDevices()
        .then((list) => {
          if (cancelled) return;
          setDevices(
            list
              .filter((d) => d.kind === "videoinput")
              // Drop blank-deviceId entries: before camera permission is granted the browser
              // returns video inputs with an empty deviceId, which collide with the picker's
              // hard-coded {value:""} "Default camera" option (duplicate React <option> keys +
              // an unselectable "Camera N" that just resolves back to the default).
              .filter((d) => d.deviceId)
              .map((d) => ({ deviceId: d.deviceId, label: d.label })),
          );
        })
        .catch(() => {});
    };

    refresh();
    md.addEventListener?.("devicechange", refresh);
    return () => {
      cancelled = true;
      md.removeEventListener?.("devicechange", refresh);
    };
  }, []);

  return devices;
}
