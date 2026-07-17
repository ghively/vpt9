import { Select } from "./primitives/Select";
import { CAMERA_RESOLUTIONS, resolutionKey, resolutionFromKey } from "./camera";
import type { CameraDevice, CameraResolution } from "./types";

export interface CameraPickerProps {
  /** Current device id, or undefined for the system default camera. */
  deviceId?: string;
  /** Current capture resolution, or undefined/null for the browser default. */
  resolution?: CameraResolution | null;
  /** Enumerated video-input devices (from `useCameraDevices`). */
  devices: CameraDevice[];
  /** Fires with the picked device id (undefined = system default). */
  onDevice: (deviceId: string | undefined) => void;
  /** Fires with the picked resolution (null = browser default). */
  onResolution: (resolution: CameraResolution | null) => void;
}

/** A device + resolution picker for a camera source (task A14). Shared by the Inspector's
 *  layer-source control, the source-bank slot editor's camera content, and a mix A/B camera
 *  input — one implementation so the three never drift. Device labels are blank until camera
 *  permission is granted (a browser rule), so a positional "Camera N" fallback is shown. */
export function CameraPicker({ deviceId, resolution, devices, onDevice, onResolution }: CameraPickerProps) {
  return (
    <div className="camera-picker">
      <Select
        className="camera-device-select"
        ariaLabel="Camera device"
        value={deviceId ?? ""}
        options={[
          { value: "", label: "Default camera" },
          ...devices.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` })),
          // A configured deviceId not in the enumerated list (list empty pre-permission, or
          // a rotated id) would make the controlled <select> silently show "Default camera"
          // and misrepresent the live config — keep it as its own option instead.
          ...(deviceId && !devices.some((d) => d.deviceId === deviceId)
            ? [{ value: deviceId, label: "Configured camera (not detected)" }]
            : []),
        ]}
        onChange={(v) => onDevice(v || undefined)}
      />
      <Select
        className="camera-res-select"
        ariaLabel="Camera resolution"
        value={resolutionKey(resolution)}
        options={CAMERA_RESOLUTIONS.map((r) => ({ value: r.value, label: r.label }))}
        onChange={(v) => onResolution(resolutionFromKey(v))}
      />
    </div>
  );
}
