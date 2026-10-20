# CLAUDE.md

This file provides architectural context, rules, and development guidelines for Claude and other AI coding assistants.

---

## 🎯 Current Project Structure & Focus

The primary active application in this repository is **LumaMap Studio** located in [`lumamap-portable/`](lumamap-portable/).

### Repository Overview

- **`lumamap-portable/`**: Active portable projection mapping suite (Python backend + HTML5/Canvas/WebGL front-end).
  - `server.py`: FastAPI server, WebSocket synchronization hub, media manager, and `yt-dlp` stream extraction.
  - `static/index.html`: Unified UI containing Studio Split View, Projector Output (`?mode=projector`), and Mobile Remote (`?mode=remote`).
  - `cache/`: Cached seamless HD VJ loops.
- **`lumamap_studio_v2.html`**: Standalone single-file HTML5 distribution.
- **`control-panel/`**: Legacy reference (Node/React/WebGL2 reimplementation of VPT8). Kept for reference.

---

## 🧭 Guidelines for AI Assistants

### Modifying LumaMap Studio
1. **Front-End Work**: Edit [`lumamap-portable/static/index.html`](lumamap-portable/static/index.html).
2. **Backend Work**: Edit [`lumamap-portable/server.py`](lumamap-portable/server.py).
3. **Always Sync Single-File & Bundle**:
   - `cp lumamap-portable/static/index.html lumamap_studio_v2.html`
   - `cd lumamap-portable && zip -q -r ../lumamap_portable_v2.zip server.py requirements.txt README.md static/ cache/`

### Verification & Validation Checks
- **Validate JS**:
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
- **Validate Python**:
  ```bash
  python3 -m py_compile lumamap-portable/server.py
  ```

---

## 🚦 Roadmap

### ✅ Completed
- **Built-in Text / Signage / Clock Source**: 6th source tab for glowing neon signs, marquees, live clock & date, and event countdowns.
- **Dual-Source Audio Reactivity**: Internal video audio + room mic FFT analyzer with kick brightness and scale modulation.
- **Persistent Layer Opacity Controls**: Quick-access 0–100% layer fader in surface header.

### ⏳ Upcoming Priorities
1. **Auto-Show / Scene Sequencer**: Automated scene switcher that morphs between saved looks on a timer.
2. **Prompt-Based "Vibez" (AI Room Theme Generator)**: Natural language prompt-to-scene generator for ambient shaders, mood wash colors, and video playlists.
3. **AI Auto-Room Mapping**: Webcam/camera edge-detection to automatically find frames, walls, and corners and map surfaces onto them.
