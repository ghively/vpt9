/** Formats a normalized (0..1) RGB triple as a `#rrggbb` hex string, for `<input
 *  type="color">` controls. Shared by LayerStrip/LayerStack/Inspector's color-source
 *  swatches and thumbnails. */
export function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
