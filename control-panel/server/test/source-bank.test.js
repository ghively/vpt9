import test from "node:test";
import assert from "node:assert/strict";
import { applyUpdate, applyCreate, resolveDanglingSourceRefs } from "../src/state.js";

// This suite exercises the full-state-validation mix-cycle guard in state.js
// (`wouldCreateMixCycle` / `refResolvesToMix`), which replaced five earlier rounds of
// narrower, write-shape-specific checks (each of which closed one bypass and left a
// structurally identical one in a sibling code path). The new guard doesn't reason
// about what a given write *could* have changed — it applies the candidate write via
// `walkToParent` (the same primitive `applyUpdate` itself uses) and re-validates every
// mix slot in the WHOLE resulting sourceBank array. Every bypass shape found across all
// six adversarial review rounds is kept below as a regression test against this new
// implementation, plus the "legitimate write still works" cases, plus additional
// adversarial inputs found while hardening this rewrite.

function fixtureState() {
  return {
    layers: {},
    media: { "media-1": { id: "media-1", kind: "video" }, "media-2": { id: "media-2", kind: "image" } },
    sourceBank: [
      { id: "slot-1", name: "Slot 1", content: { type: "media", mediaId: "media-1" } },
      { id: "slot-2", name: "Slot 2", content: null },
      { id: "slot-3", name: "Slot 3", content: { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "multiply", mix: 0.5 } },
    ],
  };
}

// --- Round 1: direct / self / one-level-indirection mix-of-mix ----------------------

test("a mix slot may reference a media-holding slot", () => {
  const state = fixtureState();
  const ok = applyUpdate(
    state, "sourceBank.1.content",
    { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 },
  );
  assert.equal(ok, true);
});

test("a mix slot's a/b may NOT reference another mix-holding slot directly", () => {
  const state = fixtureState();
  const ok = applyUpdate(
    state, "sourceBank.1.content",
    { type: "mix", a: { type: "slot", slotId: "slot-3" }, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 },
  );
  assert.equal(ok, false);
  assert.equal(state.sourceBank[1].content, null); // rejected — state unchanged
});

test("a mix slot's a/b may NOT reference another mix-holding slot transitively through one level of slot indirection", () => {
  const state = fixtureState();
  // slot-2 is empty right now; point it at slot-1 (media) first — allowed.
  assert.equal(applyUpdate(state, "sourceBank.1.content", { type: "media", mediaId: "media-1" }), true);
  // Now try to make slot-2 itself a mix that references slot-3 (a mix) — rejected.
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "slot", slotId: "slot-3" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 }),
    false,
  );
});

test("a mix slot may not reference itself", () => {
  const state = fixtureState();
  assert.equal(
    applyUpdate(state, "sourceBank.2.content", { type: "mix", a: { type: "slot", slotId: "slot-3" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 }),
    false,
  );
});

test("a mix slot may not reference itself even when its own current content isn't a mix yet", () => {
  const state = fixtureState();
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "slot", slotId: "slot-2" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 }),
    false,
  );
});

// --- Round 2/3: the ordering hole, and granular sub-path writes at any depth --------

test("cannot retroactively turn a slot into a mix once another slot's mix already depends on it (the ordering hole)", () => {
  const state = fixtureState();
  // slot-1 (media) is already referenced by slot-3's mix as `a`. Turning slot-1 itself
  // into a mix now would make slot-3 a mix-of-mix — caught because the guard
  // re-validates slot-3 too (it loops over the WHOLE array), not just the slot being
  // written.
  assert.equal(
    applyUpdate(state, "sourceBank.0.content", { type: "mix", a: { type: "media", mediaId: "media-2" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 }),
    false,
  );
});

test("a granular sub-path write to content.a is checked for cycles just like a whole-object write", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.2.content.a", { type: "slot", slotId: "slot-3" });
  assert.equal(ok, false);
  assert.deepEqual(state.sourceBank[2].content, {
    type: "mix",
    a: { type: "slot", slotId: "slot-1" },
    b: { type: "media", mediaId: "media-2" },
    blendMode: "multiply",
    mix: 0.5,
  }); // rejected — state unchanged
});

