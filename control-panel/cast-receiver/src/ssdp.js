import dgram from "node:dgram";

const SSDP_ADDRESS = "239.255.255.250";
const SSDP_PORT = 1900;
const DIAL_ST = "urn:dial-multiscreen-org:service:dial:1";

function buildSearchResponse({ location, uuid }) {
  return [
    "HTTP/1.1 200 OK",
    "CACHE-CONTROL: max-age=1800",
    `DATE: ${new Date().toUTCString()}`,
    "EXT:",
    `LOCATION: ${location}`,
    'OPT: "http://schemas.upnp.org/upnp/1/0/"; ns=01',
    "01-NLS: 1",
    `SERVER: Node/${process.version} UPnP/1.1 vpt-cast-receiver/0.1`,
    `ST: ${DIAL_ST}`,
    `USN: uuid:${uuid}::${DIAL_ST}`,
    "",
    "",
  ].join("\r\n");
}

function buildNotifyAlive({ location, uuid }) {
  return [
    "NOTIFY * HTTP/1.1",
    `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
    "CACHE-CONTROL: max-age=1800",
    `LOCATION: ${location}`,
    "NTS: ssdp:alive",
    `SERVER: Node/${process.version} UPnP/1.1 vpt-cast-receiver/0.1`,
    `NT: ${DIAL_ST}`,
    `USN: uuid:${uuid}::${DIAL_ST}`,
    "",
    "",
  ].join("\r\n");
}

// Starts the SSDP responder: answers M-SEARCH requests for the DIAL service type (so
// YouTube's phone app discovers this as a cast target) and periodically announces
// ssdp:alive so passive listeners pick it up without having to search first.
export function startSsdp({ deviceUrl, uuid, log = console.log }) {
  const location = `${deviceUrl}/dd.xml`;
  const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

  socket.on("message", (msg, rinfo) => {
    const text = msg.toString("utf8");
    if (!text.startsWith("M-SEARCH")) return;
    const st = /^ST:\s*(.+)$/im.exec(text)?.[1]?.trim();
    if (st && st !== DIAL_ST && st !== "ssdp:all" && st !== "upnp:rootdevice") return;

    const response = Buffer.from(buildSearchResponse({ location, uuid }));
    socket.send(response, rinfo.port, rinfo.address, (err) => {
      if (err) log(`[ssdp] failed to respond to ${rinfo.address}:${rinfo.port}:`, err.message);
    });
  });

  socket.on("error", (err) => log("[ssdp] socket error:", err.message));

  socket.bind(SSDP_PORT, () => {
    socket.addMembership(SSDP_ADDRESS);
    log(`[ssdp] listening on ${SSDP_ADDRESS}:${SSDP_PORT}, advertising ${location}`);
  });

  const notifyInterval = setInterval(() => {
    const notify = Buffer.from(buildNotifyAlive({ location, uuid }));
    socket.send(notify, SSDP_PORT, SSDP_ADDRESS, (err) => {
      if (err) log("[ssdp] notify send failed:", err.message);
    });
  }, 30_000);

  return () => {
    clearInterval(notifyInterval);
    socket.close();
  };
}
