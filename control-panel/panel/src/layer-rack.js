const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "difference", "add"];

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of children) node.appendChild(child);
  return node;
}

function buildStrip(layer, actions) {
  const strip = el("div", { className: "strip" });

  const idx = el("div", { className: "idx mono", textContent: String(layer.order ?? 0).padStart(2, "0") });

  const nameInput = el("input", { type: "text", className: "name-input", value: layer.name ?? "" });
  nameInput.addEventListener("change", () => actions.updateLayer(layer.id, "name", nameInput.value));

  const sourceType = el("select", { className: "source-type" });
  for (const opt of ["video", "color"]) {
    sourceType.appendChild(el("option", { value: opt, textContent: opt === "video" ? "Video URL" : "Solid color", selected: layer.source?.type === opt }));
  }

  const sourceField = el("div", { className: "source-field" });
  function renderSourceField(type) {
    sourceField.innerHTML = "";
    if (type === "color") {
      const [r, g, b] = layer.source?.color ?? [0.5, 0.5, 0.5];
      const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
      const colorInput = el("input", { type: "color", value: `#${toHex(r)}${toHex(g)}${toHex(b)}` });
      colorInput.addEventListener("input", () => {
        const hex = colorInput.value;
        const color = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
        actions.updateLayer(layer.id, "source", { type: "color", color });
      });
      sourceField.appendChild(colorInput);
    } else {
      const urlInput = el("input", { type: "text", value: layer.source?.url ?? "", placeholder: "/media/video.mp4" });
      urlInput.addEventListener("change", () => actions.updateLayer(layer.id, "source", { type: "video", url: urlInput.value }));
      sourceField.appendChild(urlInput);
    }
  }
  renderSourceField(layer.source?.type ?? "video");
  sourceType.addEventListener("change", () => renderSourceField(sourceType.value));

  const blendSelect = el("select", { className: "blend-select" });
  for (const mode of BLEND_MODES) {
    blendSelect.appendChild(el("option", { value: mode, textContent: mode[0].toUpperCase() + mode.slice(1), selected: layer.blendMode === mode }));
  }
  blendSelect.addEventListener("change", () => actions.updateLayer(layer.id, "blendMode", blendSelect.value));

  const opacityRange = el("input", { type: "range", min: "0", max: "1", step: "0.01", value: String(layer.opacity ?? 1), className: "opacity-range" });
  const opacityVal = el("span", { className: "opacity-val mono", textContent: `${Math.round((layer.opacity ?? 1) * 100)}%` });
  opacityRange.addEventListener("input", () => {
    const value = Number(opacityRange.value);
    opacityVal.textContent = `${Math.round(value * 100)}%`;
    actions.updateLayer(layer.id, "opacity", value);
  });

  const maskToggle = el("button", { className: "toggle-sq", textContent: "M", title: "Mask" });
  maskToggle.dataset.active = String(!!layer.mask?.enabled);
  maskToggle.addEventListener("click", () => actions.updateLayer(layer.id, "mask", { ...layer.mask, enabled: !layer.mask?.enabled }));

  const shapeToggle = el("button", { className: "toggle-sq", textContent: layer.mask?.shape === "rect" ? "□" : "○", title: "Mask shape" });
  shapeToggle.addEventListener("click", () => {
    const nextShape = layer.mask?.shape === "rect" ? "ellipse" : "rect";
    actions.updateLayer(layer.id, "mask", { ...layer.mask, shape: nextShape });
  });

  const removeBtn = el("button", { className: "toggle-sq remove-btn", textContent: "×", title: "Remove layer" });
  removeBtn.addEventListener("click", () => actions.removeLayer(layer.id));

  strip.append(
    idx,
    el("div", { className: "meta" }, [nameInput]),
    el("div", { className: "source-group" }, [sourceType, sourceField]),
    blendSelect,
    el("div", { className: "opacity-field" }, [opacityRange, opacityVal]),
    el("div", { className: "toggles" }, [maskToggle, shapeToggle, removeBtn])
  );
  return strip;
}

export function renderLayerRack(container, state, actions) {
  container.innerHTML = "";
  const layers = Object.values(state.layers || {}).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const displayOrder = [...layers].reverse(); // top of stack shown first, like the mockup

  container.appendChild(el("div", { className: "rack-title", textContent: "Layer rack — top of stack first" }));
  for (const layer of displayOrder) container.appendChild(buildStrip(layer, actions));

  const addBtn = el("button", { className: "btn", textContent: "+ Add layer" });
  addBtn.addEventListener("click", () => actions.addLayer());
  container.appendChild(addBtn);
}
