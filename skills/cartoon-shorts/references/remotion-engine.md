# The Remotion engine

The engine (`engine/` in the plugin, run from `~/.cache/cartoon-shorts/engine`) is one Remotion 4 project that renders every short,
render-tested on 2026-11-03
(macOS, Node 26, Remotion 4.0.536, three 0.186.1, @react-three/fiber 9.8.2,
React 19.3.1). Versions are pinned on purpose; upgrade deliberately, not by
accident. Remotion is free for individuals and companies of up to three
people (remotion.dev/docs/license); larger companies need a Remotion
company licence. Check which applies to you.

The reference post credits "the free Claude skill for three.js and
Remotion" without naming it. The likely candidates are the official Remotion
agent skills (`npx skills add remotion-dev/skills`) and the community
three.js skills (github.com/cloudai-x/threejs-skills). They are not
installed here; the engine already encodes what a short needs. Install
them when a short needs an API the engine lacks.

## Layout

A short (`shorts/<slug>/`) holds only its own files:

```
package.json                 every npm script calls ~/.cache/cartoon-shorts/engine/bin/short.mjs <command>
script.json                  VO lines with shots (you write this)
scenes/registry.ts           scene key -> component for this short
scenes/<folder>/*.tsx        this short's scenes; engine imports as "@engine/..."
generated/timeline.json      written by npm run timeline
public/app/                  this short's captures
public/vo/, public/vo.wav    voice-over (npm run timeline)
public/music/bed.wav         music bed (npm run music; takes/ is gitignored)
voice/                       only if the short overrides the shared voice reference
out/, .cache/                renders, review sheets, voice and music caches (gitignored)
.public/, node_modules       made by bin/short.mjs on each run (gitignored)
```

`bin/short.mjs` sets `SHORT_DIR`; `remotion.config.ts` maps `@short` to it
and `@engine` to the engine's `src/`. Public files are served from
`.public/`, hard links of the engine's `public/` (sound kit, brand) with the
short's own on top, and `node_modules` is a symlink to the engine's.
`npm run remotion -- <remotion args>` is the Remotion CLI with the short
wired in (output paths relative to the short).

The engine:

```
bin/short.mjs                runs every npm script for the short it is called from
example/                     the starting short new_short.sh copies (demo captures, demo registry)
public/sfx/, public/brand/   shared sound kit and app icon
voice/series_narrator.*      shared voice reference for the clone voices
scripts/paths.mjs            ENGINE vs SHORT paths for every script
scripts/build_timeline.mjs   script.json -> public/vo.wav + generated/timeline.json
scripts/review_table.mjs     timeline -> out/review.md, the approval table
scripts/finish.sh            -14 LUFS, faststart, upload-ready mp4
remotion.config.ts           ANGLE GL (needed for three.js), h264 crf 18
src/Root.tsx                 one composition "Short", 1080x1920, 30 fps
src/short/Short.tsx          a <Sequence> per shot + VO + music + captions
src/camera/CameraRig.tsx     wraps every shot: applies the move, publishes it to depth layers
src/camera/moves.ts          the moves (push, crash, crashOut, snapZoom, pans...), shake, whip/zoom-blur entries
src/camera/layers.tsx        parallax: DepthLayer, Plate, Foreground, useCameraState, plateCatchUp
src/captions/WordCaptions.tsx one or two words at a time, pop and tilt, emphasis colour, clamped into the safe zone
src/layout/safeZone.ts       where TikTok / Shorts / Reels draw their UI (SAFE_ZONE, safeBox, clampCentreY)
src/characters/Bean.tsx      the house character (Face.tsx, Hair.tsx)
src/world/Room3D.tsx         three-walled toon room; its camera dollies with the shot's move (real parallax)
src/world/ToonBox.tsx        toon material ramp + inverted-hull outline
src/world/props3d.tsx        Desk, Door, Shelf, TrashCan, TrashBag, Couch, Plant, WallWindow
src/phone/CartoonPhone.tsx   drawn bezel, REAL capture inside (no src = phone off, black glass), focus zoom; NotificationDrop
src/phone/CaptureCard.tsx    a crop of a real capture shown big, house outline, entrance
src/phone/CaptureMedia.tsx   draws a capture at an exact rect, reads its pixel size, useCaptureToScreen
src/phone/captureGeometry.ts capture-fraction maths: scroll, focus, crop, capture -> screen
src/scenes/kit.tsx           Actor (optional depth), Sign (taped label), Burst (backdrop), Flies, TapRing (marks a real tap, screen or capture coords), SpeechBurst (re-exported)
src/scenes/speechBurst.tsx   SpeechBurst ("ding.", "WE QUIT."): the star is sized from its own text, never wraps
src/scenes/textBoxAudit.ts   render-time check for SpeechBurst and Sign: logs where each is on screen, warns on cut words
src/scenes/demoScenes.tsx    the smoke-test scenes (RoomWithBag, PhoneReveal, PhoneFocus, CardReveal, EndCard)
src/scenes/                  shared scene pieces (kit, speech bursts, demo scenes); each short has its own scenes/registry.ts
src/theme/palette.ts         ink, outline width, cartoon palette, brand colours
```

