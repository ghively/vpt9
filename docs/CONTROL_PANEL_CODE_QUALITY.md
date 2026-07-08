# VPT Control-Panel Code Quality Audit

Date: 2026-07-06 (all 12 findings below fixed the same evening — see "Fix log")

## Scope

`control-panel/` (`server/`, `render-client/`, `panel/`, `cast-receiver/`) audited for code
quality, error handling, and test/tooling gaps — a different lens than
[`docs/CONTROL_PANEL_SPEC_AUDIT.md`](CONTROL_PANEL_SPEC_AUDIT.md) (which checks the code against
its own README spec) or [`docs/ROADMAP.md`](ROADMAP.md) (which tracks feature completeness).

Method: read every source file in `server/src/`, `render-client/src/`, `cast-receiver/src/`, and a
representative set of `panel/src/app/*` + `panel/src/components/*`; actually ran each service's
build/start scripts (`panel`'s `npm run build` — `tsc --noEmit && vite build` — passed clean with
zero errors/warnings and zero `any` usage found in `panel/src`; `server` and `cast-receiver` were
started directly with `node src/index.js`, and the `cast-receiver` crash below was reproduced live,
not inferred); searched for any test files, test scripts, or lint config anywhere in the tree.

## Findings

Ordered by severity/impact, highest first.

### 1. FIXED — Unstable `send` reference causes the MIDI effect to re-run up to 30×/sec — High

