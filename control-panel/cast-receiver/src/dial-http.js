import { createServer } from "node:http";

function deviceDescriptionXml({ friendlyName, uuid }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<root xmlns="urn:schemas-upnp-org:device-1-0" xmlns:dial="urn:dial-multiscreen-org:schemas:dial">
  <specVersion><major>1</major><minor>0</minor></specVersion>
  <device>
    <deviceType>urn:schemas-upnp-org:device:tvdevice:1</deviceType>
    <friendlyName>${friendlyName}</friendlyName>
    <manufacturer>vpt-modernization</manufacturer>
    <modelName>room-cast-receiver</modelName>
    <UDN>uuid:${uuid}</UDN>
    <dial:X_dialEver>1.7</dial:X_dialEver>
  </device>
</root>`;
}

function appStateXml({ name, state, videoId }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<service xmlns="urn:dial-multiscreen-org:schemas:dial">
  <name>${name}</name>
  <options allowStop="true"/>
  <state>${state}</state>
  ${videoId ? `<additionalData><videoId>${videoId}</videoId></additionalData>` : ""}
</service>`;
}

function parseFormBody(raw) {
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

// onLaunch(videoId, extra) is called whenever a sender POSTs a video to /apps/YouTube —
// the caller (index.js) wires this to the control-plane's PiP cast HTTP endpoint.
export function createDialHttpServer({ friendlyName, uuid, applicationUrl, onLaunch, log = console.log }) {
  let current = { state: "stopped", videoId: null };

  return createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/dd.xml") {
      res.writeHead(200, {
        "content-type": "application/xml",
        "Application-URL": applicationUrl,
      });
      res.end(deviceDescriptionXml({ friendlyName, uuid }));
      return;
    }

    if (req.url === "/apps/YouTube") {
      if (req.method === "GET") {
        res.writeHead(200, { "content-type": "application/xml" });
        res.end(appStateXml({ name: "YouTube", state: current.state, videoId: current.videoId }));
        return;
      }
      if (req.method === "POST") {
        const raw = await readBody(req);
        const body = parseFormBody(raw);
        const videoId = body.v;
        if (!videoId) {
          res.writeHead(400, { "content-type": "text/plain" });
          res.end("missing v= (video id) in request body");
          return;
        }
        current = { state: "running", videoId };
        log(`[dial] YouTube app launched with video "${videoId}"`);
        try {
          await onLaunch(videoId, body);
        } catch (err) {
          log("[dial] onLaunch handler failed:", err.message);
        }
        res.writeHead(201, { "content-type": "text/plain", Location: `${applicationUrl}YouTube/run` });
        res.end();
        return;
      }
      if (req.method === "DELETE") {
        current = { state: "stopped", videoId: null };
        res.writeHead(200);
        res.end();
        return;
      }
    }

    res.writeHead(404);
    res.end();
  });
}
