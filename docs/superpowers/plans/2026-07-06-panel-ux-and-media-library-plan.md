# Panel UX Overhaul + Media Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a server-side media library (upload/serve/delete mp4/gif/jpg), let render-client layers use library gifs/jpgs as sources, and overhaul the panel's information architecture, touch ergonomics, layer strip, warp editor, and mask editing — all per `docs/superpowers/specs/2026-07-06-panel-ux-and-media-library-design.md`.

**Architecture:** Three services change. The **server** (`control-panel/server`, Node ESM, hand-rolled `http` + `ws`, `node --test`) gains a `media` state container and a small media router module with three HTTP endpoints. The **render-client** (`control-panel/render-client`, plain browser ESM, WebGL2, verified via Playwright) learns to sample a library `<img>` (gif/jpg) into its existing per-frame texture pipeline and to resolve `/media/...` URLs against its control-plane origin. The **panel** (`control-panel/panel`, React 18 + TypeScript + Vite, Storybook 8, ESLint) gains a media-library pane, a media-backed layer-source picker, a tabbed show-control, a mobile bottom-tab-bar, `--tap-min` touch sizing, a labeled/precise warp editor, and an on-canvas mask editor.

**Tech Stack:** Node 22 (ESM, `node:http`, `node:fs`, `node:crypto`, `ws`, `node --test`); browser WebGL2 (no framework); React 18 + TypeScript 5.6 + Vite 5 + Storybook 8; CSS custom-property token system. No new runtime dependencies in any service.

## Global Constraints

Every task's requirements implicitly include this section. Values copied verbatim from the spec:

