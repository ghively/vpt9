function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of children) node.appendChild(child);
  return node;
}

function makeMovableBox(stage, pip, actions) {
  const box = el("div", { className: "pip-box" });
  const bar = el("div", { className: "pip-box__bar" }, [el("span", { textContent: pip.title || "PiP" })]);
  const resize = el("div", { className: "pip-box__resize" });
  box.append(bar, resize);

  const place = () => {
    box.style.left = `${pip.x * 100}%`;
    box.style.top = `${pip.y * 100}%`;
    box.style.width = `${pip.width * 100}%`;
    box.style.height = `${pip.height * 100}%`;
  };
  place();

  bar.addEventListener("pointerdown", (event) => {
    bar.setPointerCapture(event.pointerId);
    actions.beginDrag();
    const rect = stage.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = pip.x;
    const originY = pip.y;
    const onMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / rect.width;
      const dy = (moveEvent.clientY - startY) / rect.height;
      pip.x = Math.min(1 - pip.width, Math.max(0, originX + dx));
      pip.y = Math.min(1 - pip.height, Math.max(0, originY + dy));
      place();
      actions.updatePip(pip.id, "x", pip.x);
      actions.updatePip(pip.id, "y", pip.y);
    };
    const onUp = () => {
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      actions.endDrag();
    };
    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
  });

  resize.addEventListener("pointerdown", (event) => {
    resize.setPointerCapture(event.pointerId);
    actions.beginDrag();
    const rect = stage.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originW = pip.width;
    const originH = pip.height;
    const onMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / rect.width;
      const dy = (moveEvent.clientY - startY) / rect.height;
      pip.width = Math.max(0.05, Math.min(1 - pip.x, originW + dx));
      pip.height = Math.max(0.05, Math.min(1 - pip.y, originH + dy));
      place();
      actions.updatePip(pip.id, "width", pip.width);
      actions.updatePip(pip.id, "height", pip.height);
    };
    const onUp = () => {
      resize.removeEventListener("pointermove", onMove);
      resize.removeEventListener("pointerup", onUp);
      actions.endDrag();
    };
    resize.addEventListener("pointermove", onMove);
    resize.addEventListener("pointerup", onUp);
  });

  return box;
}

// ctx: { selectedScreenId, latestPreviewByScreen }
export function renderPipManager(container, state, ctx, actions) {
  container.innerHTML = "";
  const allPip = Object.values(state.pip || {});
  const mine = allPip.filter((p) => p.screenId === ctx.selectedScreenId);

  container.appendChild(el("h3", { textContent: `Windows — ${ctx.selectedScreenId}` }));

  const stage = el("div", { className: "stage" });
  const frameUrl = ctx.latestPreviewByScreen.get(ctx.selectedScreenId);
  const stageFrame = el("div", { className: "stage__frame" }, [el("img", { className: "preview-img", src: frameUrl ?? "" })]);
  stage.appendChild(stageFrame);
  for (const pip of mine) stage.appendChild(makeMovableBox(stage, pip, actions));
  container.appendChild(stage);

  for (const pip of mine) {
    const row = el("div", { className: "pip-row" });
    const visibleToggle = el("button", { className: "toggle-sq", textContent: "V", title: "Visible" });
    visibleToggle.dataset.active = String(!!pip.visible);
    visibleToggle.addEventListener("click", () => actions.updatePip(pip.id, "visible", !pip.visible));

    const titleInput = el("input", { type: "text", value: pip.title ?? "", placeholder: "Title" });
    titleInput.addEventListener("change", () => actions.updatePip(pip.id, "title", titleInput.value));

    const videoInput = el("input", { type: "text", value: pip.videoId ?? "", placeholder: "YouTube video ID" });
    videoInput.addEventListener("change", () => actions.updatePip(pip.id, "videoId", videoInput.value));

    const removeBtn = el("button", { className: "toggle-sq", textContent: "×", title: "Remove window" });
    removeBtn.addEventListener("click", () => actions.removePip(pip.id));

    row.append(visibleToggle, titleInput, videoInput, removeBtn);
    container.appendChild(row);
  }

  const addBtn = el("button", { className: "btn", textContent: "+ Add window" });
  addBtn.addEventListener("click", () => actions.addPip(ctx.selectedScreenId));
  container.appendChild(addBtn);
}
