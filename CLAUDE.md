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

1. **Audio-Reactive Mode**: Web Audio API FFT analysis of room mic to pulse surface brightness/zoom/feathering.
2. **Built-in Text / Clock Source**: 5th source tab for live glowing signage, ticker marquees, and digital clocks.
3. **Auto-Show / Scene Sequencer**: Automated scene switcher that morphs between saved looks on a timer.
