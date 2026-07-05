# VPT control panel — building with this component library

How a design agent should compose UI from the VPT panel components. Everything named
below exists in the built library.

## Setup / wrapping

- **No React provider or context is required.** Every component is styled by one global
  stylesheet. Ensure the design system's `styles.css` (it `@import`s the tokens, base
  primitives, and panel CSS) is loaded once at the app root — without it, components
  render unstyled.
- The panel is built for a dark **venue** ground. Set the page/root background to
  `var(--ink)` (`#08090b`) and let components sit on it. The app shell is a full-height
  flex column; the working area is a two-column grid (a `1fr` layer rack and a `420px`
  instrument column).
- Components are **presentational**: they take props and emit callbacks (`onChange`,
  `onCommit`, `onClick`, …). Wire them to your own state.

## Styling idiom — global classes + CSS custom-property tokens

This system does **not** use utility classes or per-component style props. Components ship
pre-styled by global class names; you style your **own** layout glue with the design
tokens (and a few shared label classes).

Design tokens (use via `var(--*)`):

- Surfaces: `--ink` (venue black), `--panel`, `--panel-raised`, `--panel-sunken`, `--hairline`.
- Text: `--text`, `--muted`, `--muted-dim`.
- Accents — the projection warm/cool duotone: `--beam` (tungsten amber = what the operator
  acts on: selection, active, interactive), `--cool` (cyan = render/preview/machine data),
  `--live` (record red), `--good` (ok green), `--warn` (caution).
- Type: `--font-ui` (sans, editable content), `--font-mono` (mono, labels + data).
- Spacing / radii: `--space-1`…`--space-6`, `--radius-sm`, `--radius-md`.

Shared label classes for your own text: `.label` / `.eyebrow` (mono, uppercase, tracked)
and `.mono` (tabular mono numerals).

Keep the color meaning if you add elements: **warm `--beam` = operator action, cool
`--cool` = machine/preview data.**

## Where the truth lives

Read before styling: `styles.css` and its imports (`tokens/tokens.css`, `tokens/base.css`,
`components/panel.css`) for the exact token + class vocabulary, and each component's own
`.d.ts` / `.prompt.md` for its props.

## Components

Primitives: `Chip`, `ToggleSquare`, `Fader`, `Button`, `Select`, `TextField`, `StatusLamp`.

Composites: `Faceplate`, `AudioOwner`, `ChannelRack`, `LayerStrip`, `ConfidenceMonitor`
(the signature — a projection confidence monitor with a recessed well, registration grid,
and cyan corner crop-marks; a `forwardRef` exposes `setFrame(dataUrl)` for live preview),
`WarpEditor`, `WarpHandle`, `PipManager`, `PipBox`, `PresetsBar`.

## One idiomatic snippet

```tsx
<div style={{ background: "var(--ink)", minHeight: "100vh", fontFamily: "var(--font-ui)" }}>
  <Faceplate
    center={<AudioOwner screens={screens} ownerId={ownerId} onSelect={setOwner} />}
    right={<StatusLamp state="connected" label="connected · ws://localhost:8080" />}
  />
  <div style={{ padding: "var(--space-4)" }}>
    <ChannelRack layers={layers} onUpdateLayer={update} onAddLayer={add} />
  </div>
</div>
```