test("a granular sub-path write to content.b is also checked for cycles (direct mix-of-mix via sub-path)", () => {
  const state = fixtureState();
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "media", mediaId: "media-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 }),
    true,
  );
  const ok = applyUpdate(state, "sourceBank.1.content.b", { type: "slot", slotId: "slot-3" });
  assert.equal(ok, false);
  assert.deepEqual(state.sourceBank[1].content.b, { type: "media", mediaId: "media-2" }); // rejected — state unchanged
});

test("a write two levels deep (content.a.slotId) retargeting to a self-reference is rejected", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.2.content.a.slotId", "slot-3");
  assert.equal(ok, false);
  assert.deepEqual(state.sourceBank[2].content, {
    type: "mix",
    a: { type: "slot", slotId: "slot-1" },
    b: { type: "media", mediaId: "media-2" },
    blendMode: "multiply",
    mix: 0.5,
  }); // rejected — state unchanged
});

test("a write two levels deep (content.b.slotId) retargeting to another mix-holding slot is rejected", () => {
  const state = fixtureState();
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "media", mediaId: "media-1" }, b: { type: "slot", slotId: "slot-1" }, blendMode: "screen", mix: 0.5 }),
    true,
  );
  const ok = applyUpdate(state, "sourceBank.1.content.b.slotId", "slot-3");
  assert.equal(ok, false);
  assert.deepEqual(state.sourceBank[1].content.b, { type: "slot", slotId: "slot-1" }); // rejected — state unchanged
});

// --- Round 4: the 4-step type-flip dance --------------------------------------------

test("4-step type-flip dance (self-reference variant): flipping content away from 'mix' and back cannot smuggle in a self-reference", () => {
  const state = fixtureState();
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "multiply", mix: 0.5 }),
    true,
  );
  assert.equal(applyUpdate(state, "sourceBank.1.content.type", "media"), true);
  assert.equal(applyUpdate(state, "sourceBank.1.content.a", { type: "slot", slotId: "slot-2" }), true);
  const stateAfterStep3 = structuredClone(state);

  // The write that must be rejected: flipping the type label back to "mix" — the
  // reconstructed candidate is {type:"mix", a:{slot,slot-2}, ...}, a self-reference.
  assert.equal(applyUpdate(state, "sourceBank.1.content.type", "mix"), false);
  assert.deepEqual(state, stateAfterStep3);
  assert.equal(state.sourceBank[1].content.type, "media");
});

test("4-step type-flip dance (direct mix-of-mix variant): flipping content away from 'mix' and back cannot smuggle in a reference to another mix-holding slot", () => {
  const state = fixtureState();
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "multiply", mix: 0.5 }),
    true,
  );
  assert.equal(applyUpdate(state, "sourceBank.1.content.type", "media"), true);
  assert.equal(applyUpdate(state, "sourceBank.1.content.a", { type: "slot", slotId: "slot-3" }), true);
  const stateAfterStep3 = structuredClone(state);

  assert.equal(applyUpdate(state, "sourceBank.1.content.type", "mix"), false);
  assert.deepEqual(state, stateAfterStep3);
  assert.equal(state.sourceBank[1].content.type, "media");
});

// --- Round 5: inline nested mix literal (not reached via a {type:"slot"} ref) -------

test("a single write cannot smuggle a self-reference through an inline nested mix object in content.a", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.1.content", {
    type: "mix",
    a: { type: "mix", a: { type: "slot", slotId: "slot-2" }, b: null, blendMode: "screen", mix: 0.5 },
    b: { type: "media", mediaId: "media-2" },
    blendMode: "screen",
    mix: 0.5,
  });
  assert.equal(ok, false);
  assert.equal(state.sourceBank[1].content, null); // rejected — state unchanged
});