- **File-type allowlist (one place, checked case-insensitively):** `.mp4` → `kind:"video"`, `Content-Type: video/mp4`; `.gif` → `kind:"gif"`, `image/gif`; `.jpg`/`.jpeg` → `kind:"image"`, `image/jpeg`. Anything else is rejected at upload with **400**. No png/webp, no video formats beyond mp4.
- **Media state entry shape:** `{ id, name, filename, kind, size, uploadedAt }`, keyed `"media-<id>"`, same id-keyed discipline as `layers`/`presets`/`screens`. `kind` is derived from the extension at write time.
- **Internal filenames are server-generated** (`media-<token>.<ext>`), never derived from the client-supplied name — closes path traversal by construction. The display `name` is editable metadata only.
- **`MEDIA_DIR`** env var, default `./media`; Docker default `/data/media` (reuses the existing `state-data` volume — no new volume). **`MEDIA_MAX_BYTES`** env var, default **1 GiB** (`1024*1024*1024`), applied uniformly to all three kinds. **No total-library quota.**
- **`GET /media/:filename`** validates against `^media-[A-Za-z0-9_-]+\.(mp4|gif|jpe?g)$` before touching the filesystem, sets `Content-Type` from the matched extension, supports **HTTP Range**, and always sets **`Access-Control-Allow-Origin: *`** (required for all three kinds — textures taint the canvas otherwise).
- **Rename needs no new endpoint** — it is a plain WS `update` on `media.<id>.name`.
- **No multipart library** — raw request body + an `X-File-Name` header, matching the codebase's hand-rolled `readJsonBody` style. No new server dependency.
- **`source.type` stays `"video"`** for gif/image layers — it means "a URL/file-backed visual source"; `kind` on the resolved media entry is what distinguishes video/gif/image at render time. No per-layer state migration.
- **`--tap-min: 44px`** applied via `@media (any-pointer: coarse)` (targets touchscreens regardless of viewport; mouse users keep compact sizing).
- **Mobile breakpoint is 720px.** Below 720px: a 4-tab bottom bar (Layers/Screen/Media/Show), one full-height section at a time. Tablet **720–1099px keeps the existing single-column stacked behavior** (today's one `@media (max-width:1100px)` rule) — do not remove it.
- **Visual identity is unchanged.** The token system (`panel/src/tokens/tokens.css`), tungsten/cyan "projection desk" grammar, confidence-monitor element, and mono equipment-label typography stay. Tungsten = operator/layer-stack; cyan = render/preview/machine data. The mask shape editor draws in **tungsten** (layer-stack color).
- **New panel components get Storybook stories** (`*.stories.tsx`) matching existing precedent; there is no component-test framework. Functional verification is a scripted Playwright pass against a live server + browser, plus explicit **mobile-viewport (390×844-class)** screenshots.
- **Out of scope (do not build):** per-layer warp, source-bank architecture, remaining blend modes, A/B crossfade, clip-trigger grid, Art-Net/DMX, serial, Syphon, mask rotate/skew, a total-library disk quota.

---

## Phase A — Server: media library backend

### Task 1: Media type allowlist + filename helpers

**Files:**
- Create: `control-panel/server/src/media.js` (helpers only in this task; the router is added in Task 3)
- Create: `control-panel/server/test/media-helpers.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `MEDIA_TYPES` — `Record<ext, { kind: "video"|"gif"|"image", contentType: string }>` for `mp4`/`gif`/`jpg`/`jpeg`.
  - `SAFE_FILENAME: RegExp` — `/^media-[A-Za-z0-9_-]+\.(mp4|gif|jpe?g)$/`.
  - `extOf(name: string): string` — lowercase extension without the dot (`""` if none).
  - `mediaTypeForName(name: string): { kind, contentType } | null` — allowlist lookup by extension.

- [ ] **Step 1: Write the failing test**

Create `control-panel/server/test/media-helpers.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { MEDIA_TYPES, SAFE_FILENAME, extOf, mediaTypeForName } from "../src/media.js";

test("extOf returns the lowercase extension without a dot", () => {
  assert.equal(extOf("Clip.MP4"), "mp4");
  assert.equal(extOf("a.b.JPG"), "jpg");
  assert.equal(extOf("noext"), "");
});

test("mediaTypeForName maps each allowed extension to kind + contentType", () => {
  assert.deepEqual(mediaTypeForName("x.mp4"), { kind: "video", contentType: "video/mp4" });
  assert.deepEqual(mediaTypeForName("x.gif"), { kind: "gif", contentType: "image/gif" });
  assert.deepEqual(mediaTypeForName("x.jpg"), { kind: "image", contentType: "image/jpeg" });
  assert.deepEqual(mediaTypeForName("x.JPEG"), { kind: "image", contentType: "image/jpeg" });
});

test("mediaTypeForName rejects anything not on the allowlist", () => {
  assert.equal(mediaTypeForName("x.png"), null);
  assert.equal(mediaTypeForName("x.webm"), null);
  assert.equal(mediaTypeForName("noext"), null);
});

test("SAFE_FILENAME accepts only server-generated media filenames", () => {
  assert.equal(SAFE_FILENAME.test("media-a1b2c3.mp4"), true);
  assert.equal(SAFE_FILENAME.test("media-a1b2c3.jpeg"), true);
  assert.equal(SAFE_FILENAME.test("../etc/passwd"), false);
  assert.equal(SAFE_FILENAME.test("media-a1b2c3.png"), false);
  assert.equal(SAFE_FILENAME.test("sample.mp4"), false);
});

test("MEDIA_TYPES is the single allowlist source (exactly mp4/gif/jpg/jpeg)", () => {
  assert.deepEqual(Object.keys(MEDIA_TYPES).sort(), ["gif", "jpeg", "jpg", "mp4"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd control-panel/server && node --test test/media-helpers.test.js`
Expected: FAIL — `Cannot find module '../src/media.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `control-panel/server/src/media.js`:

```js
// Single source of truth for the upload allowlist. Extension (lowercase, no dot) -> how
// the file is treated. Adding a format later is a one-line edit here (see the spec's
// "the allowlist is a plain array in one place" non-goal note).
export const MEDIA_TYPES = {
  mp4: { kind: "video", contentType: "video/mp4" },
  gif: { kind: "gif", contentType: "image/gif" },
  jpg: { kind: "image", contentType: "image/jpeg" },
  jpeg: { kind: "image", contentType: "image/jpeg" },
};

// Filenames are ALWAYS server-generated (media-<token>.<ext>); validate before any fs
// touch so a hand-crafted GET/DELETE can never walk out of MEDIA_DIR (defense in depth —
// ids are server-generated, so this should never reject a legitimate request).
export const SAFE_FILENAME = /^media-[A-Za-z0-9_-]+\.(mp4|gif|jpe?g)$/;

export function extOf(name) {
  const dot = String(name).lastIndexOf(".");
  return dot < 0 ? "" : String(name).slice(dot + 1).toLowerCase();
}

export function mediaTypeForName(name) {
  return MEDIA_TYPES[extOf(name)] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd control-panel/server && node --test test/media-helpers.test.js`
Expected: PASS — all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd control-panel/server
git add src/media.js test/media-helpers.test.js
git commit -m "$(cat <<'EOF'
Add media allowlist + filename helpers (server)

MEDIA_TYPES is the one place the mp4/gif/jpg/jpeg allowlist lives;
SAFE_FILENAME guards every fs touch against path traversal.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `media` state container + backfill

**Files:**
- Modify: `control-panel/server/src/state.js` (`DEFAULT_STATE` ~50-125, `ensureStateDefaults` ~145-158)
- Modify: `control-panel/server/test/state.test.js` (add two tests)

**Interfaces:**
- Consumes: `applyCreate`/`applyDelete`/`ensureStateDefaults` (existing, unchanged signatures).
- Produces: `state.media` is always an object (`{}` by default); old `state.json` files without `media` are backfilled with `{}` by `ensureStateDefaults`.

- [ ] **Step 1: Write the failing test**

Add to the end of `control-panel/server/test/state.test.js`:

```js
test("DEFAULT_STATE (via loadState fallback) includes an empty media container", () => {
  const dir = mkdtempSync(join(tmpdir(), "vpt-state-test-"));
  try {
    const loaded = loadState(join(dir, "state.json")); // no file -> defaults
    assert.deepEqual(loaded.media, {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ensureStateDefaults backfills media as {} on an older state without it", () => {
  const state = { layers: {}, presets: {}, automation: { running: false } };
  ensureStateDefaults(state);
  assert.deepEqual(state.media, {});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd control-panel/server && node --test test/state.test.js`
Expected: FAIL — `media` is `undefined` (deepEqual mismatch) on both new tests.

- [ ] **Step 3: Write minimal implementation**

In `control-panel/server/src/state.js`, add a `media` field to `DEFAULT_STATE`. Insert it immediately after the `presets: {},` line (~112):

```js
  presets: {},

  // Uploaded media (mp4/gif/jpg), keyed by id like every other collection. Files live
  // under MEDIA_DIR on disk; this holds the metadata the panel/render-client read.
  media: {},
```

Then, in `ensureStateDefaults` (~145), add `media: {}` to the `fillMissing` defaults object:

```js
export function ensureStateDefaults(state) {
  fillMissing(state, {
    automation: { cues: [], cursor: -1, running: false, timers: {} },
    lfos: {},
    midiMap: {},
    master: 1,
    media: {},
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd control-panel/server && node --test test/state.test.js`
Expected: PASS — all state tests pass, including the two new ones.

- [ ] **Step 5: Commit**

```bash
cd control-panel/server
git add src/state.js test/state.test.js
git commit -m "$(cat <<'EOF'
Add media state container + backfill (server)

media joins layers/presets/etc as an id-keyed container in
DEFAULT_STATE, and ensureStateDefaults backfills {} so older
state.json files upgrade cleanly.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Media router (upload / serve / delete) + server wiring

**Files:**
- Modify: `control-panel/server/src/media.js` (add `createMediaRouter`)
- Modify: `control-panel/server/src/index.js` (env, mkdir, instantiate router, route before 404)
- Modify: `control-panel/server/Dockerfile` (add `ENV MEDIA_DIR=/data/media`)
- Create: `control-panel/server/test/media.test.js`

**Interfaces:**
- Consumes: `MEDIA_TYPES`, `SAFE_FILENAME`, `extOf`, `mediaTypeForName` (Task 1); `applyCreate`, `applyDelete` (state.js); `broadcast`, `scheduleSave`, `state` (index.js).
- Produces: `createMediaRouter({ mediaDir, state, broadcast, scheduleSave, maxBytes? }) → { handle(req, res): Promise<boolean> }`. `handle` returns `true` if it handled the request (`POST /api/media`, `GET /media/:filename`, `DELETE /api/media/:id`), else `false`.

- [ ] **Step 1: Write the failing test**

Create `control-panel/server/test/media.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMediaRouter } from "../src/media.js";

// Spin the router behind a throwaway http server on an ephemeral port so we exercise the
// real streaming/Range/CORS paths over the wire (index.js auto-listens on import, so we
// wrap the router directly instead).
function withServer(run, { maxBytes } = {}) {
  return async () => {
    const dir = mkdtempSync(join(tmpdir(), "vpt-media-test-"));
    const state = { media: {} };
    const broadcasts = [];
    const router = createMediaRouter({
      mediaDir: dir,
      state,
      broadcast: (m) => broadcasts.push(m),
      scheduleSave: () => {},
      maxBytes,
    });
    const server = createServer(async (req, res) => {
      if (await router.handle(req, res)) return;
      res.writeHead(404);
      res.end();
    });
    await new Promise((r) => server.listen(0, r));
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
      await run({ base, state, broadcasts, dir });
    } finally {
      server.close();
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

async function upload(base, name, bytes) {
  return fetch(`${base}/api/media`, {
    method: "POST",
    headers: { "X-File-Name": name },
    body: Buffer.from(bytes),
  });
}

for (const [name, kind, contentType] of [
  ["clip.mp4", "video", "video/mp4"],
  ["anim.gif", "gif", "image/gif"],
  ["still.jpg", "image", "image/jpeg"],
  ["photo.jpeg", "image", "image/jpeg"],
]) {
  test(`upload ${name} succeeds with kind=${kind} and serves with ${contentType}`, withServer(async ({ base, state, broadcasts }) => {
    const res = await upload(base, name, "hello-bytes");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.media.kind, kind);
    // Landed in state and broadcast a create.
    assert.equal(state.media[body.media.id].kind, kind);
    assert.ok(broadcasts.some((m) => m.type === "create" && m.path === "media" && m.key === body.media.id));
    // Served back with the right Content-Type + CORS + Accept-Ranges.
    const get = await fetch(`${base}/media/${body.media.filename}`);
    assert.equal(get.status, 200);
    assert.equal(get.headers.get("content-type"), contentType);
    assert.equal(get.headers.get("access-control-allow-origin"), "*");
    assert.equal(get.headers.get("accept-ranges"), "bytes");
    assert.equal(await get.text(), "hello-bytes");
  }));
}

test("upload rejects an unrecognized extension with 400", withServer(async ({ base, state }) => {
  const res = await upload(base, "notes.txt", "nope");
  assert.equal(res.status, 400);
  assert.deepEqual(state.media, {});
}));

test("upload rejects an oversize file with 413 and leaves no partial file", withServer(async ({ base, state, dir }) => {
  const res = await upload(base, "big.mp4", "0123456789"); // 10 bytes > 4-byte cap
  assert.equal(res.status, 413);
  assert.deepEqual(state.media, {});
  assert.deepEqual(readdirSync(dir), []); // partial file cleaned up
}, { maxBytes: 4 }));

test("GET supports a Range request (206 + Content-Range)", withServer(async ({ base }) => {
  const up = await (await upload(base, "clip.mp4", "abcdefghij")).json();
  const res = await fetch(`${base}/media/${up.media.filename}`, { headers: { Range: "bytes=2-5" } });
  assert.equal(res.status, 206);
  assert.equal(res.headers.get("content-range"), "bytes 2-5/10");
  assert.equal(await res.text(), "cdef");
}));

test("GET rejects a filename that fails the safe pattern with 404", withServer(async ({ base }) => {
  const res = await fetch(`${base}/media/${encodeURIComponent("../../etc/passwd")}`);
  assert.equal(res.status, 404);
}));

test("DELETE removes both the file and the state entry and broadcasts delete", withServer(async ({ base, state, broadcasts, dir }) => {
  const up = await (await upload(base, "clip.mp4", "bye")).json();
  const id = up.media.id;
  assert.ok(existsSync(join(dir, up.media.filename)));
  const res = await fetch(`${base}/api/media/${id}`, { method: "DELETE" });
  assert.equal(res.status, 200);
  assert.equal(state.media[id], undefined);
  assert.equal(existsSync(join(dir, up.media.filename)), false);
  assert.ok(broadcasts.some((m) => m.type === "delete" && m.path === `media.${id}`));
}));

test("DELETE of an unknown id is a 404", withServer(async ({ base }) => {
  const res = await fetch(`${base}/api/media/media-nope`, { method: "DELETE" });
  assert.equal(res.status, 404);
}));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd control-panel/server && node --test test/media.test.js`
Expected: FAIL — `createMediaRouter` is not exported from `../src/media.js`.

- [ ] **Step 3: Write minimal implementation**

Append to `control-panel/server/src/media.js`:

```js
import { createReadStream, createWriteStream, statSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { applyCreate, applyDelete } from "./state.js";

const DEFAULT_MAX_BYTES = 1024 * 1024 * 1024; // 1 GiB

// Three HTTP endpoints on the existing hand-rolled server (no multipart lib): raw body +
// X-File-Name, mirroring how readJsonBody is hand-rolled in index.js. Factored out as a
// router so it's testable without index.js's top-level listen().
export function createMediaRouter({ mediaDir, state, broadcast, scheduleSave, maxBytes = DEFAULT_MAX_BYTES }) {
  const sendJson = (res, code, obj) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(obj));
  };

  function handleUpload(req, res) {
    const fileName = req.headers["x-file-name"];
    const meta = fileName ? mediaTypeForName(fileName) : null;
    if (!meta) {
      sendJson(res, 400, { error: "unsupported or missing file type (allowed: mp4, gif, jpg, jpeg)" });
      return;
    }
    // Reject up front on a declared oversize Content-Length (cheap, avoids a partial write).
    const declared = Number(req.headers["content-length"]);
    if (Number.isFinite(declared) && declared > maxBytes) {
      sendJson(res, 413, { error: `file exceeds ${maxBytes}-byte limit` });
      return;
    }

    const ext = extOf(fileName);
    const id = `media-${randomBytes(8).toString("hex")}`;
    const filename = `${id}.${ext}`; // matches SAFE_FILENAME by construction
    const filePath = join(mediaDir, filename);
    const out = createWriteStream(filePath);
    let written = 0;
    let aborted = false;

    const abort = (code, msg) => {
      if (aborted) return;
      aborted = true;
      req.unpipe(out);
      out.destroy();
      try { unlinkSync(filePath); } catch { /* nothing to clean up */ }
      sendJson(res, code, { error: msg });
    };

    // Re-check against ACTUAL bytes in case Content-Length is absent/wrong.
    req.on("data", (chunk) => {
      written += chunk.length;
      if (written > maxBytes) abort(413, `file exceeds ${maxBytes}-byte limit`);
    });
    req.on("error", () => abort(400, "upload stream error"));
    out.on("error", () => abort(500, "could not write file"));
    out.on("finish", () => {
      if (aborted) return;
      const entry = { id, name: fileName, filename, kind: meta.kind, size: written, uploadedAt: new Date().toISOString() };
      applyCreate(state, "media", entry);
      scheduleSave();
      broadcast({ type: "create", path: "media", key: id, value: entry });
      sendJson(res, 200, { ok: true, media: entry });
    });
    req.pipe(out);
  }

  function handleServe(req, res, filename) {
    if (!SAFE_FILENAME.test(filename)) { res.writeHead(404); res.end(); return; }
    const filePath = join(mediaDir, filename);
    if (!existsSync(filePath)) { res.writeHead(404); res.end(); return; }
    const { size } = statSync(filePath);
    const contentType = (MEDIA_TYPES[extOf(filename)] ?? {}).contentType ?? "application/octet-stream";
    // CORS is mandatory: the render-client draws these into a WebGL texture (crossOrigin
    // "anonymous"), which taints the canvas without an allow-origin header.
    const headers = { "access-control-allow-origin": "*", "accept-ranges": "bytes", "content-type": contentType };

    const range = req.headers.range;
    const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Number(m[2]) : size - 1;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || end >= size) {
        res.writeHead(416, { ...headers, "content-range": `bytes */${size}` });
        res.end();
        return;
      }
      res.writeHead(206, { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
      createReadStream(filePath, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { ...headers, "content-length": size });
    createReadStream(filePath).pipe(res);
  }

  function handleDelete(res, id) {
    const entry = state.media?.[id];
    if (!entry) { sendJson(res, 404, { error: `no media with id "${id}"` }); return; }
    if (SAFE_FILENAME.test(entry.filename)) {
      try { unlinkSync(join(mediaDir, entry.filename)); } catch { /* already gone */ }
    }
    applyDelete(state, `media.${id}`);
    scheduleSave();
    broadcast({ type: "delete", path: `media.${id}` });
    sendJson(res, 200, { ok: true });
  }

  return {
    async handle(req, res) {
      const url = req.url || "";
      if (req.method === "POST" && url === "/api/media") { handleUpload(req, res); return true; }
      const serve = req.method === "GET" && /^\/media\/([^/?]+)/.exec(url);
      if (serve) { handleServe(req, res, decodeURIComponent(serve[1])); return true; }
      const del = req.method === "DELETE" && /^\/api\/media\/([^/?]+)$/.exec(url);
      if (del) { handleDelete(res, decodeURIComponent(del[1])); return true; }
      return false;
    },
  };
}
```

Wire it into `control-panel/server/src/index.js`. Add to the imports at the top:

```js
import { mkdirSync } from "node:fs";
import { createMediaRouter } from "./media.js";
```

Add env + directory + router just after `const state = loadState(STATE_FILE);` (~22):

```js
const MEDIA_DIR = process.env.MEDIA_DIR || "./media";
const MEDIA_MAX_BYTES = Number(process.env.MEDIA_MAX_BYTES ?? 1024 * 1024 * 1024);
mkdirSync(MEDIA_DIR, { recursive: true });
```

Then, immediately after `broadcast` and `scheduleSave` are defined (they are hoisted function/`const` declarations; place this line just below the `broadcast` function definition, ~145, so both references resolve), add:

```js
const mediaRouter = createMediaRouter({ mediaDir: MEDIA_DIR, state, broadcast, scheduleSave, maxBytes: MEDIA_MAX_BYTES });
```

Finally, in the `createServer(async (req, res) => { ... })` callback, add a media route just before the final `res.writeHead(404); res.end();` (~120):

```js
  if (await mediaRouter.handle(req, res)) return;

  res.writeHead(404);
  res.end();
```

In `control-panel/server/Dockerfile`, add after the `ENV STATE_FILE=/data/state.json` line:

```dockerfile
ENV MEDIA_DIR=/data/media
```

(The existing `VOLUME ["/data"]` and compose `state-data:/data` already persist `/data/media`; `mkdirSync` creates it at boot. No docker-compose.yml change is needed.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd control-panel/server && node --test test/media.test.js`
Expected: PASS — all upload/serve/delete/range/reject tests pass.

Then confirm the whole server suite and boot still work:

Run: `cd control-panel/server && node --test test/*.test.js && node --check src/index.js`
Expected: all tests pass; `node --check` prints nothing (syntax OK).

- [ ] **Step 5: Commit**

```bash
cd control-panel/server
git add src/media.js src/index.js Dockerfile test/media.test.js
git commit -m "$(cat <<'EOF'
Add media upload/serve/delete endpoints (server)

createMediaRouter handles POST /api/media (raw body + X-File-Name,
size-capped, extension-allowlisted), GET /media/:filename (Range +
CORS, safe-filename guarded) and DELETE /api/media/:id (file + state
entry). Wired into index.js behind MEDIA_DIR/MEDIA_MAX_BYTES; rename
stays a plain WS update. Dockerfile defaults MEDIA_DIR to /data/media
on the existing state volume.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase B — Render client: images & gifs as a layer source

### Task 4: Sample library `<img>` (gif/jpg) into the texture pipeline + resolve `/media/` URLs

**Files:**
- Modify: `control-panel/render-client/src/layers.js` (`LayerStack`: constructor, `_entry`, `setLayerSource`, `_stopSource`, `render`; add `mediaKindFromUrl`, `setMediaOrigin`, `_resolveUrl`, `_uploadSourceFrame`, `_uploadImageFrame`)
- Modify: `control-panel/render-client/src/compositor.js` (`Compositor`: add `setMediaOrigin`)
- Modify: `control-panel/render-client/src/main.js` (derive + set media origin)

**Interfaces:**
- Consumes: the existing `layer.source` shape (`{ type:"video", url }`) — unchanged; `kind` is derived from the URL extension, so the render client never needs `state.media`.
- Produces: `LayerStack.setMediaOrigin(origin)` and `Compositor.setMediaOrigin(origin)`; a layer whose `source.url` ends in `.gif`/`.jpg`/`.jpeg` renders as an `<img>` (gif re-uploaded per frame, jpg uploaded once), and any `/media/...` url is resolved against the control-plane origin.

**Testing note:** the render-client has no unit-test harness (no `package.json`; it is static-served) — per `control-panel/README.md` its correctness is verified by a scripted Playwright pixel pass. This task's red/green cycle is a `node --check` syntax gate plus a scripted browser verification, matching the project's established practice and the spec's Testing section.

- [ ] **Step 1: Write the failing verification script**

Create a scratch verification script (not committed) in the session scratchpad, `verify-media-source.mjs`:

```js
// Run against a live stack (Step 2 starts it). Uses Playwright.
import { chromium } from "playwright";

const PANEL = process.env.PANEL_URL || "http://localhost:8082/index.html?ws=ws://localhost:8080";
const RENDER = process.env.RENDER_URL || "http://localhost:8081/index.html?screen=screen-1&ws=ws://localhost:8080";

const browser = await chromium.launch();
const ctx = await browser.newContext();

// 1. Upload a jpg and a gif via the panel's Media library pane, then set layer-1's source
//    to the jpg and layer-2's to the gif via the source picker (Task 8 wires this UI).
const page = await ctx.newPage();
await page.goto(PANEL);

// 2. Open the render client and screenshot twice, ~600ms apart.
const rc = await ctx.newPage();
await rc.goto(RENDER);
await rc.waitForTimeout(1500);
const a = await rc.screenshot();
await rc.waitForTimeout(600);
const b = await rc.screenshot();

// Gif animates => the two frames differ; a non-black canvas => something composited.
const differ = !a.equals(b);
console.log(differ ? "PASS: gif animated between frames" : "FAIL: frames identical (gif not animating?)");
await browser.close();
process.exit(differ ? 0 : 1);
```

- [ ] **Step 2: Run it to confirm current behavior fails (image sources not supported yet)**

Start the stack, then run the script:

```bash
cd control-panel/server && node src/index.js &   # :8080
cd control-panel/render-client && npx serve -l 8081 . &
cd control-panel/panel && npm run dev &           # :8082
node "$SCRATCH/verify-media-source.mjs"
```

Expected before the change: assigning a `.gif`/`.jpg` source produces a blank layer (the current `setLayerSource` only builds a `<video>` for `type:"video"`, and a `<video>` cannot decode a gif/jpg). Script prints `FAIL`.

- [ ] **Step 3: Write the implementation**

In `control-panel/render-client/src/layers.js`, add a module-level helper just below the `BLEND_INDEX` line (~5):

```js
// Treat a source URL by its file extension. Library files always carry a correct,
// server-generated extension; external streams without a known image extension fall
// through to "video" so arbitrary URLs keep working exactly as before.
function mediaKindFromUrl(url) {
  const clean = String(url).split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  const ext = dot < 0 ? "" : clean.slice(dot + 1).toLowerCase();
  if (ext === "gif") return "gif";
  if (ext === "jpg" || ext === "jpeg") return "image";
  return "video";
}
```

In the `LayerStack` constructor, after `this.groundColor = ...` (~77):

```js
    this.mediaOrigin = ""; // prefix for /media/... source urls (set from the ?ws= host)
```

Update `_entry` (~95) so new entries carry image fields:

```js
  _entry(id) {
    if (!this.entries.has(id)) {
      this.entries.set(id, {
        texture: createTexture(this.gl),
        videoEl: null, stream: null, imgEl: null, imgKind: null, imgUploaded: false,
        currentUrl: null, fxChain: null,
      });
    }
    return this.entries.get(id);
  }
```

Add two methods right after the constructor (anywhere in the class body):

```js
  setMediaOrigin(origin) {
    this.mediaOrigin = origin || "";
  }

  // Library media is stored as a host-independent "/media/<file>" path so a saved show
  // works regardless of which browser assigned it; resolve it against this render
  // client's own control-plane origin. External absolute URLs pass through untouched.
  _resolveUrl(url) {
    return url && url.startsWith("/media/") ? this.mediaOrigin + url : url;
  }
```

Extend `_stopSource` (~102) to also tear down an `<img>`:

```js
  _stopSource(entry) {
    if (entry.videoEl) {
      entry.videoEl.pause();
      entry.videoEl.srcObject = null;
      entry.videoEl.removeAttribute("src");
      entry.videoEl.load();
      entry.videoEl = null;
    }
    if (entry.stream) {
      for (const track of entry.stream.getTracks()) track.stop();
      entry.stream = null;
    }
    if (entry.imgEl) {
      entry.imgEl.removeAttribute("src");
      entry.imgEl = null;
    }
    entry.imgKind = null;
    entry.imgUploaded = false;
  }
```

Rework the `type === "video"` branch of `setLayerSource` (~116) so it forks on the derived kind (leave the `camera` and `else` branches below exactly as they are):

```js
  setLayerSource(id, source) {
    const entry = this._entry(id);
    if (source?.type === "video") {
      const url = this._resolveUrl(source.url);
      const kind = mediaKindFromUrl(source.url);
      if (entry.currentUrl === url) return;
      entry.currentUrl = url;
      this._stopSource(entry);
      if (kind === "video") {
        const video = document.createElement("video");
        video.src = url;
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true; // corrected by setLayerMuted() per the audio-owner policy
        video.playsInline = true;
        video.play().catch((err) => console.warn(`[layers] could not play "${url}":`, err.message));
        entry.videoEl = video;
      } else {
        // Still image (jpg) or animated gif: sample an <img> into the texture. A gif
        // advances its own frames on the browser clock, so re-uploading each render
        // frame picks up the current frame; a static image needs a single upload.
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.src = url;
        entry.imgEl = img;
        entry.imgKind = kind; // "gif" | "image"
        entry.imgUploaded = false;
        img.addEventListener("load", () => { entry.imgUploaded = false; });
      }
    } else if (source?.type === "camera") {
```

Add the image upload methods next to `_uploadVideoFrame` (~172):

```js
  _uploadSourceFrame(entry) {
    if (entry.videoEl) return this._uploadVideoFrame(entry);
    if (entry.imgEl) return this._uploadImageFrame(entry);
    return false;
  }

  _uploadImageFrame(entry) {
    const img = entry.imgEl;
    if (!img || !img.complete || img.naturalWidth === 0) return false;
    // Static image uploads once; gif re-uploads every frame to catch the current frame.
    if (entry.imgKind === "image" && entry.imgUploaded) return true;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    entry.imgUploaded = true;
    return true;
  }
```

In `render(...)` (~198), change the per-layer upload call:

```js
      const isColor = layer.source?.type === "color";
      if (!isColor) this._uploadSourceFrame(entry);
```

In `control-panel/render-client/src/compositor.js`, add a passthrough after `setMaster` (~59):

```js
  setMediaOrigin(origin) {
    this.layerStack.setMediaOrigin(origin);
  }
```

In `control-panel/render-client/src/main.js`, derive and set the origin right after `const wsUrl = ...` (~15):

```js
// Library sources are stored as host-independent "/media/<file>" paths; resolve them
// against the same host this client talks WebSocket to.
const mediaOrigin = new URL(wsUrl.replace(/^ws/, "http")).origin;
compositor.setMediaOrigin(mediaOrigin);
```

- [ ] **Step 4: Verify it passes**

Syntax gate:

Run: `cd control-panel/render-client && node --check src/layers.js && node --check src/compositor.js && node --check src/main.js`
Expected: no output (all three parse).

Browser gate (re-run with the stack up): `node "$SCRATCH/verify-media-source.mjs"`
Expected: `PASS: gif animated between frames`, plus visual confirmation the jpg layer composites a static image and the gif layer a moving one.

- [ ] **Step 5: Commit**

```bash
cd control-panel/render-client
git add src/layers.js src/compositor.js src/main.js
git commit -m "$(cat <<'EOF'
Render library gifs/jpgs as layer sources (render-client)

A layer whose source url ends in .gif/.jpg/.jpeg now samples an <img>
into the same per-frame texture pipeline as <video>: gifs re-upload
each frame (browser advances them), static jpgs upload once. /media/
urls resolve against the control-plane origin derived from ?ws=, so
saved shows stay host-independent.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase C — Panel: media library UI + media-backed layer source

### Task 5: Panel media types, store field, and fixtures

**Files:**
- Modify: `control-panel/panel/src/components/types.ts` (add `MediaKind`, `MediaItem`)
- Modify: `control-panel/panel/src/app/store.ts` (add `media` to `PanelState` + `emptyState`)
- Modify: `control-panel/panel/src/components/fixtures.ts` (add `sampleMedia`)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `MediaKind = "video" | "gif" | "image"`; `MediaItem = { id, name, filename, kind: MediaKind, size, uploadedAt }`.
  - `PanelState.media: Record<string, MediaItem>`; `emptyState().media === {}`.
  - `sampleMedia: MediaItem[]` (one of each kind) for stories.

- [ ] **Step 1: Write the change and a compile-time gate**

Since the panel has no unit-test runner, the gate is the TypeScript compiler: reference the new type from a story fixture so `tsc --noEmit` fails until the type exists, then passes once it does.

In `control-panel/panel/src/components/types.ts`, add after the `LayerSource` interface (~9):

```ts
export type MediaKind = "video" | "gif" | "image";

/** One uploaded library file. Mirrors the server's media entry (server/src/media.js).
 *  `kind` is derived from the extension at upload; `filename` is server-generated. */
export interface MediaItem {
  id: string;
  name: string;
  filename: string;
  kind: MediaKind;
  size: number;
  uploadedAt: string;
}
```

In `control-panel/panel/src/app/store.ts`, import `MediaItem` (extend the existing `import type` from `../components/types`) and add the field. Change the import line (~1):

```ts
import type { Layer, Screen, Pip, Preset, Automation, Lfo, MidiMapping, MediaItem } from "../components/types";
```

Add to the `PanelState` interface (after `midiMap`, ~16):

```ts
  /** Uploaded media library (server/src/media.js), keyed by id. */
  media: Record<string, MediaItem>;
```

Add to `emptyState()` (after `midiMap: {}`, ~30):

```ts
    media: {},
```

In `control-panel/panel/src/components/fixtures.ts`, import `MediaItem` (extend the existing `import type` on ~3) and add a fixture after `sampleMidiMappings` (~95):

```ts
export const sampleMedia: MediaItem[] = [
  { id: "media-a1", name: "Ambient loop.mp4", filename: "media-a1.mp4", kind: "video", size: 148 * 1024 * 1024, uploadedAt: "2026-07-06T10:00:00.000Z" },
  { id: "media-b2", name: "Starfield.gif", filename: "media-b2.gif", kind: "gif", size: 4 * 1024 * 1024, uploadedAt: "2026-07-06T10:05:00.000Z" },
  { id: "media-c3", name: "Logo.jpg", filename: "media-c3.jpg", kind: "image", size: 512 * 1024, uploadedAt: "2026-07-06T10:06:00.000Z" },
];
```

- [ ] **Step 2: Run the type check to verify it passes (and lint)**

Run: `cd control-panel/panel && npx tsc --noEmit`
Expected: no errors.

Run: `cd control-panel/panel && npm run lint`
Expected: no errors (no unused exports flagged — `sampleMedia` is consumed by Task 6's story next).

- [ ] **Step 3: Commit**

```bash
cd control-panel/panel
git add src/components/types.ts src/app/store.ts src/components/fixtures.ts
git commit -m "$(cat <<'EOF'
Add media types + store field + fixture (panel)

MediaItem/MediaKind mirror the server media entry; PanelState.media
joins the id-keyed containers; sampleMedia feeds the upcoming Media
library stories.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `MediaLibrary` component + story + styles

**Files:**
- Create: `control-panel/panel/src/components/MediaLibrary.tsx`
- Create: `control-panel/panel/src/components/MediaLibrary.stories.tsx`
- Modify: `control-panel/panel/src/components/index.ts` (export it)
- Modify: `control-panel/panel/src/components/panel.css` (media pane styles)

**Interfaces:**
- Consumes: `TextField`, `ToggleSquare`, `Button` primitives; `MediaItem`, `MediaKind` (Task 5).
- Produces: `MediaLibrary` with `MediaLibraryProps = { media: MediaItem[]; uploadUrl: string; onRename?: (id, name) => void; onRemove?: (id) => void }`. Uploads via `XMLHttpRequest` to `uploadUrl` with an `X-File-Name` header and `upload.onprogress`; success is reflected via the WS `create` broadcast (no local list mutation). Renders one `.sc-card` section titled "Media library" with an upload control and a row per item (type tag, editable name, size, delete).

- [ ] **Step 1: Write the failing story (red via Storybook build)**

Create `control-panel/panel/src/components/MediaLibrary.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { MediaLibrary } from "./MediaLibrary";
import { sampleMedia } from "./fixtures";
import { noop } from "./fixtures";

const meta: Meta<typeof MediaLibrary> = {
  title: "Panel/MediaLibrary",
  component: MediaLibrary,
  decorators: [(Story) => <div style={{ width: 720, padding: 16 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof MediaLibrary>;

export const Populated: Story = {
  args: { media: sampleMedia, uploadUrl: "http://localhost:8080/api/media", onRename: noop, onRemove: noop },
};
export const Empty: Story = {
  args: { media: [], uploadUrl: "http://localhost:8080/api/media", onRename: noop, onRemove: noop },
};
```

- [ ] **Step 2: Run the Storybook build to verify it fails**

Run: `cd control-panel/panel && npm run build-storybook`
Expected: FAIL — `Cannot find module './MediaLibrary'`.

- [ ] **Step 3: Write the component, export, and styles**

Create `control-panel/panel/src/components/MediaLibrary.tsx`:

```tsx
import { useRef, useState } from "react";
import { TextField } from "./primitives/TextField";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import type { MediaItem, MediaKind } from "./types";

const KIND_TAG: Record<MediaKind, string> = { video: "MP4", gif: "GIF", image: "JPG" };

function formatSize(bytes: number): string {
  if (bytes >= 1 << 30) return `${(bytes / (1 << 30)).toFixed(1)} GB`;
  if (bytes >= 1 << 20) return `${(bytes / (1 << 20)).toFixed(0)} MB`;
  if (bytes >= 1 << 10) return `${(bytes / (1 << 10)).toFixed(0)} KB`;
  return `${bytes} B`;
}

export interface MediaLibraryProps {
  media: MediaItem[];
  /** POST target for uploads, e.g. "http://host:8080/api/media". */
  uploadUrl: string;
  onRename?: (id: string, name: string) => void;
  onRemove?: (id: string) => void;
}

/** The persistent media-library pane: upload (with progress) + a row per file. Uploads
 *  go over HTTP (not the WS protocol); the server broadcasts a `create` on success, so
 *  the list re-renders from shared state without this component tracking it locally. */
export function MediaLibrary({ media, uploadUrl, onRename, onRemove }: MediaLibraryProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // XMLHttpRequest (not fetch) specifically for upload.onprogress on large files.
  const upload = (file: File) => {
    setError(null);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("X-File-Name", file.name);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status < 200 || xhr.status >= 300) {
        let msg = `upload failed (${xhr.status})`;
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch { /* keep default */ }
        setError(msg);
      }
    };
    xhr.onerror = () => { setProgress(null); setError("upload failed (network error)"); };
    xhr.send(file);
  };

  return (
    <section id="media-library" className="sc-card">
      <div className="media-head">
        <h3>Media library</h3>
        <input
          ref={fileRef}
          type="file"
          className="media-file-input"
          accept="video/mp4,image/gif,image/jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        <Button
          label={progress === null ? "+ Upload" : `Uploading ${progress}%`}
          onClick={() => fileRef.current?.click()}
        />
      </div>
      {error && <div className="media-error mono">{error}</div>}
      {media.length === 0 ? (
        <div className="empty-note">No media yet — upload an mp4, gif, or jpg.</div>
      ) : (
        media.map((m) => (
          <div className="media-row" key={m.id}>
            <span className="media-tag mono">{KIND_TAG[m.kind]}</span>
            <TextField className="media-name" value={m.name} onCommit={(v) => onRename?.(m.id, v)} />
            <span className="media-size mono">{formatSize(m.size)}</span>
            <ToggleSquare label="×" title="Delete media" onClick={() => onRemove?.(m.id)} />
          </div>
        ))
      )}
    </section>
  );
}
```

Add to `control-panel/panel/src/components/index.ts` (after the `FxDrawer` export block, ~44):

```ts
export { MediaLibrary } from "./MediaLibrary";
export type { MediaLibraryProps } from "./MediaLibrary";
```

Add to `control-panel/panel/src/components/panel.css` (place after the `#layer-rack` block, ~86). The pane reuses `.sc-card`; the tungsten dot marks it as operator/content territory:

```css
  /* ── Media library pane ─────────────────────────────────────────────────────
     Persistent above the layer rack (not one card among the show controls): you
     pick media before/while assigning a layer source, so it's the first stop. */
  #media-library { margin: var(--space-4) var(--space-4) 0; }
  #media-library h3::before { content: ""; width: 6px; height: 6px; background: var(--beam); flex-shrink: 0; }
  .media-head { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
  .media-head h3 { margin: 0; flex: 1; }
  .media-file-input { display: none; }
  .media-error { font-size: 10px; color: var(--live); padding: 2px 0 6px; }
  .media-row { display: flex; align-items: center; gap: var(--space-2); padding: 4px 0; }
  .media-tag {
    font-size: 9px; font-weight: 700; letter-spacing: 0.08em; color: var(--muted);
    width: 34px; text-align: center; padding: 3px 0;
    background: var(--panel-sunken); border: 1px solid var(--hairline); border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
  .media-row .media-name { flex: 1; min-width: 0; background: transparent; border: none; color: var(--text); font-size: 12px; padding: 4px 2px; font-family: var(--font-ui); }
  .media-row .media-name:focus { outline: none; }
  .media-size { font-size: 10px; color: var(--muted); width: 62px; text-align: right; flex-shrink: 0; }
```

- [ ] **Step 4: Run the Storybook build to verify it passes (plus tsc + lint)**

Run: `cd control-panel/panel && npm run build-storybook`
Expected: PASS — build completes; both `MediaLibrary` stories are included.

Run: `cd control-panel/panel && npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd control-panel/panel
git add src/components/MediaLibrary.tsx src/components/MediaLibrary.stories.tsx src/components/index.ts src/components/panel.css
git commit -m "$(cat <<'EOF'
Add MediaLibrary pane component (panel)

Upload-with-progress (XHR) + a row per file (type tag, editable name,
size, delete). Uploads POST to the media API; success arrives back as
the WS create broadcast. Storybook stories for populated + empty.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Wire the media library into the app (upload/rename/delete + place it above the rack)

**Files:**
- Modify: `control-panel/panel/src/app/actions.ts` (add `renameMedia`)
- Modify: `control-panel/panel/src/app/App.tsx` (derive `httpBase`, `removeMedia`, render `MediaLibrary` above `ChannelRack`)

**Interfaces:**
- Consumes: `MediaLibrary` (Task 6); `PanelState.media` (Task 5); the existing `useSocket` `onCreate`/`onDelete` handlers (already generic — they route a `media` create/delete through `store.applyCreate`/`applyDelete` unchanged).
- Produces: `actions.renameMedia(id, name)` (WS update `media.<id>.name`); `App` computes `httpBase = wsUrl.replace(/^ws/, "http")`, passes `uploadUrl={\`${httpBase}/api/media\`}`, `onRemove` = an HTTP `DELETE ${httpBase}/api/media/:id`, and renders the pane at the top of `.workspace`.

- [ ] **Step 1: Add a live smoke check (red first)**

Start the stack (server + panel) as in Task 4's Step 2. Before the change, the panel renders no media pane. The verification is manual/scripted through the running panel: after the change, uploading a small jpg through the pane makes a row appear, the name field commits a rename to `state.media.<id>.name`, and the delete `×` removes both the row and the file. Capture the "before" state:

Run: `curl -s http://localhost:8080/state | node -e "process.stdin.on('data',d=>console.log(JSON.stringify(JSON.parse(d).media)))"`
Expected before: `{}`.

- [ ] **Step 2: Write the implementation**

In `control-panel/panel/src/app/actions.ts`, add a media action inside the returned object (after `removeMidiMapping`, ~238; keep the trailing structure valid):

```ts
    // ── Media library ────────────────────────────────────────────────────────
    // Rename is a plain leaf update (upload + delete are HTTP, handled in App).
    renameMedia(id: string, name: string) {
      send({ type: "update", path: `media.${id}.name`, value: name });
    },
```

In `control-panel/panel/src/app/App.tsx`:

Add `MediaLibrary` to the component import list from `../components` (add the name alongside the others, ~2-18):

```ts
  MediaLibrary,
```

After the `wsUrl` memo (~86), derive the HTTP base and a delete callback:

```ts
  // The media API lives on the same host as the control plane; derive its HTTP origin
  // from the ws url. Upload + delete are HTTP (not WS); rename is a WS update.
  const httpBase = useMemo(() => wsUrl.replace(/^ws/, "http"), [wsUrl]);
  const removeMedia = useCallback(
    (id: string) => {
      fetch(`${httpBase}/api/media/${id}`, { method: "DELETE" }).catch((err) =>
        console.warn("[media] delete failed:", err.message),
      );
    },
    [httpBase],
  );
```

In the derived-values block (~171), add the media list next to `layers`/`screens`:

```ts
  const media = Object.values(state.media ?? {});
```

Render the pane at the very top of `<main className="workspace">`, immediately before `<ChannelRack ...>` (~202):

```tsx
          <MediaLibrary
            media={media}
            uploadUrl={`${httpBase}/api/media`}
            onRename={actions.renameMedia}
            onRemove={removeMedia}
          />
```

(`useCallback`/`useMemo` are already imported in App.tsx.)

- [ ] **Step 3: Verify it passes (tsc, lint, live)**

Run: `cd control-panel/panel && npx tsc --noEmit && npm run lint`
Expected: no errors.

Live (stack up, panel open in a browser): upload a small `.jpg` via the pane's **+ Upload**. Confirm a row appears with tag `JPG`, a size, and a `×`. Edit the name and blur; delete via `×`. Then:

Run: `curl -s http://localhost:8080/state | node -e "process.stdin.on('data',d=>console.log(JSON.stringify(JSON.parse(d).media)))"`
Expected: after upload it shows one `media-*` entry with the renamed `name`; after delete it is `{}` again, and the file is gone from `MEDIA_DIR`.

- [ ] **Step 4: Commit**

```bash
cd control-panel/panel
git add src/app/actions.ts src/app/App.tsx
git commit -m "$(cat <<'EOF'
Wire media library into the panel app (panel)

MediaLibrary sits above the layer rack; upload/delete go over HTTP to
the media API (origin derived from ?ws=), rename is a WS update. The
generic create/delete WS handlers already fold media into shared state.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Media-backed layer source picker (with "External URL…" escape hatch)

**Files:**
- Modify: `control-panel/panel/src/components/LayerStrip.tsx` (source field → `Select` from media + External URL)
- Modify: `control-panel/panel/src/components/ChannelRack.tsx` (thread `media` down)
- Modify: `control-panel/panel/src/app/App.tsx` (pass `media` to `ChannelRack`)
- Modify: `control-panel/panel/src/components/LayerStrip.stories.tsx` (add `media` arg)

**Interfaces:**
- Consumes: `MediaItem` (Task 5); the existing `Select`, `TextField` primitives.
- Produces: `LayerStripProps` gains `media?: MediaItem[]`; `ChannelRackProps` gains `media?: MediaItem[]`. When `source.type === "video"`, the URL field is a `Select` whose options are the library items (`value = "/media/<filename>"`, `label = name`, regardless of kind) plus a final **"External URL…"** option that reveals the existing raw `TextField`. Choosing a library item writes `source = { type: "video", url: "/media/<filename>" }`; External URL keeps the current free-text behavior. (`source.type` stays `"video"` for every kind — Global Constraints.)

- [ ] **Step 1: Update the story (compile-time contract) and build red**

In `control-panel/panel/src/components/LayerStrip.stories.tsx`, import `sampleMedia` and pass it on the `Video` story so the new prop is exercised:

```tsx
import { sampleLayers, sampleMedia, noop } from "./fixtures";
```

```tsx
export const Video: Story = {
  args: { layer: sampleLayers[0], media: sampleMedia, neighbors: { above: true, below: false }, onUpdate: noop, onMove: noop, onRemove: noop },
};
```

- [ ] **Step 2: Build to verify it fails**

Run: `cd control-panel/panel && npx tsc --noEmit`
Expected: FAIL — `media` does not exist on `LayerStripProps`.

- [ ] **Step 3: Implement the picker**

In `control-panel/panel/src/components/LayerStrip.tsx`:

Add the import and a prop. Extend the `import` from `./types` (~7) to include `MediaItem`:

```ts
import { BLEND_MODES, type Layer, type MediaItem } from "./types";
```

Add to `LayerStripProps` (after `canPaste?`, ~25):

```ts
  /** Library items offered in the source picker when the layer source is a URL. */
  media?: MediaItem[];
```

Add `media` to the destructured props (~35):

```ts
export function LayerStrip({ layer, neighbors, onUpdate, onMove, onRemove, onCopy, onPaste, canPaste, media }: LayerStripProps) {
```

Add derived picker state just below the existing `const [fxOpen, setFxOpen] = useState(false);` (~37):

```ts
  const mediaOptions = (media ?? []).map((m) => ({ value: `/media/${m.filename}`, label: m.name }));
  const currentUrl = layer.source?.url ?? "";
  const isLibraryUrl = mediaOptions.some((o) => o.value === currentUrl);
  // Start in External mode only if the current url is a non-empty, non-library url.
  const [externalMode, setExternalMode] = useState(currentUrl !== "" && !isLibraryUrl);
```

Replace the **video** branch of the source field (the `else` in the ternary that today renders the raw URL `TextField`, ~105-111) with a picker + conditional text field. The full `.source-field` block becomes:

```tsx
        <div className="source-field">
          {layer.source?.type === "camera" ? (
            <span className="mono source-note">live capture</span>
          ) : isColor ? (
            <input
              type="color"
              value={rgbToHex(layer.source.color ?? [0.5, 0.5, 0.5])}
              onChange={(e) => {
                const hex = e.target.value;
                const color = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
                  number,
                  number,
                  number,
                ];
                onUpdate?.("source", { type: "color", color });
              }}
            />
          ) : (
            <>
              <Select
                className="source-media-select"
                value={externalMode || !isLibraryUrl ? "__external__" : currentUrl}
                options={[...mediaOptions, { value: "__external__", label: "External URL…" }]}
                onChange={(v) => {
                  if (v === "__external__") {
                    setExternalMode(true);
                  } else {
                    setExternalMode(false);
                    onUpdate?.("source", { type: "video", url: v });
                  }
                }}
              />
              {(externalMode || (!isLibraryUrl && currentUrl !== "")) && (
                <TextField
                  value={currentUrl}
                  placeholder="/media/video.mp4 or https://…"
                  onCommit={(v) => onUpdate?.("source", { type: "video", url: v })}
                />
              )}
            </>
          )}
        </div>
```

In `control-panel/panel/src/components/ChannelRack.tsx`:

Add to the import from `./types` (~3): `import type { Layer, MediaItem } from "./types";`

Add to `ChannelRackProps` (after `canPaste?`, ~14):

```ts
  /** Library items, threaded to each strip's source picker. */
  media?: MediaItem[];
```

Add `media` to the destructured props (~18) and pass it to `LayerStrip` (~39):

```tsx
export function ChannelRack({
  layers,
  onUpdateLayer,
  onMoveLayer,
  onRemoveLayer,
  onAddLayer,
  onCopyLayer,
  onPasteLayer,
  canPaste,
  media,
}: ChannelRackProps) {
```

```tsx
          <LayerStrip
            key={layer.id}
            layer={layer}
            neighbors={neighbors}
            media={media}
            onUpdate={(field, value) => onUpdateLayer?.(layer.id, field, value)}
            onMove={(dir) => onMoveLayer?.(layer.id, dir)}
            onRemove={() => onRemoveLayer?.(layer.id)}
            onCopy={() => onCopyLayer?.(layer.id)}
            onPaste={() => onPasteLayer?.(layer.id)}
            canPaste={canPaste}
          />
```

In `control-panel/panel/src/app/App.tsx`, pass `media` to `ChannelRack` (~203, on the existing `<ChannelRack ...>`):

```tsx
          <ChannelRack
            layers={layers}
            media={media}
            onUpdateLayer={actions.updateLayer}
            onMoveLayer={actions.moveLayer}
            onRemoveLayer={actions.removeLayer}
            onAddLayer={actions.addLayer}
            onCopyLayer={copyLayer}
            onPasteLayer={pasteLayer}
            canPaste={canPaste}
          />
```

Add a style for the picker in `control-panel/panel/src/components/panel.css`, inside the existing `.source-group` rules (~120):

```css
  .source-group .source-media-select { font-size: 10px; padding: 4px 6px; padding-right: 20px; width: 100%; }
```

- [ ] **Step 4: Verify it passes (build, lint, live)**

Run: `cd control-panel/panel && npm run build-storybook && npx tsc --noEmit && npm run lint`
Expected: all pass; the `LayerStrip` "Video" story shows the media dropdown.

Live: with a jpg and a gif uploaded (Task 7), open a layer's source picker, choose the gif; confirm the render client shows the animated gif on that layer (this also satisfies Task 4's browser gate end-to-end). Choose **External URL…** and confirm the free-text field reappears with the prior URL.

- [ ] **Step 5: Commit**

```bash
cd control-panel/panel
git add src/components/LayerStrip.tsx src/components/ChannelRack.tsx src/components/LayerStrip.stories.tsx src/app/App.tsx src/components/panel.css
git commit -m "$(cat <<'EOF'
Media-backed layer source picker (panel)

A video-source layer now picks from the media library (value =
/media/<filename>, label = name) or falls back to "External URL…"
for arbitrary streams. source.type stays "video" for every kind.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase D — Panel: information architecture

### Task 9: Tabbed show-control (Presets / Cues / Timers / LFO / MIDI)

**Files:**
- Modify: `control-panel/panel/src/app/App.tsx` (`activeShowTab` state; render a tab bar + only the active section)
- Modify: `control-panel/panel/src/components/panel.css` (`.show-tabs` styles; adjust `.show-control`)

**Interfaces:**
- Consumes: the five existing sections already rendered in App (`PresetsBar`, `CueList`, `TimerBank`, `LfoRack`, `MidiMapPanel`) — unchanged; only their container changes.
- Produces: one tabbed `.show-control` band showing a single section at a time, driven by `activeShowTab: "presets" | "cues" | "timers" | "lfo" | "midi"`. No new component (avoids threading ~20 props); the section JSX stays in App.

- [ ] **Step 1: Add the tab state and restructure the band**

In `control-panel/panel/src/app/App.tsx`, add state near the other `useState` calls (~68):

```ts
  const [activeShowTab, setActiveShowTab] = useState<"presets" | "cues" | "timers" | "lfo" | "midi">("presets");
```

Add a constant above the `App` function (near `LAYER_TARGET_FIELDS`, ~29) for the tab labels:

```ts
type ShowTab = "presets" | "cues" | "timers" | "lfo" | "midi";
const SHOW_TABS: Array<[ShowTab, string]> = [
  ["presets", "Presets"],
  ["cues", "Cues"],
  ["timers", "Timers"],
  ["lfo", "LFO"],
  ["midi", "MIDI"],
];
```

(and type the state as `useState<ShowTab>("presets")` for consistency)

Replace the entire `<div className="show-control"> ... </div>` block (~213-266) with a tab bar + only the active section:

```tsx
          <div className="show-control">
            <div className="show-tabs" role="tablist">
              {SHOW_TABS.map(([value, label]) => (
                <button
                  key={value}
                  className="show-tab-btn"
                  role="tab"
                  aria-selected={activeShowTab === value}
                  data-active={activeShowTab === value}
                  onClick={() => setActiveShowTab(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeShowTab === "presets" && (
              <section className="sc-card">
                <h3>Presets</h3>
                <PresetsBar
                  presets={presets}
                  onRecall={actions.recallPreset}
                  onSave={actions.savePreset}
                  onRename={actions.renamePreset}
                  onRemove={actions.removePreset}
                />
              </section>
            )}
            {activeShowTab === "cues" && (
              <section className="sc-card">
                <CueList
                  cues={automation.cues ?? []}
                  cursor={automation.cursor ?? -1}
                  running={!!automation.running}
                  presets={presets}
                  onGo={actions.cueGo}
                  onStop={actions.cueStop}
                  onJump={actions.cueJump}
                  onSetCues={actions.setCues}
                />
              </section>
            )}
            {activeShowTab === "timers" && (
              <section className="sc-card">
                <TimerBank
                  timers={Object.values(automation.timers ?? {})}
                  presets={presets}
                  onAdd={actions.addTimer}
                  onUpdate={actions.updateTimer}
                  onRemove={actions.removeTimer}
                />
              </section>
            )}
            {activeShowTab === "lfo" && (
              <section className="sc-card">
                <LfoRack
                  lfos={Object.values(state.lfos ?? {})}
                  targetOptions={targetOptions}
                  onAdd={actions.addLfo}
                  onUpdate={actions.updateLfo}
                  onRemove={actions.removeLfo}
                />
              </section>
            )}
            {activeShowTab === "midi" && (
              <section className="sc-card">
                <MidiMapPanel
                  mappings={Object.values(state.midiMap ?? {})}
                  learningId={midi.learningId}
                  midiAvailable={midi.available}
                  targetOptions={targetOptions}
                  onAdd={actions.addMidiMapping}
                  onUpdate={actions.updateMidiMapping}
                  onRemove={actions.removeMidiMapping}
                  onLearn={midi.learn}
                />
              </section>
            )}
          </div>
```

In `control-panel/panel/src/components/panel.css`, change `.show-control` from a 2-up grid to a single column (the tabbed band shows one card), and add the tab-bar styles. Replace the existing `.show-control { ... }` rule (~137-143) with:

```css
  .show-control {
    flex: 1;
    display: flex; flex-direction: column; gap: var(--space-2);
    align-content: start;
    padding: 0 var(--space-4) var(--space-4);
  }
  .show-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
  .show-tab-btn {
    padding: 6px 12px; border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    border: 1px solid var(--hairline); border-bottom: none;
    background: var(--panel-sunken); color: var(--muted);
    font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: color 120ms ease, background 120ms ease;
  }
  .show-tab-btn:hover { color: var(--beam); }
  .show-tab-btn[data-active="true"] { color: var(--beam); background: var(--panel); border-color: var(--beam-line); }
```

The `.sc-presets { grid-column: 1 / -1; }` rule (~151) is now dead (no grid) — remove it.

- [ ] **Step 2: Verify (build, lint, live)**

Run: `cd control-panel/panel && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass.

Live: the show-control band shows one tab's content; clicking Presets/Cues/Timers/LFO/MIDI switches the visible section; GO/save/etc still drive real state on the active tab.

- [ ] **Step 3: Commit**

```bash
cd control-panel/panel
git add src/app/App.tsx src/components/panel.css
git commit -m "$(cat <<'EOF'
Tabbed show-control band (panel)

The five stacked show-control cards become one tabbed section
(Presets/Cues/Timers/LFO/MIDI), one visible at a time — less scroll
depth on desktop and mobile, no capability lost.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Layer strip → responsive 2-row card

**Files:**
- Modify: `control-panel/panel/src/components/LayerStrip.tsx` (2-row markup)
- Modify: `control-panel/panel/src/components/panel.css` (`.strip` from 7-col grid to a flex 2-row card)
- Modify: `control-panel/panel/src/components/LayerStrip.stories.tsx` (add a narrow-width story)

**Interfaces:**
- Consumes: the same props/handlers as today (Task 8's `media` picker included).
- Produces: a `.strip` that reflows from desktop to phone with no separate mobile component. Row 1 (`.strip-main`): index, reorder, name, source, blend, opacity. Row 2 (`.strip-actions`): Mask, FX, Copy·Paste, Remove, grouped and spaced. The FX drawer still spans full width below both rows.

- [ ] **Step 1: Add a narrow-width story (visual contract) and confirm current overflow**

In `control-panel/panel/src/components/LayerStrip.stories.tsx`, add a story that renders at phone width to make the reflow reviewable:

```tsx
export const Narrow: Story = {
  decorators: [(Story) => <div style={{ width: 360, padding: 8 }}><Story /></div>],
  args: { layer: sampleLayers[0], media: sampleMedia, neighbors: { above: true, below: false }, onUpdate: noop, onMove: noop, onRemove: noop },
};
```

- [ ] **Step 2: Build to confirm the story exists but the layout still overflows (red)**

Run: `cd control-panel/panel && npm run build-storybook`
Expected: build succeeds, but the `Narrow` story visibly overflows its 360px frame (the current `.strip` grid has a ~700px minimum from `grid-template-columns`). This is the "before" to fix.

- [ ] **Step 3: Restructure the markup and CSS**

In `control-panel/panel/src/components/LayerStrip.tsx`, wrap the existing children into two rows. Replace the outer `return (<div className="strip" ...> ... </div>)` structure so the index/move/meta/source/blend/opacity live in a `.strip-main` row and the `.toggles` become a `.strip-actions` row with grouped buttons. The full return becomes:

```tsx
  return (
    <div className="strip" data-fx-open={fxOpen}>
      <div className="strip-main">
        <div className="idx mono">{String(layer.order ?? 0).padStart(2, "0")}</div>

        <div className="move-group">
          <ToggleSquare className="move-btn" label="▲" title="Move toward front" disabled={!neighbors.above} onClick={() => onMove?.("up")} />
          <ToggleSquare className="move-btn" label="▼" title="Move toward back" disabled={!neighbors.below} onClick={() => onMove?.("down")} />
        </div>

        <div className="meta">
          <TextField className="name-input" value={layer.name ?? ""} onCommit={(v) => onUpdate?.("name", v)} />
        </div>

        <div className="source-group">
          <Select
            className="source-type"
            value={layer.source?.type ?? "video"}
            options={[
              { value: "video", label: "Video URL" },
              { value: "color", label: "Solid color" },
              { value: "camera", label: "Camera" },
            ]}
            onChange={(v) =>
              onUpdate?.(
                "source",
                v === "color"
                  ? { type: "color", color: layer.source?.color ?? [0.5, 0.5, 0.5] }
                  : v === "camera"
                    ? { type: "camera" }
                    : { type: "video", url: layer.source?.url ?? "" },
              )
            }
          />
          <div className="source-field">
            {layer.source?.type === "camera" ? (
              <span className="mono source-note">live capture</span>
            ) : isColor ? (
              <input
                type="color"
                value={rgbToHex(layer.source.color ?? [0.5, 0.5, 0.5])}
                onChange={(e) => {
                  const hex = e.target.value;
                  const color = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
                  onUpdate?.("source", { type: "color", color });
                }}
              />
            ) : (
              <>
                <Select
                  className="source-media-select"
                  value={externalMode || !isLibraryUrl ? "__external__" : currentUrl}
                  options={[...mediaOptions, { value: "__external__", label: "External URL…" }]}
                  onChange={(v) => {
                    if (v === "__external__") {
                      setExternalMode(true);
                    } else {
                      setExternalMode(false);
                      onUpdate?.("source", { type: "video", url: v });
                    }
                  }}
                />
                {(externalMode || (!isLibraryUrl && currentUrl !== "")) && (
                  <TextField
                    value={currentUrl}
                    placeholder="/media/video.mp4 or https://…"
                    onCommit={(v) => onUpdate?.("source", { type: "video", url: v })}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <Select
          className="blend-select"
          value={layer.blendMode ?? "normal"}
          options={BLEND_MODES.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) }))}
          onChange={(v) => onUpdate?.("blendMode", v)}
        />

        <div className="opacity-field">
          <Fader value={layer.opacity ?? 1} ariaLabel="Layer opacity" onChange={(v) => onUpdate?.("opacity", v)} />
          <span className="opacity-val mono">{Math.round((layer.opacity ?? 1) * 100)}%</span>
        </div>
      </div>

      <div className="strip-actions">
        <div className="action-group">
          <ToggleSquare
            label="M"
            title="Mask"
            active={!!layer.mask?.enabled}
            onClick={() => onUpdate?.("mask", { ...layer.mask, enabled: !layer.mask?.enabled })}
          />
          <ToggleSquare
            label={layer.mask?.shape === "rect" ? "□" : "○"}
            title="Mask shape"
            onClick={() => onUpdate?.("mask", { ...layer.mask, shape: layer.mask?.shape === "rect" ? "ellipse" : "rect" })}
          />
          <ToggleSquare label="FX" title="Effects chain" active={fxOpen} onClick={() => setFxOpen((open) => !open)} />
        </div>
        <div className="action-group">
          <ToggleSquare label="⧉" title="Copy layer look" onClick={onCopy} />
          <ToggleSquare label="⇩" title="Paste layer look" disabled={!canPaste} onClick={onPaste} />
        </div>
        <ToggleSquare className="remove-btn" label="×" title="Remove layer" onClick={onRemove} />
      </div>

      {fxOpen && layer.fx && <FxDrawer fx={layer.fx} mask={layer.mask} onUpdate={onUpdate} />}
    </div>
  );
```

In `control-panel/panel/src/components/panel.css`, replace the `.strip` grid rule (~90-100) with a flex column card, add the two row rules, and fix the FX-drawer full-width rule (which relied on `grid-column`). Replace the `.strip { ... }` block with:

```css
  .strip {
    position: relative;
    display: flex; flex-direction: column; gap: var(--space-2);
    padding: var(--space-2) var(--space-2) var(--space-2) 14px;
    background: linear-gradient(180deg, rgba(255,255,255,0.015), rgba(0,0,0,0)), var(--panel);
    border: 1px solid var(--hairline);
    border-radius: var(--radius-md);
    transition: border-color 120ms ease;
  }
  .strip-main {
    display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;
  }
  .strip-main .idx { flex: 0 0 auto; }
  .strip-main .meta { flex: 1 1 120px; min-width: 90px; }
  .strip-main .source-group { flex: 1 1 200px; min-width: 150px; }
  .strip-main .blend-select { flex: 0 0 auto; }
  .strip-main .opacity-field { flex: 1 1 140px; min-width: 120px; }
  .strip-actions { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
  .action-group { display: flex; gap: 5px; }
  .strip-actions .remove-btn { margin-left: auto; }
```

Update the `.fx-drawer` rule (~325) — remove `grid-column: 1 / -1;` (no grid now) so it is just a full-width flex child:

```css
  .fx-drawer {
    display: flex; flex-direction: column; gap: var(--space-2);
    margin-top: var(--space-2); padding-top: var(--space-2);
    border-top: 1px solid var(--hairline-soft, var(--hairline));
  }
```

- [ ] **Step 4: Verify (build, lint, story reflow)**

Run: `cd control-panel/panel && npx tsc --noEmit && npm run lint && npm run build-storybook`
Expected: all pass; the `Narrow` (360px) `LayerStrip` story now fits its frame with the two rows wrapping instead of overflowing; the default/`Video` story still reads as a channel strip at desktop width.

- [ ] **Step 5: Commit**

```bash
cd control-panel/panel
git add src/components/LayerStrip.tsx src/components/panel.css src/components/LayerStrip.stories.tsx
git commit -m "$(cat <<'EOF'
Layer strip: responsive 2-row card (panel)

Replaces the rigid 7-column ~700px grid with a flex 2-row card: row 1
info (index/name/source/blend/opacity), row 2 grouped actions. Same
markup reflows from desktop to phone via CSS wrap — no mobile-only
component. Adds a 360px-wide Narrow story.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Mobile bottom-tab-bar (Layers / Screen / Media / Show) below 720px

**Files:**
- Create: `control-panel/panel/src/components/MobileTabBar.tsx`
- Create: `control-panel/panel/src/components/MobileTabBar.stories.tsx`
- Modify: `control-panel/panel/src/components/index.ts` (export it)
- Create: `control-panel/panel/src/app/useIsMobile.ts`
- Modify: `control-panel/panel/src/app/App.tsx` (`activeMobileTab`; group regions; render only the active one on mobile)
- Modify: `control-panel/panel/src/components/panel.css` (mobile layout + tab bar)

**Interfaces:**
- Consumes: the App's existing four render regions (media pane, layer rack, show-control band, screen aside).
- Produces:
  - `MobileTabBar` with `MobileTabBarProps = { active: MobileTab; onSelect: (tab: MobileTab) => void }` and `type MobileTab = "layers" | "screen" | "media" | "show"`.
  - `useIsMobile(): boolean` — `matchMedia("(max-width: 719px)")`, live-updating.
  - Below 720px, `App` renders only the active region + the bar; at ≥720px the existing two-column (and 720–1099 single-column) layout is unchanged.

- [ ] **Step 1: Write the failing story (red via Storybook build)**

Create `control-panel/panel/src/components/MobileTabBar.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MobileTabBar, type MobileTab } from "./MobileTabBar";

const meta: Meta<typeof MobileTabBar> = {
  title: "Panel/MobileTabBar",
  component: MobileTabBar,
  decorators: [(Story) => <div style={{ width: 390, padding: 0 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof MobileTabBar>;

export const Interactive: Story = {
  render: () => {
    const [active, setActive] = useState<MobileTab>("layers");
    return <MobileTabBar active={active} onSelect={setActive} />;
  },
};
```

- [ ] **Step 2: Build to verify it fails**

Run: `cd control-panel/panel && npm run build-storybook`
Expected: FAIL — `Cannot find module './MobileTabBar'`.

- [ ] **Step 3: Implement the bar, the hook, and the App grouping**

Create `control-panel/panel/src/components/MobileTabBar.tsx`:

```tsx
export type MobileTab = "layers" | "screen" | "media" | "show";

export interface MobileTabBarProps {
  active: MobileTab;
  onSelect: (tab: MobileTab) => void;
}

const TABS: Array<[MobileTab, string]> = [
  ["layers", "Layers"],
  ["screen", "Screen"],
  ["media", "Media"],
  ["show", "Show"],
];

/** Fixed bottom navigation for narrow viewports: one full-height section at a time.
 *  48px tall, in the thumb zone; buttons meet the coarse-pointer tap minimum. */
export function MobileTabBar({ active, onSelect }: MobileTabBarProps) {
  return (
    <nav className="mobile-tabbar" role="tablist">
      {TABS.map(([value, label]) => (
        <button
          key={value}
          className="mobile-tab"
          role="tab"
          aria-selected={active === value}
          data-active={active === value}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
```

Create `control-panel/panel/src/app/useIsMobile.ts`:

```ts
import { useEffect, useState } from "react";

const QUERY = "(max-width: 719px)";

/** True below the 720px mobile breakpoint; updates live on resize/rotate. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(QUERY).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}
```

Add to `control-panel/panel/src/components/index.ts` (after the `MediaLibrary` export, ~46):

```ts
export { MobileTabBar } from "./MobileTabBar";
export type { MobileTabBarProps, MobileTab } from "./MobileTabBar";
```

In `control-panel/panel/src/app/App.tsx`:

Add imports — `MobileTabBar` and `MobileTab` to the `../components` import, and the hook:

```ts
  MobileTabBar,
  type MobileTab,
```

```ts
import { useIsMobile } from "./useIsMobile";
```

Add state + hook near the other `useState`s (~68):

```ts
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("layers");
  const isMobile = useIsMobile();
```

Refactor the JSX so each region is a variable, then render them either all-at-once (desktop) or one-at-a-time (mobile). Replace the `return ( ... )` body (the `<>...</>` after `const targetOptions = ...`, ~179-302) with:

```tsx
  const mediaPane = (
    <MediaLibrary
      media={media}
      uploadUrl={`${httpBase}/api/media`}
      onRename={actions.renameMedia}
      onRemove={removeMedia}
    />
  );

  const layerRack = (
    <ChannelRack
      layers={layers}
      media={media}
      onUpdateLayer={actions.updateLayer}
      onMoveLayer={actions.moveLayer}
      onRemoveLayer={actions.removeLayer}
      onAddLayer={actions.addLayer}
      onCopyLayer={copyLayer}
      onPasteLayer={pasteLayer}
      canPaste={canPaste}
    />
  );

  const showControl = (
    <div className="show-control">
      <div className="show-tabs" role="tablist">
        {SHOW_TABS.map(([value, label]) => (
          <button
            key={value}
            className="show-tab-btn"
            role="tab"
            aria-selected={activeShowTab === value}
            data-active={activeShowTab === value}
            onClick={() => setActiveShowTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {activeShowTab === "presets" && (
        <section className="sc-card">
          <h3>Presets</h3>
          <PresetsBar presets={presets} onRecall={actions.recallPreset} onSave={actions.savePreset} onRename={actions.renamePreset} onRemove={actions.removePreset} />
        </section>
      )}
      {activeShowTab === "cues" && (
        <section className="sc-card">
          <CueList cues={automation.cues ?? []} cursor={automation.cursor ?? -1} running={!!automation.running} presets={presets} onGo={actions.cueGo} onStop={actions.cueStop} onJump={actions.cueJump} onSetCues={actions.setCues} />
        </section>
      )}
      {activeShowTab === "timers" && (
        <section className="sc-card">
          <TimerBank timers={Object.values(automation.timers ?? {})} presets={presets} onAdd={actions.addTimer} onUpdate={actions.updateTimer} onRemove={actions.removeTimer} />
        </section>
      )}
      {activeShowTab === "lfo" && (
        <section className="sc-card">
          <LfoRack lfos={Object.values(state.lfos ?? {})} targetOptions={targetOptions} onAdd={actions.addLfo} onUpdate={actions.updateLfo} onRemove={actions.removeLfo} />
        </section>
      )}
      {activeShowTab === "midi" && (
        <section className="sc-card">
          <MidiMapPanel mappings={Object.values(state.midiMap ?? {})} learningId={midi.learningId} midiAvailable={midi.available} targetOptions={targetOptions} onAdd={actions.addMidiMapping} onUpdate={actions.updateMidiMapping} onRemove={actions.removeMidiMapping} onLearn={midi.learn} />
        </section>
      )}
    </div>
  );

  const screenAside = (
    <aside>
      <WarpEditor
        ref={preview.warpMonitor}
        screen={screen}
        screens={screens}
        previewFrame={preview.frameFor(selectedScreenId)}
        onSelectScreen={setSelectedScreenId}
        onAddScreen={actions.addScreen}
        onRenameScreen={(name) => actions.renameScreen(sid, name)}
        onSetMode={(mode) => actions.setWarpMode(sid, mode)}
        onSetMeshSize={(size) => actions.setMeshSize(sid, size)}
        onReset={() => actions.resetWarp(sid)}
        onDragStart={beginDrag}
        onMovePoint={(index, x, y) => actions.moveWarpPoint(sid, index, x, y)}
        onDragEnd={endDrag}
      />
      <PipWindows
        ref={preview.pipMonitor}
        screenId={sid}
        pips={pips}
        previewFrame={preview.frameFor(selectedScreenId)}
        onDragStart={beginDrag}
        onDragEnd={endDrag}
        onUpdatePip={actions.updatePip}
        onMovePip={actions.movePip}
        onResizePip={actions.resizePip}
        onRemovePip={actions.removePip}
        onAddPip={() => actions.addPip(sid)}
      />
    </aside>
  );

  const faceplate = (
    <Faceplate
      center={
        <div className="faceplate-center">
          <AudioOwner screens={screens} ownerId={state.audioOwnerScreenId} onSelect={actions.setAudioOwner} />
          <MasterControl master={state.master ?? 1} onChange={actions.setMaster} onToggleBlackout={toggleBlackout} />
        </div>
      }
      right={<StatusLamp state={status.state} label={status.label} />}
    />
  );

  if (isMobile) {
    return (
      <>
        {faceplate}
        <div className="mobile-view">
          {activeMobileTab === "layers" && <main className="workspace">{layerRack}</main>}
          {activeMobileTab === "media" && <main className="workspace">{mediaPane}</main>}
          {activeMobileTab === "show" && <main className="workspace">{showControl}</main>}
          {activeMobileTab === "screen" && screenAside}
        </div>
        <MobileTabBar active={activeMobileTab} onSelect={setActiveMobileTab} />
      </>
    );
  }

  return (
    <>
      {faceplate}
      <div className="layout">
        <main className="workspace">
          {mediaPane}
          {layerRack}
          {showControl}
        </main>
        {screenAside}
      </div>
    </>
  );
```

In `control-panel/panel/src/components/panel.css`, add the mobile layout + tab-bar styles at the end of the file, replacing/augmenting the tail. Add after the existing `@media (max-width: 1100px)` block (~416):

```css
  /* ── Mobile: one full-height section + a bottom tab bar (below 720px). ─────── */
  .mobile-view { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow-y: auto; }
  .mobile-view .workspace { overflow-y: auto; }
  .mobile-view aside { border-left: none; }
  .mobile-tabbar {
    display: flex; flex-shrink: 0; height: 56px;
    border-top: 1px solid var(--hairline); background: var(--panel);
  }
  .mobile-tab {
    flex: 1; min-height: var(--tap-min, 44px);
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; color: var(--muted);
    font-family: var(--font-mono); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer;
  }
  .mobile-tab[data-active="true"] { color: var(--beam); box-shadow: inset 0 2px 0 var(--beam); }
```

- [ ] **Step 4: Verify (build, lint, mobile viewport)**

Run: `cd control-panel/panel && npx tsc --noEmit && npm run lint && npm run build-storybook`
Expected: all pass; the `MobileTabBar` story renders four tabs.

Live mobile check — script `verify-mobile.mjs` in the scratchpad (stack up):

```js
import { chromium } from "playwright";
const PANEL = process.env.PANEL_URL || "http://localhost:8082/index.html?ws=ws://localhost:8080";
const browser = await chromium.launch();
const page = await browser.newContext({ viewport: { width: 390, height: 844 } }).then((c) => c.newPage());
await page.goto(PANEL);
await page.waitForSelector(".mobile-tabbar");
await page.screenshot({ path: "mobile-layers.png" });
await page.getByRole("tab", { name: "Screen" }).click();
await page.screenshot({ path: "mobile-screen.png" });
const barCount = await page.locator(".mobile-tab").count();
console.log(barCount === 4 ? "PASS: 4-tab bottom bar at 390px" : `FAIL: ${barCount} tabs`);
await browser.close();
```

Run: `node "$SCRATCH/verify-mobile.mjs"`
Expected: `PASS: 4-tab bottom bar at 390px`; `mobile-layers.png` shows the rack + bottom bar, `mobile-screen.png` shows the warp/PiP aside. Resizing to ≥720px restores the two-column desktop layout (verify by widening the browser window manually).

- [ ] **Step 5: Commit**

```bash
cd control-panel/panel
git add src/components/MobileTabBar.tsx src/components/MobileTabBar.stories.tsx src/components/index.ts src/app/useIsMobile.ts src/app/App.tsx src/components/panel.css
git commit -m "$(cat <<'EOF'
Mobile bottom-tab-bar layout below 720px (panel)

Below 720px the app renders one region at a time (Layers/Screen/Media/
Show) with a 4-tab bottom bar in the thumb zone; useIsMobile drives the
switch. 720-1099px keeps the existing single-column stacked behavior;
desktop two-column is unchanged.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase E — Panel: touch ergonomics

### Task 12: `--tap-min` token + coarse-pointer sizing across every interactive control

**Files:**
- Modify: `control-panel/panel/src/tokens/tokens.css` (add `--tap-min`)
- Modify: `control-panel/panel/src/components/panel.css` (one `@media (any-pointer: coarse)` block)

**Interfaces:**
- Consumes: existing control classes (`.toggle-sq`, `.move-btn`, `input[type="range"]`, `.handle`, `.pip-box__resize`).
- Produces: `--tap-min: 44px`; under `@media (any-pointer: coarse)` every listed control meets the 44px minimum, while mouse users keep today's compact sizing.

- [ ] **Step 1: Add the token and the coarse-pointer rules**

In `control-panel/panel/src/tokens/tokens.css`, add inside `:root` (after the spacing scale, ~68):

```css
  /* Minimum comfortable touch target (Apple HIG). Applied only under a coarse pointer
   * so mouse users keep the compact sizing above. */
  --tap-min: 44px;
```

In `control-panel/panel/src/components/panel.css`, append one block at the very end of the file:

```css
  /* ── Touch: enlarge every interactive control on coarse pointers (touchscreens),
     regardless of viewport width, so mouse users keep the compact desktop sizing. ── */
  @media (any-pointer: coarse) {
    .toggle-sq { min-width: var(--tap-min); min-height: var(--tap-min); }
    .move-group { flex-direction: row; }
    .move-group .move-btn { width: var(--tap-min); height: var(--tap-min); font-size: 12px; }
    input[type="range"] { height: var(--tap-min); }
    input[type="range"]::-webkit-slider-thumb { width: 28px; height: 28px; }
    input[type="range"]::-moz-range-thumb { width: 28px; height: 28px; }
    .handle { width: var(--tap-min); height: var(--tap-min); }
    .pip-box__resize { width: var(--tap-min); height: var(--tap-min); }
    .mask-shape__edge { width: var(--tap-min); height: var(--tap-min); }
  }
```

(`.mask-shape__edge` is created in Task 15; sizing it here keeps all touch targets in one place — the selector is simply inert until that component exists.)

- [ ] **Step 2: Verify (build + coarse-pointer measurement)**

Run: `cd control-panel/panel && npm run build`
Expected: builds clean.

Live measurement — script `verify-tap.mjs` (stack up) launches with touch emulation and asserts a toggle is ≥44px:

```js
import { chromium } from "playwright";
const PANEL = process.env.PANEL_URL || "http://localhost:8082/index.html?ws=ws://localhost:8080";
const browser = await chromium.launch();
// hasTouch + isMobile makes (any-pointer: coarse) match.
const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(PANEL);
await page.waitForSelector(".toggle-sq");
const box = await page.locator(".toggle-sq").first().boundingBox();
const ok = box.width >= 44 && box.height >= 44;
console.log(ok ? `PASS: toggle ${box.width}x${box.height} >= 44` : `FAIL: toggle ${box.width}x${box.height}`);
await browser.close();
process.exit(ok ? 0 : 1);
```

Run: `node "$SCRATCH/verify-tap.mjs"`
Expected: `PASS: toggle 44x44 >= 44` (or larger). On a normal desktop (fine pointer) the same control stays 26px — confirm by loading the panel without touch emulation.

- [ ] **Step 3: Commit**

```bash
cd control-panel/panel
git add src/tokens/tokens.css src/components/panel.css
git commit -m "$(cat <<'EOF'
Add --tap-min 44px touch sizing on coarse pointers (panel)

One @media (any-pointer: coarse) block bumps toggles, move buttons,
fader thumbs, warp handles, the PiP resize corner (and the upcoming
mask edge handles) to a 44px minimum; mouse users keep compact sizing.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase F — Panel: warp editor labeling & precision

### Task 13: Corner tags, mesh coordinate reveal, and a live drag readout

**Files:**
- Modify: `control-panel/panel/src/components/WarpHandle.tsx` (corner tag, coord tag, live badge; `onSelect`/`selected` are added here for Task 14)
- Modify: `control-panel/panel/src/components/WarpEditor.tsx` (compute + pass tags)
- Modify: `control-panel/panel/src/components/panel.css` (handle label/badge styles)

**Interfaces:**
- Consumes: existing `WarpHandle`/`WarpEditor` props.
- Produces: `WarpHandleProps` gains `cornerTag?: string` (always visible), `coordTag?: string` (revealed on hover/drag), `selected?: boolean`, `onSelect?: () => void`. In corner mode each of the 4 handles shows `TL`/`TR`/`BR`/`BL`; in mesh mode a hovered/dragged handle reveals `R{row}·C{col}`; any handle mid-drag shows a floating `x 0.00 · y 0.00` badge.

- [ ] **Step 1: Rewrite `WarpHandle` with labels + badge**

Replace the whole body of `control-panel/panel/src/components/WarpHandle.tsx`:

```tsx
import { useRef, type PointerEvent as ReactPointerEvent } from "react";

export interface WarpHandleProps {
  /** Normalised 0–1 position on the stage. */
  x: number;
  y: number;
  active?: boolean;
  /** Highlighted as the currently-selected point (Task 14). */
  selected?: boolean;
  /** Always-visible tag (corner mode: TL/TR/BR/BL). */
  cornerTag?: string;
  /** Revealed on hover/drag (mesh mode: R2·C3). */
  coordTag?: string;
  /** Fired on pointer-down so a tap can select the point for exact entry. */
  onSelect?: () => void;
  onDragStart?: () => void;
  onDragTo?: (x: number, y: number) => void;
  onDragEnd?: () => void;
}

/** A tungsten registration reticle. Positions itself imperatively during a drag so the
 *  container can suppress re-renders mid-gesture without the handle appearing to freeze. */
export function WarpHandle({ x, y, active = false, selected = false, cornerTag, coordTag, onSelect, onDragStart, onDragTo, onDragEnd }: WarpHandleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const stage = el.parentElement; // .stage
    if (!stage) return;
    onSelect?.();
    el.setPointerCapture(event.pointerId);
    el.dataset.active = "true";
    onDragStart?.();

    const onMove = (moveEvent: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (moveEvent.clientX - rect.left) / rect.width));
      const ny = Math.min(1, Math.max(0, (moveEvent.clientY - rect.top) / rect.height));
      el.style.left = `${nx * 100}%`;
      el.style.top = `${ny * 100}%`;
      if (badgeRef.current) badgeRef.current.textContent = `x ${nx.toFixed(2)} · y ${ny.toFixed(2)}`;
      onDragTo?.(nx, ny);
    };
    const onUp = () => {
      el.dataset.active = "false";
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      onDragEnd?.();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={ref}
      className="handle"
      data-active={active}
      data-selected={selected}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      onPointerDown={onPointerDown}
    >
      {cornerTag && <span className="handle__tag mono">{cornerTag}</span>}
      {coordTag && <span className="handle__coord mono">{coordTag}</span>}
      <div ref={badgeRef} className="handle__badge mono">{`x ${x.toFixed(2)} · y ${y.toFixed(2)}`}</div>
    </div>
  );
}
```

- [ ] **Step 2: Pass tags from `WarpEditor`**

In `control-panel/panel/src/components/WarpEditor.tsx`, add a corner-tag constant above the component (near `MESH_SIZES`, ~28):

```tsx
const CORNER_TAGS = ["TL", "TR", "BR", "BL"]; // index order matches the identity corners
```

Inside the component, compute mesh size and pass tags into each handle. Replace the `points.map(...)` inside `<ConfidenceMonitor>` (~95-104):

```tsx
        <ConfidenceMonitor ref={ref} previewFrame={previewFrame}>
          {points.map((p, i) => {
            const size = warp?.mesh.size ?? 4;
            return (
              <WarpHandle
                key={i}
                x={p.x}
                y={p.y}
                cornerTag={isMesh ? undefined : CORNER_TAGS[i]}
                coordTag={isMesh ? `R${Math.floor(i / size) + 1}·C${(i % size) + 1}` : undefined}
                onDragStart={onDragStart}
                onDragTo={(x, y) => onMovePoint?.(i, x, y)}
                onDragEnd={onDragEnd}
              />
            );
          })}
        </ConfidenceMonitor>
```

- [ ] **Step 3: Style the tag, coord, and badge**

In `control-panel/panel/src/components/panel.css`, add after the `.handle[data-active="true"]` rules (~271):

```css
  /* Corner tag (always visible), coordinate tag (hover/drag), live badge (drag). */
  .handle__tag, .handle__coord, .handle__badge {
    position: absolute; left: 50%; transform: translateX(-50%);
    font-size: 8px; font-weight: 700; letter-spacing: 0.08em; line-height: 1;
    padding: 2px 4px; white-space: nowrap; pointer-events: none;
    background: var(--panel-sunken); border: 1px solid var(--beam-line); color: var(--beam);
    border-radius: var(--radius-sm);
  }
  .handle__tag { bottom: calc(100% + 4px); }
  .handle__coord { top: calc(100% + 4px); opacity: 0; transition: opacity 100ms ease; }
  .handle:hover .handle__coord { opacity: 1; }
  .handle__badge { bottom: calc(100% + 4px); display: none; }
  .handle[data-active="true"] .handle__badge { display: block; }
  .handle[data-active="true"] .handle__coord { opacity: 1; }
  .handle[data-selected="true"] { box-shadow: var(--glow-beam); }
```

- [ ] **Step 4: Verify (build + live)**

Run: `cd control-panel/panel && npx tsc --noEmit && npm run lint && npm run build-storybook`
Expected: all pass; the existing `WarpEditor` stories render with corner tags in corner mode.

Live: in corner mode, the four handles read TL/TR/BR/BL; switch to Mesh and hover a point to reveal `R·C`; drag any handle and a `x .. · y ..` badge tracks it.

- [ ] **Step 5: Commit**

```bash
cd control-panel/panel
git add src/components/WarpHandle.tsx src/components/WarpEditor.tsx src/components/panel.css
git commit -m "$(cat <<'EOF'
Warp editor: corner tags, mesh coord reveal, live drag readout (panel)

Corner handles carry TL/TR/BR/BL tags; mesh points reveal R{row}·C{col}
on hover/drag; any handle shows a live normalized x/y badge while
dragging. Adds onSelect/selected to WarpHandle for the next task.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Tap-to-select a point + type exact coordinates

**Files:**
- Modify: `control-panel/panel/src/components/WarpEditor.tsx` (`selectedPoint` state, `CoordInput`, wire `onSelect`/`selected`)
- Modify: `control-panel/panel/src/components/panel.css` (coordinate-entry row styles)

**Interfaces:**
- Consumes: `WarpHandle`'s `onSelect`/`selected` (Task 13); the existing `onMovePoint(index, x, y)` action path (reused verbatim — no new server message).
- Produces: tapping a handle selects it (highlight + pinned selection); an X/Y numeric entry row appears below the stage and, on commit, calls `onMovePoint(selectedIndex, x, y)`. One mechanism for coarse (drag), one for precise (type) — no arrow-key nudging.

- [ ] **Step 1: Add selection state + a coordinate-entry field**

In `control-panel/panel/src/components/WarpEditor.tsx`, extend the React import (~1):

```tsx
import { forwardRef, useEffect, useState } from "react";
```

Add a small commit-on-blur numeric field above the `WarpEditor` component (below `CORNER_TAGS`):

```tsx
function CoordInput({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n)) onCommit(Math.min(1, Math.max(0, n)));
  };
  return (
    <label className="warp-coord-field mono">
      {label}
      <input
        type="number"
        step="0.001"
        min={0}
        max={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
    </label>
  );
}
```

Inside the component, after `const points: Point[] = ...` (~52), add selection state that resets when the point set changes:

```tsx
    const size = warp?.mesh.size ?? 4;
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    useEffect(() => { setSelectedPoint(null); }, [screen?.id, warp?.mode, size]);
    const selected = selectedPoint != null && selectedPoint < points.length ? points[selectedPoint] : null;
    const selectedLabel =
      selectedPoint == null ? "" : isMesh ? `R${Math.floor(selectedPoint / size) + 1}·C${(selectedPoint % size) + 1}` : CORNER_TAGS[selectedPoint];
```

Wire `selected`/`onSelect` into the handle map (update the `WarpHandle` created in Task 13 to add these two props, and drop the now-local `const size` inside the map since it's hoisted above):

```tsx
          {points.map((p, i) => (
            <WarpHandle
              key={i}
              x={p.x}
              y={p.y}
              selected={i === selectedPoint}
              cornerTag={isMesh ? undefined : CORNER_TAGS[i]}
              coordTag={isMesh ? `R${Math.floor(i / size) + 1}·C${(i % size) + 1}` : undefined}
              onSelect={() => setSelectedPoint(i)}
              onDragStart={onDragStart}
              onDragTo={(x, y) => onMovePoint?.(i, x, y)}
              onDragEnd={onDragEnd}
            />
          ))}
```

Add the entry row immediately after the `</ConfidenceMonitor>` close (~105):

```tsx
        {selected && (
          <div className="warp-coord-entry">
            <span className="warp-coord-tag mono">{selectedLabel}</span>
            <CoordInput label="X" value={selected.x} onCommit={(x) => onMovePoint?.(selectedPoint!, x, selected.y)} />
            <CoordInput label="Y" value={selected.y} onCommit={(y) => onMovePoint?.(selectedPoint!, selected.x, y)} />
          </div>
        )}
```

- [ ] **Step 2: Style the entry row**

In `control-panel/panel/src/components/panel.css`, add after the handle-badge rules (~from Task 13):

```css
  .warp-coord-entry {
    display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-2);
    padding: var(--space-2); background: var(--panel-sunken);
    border: 1px solid var(--hairline); border-radius: var(--radius-sm);
  }
  .warp-coord-tag { font-size: 10px; font-weight: 700; color: var(--beam); }
  .warp-coord-field { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--muted); }
  .warp-coord-field input { width: 72px; font-size: 11px; padding: 4px 6px; }
```

- [ ] **Step 3: Verify (build + live)**

Run: `cd control-panel/panel && npx tsc --noEmit && npm run lint && npm run build-storybook`
Expected: all pass.

Live: tap a warp handle — it highlights and an `X`/`Y` row appears; type `0.25` into X and press Enter; confirm the handle jumps and `state.screens.<id>.warp...` updates to the typed value. Switching screen or warp mode clears the selection.

- [ ] **Step 4: Commit**

```bash
cd control-panel/panel
git add src/components/WarpEditor.tsx src/components/panel.css
git commit -m "$(cat <<'EOF'
Warp editor: tap-to-select + type exact coordinates (panel)

Tapping a handle selects it and reveals an X/Y numeric entry that
commits via the existing onMovePoint path — precise entry without a
second gesture vocabulary, which also sidesteps 44px handles colliding
at high mesh density. Selection resets on screen/mode/size change.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase G — Panel: on-canvas mask editor

### Task 15: `MaskShapeOverlay` component + story + styles

**Files:**
- Create: `control-panel/panel/src/components/MaskShapeOverlay.tsx`
- Create: `control-panel/panel/src/components/MaskShapeOverlay.stories.tsx`
- Modify: `control-panel/panel/src/components/index.ts` (export it)
- Modify: `control-panel/panel/src/components/panel.css` (mask-shape styles)

**Interfaces:**
- Consumes: the `Mask` type (`cx`/`cy` center, `rx`/`ry` radii, `feather`, `shape`).
- Produces: `MaskShapeOverlay` with `MaskShapeOverlayProps = { mask: Mask; onDragStart?: () => void; onChange?: (patch: Partial<Pick<Mask,"cx"|"cy"|"rx"|"ry">>) => void; onDragEnd?: () => void }`. Renders as a child of the confidence-monitor `.stage` (like `WarpHandle`): a tungsten outline (ellipse or rect per `mask.shape`) positioned from `cx/cy`, sized from `rx/ry`, with a body drag (→ `cx/cy`), a right-edge handle (→ `rx`), a bottom-edge handle (→ `ry`), and a fainter non-interactive feather-preview outline. Feather stays a slider (not dragged here).

- [ ] **Step 1: Write the failing story (red via Storybook build)**

Create `control-panel/panel/src/components/MaskShapeOverlay.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { MaskShapeOverlay } from "./MaskShapeOverlay";
import { noop } from "./fixtures";

const meta: Meta<typeof MaskShapeOverlay> = {
  title: "Panel/MaskShapeOverlay",
  component: MaskShapeOverlay,
  decorators: [
    (Story) => (
      <div className="stage" style={{ position: "relative", width: 480, aspectRatio: "16 / 9" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof MaskShapeOverlay>;

export const Ellipse: Story = {
  args: { mask: { enabled: true, shape: "ellipse", cx: 0.5, cy: 0.5, rx: 0.3, ry: 0.25, feather: 0.08 }, onChange: noop },
};
export const Rect: Story = {
  args: { mask: { enabled: true, shape: "rect", cx: 0.4, cy: 0.45, rx: 0.25, ry: 0.3, feather: 0.05 }, onChange: noop },
};
```

- [ ] **Step 2: Build to verify it fails**

Run: `cd control-panel/panel && npm run build-storybook`
Expected: FAIL — `Cannot find module './MaskShapeOverlay'`.

- [ ] **Step 3: Implement the component, export, and styles**

Create `control-panel/panel/src/components/MaskShapeOverlay.tsx`:

```tsx
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Mask } from "./types";

export interface MaskShapeOverlayProps {
  mask: Mask;
  onDragStart?: () => void;
  onChange?: (patch: Partial<Pick<Mask, "cx" | "cy" | "rx" | "ry">>) => void;
  onDragEnd?: () => void;
}

const pct = (v: number) => `${v * 100}%`;
const clampR = (v: number) => Math.min(1, Math.max(0.02, v));

/** A draggable mask shape drawn over the confidence monitor, in tungsten (the layer
 *  stack's color). Drag the body to move (cx/cy), the right edge to resize rx, the bottom
 *  edge to resize ry — matching the FX drawer's mask sliders exactly. Updates the DOM
 *  imperatively during a drag (like WarpHandle) so a suppressed re-render never freezes
 *  the gesture; onChange also emits each change for the container to persist. */
export function MaskShapeOverlay({ mask, onDragStart, onChange, onDragEnd }: MaskShapeOverlayProps) {
  const shapeRef = useRef<HTMLDivElement>(null);
  const featherRef = useRef<HTMLDivElement>(null);
  const geom = useRef({ cx: mask.cx, cy: mask.cy, rx: mask.rx, ry: mask.ry, feather: mask.feather });
  geom.current = { cx: mask.cx, cy: mask.cy, rx: mask.rx, ry: mask.ry, feather: mask.feather };

  const paint = () => {
    const { cx, cy, rx, ry, feather } = geom.current;
    const s = shapeRef.current;
    const f = featherRef.current;
    if (s) { s.style.left = pct(cx - rx); s.style.top = pct(cy - ry); s.style.width = pct(rx * 2); s.style.height = pct(ry * 2); }
    if (f) { f.style.left = pct(cx - (rx + feather)); f.style.top = pct(cy - (ry + feather)); f.style.width = pct((rx + feather) * 2); f.style.height = pct((ry + feather) * 2); }
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, apply: (nx: number, ny: number) => void) => {
    event.stopPropagation();
    const stage = shapeRef.current?.parentElement;
    if (!stage) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    onDragStart?.();
    const rect = stage.getBoundingClientRect();
    const onMove = (e: PointerEvent) => {
      const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      apply(nx, ny);
      paint();
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      onDragEnd?.();
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  };

  const radius = mask.shape === "rect" ? "2px" : "50%";
  const style = (extra: number) => ({
    left: pct(mask.cx - (mask.rx + extra)),
    top: pct(mask.cy - (mask.ry + extra)),
    width: pct((mask.rx + extra) * 2),
    height: pct((mask.ry + extra) * 2),
    borderRadius: radius,
  });

  return (
    <>
      <div ref={featherRef} className="mask-shape__feather" style={style(mask.feather)} aria-hidden="true" />
      <div ref={shapeRef} className="mask-shape" style={style(0)}>
        <div
          className="mask-shape__body"
          onPointerDown={(e) => startDrag(e, (nx, ny) => { geom.current.cx = nx; geom.current.cy = ny; onChange?.({ cx: nx, cy: ny }); })}
        />
        <div
          className="mask-shape__edge mask-shape__edge--right"
          onPointerDown={(e) => startDrag(e, (nx) => { const rx = clampR(Math.abs(nx - geom.current.cx)); geom.current.rx = rx; onChange?.({ rx }); })}
        />
        <div
          className="mask-shape__edge mask-shape__edge--bottom"
          onPointerDown={(e) => startDrag(e, (_nx, ny) => { const ry = clampR(Math.abs(ny - geom.current.cy)); geom.current.ry = ry; onChange?.({ ry }); })}
        />
      </div>
    </>
  );
}
```

Add to `control-panel/panel/src/components/index.ts` (after the `MobileTabBar` export):

```ts
export { MaskShapeOverlay } from "./MaskShapeOverlay";
export type { MaskShapeOverlayProps } from "./MaskShapeOverlay";
```

Add to `control-panel/panel/src/components/panel.css`, after the PiP-box rules (~289):

```css
  /* ── On-canvas mask shape — tungsten (layer-stack color, not the cyan render data). ── */
  .mask-shape {
    position: absolute; border: 1.5px solid var(--beam);
    background: rgba(255,155,61,0.06); box-shadow: var(--glow-beam);
    touch-action: none;
  }
  .mask-shape__body { position: absolute; inset: 0; cursor: move; }
  .mask-shape__edge {
    position: absolute; width: 14px; height: 14px; background: var(--beam);
    border: 1px solid var(--ink); border-radius: 2px; touch-action: none;
  }
  .mask-shape__edge--right { right: -7px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
  .mask-shape__edge--bottom { bottom: -7px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
  .mask-shape__feather {
    position: absolute; border: 1px dashed var(--beam-line); opacity: 0.5; pointer-events: none;
  }
```

- [ ] **Step 4: Build to verify it passes (plus tsc + lint)**

Run: `cd control-panel/panel && npm run build-storybook && npx tsc --noEmit && npm run lint`
Expected: all pass; the `Ellipse`/`Rect` stories render a draggable shape with edge handles and a dashed feather ring.

- [ ] **Step 5: Commit**

```bash
cd control-panel/panel
git add src/components/MaskShapeOverlay.tsx src/components/MaskShapeOverlay.stories.tsx src/components/index.ts src/components/panel.css
git commit -m "$(cat <<'EOF'
Add MaskShapeOverlay on-canvas editor (panel)

A tungsten draggable mask shape (ellipse/rect) over the confidence
monitor: body drag -> cx/cy, right edge -> rx, bottom edge -> ry, with
a dashed feather-preview ring. Imperative during drag, onChange emits
each change. Feather stays a slider. Storybook stories for both shapes.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: Mask edit mode — button, banner/Done, handle swap, mobile jump

**Files:**
- Modify: `control-panel/panel/src/components/FxDrawer.tsx` (add "Edit on canvas" button + `onEditMask` prop)
- Modify: `control-panel/panel/src/components/LayerStrip.tsx` (thread `onEditMask` to `FxDrawer`)
- Modify: `control-panel/panel/src/components/ChannelRack.tsx` (thread `onEditMaskLayer` down)
- Modify: `control-panel/panel/src/components/WarpEditor.tsx` (mask-edit banner + swap handles for `MaskShapeOverlay`)
- Modify: `control-panel/panel/src/app/App.tsx` (`maskEditLayerId` state; wire it through `ChannelRack` and `screenAside`; mobile jump)
- Modify: `control-panel/panel/src/components/panel.css` (banner styles)

**Interfaces:**
- Consumes: `MaskShapeOverlay` (Task 15); the existing `actions.updateLayer(id, field, value)` path; `beginDrag`/`endDrag` (App's re-render suppression); `Layer` type.
- Produces: `FxDrawerProps` gains `onEditMask?: () => void`; `LayerStripProps` gains `onEditMask?: () => void`; `ChannelRackProps` gains `onEditMaskLayer?: (id: string) => void`; `WarpEditorProps` gains `maskEditLayer?: Layer | null`, `onMaskChange?: (field: string, value: unknown) => void`, `onMaskEditDone?: () => void`. App holds `maskEditLayerId: string | null`; activating it (from any layer's FX drawer) swaps the Screen tab's warp handles for the mask shape, shows a `Editing mask — <layer>` banner with a `Done` button, and on mobile switches `activeMobileTab` to `"screen"`. No new server state (reuses `mask.*`).

- [ ] **Step 1: Add the button to `FxDrawer`**

In `control-panel/panel/src/components/FxDrawer.tsx`, import `Button` (add to the imports, ~1):

```tsx
import { Button } from "./primitives/Button";
```

Add `onEditMask` to `FxDrawerProps` (after `onUpdate`, ~12):

```ts
  /** Opens the on-canvas mask editor for this layer (Screen tab). */
  onEditMask?: () => void;
```

Destructure it (~110) and render it inside the Mask `FxSection`, right after the shape toggle (~153):

```tsx
export function FxDrawer({ fx, mask, onUpdate, onEditMask }: FxDrawerProps) {
```

```tsx
          {onEditMask && <Button label="Edit on canvas" onClick={onEditMask} />}
```

- [ ] **Step 2: Thread it through `LayerStrip` and `ChannelRack`**

In `control-panel/panel/src/components/LayerStrip.tsx`, add to `LayerStripProps` (after `media?`):

```ts
  /** Opens the on-canvas mask editor for this layer. */
  onEditMask?: () => void;
```

Add `onEditMask` to the destructured props and pass it to `FxDrawer` (the render at the end of the strip):

```tsx
      {fxOpen && layer.fx && <FxDrawer fx={layer.fx} mask={layer.mask} onUpdate={onUpdate} onEditMask={onEditMask} />}
```

In `control-panel/panel/src/components/ChannelRack.tsx`, add to `ChannelRackProps` (after `media?`):

```ts
  /** Opens the on-canvas mask editor for a given layer. */
  onEditMaskLayer?: (id: string) => void;
```

Destructure `onEditMaskLayer` and pass it per-strip:

```tsx
            onEditMask={() => onEditMaskLayer?.(layer.id)}
```

- [ ] **Step 3: Add banner + handle swap to `WarpEditor`**

In `control-panel/panel/src/components/WarpEditor.tsx`, extend imports:

```tsx
import { Button } from "./primitives/Button";
import { MaskShapeOverlay } from "./MaskShapeOverlay";
import type { Layer, Point, Screen } from "./types";
```

Add to `WarpEditorProps` (after `onDragEnd?`):

```ts
  /** When set, the stage edits this layer's mask shape instead of warp handles. */
  maskEditLayer?: Layer | null;
  onMaskChange?: (field: string, value: unknown) => void;
  onMaskEditDone?: () => void;
```

Add the three to the destructured props list. Then render a banner above `<div id="warp-editor">`'s content and swap the stage children. Add the banner right after the opening `<div id="warp-editor">` (~55):

```tsx
        {maskEditLayer && (
          <div className="mask-edit-banner">
            <span className="mono">Editing mask — {maskEditLayer.name || maskEditLayer.id}</span>
            <Button label="Done" onClick={onMaskEditDone} />
          </div>
        )}
```

Replace the `<ConfidenceMonitor>...</ConfidenceMonitor>` children with a conditional (mask overlay vs. warp handles):

```tsx
        <ConfidenceMonitor ref={ref} previewFrame={previewFrame}>
          {maskEditLayer ? (
            <MaskShapeOverlay
              mask={maskEditLayer.mask}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onChange={(patch) => {
                for (const [k, v] of Object.entries(patch)) onMaskChange?.(`mask.${k}`, v);
              }}
            />
          ) : (
            points.map((p, i) => (
              <WarpHandle
                key={i}
                x={p.x}
                y={p.y}
                selected={i === selectedPoint}
                cornerTag={isMesh ? undefined : CORNER_TAGS[i]}
                coordTag={isMesh ? `R${Math.floor(i / size) + 1}·C${(i % size) + 1}` : undefined}
                onSelect={() => setSelectedPoint(i)}
                onDragStart={onDragStart}
                onDragTo={(x, y) => onMovePoint?.(i, x, y)}
                onDragEnd={onDragEnd}
              />
            ))
          )}
        </ConfidenceMonitor>
```

Also guard the coordinate-entry row (Task 14) so it hides during mask edit — change its condition to `{selected && !maskEditLayer && (`.

- [ ] **Step 4: Own the state in `App` and wire mobile jump**

In `control-panel/panel/src/app/App.tsx`, add state (~68):

```ts
  const [maskEditLayerId, setMaskEditLayerId] = useState<string | null>(null);
```

Add an activator that also jumps to the Screen tab on mobile (near the other `useCallback`s, ~167):

```ts
  const editMask = useCallback(
    (id: string) => {
      setMaskEditLayerId(id);
      if (isMobile) setActiveMobileTab("screen");
    },
    [isMobile],
  );
```

Pass `onEditMaskLayer={editMask}` to `ChannelRack` (in the `layerRack` region added in Task 11). Pass the mask-edit props to `WarpEditor` (in the `screenAside` region):

```tsx
        maskEditLayer={maskEditLayerId ? state.layers[maskEditLayerId] ?? null : null}
        onMaskChange={(field, value) => { if (maskEditLayerId) actions.updateLayer(maskEditLayerId, field, value); }}
        onMaskEditDone={() => setMaskEditLayerId(null)}
```

(If a layer is deleted while its mask is being edited, `state.layers[maskEditLayerId]` is `undefined` → `null`, so the editor cleanly falls back to warp handles.)

- [ ] **Step 5: Style the banner**

In `control-panel/panel/src/components/panel.css`, add near the warp editor rules:

```css
  .mask-edit-banner {
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-2);
    margin-bottom: var(--space-2); padding: var(--space-2) var(--space-3);
    background: var(--beam-soft); border: 1px solid var(--beam-line); border-radius: var(--radius-sm);
    color: var(--beam); font-size: 10px; letter-spacing: 0.08em;
  }
```

- [ ] **Step 6: Verify (build, lint, live)**

Run: `cd control-panel/panel && npx tsc --noEmit && npm run lint && npm run build-storybook`
Expected: all pass.

Live: open a layer's FX drawer, click **Edit on canvas**. The Screen tab (right column / mobile Screen tab) shows the banner `Editing mask — <name>`, the warp handles are replaced by the tungsten mask shape, and dragging the body/edges updates `state.layers.<id>.mask.cx/cy/rx/ry` (verify via `/state`) and the render client's mask live. **Done** clears the mode and restores the warp handles. On a 390px viewport, clicking Edit on canvas from the Layers tab switches to the Screen tab automatically.

- [ ] **Step 7: Commit**

```bash
cd control-panel/panel
git add src/components/FxDrawer.tsx src/components/LayerStrip.tsx src/components/ChannelRack.tsx src/components/WarpEditor.tsx src/app/App.tsx src/components/panel.css
git commit -m "$(cat <<'EOF'
On-canvas mask edit mode (panel)

An "Edit on canvas" button in the FX drawer's mask section puts the
Screen tab into a focused mask-edit mode: a banner + Done, the warp
handles swapped for the MaskShapeOverlay, wired to the layer's mask.*
leaves (no new server state). On mobile it also jumps to the Screen tab.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Spec coverage map (self-review)

Every spec section maps to a task:

| Spec section | Task(s) |
|---|---|
| 1. Media library — server state container + `ensureStateDefaults` backfill | Task 2 |
| 1. Media library — allowlist (mp4/gif/jpg/jpeg), server-generated filenames | Task 1 |
| 1. Media library — `POST /api/media` (raw body + `X-File-Name`, size cap up-front + streamed) | Task 3 |
| 1. Media library — `GET /media/:filename` (safe-filename guard, Content-Type, Range, CORS `*`) | Task 3 |
| 1. Media library — `DELETE /api/media/:id` (file + state entry + broadcast) | Task 3 |
| 1. Media library — rename via plain WS `update` on `media.<id>.name` | Task 7 |
| 1. Media library — `MEDIA_DIR`/`MEDIA_MAX_BYTES`, Docker `/data/media` reuse | Task 3 |
| 1. Media library — panel pane (rows: name/type tag/size/delete), XHR upload + progress, `accept=` | Tasks 6, 7 |
| 1. Media library — layer source `Select` from `state.media` + "External URL…" | Task 8 |
| 1. Media as a layer source — `<img>` for gif/image, gif per-frame vs jpg once, `source.type` stays `"video"` | Task 4 |
| 2. IA — media pane persistent above the rack | Tasks 7, 11 |
| 2. IA — five show-control cards → one tabbed section | Task 9 |
| 2. IA — mobile (<720px) 4-tab bottom bar, one section at a time; tablet 720–1099 unchanged | Task 11 |
| 3. Touch — `--tap-min: 44px` via `@media (any-pointer: coarse)` across all controls | Task 12 |
| 4. Layer strip — 7-col grid → responsive 2-row card | Task 10 |
| 5. Warp — corner tags TL/TR/BR/BL; mesh hover/tap `R·C`; live drag readout | Task 13 |
| 5. Warp — tap-to-select + type exact coordinates | Task 14 |
| 6. Mask — `MaskShapeOverlay` (drag body/edges, feather stays a slider, tungsten) | Task 15 |
| 6. Mask — "Edit on canvas" focused mode: banner/Done, swap warp handles, `maskEditLayerId` in App, mobile jump to Screen | Task 16 |
| Testing — server `media.test.js`; render Playwright gif-animates; new-component stories; mobile-viewport screenshots | Tasks 3, 4, 6/11/15, 11 |

Placeholder scan: none (no `TBD`/`TODO`/"add error handling" — every code step is complete). Type consistency spot-check: `MediaItem`/`MediaKind`, `PanelState.media`, `MediaLibraryProps`, `renameMedia`/`removeMedia`/`httpBase`, `ChannelRack.media`/`LayerStrip.media`, `WarpHandleProps.{cornerTag,coordTag,selected,onSelect}`, `MaskShapeOverlayProps.onChange`, and `WarpEditorProps.{maskEditLayer,onMaskChange,onMaskEditDone}` are defined once and referenced with the same names/signatures downstream.

## Open questions surfaced during planning (resolve with the user before/at implementation)

These were **not** settled by the spec. None block starting Phase A; flag before the phase noted.

1. **Deleting media that a layer still points at (before Phase C/Task 8).** The spec's `DELETE` removes the file + state entry but says nothing about layers whose `source.url` references it. This plan leaves such a layer's URL stale — the render client simply fails to load it (blank layer), no crash. Alternatives if the user prefers: (a) block deletion while any layer references the file, or (b) surface a "used by N layers" warning in the delete affordance. **Chosen default:** allow deletion, layer goes blank. Confirm this is acceptable.

2. **Media URL host portability (before Phase B/Task 4).** Library sources are stored host-independently as `/media/<filename>` and resolved by each render client against the origin derived from its own `?ws=` param (matching how the README already addresses every service by the control-plane host). This is an implementation decision, not in the spec. It is correct for the documented single-control-plane-host deployment; confirm no split-host setup (operator browser and render machine reaching the server at different hostnames) is expected, which would need an absolute-URL scheme instead.

3. **Playwright availability for the browser-level gates (Tasks 4, 11, 12, 16).** The repo's README describes a "scripted Playwright pass" but `playwright` is not in any `package.json`. The verification scripts in those tasks assume `playwright` is runnable (e.g. globally, or `npx playwright`). If it is not installed, either add it as a `panel` devDependency in Task 4 (a one-line change) or substitute manual browser observation for the browser gates. Confirm which.

4. **Upload display `name` (minor, Task 3).** This plan stores the client-supplied filename verbatim as the editable `name` (e.g. `Ambient loop.mp4`). If the user would rather strip the extension for the display name, that is a one-line change in `handleUpload`. Default: keep the full filename.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-06-panel-ux-and-media-library-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints for review.

Which approach?

- If **Subagent-Driven**: REQUIRED SUB-SKILL — use `superpowers:subagent-driven-development` (fresh subagent per task + two-stage review).
- If **Inline Execution**: REQUIRED SUB-SKILL — use `superpowers:executing-plans` (batch execution with checkpoints).

Suggested sequencing: Phases A→B→C→D→E→F→G in order. Phase A (server, Tasks 1–3) and Phase B (render-client, Task 4) are independently mergeable and unblock the panel's end-to-end media flow; within Phase C→G, tasks are ordered so each App/component edit builds on the previous (Task 11 consolidates the App render regions that Tasks 7–10 introduce, so do not reorder 7–11).
