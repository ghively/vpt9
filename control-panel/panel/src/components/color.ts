/** Formats a normalized (0..1) RGB triple as a `#rrggbb` hex string, for `<input
 *  type="color">` controls. Shared by LayerStrip/LayerStack/Inspector's color-source
 *  swatches and thumbnails. */
export function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Inverse of `rgbToHex`: parses a `#rrggbb` string into a normalized (0..1) RGB triple,
 *  for reading back an `<input type="color">` value. */
export function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}
