# Operator guide — running a show from the control panel

> **⚠️ STALE — pending Phase B rewrite (task B2).** This guide describes the old two-column console.
> The panel is now a **"projection deck"** (select a layer by clicking it on the live stage; drag its
> warp corners / mask shape on the stage; edit it in the right-hand Warp·Mask·FX inspector; Presets/
> Cues/Timers/LFO/MIDI/Media/PiP live in the bottom Show drawer; a screen selector + screen warp sit
> in the command bar). Workflows below are conceptually right but the UI locations differ. See the
> repo root's `docs/REMAINING-WORK.md`.

This is for the person driving the show, not the person building the software. It
assumes someone has already got the server, render client(s), and panel running (see
[`README.md`](README.md) → "Running it") and you have the panel open in a browser
pointed at the control-plane.

The panel is laid out in two columns: your **scene** on the left (the media library,
the layer rack, and, below it, show control — presets, cues, timers, modulation), and
the **screen machines** on the right (warp + cast windows for whichever screen is
selected). On a narrow screen — a phone, or anything under 720px wide — this collapses
to a single column with a bottom tab bar instead: **Layers / Screen / Media / Show**,
one section filling the screen at a time. Everything described below works the same
way in either layout; only the arrangement changes. A status lamp top-right tells you
the truth about the connection: green dot + "connected" is good; amber "connecting" or
red "disconnected"/"error" means the panel can't currently reach the server, and
nothing you do will reach the render clients until it recovers (it retries
automatically).

## Media library

Above the layer rack sits the **Media library**, a persistent shelf of every video,
gif, and jpg you've uploaded to this installation — it stays put regardless of which
layer or preset you're working on. Click **+ Upload** and pick a file (mp4, gif, or
jpg/jpeg); the button relabels itself "Uploading NN%" while it transfers. Rename an entry in place
by editing its name field, or hit its **×** to delete it. Deleting removes the
underlying file, so double-check no layer is still using it first — a layer left
pointing at a deleted file just loses its picture.

Anything in the library becomes available in every layer's Source picker, described
next.

## Layers

The **layer rack** (top-left) is your stack of video sources, shown top-of-stack-first
— the top strip draws over the ones below it, same as VPT8.

- **▲ / ▼** — move a layer up or down the stack.
- **Name field** — just a label, purely for you.
- **Source** — pick Video URL, Solid color (pick with the color swatch), or Camera
  (uses whatever webcam the render client's machine has — no live preview of it in the
  panel, since the panel doesn't have camera access itself). Video URL's field is a
  dropdown of everything in the media library; choose "External URL…" from that same
  dropdown to fall back to a plain text box and type/paste an arbitrary URL or path
  instead — the library doesn't take away the ability to point at an outside stream.
- **Blend mode** dropdown and the **opacity** fader next to it.
- **M** — toggle the layer's mask on/off. The square/circle button next to it swaps the
  mask shape between rectangle and ellipse.
- **FX** — opens the effects drawer below the strip (see below).
- **⧉ / ⇩** — copy this layer's "look" (opacity, blend mode, mask, and every FX value)
  and paste it onto another layer. Paste is disabled until you've copied something.
- **×** — remove the layer.
- **+ Add layer** at the bottom of the rack adds a new one (defaults to a flat grey
  solid-color layer).

### The FX drawer

Click **FX** on a strip to expand it. Controls are grouped into four captioned rows:

- **Transform** — flip horizontal/vertical, tile X/Y (repeat the source as a grid),
  zoom, pan X/Y.
- **Color** — blur, motion trail, brightness, contrast, saturation.
- **Edge blend** — left/right/top/bottom ramps plus gamma, for feathering the edge of
  one projector's image into an overlapping one.
- **Mask** — only meaningful once the strip's **M** toggle is on (the caption reminds
  you if it's off): center X/Y, size X/Y, and feather, for positioning and softening
  the mask shape you picked on the strip. Click **Edit on canvas** to position and size
  it by dragging instead of dialing in numbers — see "Editing a mask on canvas" below.

Every fader shown at its neutral "stage off" value (opacity 1, zoom 1, blur 0, etc.)
reads dimmed, so a glance at the drawer tells you which stages are actually doing
something.

## Warp and screens

The top-right panel is the **warp editor**, working against a live low-resolution
preview of that screen's actual output (labeled "NO SIGNAL — awaiting render-client
preview" until the first frame arrives — that's normal for the first second or two
after a render client connects, not a fault).

