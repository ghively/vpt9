import { useRef, useState, type DragEvent } from "react";
import { MediaThumb } from "./MediaThumb";
import { useContextMenu } from "./ContextMenu";
import { setMediaDrag } from "./dnd";
import type { MediaItem } from "../types";

export interface MediaBinProps {
  media: MediaItem[];
  /** HTTP origin the library files are served from (thumbnails + uploads). */
  mediaBase: string;
  /** POST endpoint for uploads (`${mediaBase}/api/media`). */
  uploadUrl: string;
  /** Double-click an item = put it on the currently selected layer (the pointer-only
   *  complement to dragging it onto a specific layer/slot/stage region). */
  onUseOnSelected?: (item: MediaItem) => void;
  /** Context menu "Delete from library" — removes the file server-side (layers/slots
   *  referencing it are swept to safe fallbacks by the server). */
  onRemove?: (id: string) => void;
  /** Import-by-link: a pasted/typed URL the SERVER downloads into the library (direct
   *  media files immediately; YouTube & co. via yt-dlp). Also fired by App's global
   *  paste handler — this field is the discoverable path. */
  onImportUrl?: (url: string) => void;
  /** In-flight/failed imports (from mediaImportStatus relays), rendered as status cells
   *  in the grid until the finished item's create broadcast replaces them. */
  imports?: Array<{ url: string; status: string; error?: string }>;
  /** Clicking a failed import's cell dismisses it. */
  onDismissImport?: (url: string) => void;
}

/** The visual media bin (MadMapper's Media Panel / Resolume's file browser, sized for
 *  the rail): every library item as a REAL thumbnail, draggable onto a layer row, a
 *  source-bank slot, or the stage itself. Files can be dropped straight onto the bin
 *  (or picked via + add) to upload. Renaming/deleting stays in the Show drawer's Media
 *  tab — the bin is the fast path, not the manager. */
export function MediaBin({ media, mediaBase, uploadUrl, onUseOnSelected, onRemove, onImportUrl, imports = [], onDismissImport }: MediaBinProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropArmed, setDropArmed] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const ctx = useContextMenu();

  const submitLink = () => {
    const url = linkDraft.trim();
    if (!url) return;
    onImportUrl?.(url);
    setLinkDraft("");
  };

  const upload = async (files: FileList | File[]) => {
    setError(null);
    for (const file of Array.from(files)) {
      setUploading(file.name);
      try {
        const res = await fetch(uploadUrl, { method: "POST", headers: { "X-File-Name": file.name }, body: file });
        if (!res.ok) {
          let msg = `upload failed (${res.status})`;
          try {
            msg = (await res.json()).error || msg;
          } catch {
            /* keep default */
          }
          setError(msg);
        }
      } catch {
        setError("upload failed (network error)");
      }
    }
    setUploading(null);
  };

  const onDrop = (e: DragEvent) => {
    // Only OS file drags upload; library-item drags passing over the bin are ignored.
    if (!e.dataTransfer.files?.length) return;
    e.preventDefault();
    setDropArmed(false);
    void upload(e.dataTransfer.files);
  };

  return (
    <div
      className="media-bin"
      data-drop={dropArmed}
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes("Files")) {
          e.preventDefault();
          setDropArmed(true);
        }
      }}
      onDragLeave={() => setDropArmed(false)}
      onDrop={onDrop}
    >
      <div className="sec-head label">
        Media
        <span className="count mono">{media.length}</span>
      </div>
      <div className="media-bin__grid">
        {media.map((item) => (
          <div
            key={item.id}
            className="media-cell"
            title={`${item.name} — drag onto a layer, slot, or the stage · double-click = use on selected layer`}
            draggable
            onDragStart={(e) => setMediaDrag(e, item)}
            onDoubleClick={() => onUseOnSelected?.(item)}
            onContextMenu={(e) =>
              ctx.open(e, [
                ...(onUseOnSelected ? [{ label: "Use on selected layer", onSelect: () => onUseOnSelected(item) }] : []),
                ...(onRemove
                  ? ["separator" as const, { label: "Delete from library", danger: true, onSelect: () => onRemove(item.id) }]
                  : []),
              ])
            }
          >
            <MediaThumb item={item} mediaBase={mediaBase} />
            <span className="media-cell__name">{item.name}</span>
            <span className="media-cell__kind mono">{item.kind}</span>
          </div>
        ))}
        {imports.map((imp) => (
          <div
            key={imp.url}
            className="media-cell media-cell--import"
            data-error={imp.status === "error" || undefined}
            title={imp.status === "error" ? `${imp.error ?? "import failed"} — click to dismiss` : imp.url}
            onClick={() => {
              if (imp.status === "error") onDismissImport?.(imp.url);
            }}
          >
            <span className="media-cell__import mono">
              {imp.status === "error" ? (imp.error ?? "import failed") : "importing…"}
            </span>
            <span className="media-cell__name">{imp.url.replace(/^https?:\/\//, "")}</span>
          </div>
        ))}
        {media.length === 0 && imports.length === 0 && !uploading && (
          <div className="media-bin__empty mono">drop video / gif / jpg files here, + add, or paste a link</div>
        )}
      </div>
      <div className="media-bin__foot">
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,image/gif,image/jpeg"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files);
            e.target.value = "";
          }}
        />
        <button type="button" className="addbtn media-bin__add" disabled={uploading != null} onClick={() => fileRef.current?.click()}>
          {uploading ? `Uploading ${uploading}…` : "+ Add media"}
        </button>
        {onImportUrl && (
          <input
            type="text"
            className="media-bin__link"
            placeholder="paste a link — YouTube, .mp4, .gif…"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitLink();
            }}
            onPaste={(e) => {
              // Pasting straight into the field imports immediately — no Enter needed.
              const text = e.clipboardData.getData("text").trim();
              if (/^https?:\/\/\S+$/i.test(text)) {
                e.preventDefault();
                onImportUrl(text);
                setLinkDraft("");
              }
            }}
          />
        )}
        {error && <span className="media-bin__error mono">{error}</span>}
      </div>
      {ctx.menu}
    </div>
  );
}
