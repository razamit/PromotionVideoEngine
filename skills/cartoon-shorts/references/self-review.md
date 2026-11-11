# Self-review before hand-over

Run this after every render, before showing anything to the channel owner. The point
is to catch what a viewer catches in the first scroll, and the lint cannot
see a picture, so you look at the frames yourself.

```bash
npm run check     # typecheck, then lint_shots.mjs: fix every ERROR, read every WARN
npm run review    # out/review/sheet_NN.png, first_frame.png, shots.txt
npm run bubbles   # out/bubblecheck/: every speech burst and sign, cut words flagged (exit 1)
python3 <skill>/scripts/app_text_frames.py .           # after render + finish: out/textcheck/, one frame per app shot
python3 <skill>/scripts/app_text_frames.py --check .   # exit 1 until every app shot says Readable? yes and Whole? yes
```

`npm run review` reuses `out/short.mp4` when nothing in `src/`, `public/` or
`script.json` is newer, otherwise it renders a 0.4-scale preview first
(about a minute). Pass a file to review that instead:
`bash scripts/review_frames.sh out/short_final.mp4`.

Each sheet is 4x5 frames, one every 0.5 s (10 s per sheet). Under each frame:
the time, the shot index (the same `#N` the lint prints, also in
`shots.txt`) and the scene with its camera move. A teal bar on top and
`NEW` mark the first frame of a shot. The two red lines are the caption
safe zone from `src/layout/safeZone.ts` (top 12%, bottom 75%).

Read every sheet with the Read tool, then `first_frame.png` at full size.
Go through the list below and write down each miss with its `#N` and time.
Fix, re-render, run the commands again. A WARN can stay only when you can
say why in the hand-over.

## The checklist

**Hook**

- [ ] Frame 0 (`first_frame.png`) is the hook: the subject fills at least a
      third of the frame, the first caption is on it, and the prop's label
      reads with the sound off. Not a wide room with a small object in it,
      not a blur from a whip or zoom.
- [ ] A different angle by 1.5 s.

**Picture**

- [ ] Every app screen is readable at phone size. `app_text_frames.py`
      pulls one frame per app shot into `out/textcheck/`; fill the
      **Readable?** cell of each row in its `index.md` with yes or no. Hold
      the sheet tile next to a real phone screenshot in your head: if you
      cannot read the task title on the tile, a viewer cannot read it on a
      6-inch screen.
- [ ] Every app element is whole. Same sheets, the **Whole?** cell. Under
      each tile is the element cut from the capture itself, boxed in red:
      that is what whole looks like. Compare it with the frame edge by edge.
      Fails: a button missing from the end of a banner ("Snooze 10" gone, or
      half of it), help text that runs off the phone's edge, a card whose
      right-hand tag or menu is not there, a callout or phone the camera
      pushes out of the frame. Open `shot_NN.png` at full size when the tile
      leaves any doubt. No strip under a tile means the shot declares no
      element; then name the element yourself and check its four edges.
