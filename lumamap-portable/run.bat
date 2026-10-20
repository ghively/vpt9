@echo off
cd /d "%~dp0"

if not exist ".venv" (
    echo [LumaMap] Creating portable Python virtual environment...
    python -m venv .venv
)

call .venv\Scripts\activate.bat
echo [LumaMap] Checking dependencies (FastAPI, Uvicorn, yt-dlp)...
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo [LumaMap] Starting LumaMap Portable Server...
python server.py
pause
