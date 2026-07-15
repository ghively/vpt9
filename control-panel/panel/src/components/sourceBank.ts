import type { SourceBankSlot } from "./types";

/** Every slot except `excludeId` — and except slots holding a MIX — narrowed to just the
 *  id/name an A/B mix picker needs. Shared by `SourceBankPanel` and `SlotGrid`.
 *
 *  Mix-holding slots are filtered out because the server's mix-cycle guard
 *  (server/src/state.js wouldCreateMixCycle) refuses any mix input that resolves to
 *  another mix — offering one here produced a phantom pick: the panel's optimistic echo
 *  showed it selected while the server silently rejected the write and the wall never
 *  changed. */
export function otherSlotOptions(slots: SourceBankSlot[], excludeId: string): { id: string; name: string }[] {
  return slots
    .filter((s) => s.id !== excludeId && s.content?.type !== "mix")
    .map((s) => ({ id: s.id, name: s.name }));
}
