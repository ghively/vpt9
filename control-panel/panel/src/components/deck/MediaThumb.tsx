import { memo } from "react";
import type { MediaItem } from "../types";

/** A poster thumbnail for a library item. Uses the server's `…/thumb` endpoint — a small
 *  (<=320px) JPEG the server extracts once with ffmpeg — instead of the FULL-resolution
 *  source file (which is why the bin used to take forever: every cell downloaded and
 *  decoded a multi-MB gif/mp4). Static `<img>` for every kind; `loading="lazy"` so
 *  off-screen cells don't fetch, `decoding="async"` keeps decode off the main thread.
 *  Shared by the MediaBin, layer rows, and source-bank slots. Memoized so an unrelated
 *  panel re-render doesn't reconcile (and potentially reload) every thumbnail.
 *
 *  If the server can't make a thumb (no ffmpeg / odd file) the endpoint 302-redirects to
 *  the source file, so this still shows something. */
export const MediaThumb = memo(function MediaThumb({ item, mediaBase, className }: { item: MediaItem; mediaBase: string; className?: string }) {
  const url = `${mediaBase}/media/${item.filename}/thumb`;
  const cls = className ? `media-thumb ${className}` : "media-thumb";
  return <img className={cls} src={url} alt="" draggable={false} aria-hidden="true" loading="lazy" decoding="async" />;
});
