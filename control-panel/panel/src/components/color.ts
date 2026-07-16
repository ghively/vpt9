/** Formats a normalized (0..1) RGB triple as a `#rrggbb` hex string, for `<input
 *  type="color">` controls. Shared by LayerStrip/LayerStack/Inspector's color-source
 *  swatches and thumbnails. */
export function rgbToHex(rgb: [number, number, number]): string {
  // Defensive: the server does not validate a slot/color's shape, so a malformed color
  // (a number/string/object instead of an [r,g,b] array) can reach here — destructuring a
  // non-iterable used to throw and take down the whole SlotGrid/Inspector render. Fall
  // back to mid-grey instead of crashing.
  const [r, g, b] = Array.isArray(rgb) ? rgb : [0.5, 0.5, 0.5];
  const h = (v: number) => Math.round((typeof v === "number" ? v : 0.5) * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Inverse of `rgbToHex`: parses a `#rrggbb` string into a normalized (0..1) RGB triple,
 *  for reading back an `<input type="color">` value. */
export function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}
