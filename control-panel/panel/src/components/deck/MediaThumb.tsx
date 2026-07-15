import type { MediaItem } from "../types";

/** A real content thumbnail for a library item: images and gifs render themselves, a
 *  video shows its first decoded frame (`preload="metadata"` — no playback, no audio).
 *  Shared by the MediaBin, the layer rows, and the source-bank slots so "what is this?"
 *  is answered by looking, not by reading an id. */
export function MediaThumb({ item, mediaBase, className }: { item: MediaItem; mediaBase: string; className?: string }) {
  const url = `${mediaBase}/media/${item.filename}`;
  const cls = className ? `media-thumb ${className}` : "media-thumb";
  if (item.kind === "video") {
    return <video className={cls} src={url} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" />;
  }
  return <img className={cls} src={url} alt="" draggable={false} aria-hidden="true" />;
}
