/** Arrow-key nudge semantics for on-stage points (warp handles, polygon mask vertices) —
 *  the MadMapper/Resolume precision pattern: drag for coarse placement, tap a point to
 *  select it, then arrow-key it into exact registration. Steps are in the stage's
 *  normalized 0..1 space: the fine step is ~1px at the 1280×720 internal render size,
 *  Shift is a 10px-ish coarse step. */
export const NUDGE_FINE = 1 / 1280;
export const NUDGE_COARSE = 10 / 1280;

/** Maps an arrow-key event to a normalized {dx, dy} delta, or null for any other key.
 *  Callers still decide focus/guard rules (don't nudge while typing in an input). */
export function arrowNudge(event: KeyboardEvent): { dx: number; dy: number } | null {
  const step = event.shiftKey ? NUDGE_COARSE : NUDGE_FINE;
  switch (event.key) {
    case "ArrowLeft":
      return { dx: -step, dy: 0 };
    case "ArrowRight":
      return { dx: step, dy: 0 };
    case "ArrowUp":
      return { dx: 0, dy: -step };
    case "ArrowDown":
      return { dx: 0, dy: step };
    default:
      return null;
  }
}

/** True when the event originated in a form control the arrows should keep operating
 *  (text caret movement, select cycling) — shared guard for every stage-nudge listener.
 *  Deliberately does NOT include `button`: arrow/Delete keys carry no native behavior on a
 *  plain button, so a focused mode chip (Warp/Mask/FX, a <button>) has no reason to suppress
 *  a stage point's arrow-nudge / Delete. Current Chromium blurs a focused button to <body>
 *  when a non-focusable stage handle is tapped, so this rarely bites in practice — but a
 *  browser that RETAINS button focus would drop the nudge, and the guard is documented as
 *  covering only controls with real native arrow behavior, which a button isn't. */
export function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  return !!target?.closest("input, textarea, select, [contenteditable='true']");
}
