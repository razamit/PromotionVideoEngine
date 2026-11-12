---
name: cartoon-shorts
description: "Make viral-format vertical cartoon shorts (TikTok, YouTube Shorts, Reels, 1080x1920) that promote an app, with the REAL app (screenshots or screen recordings) composited into a phone, in two house styles. Bean style (45-60 s by default) - 2D bean characters with thick outlines in a cel-shaded three.js world, a camera that moves every 1-2 seconds, one fast (about 215 wpm) second-person narrator, one-or-two-word captions, a music bed and sound effects, a twist and a loop. Toy style (20-30 s by default) - soft 3D toy figures in a lit set with shadows, a serif title and one caption line per thought, an analogy instead of a plot, the app on a floating phone, stamps and readouts, an end card with a call to action. Either style can be made at another length on request. Built on Remotion from a tested template. Use when asked for a cartoon short, an animated TikTok, Short or Reel, a promo video \"like that viral cartoon one\" or \"like those 3D Claude videos\", a story video for an app, a script or shot list for one, a new episode in the series, or to re-render, re-time or fix an existing short. Also has a slideshow mode for any product: TikTok photo-mode slideshows (4 to 8 swipeable still slides from real product screenshots, in six formats, with the caption, pinned comment and a publisher pack) built from a product brief. Use it when asked for a TikTok slideshow, a photo-mode post, a photo carousel, or slides for TikTok."
argument-hint: "[idea or slug] [script|build|render]"
---

# Cartoon shorts

