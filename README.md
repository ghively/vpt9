# vpt9

Two things live in this repository:

1. **`vpt8 source code/`** — the original **VPT (VideoProjectionTool) 8**, a free
   live video-projection/VJ app by HC Gilje, built in Cycling '74 Max/MSP/Jitter,
   64-bit only (Mac and Windows), released May 2018, licensed
   [CC BY-NC-SA 3.0 Unported](vpt8%20source%20code/VPT8-sourcecode-readme.rtf). It's
   reference/archival material here — read-only unless you have Max/MSP (with Jitter)
   installed to open it. See [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) for how
   it's organized.

2. **`control-panel/`** — an actively developed **browser-based replacement**: a
   Node/WebSocket state server with a cue-list/timer/LFO automation engine and an OSC
   listener, a WebGL2 render client (one instance per physical screen), a React
   operator panel, and a DIAL/SSDP receiver so a phone can "Cast" YouTube into it. No
   Max/MSP required — runs via Docker or as plain Node/Vite processes. Start here:
   - [`control-panel/README.md`](control-panel/README.md) — architecture, state shape,
     WebSocket/OSC protocol, build & run instructions. *(developers)*
   - [`control-panel/OPERATOR_GUIDE.md`](control-panel/OPERATOR_GUIDE.md) — how to run
     an actual show from the panel once it's running. *(operators)*

## Documentation map

| Doc | Audience | Covers |
|---|---|---|
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Both | Why `control-panel/` exists, what's built, what's left, the license decision |
| [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) | Developers | Working in `vpt8 source code/` (Max/MSP) |
| [`docs/architecture/00-overview.md`](docs/architecture/00-overview.md) | Developers | Full module-by-module map of VPT8's 49 Max patchers |
| [`docs/TECH_DEBT.md`](docs/TECH_DEBT.md) | Developers | Categorized technical debt in the original VPT8 source |
| [`docs/CONTROL_PANEL_SPEC_AUDIT.md`](docs/CONTROL_PANEL_SPEC_AUDIT.md) | Developers | Closed spec-compliance audit of `control-panel/` |
| [`docs/CONTROL_PANEL_CODE_QUALITY.md`](docs/CONTROL_PANEL_CODE_QUALITY.md) | Developers | Code-quality audit of `control-panel/`: error handling, data-integrity, and test/lint gaps, with reproduced bugs |
| [`control-panel/README.md`](control-panel/README.md) | Developers | `control-panel/` architecture, protocol, build/run, verification log |
| [`control-panel/OPERATOR_GUIDE.md`](control-panel/OPERATOR_GUIDE.md) | Operators | Running a show from the panel |

## License

`vpt8 source code/` is licensed CC BY-NC-SA 3.0 Unported — see
`vpt8 source code/VPT8-sourcecode-readme.rtf`. `control-panel/` has no license chosen
yet; that's tracked in [`docs/ROADMAP.md`](docs/ROADMAP.md) as an open decision to make
before ever distributing it.
