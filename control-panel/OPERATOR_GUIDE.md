# Operator guide — running a show from the projection deck

This is for the person driving the show, not the person building the software. It
assumes someone has already got the server, render client(s), and panel running (see
[`README.md`](README.md) → "Running it") and you have the panel open in a browser
pointed at the control-plane.

## The layout

The panel is a **projection deck**, built around one dominant idea: the picture you're
projecting is the interface. There's no separate "click a layer in a list, then hunt for
its controls in another list" — you click the thing on the preview and its controls show
up right there.

```
 command bar:     wordmark | screen tabs | MASTER fader | BLACKOUT | BLIND | ●connected
 left rail:        look bar: numbered look chips · +save · focus
  OUTPUT row       the Stage:                              inspector:
  layer stack       live preview of the selected            the SELECTED thing's
  media bin          screen's output — click-to-select       controls — Warp / Mask /
  shared slots       regions per layer, Warp·Mask·FX         FX sections, always listed
                      chips, drag-media-to-assign
 show drawer (bottom, collapsible): Looks · Source sets · Cues · Timers · Motion · MIDI · Media · Cast
```

**Drag and drop is the fast path.** Every thumbnail in the left rail's **media bin** drags
onto a layer row, a shared slot, or straight onto the Stage (the layer whose picture is
under the drop point gets it). Drop video/gif/jpg files from your computer onto the bin
to upload them. Double-click a bin item to put it on the selected layer. Every one of
these lands on the same source controls the Inspector offers — the pickers remain for
touch and precision.

On a phone or anything under 720px wide, the left rail and inspector collapse into
bottom-sheet tabs instead — the Stage stays dominant either way. A status lamp in the
command bar tells you the truth about the connection: green dot + "connected" is good;
amber "connecting" or red "disconnected"/"error" means the panel can't currently reach
the server, and nothing you do will reach the render clients until it recovers (it
retries automatically).

## The core workflow: click it, then shape it

This is the pattern you'll use for almost everything:

1. **Click a layer's picture on the Stage** (or its row in the left rail's layer stack —
   either selects the same layer). The topmost layer under your click wins if things
   overlap; clicking empty space deselects.
2. Once selected, its **warp corners or mask shape appear as draggable handles directly
   on the Stage** — you're editing the actual picture, not a separate diagram of it.
3. The **Inspector** on the right fills in with that layer's controls: source, opacity,
   blend mode, and three **always-visible sections — Warp, Mask, FX** — each header
   showing its live state at a glance (`corner`, `ellipse · inverted`, `all on`, …).
   Click a header to expand that section; the expanded section also decides what's
   drawn on the Stage:
   - **Warp** → corner-pin handles (or a mesh grid, if you've switched the layer to mesh
     mode) for that layer's own warp.
   - **Mask** → the mask's shape (rectangle, ellipse, or a polygon's vertices) drawn over
     the preview, draggable.
   - **FX** → no handles on the Stage (just a faint bounding box); the section shows
     the full effects chain instead.

Dragging a handle updates state immediately and every connected render client follows
live — you're never dragging against the actual full-res projector output, only the
small preview the render client pushes, so you can warp or mask a screen you're not
standing in front of.

## Media library

The **Media** tab in the Show drawer is a persistent shelf of every video, gif, and jpg
you've uploaded to this installation — it stays put regardless of which layer or preset
you're working on. Click **+ Upload** and pick a file (mp4, gif, or jpg/jpeg); the button
relabels itself "Uploading NN%" while it transfers. Rename an entry in place by editing
its name field, or hit its **×** to delete it. Deleting removes the underlying file, so
double-check no layer or source-bank slot is still using it first — anything left
pointing at a deleted file just loses its picture.

Anything in the library becomes available in every layer's and every source-bank slot's
source picker.

## Layer stack (left rail)

The layer stack is your stack of video sources, shown top-of-stack-first — the top row
draws over the ones below it, same as VPT8.

