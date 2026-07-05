import { startSsdp } from "./ssdp.js";
import { createDialHttpServer } from "./dial-http.js";

const PORT = Number(process.env.PORT || 8090);
const HOST = process.env.HOST || "0.0.0.0";
const ADVERTISE_HOST = process.env.CAST_RECEIVER_HOST || "localhost";
const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || "http://localhost:8080";
const PIP_ID = process.env.PIP_ID || "pip-1";
const FRIENDLY_NAME = process.env.FRIENDLY_NAME || "Room Cast";
// Fixed by default (not random) so this device keeps the same identity across restarts —
// real DIAL senders otherwise treat a new UUID as a brand-new, never-before-seen device.
// Must be a syntactically valid UUID (hex only): strict senders validate the UDN format.
const DEVICE_UUID = process.env.DEVICE_UUID || "6f9d2e1a-6b7e-4b6b-9d9a-1c3e5a7b9d0f";

const deviceUrl = `http://${ADVERTISE_HOST}:${PORT}`;

async function onLaunch(videoId) {
  const res = await fetch(`${CONTROL_PLANE_URL}/api/pip/${encodeURIComponent(PIP_ID)}/cast`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ videoId, title: "Cast from phone" }),
  });
  if (!res.ok) throw new Error(`control-plane responded ${res.status}`);
}

const httpServer = createDialHttpServer({
  friendlyName: FRIENDLY_NAME,
  uuid: DEVICE_UUID,
  applicationUrl: `${deviceUrl}/apps/`,
  onLaunch,
});

httpServer.listen(PORT, HOST, () => {
  console.log(`[cast-receiver] DIAL HTTP endpoints on ${deviceUrl} (dd.xml, /apps/YouTube)`);
});

startSsdp({ deviceUrl, uuid: DEVICE_UUID });