- The chips at the top switch between screens; **+** creates a new one (it starts
  identity-warped — no correction applied — and a render client picks it up by opening
  its URL with `?screen=<the-new-id>`, shown next to the name field).
- The text field under the screen chips is that screen's display name — rename it to
  whatever's meaningful to you ("Front wall", "Stage left"); the id next to it (e.g.
  `screen-1`) is what a render client's URL actually needs and never changes.
- **Corner pin** vs **Mesh** — corner pin drags just the four corners (good for
  keystone correction); mesh subdivides into a grid you can drag point-by-point for
  more elaborate correction. Switching to Mesh reveals a density selector (3×3 up to
  8×8) — changing density resets that screen's mesh to a fresh identity grid, so do it
  before you start fine-tuning, not after.
- **Reset** snaps the current mode back to identity (no correction).
- Drag the orange handles directly on the preview to warp. What you're dragging is
  never the actual projector output — it's the small preview frame — so you can warp a
  screen you're not standing in front of.
- Each handle is tagged so you always know which point you're touching — corners show
  `TL`/`TR`/`BR`/`BL`; mesh points show their row·column (`R2·C3`). **Tap or click a
  handle to select it** (it highlights) and a pair of **X/Y number fields appears below
  the preview** — type an exact coordinate instead of dragging, useful when you need a
  precise keystone value rather than an eyeballed one.

### Editing a mask on canvas

Clicking **Edit on canvas** next to a layer's mask controls (in its FX drawer) switches
this pane into a focused mask-editing mode instead of warp handles: a banner reads
"Editing mask — `<layer name>`" so you always know which layer you're touching, and
the mask's shape (rectangle or ellipse, matching the strip's shape toggle) is drawn
directly over the preview.

- Drag the shape's **body** to move it (sets center X/Y).
- Drag its **right edge** to resize it horizontally, its **bottom edge** to resize it
  vertically — independent of each other, same as the size sliders.
- Feather isn't a drag handle — it's still a slider in the FX drawer, shown here as a
  fainter outline around the shape previewing its extent.
- Click **Done** in the banner to leave mask-editing mode and go back to normal warp
  editing. On a phone, opening the mask editor jumps you straight to the Screen tab —
  it's the same "show me the picture" shortcut either way.

## Cast windows (PiP)

Below the warp editor, "Windows — `<screen>`" manages floating overlay windows for
casting or embedding YouTube video on the selected screen. These are a plain rectangle
on top of the layer stack — they can't be masked or warped like a real layer, and (for
the same reason a cross-origin video can't be read into the panel's preview capture)
they never show their actual video content in the confidence-monitor preview, only an
empty cyan box — that's expected, not broken.

- Drag a window's title bar to move it, its bottom-right corner to resize it.
- **V** toggles visibility. **×** removes the window.
- Fill in a title and a YouTube video ID directly, or use casting: with the
  cast-receiver running, a phone's YouTube app on the same network can "Cast" to this
  installation like it would to a Chromecast, which fills in the video ID and shows the
  window automatically.
- **+ Add window** creates a new one on the currently selected screen.

## Presets

The **Presets** card captures your current scene — every layer, every screen's warp,
every cast window, and the audio owner — as one named snapshot.