- The pinned, cyan-tinted **OUTPUT row at the very top is the projector itself** — the
  thing every layer below composites into. Select it to put the Stage and Inspector in
  screen-warp mode (see "Screens and screen/output warp" below); select any layer row to
  come back to layer editing.
- Each row's thumbnail shows the layer's **actual content** (its color, its media's own
  picture, or a CAM/slot tag). **Double-click the name to rename** it in place, and
  **drop a media-bin thumbnail on a row** to make it that layer's source.
- Click a row to select that layer (same as clicking it on the Stage).
- Drag a row to reorder it, or use its **▲ / ▼**.
- **⧉ / ⇩** on a selected layer's Inspector header copies its whole "look" (opacity,
  blend mode, mask, every FX value) and pastes it onto another layer — paste is disabled
  until you've copied something.
- **+ Add layer** adds a new one (defaults to a flat grey solid-color layer).
- **×** removes a layer.

## Slot grid (left rail): the shared source bank

Below the layer stack, the **slot grid** shows the 8 shared source-bank slots as a
compact grid of cells — a filled slot shows a cyan-tinted state. A slot holds a live
source (media, camera, or color) that any number of layers can point at at once, sharing
one clip's transport instead of each layer decoding its own copy.

- Click a slot to open its editor: assign media/camera/color, and (in the Show drawer's
  Media/Sources context) save or recall a **source-bank preset** — a snapshot of all 8
  slots at once, useful for swapping "clip set A" for "clip set B" mid-show.
- Use the slot editor's **next / prev / random** buttons to step a slot's assigned clip
  without leaving the deck.
- A layer points at a slot instead of its own source by switching its Source picker to
  that slot; from then on, that layer's Inspector Transport controls (see below) drive
  the *slot's* shared transport, not a private copy.

## The Inspector: Warp · Mask · FX

Selecting a layer (Stage or rail) opens its Inspector. The header has the layer's name,
source picker, opacity fader, and blend-mode dropdown. Below that, the three-way switch:

### Warp

Corner-pin drags just the four corners (good for keystone correction on an individual
layer — think projecting one clip onto one irregular surface within a larger scene);
mesh subdivides into a grid (density 2–10) you drag point-by-point for more elaborate
correction, smoothed into a curved surface rather than a faceted one. This is a layer's
**own** warp, independent of — and applied in addition to — the screen/output warp
described below. **Reset** snaps the current mode back to identity.

### Mask

Toggle the mask on, pick its shape:

- **Rectangle / ellipse** — drag the shape's body on the Stage to move it, its edges to
  resize it (independent horizontal/vertical), same as the Inspector's numeric center/
  size faders. Feather is a slider only, shown as a fainter outline previewing its
  extent.
- **Polygon** — an arbitrary-shape mask with a vertex editor right on the Stage: drag any
  vertex to reshape it, click on the outline between two vertices to insert a new one
  there, select a vertex and delete it to remove it. Use this for masking onto an
  irregular physical surface a rectangle or ellipse can't follow.
- **Invert** — flips which side of the shape is visible (mask the outside instead of the
  inside).
- **Matte source** — instead of a shape, drive this layer's mask from another source's
  luminance (a video or image where bright = visible, dark = masked out) — pick the
  matte source in the Inspector's Mask body.

### FX

Four grouped sections, each independently switchable on/off (the toggle next to each
section header bypasses that whole stage without discarding its dialed-in values — set
an amount, then flip it off and on without losing the number):

- **Transform** — flip horizontal/vertical, tile X/Y (repeat the source as a grid), zoom
  (uniform or non-uniform X/Y independently), anchor X/Y (the pivot point zoom and
  rotation are centered on), rotation, pan X/Y.
- **Color** — blur, motion blur (choose **trail** — temporal feedback smear — or
  **directional slide** — VPT8-style motion streak), brightness, contrast, saturation.
