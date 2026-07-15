import type { MediaItem } from "../types";

/** Drag-and-drop payload for library media — the deck's direct-manipulation backbone
 *  (the MadMapper/Resolume pattern: see your media as thumbnails, drag it where you
 *  want it). A MediaBin item is the drag source; layer rows, source-bank slots, and
 *  the Stage itself are drop targets. Uses a custom MIME type so random text/file
 *  drags never masquerade as a media assignment. */
export const MEDIA_DRAG_TYPE = "application/x-vpt-media";

export interface MediaDragPayload {
  mediaId: string;
  filename: string;
  name: string;
  kind: string;
}

export function setMediaDrag(e: React.DragEvent, item: MediaItem) {
  const payload: MediaDragPayload = { mediaId: item.id, filename: item.filename, name: item.name, kind: item.kind };
  e.dataTransfer.setData(MEDIA_DRAG_TYPE, JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "copy";
}

export function hasMediaDrag(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes(MEDIA_DRAG_TYPE);
}

export function getMediaDrag(e: React.DragEvent): MediaDragPayload | null {
  const raw = e.dataTransfer.getData(MEDIA_DRAG_TYPE);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    return typeof p?.mediaId === "string" && typeof p?.filename === "string" ? p : null;
  } catch {
    return null;
  }
}

/** The library URL a layer/slot source stores for an item (host-independent; the
 *  render client resolves it against its own control-plane origin). */
export function mediaSourceUrl(payload: { filename: string }): string {
  return `/media/${payload.filename}`;
}
