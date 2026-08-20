# vpt9

**vpt9** is a from-scratch, browser-based replacement for **VPT8** (VideoProjectionTool 8) — a free
live video-projection/VJ application built by HC Gilje in Cycling '74 Max/MSP/Jitter and released in
May 2018. VPT8 is discontinued and Max/MSP/Jitter-only; this repo reimplements it as a
Node/WebSocket/WebGL2 web app, at full feature parity with the original, so no Max/MSP install is
required. "vpt9" is this project's working name as VPT8's unofficial successor — it isn't a version
string used anywhere in the code, just the repository's name.

What it does: real-time compositing of multiple video/camera/image layers, per-layer warp
(corner-pin/mesh) and masking, cue-list/timer/LFO automation, bidirectional OSC and MIDI control, and
casting a phone's YouTube video into a picture-in-picture layer over DIAL/SSDP (like a physical
Chromecast).

## What's in this repository

- **`control-panel/`** — the actively developed application described above: a
  Node/WebSocket state server with a cue-list/timer/LFO automation engine and an OSC
  listener, a WebGL2 render client (one instance per physical screen), a React
  operator panel, and a DIAL/SSDP receiver so a phone can "Cast" YouTube into it. No
  Max/MSP required — runs via Docker or as plain Node/Vite processes. Start here:
  - [`control-panel/README.md`](control-panel/README.md) — architecture, state shape,
    WebSocket/OSC protocol, build & run instructions. *(developers)*
  - [`control-panel/OPERATOR_GUIDE.md`](control-panel/OPERATOR_GUIDE.md) — how to run
    an actual show from the panel once it's running. *(operators)*

- **The original VPT8 Max/MSP/Jitter source** that `control-panel/` replaces is **not** in this
  working tree — it was archived and removed on 2026-07-12 once `control-panel/` reached full
  parity with it. It's preserved in full in git history at tag `vpt8-source-archive`
  (`git checkout vpt8-source-archive -- "vpt8 source code"` to retrieve it), including its own
  license file, `VPT8-sourcecode-readme.rtf` (CC BY-NC-SA 3.0 Unported). See
  [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) for how it was organized, and
  [`docs/architecture/00-overview.md`](docs/architecture/00-overview.md) for a full
  reverse-engineered map of it.

## Documentation map

| Doc | Audience | Covers |
|---|---|---|
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Both | Why `control-panel/` exists, what's built, what's left |
| [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) | Developers | The archived VPT8 Max/MSP source (tag `vpt8-source-archive`) — how it was organized |
| [`docs/architecture/00-overview.md`](docs/architecture/00-overview.md) | Developers | Full module-by-module map of VPT8's 49 Max patchers |
| [`docs/TECH_DEBT.md`](docs/TECH_DEBT.md) | Developers | Categorized technical debt in the original VPT8 source |
| [`docs/CONTROL_PANEL_SPEC_AUDIT.md`](docs/CONTROL_PANEL_SPEC_AUDIT.md) | Developers | Closed spec-compliance audit of `control-panel/` |
| [`docs/CONTROL_PANEL_CODE_QUALITY.md`](docs/CONTROL_PANEL_CODE_QUALITY.md) | Developers | Code-quality audit of `control-panel/`: error handling, data-integrity, and test/lint gaps, with reproduced bugs |
| [`control-panel/README.md`](control-panel/README.md) | Developers | `control-panel/` architecture, protocol, build/run, verification log |
| [`control-panel/OPERATOR_GUIDE.md`](control-panel/OPERATOR_GUIDE.md) | Operators | Running a show from the panel |

## License

The archived VPT8 Max/MSP source (git tag `vpt8-source-archive`) is licensed CC BY-NC-SA 3.0
Unported — see `VPT8-sourcecode-readme.rtf` within that tag. Everything else in this repository,
including `control-panel/`, is MIT-licensed — see [`LICENSE`](LICENSE) and
[`control-panel/LICENSE`](control-panel/LICENSE).