- **Edge blend** — left/right/top/bottom ramps plus gamma, for feathering the edge of one
  projector's image into an overlapping one; **invert** fades the center instead of the
  edges (for the opposite kind of overlap correction).
- **Transport / Playlist** — if this layer (or the slot it points at) is a video, play/
  pause, rate, loop mode (**off / loop / palindrome / once**), pan/vol, loop in/out
  points, and a scrub bar to seek by dragging. Toggle **Playlist** to switch the layer
  from a single fixed source to an ordered list of media items that auto-advance on their
  own (still images on a timer, video when it finishes playing).

Every fader shown at its neutral "stage off" value (opacity 1, zoom 1, blur 0, etc.)
reads dimmed, so a glance at the Inspector tells you which stages are actually doing
something even before you check their enable toggles.

## Screens and screen/output warp

The command bar's screen tabs switch which physical output you're looking at and
editing. Each screen has its **own** warp — separate from any individual layer's warp —
applied to the whole composited scene right before it hits that screen's output. This is
the equivalent of physically correcting one projector's keystone/lens distortion, as
opposed to warping one clip within the scene.

- **+** on the screen tabs creates a new screen (starts identity-warped — no correction
  applied — and a render client picks it up by opening its URL with `?screen=<the-new-
  id>`, shown next to the name field).
- The screen's display name is editable inline; the id next to it (e.g. `screen-1`) is
  what a render client's URL actually needs and never changes.
- Select the **OUTPUT row** at the top of the layer stack and the Stage's handles belong
  to the **screen's** warp instead of a layer's — the same corner-pin/mesh toggle,
  density selector, drag-to-warp, and Reset described above under the Inspector's Warp
  section apply here too. Selecting any layer row returns to layer editing.
- Each handle is tagged so you always know which point you're touching — corners show
  `TL`/`TR`/`BR`/`BL`; mesh points show their row·column (`R2·C3`). Tap or click a handle
  to select it (it highlights), then **nudge it with the arrow keys** — ~1 pixel per
  press, hold Shift for ~10px — for exact registration no drag can hit; Escape deselects.
  Hold **Ctrl while dragging** to snap the handle to a coarse alignment grid.

## Cast windows (PiP)

The Show drawer's **PiP** tab manages floating overlay windows for casting or embedding
YouTube video on the selected screen. These are a plain rectangle on top of the layer
stack — they can't be masked or warped like a real layer, and (for the same reason a
cross-origin video can't be read into the panel's preview capture) they never show their
actual video content on the Stage, only an empty box — that's expected, not broken.

- Drag a window's title bar to move it, its bottom-right corner to resize it.
- **V** toggles visibility. **×** removes the window.
- Fill in a title and a YouTube video ID directly, or use casting: with the
  cast-receiver running, a phone's YouTube app on the same network can "Cast" to this
  installation like it would to a Chromecast, which fills in the video ID and shows the
  window automatically.
- **+ Add window** creates a new one on the currently selected screen.

## Presets and the look bar

The Show drawer's **Presets** tab captures your current scene — every layer, every
screen's warp, every cast window, and the audio owner — as one named snapshot.

The same presets also appear as numbered chips in the **look bar directly above the
Stage** — that strip is your live triggering surface: click a chip (or press its number
key, **1–9**) to fire that look mid-show, and **+ save** to snapshot the current scene
under an auto-name. The bar is deliberately trigger-only — renaming and deleting stay in
the Presets tab, so nothing on the live surface can destroy a look. Build each look in
rehearsal (or behind BLIND), save it, and run the show from the chips.

- Type a name and hit **+ Save current** to capture the current look.
- Click a preset chip to recall it instantly.
- Double-click a chip to rename it in place; hover it and click the small **×** in the
  corner to delete it. Deleting a preset never touches your live scene.

