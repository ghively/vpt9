# design-sync notes — VPT Control Panel

Repo-specific decisions the converter run depends on. Read before re-syncing.

## Build shape

- The panel is a Vite **app**, not a library, so design-sync consumes a dedicated
  **library build**: `npm run build:lib` (`vite.lib.config.ts` → `dist-lib/index.js` +
  per-component `.d.ts` via `vite-plugin-dts`, plus `scripts/build-lib-css.mjs` →
  `dist-lib/vpt-panel.css`, the concatenated compiled CSS). `cfg.buildCmd` runs it.
- `package.json` `main`/`module`/`types` point at `dist-lib/` **so the converter's
  `findTypesRoot` can resolve the entry `.d.ts`** and enumerate the component exports.
  Without `types`, it falls back to the package root and finds 0 components.
- `cfg.entry = dist-lib/index.js`, `cfg.cssEntry = dist-lib/vpt-panel.css`.

## Decisions

- **`PipManager` was renamed to `PipWindows`.** The converter's `isComponentName`
  (dts.mjs) excludes any export ending in `Manager`/`Placements`/`Context` as a
  presumed utility. `PipManager` is a real component, so it's `PipWindows` now.
- **`cfg.provider = VenueGround`.** The design system is dark-only; `VenueGround` is a
  bundle export (not a card) that wraps every preview on the venue-black `--ink` ground,
  so cards render as the components are meant to be seen (and match the Storybook
  reference's venue background). Distilled into config, so README/prompt wrap guidance is
  correct.
- **`cardMode: "column"`** on `ChannelRack`, `LayerStrip`, `PresetsBar`, `WarpHandle` —
  they render wider than a grid cell (`[GRID_OVERFLOW] wide`).

## Re-sync risks (watch these)

- **`[FONT_MISSING]` is ACCEPTED, not fixed.** `--font-mono` names `Cascadia Mono` /
  `JetBrains Mono`, which aren't shipped as `@font-face`. These are a *system fallback
  stack* (degrades to `ui-monospace`/`Consolas`), not custom fonts — the DS pane renders
  with system mono by design. If a re-sync should ship real woff2, use `cfg.extraFonts`.
- **Rebuild the reference Storybook** (`npx storybook build -c .storybook -o
  .design-sync/sb-reference`) whenever stories or component source change — a stale
  reference grades against the old design. It is gitignored and rebuilt per clone.
- **All 17 grades are `match`**, graded from images on the venue ground. No `close`, no
  skips. Story caps not hit (≤4 stories/component).
- Component previews are generated (not owned) — no `.design-sync/previews/*.tsx` forks to
  maintain.
