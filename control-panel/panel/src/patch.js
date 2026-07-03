// Client-side mirror of server/src/state.js's dotted-path patch logic (see the same
// file duplicated in render-client/src/ — kept tiny and dependency-free deliberately so
// each deployable unit stays self-contained without a shared-package build step).

function walkToParent(state, keys) {
  let node = state;
  for (const key of keys) {
    if (node == null) return null;
    node = node[key];
  }
  return node;
}

export function applyUpdate(state, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const node = walkToParent(state, keys);
  if (node == null) return false;
  node[last] = value;
  return true;
}

export function applyCreate(state, containerPath, key, value) {
  const node = walkToParent(state, containerPath.split("."));
  if (node == null || typeof node !== "object") return false;
  node[key] = value;
  return true;
}

export function applyDelete(state, path) {
  const keys = path.split(".");
  const last = keys.pop();
  const node = walkToParent(state, keys);
  if (node == null) return false;
  delete node[last];
  return true;
}