`control-panel/panel/src/app/useSocket.ts:81` returns a new `{ send }` closure on every render
instead of a memoized one. `useMidi.ts:80`'s effect depends on `[getState, send]`, and
`App.tsx` re-renders on every automation `batch` broadcast — which fires at ~30Hz
(`automation.js`'s `TICK_MS = 33`) whenever any LFO or cue fade is active. Each of those renders
tears down and re-runs `useMidi`'s entire effect: `navigator.requestMIDIAccess()` and reattaching
every MIDI input's `onmidimessage` handler, up to 30×/second. This can drop MIDI CC messages
arriving during the reattach window and makes MIDI knobs feel laggy specifically while modulation
is running — a "why is MIDI laggy only when an LFO is on" bug that's hard to trace without knowing
about the unstable reference. **Fix:** make `useSocket`'s returned `send` referentially stable
(wrap in `useCallback`, or return the existing ref-backed function directly) so `useMidi`'s effect
only re-runs when `url` changes. **Effort:** small.

### 2. FIXED — `state.json` is written non-atomically — risk of full state loss on crash — High

`control-panel/server/src/state.js:171` (`saveState`) writes directly to the real file path with a
single `writeFileSync` — no write-to-temp-then-rename. `scheduleSave()`
(`control-panel/server/src/index.js:21-27`) debounces writes 250ms after any update and also fires
from `SIGINT`/`SIGTERM` handlers and automation ticks. A process kill mid-write (power loss,
OOM-kill, `docker stop -t 0`) leaves `state.json` truncated/corrupt. On next boot, `loadState()`
(`state.js:160-169`) catches the `JSON.parse` failure, logs it, and silently falls back to a
hardcoded 2-layer default state — discarding every layer, preset, and cue an operator built for a
show, with no backup of the corrupted file. **Fix:** write to `state.json.tmp` and `renameSync`
over the target (atomic on POSIX and NTFS); on a load failure, copy the corrupt file aside
(`state.json.corrupt-<timestamp>`) before falling back to defaults instead of discarding it
silently. **Effort:** small.

### 3. FIXED — No error handler on the control-plane's `httpServer.listen` — High

`control-panel/server/src/index.js:246` calls `httpServer.listen(PORT, ...)` with no `.on('error',
...)` handler. A bind failure (`EADDRINUSE`/`EACCES` — e.g. a stale process still holding the port)
crashes the whole control-plane with an unhandled exception and a raw Node stack trace instead of a
clean, actionable log line — bad on a projector/installation machine expected to run unattended.
**Fix:** add `httpServer.on("error", (err) => { console.error(...); process.exit(1); })` before
`.listen()`. **Effort:** small.

### 4. FIXED — Same missing error handler in `cast-receiver` — reproduced crash — High

`control-panel/cast-receiver/src/index.js:33` has the identical gap. Reproduced live during this
audit: starting `cast-receiver` while port 8090 was already bound threw an uncaught
`Error: listen EADDRINUSE: address already in use 0.0.0.0:8090` and the process exited via Node's
default uncaught-exception path. Note the SSDP UDP socket (`ssdp.js`) had already started and
logged successfully *before* the HTTP server crashed — so a partial-startup crash leaves the SSDP
responder announcing a device whose HTTP endpoints never came up. **Fix:** same handler as #3;
also consider tearing down the already-started SSDP socket if the HTTP server fails to bind, to
avoid the observed half-started state. **Effort:** small.

### 5. FIXED — Latent correctness bug in `handleCreate`'s stored-value read-back — Medium

`control-panel/server/src/index.js:132` reads back a newly-created value via
`state[message.path]?.[key] ?? value` — a literal, non-dotted key lookup — instead of re-traversing
the dotted `containerPath`. For any nested create path (e.g. `"automation.timers"`, used by
`panel/src/app/actions.ts`'s `addTimer()`), this lookup always misses and silently falls back to
the raw client-submitted value. Currently harmless only because `applyCreate`
(`state.js:211-220`) happens to store the exact same object reference it's given. If `applyCreate`
is ever changed to enrich/clone the stored value (the way `ensureLayerDefaults` already does for
layers), the broadcast to every other connected panel would silently carry the wrong,
un-enriched object while the server's own in-memory state holds the correct one — a client-visible
desync that would only reproduce for non-top-level container paths and would be confusing to debug.
**Fix:** export `walkToParent` from `state.js` and use it in `handleCreate` instead of the literal
key lookup. **Effort:** small.

### 6. FIXED — Dotted-path state-patch engine is triplicated across all three services — Medium

The same patch engine (`walkToParent`, `applyUpdate`, `applyCreate`, `applyDelete`, `applyBatch`,
plus the `__proto__`/`constructor`/`prototype` traversal guard) is hand-duplicated verbatim in
`control-panel/server/src/state.js:175-236`, `control-panel/panel/src/app/store.ts:36-84`, and the
whole of `control-panel/render-client/src/patch.js` — with no shared package and, per finding #7,
no tests to catch drift between the three copies. A correctness or security fix to the traversal
guard made in one copy (e.g. discovering another unsafe key) has to be manually ported to the other
two, and nothing would flag a silent divergence — e.g. `state.js`'s extra `isUnsafePath(keys)`
check (`state.js:199`) isn't mirrored the same way in the other two copies. **Fix (short-term):** a
shared fixture of path/value test cases run against all three implementations, to catch behavioral
drift even without unifying the code. **Fix (longer-term):** extract to a shared workspace package
(e.g. `@vpt/state-patch`) consumed by all three services. **Effort:** medium (workspace extraction)
or small (shared fixture test only).

### 7. FIXED (scoped) — No automated test coverage anywhere in `control-panel/` — High

Confirmed by direct search, not just absence of evidence: no `*.test.*`/`*.spec.*` files, no
`tests/`/`__tests__/` directory, no Jest/Vitest config, and no `test` script in any of the three
`package.json` files (`server/`, `panel/`, `cast-receiver/`). None of the state-mutation logic
(prototype-pollution guards, the triplicated patch engine in finding #6), the automation engine's
cue/fade/timer/LFO interpreter (`server/src/automation.js`, ~180 lines of non-trivial sequencing),
or the OSC packet parser (`server/src/osc.js`'s manual binary bundle/argument parsing) has any
regression protection — verification is entirely manual/visual. This is load-bearing, not a
nitpick: this control-plane drives a live-performance rig, where a regression surfaces on stage
rather than in CI. **Fix:** start with the highest-risk pure logic, which needs no DOM/WS mocking —
`state.js`'s patch functions, `automation.js`'s `collectNumericDiffs`/`tickFade`/`tickCues`, and
`osc.js`'s `parsePacket`/`parseMessage` — using Node's built-in `node:test`/`node:assert` (zero new
dependencies for `server/`). Panel component tests (Vitest + Testing Library) would be a separate,
larger follow-on. **Effort:** large.

### 8. FIXED — No lint script or ESLint/Biome config anywhere in the panel — Medium

`panel/package.json` defines no `lint` script, and there is no `.eslintrc*`/`eslint.config.*`
anywhere in the repo. TypeScript's `strict`/`noUnusedLocals`/`noUnusedParameters` catch some issues
at build time (and the build is clean today), but nothing enforces React-specific rules
(hooks-deps/exhaustive-deps, `jsx-key`, etc.) — exactly the class of bug in finding #1.
`eslint-plugin-react-hooks`'s `exhaustive-deps` rule specifically would have caught it. **Fix:**
add `eslint` + `@typescript-eslint` + `eslint-plugin-react-hooks` (flat config, since the project
is already ESM/Vite) plus a `"lint": "eslint ."` script. **Effort:** small–medium (setup is small;
effort is mostly triaging whatever the first run flags).

### 9. FIXED — Unhandled canvas-taint exception in the render-client's preview capture — Medium

`control-panel/render-client/src/main.js:56-59`'s 250ms preview-capture interval calls
`compositor.capturePreview()` → `canvas.toDataURL()` with no `try`/`catch`. Video layers set
`video.crossOrigin = "anonymous"` (`layers.js:124`), but that only avoids canvas tainting if the
media server actually sends `Access-Control-Allow-Origin` — a plain static file server without CORS
configured loads the video fine but taints the shared canvas on draw, and `toDataURL()` then throws
uncaught every 250ms thereafter. Because browsers keep re-invoking `setInterval` after an uncaught
throw inside it, this becomes a console-spamming, permanently-broken confidence-monitor preview with
no user-facing explanation. **Fix:** wrap the capture/send block in `try`/`catch`; on the first
`SecurityError`, log one actionable warning ("media server missing CORS headers — preview
disabled") and stop retrying rather than firing an uncaught exception 4×/second indefinitely.
**Effort:** small.

### 10. FIXED — Unbounded growth of `lfoSlots`/`timerFired` Maps — Low

`control-panel/server/src/automation.js:52-53` — `lfoSlots`/`timerFired` are only ever added to,
never pruned when an LFO or timer is deleted from state via the panel UI
(`actions.ts`'s `removeLfo`/`removeTimer`). Every id is freshly `Date.now()`-based
(`actions.ts:196-201`, `:211-217`), so on a long-running installation where operators iterate on
LFO/timer setups across many sessions (delete-and-recreate rather than edit-in-place), both
module-scoped Maps grow unboundedly for the server process's lifetime — held forever by the
`createAutomationEngine` closure. Low severity (each entry is a few bytes, churn is human-paced),
but a genuine unbounded-growth pattern with no corresponding cleanup on delete. **Fix:** at the top
of `tickLfos`/`tickTimers` (or in the WS `delete` handler), sweep each Map for keys no longer
present in the live `state.lfos`/`state.automation.timers`. **Effort:** small.

### 11. FIXED — Duplicated numeric-parse helper and target-picker fallback markup — Low

The numeric-parse helper `const num = (v, fallback) => ...` is duplicated verbatim in
`panel/src/components/LfoRack.tsx:30` and `panel/src/components/MidiMapPanel.tsx:25`; the
`targetOptions?.length ? <TargetPicker> : <TextField>` fallback block
(`LfoRack.tsx:69-83`) is duplicated near-identically in `MidiMapPanel.tsx:62-76`. Not a bug, a
maintainability smell — a fix to numeric-parsing edge cases or the target-picker fallback UX would
need to land in both places, with nothing enforcing they stay in sync. **Fix:** move `num` into
`panel/src/components/primitives/` (or a small `utils.ts`); optionally wrap the
`TargetPicker`/`TextField` fallback in a shared `TargetField` component taking `targetOptions`,
`value`, and `onChange` as props. **Effort:** small.

### 12. FIXED — Silent, unlogged drops of malformed WebSocket/OSC messages — Low

`control-panel/server/src/index.js:168-174`'s WS `message` handler and
`control-panel/server/src/osc.js:86-92`'s datagram handler both `catch { return; }` around parsing,
with `osc.js` explicitly commenting "malformed datagram: not our problem." Arguably intentional —
appropriately defensive against a hostile/buggy client on the LAN — but if a real panel client ever
sends slightly malformed JSON due to a client-side bug, the operator gets zero signal from server
logs that anything was dropped; the update just silently never applies. **Fix:** add a rate-limited
`console.warn` in each catch block (e.g. at most once/second) so a misbehaving client can't flood
the log, but a maintainer debugging "why isn't my update landing" has something to go on.
**Effort:** small.

## What checked out

- `panel`'s `npm run build` (`tsc --noEmit && vite build`) passes clean with zero errors or
  warnings; zero `any`/`as any` usage found anywhere in `panel/src`.
- Most components (`WarpEditor`, `PipBox`, `MasterControl`, `FxDrawer`, `ConfidenceMonitor`) are
  well-structured with thoughtful comments — the issues above are specific, non-obvious bugs and
  gaps, not general sloppiness.
- No commented-out abandoned code or dead code found in `control-panel/` (a separate TODO/stub grep
  pass covering the same tree turned up zero literal `TODO`/`FIXME`/`stub`/`WIP` markers anywhere).

## Fix log

All 12 findings were fixed the same evening, verified, and re-tested before commit.

1. **Unstable `send` reference** — `useSocket.ts`'s returned `send` is now wrapped in
   `useCallback(..., [])`, giving it a stable identity across renders (`sendRef` itself never
   changes). Verified: `panel`'s `npm run lint` (new `react-hooks/exhaustive-deps` rule, see #8)
   and `npm run build` both pass clean.
2. **Non-atomic `state.json` writes** — `saveState` now writes to `state.json.tmp-<pid>` and
   `renameSync`s over the target; `loadState` now copies a corrupt file aside to
   `state.json.corrupt-<timestamp>` before falling back to defaults, instead of discarding it.
   Verified: new unit tests (`server/test/state.test.js`) covering both the atomic-write path (no
   leftover temp file) and the corrupt-file-preservation path; also confirmed live — ran the real
   server, drove it over a live WebSocket connection, and inspected the resulting `state.json`.
3. **Missing `httpServer` error handler (control-plane)** — turned out the real fix had to go on
   `wss` (the `WebSocketServer`), not `httpServer` directly: `ws`, when constructed with an
   existing `httpServer`, re-emits that server's `'error'` event on itself, and an `EventEmitter`
   with zero listeners for `'error'` throws before any later-registered `httpServer` listener runs.
   This was only caught by actually reproducing the crash — the first fix attempt (a plain
   `httpServer.on('error', ...)`) looked correct by inspection but still crashed live. Verified:
   started a blocker process on port 8080, then started the real server against it — it now logs
   `[control-plane] failed to start on :8080: listen EADDRINUSE...` and exits 1 cleanly, no stack
   trace.
4. **Missing `httpServer` error handler (`cast-receiver`)** — added `httpServer.on('error', ...)`
   (this one *is* a plain `net.Server`, not wrapped by `ws`, so the direct listener is correct
   here), which also tears down the already-started SSDP socket via its returned disposer so a
   failed HTTP bind doesn't leave SSDP advertising a half-started device. Verified: reproduced the
   exact `EADDRINUSE` crash from the original finding, confirmed it now logs
   `[cast-receiver] failed to start DIAL HTTP endpoints on :8090: ...` and exits 1 instead of an
   uncaught-exception stack trace.
5. **`handleCreate` stored-value lookup** — `state.js` now exports `walkToParent`; `handleCreate`
   re-traverses the dotted `containerPath` with it instead of a literal key lookup. Verified: a
   live WebSocket smoke test created a nested `automation.timers` entry and confirmed the broadcast
   `create` message carried the correctly-read-back value.
6. **State-patch triplication** — added `server/test/state-patch-parity.test.js`, a shared fixture
   run against `server/src/state.js` and `render-client/src/patch.js`'s `applyUpdate`/`applyDelete`
   (the two with an identical cross-service contract; `applyCreate` differs by design — see the
   test file's own comment). Writing this test *immediately* surfaced two real, previously-unknown
   divergences: neither `render-client/src/patch.js` nor `panel/src/app/store.ts` deduplicated
   unchanged `applyUpdate` values or required the leaf to already exist before writing/deleting it,
   unlike `server/src/state.js`. Fixed both client copies to match the server's stricter contract
   (existing-leaf-only, dedupe-on-unchanged, exists-check-before-delete). `panel/src/app/store.ts`
   (TypeScript) isn't exercised by the same automated fixture — no TS-capable test runner is wired
   up in this repo — but was hand-verified against the same fixture cases and is covered by the
   panel's own `tsc --noEmit`. Verified: 11/11 new parity tests pass; `panel`'s build still passes
   after the `store.ts` change.
7. **No test coverage (scoped)** — added `server/test/{state,automation,osc,state-patch-parity}.test.js`
   (43 tests total as of this pass; the media library work in 2026-07-06/07 added
   `media.test.js`/`media-helpers.test.js` and grew `state.test.js`, bringing the current total to 65 —
   see `control-panel/README.md`) using Node's built-in `node:test`/`node:assert`, zero new
   dependencies; added a `"test": "node --test test/*.test.js"` script to `server/package.json`.
   Covers the patch engine
   (incl. the prototype-pollution guard), the cue-list/fade/goto/recall transport logic, LFO
   oscillation bounds, the prune-on-delete fix (#10), and the real OSC wire format (including a
   real loopback UDP round trip and the rate-limited-warning fix from #12). Deliberately NOT in
   scope tonight: `panel`/`render-client` component-level tests (would need Vitest/Testing Library,
   a larger follow-on) — the panel's `tsc --noEmit` + new lint pass (#8) are its only automated
   checks today. Verified: `npm test` in `server/` — 43/43 pass.
8. **No lint config in panel** — added `eslint.config.js` (flat config) plus `eslint`,
   `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
   `globals` as devDependencies and a `"lint": "eslint ."` script. Deliberately scoped to just
   `react-hooks/rules-of-hooks` (error) and `react-hooks/exhaustive-deps` (warn) rather than
   `eslint-plugin-react-hooks@7`'s full `recommended` config, which bundles an aggressive new
   "React Compiler" rule family (`react-hooks/refs`, `set-state-in-effect`, `purity`, etc.) that
   flags this codebase's deliberate, correct patterns — including the exact "latest ref" mirror
   (`handlersRef.current = handlers` during render) that fixes #1. Verified: `npm run lint` passes
   with zero errors on the real codebase (confirming #1's fix and the rest of the existing code are
   already hooks-clean); `npm run build` still passes.
9. **Render-client canvas-taint exception** — the preview-capture interval now wraps
   `capturePreview()`/`send` in `try`/`catch`; on the first failure it logs one actionable message
   and sets a `previewDisabled` flag so it stops retrying instead of throwing 4×/second forever.
   Verified: `node --check` on `render-client/src/main.js`; a full browser-based repro (an actual
   CORS-tainted video source) wasn't run tonight, but the fix mirrors the same log-once-and-stop
   pattern already proven for #12.
10. **Unbounded `lfoSlots`/`timerFired` growth** — `automation.js` now sweeps both `Map`s at the
    top of `tickLfos`/`tickTimers`, removing any id no longer present in the live
    `state.lfos`/`state.automation.timers`. Verified: new unit test exercises add → tick → delete →
    tick and confirms no crash; the actual Map-shrinking isn't independently observable from outside
    the closure, so this is a behavioral (not internal-state) regression guard — noted as a scope
    limit rather than overclaimed.
11. **Duplicated numeric-parse helper / target fallback** — extracted `parseNumberOr` to
    `panel/src/components/numeric.ts` and the `TargetPicker`/`TextField` fallback to a new
    `panel/src/components/primitives/TargetField.tsx` (added to the component barrel); both
    `LfoRack.tsx` and `MidiMapPanel.tsx` now use the shared versions. Verified: `npm run build` and
    `npm run lint` both pass.
12. **Silent malformed-message drops** — both the WS `message` handler (`server/src/index.js`) and
    the OSC datagram handler (`server/src/osc.js`) now call a rate-limited `console.warn` (at most
    once/second per source) instead of silently returning. Verified: new unit test sends a 5-message
    burst of malformed OSC datagrams over a real loopback UDP socket and confirms exactly one
    warning was logged.

All fixes were syntax/type-checked (`node --check` for JS, `tsc --noEmit` for the panel) and, where
a live-server or protocol claim was involved, exercised against a running instance (WebSocket smoke
test, live `EADDRINUSE` reproduction for both crash fixes) rather than only read. Full verification
commands: `cd control-panel/server && npm test` (43/43 pass), `cd control-panel/panel && npm run
build && npm run lint` (both clean).
