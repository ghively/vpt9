import { test } from "node:test";
import assert from "node:assert/strict";
import * as serverPatch from "../src/state.js";
import * as clientPatch from "../../render-client/src/patch.js";

// docs/CONTROL_PANEL_CODE_QUALITY.md finding #6: the dotted-path patch engine is
// hand-duplicated across server/src/state.js, render-client/src/patch.js, and
// panel/src/app/store.ts, with nothing to catch behavioral drift between the copies.
// This runs one shared fixture against the two plain-JS copies (server + render-client)
// so a future change to one that isn't mirrored in the other fails a test instead of
// silently diverging. `applyUpdate`/`applyDelete` share an identical signature/contract
// across all three copies and are covered here; `applyCreate` is deliberately NOT
// included — server's takes a bare value and derives the key from `value.id`, while the
// client copies take an already-resolved `key` (the server assigns it, then broadcasts
// `{path,key,value}`), so an identical fixture would be comparing two different, both
// correct, contracts. panel/src/app/store.ts (TypeScript) mirrors the same logic but
// isn't exercised here — no TS-capable test runner is wired up in this repo yet; its
// parity was verified by direct code comparison during this audit and it's covered by
// the panel's own `tsc --noEmit` type-check.

function freshFixtureState() {
  return {
    layers: {
      "layer-1": { id: "layer-1", order: 1, opacity: 0.5, nested: { deep: 1 } },
    },
    screens: {},
  };
}

const UPDATE_CASES = [
  { path: "layers.layer-1.opacity", value: 0.9, expectApplied: true },
  { path: "layers.layer-1.opacity", value: 0.5, expectApplied: false }, // unchanged, strict-eq dedupe
  { path: "layers.layer-1.nested.deep", value: 2, expectApplied: true },
  { path: "layers.layer-99.opacity", value: 1, expectApplied: false }, // missing entry
  { path: "layers.layer-1.opacity.x", value: 1, expectApplied: false }, // dots through a primitive
  { path: "layers.__proto__.polluted", value: "yes", expectApplied: false },
  { path: "layers.layer-1.constructor.prototype.polluted", value: "yes", expectApplied: false },
];

for (const { path, value, expectApplied } of UPDATE_CASES) {
  test(`applyUpdate("${path}") agrees between server/state.js and render-client/patch.js`, () => {
    const serverState = freshFixtureState();
    const clientState = freshFixtureState();
    const serverResult = serverPatch.applyUpdate(serverState, path, value);
    const clientResult = clientPatch.applyUpdate(clientState, path, value);
    assert.equal(serverResult, expectApplied, `server applyUpdate("${path}")`);
    assert.equal(clientResult, expectApplied, `client applyUpdate("${path}")`);
    assert.deepEqual(clientState, serverState, "post-update state must match between copies");
  });
}

const DELETE_CASES = [
  { path: "layers.layer-1", expectApplied: true },
  { path: "layers.layer-99", expectApplied: false },
  { path: "layers.__proto__", expectApplied: false },
];

for (const { path, expectApplied } of DELETE_CASES) {
  test(`applyDelete("${path}") agrees between server/state.js and render-client/patch.js`, () => {
    const serverState = freshFixtureState();
    const clientState = freshFixtureState();
    const serverResult = serverPatch.applyDelete(serverState, path);
    const clientResult = clientPatch.applyDelete(clientState, path);
    assert.equal(serverResult, expectApplied, `server applyDelete("${path}")`);
    assert.equal(clientResult, expectApplied, `client applyDelete("${path}")`);
    assert.deepEqual(clientState, serverState, "post-delete state must match between copies");
  });
}

test("neither copy's prototype-pollution guard leaks onto Object.prototype", () => {
  const serverState = freshFixtureState();
  const clientState = freshFixtureState();
  serverPatch.applyUpdate(serverState, "layers.layer-1.__proto__.polluted", "yes");
  clientPatch.applyUpdate(clientState, "layers.layer-1.__proto__.polluted", "yes");
  assert.equal({}.polluted, undefined);
});
