FROM node:22-alpine

WORKDIR /app
COPY package.json ./
COPY src ./src

ENV PORT=8090
EXPOSE 8090
# SSDP discovery relies on UDP multicast, which needs the container to actually live on
# the LAN (see docker-compose.yml's `network_mode: host` for this service) — a normal
# bridged Docker network won't let phones on the LAN discover this device.
EXPOSE 1900/udp

CMD ["node", "src/index.js"]