One short = one folder in the current project (an app's repo) holding
only what makes that episode: `script.json`, its scenes, its captures, voice
and music. It runs on the shared engine (Remotion 4 + three.js,
render-tested, one `node_modules` for every short in every project). The
creative work is the script and the scenes; timing, captions, camera, audio
and export are handled by the engine.

## Paths and set-up (do this first, every session)

- This skill: `${CLAUDE_SKILL_DIR}` (its `scripts/`, `references/`, `examples/`).
- The engine source ships in the plugin at `${CLAUDE_PLUGIN_ROOT}/engine`,
  but shorts run it from a stable home, `~/.cache/cartoon-shorts/engine`
  (or `$CARTOON_SHORTS_HOME/engine`), because the plugin's own folder changes
  with every update. Install or refresh it before any short command:

  ```bash
  bash "${CLAUDE_SKILL_DIR}/scripts/ensure_engine.sh"
  ```

  It prints "developer link" when the home is a symlink to a checkout of the
  plugin's repo (`ensure_engine.sh --link <checkout>/engine`); only then are
  engine edits kept. Otherwise the home is overwritten on every plugin
  update, so never edit it: put new pieces in the short's own `scenes/`
  and mention them in the hand-over as candidates for the engine.
- **Project settings:** `.cartoon-shorts/` at the project's root. Read every
  `.md` file in it before step 1: `app-series.md` (the claims, cast,
  backlog and built episodes for this app) plus any notes such as
  `capture-notes.md` or `publishing-notes.md`; they override this skill's
  general guidance for this project. `config.json` sets `shortsDir`. If the
  folder is missing, run `bash "${CLAUDE_SKILL_DIR}/scripts/init_project.sh"
  [shortsDir]` and fill in `app-series.md` from the app's code and docs
  (template: `references/app-series.md`, worked example:
  `examples/sticky-tasks-series.md`) before writing any script.
- When this file names `references/...`, `examples/...` or `scripts/...`,
  they are inside `${CLAUDE_SKILL_DIR}`.

`<skill>` in the references means `${CLAUDE_SKILL_DIR}`.

Read the references in this order the first time; after that, only the one
the step needs:

| File | Read it for |
|---|---|
| `references/format-recipe.md` | What the reference video does, second by second, and the rules that come from it (bean style) |
| `references/toy-style.md` | The toy style: its reference, the analogy template, budget, script fields and building blocks. Read it instead of format-recipe.md for a toy short |
| `references/script-and-shots.md` | Writing the VO, caption groups and the shot list; the script.json format |
| `references/remotion-engine.md` | The engine's parts, a short's layout, adding scenes and props, rendering, known traps |
| `references/app-footage.md` | Putting the real app on screen; which captures exist and which to make |
| `references/voice-and-audio.md` | The voice roster, local TTS engines, levelling, forced alignment, loudness |
| `references/music-and-sfx.md` | The house sound-effects kit, auto cues, composing a bed per episode, rights |
| `references/self-review.md` | The checklist run on the review sheets before hand-over |
| `references/publishing.md` | Final checks, platform disclosure toggles, the `social_text.md` post text per platform |
| `references/intake-questions.md` | The questions to ask before making anything, for shorts and slideshows, and how a batch is planned |
| `references/slideshow-mode.md` | Slideshow mode: TikTok photo posts for any product, from a product brief. For a slideshow, read it and `intake-questions.md`; none of the references above are needed |
| `references/slideshow-formats.md` | The six slideshow formats and when to use each |
| `references/slideshow-research.md` | TikTok's photo-post specs and what works, with sources: why slideshow mode's defaults are what they are |
| `.cartoon-shorts/app-series.md` (in the project) | This app's facts the script may claim, the house cast, the backlog, the built episodes |

## First: ask what is open

Before a short or a slideshow, ask the person what the request did not
already say, in one go: **how many** first, then style or format, look or
length, and topic. When they want more than one, every question offers a
mix, so a batch comes out varied. A request that already answers
everything gets no questions. The questions, the choices and how to spread
a mix: `references/intake-questions.md`. For a batch, show one plan table
and get one approval instead of stopping on every item.

## Slideshow mode (TikTok photo posts)

A request for a **TikTok slideshow, photo-mode post or photo carousel** is
not a short. It makes 4 to 8 still slides from real product screenshots,
plus the post text, for a person to upload as a native photo post. It works
for any product: everything product-specific comes from a brief at
`.cartoon-shorts/product-brief.md`, and nothing in the engine names one.
Invoke phrase: "make a TikTok slideshow for [product] about [topic] in the
[format] format".

Follow `references/slideshow-mode.md` from start to finish and skip the
rest of this file: no story pitches, voice, music or scenes. A request to
make a slideshow **from a short** ("a slideshow from the dry-cleaner
short") uses that short's script, captures and frames as the material:
slideshow-mode.md, "From a short". The short
version:

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/new_slideshow.sh" --format <format> <slug>
cd <slideshowsDir>/<product>/<slug>      # write slideshow.md, then:
npm run check && npm run guides && npm run render
```

The non-negotiables below that still apply to a slideshow: the app on
screen is real (1), claims are true (2), post nothing (7). A missing
screenshot stops that slide; it is never mocked. A slideshow can use the
cartoon look: a frame from one of the product's shorts (`scene:`) or the
house character (`character:`) behind the words, while every product
screen stays a real capture.

## Two styles

| | Bean (default) | Toy (`"style": "toy"`) |
|---|---|---|
| Look | 2D bean characters, ink outlines, cel-shaded room | 3D toy figures, soft light and shadows, no outlines |
| Length | 45-60 s by default, about 215 wpm | 20-30 s by default, about 130-160 wpm |
| Shape | A six-beat story with a twist and a loop | An analogy: what nobody skips, what you skip, the app closes the gap |
| Captions | One or two heavy sans words at a time | A serif title for the hook, then one serif line per thought |
| App | Late, as the twist, in a cartoon phone | Just before the middle, on a phone floating over the figure |
| Ending | Soft: name and "link in bio" | A brand card with a button |

The style is one of the intake questions when the request does not say;
tell the person which the series already uses
(`.cartoon-shorts/app-series.md`, "Built"). A series keeps one style unless
the person picks a mix for a batch; a single short never mixes them. The rest of this file describes the
bean style; where the toy style differs, `references/toy-style.md` says how
and wins.

**Another length on request.** The lengths above are the defaults, each
taken from its reference video. When the request names a length ("a 40
second one", "make it 15 s"), set `"targetSeconds"` in script.json from the
start: the timeline and the lint then hold the short to that length, give
or take 15%, and print its word budget. The style keeps its pace and its
shot rhythm; the script is written for the length ("Other lengths" in
script-and-shots.md for bean, in toy-style.md for toy). Length is one of
the intake questions; when it is not asked or the answer is "each style's
own length", use the default.

## The non-negotiables

1. **The app on screen is real.** Every phone screen, notification, widget
   or settings page is a capture of the real app (`references/app-footage.md`), never
   drawn, mocked or retouched. The cartoon phone bezel is drawn; its screen
   is not. Nothing that looks like another app's or the OS's chrome is drawn.
2. **Claims are true.** The script may only claim behaviour listed in
   `.cartoon-shorts/app-series.md` (sourced from the app's code or docs).
   A "strange true fact" hook needs a source written into the script notes.
   No invented statistics, testimonials or user counts.
3. **Story first, app second.** The reference is not an ad; it is a story
   with a twist. The app enters as the story's payoff (beat 4 of 6), never
   as an interruption, and the CTA is soft: name plus "link in bio". (A toy
   short makes its case by analogy and may end on a button: toy-style.md.)
4. **Nothing sits still.** No shot over about 2 s; every shot has a camera
   move; no static app UI longer than 2 s without a push, pan or scroll.
5. **Works with the sound off.** The captions carry the story, and every
   key prop has a taped-on label.
6. **One house style per series.** Same characters, palette and caption
   look in every episode of a series, bean or toy. The channel's look is
   its logo. The exception is a batch where the person asked for a mix of
   styles (intake-questions.md); even then each short is one style
   throughout.
7. **Post nothing.** Render to disk and report paths. Posting is the
   channel owner's call.

## Workflow

### 1. Pick the story (stop for approval)

For a batch, the plan table from the intake step stands in for this stop:
one logline per short, approved together (intake-questions.md).

Write three loglines in this shape: *one place, one person (you), one absurd
rule or problem*, ending in a twist the app makes possible. Check the
backlog in `.cartoon-shorts/app-series.md` first. Give each a hook line
and the twist in one sentence. Recommend one and wait for the channel owner to pick.
For a toy short, write three analogies instead (toy-style.md, "The analogy
template"): the thing nobody skips, its stake, and the task the app covers.

### 2. Script and shot list (stop for approval)

Follow `references/script-and-shots.md`: 185-215 words for 50-60 s, six
beats, second person, present tense, last line loops into the first (toy:
50-70 words for 20-30 s, the analogy template, no loop). For a requested
length, set `targetSeconds` and use the "Other lengths" row for it. Write
it as `script.json` (VO lines with shots attached), then generate the
review table with `npm run timeline && npm run table` (step 3): time, VO,
caption groups, shots, camera, app captures. Mark which captures exist.
Show it to the channel owner before building scenes. The worked example is
`examples/take-out-the-trash.script.json` and its `.review.md`.

### 3. Scaffold and time it

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/new_short.sh" <slug>   # creates <shortsDir>/<slug>; add --style toy before the slug for a toy short
cd <shortsDir>/<slug>
# write script.json, then:
npm run timeline          # VO per line (cached), forced-aligned word times, timeline.json
npm run table             # out/review.md: the table the channel owner approves
npm run lint              # repeats, pace, safe zone, app screens readable and uncut, hook, sfx, em dashes
npm run music             # composes this episode's bed (ACE-Step) at its length
```

`npm run timeline` prints the length, words per minute and longest shot.
Aim for 50-60 s, 205-225 wpm, longest shot under 2.2 s (toy: 20-30 s,
130-160 wpm, under 2.6 s). With `targetSeconds` set, it also prints the
window and the word budget for that length. Pick the voice
from the roster in `references/voice-and-audio.md` to suit the story (not
the previous episode's voice unless the story wants it) and use it from the
first run; `say` is only a fallback when the local TTS venv is missing.
Write `music.generate.prompt` from the story's mood
(`references/music-and-sfx.md`), generate three takes, pick by measurement
and say which in the hand-over. Re-run `npm run music` whenever the length
changes.

### 4. Capture the real app

Capture each screen the shot list needs from a real device, emulator or
simulator, with no burned text, and save it into `public/app/` (how, and
how to normalise recordings with `scripts/clip_normalise.sh`:
`references/app-footage.md`).

### 5. Build scenes

Add scene components in the short's `scenes/<folder>/` and register them in
its `scenes/registry.ts`; import engine pieces as `@engine/...` (for example
`@engine/scenes/kit`, `@engine/characters/Bean`). Reuse `Bean` (alive by default: entrances, pose
tweens, takes, walks), `Room3D` plus props from `src/world/props3d.tsx`,
`CartoonPhone` with `focus` (narrow elements only: a zoom cuts a full-width
banner or row), `CaptureCard` for a readable, whole crop of a capture,
`Sign`, `Burst` inside `<Plate>`, `Actor`. A toy short builds from
`@engine/toy/...` instead: `ToyStage`, `ToyFigure`, the `props/` sets and
`SceneOverlays` (toy-style.md, "Building blocks"), with the app on a
`phone` that shows the whole screenshot and the element the line talks
about in a `callout` (toy-style.md, "One element, large and whole"). Give a recurring location several
camera angles (episode 1's `BagByDoor angle`) so no framing repeats 3 times.
Place sound cues on physical beats (8-14 per short, `references/music-and-sfx.md`). New
reusable pieces (a new prop, a new hair style) go into the engine's
`src/` only when the engine is a developer link (see "Paths and set-up");
every short in every project gets them at its next render, so keep changes
backward compatible (new props with old defaults) and say which shorts you
re-rendered. Without a developer link, keep them in the short's `scenes/`.

### 6. Check, then render

```bash
npm run check                                          # typecheck + lint
npm run review                                         # 0.4-scale preview, contact sheets every 0.5 s in out/review/
npm run bubbles                                        # every speech burst and sign on a sheet, warns on cut words (out/bubblecheck/)
npm run still -- out/check.png --frame=<n>             # full-size look at one frame
npm run render && npm run finish                       # out/short_final.mp4, -14 LUFS, -2 dBTP; fails above -1 dBTP
npm run frames                                         # frames/: a handful of caption-free scene frames, kept for slideshows
python3 "${CLAUDE_SKILL_DIR}/scripts/app_text_frames.py" .          # out/textcheck/: one frame per app shot, with the element it must show whole
python3 "${CLAUDE_SKILL_DIR}/scripts/app_text_frames.py" --check .  # exit 1 until index.md says Readable? yes and Whole? yes on every row
```

Open every sheet in `out/review/` yourself and walk `references/self-review.md`
before calling it done: hook on frame 0, every app screen readable at phone
size and the element it shows whole (both verdicts in `out/textcheck/index.md`;
a zoom that makes a banner readable cuts its last button), every bubble and
sign whole and inside the frame (`out/bubblecheck/`),
captions clear of platform UI, no framing 3 times, characters moving.
Fix, re-run `npm run review`, repeat. Then check `references/publishing.md`.
A 55 s short renders in about a minute on an Apple Silicon Mac.

### 7. Hand over

Run `npm run frames` once the render is final: it saves a handful of
caption-free frames of the scenes in `frames/` (with an index and a contact
sheet), which is what a slideshow made from this short draws on. Keep that
folder when the short is trimmed after release. An older short whose
package.json has no `frames` script runs it as
`node "$(bash "${CLAUDE_SKILL_DIR}/scripts/ensure_engine.sh" --where)/bin/short.mjs" frames`.

Write `social_text.md` in the short's folder first (publishing.md, "Links
and copy"): every final render ships with one, no exceptions. Then report
the absolute path of `out/short_final.mp4` and of `social_text.md`, the
strip, the script table, and the open items
(captures still on draft assets), which roster voice and which music
take were used and where the other takes are.

Shorts live in `<shortsDir>/<slug>/`. Keep test material (voice bake-offs,
music tests) out of the shorts folders. Record each finished episode's
voice and music in the "Built" table of `.cartoon-shorts/app-series.md`.

## Draft versus final

| Part | Draft | Final |
|---|---|---|
| Voice | macOS `say` (robotic, timing only) | A roster voice (voice-and-audio.md) chosen for the story, or your own read |
| App screens | Older screenshots | Fresh captures of the live build, clean status bar, no personal data |
| Music | None | A bed composed for the episode, 18 dB under the voice (`npm run music`, rights caveat in music-and-sfx.md), or none in the file and a platform sound at upload |
| Sound effects | None | House kit in `public/sfx/`, 8-14 cues on physical beats |
| Captions | Word times spread by length | Forced alignment from the final voice |

Never hand over a draft as final. Say which parts are still draft.
