import { useMemo, useRef, useState, type DragEvent } from "react";
import { MediaThumb } from "./MediaThumb";
import { useContextMenu } from "./ContextMenu";
import { setMediaDrag, hasMediaDrag, getMediaDrag } from "./dnd";
import { Chip } from "../primitives/Chip";
import { Select } from "../primitives/Select";
import { parseTags } from "../tags";
import { splitTags, deriveCollections, inCollection, addToCollection, removeFromCollection, withLooseTags, collectionTag } from "../collections";
import type { MediaItem, MediaKind } from "../types";

/* ---- bin view (folder + sort + kind filter + name search) ----------------------
 * Purely client-side organization of the library — nothing here touches shared state
 * except tag writes (collection membership IS a tag, see components/collections.ts),
 * so two operators can browse their own bins independently. Folder, sort and kind
 * persist across reloads (localStorage); the search box is transient on purpose (a
 * leftover query silently hiding the whole library across a reload would read as
 * "my media is gone" mid-show). */
type MediaSort = "newest" | "oldest" | "name" | "kind" | "largest";
type KindFilter = "all" | MediaKind;
/** Which folder is open: null = the folder list, "*all" / "*untagged" = the special
 *  folders, "c:<Name>" = a collection. */
type FolderId = null | string;

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
const PENDING_COLLECTIONS_KEY = "vpt.media-bin.pending-collections";

function loadView(): { sort: MediaSort; kind: KindFilter; folder: FolderId } {
  try {
    const parsed = JSON.parse(localStorage.getItem(VIEW_STORAGE_KEY) ?? "") as { sort?: string; kind?: string; folder?: unknown };
    return {
      sort: SORT_OPTIONS.some((o) => o.value === parsed.sort) ? (parsed.sort as MediaSort) : "newest",
      kind: KIND_FILTERS.includes(parsed.kind as KindFilter) ? (parsed.kind as KindFilter) : "all",
      folder: typeof parsed.folder === "string" ? parsed.folder : null,
    };
  } catch {
    return { sort: "newest", kind: "all", folder: null };
  }
}

// Freshly created, still-empty collections: derived folders vanish at zero members, so
// a new folder lives here until its first item's file record takes over.
function loadPending(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(PENDING_COLLECTIONS_KEY) ?? "");
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "string") : [];
  } catch {
    return [];
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
  /** Tag writes (loose-tag edits AND collection membership — a collection is a
   *  namespaced tag). Commits the item's full keyword list to media.<id>.tags. */
  onSetTags?: (id: string, tags: string[]) => void;
  /** Import-by-link: a pasted/typed URL the SERVER downloads into the library (direct
   *  media files immediately; YouTube & co. via yt-dlp). `collection` files the finished
   *  import into a collection (imports started inside a folder land in that folder). */
  onImportUrl?: (url: string, collection?: string) => void;
  /** In-flight/failed imports (from mediaImportStatus relays), rendered as status cells
   *  in the grid until the finished item's create broadcast replaces them. */
  imports?: Array<{ url: string; status: string; error?: string }>;
  /** Clicking a failed import's cell dismisses it. */
  onDismissImport?: (url: string) => void;
}

/** The media library (owner redesign 2026-07-16, spec: docs/superpowers/specs/
 *  2026-07-16-media-library-collections-design.md): folders-first. Opens to a list of
 *  collection folders (All / Untagged / each collection with count + cover); click in
 *  for the thumbnail grid scoped to that folder, with the toolbar (search, kind, sort)
 *  and loose-tag chips operating inside it. Membership = `collection:<Name>` entries in
 *  the item's own keyword list, so it travels with the files. Items are draggable onto
 *  a layer row, a source-bank slot, the stage — or onto a folder row to file them. */
