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

When prompted to implement upcoming features, refer to these prioritized items:

1. **Audio-Reactive / Microphone Beat Pulse**:
   - Add real-time Web Audio API `AudioContext` and `AnalyserNode` in `index.html`.
   - Provide a 1-tap "React to Music (Mic)" toggle.
   - Modulate surface brightness, scale/zoom, or procedural shader speeds based on low-frequency (bass) energy.
2. **Built-in Text, Signage & Live Clock Overlay Source**:
   - Add a 5th source tab to the surface inspector.
   - Render customizable glowing neon text, scrolling marquees, or digital countdowns to an offscreen canvas and pipe as a surface texture.
3. **Auto-Show / Ambient Scene Sequencer**:
   - Add an auto-play timer in the Room Scenes drawer to cycle through saved scenes every $N$ minutes with smooth interpolation.
4. **Prompt-Based "Vibez" (AI Room Theme Generator)**:
   - Provide prompt-driven scene composition where a user prompt (e.g. "cyberpunk alley", "lo-fi study", "mystic forest") automatically configures harmonious shader colors, loops, and surface layouts.
5. **AI Auto-Room Mapping via Camera / Webcam**:
   - Camera-based automatic edge/corner detection to detect walls, framed art, and doors, auto-generating aligned polygon surfaces.

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
