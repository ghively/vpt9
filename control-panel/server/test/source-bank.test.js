import test from "node:test";
import assert from "node:assert/strict";
import { applyUpdate, applyCreate, resolveDanglingSourceRefs } from "../src/state.js";

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
  // slot-2 starts empty (content: null in the fixture) — this specifically exercises the
  // self-reference check independent of the referenced slot's current content type,
  // which the "currently a mix" check alone would miss.
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "slot", slotId: "slot-2" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 }),
    false,
  );
});

test("cannot retroactively turn a slot into a mix once another slot's mix already depends on it", () => {
  const state = fixtureState();
  // slot-1 (media) is already referenced by slot-3's mix as `a`. Turning slot-1 itself
  // into a mix now would make slot-3 a mix-of-mix without slot-3's own write ever being
  // revalidated — the ordering hole.
  assert.equal(
    applyUpdate(state, "sourceBank.0.content", { type: "mix", a: { type: "media", mediaId: "media-2" }, b: { type: "media", mediaId: "media-1" }, blendMode: "screen", mix: 0.5 }),
    false,
  );
});

test("a granular sub-path write to content.a is checked for cycles just like a whole-object write (regression: guard used to be bypassed for sub-paths)", () => {
  const state = fixtureState();
  // slot-3 (index 2) already holds a valid mix (a: slot-1, b: media-2). A sub-path write
  // straight to content.a — reachable via applyUpdate's existing-leaf rule precisely
  // because content.a already exists — must still be rejected when it would make the
  // mix reference itself, exactly like a whole-object replacement would be.
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
  // Turn slot-2 (index 1, currently empty) into a mix of two media refs first — allowed.
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "media", mediaId: "media-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 }),
    true,
  );
  // Now try a sub-path write pointing slot-2's `b` at slot-3, which is itself a mix-holding
  // slot — a direct mix-of-mix, rejected the same way a whole-object write would be.
  const ok = applyUpdate(state, "sourceBank.1.content.b", { type: "slot", slotId: "slot-3" });
  assert.equal(ok, false);
  assert.deepEqual(state.sourceBank[1].content.b, { type: "media", mediaId: "media-2" }); // rejected — state unchanged
});

test("a legitimate sub-path write to content.a still works (the fix must not block non-cycle sub-path writes)", () => {
  const state = fixtureState();
  // slot-3 (index 2) already holds a valid mix; repointing `a` at a plain media reference
  // is not a cycle and must still be allowed through the granular sub-path.
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

// Regression: a re-review found that the first fix (matching only ".content.a" /
// ".content.b" as whole sub-path shapes) still missed a write ONE level deeper —
// "sourceBank.<n>.content.a.slotId" — because neither the whole-object regex nor the
// "a"/"b" sub-path regex matched it, so wouldCreateMixCycle returned false without
// inspecting anything, and applyUpdate's generic existing-leaf rule let the retarget
// through. The guard must now be depth-general (reconstruct-and-validate), not another
// pattern added to the enumeration.
test("a write two levels deep (content.a.slotId) retargeting to a self-reference is rejected (regression: one-level-deeper bypass)", () => {
  const state = fixtureState();
  // slot-3 (index 2) holds a mix whose `a` is { type: "slot", slotId: "slot-1" }.
  // Retarget just the `slotId` leaf to slot-3's own id — a self-reference — without
  // ever writing to `content` or `content.a` as a whole object.
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

test("a write two levels deep (content.b.slotId) retargeting to another mix-holding slot is rejected (direct mix-of-mix, regression: one-level-deeper bypass)", () => {
  const state = fixtureState();
  // Turn slot-2 (index 1, currently empty) into a mix of two media refs first — allowed.
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "media", mediaId: "media-1" }, b: { type: "slot", slotId: "slot-1" }, blendMode: "screen", mix: 0.5 }),
    true,
  );
  // Now retarget only the `slotId` leaf of `b` (currently pointing at slot-1, a media
  // slot) to slot-3, which is itself a mix-holding slot — a direct mix-of-mix reachable
  // only by writing the `slotId` leaf two levels under `content`.
  const ok = applyUpdate(state, "sourceBank.1.content.b.slotId", "slot-3");
  assert.equal(ok, false);
  assert.deepEqual(state.sourceBank[1].content.b, { type: "slot", slotId: "slot-1" }); // rejected — state unchanged
});

