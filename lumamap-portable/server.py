#!/usr/bin/env python3
"""
LumaMap Portable — Projection Mapping Studio Server (v2.5)
Provides:
  - Fullscreen Projector View, Studio Split View & Mobile Phone Remote UI over Wi-Fi
  - Real-time WebSocket synchronization (/ws) between Phone Remote(s), Studio, and Projector
  - Local Media Library (/api/media, /media/*) with HTTP Range support for video/GIF/image uploads
  - Multi-Scene / Look Presets storage (/api/scenes)
  - Emby Media Server integration (/api/emby/auth, /api/emby/items, /api/emby/now-playing)
  - Dual YouTube playback support:
      1) YouTube IFrame Embed API (client-side)
      2) Direct clean stream extraction & local MP4 caching via yt-dlp (/api/yt-stream, /api/yt-cache)
"""

import asyncio
import json
import mimetypes
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
CACHE_DIR = BASE_DIR / "cache"
MEDIA_DIR = BASE_DIR / "media"
STATE_FILE = BASE_DIR / "scenes.json"

CACHE_DIR.mkdir(exist_ok=True)
STATIC_DIR.mkdir(exist_ok=True)
MEDIA_DIR.mkdir(exist_ok=True)

ALLOWED_MEDIA_EXTENSIONS = {
    ".mp4": "video",
    ".webm": "video",
    ".mov": "video",
    ".m4v": "video",
    ".mkv": "video",
    ".gif": "gif",
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
    ".webp": "image",
    ".svg": "image",
}

try:
    import yt_dlp
    YT_DLP_AVAILABLE = True
except ImportError:
    YT_DLP_AVAILABLE = False

try:
    from fastapi import FastAPI, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response, StreamingResponse
    from fastapi.staticfiles import StaticFiles
    import uvicorn
except ImportError:
    print("Missing dependencies. Please run: pip install -r requirements.txt")
    sys.exit(1)


