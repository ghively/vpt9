// Tags are edited as one comma-separated line (MediaLibrary rows, the media bin's inline
// editor); parse tolerantly (trim, drop empties, dedupe case-insensitively but keep the
// first spelling typed). Own module so component files keep exporting only components
// (react-refresh constraint).
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(",")) {
    const tag = part.trim();
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}