Presets deliberately do **not** capture the cue list, timers, modulation, the shared
source bank, or the master/blackout/blind controls — recalling one moves the picture,
not your show's automation or your hard safety controls. (The shared source bank has its
own, separate preset system — see "Slot grid" above.)

## Cue list & transport

The Show drawer's **Cues** tab is a script: an ordered list of steps the transport runs
through.

- **GO** (the big button) advances to and runs the next cue; **STOP** halts wherever the
  interpreter currently is (a half-finished fade just stays half-finished — nothing
  snaps).
- The readout next to the buttons tells you STANDBY or RUNNING, and previews what the
  *next* GO will do ("next 02 — Build").
- Click a cue's index number to arm it directly — the next GO runs that cue, letting you
  jump around the list without stepping through everything in between.
- **+ Add cue** appends a step. Each cue has a type:
  - **Cut to preset** — recall a preset instantly.
  - **Fade to preset** — interpolate every numeric value toward the preset over however
    many seconds you set, then land exactly on it.
  - **Wait** — pause for a number of seconds before continuing.
  - **Go to cue #** — jump to another cue's index; a cue that points at an earlier one is
    how you build a loop.
  - **Source preset** — recall a source-bank preset (swap the shared slots' clip set).
  - **Param fade** — tween a single bound value (any dotted state path) from one number
    to another over a set duration, without touching the rest of the scene.
  - **OSC** — send a one-off OSC message out when the cue runs.
- Each cue also has a **manual-GO checkpoint** toggle. Off (the default) means the cue
  auto-continues into the next one as soon as it finishes; on means the transport holds
  there and waits for you to hit GO again — use this to pin a cue as an intentional stop
  in the script rather than a fly-through step.

## Timers

The **Timers** tab holds wall-clock triggers: at a given HH:MM, fire **Cue GO**, recall a
specific preset, or trigger a source action. The ● toggle arms/disarms a timer without
deleting it. A timer only fires once per matching minute — it won't refire if the clock
happens to sit on that minute more than once (e.g. after a system clock adjustment).

## LFO rack (modulation)

The **LFO** tab holds two kinds of row:

- **Oscillators** constantly write a value between **min** and **max** into whatever
  they're targeting, in the chosen waveform (sine, triangle, square, saw, or
  sample-and-held random). Set a rate either freely in Hz or tempo-synced to the rack's
  shared **BPM** (pick a note division instead of typing Hz), give it a **phase** offset
  so multiple LFOs don't all start in lockstep, and flip **waveform invert** to flip the
  wave's polarity without retargeting it.
- **Mixers** don't oscillate themselves — they combine two other LFO rows' current
  values (add, multiply, or crossfade) into one output, useful for shaping a simple
  oscillator into something more complex without hand-authoring a new waveform.

The **target** dropdown (on oscillator rows) is grouped by layer (offering opacity and
every FX/mask numeric control on that layer) plus a **Global → master dim** entry; pick
"custom path…" if you need to target something the dropdown doesn't list. The ~ toggle
starts/stops a row — flip it off before deleting it if you want the target to hold its
last value rather than jump.

## MIDI map

The **MIDI** tab binds a hardware (or software) MIDI controller's knobs/faders to state,
using the same target picker as the LFO rack. This needs **WebMIDI**, which only Chrome
and Edge support — Firefox/Safari will show "webmidi unavailable in this browser" here
and the feature is simply not usable in that browser.

- **+ Add binding**, pick a target, then click **L** (learn) and twist the physical knob
  you want bound — the next MIDI CC message fills in its channel/controller
  automatically. Click **L** again to cancel learn without binding anything.