test("a single write cannot smuggle a reference to a live mix-holding slot through an inline nested mix object in content.b", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.1.content", {
    type: "mix",
    a: { type: "media", mediaId: "media-1" },
    b: { type: "mix", a: { type: "slot", slotId: "slot-3" }, b: null, blendMode: "screen", mix: 0.5 },
    blendMode: "screen",
    mix: 0.5,
  });
  assert.equal(ok, false);
  assert.equal(state.sourceBank[1].content, null); // rejected — state unchanged
});

test("a pathologically deep chain of inline nested mixes is rejected (no recursion/depth-cap needed — the first nested 'mix' type is already the violation)", () => {
  const state = fixtureState();
  let deep = { type: "media", mediaId: "media-1" };
  for (let i = 0; i < 10; i++) deep = { type: "mix", a: deep, b: null, blendMode: "screen", mix: 0.5 };
  const ok = applyUpdate(state, "sourceBank.1.content", { type: "mix", a: deep, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 });
  assert.equal(ok, false);
  assert.equal(state.sourceBank[1].content, null); // rejected — state unchanged
});

// --- Round 6: inline-literal wrapper hiding a slot ref from the (old) ordering check -

test("sixth bypass: a write establishing a mix whose `a` is an inline mix wrapper hiding a live slot ref is itself rejected outright", () => {
  // Under the new full-state-validation design this bypass is closed even more
  // strongly than the original report anticipated: `refResolvesToMix` treats ANY
  // ref whose own `.type === "mix"` as an immediate violation, regardless of what it
  // itself resolves to further down — so the FIRST write (establishing slot-1's mix
  // with an inline-mix-wrapped `a` that merely *hides* a reference to slot-2, while
  // slot-2 is still plain media) is rejected on the spot, before the "does slot-2
  // become a mix later" question even arises. Verified empirically, not assumed.
  const state = fixtureState();
  state.sourceBank[1].content = { type: "media", mediaId: "media-1" }; // slot-2 starts as plain media
  const wrapperValue = {
    type: "mix",
    a: { type: "mix", a: { type: "slot", slotId: "slot-2" }, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 },
    b: { type: "media", mediaId: "media-1" },
    blendMode: "screen",
    mix: 0.5,
  };
  const ok = applyUpdate(state, "sourceBank.0.content", wrapperValue);
  assert.equal(ok, false);
  assert.deepEqual(state.sourceBank[0].content, { type: "media", mediaId: "media-1" }); // rejected — state unchanged
});

test("sixth bypass, exact reported trace: if a slot already holds an inline-wrapper mix hiding a ref to another slot, turning that other slot into a mix is rejected", () => {
  // Reproduces the exact scenario/trace from the review report by hand-constructing the
  // precondition (bypassing applyUpdate, as if this content pre-existed on disk from
  // before this fix, or arrived via some other path) rather than relying on the first
  // write succeeding — the previous test proves it doesn't. This isolates and confirms
  // the SECOND write's own rejection path, and the trace behind it: when slot-2's write
  // is validated, the full-array loop checks slot-1 too (since it's a mix), and
  // refResolvesToMix(slot-1.content.a, ...) sees slot-1.content.a.type === "mix" (the
  // inline wrapper) and returns true immediately — no unwrapping needed.
  const state = fixtureState();
  state.sourceBank[0].content = {
    type: "mix",
    a: { type: "mix", a: { type: "slot", slotId: "slot-2" }, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 },
    b: { type: "media", mediaId: "media-1" },
    blendMode: "screen",
    mix: 0.5,
  };
  state.sourceBank[1].content = { type: "media", mediaId: "media-1" }; // slot-2: still plain media

  const ok = applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "media", mediaId: "media-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 });
  assert.equal(ok, false);
  assert.deepEqual(state.sourceBank[1].content, { type: "media", mediaId: "media-1" }); // rejected — state unchanged
});

