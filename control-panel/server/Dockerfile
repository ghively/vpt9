FROM node:22-alpine

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
