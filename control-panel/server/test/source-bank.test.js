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
