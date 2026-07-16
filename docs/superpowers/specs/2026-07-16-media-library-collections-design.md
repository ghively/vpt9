# Media Library Collections — design (2026-07-16)

Owner request: the media panel is "a free for all" — rework it into an actual library
with collections. Decisions made interactively with the owner (all "recommended" options
chosen): tag-backed storage, folders-first browsing, collections namespaced apart from
loose tags.

## Data model — collections live in the files

- A collection is an entry `collection:<Name>` in the SAME XMP-dc:Subject keyword list
  the tags system (2026-07-16, PR #8) already reads/writes. Membership travels with the
  file; re-uploading a file anywhere rebuilds its collections. One item may belong to
  several collections.
- `state.json`'s `media.<id>.tags` keeps holding the FULL keyword list (loose tags +
  `collection:` entries) — it is the runtime index, files are the truth. **No server
  changes.**
- The panel derives everything: `collections = union of collection:* entries`,
  `looseTags = the rest`. `collection:` entries are hidden from every loose-tag surface
  (bin chips, inline tag editor, Show-drawer table) — and, critically, those editors
  must MERGE their loose-tag edits back with the untouched `collection:` entries rather
  than replacing the whole list.
- Name normalization: display name is everything after the first `collection:` prefix,
  trimmed; comparisons case-insensitive, first-typed spelling kept (same as tags).
- Generator story: `exiftool -XMP-dc:Subject="collection:Space" …` files media straight
  into a collection at upload.

## Panel UI — folders-first (components/deck/MediaBin.tsx rework)

- Default view: folder list — **All** (n), **Untagged** (items with zero collections),
  then collections A–Z with count + cover thumbnail (first item by current sort), and a
  `+ new collection` button (inline name input).
- Click a folder → the existing thumbnail grid scoped to it, with breadcrumb
  `‹ <Name> (n)` back to folders. Toolbar (search / kind chips / sort) and loose-tag
  chips operate INSIDE the folder. The folder view's search box searches ALL media
  (flat results grid with the same breadcrumb-back affordance).
- Membership editing:
  - drag a thumbnail onto a folder row (folder list is a drop target);
  - context menu → **Add to collection ▸** (existing collections + `New…`);
  - inside a folder, context menu → **Remove from this collection**;
  - uploads / imports / pasted links started while inside a folder are auto-added to it
    (`X-Media-Tags: collection:<Name>` on upload; import URLs get the tag applied after
    the create broadcast lands); otherwise they land Untagged.
- Empty collections are derived, so they'd vanish: a freshly created folder is kept in a
  transient localStorage list until it gains a member (then the file record owns it).
- View state (which folder is open) is localStorage-persisted like the existing
  sort/kind view; the transient search stays transient.

## Unchanged

Drag-to-layer/slot/stage, thumbnails, upload/import plumbing, the render clients
(`collection:` entries are just tags they ignore), the Show drawer's Media table
(except hiding `collection:` entries from its tag inputs).

## Verification

- Panel `tsc --noEmit` + `eslint` clean.
- New e2e spec: create a collection, add media (context menu path), folder counts
  correct, drill-in scoping correct, `collection:` entry round-trips through the
  server's XMP write-back, loose-tag editing preserves collection entries.
- Live verify on gh-nvidia after converge.