def get_lan_ip() -> str:
    """Detect the primary local Wi-Fi / LAN IPv4 address of this machine."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def extract_youtube_id(url_or_id: str) -> Optional[str]:
    """Extract 11-character YouTube video ID from any YouTube URL or ID string."""
    s = (url_or_id or "").strip()
    if re.match(r"^[a-zA-Z0-9_-]{11}$", s):
        return s
    patterns = [
        r"(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})",
    ]
    for pat in patterns:
        m = re.search(pat, s)
        if m:
            return m.group(1)
    return None


def sanitize_filename(name: str) -> str:
    """Convert a user-supplied filename into a safe filesystem stem."""
    stem = Path(name).stem
    clean = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip("-._")
    return (clean[:60] or "media")


def scan_media_library() -> List[Dict[str, Any]]:
    """Return metadata for all uploaded media files in MEDIA_DIR + cached YT videos."""
    items: List[Dict[str, Any]] = []
    if MEDIA_DIR.exists():
        for f in sorted(MEDIA_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
            if not f.is_file():
                continue
            ext = f.suffix.lower()
            kind = ALLOWED_MEDIA_EXTENSIONS.get(ext)
            if not kind:
                continue
            stat = f.stat()
            # Display name removes leading timestamp prefix if present
            display_name = re.sub(r"^\d{10,13}_", "", f.name)
            items.append({
                "id": f.name,
                "name": display_name,
                "filename": f.name,
                "url": f"/media/{urllib.parse.quote(f.name)}",
                "kind": kind,
                "size": stat.st_size,
                "uploadedAt": int(stat.st_mtime * 1000),
            })
    return items


def load_persisted_data() -> Dict[str, Any]:
    if STATE_FILE.exists():
        try:
            raw = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            if isinstance(raw, dict):
                # Support both legacy format (direct state dict) and v2.5 format ({state, scenes})
                if "panels" in raw and "state" not in raw:
                    return {"state": raw, "scenes": raw.get("scenes", [])}
                return {
                    "state": raw.get("state", {}),
                    "scenes": raw.get("scenes", []),
                }
        except Exception:
            pass
    return {"state": {}, "scenes": []}


def save_persisted_data(state: Dict[str, Any], scenes: List[Dict[str, Any]]) -> None:
    try:
        payload = {"state": state, "scenes": scenes}
        STATE_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    except Exception as exc:
        print(f"[warn] Could not save state to {STATE_FILE}: {exc}")


app = FastAPI(title="LumaMap Portable Projection Mapping Studio", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/cache", StaticFiles(directory=str(CACHE_DIR)), name="cache")


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Set[WebSocket] = set()
        persisted = load_persisted_data()
        self.current_state: Dict[str, Any] = persisted.get("state", {})
        self.saved_scenes: List[Dict[str, Any]] = persisted.get("scenes", [])

    def persist(self) -> None:
        save_persisted_data(self.current_state, self.saved_scenes)

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)
        await websocket.send_text(
            json.dumps({
                "type": "init_bundle",
                "state": self.current_state if self.current_state else None,
                "scenes": self.saved_scenes,
                "media": scan_media_library(),
                "clients": len(self.active_connections),
            })
        )
        await self.broadcast_client_count()

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)

    async def broadcast_client_count(self) -> None:
        msg = json.dumps({"type": "clients_count", "clients": len(self.active_connections)})
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_text(msg)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.active_connections.discard(d)

    async def broadcast(self, message: Dict[str, Any], sender: Optional[WebSocket] = None) -> None:
        msg_type = message.get("type")
        if msg_type == "sync_state" and isinstance(message.get("state"), dict):
            self.current_state = message["state"]
            self.persist()
        elif msg_type == "scenes_updated" and isinstance(message.get("scenes"), list):
            self.saved_scenes = message["scenes"]
            self.persist()

        payload = json.dumps(message)
        dead = []
        for conn in self.active_connections:
            if conn is sender:
                continue
            try:
                await conn.send_text(payload)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.active_connections.discard(d)


manager = ConnectionManager()


@app.get("/", response_class=HTMLResponse)
async def index() -> FileResponse:
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="static/index.html not found")
    return FileResponse(index_path, headers={"Cache-Control": "no-cache"})


@app.get("/api/info")
async def api_info(request: Request) -> JSONResponse:
    lan_ip = get_lan_ip()
    port = request.url.port or 8080
    cached_files = [f.stem for f in CACHE_DIR.glob("*.mp4")]
    return JSONResponse({
        "lan_ip": lan_ip,
        "port": port,
        "projector_url": f"http://{lan_ip}:{port}/?mode=projector",
        "remote_url": f"http://{lan_ip}:{port}/?mode=remote",
        "studio_url": f"http://{lan_ip}:{port}/",
        "yt_dlp_available": YT_DLP_AVAILABLE,
        "cached_videos": cached_files,
        "media_count": len(scan_media_library()),
        "connected_clients": len(manager.active_connections),
    })


@app.get("/api/state")
async def get_state() -> JSONResponse:
    return JSONResponse({
        "state": manager.current_state,
        "scenes": manager.saved_scenes,
        "media": scan_media_library(),
    })


@app.post("/api/state")
async def post_state(request: Request) -> JSONResponse:
    body = await request.json()
    state = body.get("state", body)
    if isinstance(state, dict):
        manager.current_state = state
    if isinstance(body.get("scenes"), list):
        manager.saved_scenes = body["scenes"]
    manager.persist()
    await manager.broadcast({"type": "sync_state", "state": manager.current_state})
    return JSONResponse({"ok": True})


# ============================================================================
# MULTI-SCENE PRESETS ENDPOINTS
# ============================================================================
@app.get("/api/scenes")
async def get_scenes() -> JSONResponse:
    return JSONResponse({"scenes": manager.saved_scenes})


@app.post("/api/scenes")
async def save_scene(request: Request) -> JSONResponse:
    body = await request.json()
    name = (body.get("name") or "Custom Scene").strip()
    panels = body.get("panels")
    if not isinstance(panels, list) or len(panels) == 0:
        raise HTTPException(status_code=400, detail="Scene must include panels array")

    scene_id = body.get("id") or f"scene-{int(time.time() * 1000)}"
    new_scene = {
        "id": scene_id,
        "name": name,
        "updatedAt": int(time.time() * 1000),
        "masterBrightness": body.get("masterBrightness", 100),
        "panels": panels,
        "masks": body.get("masks", []),
    }

    existing_idx = next((i for i, s in enumerate(manager.saved_scenes) if s.get("id") == scene_id), -1)
    if existing_idx >= 0:
        manager.saved_scenes[existing_idx] = new_scene
    else:
        manager.saved_scenes.append(new_scene)

    manager.persist()
    await manager.broadcast({"type": "scenes_updated", "scenes": manager.saved_scenes})
    return JSONResponse({"ok": True, "scene": new_scene, "scenes": manager.saved_scenes})


@app.delete("/api/scenes/{scene_id}")
async def delete_scene(scene_id: str) -> JSONResponse:
    manager.saved_scenes = [s for s in manager.saved_scenes if s.get("id") != scene_id]
    manager.persist()
    await manager.broadcast({"type": "scenes_updated", "scenes": manager.saved_scenes})
    return JSONResponse({"ok": True, "scenes": manager.saved_scenes})


# ============================================================================
# LOCAL MEDIA LIBRARY UPLOAD & STREAMING WITH HTTP RANGE SUPPORT
# ============================================================================
@app.get("/api/media")
async def list_media() -> JSONResponse:
    return JSONResponse({"media": scan_media_library()})


@app.post("/api/media")
async def upload_media(request: Request) -> JSONResponse:
    raw_name = request.headers.get("x-file-name") or request.query_params.get("filename") or "upload.mp4"
    raw_name = urllib.parse.unquote(raw_name)
    ext = Path(raw_name).suffix.lower()
    if ext not in ALLOWED_MEDIA_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_MEDIA_EXTENSIONS.keys()))}"
        )

    safe_stem = sanitize_filename(raw_name)
    filename = f"{int(time.time() * 1000)}_{safe_stem}{ext}"
    dest_path = MEDIA_DIR / filename

    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Empty file body")

    dest_path.write_bytes(body)
    media_list = scan_media_library()
    created = next((m for m in media_list if m["filename"] == filename), None)
    await manager.broadcast({"type": "media_updated", "media": media_list})
    return JSONResponse({"ok": True, "item": created, "media": media_list})


@app.delete("/api/media/{filename}")
async def delete_media(filename: str) -> JSONResponse:
    safe_name = Path(urllib.parse.unquote(filename)).name
    target = MEDIA_DIR / safe_name
    if target.exists() and target.is_file():
        target.unlink()
    media_list = scan_media_library()
    await manager.broadcast({"type": "media_updated", "media": media_list})
    return JSONResponse({"ok": True, "media": media_list})


@app.post("/api/media/import-url")
async def import_media_by_url(request: Request) -> JSONResponse:
    """Download a direct video/GIF/image URL or any yt-dlp supported video URL into MEDIA_DIR."""
    body = await request.json()
    url = (body.get("url") or "").strip()
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="Please provide a valid http:// or https:// URL")

    parsed_path = urllib.parse.urlparse(url).path
    ext = Path(parsed_path).suffix.lower()
    ts = int(time.time() * 1000)

    if ext in ALLOWED_MEDIA_EXTENSIONS:
        stem = sanitize_filename(Path(parsed_path).name)
        filename = f"{ts}_{stem}{ext}"
        dest_path = MEDIA_DIR / filename

        def _download_direct() -> None:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 LumaMap/2.6"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                dest_path.write_bytes(resp.read())

        try:
            await asyncio.to_thread(_download_direct)
            media_list = scan_media_library()
            created = next((m for m in media_list if m["filename"] == filename), None)
            await manager.broadcast({"type": "media_updated", "media": media_list})
            return JSONResponse({"ok": True, "item": created, "media": media_list})
        except Exception as exc:
            if dest_path.exists():
                dest_path.unlink()
            raise HTTPException(status_code=502, detail=f"Direct download failed: {exc}")

    if not YT_DLP_AVAILABLE:
        raise HTTPException(status_code=501, detail="yt-dlp is required to import streaming site links")

    def _download_ytdlp() -> str:
        out_tmpl = str(MEDIA_DIR / f"{ts}_%(title).45B.%(ext)s")
        ydl_opts = {
            "format": "best[ext=mp4][height<=1080]/bestvideo[ext=mp4][height<=1080]/best/bestvideo",
            "outtmpl": out_tmpl,
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "restrictfilenames": True,
            "merge_output_format": "mp4",
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            prepared = ydl.prepare_filename(info)
            p = Path(prepared)
            if not p.exists():
                mp4_p = p.with_suffix(".mp4")
                if mp4_p.exists():
                    return mp4_p.name
            return p.name

    try:
        saved_fname = await asyncio.to_thread(_download_ytdlp)
        media_list = scan_media_library()
        created = next((m for m in media_list if m["filename"] == saved_fname), media_list[0] if media_list else None)
        await manager.broadcast({"type": "media_updated", "media": media_list})
        return JSONResponse({"ok": True, "item": created, "media": media_list})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Video link import failed: {exc}")



@app.get("/media/{filename}")
async def serve_media(filename: str, request: Request) -> Response:
    safe_name = Path(urllib.parse.unquote(filename)).name
    file_path = MEDIA_DIR / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Media file not found")

    file_size = file_path.stat().st_size
    content_type, _ = mimetypes.guess_type(str(file_path))
    content_type = content_type or "application/octet-stream"

    range_header = request.headers.get("range")
    if range_header:
        m = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if m:
            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else file_size - 1
            end = min(end, file_size - 1)
            if start <= end and start < file_size:
                length = end - start + 1
                with open(file_path, "rb") as f:
                    f.seek(start)
                    data = f.read(length)
                headers = {
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(length),
                    "Access-Control-Allow-Origin": "*",
                }
                return Response(content=data, status_code=206, media_type=content_type, headers=headers)

    return FileResponse(
        file_path,
        media_type=content_type,
        headers={"Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*"},
    )


# ============================================================================
# EMBY MEDIA SERVER INTEGRATION (BROWSE, STREAM & CAST/NOW-PLAYING)
# ============================================================================
def _emby_request(url: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None, token: str = "") -> Any:
    headers = {
        "Accept": "application/json",
        "X-Emby-Authorization": (
            'MediaBrowser Client="LumaMap Studio", Device="LumaMap Projector", '
            'DeviceId="lumamap-studio-v2", Version="2.5.0"'
        ),
    }
    if token:
        headers["X-Emby-Token"] = token
    data_bytes = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data_bytes = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=8) as resp:
        return json.loads(resp.read().decode("utf-8"))


@app.post("/api/emby/auth")
async def emby_auth(request: Request) -> JSONResponse:
    """Authenticate with an Emby Server using Username/Password or verify an API Key."""
    body = await request.json()
    server_url = (body.get("serverUrl") or "").strip().rstrip("/")
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    api_key = (body.get("apiKey") or "").strip()

    if not server_url:
        raise HTTPException(status_code=400, detail="Emby Server URL is required (e.g. http://192.168.1.50:8096)")
    if not server_url.startswith("http://") and not server_url.startswith("https://"):
        server_url = "http://" + server_url

    try:
        if api_key:
            info = await asyncio.to_thread(
                _emby_request, f"{server_url}/System/Info?api_key={ urllib.parse.quote(api_key) }", "GET", None, api_key
            )
            users = await asyncio.to_thread(
                _emby_request, f"{server_url}/Users?api_key={ urllib.parse.quote(api_key) }", "GET", None, api_key
            )
            first_user_id = users[0]["Id"] if isinstance(users, list) and users else ""
            return JSONResponse({
                "ok": True,
                "serverUrl": server_url,
                "token": api_key,
                "userId": first_user_id,
                "serverName": info.get("ServerName", "Emby Server"),
            })
        else:
            auth_res = await asyncio.to_thread(
                _emby_request,
                f"{server_url}/Users/AuthenticateByName",
                "POST",
                {"Username": username, "Pw": password},
            )
            token = auth_res.get("AccessToken", "")
            user = auth_res.get("User", {})
            return JSONResponse({
                "ok": True,
                "serverUrl": server_url,
                "token": token,
                "userId": user.get("Id", ""),
                "userName": user.get("Name", username),
                "serverName": auth_res.get("ServerId", "Emby Server"),
            })
    except urllib.error.HTTPError as exc:
        raise HTTPException(status_code=exc.code, detail=f"Emby auth rejected ({exc.code}): check URL, username, or password")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach Emby server at {server_url}: {exc}")


@app.get("/api/emby/items")
async def emby_items(
    serverUrl: str = Query(...),
    token: str = Query(...),
    userId: str = Query(""),
    q: str = Query(""),
) -> JSONResponse:
    """List or search playable video items from an Emby server."""
    base = serverUrl.strip().rstrip("/")
    params = {
        "Recursive": "true",
        "IncludeItemTypes": "Movie,Episode,Video,MusicVideo",
        "SortBy": "DateCreated,SortName",
        "SortOrder": "Descending",
        "Limit": "36",
        "Fields": "Overview,RunTimeTicks,MediaSources",
        "api_key": token,
    }
    if q.strip():
        params["SearchTerm"] = q.strip()

    query_str = urllib.parse.urlencode(params)
    endpoint = f"{base}/Users/{urllib.parse.quote(userId)}/Items?{query_str}" if userId else f"{base}/Items?{query_str}"

    try:
        data = await asyncio.to_thread(_emby_request, endpoint, "GET", None, token)
        raw_items = data.get("Items", []) if isinstance(data, dict) else []
        results = []
        for item in raw_items:
            item_id = item.get("Id")
            if not item_id:
                continue
            name = item.get("Name", "Untitled")
            series = item.get("SeriesName")
            if series:
                name = f"{series} — {name}"
            stream_url = f"{base}/Videos/{item_id}/stream.mp4?Static=true&api_key={urllib.parse.quote(token)}"
            thumb_url = f"{base}/Items/{item_id}/Images/Primary?maxWidth=320&quality=80&api_key={urllib.parse.quote(token)}"
            results.append({
                "id": item_id,
                "name": name,
                "type": item.get("Type", "Video"),
                "year": item.get("ProductionYear"),
                "streamUrl": stream_url,
                "thumbUrl": thumb_url,
            })
        return JSONResponse({"ok": True, "items": results})
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to query Emby library: {exc}")


@app.get("/api/emby/now-playing")
async def emby_now_playing(
    serverUrl: str = Query(...),
    token: str = Query(...),
) -> JSONResponse:
    """Check active Emby sessions so a user playing a video on any Emby app can 1-tap cast/pull it into LumaMap."""
    base = serverUrl.strip().rstrip("/")
    endpoint = f"{base}/Sessions?api_key={urllib.parse.quote(token)}"
    try:
        sessions = await asyncio.to_thread(_emby_request, endpoint, "GET", None, token)
        active = []
        if isinstance(sessions, list):
            for sess in sessions:
                now_item = sess.get("NowPlayingItem")
                if now_item and now_item.get("Id"):
                    item_id = now_item["Id"]
                    title = now_item.get("Name", "Emby Stream")
                    if now_item.get("SeriesName"):
                        title = f"{now_item['SeriesName']} — {title}"
                    pos_ticks = sess.get("PlayState", {}).get("PositionTicks") or 0
                    start_sec = int(pos_ticks / 10_000_000)
                    active.append({
                        "sessionId": sess.get("Id"),
                        "client": sess.get("Client", "Emby App"),
                        "deviceName": sess.get("DeviceName", "Device"),
                        "userName": sess.get("UserName", ""),
                        "itemId": item_id,
                        "title": title,
                        "startOffset": start_sec,
                        "streamUrl": f"{base}/Videos/{item_id}/stream.mp4?Static=true&api_key={urllib.parse.quote(token)}",
                        "thumbUrl": f"{base}/Items/{item_id}/Images/Primary?maxWidth=320&api_key={urllib.parse.quote(token)}",
                    })
        return JSONResponse({"ok": True, "sessions": active})
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not query Emby sessions: {exc}")


# ============================================================================
# YOUTUBE YT-DLP DIRECT STREAM & CACHE ENDPOINTS
# ============================================================================
YT_STREAM_MEMORY_CACHE: Dict[str, Dict[str, Any]] = {}


@app.get("/api/yt-stream")
async def yt_stream(url: str = Query(..., description="YouTube URL or Video ID")) -> JSONResponse:
    """Resolve a clean direct MP4 stream URL via yt-dlp (or serve from local cache if cached)."""
    vid = extract_youtube_id(url)
    if not vid:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or Video ID")

    cached_mp4 = CACHE_DIR / f"{vid}.mp4"
    if cached_mp4.exists():
        return JSONResponse({
            "video_id": vid,
            "stream_url": f"/cache/{vid}.mp4",
            "cached": True,
            "title": f"Cached Video ({vid})",
        })

    now_ts = time.time()
    mem_hit = YT_STREAM_MEMORY_CACHE.get(vid)
    if mem_hit and (now_ts - mem_hit.get("ts", 0)) < 3600:
        return JSONResponse(mem_hit["payload"])

    if not YT_DLP_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="yt-dlp is not installed. Run `pip install yt-dlp` or switch panel to IFrame mode."
        )

    canonical_url = f"https://www.youtube.com/watch?v={vid}"
    ydl_opts = {
        "format": "best[ext=mp4][height<=1080][protocol^=http]/bestvideo[ext=mp4][height<=1080][protocol^=http]/best[ext=mp4]/bestvideo[ext=mp4]/best/bestvideo",
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
    }

    def _extract() -> Dict[str, Any]:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(canonical_url, download=False)
            stream_url = info.get("url")
            if not stream_url and info.get("formats"):
                mp4s = [
                    f for f in info["formats"]
                    if f.get("ext") == "mp4" and f.get("url") and f.get("vcodec") != "none"
                ]
                if mp4s:
                    stream_url = mp4s[-1]["url"]
            return {
                "video_id": vid,
                "stream_url": stream_url,
                "cached": False,
                "title": info.get("title", vid),
                "duration": info.get("duration", 0),
                "thumbnail": info.get("thumbnail", ""),
            }

    try:
        data = await asyncio.to_thread(_extract)
        if not data.get("stream_url"):
            raise HTTPException(status_code=502, detail="Could not resolve direct stream URL")
        YT_STREAM_MEMORY_CACHE[vid] = {"ts": now_ts, "payload": data}
        return JSONResponse(data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"yt-dlp extraction failed: {exc}")


@app.post("/api/yt-cache")
async def yt_cache(request: Request) -> JSONResponse:
    """Download a YouTube video via yt-dlp into ./cache/<id>.mp4 for seamless local looping."""
    body = await request.json()
    url = body.get("url", "")
    vid = extract_youtube_id(url)
    if not vid:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or Video ID")

    cached_mp4 = CACHE_DIR / f"{vid}.mp4"
    if cached_mp4.exists():
        return JSONResponse({
            "video_id": vid,
            "stream_url": f"/cache/{vid}.mp4",
            "cached": True,
            "title": f"Cached ({vid})",
        })

    if not YT_DLP_AVAILABLE:
        raise HTTPException(status_code=501, detail="yt-dlp is not installed on the server.")

    canonical_url = f"https://www.youtube.com/watch?v={vid}"
    ydl_opts = {
        "format": "best[ext=mp4][height<=1080]/bestvideo[ext=mp4][height<=1080]/best/bestvideo",
        "outtmpl": str(cached_mp4),
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "merge_output_format": "mp4",
    }

    def _download() -> Dict[str, Any]:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(canonical_url, download=True)
            return {
                "video_id": vid,
                "stream_url": f"/cache/{vid}.mp4",
                "cached": True,
                "title": info.get("title", vid),
            }

    try:
        data = await asyncio.to_thread(_download)
        await manager.broadcast({"type": "cache_ready", "data": data})
        return JSONResponse(data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"yt-dlp download failed: {exc}")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except Exception:
                continue
            await manager.broadcast(message, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast_client_count()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    lan_ip = get_lan_ip()
    print("\n" + "=" * 66)
    print("  LumaMap Portable v2.5 — Projection Mapping Studio")
    print("=" * 66)
    print(f"  Studio Split View:       http://localhost:{port}/")
    print(f"  Projector Output View:   http://localhost:{port}/?mode=projector")
    print(f"  Phone Remote (Wi-Fi):    http://{lan_ip}:{port}/?mode=remote")
    print(f"  yt-dlp Direct Engine:    {'ENABLED' if YT_DLP_AVAILABLE else 'NOT INSTALLED (IFrame fallback)'}")
    print("=" * 66 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