- [ ] Readable and whole hold together, on the same frame. They pull
      against each other: zooming the phone makes text readable and narrows
      what it shows (62% of the capture's width at 1.6x), and a banner, a
      settings row or a task row is about 92% wide, so it fits only up to
      about 1.07x. Never fix one by breaking the other. A narrow element
      (one button, a title) can take a focus zoom, with its box declared in
      `element`. A full-width element is lifted out of the phone at full
      width: `params.callout` in a toy short (toy-style.md, "One element,
      large and whole"), a `CaptureCard` crop in a bean short. `npm run
      lint` fails a declared element that is cut (`cut-element`) and, in a
      toy short, a zoomed phone that declares none (`no-element`);
      `app_text_frames.py --check` must exit 0 before hand-over. (Missed
      on 2026-11-10, the first toy short: five phone shots zoomed 1.6x to 2x
      as the checklist then asked, every banner lost its Snooze button, and
      lint, the sheets and both checklists passed, because each one asked
      only whether the text was readable.)
- [ ] Every speech burst and sign is whole: open every `out/bubblecheck/`
      sheet (one tile per appearance, labelled with its problems) and fill
      the Verdict column of its `index.md`. Fails: a letter outside its star
      or sign, a word cut by the frame edge (camera moves included), a star
      half off-screen while it is meant to be read, a bubble on a face or on
      the caption line, a head or prop over the bubble. `npm run bubbles`
      must exit 0. Thought bubbles a short draws itself are not audited:
      still every shot that uses one and check it by eye. (Missed on the
      2026-11-04 batch: "WE QUIT." spilled out of its star over a head, and
      about 80 bubbles and signs across 21 shorts had words cut by a zoom.)
- [ ] Captions sit between the red lines on every tile, and never on top of
      the thing being shown (a task title, a button, a face at its peak).
- [ ] No angle three times or more. Look along the labels: the same scene
      with the same move in three tiles marked `NEW` is a repeat, even if a
      param changed. A running gag comes back as a character beat (a new
      pose, a reaction, another angle), not as the same shot.
- [ ] Characters move in every shot: a pose, a blink, a walk, a prop
      reacting. A camera push on a frozen picture still reads as static.
- [ ] Light and colour turn once, at the twist.

**Story**

- [ ] One clear twist, and the app is its cause (beat 4 of 6), not an
      interruption.
- [ ] The last line leads back into the first: read the final caption, then
      the first, as one sentence.
- [ ] Muted, the captions and signs alone tell the story.

**Sound** (listen to `out/short_final.mp4`; the sheets cannot show it)

- [ ] Sound effects on every whip and zoom, on crashes, on the phone buzz
      and on the key action (the swipe, the tap on Done).
- [ ] `npm run finish` printed about -14 LUFS and a peak at or under -1 dB.

**Words and truth**

- [ ] Captions spell-checked, word by word, against `script.json`.
- [ ] No em dashes anywhere: VO, captions, signs, post captions (the lint
      errors on them in `script.json`; check signs and `social_text.md` by eye).
- [ ] Every claim is on the allowed list in `.cartoon-shorts/app-series.md`. The
      lint flags "never", "always", "best", "#1"; read each one against the
      list, and check claims that use none of those words too.

**Toy style**: the lint uses the toy limits by itself when script.json
says `"style": "toy"`. Skip "the last line leads back into the first" (a
toy short ends on its end card) and add the checks in toy-style.md,
"Review additions". The readable and whole items above apply in full; the
toy phone is small, so they are where a toy short fails first.

Then the publishing checklist in `publishing.md`.

## What v1 of episode 1 got wrong

`shorts/take-out-the-trash/` v1, as the lint and the sheets show
it. Each one would have been caught by this review.

| Miss | Where | What it should have been |
|---|---|---|
| The same bag shot over and over | `bagByDoor` 7 times (#0, #6, #7, #9, #15, #31, #34), four of them `push` from the same spot | Two or three bag beats, each a different framing: an insert of the label, an over-the-shoulder from the couch, the roommate's feet beside it |
| App screens nobody can read | All 9 `appPhone` shots, phone about 60% of the frame width, no crop or focus | Crop to the notification card or the task row and fill the frame; the full phone only for the one beat where the whole screen matters |
| Captions under the platform UI | `captionY: 0.86` on every phone shot (#17 to #30) | Caption at 0.64 to 0.72 and the phone moved up or cropped, so both stay inside the safe zone |
| A weak first frame | #0 is a `crash`, which starts at scale 1, so frame 0 is the wide room with a small bag and a "since tuesday" label too small to read | Open already tight on the bag and its label, or with `push` from a close framing |
| Two identical shots back to back | #17 and #18, both `appPhone` with `home_list.png` | Change the video time or crop, or cut to a reaction in between |
| No sound at all besides the voice | zero `sfx`, no `autoSfx` | A whoosh on each of the 11 whips and zooms, a buzz on the nag, a thud on the bag, a tap on Done |

Lint output on that version, trimmed:

```
WARN  hook          #0 0.0s bagByDoor: crash starts at scale 1, so frame 0 is the wide before the punch-in
WARN  repeat-angle  bagByDoor push x4: same scene and camera move 4 times: #9@14.1s #15@23.2s #31@46.2s #34@51.4s
WARN  scene-overuse bagByDoor x7: scene used 7 times: #0@0.0s #6@9.5s #7@10.8s ...
WARN  consecutive   #18 28.5s appPhone: identical scene and params to #17; reads as one long shot
WARN  caption-zone  #17 26.7s appPhone: captionY 0.86 puts "Then" at 0.83-0.89, outside 0.12-0.75
WARN  legibility    #17 26.7s appPhone app/home_list.png: no focus or crop, phone height not set
WARN  sfx           whole short: no sound effects at all
0 errors, 26 warnings
```

Twenty-six warnings and zero errors is the lesson: the render "passed", and
every one of these was visible on the first contact sheet.
