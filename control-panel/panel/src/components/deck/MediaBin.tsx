import { useMemo, useRef, useState, type DragEvent } from "react";
import { MediaThumb } from "./MediaThumb";
import { useContextMenu } from "./ContextMenu";
import { setMediaDrag } from "./dnd";
import { Chip } from "../primitives/Chip";
import { Select } from "../primitives/Select";
import type { MediaItem, MediaKind } from "../types";

/* ---- bin view (sort + kind filter + name search) -------------------------------
 * Purely client-side organization of the library grid — nothing here touches shared
 * state, so two operators can sort/filter their own bins independently. Sort and kind
 * persist across reloads (localStorage); the search box is transient on purpose (a
 * leftover query silently hiding the whole library across a reload would read as
 * "my media is gone" mid-show). */
type MediaSort = "newest" | "oldest" | "name" | "kind" | "largest";
type KindFilter = "all" | MediaKind;

const SORT_OPTIONS: Array<{ value: MediaSort; label: string }> = [
  { value: "newest", label: "newest first" },
  { value: "oldest", label: "oldest first" },
  { value: "name", label: "name A–Z" },
  { value: "kind", label: "by kind" },
  { value: "largest", label: "largest first" },
];
const KIND_FILTERS: KindFilter[] = ["all", "video", "gif", "image"];

// `|| 0` guards Date.parse(NaN) on a malformed uploadedAt — NaN comparators would
// make sort order undefined for the whole array, not just the bad item.
const byName = (a: MediaItem, b: MediaItem) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
const byNewest = (a: MediaItem, b: MediaItem) => (Date.parse(b.uploadedAt) || 0) - (Date.parse(a.uploadedAt) || 0);
const SORTERS: Record<MediaSort, (a: MediaItem, b: MediaItem) => number> = {
  newest: byNewest,
  oldest: (a, b) => byNewest(b, a),
  name: byName,
  kind: (a, b) => a.kind.localeCompare(b.kind) || byName(a, b),
  largest: (a, b) => (b.size || 0) - (a.size || 0),
};

const VIEW_STORAGE_KEY = "vpt.media-bin.view";
function loadView(): { sort: MediaSort; kind: KindFilter } {
  try {
    const parsed = JSON.parse(localStorage.getItem(VIEW_STORAGE_KEY) ?? "") as { sort?: string; kind?: string };
    return {
      sort: SORT_OPTIONS.some((o) => o.value === parsed.sort) ? (parsed.sort as MediaSort) : "newest",
      kind: KIND_FILTERS.includes(parsed.kind as KindFilter) ? (parsed.kind as KindFilter) : "all",
    };
  } catch {
    return { sort: "newest", kind: "all" };
  }
}

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
 *  (or picked via + add) to upload. A view toolbar (name search, kind chips, sort)
 *  organizes big libraries — all client-local, see the MediaSort block above.
 *  Renaming/deleting stays in the Show drawer's Media tab — the bin is the fast path,
 *  not the manager. */
export function MediaBin({ media, mediaBase, uploadUrl, onUseOnSelected, onRemove, onImportUrl, imports = [], onDismissImport }: MediaBinProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropArmed, setDropArmed] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [view, setView] = useState(loadView);
  const [query, setQuery] = useState("");
  // Tag filter: transient like the search box (tags come and go with library edits;
  // a persisted stale tag would silently blank the bin across a reload).
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const ctx = useContextMenu();

  // Union of every tag in the library, alphabetical (case-insensitive), for the filter
  // row. Tags are edited in the Show drawer's Media tab; the bin only filters by them.
  const allTags = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of media) for (const t of m.tags ?? []) if (!seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [media]);
  // A tag can disappear (last tagged item deleted/retagged) — drop a dangling filter
  // instead of showing an empty grid with no active-looking chip explaining why.
  const activeTag = tagFilter && allTags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()) ? tagFilter : null;

  const saveView = (next: { sort: MediaSort; kind: KindFilter }) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full/blocked — the view still applies for this session */
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tag = activeTag?.toLowerCase() ?? null;
    return media
      .filter(
        (m) =>
          (view.kind === "all" || m.kind === view.kind) &&
          (!tag || (m.tags ?? []).some((t) => t.toLowerCase() === tag)) &&
          (!q || m.name.toLowerCase().includes(q)),
      )
      .sort(SORTERS[view.sort]);
  }, [media, view, query, activeTag]);
  const filtered = visible.length !== media.length;

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
        <span className="count mono">{filtered ? `${visible.length}/${media.length}` : media.length}</span>
      </div>
      {media.length > 0 && (
        <div className="media-bin__view">
          <div className="media-bin__tools">
            <input
              type="search"
              className="media-bin__search"
              placeholder="search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
            />
            <Select
              className="media-bin__sort"
              value={view.sort}
              options={SORT_OPTIONS}
              onChange={(sort) => saveView({ ...view, sort: sort as MediaSort })}
            />
          </div>
          <div className="media-bin__filters">
            {KIND_FILTERS.map((k) => (
              <Chip
                key={k}
                label={k === "all" ? `all ${media.length}` : `${k} ${media.filter((m) => m.kind === k).length}`}
                active={view.kind === k}
                onClick={() => saveView({ ...view, kind: k })}
              />
            ))}
          </div>
          {allTags.length > 0 && (
            <div className="media-bin__filters media-bin__filters--tags">
              {allTags.map((t) => (
                <Chip key={t} label={`#${t}`} active={activeTag === t} onClick={() => setTagFilter(activeTag === t ? null : t)} />
              ))}
            </div>
          )}
        </div>
      )}
      <div className="media-bin__grid">
        {visible.map((item) => (
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
        {media.length > 0 && visible.length === 0 && imports.length === 0 && (
          <div className="media-bin__empty mono">
            nothing matches{" "}
            <button
              type="button"
              className="media-bin__clear"
              onClick={() => {
                setQuery("");
                setTagFilter(null);
                saveView({ ...view, kind: "all" });
              }}
            >
              clear filters
            </button>
          </div>
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
