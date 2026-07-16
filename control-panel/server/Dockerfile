FROM node:22-alpine

# Import-by-link (server/src/media-import.js): yt-dlp downloads streaming-site links
# (YouTube etc.) into the media library, and ffmpeg lets it merge best-video+best-audio
# formats when no single-file mp4 exists. Adds ~150 MB (python + ffmpeg) — without them
# the feature degrades gracefully to direct .mp4/.gif/.jpg links only.
# exiftool: tags live IN the media files as XMP-dc:Subject (server/src/media-tags.js) —
# read at upload/import, written back on panel tag edits. ~15 MB (perl).
RUN apk add --no-cache yt-dlp ffmpeg exiftool

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

ENV PORT=8080
ENV STATE_FILE=/data/state.json
ENV MEDIA_DIR=/data/media
VOLUME ["/data"]

EXPOSE 8080
CMD ["node", "src/index.js"]
