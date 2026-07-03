function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of children) node.appendChild(child);
  return node;
}

// `point` is the actual object living inside the app's state mirror (not a copy) —
// mutating point.x/point.y here keeps state consistent immediately, so if some other
// unrelated change forces a re-render mid-drag, this handle's position doesn't jump
// back to a stale value. beginDrag/endDrag additionally suppress the app's full
// re-render entirely while dragging: without that, the server echoing our own update
// back would recreate this exact DOM node out from under the in-progress gesture.
function makeDraggableHandle(stage, point, onMove, dragLifecycle) {
  const handle = el("div", { className: "handle" });
  const place = (x, y) => {
    handle.style.left = `${x * 100}%`;
    handle.style.top = `${y * 100}%`;
  };
  place(point.x, point.y);

  handle.addEventListener("pointerdown", (event) => {
    handle.setPointerCapture(event.pointerId);
    handle.dataset.active = "true";
    dragLifecycle.begin();

    const onPointerMove = (moveEvent) => {
      const rect = stage.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (moveEvent.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (moveEvent.clientY - rect.top) / rect.height));
      place(x, y);
      point.x = x;
      point.y = y;
      onMove(x, y);
    };
    const onPointerUp = () => {
      handle.dataset.active = "false";
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      dragLifecycle.end();
    };
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
  });

  return handle;
}

// ctx: { selectedScreenId, latestPreviewByScreen: Map<screenId, dataUrl> }
export function renderWarpEditor(container, state, ctx, actions) {
  container.innerHTML = "";
  const screens = Object.values(state.screens || {});
  const screen = state.screens?.[ctx.selectedScreenId];
  const warp = screen?.warp;

  const head = el("div", { className: "panel-head" });
  head.appendChild(el("h3", { textContent: `${screen?.name ?? ctx.selectedScreenId} — warp` }));
  const screenTabs = el("div", { className: "mode-group" });
  for (const s of screens) {
    const tab = el("button", { className: "chip", textContent: s.name });
    tab.dataset.active = String(s.id === ctx.selectedScreenId);
    tab.addEventListener("click", () => actions.selectScreen(s.id));
    screenTabs.appendChild(tab);
  }
  head.appendChild(screenTabs);

  const modeGroup = el("div", { className: "mode-group" });
  const cornerBtn = el("button", { className: "chip", textContent: "Corner pin" });
  cornerBtn.dataset.active = String(warp?.mode !== "mesh");
  cornerBtn.addEventListener("click", () => actions.setWarpMode(ctx.selectedScreenId, "corner"));
  const meshBtn = el("button", { className: "chip", textContent: "Mesh" });
  meshBtn.dataset.active = String(warp?.mode === "mesh");
  meshBtn.addEventListener("click", () => actions.setWarpMode(ctx.selectedScreenId, "mesh"));
  const resetBtn = el("button", { className: "chip", textContent: "Reset" });
  resetBtn.addEventListener("click", () => actions.resetWarp(ctx.selectedScreenId));
  modeGroup.append(cornerBtn, meshBtn, resetBtn);

  const stage = el("div", { className: "stage" });
  const frameUrl = ctx.latestPreviewByScreen.get(ctx.selectedScreenId);
  const stageFrame = el("div", { className: "stage__frame" }, [el("img", { className: "preview-img", src: frameUrl ?? "" })]);
  stage.appendChild(stageFrame);

  const isMesh = warp?.mode === "mesh";
  const points = isMesh ? warp.mesh.points : warp?.corners;
  const basePath = isMesh ? `screens.${ctx.selectedScreenId}.warp.mesh.points` : `screens.${ctx.selectedScreenId}.warp.corners`;

  (points || []).forEach((point, index) => {
    const handle = makeDraggableHandle(
      stage,
      point,
      (x, y) => actions.setWarpPoint(`${basePath}.${index}`, { x, y }),
      { begin: actions.beginDrag, end: actions.endDrag }
    );
    stage.appendChild(handle);
  });

  container.append(head, modeGroup, stage);
}
