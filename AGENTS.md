# AGENTS.md

This file provides architectural context, rules, and development guidelines for AI assistants and autonomous coding agents working in this repository.

---

## 🎯 Current Project Structure & Focus

The primary active application in this repository is **LumaMap Studio** located in [`lumamap-portable/`](lumamap-portable/).

### Repository Layout

| Directory / File | Role | Description |
|---|---|---|
| **`lumamap-portable/`** | **Active Project** | Self-contained, portable projection mapping studio with Python FastAPI backend and HTML5/Canvas/WebGL front-end. |
| ├── `server.py` | Backend | FastAPI server, WebSocket hub (`/ws`), local media library manager (`/api/media`), Emby bridge, and `yt-dlp` stream resolver. |
| ├── `static/index.html` | Front-end | Unified Studio Split View, Projector Window (`?mode=projector`), and Phone Remote (`?mode=remote`). |
| ├── `cache/` | Cache | Pre-cached seamless HD VJ loops and stream artifacts. |
| ├── `media/` | Storage | User-uploaded local videos, GIFs, and images. |
| ├── `run.sh` / `run.bat` | Launchers | One-click startup scripts for Linux/macOS and Windows. |
| **`lumamap_studio_v2.html`** | **Standalone Dist** | Single-file zero-install edition of LumaMap Studio. Must stay in sync with `static/index.html`. |
| **`control-panel/`** | **Legacy Reference** | Node/React/WebGL2 reimplementation of VPT8. Kept intact as an algorithmic, shader, and testing reference. |
| **`docs/`** | **Documentation** | Historical parity audits, specifications, screenshots, and roadmap. |
| **`vpt8-source-archive`** (git tag) | **Archived** | Original Cycling '74 Max/MSP source code (preserved in git history at tag `vpt8-source-archive`). |

---

## 🧭 Where AI Agents Should Work

### Modifying LumaMap Studio
- **Front-End & UI**: Edit [`lumamap-portable/static/index.html`](lumamap-portable/static/index.html).
  - Contains the canvas rendering loop, polygon mask editor, perspective warping equations, phone remote UI, and YouTube/Emby integrations.
- **Backend & Media API**: Edit [`lumamap-portable/server.py`](lumamap-portable/server.py).
  - Handles `/ws` synchronization, chunked media streaming, YouTube stream extraction, and scene persistence.
- **Always Keep Distributions Synced**:
  - Whenever you modify `lumamap-portable/static/index.html`, copy it to `lumamap_studio_v2.html`:
    ```bash
    cp lumamap-portable/static/index.html lumamap_studio_v2.html
    ```
  - And update the release archive:
    ```bash
    cd lumamap-portable && zip -q -r ../lumamap_portable_v2.zip server.py requirements.txt README.md static/ cache/
    ```

---

## 🚦 Roadmap & Next Feature Targets

### ✅ Completed
- **5-Tab Workflow & Dedicated AI Studio (`5. ✦ AI`)**:
  - Unifies all intelligent room features into a dedicated, always-open 5th inspector tab (`#sectionAi`) while keeping contextual shortcuts in Steps 1 & 2 and the Scenes/Surface strips.
  - Supports deep linking via URL query parameters: `?tab=ai`, `?tab=source`, `?tab=warp`, `?tab=mask`, `?tab=blend`, alongside `?mode=projector` and `?mode=remote`.
- **Prompt-Based "Vibez" (AI Room Theme Generator)** (`#vibezDrawer`, 10 semantic room archetypes, 4 new procedural 60fps shaders `fireflies`, `biolum`, `lofiRain`, `emberGlow`, modifier parser, "Keep Wall Map" geometry lock, and optional LLM/Ollama endpoint `POST /api/vibez/generate`).
- **AI Auto-Room Mapping via Camera / Webcam** (`#autoMapModal`, client-side CV pipeline with Sobel + Integral-Image adaptive thresholding, morphological closing, connected-component contour tracing, RDP polygon simplification, Projector Flash Diff calibration, and Synthetic Demo Room).
- **Auto-Show / Ambient Scene Sequencer** (`#sceneSequencerBar`, 10s–10m interval timer, loop/shuffle modes, pool selector, live progress bar/countdown, and multi-property scene morphing across corners, polygons, blend, color grading, crop, and keep-out masks).
- **Built-in Text, Signage & Live Clock Overlay Source** (`#srcPaneText`, neon bloom, marquees, digital clock, event countdowns).
- **Dual-Source Audio Beat Reactivity** (Web Audio API FFT analysis of internal video audio + room mic, live VU meter, kick brightness & subwoofer scale).
- **Persistent Layer Opacity Controls** (Quick-access 0–100% layer fader in surface header).
- **Hardware-Grade UI Streamlining & De-Cluttering** (Anodized obsidian palette, tabular monospace numerals, collapsible inspector modules, compact single-row active surface channel strip, and monochrome vector SVGs).

---

## 🧪 Validation & Testing Rules

Before submitting or committing changes:

1. **JavaScript Syntax Check**:
   Validate that `index.html` contains valid JavaScript:
   ```bash
   node -e '
   const fs = require("fs");
   const html = fs.readFileSync("lumamap-portable/static/index.html", "utf8");
   const m = html.match(/<script>([\s\S]*?)<\/script>/g);
   const script = m[m.length - 1].replace(/^<script>|<\/script>$/g, "");
   new Function(script);
   console.log("JS syntax check passed!");
   '
   ```
2. **Python Server Check**:
   Confirm `server.py` starts cleanly and passes syntax checks:
   ```bash
   python3 -m py_compile lumamap-portable/server.py
   ```
3. **Render Performance**:
   Ensure 60fps rendering without memory leaks (clean up object URLs, disconnect inactive media players, and reuse canvas rendering contexts).

---

## 📜 Legacy Reference: `control-panel/`

`control-panel/` was the previous Node/React reimplementation of VPT8. It is kept in the repository for reference.
If working in `control-panel/`:
- Server tests: `cd control-panel/server && node --test`
- Panel typecheck: `cd control-panel/panel && npx tsc --noEmit && npx eslint .`
- End-to-end: `cd control-panel/e2e && npx playwright test`
