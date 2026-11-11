# The toy style: 3D figures, an analogy, 25 seconds

A second house style next to the bean style. Where a bean short is a 60 s
story with a twist, a toy short is a 20 to 30 s argument: one analogy, the
app as the missing piece, a call to action. Soft 3D toy figures in a lit
set, a serif title, one caption line per thought, the real app on a phone
that floats above the figure's head.

Pick it with `"style": "toy"` in script.json and
`new_short.sh --style toy <slug>`. Everything else (timeline, lint, review,
render, finish) is the same engine and the same commands.

## Where it comes from

An X post by @cesaralvarezll (2026-11-09,
https://x.com/cesaralvarezll/status/2119836686222061855) quoting
@jacobrodri_ (2026-11-08) about the running app Renno: 2.4M views on one
reel, number 65 on the App Store with no ad spend, 2K MRR in two months,
"videos made with Claude". The post embeds the 24 s reel and a screenshot of
the account's grid.

What the grid shows, on one account:

| Format | Views |
|---|---|
| 3D toy figure reels (three of them) | 2.1M, 490K, 338K |
| Flat motion-graphic reels (three) | 107K, 90K, 88K |
| Filmed footage (three) | about 9K each |

Same app, same account, same weeks: the 3D look is the variable. That is
the case for this style.

What the replies add (read 2026-11-10):

- Nobody shared the prompt or skill; several asked.
- One maker running the same format reports high views and weak
  conversion. The author's answer: cheap to make in bulk, so still worth it.
  Treat views from this format as reach, and measure installs separately.
- The quoted author expects the format to saturate soon.
- The only attribution anyone named is a tracked link in the bio.

The reel was studied muted, frame by frame. Whether it has a narrator is
unknown: its audio credit is a platform music track. The pace below comes
from how long each caption stays up.

## Second-by-second map of the 24 s reference

Paraphrased, not quoted, except the hook.

| Time | Beat | On screen | Words (about) |
|---|---|---|---|
| 0-2.5 | **Hook** | Night bedroom, a figure sits up in bed. Serif title at the top: "You've never skipped a 5 AM flight." Each word turns red as it is said | 7 |
| 2.5-4.5 | **Proof it is hard** | Same figure, a readout top left (last night's sleep, 3 hrs), then the dark window | 6 |
| 4.5-5.5 | **You do it anyway** | The figure runs through a terminal with a suitcase, sunrise outside | 3 |
| 5.5-7 | **Why** | A gate, a boarding pass with a fare on it, a NONREFUNDABLE stamp lands | 3 |
| 7-8.5 | **Turn to the viewer** | Bedside clock at 5:00, running shoes by the bed: your 5 am run? | 4 |
| 8.5-11 | **The gap** | A reminder with nothing staked, a SKIPPED stamp, the snooze | 8 |
| 11-12 | **The app enters** (46%) | The figure sits in bed, a phone floats above its head with the app's real home screen: "<app> fixes that" | 3 |
| 12-14.5 | **Mechanic, step 1** | Same framing, two more real screens swap in: put money on it, join | 8 |
| 14.5-16.5 | **Mechanic, the cost** | A banknote flies out of the window, a readout: skip it, -$5 | 4 |
| 16.5-20.5 | **Mechanic, the reward** | Sunrise street, the figure runs past a house; the phone shows a leaderboard, then a wallet balance going up. A small line under the phone says the data is simulated | 12 |
| 20.5-22.3 | **Callback** | Shoes at the front door, the boarding pass again, now made out for the morning run; the same stamp lands | 4 |
| 22.3-24 | **End card** | Light background, logo, small tagline, a two-line slogan, a button, "Free on the App Store" | 0 |

Counted from it: 14 camera setups in 24 s (one every 1.7 s), about 62
words (about 155 a minute), 16 caption lines of 2 to 6 words, five
different real app screens, the app on screen for 40% of the runtime,
three stamps and two readouts.

## Rules taken from it

**Story: an analogy, not a plot**

1. Something everyone does without fail, although it is hard. Say why:
   there is a stake (money, a person waiting, a deadline).
2. The thing the viewer keeps skipping. Same effort, no stake.
3. The app supplies the stake. Show the mechanic in three screens: what you
   do, what skipping costs, what doing it gets you.
4. Call back to the opening prop, now made out for the viewer's own task.

The app enters just before the middle and stays. That is earlier and
plainer than in a bean short, and it works because the analogy has already
made the argument.

**Picture**

- Chunky 3D figures: a rounded drum head with two glossy bead eyes and a
  small mouth, a hair cap, a hoodie, capsule limbs, coloured shoes. No
  outlines. The engine's figure is its own design (`ToyFigure`), not a copy
  of any product's.
- The look is the lighting: one soft key light with soft shadows, a tinted
  sky fill, fog, a dark vignette, a warm practical light (lamp, clock) in
  the dark scenes.
- Colour tells the story: deep blue night while the problem stands, orange
  sunrise once the app has turned it. One turn.
- Long lens (fov 30 to 38), the camera always drifting or pushing.
- The figure sits low in the frame whenever the phone is up, so the phone
  floats in clear space above its head and never covers the face.
- The phone shows the whole screenshot. The one element a line talks about
  (the reminder, a settings row) is lifted out of it as a large card, whole
  ("One element, large and whole" below).
- Two or three flat graphics carry the punchlines: a rubber stamp, a
  two-line readout, a paper ticket.

**Words**

- Lower case, second person, present tense. Two to six words a line. One
  thought per line, no asides.
- The hook is a title: big italic serif at the top, the spoken word in the
  accent colour.
- Every other line is one small italic serif caption, mid-frame, the whole
  line at once.
- About 130 to 160 words a minute: 50 to 70 words for 25 s.
- The app's name is said once, when it enters. The end card carries it the
  second time.

## Budget

| Item | Target |
|---|---|
| Length | 20-30 s (lint warns outside 18-35 s) unless another length was asked for ("Other lengths" below) |
| Words | 50-70 |
| Pace | 130-160 wpm (lint warns outside 100-185) |
| VO lines | 14-20, each 2-6 words |
| Shots | 12-18, a new setup about every 1.7 s, none over 2.6 s |
| App | enters at 40-50% of the runtime, 3-5 real screens |
| Stamps, readouts, tickets | 3-5 in all |
| Sound effects | 4-8: a stamp thud on each stamp, a ding when the app enters, the end card |
| Light | one turn, at the reward beat |

## Other lengths

20-30 s is the default because the reference is 24 s. When the request
names a length, set `"targetSeconds"` in script.json; the timeline and the
lint then check against that number, give or take 15%. The pace stays
130-160 wpm and a setup still changes about every 1.7 s. A longer toy
short needs more argument, not the same 60 words read slowly.

| targetSeconds | Words | VO lines | Shots | Shape |
|---|---|---|---|---|
| 15 | 33-40 | 8-11 | 8-10 | Hook, the gap, the app in two screens, end card. No callback |
| 25 (default) | 50-70 | 14-20 | 12-18 | The analogy template |
| 45 | 98-120 | 26-34 | 24-30 | Two analogies for the same gap, or one analogy and the mechanic shown on two of the viewer's tasks. 6-8 real screens, one light turn |
| 60 | 130-160 | 34-44 | 32-40 | Three examples of "nobody skips this" in quick succession, then the gap, then the mechanic in full. 8-10 real screens |

Only the default has a reference behind it; the other rows are scaled
from it and untested until one is made. The app still enters at 40-50% of
the runtime at any length.

## The analogy template

```
HOOK (0-2.5 s)      "Nobody skips X." Title caption. The figure, the place, the hour.
PROOF (2.5-5)       It is hard: a readout says how hard. You do it anyway.
WHY (5-7)           The stake, on a ticket. A stamp lands on it.
TURN (7-9)          "Your Y?" The same hour, the viewer's own task.
GAP (9-11)          Nothing is at stake. So it does not happen. A stamp says so.
APP (11-12)         "<App> fixes that." Phone up, figure low in the frame.
MECHANIC (12-20)    Three beats, a real screen each: do, cost of skipping, reward.
                    The light turns warm on the reward.
CALLBACK (20-22)    The opening ticket, made out for Y. The same stamp.
END CARD (22-25)    Mark, tagline, slogan, button, note. No caption.
```

Write three analogies for step 1 of the workflow instead of three
loglines: the thing nobody skips, the stake, and the task the app covers.
The stake must be something the app really adds (check
`.cartoon-shorts/app-series.md`); if the app adds none, this template does
not fit that app and a bean story does.

## script.json

```json
{
  "title": "Nobody skips a flight",
  "style": "toy",
  "fps": 30,
  "voice": { "engine": "mlx", "model": "...", "tempo": 1.0 },
  "gapAfterLine": 0.25,
  "tailSeconds": 1.6,
  "autoSfx": false,
  "captions": { "style": "serif", "accent": "#FF4B3A" },
  "lines": [
    { "vo": "Nobody forgets a 5 AM *flight.*", "caption": "title", "shots": [ ... ] },
    { "vo": "you slept three hours.", "shots": [
      { "scene": "bedroom", "params": { "angle": "wide", "readout": { "label": "Last night's sleep", "value": "3 hrs" } }, "camera": { "move": "push" } }
    ] },
    { "vo": "My App.", "caption": "none", "shots": [ { "scene": "endCard", "params": { ... }, "hideCaptions": true } ] }
  ]
}
```

- `style: "toy"` switches the lint limits and the caption default to serif,
  and makes line 1 a title unless it says otherwise.
- `lines[].caption`: `title` (big, at the top, spoken word in the accent),
  `line` (default), `none`.
- `captions`: `accent`, `size` (60), `y` (0.56), `titleSize` (98),
  `titleY` (0.2). `shot.captionY` still moves one shot's caption: use about
  0.68 on a close-up so the line is not on the face, and on a phone shot.
- `*word*` keeps the accent colour once it has been said.
- `autoSfx: false`: this style has no whips to whoosh. Place each cue by
  hand; a stamp's thud takes the stamp's own delay as `offset`.
- Give the title line its own line of VO. A readout or stamp that shares a
  shot with the title sits under it.
- `params.phone` and `params.callout` put the app on screen; the next
  section has their fields and the two lint rules that guard them.

Voice: a calm, low read with `tempo` 1.0, not the fast bean narrator. Or no
voice at all: `"voice": { "engine": "none", "wpm": 135 }` times the
captions for a music-only cut, and the platform sound is added at upload.
Do not put a commercial track in the file (music-and-sfx.md).

## Building blocks (`@engine/toy/...`)

A toy scene is one `ToyStage` with the set and the figure inside it, and
`SceneOverlays` over it:

```tsx
// <short>/scenes/run/Bedroom.tsx
const SEAT = 0.45; // top of the ToyBed mattress
const angles: Record<string, ToyCameraSpec> = {
  wide: { from: [0.55, 1.3, 4.4], to: [0.4, 1.22, 3.9], lookAt: [0.1, 0.95, 0] },
  low: { from: [0.25, 1.45, 3.7], to: [0.2, 1.45, 3.4], lookAt: [0.05, 1.7, 0] }, // room for the phone
};

export function Bedroom({ angle = "wide", mood = "tired", ...overlays }: OverlayParams & { angle?: string; mood?: ToyFaceMood }) {
  return (
    <AbsoluteFill>
      <ToyStage mood="night" camera={angles[angle]}>
        <ToyRoom>
          <ToyWindow position={[1.0, 2.0, -2.19]} />
          <ToyBed position={[0, 0, -0.9]} />
          <ToyNightstand position={[1.15, 0, -1.2]} />
          <ToyLamp position={[1.28, 0.5, -1.28]} />
        </ToyRoom>
        <ToyFigure cast={you} position={[0, 0, 0.1]} pose={toyPoses.sit(SEAT)} mood={mood} />
      </ToyStage>
      <SceneOverlays {...overlays} />
    </AbsoluteFill>
  );
}
```

The starter scenes in `src/toy/demoScenes.tsx` (bedroom, terminal gate,
sunrise street, doorstep insert, end card) are the worked example; copy one
into the short's `scenes/` and change it.

| Piece | File | What it is |
|---|---|---|
| `ToyStage` | `stage/ToyStage.tsx` | One lit three.js scene per shot. `mood`: night, dawn, day, dusk, lamp, terminal. `look` overrides single values. `Practical` is a small shadowless light |
| `ToyCameraSpec` | `stage/ToyCamera.tsx` | `from`, `to`, `lookAt`, `lookAtTo`, `fov` (36), `sway`. The shot's script.json move (push, crash, pan) is added as a real dolly and truck |
| `ToyFigure` | `figure/ToyFigure.tsx` | The character. `cast`, `position`, `facing`, `pose` or `poseKeys`, `walk`, `mood`, `moodFrom` + `moodAt`, `face`, `held`. Breathes and blinks by default |
| `ToyCast` | `figure/toyCast.ts` | Skin, hair (short, bun, long, beanie, bald), hoodie or tee, colours. Keep one object per cast member in the short |
| `toyPoses`, `ToyPose` | `figure/toyPose.ts` | Joints in degrees. Presets: stand, sit(seat), slump(seat), hold, reach, cheer, shrug, pull |
| `ToyWalk`, `ToyFollower` | `figure/toyMotion.ts` | `walk={{ from, to, energy }}`: the legs keep step with the ground covered; energy 1.6 is a run. `ToyFollower` carries a prop along |
| Sets | `props/room.tsx`, `bedroom.tsx`, `living.tsx`, `outdoor.tsx`, `items.tsx` | Room shell, window, door; bed, nightstand, lamp, alarm clock; couch, table, rug; street, house, bush, tree, street lamp; sneakers, suitcase, banknote, mug |
| Shapes | `shapes.tsx` | `Block`, `Pill`, `Ball`, `Drum`, `RoundDrum`, `Ring`, `Clay`, `shade()`: build new props from these |
| `FloatingPhone` | `overlay/FloatingPhone.tsx` | The real capture in a plain phone. Same capture props as `CartoonPhone` (`focus`, `focusTo`, scroll, `videoStart`), plus `x`, `y`, `height`, `entrance`, `note`, and `element` (the box a focus zoom is for; the lint checks it stays whole) |
| `CaptureCallout` | `overlay/CaptureCallout.tsx` | One element of the capture lifted out of the phone as a large card: `src`, `crop` (the element's own edges), `width` (800), `x`, `y`, `corner`, `entrance`, `videoStart`. Grows from the element's place on the phone |
| `SoftTap` | `overlay/SoftTap.tsx` | A soft ring that marks a real tap, in capture fractions. A child of the phone or the callout; `glow` takes the app's accent as "r, g, b" |
| `Stamp` | `overlay/Stamp.tsx` | A rubber stamp that slams in at frame `at`. Audited by `npm run bubbles` |
| `Readout` | `overlay/Readout.tsx` | A spaced label and one big value |
| `Ticket` | `overlay/Ticket.tsx` | A paper ticket: title strip, fields, a stub. A `Stamp` child lands on the ticket |
| `BrandEndCard` | `overlay/BrandEndCard.tsx` | Mark (`name` or `logo`), `tagline`, `headline` lines, `cta`, `note`, `accent` |
| `SceneOverlays` | `overlay/SceneOverlays.tsx` | Takes `readout`, `stamp`, `ticket`, `phone`, `callout` (with `untilSeconds` and a `tap`) from the shot's params, timed with `atSeconds`, so script.json adds them without new scene code |

Units: a figure is about 1.3 tall, the floor is y = 0, a room's back wall
is at z = -2.2, and about 4 units of wall are in view. The figure faces +z;
its left is +x.

## One element, large and whole

An app shot has to pass two tests on the same frame: the text **reads** at
phone size, and the element the line talks about is **whole**, with every
edge on screen. Zooming the phone trades one for the other:

| Focus zoom in a 1000 px phone | Width of the capture on screen | What fits whole |
|---|---|---|
| 1.0 | 99% | everything, too small to read |
| 1.07 | 92% | a full-width banner, settings row or task row, still too small |
| 1.6 | 62% | one button, a title, a chip |
| 2.0 | 50% | half a row |

A notification, a settings row and a task row all span about 92% of the
capture. None of them survives a readable zoom: at 1.6x the banner loses
its last button and the help text runs off the glass. That is how the
first toy short reached its owner (2026-11-10), with every check passing.

So pick by the element's width, measured on the screenshot:

**Full-width element: phone whole, element in a callout.** The phone shows
the screenshot uncut, with no `focus`. `callout` lifts the element out as a
card about 800 px wide, cropped on the element's own edges, so it is about
twice the size it has on the phone and nothing is missing.

```json
"params": {
  "angle": "low",
  "phone": { "src": "app/nag.mp4", "height": 1000, "videoStart": 0.55 },
  "callout": {
    "src": "app/nag.mp4", "videoStart": 0.55,
    "crop": { "x": 0.0389, "y": 0.0658, "w": 0.9222, "h": 0.1267 },
    "y": 0.3, "width": 800, "atSeconds": 0.6,
    "tap": { "x": 0.2, "y": 0.164, "atSeconds": 1.1 }
  }
}
```

- `crop`: open the screenshot (or a still of the recording), read the
  pixels of the element's border and divide by the capture's width and
  height. Crop on the border itself, not inside it and not a guess. Put
  the numbers in the short's `public/app/README.md`.
- It pops out of the element's place on the phone by itself. `entrance:
  "none"` on a shot that continues the last one; `untilSeconds` fades it
  out when the element leaves the recording (a swipe, a tap on Done).
- `width` 800 at the default `x` stays inside the frame through a full
  push and clear of the platforms' right-hand buttons. `corner` matches the
  element's own corner radius (0.07 for a notification, 0.045 for a card).
- The callout sits over the phone, above the figure's head. Move the
  caption down with `captionY` (about 0.66).

**Narrow element: zoom the phone, and declare the element.** A single
button or a title can take a `focus` and `focusTo` zoom. Say what the zoom
is for, in capture fractions, and the lint works out whether it fits:

```json
"phone": {
  "src": "app/home.png",
  "focus": { "x": 0.5, "y": 0.3, "zoom": 1.2 }, "focusTo": { "x": 0.27, "y": 0.34, "zoom": 1.6 },
  "element": { "x": 0.09, "y": 0.325, "w": 0.34, "h": 0.03 }
}
```

**A phone 1200 px or taller** also reads without a zoom, and shows
everything. It rarely leaves room for the figure; check the frame edge.

`npm run lint` guards this (`engine/scripts/lint_app_shots.mjs`):

| Rule | Level | Fires when |
|---|---|---|
| `cut-element` | error | A declared `element` is not inside what the phone shows at the landing zoom; a callout's `element` is outside its `crop`; the phone screen, the element or the callout leaves the frame at the camera move's peak |
| `no-element` | error | The phone is zoomed past 1.08x and declares no `element` |
| `callout-zone` | warn | The callout sits under the platform UI (outside x 0.06-0.87, y 0.12-0.75) |
| `legibility` | warn | Nothing shows the app large enough: no callout at 0.6x of the capture or more (a full-width element about 600 px wide), no phone 1200 px or taller, no zoom of 1.6 |

The lint can only check boxes someone measured. The picture is checked by
eye on `out/textcheck/` (self-review.md), where each frame has the element
from the capture under it, and `app_text_frames.py --check` fails until
every app shot is marked readable and whole.

## Rules that still hold, and the two that change

Still hold, unchanged: the app on screen is real (the phone frame is
drawn, the screen never is), every claim is true, nothing sits still,
it works with the sound off, nothing is posted.

- **Example data needs a note.** If the screens show sample numbers
  (a balance, a leaderboard), say so in `FloatingPhone`'s `note`. The
  reference does.
- **One style per series, not one style for everything.** Do not mix beans
  and toy figures on one account's grid; the look is the account's logo.
- **The end card may ask.** A toy short ends on a button and a note
  instead of "link in bio". The button's words and the note ("Free on the
  App Store") are claims: write them only if app-series.md backs them.

## Review additions

On top of self-review.md:

- [ ] Frame 0 has the whole title on it and the figure's face.
- [ ] The phone never covers the face: use a low angle for phone shots.
- [ ] No caption sits on a face or on the phone; move it with `captionY`.
- [ ] A screen the line talks about is readable **and** its element is
      whole, on the same frame. A full-width element (a reminder, a
      settings row, a task row) goes in a `callout` beside a phone that
      shows the whole screenshot; a `focusTo` zoom of 1.6 is only for an
      element narrow enough to fit, declared in `phone.element`. Fill both
      cells per app shot in `out/textcheck/index.md` and run
      `app_text_frames.py --check`.
- [ ] Every callout shows its element's four edges, and its last button.
- [ ] Each stamp lands on a cut or a beat and has its thud.
- [ ] The light turns once.
- [ ] Faces read in the dark shots. If one is a silhouette, raise the
      mood's `fillStrength` with `look`, or bring the lamp closer.

## Traps found while building it

- A hair piece that wraps the sides at eye level reads as a visor or
  sunglasses in profile. The back piece covers only the back third.
- A high camera on a slumped figure shows the top of its head and no face.
  Slump lightly (the preset does) or drop the camera.
- A phone centred on a centred figure hides the face and leaves two hands
  at the frame edges. Frame the figure low (`lookAt` above its head).
- A title and a readout in the same shot collide at the top left. Give the
  title its own line.
- An insert on a small prop from too close shows blobs. Scale the prop up
  (1.5) and keep the camera two units back with a long lens.
- Brows: `angry` slopes down toward the nose, `worried` up. They were
  swapped in the first build; check a new face on a still.
- Blue light on dark skin goes black without a fill. Every mood has a
  shadowless fill from the camera side for that reason.
- As with the bean style, never scale an overlay to exactly 0; the
  entrances here start at 0.9 or fade in.
- Zooming the phone to make a reminder readable cuts the reminder. This
  file used to recommend a 1.6x zoom with no caveat, and the lint rewarded
  it; a 1.6x window is 62% of the capture and a banner is 92%. Lift
  full-width elements out with `callout`.
- A correct fix must not leave warnings behind, or the next reviewer
  learns to ignore them. When a rule and the right picture disagree, change
  the rule (here: the legibility rule now counts a callout).
