import type { CameraResolution } from "./types";

/** The resolution presets offered by the camera resolution picker (task A14). `resolution:
 *  null` = "Default" (let the browser choose); the rest become `getUserMedia` width/height
 *  `ideal` constraints in the render-client. Kept as a plain list in one place, mirroring
 *  the media allowlist convention. */
export const CAMERA_RESOLUTIONS: { value: string; label: string; resolution: CameraResolution | null }[] = [
  { value: "", label: "Default", resolution: null },
  { value: "640x480", label: "640 × 480", resolution: { width: 640, height: 480 } },
  { value: "1280x720", label: "1280 × 720", resolution: { width: 1280, height: 720 } },
  { value: "1920x1080", label: "1920 × 1080", resolution: { width: 1920, height: 1080 } },
];

/** The Select value that round-trips a resolution: "WxH", or "" for Default. */
export function resolutionKey(r: CameraResolution | null | undefined): string {
  return r && r.width ? `${r.width}x${r.height}` : "";
}

/** Maps a resolution Select value back to a `CameraResolution` (or null for Default). */
export function resolutionFromKey(value: string): CameraResolution | null {
  return CAMERA_RESOLUTIONS.find((r) => r.value === value)?.resolution ?? null;
}
