import { createServer } from "node:http";

// Escape the five XML predefined entities so an interpolated VALUE (a friendly name, or a
// videoId a phone POSTed in the request body) can never break out of its element and emit
// malformed XML. A real YouTube id is `[A-Za-z0-9_-]{11}`, but the DIAL app-launch body is
// attacker-reachable on the LAN — a `v=` containing `<`/`&`/`"` used to corrupt the GET
// /apps/YouTube app-state response a strict sender then failed to parse. Exported for test.
export function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function deviceDescriptionXml({ friendlyName, uuid }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<root xmlns="urn:schemas-upnp-org:device-1-0" xmlns:dial="urn:dial-multiscreen-org:schemas:dial">
  <specVersion><major>1</major><minor>0</minor></specVersion>
  <device>
    <deviceType>urn:schemas-upnp-org:device:tvdevice:1</deviceType>
    <friendlyName>${xmlEscape(friendlyName)}</friendlyName>
    <manufacturer>vpt-modernization</manufacturer>
    <modelName>room-cast-receiver</modelName>
    <UDN>uuid:${xmlEscape(uuid)}</UDN>
    <dial:X_dialEver>1.7</dial:X_dialEver>
  </device>
</root>`;
}

export function appStateXml({ name, state, videoId }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<service xmlns="urn:dial-multiscreen-org:schemas:dial">
  <name>${xmlEscape(name)}</name>
  <options allowStop="true"/>
  <state>${xmlEscape(state)}</state>
  ${videoId ? `<additionalData><videoId>${xmlEscape(videoId)}</videoId></additionalData>` : ""}
</service>`;
}

function parseFormBody(raw) {
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

// DIAL app-launch bodies are tiny form posts (`v=<videoId>`); anything larger is junk or a
// memory-exhaustion attempt from a LAN client. Cap accumulation, and — crucially — settle
// the promise on EVERY terminal event (end / error / premature close), so an aborted POST
// can neither hang the awaiting handler forever nor reject with nobody catching it.
function readBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let size = 0;
    let settled = false;
    const settle = (fn, arg) => { if (settled) return; settled = true; fn(arg); };
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) { settle(reject, new Error("request body too large")); req.destroy(); return; }
      raw += chunk;
    });
    req.on("end", () => settle(resolve, raw));
    req.on("error", (err) => settle(reject, err));
    // A dropped connection (RST/ECONNRESET mid-body) may emit 'close' without 'end'; settle
    // so the awaiting handler never wedges on an unresolved promise.
    req.on("close", () => { if (!req.complete) settle(reject, new Error("connection closed before body complete")); });
  });
}

// onLaunch(videoId, extra) is called whenever a sender POSTs a video to /apps/YouTube —
// the caller (index.js) wires this to the control-plane's PiP cast HTTP endpoint.
export function createDialHttpServer({ friendlyName, uuid, applicationUrl, onLaunch, log = console.log }) {
  let current = { state: "stopped", videoId: null };

  return createServer(async (req, res) => {
    try {
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
        let raw;
        try {
          raw = await readBody(req);
        } catch (err) {
          // Aborted/oversized body: respond 400 (if we still can) instead of letting the
          // rejection escape the async handler and crash the receiver.
          log("[dial] failed to read request body:", err.message);
          if (!res.headersSent) { res.writeHead(400, { "content-type": "text/plain" }); res.end("bad request body"); }
          return;
        }
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
    } catch (err) {
      // Last-resort net: no request handler path should ever throw into the async
      // createServer callback (that becomes an unhandled rejection → process exit), so
      // catch everything and close the response.
      log("[dial] request handler error:", err?.message ?? err);
      try { if (!res.headersSent) res.writeHead(500); res.end(); } catch { /* socket already gone */ }
    }
  });
}