- Type a name and hit **+ Save current** to capture the current look.
- Click a preset chip to recall it instantly.
- Double-click a chip to rename it in place; hover it and click the small **×** in the
  corner to delete it. Deleting a preset never touches your live scene.

Presets deliberately do **not** capture the cue list, timers, modulation, or the master
fader/blackout — recalling one moves the picture, not your show's automation or your
hard safety controls.

## Cue list & transport

The **Cue list** card is a script: an ordered list of steps the transport runs through.

- **GO** (the big button) advances to and runs the next cue; **STOP** halts wherever
  the interpreter currently is (a half-finished fade just stays half-finished — nothing
  snaps).
- The readout next to the buttons tells you STANDBY or RUNNING, and previews what the
  *next* GO will do ("next 02 — Build").
- Click a cue's index number to arm it directly — the next GO runs that cue, letting
  you jump around the list without stepping through everything in between.
- **+ Add cue** appends a step. Each cue has a type:
  - **Cut to preset** — recall a preset instantly.
  - **Fade to preset** — interpolate every numeric value toward the preset over however
    many seconds you set, then land exactly on it.
  - **Wait** — pause for a number of seconds before continuing.
  - **Go to cue #** — jump to another cue's index; a cue that points at an earlier one
    is how you build a loop.

## Timers

Wall-clock triggers: at a given HH:MM, fire either **Cue GO** or recall a specific
preset. The ● toggle arms/disarms a timer without deleting it. A timer only fires once
per matching minute — it won't refire if the clock happens to sit on that minute more
than once (e.g. after a system clock adjustment).

## LFO rack (modulation)

Each row is one oscillator constantly writing a value between **min** and **max** into
whatever it's targeting, at the **Hz** rate you set, in the chosen waveform (sine,
triangle, square, saw, or sample-and-held random).

The **target** dropdown is grouped by layer (offering opacity and every FX/mask
numeric control on that layer) plus a **Global → master dim** entry; pick "custom
path…" if you need to target something the dropdown doesn't list. The ~ toggle
starts/stops the oscillator — flip it off before deleting the row if you want the
target to hold its last value rather than jump.

## MIDI map

Binds a hardware (or software) MIDI controller's knobs/faders to state, the same
target picker as the LFO rack. This needs **WebMIDI**, which only Chrome and Edge
support — Firefox/Safari will show "webmidi unavailable in this browser" here and the
feature is simply not usable in that browser.

- **+ Add binding**, pick a target, then click **L** (learn) and twist the physical
  knob you want bound — the next MIDI CC message fills in its channel/controller
  automatically. Click **L** again to cancel learn without binding anything.
- Set **min**/**max** to the range the target should scale across as the controller
  moves 0–127.

## Audio owner

"Audio on:" in the header picks which single screen's render client is allowed to play
audio; every other screen mutes its own video/cast audio automatically. This exists so
the same video played across multiple screens doesn't double up or drift out of sync —
there is always exactly one owner.

## Master fader & blackout

Also in the header: a **Master** fader (house dim, 0–100%) and a **BLACKOUT** button.
Master multiplies every screen's final output — turn it down to dim the whole show, or
hit BLACKOUT for an instant hard cut to black. Hitting BLACKOUT again restores whatever
level you were at before.

This is deliberately outside the preset/cue system: no preset recall, no cue fade, and
no automation step can move it or undo a blackout. It's the one control on the panel
that's yours alone.

## If something looks wrong

- **Status lamp red/amber** — the panel isn't connected to the server; check the server
  process and the `?ws=` address in the panel's URL.
- **"NO SIGNAL" that never clears** — the render client for that screen either isn't
  running, isn't reachable, or hasn't been pointed at the right screen id (check its
  `?screen=` URL parameter against the id shown next to the warp editor's name field).
- **A cast window shows nothing in the preview** — expected; see "Cast windows" above.
- **MIDI section says unavailable** — you're not in Chrome or Edge, or you haven't
  granted the browser MIDI permission yet.