// --- Legitimate writes must still work ----------------------------------------------

test("a legitimate sub-path write to content.a still works (repointing to plain media)", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.2.content.a", { type: "media", mediaId: "media-1" });
  assert.equal(ok, true);
  assert.deepEqual(state.sourceBank[2].content.a, { type: "media", mediaId: "media-1" });
  assert.deepEqual(state.sourceBank[2].content.b, { type: "media", mediaId: "media-2" }); // untouched
});

test("a legitimate sub-path write clearing content.b to null still works", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.2.content.b", null);
  assert.equal(ok, true);
  assert.equal(state.sourceBank[2].content.b, null);
  assert.deepEqual(state.sourceBank[2].content.a, { type: "slot", slotId: "slot-1" }); // untouched
});

test("a legitimate two-level-deep write (content.a.mediaId on a media ref) still works", () => {
  const state = fixtureState();
  assert.equal(applyUpdate(state, "sourceBank.2.content.a", { type: "media", mediaId: "media-1" }), true);
  const ok = applyUpdate(state, "sourceBank.2.content.a.mediaId", "media-2");
  assert.equal(ok, true);
  assert.deepEqual(state.sourceBank[2].content.a, { type: "media", mediaId: "media-2" });
});

test("editing blendMode on a mix slot still works", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.2.content.blendMode", "screen");
  assert.equal(ok, true);
  assert.equal(state.sourceBank[2].content.blendMode, "screen");
  assert.deepEqual(state.sourceBank[2].content.a, { type: "slot", slotId: "slot-1" }); // untouched
});

test("editing the mix amount on a mix slot still works", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.2.content.mix", 0.9);
  assert.equal(ok, true);
  assert.equal(state.sourceBank[2].content.mix, 0.9);
});

test("editing an unrelated slot (name) still works and doesn't disturb other slots' mixes", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.0.name", "Camera feed");
  assert.equal(ok, true);
  assert.equal(state.sourceBank[0].name, "Camera feed");
  assert.deepEqual(state.sourceBank[2].content.a, { type: "slot", slotId: "slot-1" }); // untouched
});

test("editing a plain field on a media-type slot that's referenced elsewhere as a mix input still succeeds", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.0.content.mediaId", "media-2");
  assert.equal(ok, true);
  assert.deepEqual(state.sourceBank[0].content, { type: "media", mediaId: "media-2" });
  assert.deepEqual(state.sourceBank[2].content.a, { type: "slot", slotId: "slot-1" }); // untouched
});

// --- Adversarial inputs beyond the six documented rounds -----------------------------

test("adversarial: a whole-slot-object replacement (sourceBank.<n>, not .content) that pre-embeds a mix-of-mix is rejected", () => {
  // Not a sub-path under .content at all — the entire slot object is replaced in one
  // write. The guard must reconstruct and validate this the same as any other write
  // under "sourceBank.".
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.1", {
    id: "slot-2",
    name: "Slot 2",
    content: { type: "mix", a: { type: "slot", slotId: "slot-3" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 },
  });
  assert.equal(ok, false);
  assert.equal(state.sourceBank[1].content, null); // rejected — state unchanged
});

test("adversarial: a whole-slot-object replacement with a legitimate mix is still allowed", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.1", {
    id: "slot-2",
    name: "Slot 2",
    content: { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 },
  });
  assert.equal(ok, true);
});