// A third level deep (e.g. "content.a.slotId.<something>") is not reachable: by the
// time the walk gets to `slotId`, the node is a string primitive, and applyUpdate's
// existing-leaf rule (`walkToParent` / the reconstruction loop above) requires every
// intermediate segment to resolve to an object — `typeof node !== "object"` — so the
// walk bails out (returns null / false) before ever reaching a fourth segment. There's
// no object-valued leaf under a mix ref (`type` and `slotId`/`mediaId` are always
// strings) for a write to tunnel through, so no test is constructible for "three
// levels deep" — the depth-general guard's own object-type check is what closes that
// off, not a depth limit.

test("a legitimate two-level-deep write (content.a.mediaId on a media ref) still works", () => {
  const state = fixtureState();
  // slot-3's mix.a is currently { type: "slot", slotId: "slot-1" } — repoint slot-3's
  // mix.a to a *different* plain media reference first so it has a mediaId leaf,
  // exercising a legitimate two-level-deep write path (not just a"/"b" whole-ref writes).
  assert.equal(applyUpdate(state, "sourceBank.2.content.a", { type: "media", mediaId: "media-1" }), true);
  const ok = applyUpdate(state, "sourceBank.2.content.a.mediaId", "media-2");
  assert.equal(ok, true);
  assert.deepEqual(state.sourceBank[2].content.a, { type: "media", mediaId: "media-2" });
});

// Regression (4th review round): the guard used to gate reconstruction on the slot's
// CURRENT (pre-write) content type — `if (thisSlot.content?.type !== "mix") return
// false;` — so it bailed out and skipped validation entirely whenever the current type
// wasn't "mix" yet. That's exploitable via a 4-step "type-flip dance" of individually-
// valid applyUpdate calls:
//   1. write a legitimate mix into content (validated, passes — it's a real mix).
//   2. flip content.type to "media" (validated: current type WAS "mix" so the check ran,
//      but a/b are untouched, so it passes) — content is now a "media"-typed object with
//      stray mix fields (a/b/blendMode/mix) still physically present.
//   3. write a cyclic value into content.a — SKIPPED under the old guard, because the
//      current type is "media" now, so the precondition bails before reconstructing
//      anything. (Under the fix this step is *also* allowed through, but for a
//      different, correct reason: content's resulting type after this write is still
//      "media", not "mix", so there's nothing to validate yet — matches the "must not
//      over-reject a plain field edit" requirement below.)
//   4. flip content.type back to "mix" — SKIPPED under the old guard for the same
//      reason (current type is "media" going into this write), silently completing the
//      cycle. This is the step the fix must catch: reconstructing the candidate for
//      *this* write yields {type: "mix", a: <cyclic>, ...}, so checking
//      `candidate.type` (post-write) instead of `thisSlot.content.type` (pre-write)
//      catches it right here, no matter how the label got flipped away and back.
test("4-step type-flip dance (self-reference variant): flipping content away from 'mix' and back cannot smuggle in a self-reference", () => {
  const state = fixtureState();

  // Step 1: legitimate mix, slot-2 (index 1) referencing slot-1 (media) and media-2.
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "multiply", mix: 0.5 }),
    true,
  );

  // Step 2: flip the label off "mix" — a/b are untouched, so this is legitimately valid.
  assert.equal(applyUpdate(state, "sourceBank.1.content.type", "media"), true);
  assert.equal(state.sourceBank[1].content.type, "media");

  // Step 3: rewrite `a` to self-reference slot-2 while content is (still) type "media".
  // This must succeed — content's resulting type is "media", not "mix", so it's not yet
  // a dangerous state (a mix-shaped value sitting inertly on a non-mix object is inert
  // exactly as a plain unrelated-field edit would be — see the no-over-rejection test).
  assert.equal(applyUpdate(state, "sourceBank.1.content.a", { type: "slot", slotId: "slot-2" }), true);
  const stateAfterStep3 = structuredClone(state);

  // Step 4: flip the type back to "mix". THIS is the write that must be rejected — the
  // reconstructed candidate for this exact write is {type:"mix", a:{slot,slot-2}, ...},
  // a self-reference, and must be caught here even though neither step 2 nor step 3
  // individually looked dangerous under the old pre-write-type gate.
  assert.equal(applyUpdate(state, "sourceBank.1.content.type", "mix"), false);

  // Rejected: state is exactly as it was right after step 3 (step 4 is a no-op) — in
  // particular content.type is still "media", so the dangerous shape
  // {type:"mix", a:<cyclic>, ...} this guard exists to prevent is never reached.
  assert.deepEqual(state, stateAfterStep3);
  assert.equal(state.sourceBank[1].content.type, "media");
});

