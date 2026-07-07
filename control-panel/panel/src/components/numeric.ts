/** Parses a text field's value as a finite number, falling back when blank or NaN.
 *  Shared by LfoRack/MidiMapPanel's rate/min/max fields. */
export function parseNumberOr(value: string, fallback: number): number {
  const n = Number(value);
  return value !== "" && Number.isFinite(n) ? n : fallback;
}
