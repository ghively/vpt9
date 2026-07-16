import type { MediaItem } from "./types";

// Collections (owner request 2026-07-16, spec: docs/superpowers/specs/
// 2026-07-16-media-library-collections-design.md): a collection is a NAMESPACED entry
// `collection:<Name>` inside the same XMP-backed keyword list loose tags live in
// (media.<id>.tags). Membership therefore travels with the file — nothing here talks
// to the server beyond the existing tags write path. This module is the single place
// that knows the prefix convention; every UI surface derives from these helpers.

export const COLLECTION_PREFIX = "collection:";

export function isCollectionTag(tag: string): boolean {
  return tag.toLowerCase().startsWith(COLLECTION_PREFIX);
}

/** Display name of a collection entry ("collection:Space" -> "Space"). */
export function collectionName(tag: string): string {
  return tag.slice(COLLECTION_PREFIX.length).trim();
}

/** The stored form of a collection name ("Space" -> "collection:Space"). */
export function collectionTag(name: string): string {
  return `${COLLECTION_PREFIX}${name.trim()}`;
}

/** Split a full keyword list into what the UIs show: loose tags vs collection names. */
export function splitTags(tags: string[] | undefined): { loose: string[]; collections: string[] } {
  const loose: string[] = [];
  const collections: string[] = [];
  for (const t of tags ?? []) {
    if (isCollectionTag(t)) {
      const name = collectionName(t);
      if (name) collections.push(name);
    } else {
      loose.push(t);
    }
  }
  return { loose, collections };
}

export interface CollectionSummary {
  /** First-typed spelling (comparisons are case-insensitive). */
  name: string;
  count: number;
  /** First member under the caller's ordering — the folder's cover thumbnail. */
  cover: MediaItem | null;
}

/** Every collection present across the library, A–Z, with counts + cover. `pending`
 *  adds freshly created (still empty) folders the files don't know about yet. */
export function deriveCollections(media: MediaItem[], pending: string[] = []): CollectionSummary[] {
  const byKey = new Map<string, CollectionSummary>();
  for (const item of media) {
    for (const name of splitTags(item.tags).collections) {
      const key = name.toLowerCase();
      const existing = byKey.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        byKey.set(key, { name, count: 1, cover: item });
      }
    }
  }
  for (const name of pending) {
    const key = name.trim().toLowerCase();
    if (key && !byKey.has(key)) byKey.set(key, { name: name.trim(), count: 0, cover: null });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** True when the item belongs to the named collection (case-insensitive). */
export function inCollection(item: MediaItem, name: string): boolean {
  const key = name.trim().toLowerCase();
  return splitTags(item.tags).collections.some((c) => c.toLowerCase() === key);
}

/** New full keyword list with the item added to a collection (no-op if present). */
export function addToCollection(tags: string[] | undefined, name: string): string[] {
  const clean = name.trim();
  const current = tags ?? [];
  if (!clean) return [...current];
  const key = clean.toLowerCase();
  if (current.some((t) => isCollectionTag(t) && collectionName(t).toLowerCase() === key)) return [...current];
  return [...current, collectionTag(clean)];
}

/** New full keyword list with the item removed from a collection. */
export function removeFromCollection(tags: string[] | undefined, name: string): string[] {
  const key = name.trim().toLowerCase();
  return (tags ?? []).filter((t) => !(isCollectionTag(t) && collectionName(t).toLowerCase() === key));
}

/** Replace ONLY the loose tags, preserving collection entries — what the inline tag
 *  editor and the Show-drawer table must do so editing keywords never ejects an item
 *  from its collections. Any `collection:`-prefixed keyword typed into the loose editor is
 *  dropped (collections are managed via folders/menu, not by typing the raw prefix), so the
 *  loose editor can never silently add/keep a collection membership. */
export function withLooseTags(tags: string[] | undefined, loose: string[]): string[] {
  return [...loose.filter((t) => !isCollectionTag(t)), ...(tags ?? []).filter(isCollectionTag)];
}
