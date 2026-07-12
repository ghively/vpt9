import type { SourceBankSlot } from "./types";

/** Every slot except `excludeId`, narrowed to just the id/name an A/B mix picker needs.
 *  Shared by `SourceBankPanel` and `SlotGrid` — both build a `SourceBankSlotEditor`'s
 *  `otherSlots` prop from the same full slot list. */
export function otherSlotOptions(slots: SourceBankSlot[], excludeId: string): { id: string; name: string }[] {
  return slots.filter((s) => s.id !== excludeId).map((s) => ({ id: s.id, name: s.name }));
}
