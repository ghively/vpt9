# VPT Modernization Roadmap & Track Reconciliation

This doc reconciles the two pieces of work in this repo and records, in writing, a decision that
was previously only made in conversation. It also records what was actually verified live on a
real (non-sandboxed) machine, as of 2026-07-04.

## The two tracks, and the decision between them

[`docs/superpowers/specs/2026-07-02-vpt8-architecture-audit-design.md`](superpowers/specs/2026-07-02-vpt8-architecture-audit-design.md)
scoped a **read-only audit** of the original Max/MSP app and deliberately left one question open:
*"Direction (stay-in-Max-and-upgrade vs. eventually port to another stack) is intentionally left
open, to be decided later using this audit as evidence."* That audit produced
[`architecture/00-overview.md`](architecture/00-overview.md), 11 module docs, and
[`TECH_DEBT.md`](TECH_DEBT.md) (78 findings).

The very next day, work began on `control-panel/` — a browser/Node/WebGL2 replacement — without
ever writing down the direction decision the audit called for. Commit messages reference "the
earlier design conversation" for scope calls (e.g. hardware control surfaces out of scope), but
that conversation isn't captured anywhere in this repo's history.

**This doc makes it explicit: the direction chosen is "port to a web stack" (`control-panel/`),
superseding "stay in Max."** Nobody should have to reconstruct that from commit messages again.

## What porting to `control-panel/` resolves vs. inherits from `TECH_DEBT.md`

Going category by category (see `TECH_DEBT.md` for the 78 individual findings):

- **platform-gap** — Mostly resolved by construction. Syphon (Mac-only GPU sharing), the hardcoded
  `viddll`/`hap` decode engines, and the macOS-only serial defaults are all VPT8-specific; a
  browser/WebGL stack has no equivalent dependency. **Exception:** Art-Net/DMX and MIDI/OSC/serial
  hardware control surfaces are explicitly out of scope for `control-panel` per its own README —
  this category isn't fixed, it's deferred with no replacement built yet.
- **toolchain-version** (Max 7.3.5 pin, mixed 32/64-bit saves) — Moot if VPT8 is fully retired;
  still live if any Max-side work continues in parallel.
- **closed-dependency** (missing `OSC-route.mxo`, `Ldiv`/`Lmult`/`Label` externals with no source) —
  Moot for `control-panel` (no Max runtime involved at all); only matters if VPT8 keeps running.
- **dead-code / naming-inconsistency** — VPT8-specific, orthogonal to the new stack.
- **architectural-fragility** — This is `control-panel`'s biggest structural win. VPT8's layer
  system is three parallel bpatcher representations (engine/GUI/tabs) kept in sync only by
  convention across three separate scripts. `control-panel`'s server state is a single
  id-keyed source of truth (`server/src/state.js`) — that whole class of bug can't recur.
- **hardcoded-limit** (fixed `videobank01`-`videobank08` enumeration) — Resolved: `control-panel`'s
  create/delete-by-id protocol has no fixed slot count.
- **no-tests-ci** — **Not** resolved. `control-panel` has zero automated tests, same as VPT8. All
  verification so far (both in the prior sandboxed session and in this one) has been manual/agent-
  driven exercise, not a test suite that runs on its own.
- **licensing** (VPT8 is CC BY-NC-SA 3.0, non-commercial) — Does not automatically transfer to new
  code. If `control-panel` is ever meant to be distributed, its own license is still an open
  decision — nothing currently states one.

## Gaps neither track has touched

- **Camera sources (`cam1`/`cam2`).** Track A's own overview doc flags this as a coverage gap it
  never deep-dived. `control-panel`'s state model only knows `source.type: "video" | "color"` —
  no camera source exists there either. If live camera input matters for a real installation, this
  is unaddressed on both sides.
- **Hardware control surfaces & the LFO modulation rack.** VPT8's 100-row control router and
  10-slot LFO rack (MIDI, OSC, Art-Net, serial/sensor input) have no `control-panel` equivalent at
  all yet — deliberately deferred, per the README, not attempted.
- **Real Chromecast hardware / a real phone casting** — the DIAL/SSDP implementation is
  spec-correct for the subset of the protocol YouTube uses, but has never been exercised against
  actual hardware.

## What was verified live on this machine today (not a cloud sandbox)

Everything `control-panel/README.md` previously called "verified" happened in a different,
sandboxed Linux agent environment. On this Windows machine, today:

- `npm install` succeeded for `server` (needs `ws`) and `cast-receiver` (no deps).
- All 20 JS source files across `server`, `render-client`, `panel`, and `cast-receiver` pass
  `node --check`.
- All four services started cleanly and stayed up: control-plane (`:8080`), render-client static
  serve (`:8081`), panel static serve (`:8082`), cast-receiver (SSDP `:1900` + DIAL HTTP `:8090`).
- The WebSocket protocol was exercised with two real independent client connections: one sent an
  `update`, the other received the broadcast, confirming the core state-sync loop actually works
  outside the original sandbox.
- The DIAL device description (`/dd.xml`) served correctly.
- `POST /api/pip/:pipId/cast` was called directly and correctly flipped `pip-1` to
  `visible: true` with the posted `videoId` — the cast-to-PiP hook works end-to-end.

**Still not verifiable here:** real WebGL rendering/visual compositing, drag-based warp editing,
real YouTube iframe playback, and real phone-to-DIAL discovery — this environment has no working
browser automation (the Chrome extension wasn't connected, and installing Playwright's Chrome
channel failed for lack of admin rights, which wasn't pursued further). See "Try it yourself"
below — this is the one class of behavior that needs a human with a browser.

## The untracked-source risk, now with a decision to make

`vpt8 source code/` — the actual Max project — has never been committed to this git repo (no
history on that path at all). Now that direction has explicitly shifted to replacing it, decide:
commit it as a historical reference (recommended — it's the only copy, and every Track A doc cites
file:line references into it that will silently rot if the folder changes or is lost), or
explicitly `.gitignore` it with a note explaining why not.

## Suggested next steps, in priority order

1. Decide on committing (or explicitly ignoring) `vpt8 source code/` — it's currently one wrong
   command away from being unrecoverable.
2. Open the running services in a real browser yourself (below) to confirm actual visual
   compositing/warp/masking — the one thing this session couldn't check by tool.
3. Decide whether camera sources and hardware control surfaces are ever in scope for
   `control-panel`, or permanently out — right now that's an implicit "no one's decided."
4. If in scope, write a spec for them the way Track A specced the audit and Phase 1 specced the
   scaffold — this repo's pattern so far is "spec before build" for the audit and "build then
   audit" for control-panel; either is fine, but pick one on purpose per feature.
5. Add a minimal automated test (even just `node --check` + one scripted WS round-trip like the
   one used above) to close the no-tests-ci gap for at least the server, since that's cheap and
   this session just proved it's easy to script.

## Try it yourself right now

The four services are still running locally from this session:

- Control-plane: `http://localhost:8080` (state at `/state`, health at `/health`)
- Render client: `http://localhost:8081/index.html?screen=screen-1&ws=ws://localhost:8080`
- Panel: `http://localhost:8082/index.html?ws=ws://localhost:8080`
- Cast-receiver: DIAL on `:8090`, SSDP on UDP `1900`

Open the panel and the render client side by side in your own browser and drag an opacity slider —
that's the one behavior this session verified at the protocol level but couldn't confirm visually.
