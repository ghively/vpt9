# LumaMap Portable v3.0 — AI Projection Mapping Studio & Wi-Fi Remote

A lightweight, zero-jargon projection mapping studio that maps **local video/GIF/image files**, **YouTube streams** (both YouTube Embed and ad-free **`yt-dlp`** direct streams), **Emby Media Server** libraries & active sessions, **11 60fps procedural shaders & solid mood lighting**, and **live cameras/capture cards** onto 3D perspective-warped surfaces with **feathered/invertible polygon cutouts** and **4-edge soft blending** — featuring **AI Room Theme Generation ("Vibez")**, **AI Camera Auto-Mapping**, and an **Auto-Show Ambient Scene Sequencer**, controlled in real time from your desktop or phone over local Wi-Fi.

## Quick Start

### Windows
Double-click `run.bat` (or run `python server.py` after `pip install -r requirements.txt`).

### macOS / Linux
```bash
chmod +x run.sh
./run.sh
```

## How to Use
1. **Studio Split View (`http://localhost:8080/`)**: Edit surfaces on the interactive Stage preview on the left while adjusting sources, corners, cutouts, and blends in the 5-tab inspector on the right.
2. **Projector Output (`http://localhost:8080/?mode=projector`)**: Click **↗ Projector Out** in the top bar (or open `?mode=projector` on the computer plugged into your projector), drag the window to your projector display, and press **`F`** for fullscreen.
   - The projector output is **100% chromeless** (`100vw × 100vh`) and stays completely free of editing pins unless you explicitly toggle **Wall Guides: ON** (`C`).
3. **Phone Remote (`http://<LAN-IP>:8080/?mode=remote`)**: Click **Remote QR** in the top bar and scan the real QR code with your phone's camera on the same Wi-Fi.
4. **5-Tab Workflow Navigation**:
   - **`1. Source`**: Pick what plays on the surface (Files, YouTube, Emby, 11 Shaders, Live Camera, Dynamic Glowing Neon Text / Scrolling Marquees / Live Clock & Event Countdown). Includes timeline scrub bar, loop trimming, and surface playlist queues.
   - **`2. Fit Wall`**: 4-Corner perspective warping with thumb trackpad, fine nudge buttons, video pan/zoom/rotate framing, tile grids, and 1-tap **⌖ AI Camera Scan**.
   - **`3. Cutout`**: 1-tap geometric shape cutouts, vector polygon editor, edge feathering, invert hole-punching, and global **Keep-Out Masks** to black out TVs, doors, and windows across all surfaces.
   - **`4. Blend`**: Independent 4-edge soft feathering with gamma correction, screen/add/multiply blend modes, surface opacity faders, and color grading (brightness, contrast, saturation, hue).
   - **`5. ✦ AI & Auto`**: Dedicated AI & automation hub:
     - **✦ Prompt-Based "Vibez" AI Room Theme Generator**: Type a natural language prompt (e.g. *"cyberpunk alley"*, *"lo-fi study"*, *"mystic forest"*) or click one of 10 mood chips to synthesize whole-room visual themes. Toggle **`🔒 Keep Wall Map`** to preserve calibrated geometry.
     - **⌖ AI Camera Room Auto-Mapper**: In-browser computer vision scanner using Sobel gradients, adaptive thresholding, and contour tracing to detect physical walls, frames, and TVs from a webcam or photo.
     - **⟳ Auto-Show / Ambient Scene Sequencer**: Hands-free interval timer (`10s`–`10m`) that cycles saved scenes with smooth multi-property scene morphing across corners, cutouts, blend, and colors.
5. **Real-Time Audio Beat Reactivity**:
   - Tap **🎵 Video Sound** or **🎙️ Room Mic** to pulse surface brightness, kick subwoofer scale, and speed up visual shaders to room music with live VU metering.
6. **Multi-Scene Presets**:
   - Click **+ Save** in the top Scenes bar to store unlimited room looks, or click any of the 12 built-in one-tap architectural scene templates.
