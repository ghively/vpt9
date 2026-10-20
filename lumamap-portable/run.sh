#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
    echo "[LumaMap] Creating portable Python virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate
echo "[LumaMap] Checking dependencies (FastAPI, Uvicorn, yt-dlp)..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo "[LumaMap] Starting LumaMap Portable Server..."
python3 server.py
