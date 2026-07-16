// Live-camera helpers shared by layers.js (a layer's direct camera source) and
// source-bank.js (a camera-type slot, or a mix A/B camera input) — VPT8's cam1/cam2,
// plus the device picker + resolution constraint added in task A14. Kept in one place so
// both consumers acquire cameras identically; GLSL strings can't be ES exports, but plain
// JS helpers like these can, so unlike the blend-mode tables these need no hand-mirroring.

// Builds a getUserMedia({ video, audio: false }) constraint from a camera ref's optional
// deviceId + resolution. With neither set, `video: true` grabs the system default camera
// at its default resolution (the pre-A14 behavior). `deviceId: { exact }` pins a specific
// device; width/height are `ideal` (soft) so a camera that can't hit the exact size still
// opens at its nearest instead of failing outright.
export function cameraConstraints(deviceId, resolution) {
  const video = {};
  if (deviceId) video.deviceId = { exact: deviceId };
  if (resolution && resolution.width) video.width = { ideal: resolution.width };
  if (resolution && resolution.height) video.height = { ideal: resolution.height };
  return { video: Object.keys(video).length ? video : true, audio: false };
}

// A stable identity signature for a camera ref: the source re-acquires getUserMedia only
// when this string changes (a different device or resolution), never every frame. Also
// distinguishes a camera entry from a media ("<origin>/media/<file>") or color ("color:…")
// entry sharing the same decoder cache.
export function cameraKey(deviceId, resolution) {
  // Encode height even when width is absent: cameraConstraints applies a `height:{ideal}`
  // whenever either dimension is set, so keying only on width would give {height:1080} and
  // {height:720} the SAME key — a height-only resolution change would then never re-acquire
  // (both layers.js and source-bank.js gate re-acquisition on this key being unchanged).
  const w = resolution?.width || "";
  const h = resolution?.height || "";
  const res = w || h ? `${w}x${h}` : "";
  return `camera:${deviceId || ""}:${res}`;
}
