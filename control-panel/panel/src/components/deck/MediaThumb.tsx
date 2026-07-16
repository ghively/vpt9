import { memo } from "react";
import type { MediaItem } from "../types";

/** A poster thumbnail for a library item. Uses the server's `…/thumb` endpoint — a small
 *  (<=320px) JPEG the server extracts once with ffmpeg — instead of the FULL-resolution
 *  source file (which is why the bin used to take forever: every cell downloaded and
 *  decoded a multi-MB gif/mp4). Static `<img>` for every kind; `loading="lazy"` so
 *  off-screen cells don't fetch, `decoding="async"` keeps decode off the main thread.
 *  Shared by the MediaBin, layer rows, and source-bank slots.
 *
 *  `live` (bin cells only) swaps a GIF's poster for the real animated file while the cell
 *  is hovered (desktop) or pressed (touch), so you can browse and see any clip move
 *  without the whole grid animating 80 gifs at once. The full file is cached immutably,
 *  so a second hover is instant. Non-gifs and un-hovered cells stay the static poster.
 *
 *  If the server can't make a thumb (no ffmpeg / odd file) the endpoint 302-redirects to
 *  the source file, so this still shows something. */
export const MediaThumb = memo(function MediaThumb({
  item,
  mediaBase,
  className,
  live = false,
}: {
  item: MediaItem;
  mediaBase: string;
  className?: string;
  live?: boolean;
}) {
  const poster = `${mediaBase}/media/${item.filename}/thumb`;
  const animated = live && item.kind === "gif";
  const src = animated ? `${mediaBase}/media/${item.filename}` : poster;
  const cls = className ? `media-thumb ${className}` : "media-thumb";
  // `key` forces a fresh <img> on the poster↔full swap so the browser restarts the gif
  // from frame 0 each hover rather than showing a stale decoded frame.
  return <img key={animated ? "live" : "poster"} className={cls} src={src} alt="" draggable={false} aria-hidden="true" loading="lazy" decoding="async" />;
});