export function MediaBin({ media, mediaBase, uploadUrl, onUseOnSelected, onRemove, onSetTags, onImportUrl, imports = [], onDismissImport }: MediaBinProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropArmed, setDropArmed] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [view, setView] = useState(loadView);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string[]>(loadPending);
  // Which folder row a library-item drag is hovering (visual affordance only).
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  // Inline editors: creating a collection (folder view) / editing an item's loose tags.
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  // Tag filter: transient like the search box (tags come and go with library edits;
  // a persisted stale tag would silently blank the bin across a reload).
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const ctx = useContextMenu();

  const collections = useMemo(() => deriveCollections(media, pending), [media, pending]);
  const untaggedCount = useMemo(() => media.filter((m) => splitTags(m.tags).collections.length === 0).length, [media]);

  const saveView = (next: { sort: MediaSort; kind: KindFilter; folder: FolderId }) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full/blocked — the view still applies for this session */
    }
  };
  const savePending = (names: string[]) => {
    setPending(names);
    try {
      localStorage.setItem(PENDING_COLLECTIONS_KEY, JSON.stringify(names));
    } catch {
      /* storage full/blocked */
    }
  };

  // Resolve the open folder; a persisted collection that no longer exists (last member
  // deleted elsewhere) falls back to the folder list instead of an empty dead end.
  const openCollection =
    view.folder?.startsWith("c:") && collections.some((c) => c.name.toLowerCase() === view.folder!.slice(2).toLowerCase())
      ? collections.find((c) => c.name.toLowerCase() === view.folder!.slice(2).toLowerCase())!.name
      : null;
  const folder: FolderId = view.folder === "*all" || view.folder === "*untagged" ? view.folder : openCollection ? `c:${openCollection}` : null;
  const searchingAll = folder === null && query.trim() !== "";
  const showFolderList = folder === null && !searchingAll;

  // The grid's base scope (before kind/search/tag-chip filters).
  const scope = useMemo(() => {
    if (folder === "*untagged") return media.filter((m) => splitTags(m.tags).collections.length === 0);
    if (openCollection) return media.filter((m) => inCollection(m, openCollection));
    return media; // "*all" or a global search
  }, [media, folder, openCollection]);

  // Union of every LOOSE tag in scope (collection entries render as folders, never as
  // chips), alphabetical, case-insensitive, first spelling kept.
  const looseTags = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of scope) for (const t of splitTags(m.tags).loose) if (!seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [scope]);
  const activeTag = tagFilter && looseTags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()) ? tagFilter : null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tag = activeTag?.toLowerCase() ?? null;
    return scope
      .filter(
        (m) =>
          (view.kind === "all" || m.kind === view.kind) &&
          (!tag || splitTags(m.tags).loose.some((t) => t.toLowerCase() === tag)) &&
          (!q || m.name.toLowerCase().includes(q)),
      )
      .sort(SORTERS[view.sort]);
  }, [scope, view, query, activeTag]);
  const filtered = visible.length !== scope.length;

  const enterFolder = (id: FolderId) => {
    setQuery("");
    setTagFilter(null);
    saveView({ ...view, folder: id });
  };

  const createCollection = (rawName: string) => {
    const name = rawName.trim();
    setCreatingCollection(false);
    if (!name || name.toLowerCase().startsWith("collection:")) return;
    if (!collections.some((c) => c.name.toLowerCase() === name.toLowerCase())) savePending([...pending, name]);
    enterFolder(`c:${name}`);
  };

  const addItemToCollection = (item: MediaItem, name: string) => {
    onSetTags?.(item.id, addToCollection(item.tags, name));
    // The file record owns the folder from here on.
    if (pending.some((p) => p.toLowerCase() === name.toLowerCase())) {
      savePending(pending.filter((p) => p.toLowerCase() !== name.toLowerCase()));
    }
  };

  const submitLink = () => {
    const url = linkDraft.trim();
    if (!url) return;
    onImportUrl?.(url, openCollection ?? undefined);
    setLinkDraft("");
  };

  const upload = async (files: FileList | File[]) => {
    setError(null);
    for (const file of Array.from(files)) {
      setUploading(file.name);
      try {
        // Uploading while inside a collection files the new item into it — membership
        // is a tag, and X-Media-Tags both seeds the entry and embeds into the file.
        const headers: Record<string, string> = { "X-File-Name": file.name };
        if (openCollection) headers["X-Media-Tags"] = collectionTag(openCollection);
        const res = await fetch(uploadUrl, { method: "POST", headers, body: file });
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

  // A folder row accepts library-item drags: drop = file the item into that collection.
  const folderDropProps = (name: string) => ({
    onDragOver: (e: DragEvent) => {
      if (!hasMediaDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setDragOverFolder(name);
    },
    onDragLeave: () => setDragOverFolder((cur) => (cur === name ? null : cur)),
    onDrop: (e: DragEvent) => {
      const payload = getMediaDrag(e);
      setDragOverFolder(null);
      if (!payload) return;
      e.preventDefault();
      e.stopPropagation();
      const item = media.find((m) => m.id === payload.mediaId);
      if (item) addItemToCollection(item, name);
    },
  });

  const cellMenu = (item: MediaItem) => [
    ...(onUseOnSelected ? [{ label: "Use on selected layer", onSelect: () => onUseOnSelected(item) }] : []),
    ...(onSetTags ? [{ label: "Edit tags…", onSelect: () => setEditingTagsId(item.id) }] : []),
    ...(onSetTags
      ? collections
          .filter((c) => !inCollection(item, c.name))
          .map((c) => ({ label: `Add to ${c.name}`, onSelect: () => addItemToCollection(item, c.name) }))
      : []),
    ...(onSetTags && openCollection && inCollection(item, openCollection)
      ? [{ label: `Remove from ${openCollection}`, onSelect: () => onSetTags(item.id, removeFromCollection(item.tags, openCollection)) }]
      : []),
    ...(onRemove ? ["separator" as const, { label: "Delete from library", danger: true, onSelect: () => onRemove(item.id) }] : []),
  ];

  const folderTitle = folder === "*all" ? "All" : folder === "*untagged" ? "Untagged" : openCollection ?? "results";

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
        <span className="count mono">{showFolderList ? media.length : filtered ? `${visible.length}/${scope.length}` : scope.length}</span>
      </div>

      {/* Search lives above both views: on the folder list it searches EVERYTHING (the
          grid opens flat across the library); inside a folder it narrows that folder. */}
      {media.length > 0 && (
        <div className="media-bin__view">
          <div className="media-bin__tools">
            {!showFolderList && (
              <button
                type="button"
                className="media-bin__back mono"
                title="Back to collections"
                onClick={() => enterFolder(null)}
              >
                ‹ {folderTitle}
              </button>
            )}
            <input
              type="search"
              className="media-bin__search"
              placeholder={showFolderList ? "search all media…" : "search…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
            />
            {!showFolderList && (
              <Select
                className="media-bin__sort"
                value={view.sort}
                options={SORT_OPTIONS}
                onChange={(sort) => saveView({ ...view, sort: sort as MediaSort })}
              />
            )}
          </div>
          {!showFolderList && (
            <div className="media-bin__filters">
              {KIND_FILTERS.map((k) => (
                <Chip
                  key={k}
                  label={k === "all" ? `all ${scope.length}` : `${k} ${scope.filter((m) => m.kind === k).length}`}
                  active={view.kind === k}
                  onClick={() => saveView({ ...view, kind: k })}
                />
              ))}
            </div>
          )}
          {!showFolderList && looseTags.length > 0 && (
            <div className="media-bin__filters media-bin__filters--tags">
              {looseTags.map((t) => (
                <Chip key={t} label={`#${t}`} active={activeTag === t} onClick={() => setTagFilter(activeTag === t ? null : t)} />
              ))}
            </div>
          )}
        </div>
      )}

      {showFolderList ? (
        <div className="media-bin__folders">
          <button type="button" className="media-folder" onClick={() => enterFolder("*all")}>
            <span className="media-folder__cover media-folder__cover--all" aria-hidden="true" />
            <span className="media-folder__name">All</span>
            <span className="media-folder__count mono">{media.length}</span>
          </button>
          {untaggedCount > 0 && (
            <button type="button" className="media-folder" onClick={() => enterFolder("*untagged")}>
              <span className="media-folder__cover" aria-hidden="true" />
              <span className="media-folder__name">Untagged</span>
              <span className="media-folder__count mono">{untaggedCount}</span>
            </button>
          )}
          {collections.map((c) => (
            <button
              type="button"
              key={c.name.toLowerCase()}
              className="media-folder"
              data-dragover={dragOverFolder === c.name || undefined}
              onClick={() => enterFolder(`c:${c.name}`)}
              {...folderDropProps(c.name)}
            >
              {c.cover ? (
                <span className="media-folder__cover">
                  <MediaThumb item={c.cover} mediaBase={mediaBase} />
                </span>
              ) : (
                <span className="media-folder__cover" aria-hidden="true" />
              )}
              <span className="media-folder__name">{c.name}</span>
              <span className="media-folder__count mono">{c.count}</span>
            </button>
          ))}
          {creatingCollection ? (
            <input
              className="media-bin__new-collection mono"
              autoFocus
              placeholder="collection name…"
              onKeyDown={(e) => {
                if (e.key === "Enter") createCollection((e.target as HTMLInputElement).value);
                if (e.key === "Escape") setCreatingCollection(false);
              }}
              onBlur={(e) => createCollection(e.target.value)}
            />
          ) : (
            <button type="button" className="addbtn media-bin__add-collection" onClick={() => setCreatingCollection(true)}>
              + new collection
            </button>
          )}
        </div>
      ) : (
        <div className="media-bin__grid">
          {visible.map((item) => (
            <div
              key={item.id}
              className="media-cell"
              title={`${item.name} — drag onto a layer, slot, or the stage · double-click = use on selected layer`}
              draggable
              onDragStart={(e) => setMediaDrag(e, item)}
              onDoubleClick={() => onUseOnSelected?.(item)}
              onContextMenu={(e) => ctx.open(e, cellMenu(item))}
            >
              <MediaThumb item={item} mediaBase={mediaBase} />
              {editingTagsId === item.id ? (
                <input
                  className="media-cell__tags-input mono"
                  autoFocus
                  placeholder="tags, comma-separated…"
                  defaultValue={splitTags(item.tags).loose.join(", ")}
                  // The cell is draggable — keep pointer/drag gestures inside the input
                  // from starting a media drag while typing.
                  draggable={false}
                  onPointerDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingTagsId(null);
                  }}
                  onBlur={(e) => {
                    // Replace only the LOOSE tags — collection membership is edited via
                    // folders/menu, and a keyword edit must never eject an item from them.
                    if (editingTagsId === item.id) onSetTags?.(item.id, withLooseTags(item.tags, parseTags(e.target.value)));
                    setEditingTagsId(null);
                  }}
                />
              ) : (
                <span className="media-cell__name">{item.name}</span>
              )}
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
          {scope.length > 0 && visible.length === 0 && imports.length === 0 && (
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
          {scope.length === 0 && imports.length === 0 && !uploading && (
            <div className="media-bin__empty mono">
              {openCollection ? "empty collection — drag media here from All, or + add" : "drop video / gif / jpg files here, + add, or paste a link"}
            </div>
          )}
        </div>
      )}

      {media.length === 0 && imports.length === 0 && !uploading && (
        <div className="media-bin__empty mono">drop video / gif / jpg files here, + add, or paste a link</div>
      )}

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
          {uploading ? `Uploading ${uploading}…` : openCollection ? `+ Add to ${openCollection}` : "+ Add media"}
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
                onImportUrl(text, openCollection ?? undefined);
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
