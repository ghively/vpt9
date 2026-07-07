// Single source of truth for the upload allowlist. Extension (lowercase, no dot) -> how
// the file is treated. Adding a format later is a one-line edit here (see the spec's
// "the allowlist is a plain array in one place" non-goal note).
export const MEDIA_TYPES = {
  mp4: { kind: "video", contentType: "video/mp4" },
  gif: { kind: "gif", contentType: "image/gif" },
  jpg: { kind: "image", contentType: "image/jpeg" },
  jpeg: { kind: "image", contentType: "image/jpeg" },
};

// Filenames are ALWAYS server-generated (media-<token>.<ext>); validate before any fs
// touch so a hand-crafted GET/DELETE can never walk out of MEDIA_DIR (defense in depth —
// ids are server-generated, so this should never reject a legitimate request).
export const SAFE_FILENAME = /^media-[A-Za-z0-9_-]+\.(mp4|gif|jpe?g)$/;

export function extOf(name) {
  const dot = String(name).lastIndexOf(".");
  return dot < 0 ? "" : String(name).slice(dot + 1).toLowerCase();
}

export function mediaTypeForName(name) {
  return MEDIA_TYPES[extOf(name)] ?? null;
}