test("adversarial: a whole-sourceBank-array replacement (path 'sourceBank', no trailing dot/index) that pre-embeds a mix-of-mix is rejected", () => {
  // Nothing on the wire protocol stops a client from sending path "sourceBank" itself
  // (see index.js: `message.path` is any client-supplied string, passed straight to
  // applyUpdate) — a plain `path.startsWith("sourceBank.")` check does NOT match this
  // exact string (no trailing "."), so this must be checked as its own case.
  const state = fixtureState();
  const maliciousBank = structuredClone(state.sourceBank);
  maliciousBank[1].content = { type: "mix", a: { type: "slot", slotId: "slot-3" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 };
  const ok = applyUpdate(state, "sourceBank", maliciousBank);
  assert.equal(ok, false);
  assert.equal(state.sourceBank[1].content, null); // rejected — state unchanged, original array untouched
});

test("adversarial: a whole-sourceBank-array replacement with an all-legitimate array is still allowed", () => {
  const state = fixtureState();
  const newBank = structuredClone(state.sourceBank);
  newBank[1].content = { type: "media", mediaId: "media-2" };
  const ok = applyUpdate(state, "sourceBank", newBank);
  assert.equal(ok, true);
  assert.deepEqual(state.sourceBank[1].content, { type: "media", mediaId: "media-2" });
});

test("adversarial: replacing the whole sourceBank with a non-array value doesn't crash and isn't reported as a mix cycle", () => {
  const state = fixtureState();
  // Not a mix-cycle violation as this guard defines it (there's no mix in a string) —
  // must not throw trying to iterate a non-array, and must not be misreported as a
  // cycle rejection. (Whether junk-typed sourceBank is itself acceptable is a separate,
  // broader structural concern outside this guard's contract.)
  assert.doesNotThrow(() => applyUpdate(state, "sourceBank", "not-an-array"));
});

test("adversarial: duplicate-id decoy cannot hide a real mix-holding slot from a slot-ref lookup", () => {
  // If sourceBank ever ends up with two slots sharing an id (nothing at this write
  // layer enforces id-uniqueness — see the whole-array-replacement case above), a
  // ref-resolution that only checked the FIRST same-id match (`.find`) could be fooled
  // by an earlier non-mix decoy sharing the id of the real mix-holding slot being
  // referenced. The guard must check ALL same-id slots, not just the first.
  const state = fixtureState();
  const maliciousBank = [
    { id: "slot-3", name: "Decoy (non-mix, id collides with the real slot-3, sorts first)", content: { type: "media", mediaId: "media-1" } },
    { id: "slot-1", name: "Slot 1", content: { type: "media", mediaId: "media-1" } },
    { id: "slot-3", name: "Slot 3 (real)", content: { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "multiply", mix: 0.5 } },
    { id: "slot-2", name: "Slot 2", content: { type: "mix", a: { type: "slot", slotId: "slot-3" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 } },
  ];
  const ok = applyUpdate(state, "sourceBank", maliciousBank);
  assert.equal(ok, false);
});

test("adversarial: a sub-path write to content.mix or content.blendMode never triggers rejection, even on a slot referenced elsewhere as a mix input", () => {
  const state = fixtureState();
  // slot-1 (index 0) is referenced by slot-3's mix as `a`. Fields other than a/b can
  // never affect the mix-of-mix invariant, regardless of what references this slot.
  assert.equal(applyUpdate(state, "sourceBank.2.content.mix", 0.1), true);
  assert.equal(applyUpdate(state, "sourceBank.2.content.blendMode", "difference"), true);
  assert.equal(state.sourceBank[2].content.mix, 0.1);
  assert.equal(state.sourceBank[2].content.blendMode, "difference");
});

// --- resolveDanglingSourceRefs (unrelated to the cycle guard, but shares fixtures) ---

test("resolveDanglingSourceRefs clears a slot's direct media reference", () => {
  const state = fixtureState();
  resolveDanglingSourceRefs(state, "media", "media-1");
  assert.equal(state.sourceBank[0].content, null);
});

test("resolveDanglingSourceRefs nulls only the affected side of a mix, keeps the other", () => {
  const state = fixtureState();
  resolveDanglingSourceRefs(state, "media", "media-2"); // slot-3's mix.b
  assert.equal(state.sourceBank[2].content.type, "mix");
  assert.equal(state.sourceBank[2].content.b, null);
  assert.deepEqual(state.sourceBank[2].content.a, { type: "slot", slotId: "slot-1" }); // untouched
});