test("4-step type-flip dance (direct mix-of-mix variant): flipping content away from 'mix' and back cannot smuggle in a reference to another mix-holding slot", () => {
  const state = fixtureState();

  // Step 1: legitimate mix, slot-2 (index 1) referencing slot-1 (media) and media-2.
  assert.equal(
    applyUpdate(state, "sourceBank.1.content", { type: "mix", a: { type: "slot", slotId: "slot-1" }, b: { type: "media", mediaId: "media-2" }, blendMode: "multiply", mix: 0.5 }),
    true,
  );

  // Step 2: flip the label off "mix".
  assert.equal(applyUpdate(state, "sourceBank.1.content.type", "media"), true);

  // Step 3: rewrite `a` to point at slot-3, which already holds a mix — allowed, same
  // reasoning as the self-reference variant (content's resulting type is still "media").
  assert.equal(applyUpdate(state, "sourceBank.1.content.a", { type: "slot", slotId: "slot-3" }), true);
  const stateAfterStep3 = structuredClone(state);

  // Step 4: flip back to "mix" — reconstructed candidate is
  // {type:"mix", a:{slot,slot-3}, ...}, a direct mix-of-mix (slot-3 currently holds a
  // mix), and must be rejected.
  assert.equal(applyUpdate(state, "sourceBank.1.content.type", "mix"), false);

  assert.deepEqual(state, stateAfterStep3);
  assert.equal(state.sourceBank[1].content.type, "media");
});

test("editing a plain field on a media-type slot that's referenced elsewhere as a mix input still succeeds (fix must not over-reject)", () => {
  const state = fixtureState();
  // slot-1 (index 0) is type "media" and is already used as slot-3's mix input `a`.
  // Changing its mediaId doesn't touch `type`, so the resulting candidate type stays
  // "media" — isUsedAsMixInputElsewhere must never even be consulted for this write.
  const ok = applyUpdate(state, "sourceBank.0.content.mediaId", "media-2");
  assert.equal(ok, true);
  assert.deepEqual(state.sourceBank[0].content, { type: "media", mediaId: "media-2" });
  // The mix referencing it elsewhere is untouched.
  assert.deepEqual(state.sourceBank[2].content.a, { type: "slot", slotId: "slot-1" });
});

// Fifth bypass, found while hunting for one beyond the 4-step type-flip dance above:
// the self-reference and direct-mix-slot checks only ever inspected `candidate.a`/
// `candidate.b` ONE level deep, keyed on `.type === "slot"`. Nothing on the server
// validates that `a`/`b` are actually refs (media/camera/slot) at all — a client can
// send arbitrary JSON as the update value — so `a` (or `b`) can itself be an INLINE
// `{type: "mix", a: ..., b: ...}` object rather than a slot reference. That sails past
// both the self-reference check (`.type === "slot"`) and the direct-mix-slot check
// (same guard) in a SINGLE write, no multi-step dance required, because neither check
// ever looks inside a non-"slot" a/b to see what it itself contains. Fixed by having
// the checks recurse through inline "mix" refs (see refCreatesCycle in state.js).
test("a single write cannot smuggle a self-reference through an inline nested mix object in content.a (fifth bypass, single-step)", () => {
  const state = fixtureState();
  const ok = applyUpdate(state, "sourceBank.1.content", {
    type: "mix",
    // `a` is not a slot ref — it's an inline mix literal whose OWN `a` self-references
    // slot-2 (the slot being written). Neither the old self-ref nor direct-mix-slot
    // check looked past `a.type !== "slot"` to see this.
    a: { type: "mix", a: { type: "slot", slotId: "slot-2" }, b: null, blendMode: "screen", mix: 0.5 },
    b: { type: "media", mediaId: "media-2" },
    blendMode: "screen",
    mix: 0.5,
  });
  assert.equal(ok, false);
  assert.equal(state.sourceBank[1].content, null); // rejected — state unchanged
});

test("a single write cannot smuggle a reference to a live mix-holding slot through an inline nested mix object in content.b (fifth bypass, single-step)", () => {
  const state = fixtureState();
  // slot-3 currently holds a real mix. Reaching it through an inline nested mix
  // literal in `b` (rather than `b` itself being {type:"slot", slotId:"slot-3"}) must
  // still be rejected as a direct mix-of-mix.
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

test("a pathologically deep chain of inline nested mixes is rejected outright rather than recursed without bound", () => {
  const state = fixtureState();
  let deep = { type: "media", mediaId: "media-1" };
  for (let i = 0; i < 10; i++) deep = { type: "mix", a: deep, b: null, blendMode: "screen", mix: 0.5 };
  const ok = applyUpdate(state, "sourceBank.1.content", { type: "mix", a: deep, b: { type: "media", mediaId: "media-2" }, blendMode: "screen", mix: 0.5 });
  assert.equal(ok, false);
  assert.equal(state.sourceBank[1].content, null); // rejected — state unchanged
});

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