## How a frame is built

Each shot is three layers inside one `CameraRig`:

1. **Plate**: `Room3D` (three.js through `@remotion/three`'s `ThreeCanvas`)
   or a flat backdrop (`Burst`, a solid colour, a drawn SVG).
2. **Actors**: `Bean` SVGs placed with `Actor x y` (bottom-centre anchor,
   fractions of the frame), plus `Sign` labels and 2D props.
3. **Phone** (reveal shots): `CartoonPhone` with a real capture.

The rig applies the shot's move as a 2D transform to everything; that is
depth 1, where actors and the phone live. It also publishes the move
(`useCameraState()`), and layers take their own share of it:

| Layer | Depth | How |
|---|---|---|
| `Room3D` plate | 0.5 in 2D, then the three.js camera dollies toward `lookAt` and trucks for the rest | automatic; `plateDepth` prop, 1 = old flat behaviour |
| Flat backdrop | 0.5 | wrap it: `<Plate><Burst .../></Plate>` |
| Actors, signs, phone | 1 | nothing to do |
| Foreground piece | 1.4 | `<Foreground>...</Foreground>` or `<Actor depth={1.5}>` |

Because the 3D camera really moves, the back wall grows less than the
actors and the near floor and furniture more, so a push reads as a camera
moving through a room, not a zoomed picture. The 3D catch-up keeps the
`lookAt` plane registered with the 2D actors (maths in `plateCatchUp`).
A 2D `Sign` taped on the back wall can drift by 10-20 px on a big crash;
if that shows, set `"parallax": 0` on that shot or `plateDepth={1}`.
`Room3D` still adds its own slow dolly (`cameraFrom` to `cameraTo`).
Captions are drawn outside the rig so they never zoom.

### Camera moves (script.json `camera`)

| move | What | Use |
|---|---|---|
| `hold` | 3.5% drift | breathers |
| `push` / `pull` | 16% zoom over the shot (`amount` scales it) | most shots |
| `crash` | springs to 1.5x in about 8 frames | punchlines, faces |
| `crashOut` | opens at about 2.2x on `focusX/focusY`, springs back to 1.06x | the hook: first frame is the labelled detail, then the room |
| `snapZoom` | two hard punch-ins, at the cut and at about 42% | alarms, "it's back" |
| `panLeft`/`panRight`/`tiltUp`/`tiltDown` | 5% travel at 1.14x | walks, reveals |

Other fields: `focusX`, `focusY` (zoom origin, frame fractions), `amount`,
`shake` (px), `parallax` (0 flat, 1 default, 1.5 more depth). All are
frame-based and deterministic.

### Text in a shape: speech bursts and signs

This was caught by eye on an early batch: the "WE QUIT." burst in
checklist-pro wrapped onto two lines, spilled out of its star and ran over
the character's head. The old `SpeechBurst` had a fixed 4.2 x 2.6 em box, so
anything longer than about five capitals overflowed. A sweep of all 21
shorts then found about 80 bubbles and signs whose words were cut by the
frame edge, nearly all pushed out by a camera move (a crash or push from a
bubble placed near the top or right edge).

What the kit does now:

- `SpeechBurst` sizes its star from the real text box (the browser's font
  metrics, not an estimate), never wraps (write `"\n"` for a deliberate
  second line), shrinks when it would be wider than the frame, keeps its
  centre inside the frame before the camera, and draws above actors
  (`zIndex: 30`). Long text gets a bigger star, so check what it now covers.
- `Sign` sizes to its text already (`whiteSpace: pre`).
- Both run `useTextBoxAudit` (`textBoxAudit.ts`) while rendering: it measures
  the on-screen boxes after the camera and logs `[speech-burst]` / `[sign]`
  warnings for words cut by the frame edge, the shape cut, or words on the
  caption line (65.5% to 75.5% down). Warnings show in any `npm run render`
  log; the per-bubble "seen" lines only with `--log=verbose`.
- `npm run bubbles` renders a half-scale preview with that log, and writes
  `out/bubblecheck/`: one labelled tile per bubble or sign appearance, an
  `index.md` with a Verdict column, and the raw log. It exits 1 if any words
  are cut. Problems under 6 frames (a whip passing through) are listed as
  "passing", not flagged. Check a final render's log with the same rule:
  `scripts/bubble_sheet.py out/render.log --log-only` (Pillow venv python).
  Ranges start about 5 frames into a burst's shot (the pop-in is skipped);
  still the middle frame of a range, not its ends.

Placement rules that keep it clean:

- Put a bubble or sign where the shot's move cannot push it out: for a
  `crash` (1.5x at peak, around `focusX`/`focusY`), anything outside the
  middle two thirds of the frame leaves it. Move the bubble toward the zoom
  origin, or move the origin toward the bubble.
- Keep it off faces (eyes and mouth) and off the caption line.
- Split screens: `fitBurst` and the audit only know the frame edge, not a
  panel's clip, so a burst in one half can slide over the divider unflagged.
  `examples/split-screen-screenSpace.tsx` (from a split-screen episode)
  solves it: it finds each panel's visible part after the camera. Copy it
  into a new split short's scenes.
- A new text-in-a-shape component (a thought bubble, a label on a prop) calls
  `useTextBoxAudit(kind, text, wordsRef, shapeRef)` so the check sees it.
  Older shorts have unaudited `ThoughtBubble` / `Thought` components: check
  those by eye.

Size anything that must stay whole (a `CaptureCard`, a sign, the end card
title) for the move's **peak** scale, not the frame `app_text_frames.py`
samples at 70% of the shot. Measured by a reviewer on the 2026-11-04 batch:

| Move | Peak | So a card centred in 1080 px fits at |
|---|---|---|
| `push` / `pull` | 1.16x at amount 1, 1.22x at amount 1.4 | 930 px, 885 px |
| `panLeft` / `panRight` | 1.14x plus a 5% sideways shift (times `amount`) | about 850 px |
| `crash` | 1.5x at amount 1 (1 + 0.5 x amount) | 720 px |
| `wiggle` (CaptureCard) | plus or minus 2.5 degrees on top of `tilt` | a few px narrower again |

Episode reviews kept clipping cards at 920 to 1040 px under a push or a
crash. `CardReveal` sits 38 px left of centre (the safe zone) and wiggles,
so it defaults to 820: 880 clipped its left edge at the peak of a full
push. Either narrow the card (`width`) or soften the move (`amount` 0.5 to
0.6 on a crash). The end card's title is about 780 px wide, so a full crash
put it off both edges; `build_timeline.mjs` now gives an `endCard` shot
with a punch-in move (`crash`, `crashOut`, `snapZoom`) and no `amount` an
amount of 0.15 (crash peaks at 1.075x). `pull` or `push` need nothing.

### Captions and the safe zone

`src/layout/safeZone.ts` is the one place that says where the platforms'
own UI sits on a 1080x1920 frame: top 12%, bottom 25%, right 13%, left 6%
(sources in the file). Captions come in two looks, set once per short with
`"captions"` in script.json:

| | `"style": "reference"` (default) | `"style": "pop"` |
|---|---|---|
| Size | 76 px (`size` overrides) | 136 px |
| Look | white Inter 900, outline 13% of size, hard shadow down-right | white, yellow `*emphasis*`, fat outline, soft drop shadow |
| Motion | hard cut per word | spring pop and small alternating tilt |
| Line | `y` 0.705 (the reference's fixed line) | same |

The reference numbers are measured (format-recipe.md, Measured section).
Groups are one or two words; a word under 0.2 s merges into the next. The
centre is clamped into the safe zone, so a shot's `captionY` above about
0.72 lands there. On a phone or card shot, keep the caption below the card
(cards centre at about 0.42) or put it high (`captionY: 0.2`).

## Adding a scene

```tsx
// <short>/scenes/trash/BagByDoor.tsx (engine pieces imported from "@engine/...")
export function BagByDoor({ swell = 1, mood = "calm" }: { swell?: number; mood?: "calm" | "panic" }) {
  return (
    <AbsoluteFill>
      <Room3D wall={palette.wallWarm} sunPatch={mood === "calm"}>
        <Door position={[-1.2, 0, -2.98]} />
        <TrashBag position={[-0.9, 0, 0.4]} swell={swell} />
      </Room3D>
      <Sign text="TAKE OUT" sub="since tuesday" x={0.3} y={0.6} />
      <Actor x={0.7} y={0.93}>
        <Bean height={880} hair="bowl" face={mood === "panic" ? { eyes: "wide", mouth: "scream", sweat: true } : { eyes: "tired", mouth: "flat" }} />
      </Actor>
    </AbsoluteFill>
  );
}
// then in registry.ts: bagByDoor: BagByDoor
```

Keep each scene file under about 150 lines; one folder per short under its
`scenes/`. A prop or pose that another short could use goes into the engine's
`src/` when the engine is a developer link (SKILL.md, "Paths and set-up"),
and every short has it from then on.

## Bean cheat sheet

`src/characters/`: `Bean.tsx` draws, `useBeanMotion.ts` works out the
frame, `motion.ts` (idle, blinks, springs), `pose.ts` (pose tweens),
`walk.ts` (walk cycle), `entrance.ts` (entrances, takes), `moods.ts`,
`Face.tsx` with `Eyes.tsx` and `Mouth.tsx`, `Hair.tsx`, `Limb.tsx`. All
motion is a pure function of the shot's frame (frame 0 = start of the
Sequence) and a seed; no `Math.random`, so renders repeat exactly.

- **Alive by default.** Every Bean breathes (about 1.5% squash and
  stretch), bobs its head and blinks on its own schedule (every 2.2-4 s,
  some double blinks). The rhythm comes from `seed`, which defaults to a
  hash of hair, colours and skin, so two cast members never blink together.
  `still` turns it off (a freeze-frame gag, a photo on the wall).
- `mood`: calm, tired, sweat, angry, panic, happy, smug, panicked, shocked,
  sad, sideEye, furious, bored. `face` fields override the mood's:
  `<Bean mood="sad" face={{ tear: false }} />`.
- `face`: `eyes` dots, wide, pin (tiny pupils, shock), happy, tired, half
  (lidded: smug, bored, side-eye), shades, closed; `mouth` smile, grin
  (teeth), gritted, flat, open, o, frown, wobble (about to cry), smirk,
  scream; `brows` none, worried, angry, raised, skeptic (one cocked); extras
  `sweat`, `blush`, `tear`, `anger` (red cross mark).
- `look`: left, right, camera, up, down, in screen space (flip-safe); the
  face shifts a little with it, like a head turn: `<Bean mood="sideEye" look="left" />`.
- `take` + `moodFrom`: a squash-and-stretch jolt at a frame, with the face
  switching at the same moment: `<Bean moodFrom="calm" mood="panicked" take={30} />`.
- `enter`: `pop` (scale up from 0 with overshoot), `slideLeft` (walks in
  from the left edge), `slideRight` (from the right), `drop` (falls in,
  squashes on landing). `enterAt` delays it: `<Bean enter="pop" enterAt={6} />`.
  Stagger a group by 3-5 frames each.
- `pose`: `armL`, `armR`, `legL`, `legR` in degrees from hanging down
  (positive swings outward; 150 is an arm raised high), `bend` -1..1.
  Animate it with `poseFrom` + `pose` + `poseAt`: a 4-frame anticipation the
  wrong way, then a spring past the target and back, so a swat reads as an
  action: `<Bean poseFrom={{ armR: 10 }} pose={{ armR: 130 }} poseAt={12} />`.
  `poseKeys` takes several timed poses (wins over the others), e.g. a wave:
  `poseKeys={[{ at: 0, pose: {} }, { at: 8, pose: { armR: 150 } }, { at: 16, pose: { armR: 120 } }, { at: 24, pose: { armR: 150 } }]}`.
- `walk`: ground speed in screen px per frame. The cadence and stride follow
  it so the feet do not skate; pass the speed the scene moves the Actor at
  (`walkSpeed(x0, x1, frames)` from `motion.ts`). `travel` makes the Bean
  move itself at that speed toward `facing` instead. Legs scissor, arms
  swing against them, the body drops as the legs spread and leans 4 degrees
  forward: `<Bean walk={walkSpeed(0.95, 0.35, durationInFrames)} facing="left" />`.
  The old `walking` flag still works at a default cadence.
- `facing`: right (the drawing) or left; `flip` is the same as left.
- `talk` flaps the mouth in syllables (open, o, shut) for the rare
  on-screen line; `talking` is the old name. The narrator never needs it.
- `hair`: bowl (You), side, messy (bed head, two tufts and a swoop),
  long (centre part, falls past the shoulders), ponytail, bun, bald,
  grayBack, spiky. Spiky's even points read as a crown at small sizes and in
  thumbnails (episode 1's roommate); use messy for a scruffy character and
  keep spiky for a literal king joke. `hairColor`, `skin`, `shirt` from
  `palette` (`palette.hair` has black, brown, grey, blond, auburn, plum).
  `tie` colour for bosses. `jacket` colour draws an open jacket over the shirt (the shirt shows in a V), and `pocketItem` takes SVG poking out of its inside pocket at the left chest (search-tasks: the concert tickets). `rightHandItem` takes SVG drawn at the hand. A phone in hand is `<HandPhone />` (`src/characters/HandPhone.tsx`); `CartoonPhone` is HTML and renders nothing there.
- `height` in px; 850-950 for a full figure in a medium shot, 1600+ for a
  face close-up (or use a `crash` camera on a smaller one).

## Room3D cheat sheet

- Room is 5.4 m wide, back wall at z=-3, floor y=0. Portrait frames see
  about 4 m of wall: keep props within x=+-2.
- Default camera is high and slightly right, like the reference's
  high-angle office shots. Override `cameraFrom`, `cameraTo`, `lookAt`,
  `fov` per scene for inserts (low and close for a prop, top-down for a desk).
- Colours: `wall`, `sideWall`, `floor`; `sunPatch` for the warm light.
  For the cold reveal, pass night colours (`palette.nightBlue`,
  `nightPurple`) and no sun patch.
- New 3D props: build from `ToonBox` (outlined, toon-shaded) or a mesh with
  `meshToonMaterial gradientMap={toonRamp()}` plus a `BackSide` black hull.
- `plateDepth` (default 0.5): how much of the shot's 2D move the plate
  takes; the camera dollies and trucks for the rest. Put `lookAt` at the
  depth where the actors stand (default z=-1), since that plane is the one
  kept registered with them. 1 turns the 3D catch-up off.

## Commands

```bash
npm run timeline        # after every script.json edit
npm run table           # out/review.md for approval
npm run studio          # live preview in the browser (Remotion Studio)
npm run typecheck
npm run still -- out/f.png --frame=120
npm run render          # out/short.mp4
npm run finish          # out/short_final.mp4 (loudness, faststart)
```

The 6.7 s smoke test rendered in 7 s on this Mac, so a 60 s short should
take a minute or two.

## Traps found while building the engine

- Remotion skips symlinked files when it copies the public folder into the
  bundle (a 404 on `vo.wav`), so `.public/` uses hard links.
- A short's scene files live outside the engine folder; without the
  `node_modules` link neither tsc nor webpack finds `@remotion/google-fonts`
  and friends from them.
- Every short shares the engine: change an engine file and every short
  renders differently next time. The 2026-11-04 move onto the shared engine
  re-rendered all 20 unreleased shorts; the only change was the CaptureCard
  outline fix (crops used to lose 18 px at the right and bottom).

## Traps found while building the template

- three.js renders black or fails headless without
  `Config.setChromiumOpenGlRenderer("angle")`; it is in remotion.config.ts.
- Inside a `<Sequence>`, `useVideoConfig().durationInFrames` is the
  sequence's length, not the composition's. The camera and phone scroll
  rely on that.
- `OffthreadVideo`'s `startFrom` is deprecated; use `trimBefore` (frames).
- `meshToonMaterial` has no `flatShading` prop in the r3f types.
- A portrait camera with a landscape-sized room shows one wall and nothing
  else; the first version did. Keep the room narrow.
- Captions at `captionY: 0.86` (episode 1's phone shots) sat under the
  platforms' description and buttons; the safe-zone clamp now stops that.
- A phone at 60% of the frame width makes app text about 12 px tall:
  unreadable on a phone. Every phone shot the VO talks about gets a
  `focus` zoom or a `CaptureCard` (see app-footage.md).
- Text in the 3D world is hard to read and hard to set; put every label in
  the 2D layer with `Sign`.
- Never animate a CSS transform scale to exactly 0 (`scaleY(0)` at frame 0):
  it crashes Chromium's GPU process, and every 3D shot after it in the batch
  fails with "Error creating WebGL context". Start at 0.1 or fade in with
  opacity. A single still of the same frame renders fine, so the cause looks
  like GPU contention when it is not (found on checklist-pro).
- A hand item on a Bean must be SVG: use `HandPhone`, not `CartoonPhone`.
- An sfx path without `.wav` passes the typecheck and fails only at render
  with a 404; `npm run lint` now reports it as an error.