- Set **min**/**max** to the range the target should scale across as the controller moves
  0–127.

## OSC

Beyond the WebMIDI map, the installation also listens for OSC over UDP by default (so
TouchOSC, QLab, or anything else that speaks OSC can drive any state path without a
WebSocket client) and can **mirror state back out** to a configured host/port — useful
for a control surface that shows live feedback (a TouchOSC layout whose faders move to
match what's happening on the deck, not just send). Turn OSC output on and set its target
host/port from the relevant Show-drawer settings; a cue list's **OSC** cue type sends a
one-off message independent of this always-on mirroring.

## Audio owner

The audio-owner control (command bar) picks which single screen's render client is
allowed to play audio; every other screen mutes its own video/cast audio automatically.
This exists so the same video played across multiple screens doesn't double up or drift
out of sync — there is always exactly one owner.

## Master, blackout, and blind

The command bar has three house-level controls that live outside every preset and cue:

- **Master** fader (0–100%) dims every screen's final output.
- **BLACKOUT** is an instant hard cut to black; hitting it again restores whatever level
  you were at before.
- **BLIND** freezes each screen's last committed live frame in place — the audience sees
  a still image of whatever was on screen the instant you hit it — while the deck keeps
  compositing and pushing the preview underneath, so you can build and check the *next*
  look on the Stage without any of it hitting the live output. The whole Stage frame
  turns **amber** while blind (red LIVE tally otherwise) so there's never a doubt about
  whether your edits are touching the audience.

  Engaging BLIND also **snapshots the live look**, and the button splits in two:

  - **GO LIVE** — commit: the wall unfreezes onto everything you built while blind.
  - **DISCARD** — abandon: the pre-blind look is restored wholesale (layers, screen
    warps, cast windows, source bank) and the wall unfreezes onto exactly what the
    audience was already seeing. Uploads made while blind survive; only their *use* in
    the scene is reverted. Master/blackout are never touched by a discard.

  This is the lighting-console Blind / broadcast preview-program workflow: prepare the
  next look in safety, then either take it or throw it away.

  **Audio while blind** holds like the picture does: clips you load while blind stay
  muted until GO LIVE, volume/pan faders hold at their pre-blind levels, and PiP
  windows hold their pre-blind arrangement. Whatever was already playing keeps playing
  — blind freezes the show, it doesn't cut it. One documented limit: pausing or
  scrubbing a clip that was *already audible* before you went blind is still audible
  (one decoder can't play two positions at once) — leave the live clip's transport
  alone while blind.

None of the three can be moved or undone by a preset recall, a cue fade, or any
automation step — they're the controls that are yours alone, always.

## Keyboard shortcuts

Active anywhere except while typing in a field:

- **1–9** — fire that look-bar chip (scene preset recall).
- **B** — toggle BLIND. (There is deliberately no blackout key — a hard cut to black
  stays a deliberate click.)
- **F** — focus mode: hide the rails and Show drawer so the Stage and look bar are the
  entire surface; press again (or the bar's `focus` button) to bring them back.
- **Arrow keys / Shift+arrows** — nudge the selected warp handle or polygon-mask vertex
  ~1px / ~10px; **Escape** deselects it.
- **Ctrl while dragging a handle** — snap to a coarse alignment grid.
- **Delete / Backspace** — remove the selected polygon-mask vertex.

## If something looks wrong

- **Status lamp red/amber** — the panel isn't connected to the server; check the server
  process and the `?ws=` address in the panel's URL.
- **Stage shows "NO SIGNAL" and never clears** — the render client for that screen either
  isn't running, isn't reachable, or hasn't been pointed at the right screen id (check
  its `?screen=` URL parameter against the id shown next to the screen tabs).
- **Clicking a layer's picture on the Stage doesn't select it** — you may be clicking
  outside its current warp footprint (a heavily warped or off-frame layer's clickable
  region moves with it); select it from the layer stack in the left rail instead.
- **A cast window shows nothing on the Stage** — expected; see "Cast windows" above.
- **MIDI tab says unavailable** — you're not in Chrome or Edge, or you haven't granted
  the browser MIDI permission yet.
- **A slot-sourced layer's Transport controls seem to do nothing** — check whether
  another layer sharing that slot changed the transport out from under you; slot
  transport is shared across every layer pointing at it, by design.
