function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of children) node.appendChild(child);
  return node;
}

export function renderPresetsBar(container, state, actions) {
  container.innerHTML = "";
  const presets = Object.values(state.presets || {});

  const bar = el("div", { className: "bar" });
  for (const preset of presets) {
    const btn = el("button", { className: "preset", textContent: preset.name });
    btn.addEventListener("click", () => actions.recallPreset(preset.id));
    bar.appendChild(btn);
  }

  const nameInput = el("input", { type: "text", placeholder: "Preset name", className: "preset-name-input" });
  const saveBtn = el("button", { className: "save-btn", textContent: "+ Save current" });
  saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim() || `Preset ${presets.length + 1}`;
    actions.savePreset(name);
    nameInput.value = "";
  });

  bar.append(nameInput, saveBtn);
  container.appendChild(bar);
}
