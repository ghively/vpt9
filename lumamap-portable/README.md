# LumaMap Portable v2.5 — Simple Projection Mapping Studio & Wi-Fi Remote

A lightweight, zero-jargon projection mapping studio that maps **local video/GIF/image files**, **YouTube streams** (both YouTube Embed and ad-free **`yt-dlp`** direct streams), **Emby Media Server** libraries & active sessions, **60fps procedural shaders & solid mood lighting**, and **live cameras/capture cards** onto 3D perspective-warped surfaces with **feathered/invertible polygon cutouts** and **4-edge soft blending** — controlled in real time from your desktop or phone over local Wi-Fi.

## Quick Start

### Windows
Double-click `run.bat` (or run `python server.py` after `pip install -r requirements.txt`).

### macOS / Linux
```bash
chmod +x run.sh
./run.sh
```

## How to Use
1. **Studio Split View (`http://localhost:8080/`)**: Edit surfaces on the interactive Stage preview on the left while adjusting sources, corners, cutouts, and blends on the right.
2. **Projector Output (`http://localhost:8080/?mode=projector`)**: Click **↗ Projector Window** in the top bar (or open `?mode=projector` on the computer plugged into your projector), drag the window to your projector display, and press **`F`** for fullscreen.
   - The projector output is **100% chromeless** (`100vw × 100vh`) and stays completely free of editing pins unless you explicitly toggle **Wall Guides: ON** (`C`).
3. **Phone Remote (`http://<LAN-IP>:8080/?mode=remote`)**: Click **Phone Remote** in the top bar and scan the real QR code with your phone's camera on the same Wi-Fi.
4. **6 Visual Source Modes (`1. Source`)**:
   - **💬 Text / Clock**: Glowing neon signage, scrolling marquees, live digital clock & calendar date, and event countdown timers.
   - **📁 My Files**: Drag-and-drop or browse local `.mp4`, `.webm`, `.mov`, `.gif`, `.png`, `.jpg`, or `.webp` files from your computer or phone.
   - **▶️ YouTube**: Paste any YouTube link, tap a 1-click visual loop, or extract/cache an ad-free MP4 via `yt-dlp`.
   - **📺 Emby / URL**: Connect your Emby Server (URL + Username/Password or API Key) to search your library, tap **⚡ Pull "Now Playing"** to cast whatever is currently playing on an Emby app, or paste any direct stream URL.
   - **✨ Art / Color**: Choose from 7 built-in 60fps procedural shaders or use **Solid Color / Mood Wash Light** to light walls and objects with architectural color.
   - **📷 Camera**: Stream live from a webcam or USB HDMI capture card.
5. **Real-Time Audio Beat Reactivity**:
   - Tap **🎵 Video Sound** or **🎙️ Room Mic** to pulse surface brightness, kick subwoofer scale, and speed up visual shaders to room music with live VU metering.
6. **Layer Opacity & Fit Wall (`2. Fit Wall`)**:
   - Adjust layer opacity (0–100%) on the fly from the persistent surface header or blend controls.
   - Drag the 4 corners on the Stage, or use the **Thumb Trackpad** and **Fine Nudge** buttons on your phone while watching your wall.
   - Use **Frame Video Inside Surface** to zoom, pan, or rotate the video inside the mapped shape without moving your wall corners.
7. **Shape Cutout & Hole Punch (`3. Cutout`)**:
   - Stamp 1-tap shapes (`Rectangle`, `Archway`, `Hexagon`, `Triangle`, `Diamond`, `Circle/Octagon`) or drag custom polygon points.
   - Adjust **Cutout Edge Softness (Feather)** for smooth edges, or toggle **Invert (Punch Hole)** to mask *out* obstacles like windows, doors, or TVs.
7. **Multi-Scene Presets**:
   - Click **+ Save Current Scene** in the top Scenes bar to save multiple room setups and switch between them in 1 tap.
