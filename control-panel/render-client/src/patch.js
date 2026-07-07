// Client-side mirror of server/src/state.js's dotted-path patch logic, minus file
// persistence (the render client only ever needs an in-memory mirror of state).
// Hardened the same way as the server: no prototype-chain traversal, no crash on
// paths that dot through a primitive leaf, applyUpdate only patches an EXISTING leaf
// (and is a no-op if the value is unchanged), applyDelete only reports true if the key
// actually existed. Kept in parity with server/src/state.js by
// server/test/state-patch-parity.test.js — mirror any change to one there too.

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function walkToParent(state, keys) {
  let node = state;
  for (const key of keys) {
    if (UNSAFE_KEYS.has(key)) return null;
    if (node == null || typeof node !== "object" || !Object.hasOwn(node, key)) return null;
    node = node[key];
  }
  return node;
}

export function applyUpdate(state, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  if (UNSAFE_KEYS.has(last)) return false;
  const node = walkToParent(state, keys);
  if (node == null || typeof node !== "object" || !Object.hasOwn(node, last)) return false;
  if (node[last] === value) return false;
  node[last] = value;
  return true;
}

export function applyCreate(state, containerPath, key, value) {
  if (typeof key !== "string" || UNSAFE_KEYS.has(key)) return false;
  const node = walkToParent(state, containerPath.split("."));
  if (node == null || typeof node !== "object") return false;
  node[key] = value;
  return true;
}

export function applyDelete(state, path) {
  const keys = path.split(".");
  const last = keys.pop();
  if (UNSAFE_KEYS.has(last)) return false;
  const node = walkToParent(state, keys);
  if (node == null || typeof node !== "object" || !Object.hasOwn(node, last)) return false;
  delete node[last];
  return true;
}

// Batch: applied atomically from the client's perspective — the caller re-derives
// once after all patches (used by the server's fade/LFO engines).
export function applyBatch(state, updates) {
  let changed = false;
  for (const { path, value } of updates || []) {
    if (typeof path === "string" && applyUpdate(state, path, value)) changed = true;
  }
  return changed;
}
