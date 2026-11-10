---
name: cartoon-shorts
description: Make viral-format vertical cartoon shorts (TikTok, YouTube Shorts, Reels, 1080x1920, 45-60 s) that promote an app, in the format of viral cartoon story Shorts - 2D bean characters with thick outlines in a cel-shaded three.js world, a camera that moves every 1-2 seconds, one fast (about 215 wpm) second-person narrator, one-or-two-word captions, a music bed and sound effects, a twist and a loop - with the REAL app (screenshots or screen recordings) composited into a cartoon phone. Built on Remotion from a tested template. Use when asked for a cartoon short, an animated TikTok or Short, a promo video "like that viral cartoon one", a story video for an app, a script or shot list for one, a new episode in the series, or to re-render, re-time or fix an existing short.
argument-hint: [idea or slug] [script|build|render]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
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
| `references/format-recipe.md` | What the reference video does, second by second, and the rules that come from it |
| `references/script-and-shots.md` | Writing the VO, caption groups and the shot list; the script.json format |
| `references/remotion-engine.md` | The engine's parts, a short's layout, adding scenes and props, rendering, known traps |
| `references/app-footage.md` | Putting the real app on screen; which captures exist and which to make |
| `references/voice-and-audio.md` | The voice roster, local TTS engines, levelling, forced alignment, loudness |
| `references/music-and-sfx.md` | The house sound-effects kit, auto cues, composing a bed per episode, rights |
| `references/self-review.md` | The checklist run on the review sheets before hand-over |
| `references/publishing.md` | Final checks, platform disclosure toggles, the `social_text.md` post text per platform |
| `.cartoon-shorts/app-series.md` (in the project) | This app's facts the script may claim, the house cast, the backlog, the built episodes |

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
   as an interruption, and the CTA is soft: name plus "link in bio".
4. **Nothing sits still.** No shot over about 2 s; every shot has a camera
   move; no static app UI longer than 2 s without a push, pan or scroll.
5. **Works with the sound off.** The captions carry the story, and every
   key prop has a taped-on label.
6. **One house style.** Same bean characters, outline weight, palette and
   caption look in every episode. The channel's look is its logo.
7. **Post nothing.** Render to disk and report paths. Posting is the
   channel owner's call.

## Workflow

### 1. Pick the story (stop for approval)

Write three loglines in this shape: *one place, one person (you), one absurd
rule or problem*, ending in a twist the app makes possible. Check the
backlog in `.cartoon-shorts/app-series.md` first. Give each a hook line
and the twist in one sentence. Recommend one and wait for the channel owner to pick.

### 2. Script and shot list (stop for approval)

Follow `references/script-and-shots.md`: 185-215 words for 50-60 s, six
beats, second person, present tense, last line loops into the first. Write
it as `script.json` (VO lines with shots attached), then generate the
review table with `npm run timeline && npm run table` (step 3): time, VO,
caption groups, shots, camera, app captures. Mark which captures exist.
Show it to the channel owner before building scenes. The worked example is
`examples/take-out-the-trash.script.json` and its `.review.md`.

### 3. Scaffold and time it

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/new_short.sh" <slug>   # creates <shortsDir>/<slug>
cd <shortsDir>/<slug>
# write script.json, then:
npm run timeline          # VO per line (cached), forced-aligned word times, timeline.json
npm run table             # out/review.md: the table the channel owner approves
npm run lint              # repeats, pace, safe zone, legibility, hook, sfx, em dashes
npm run music             # composes this episode's bed (ACE-Step) at its length
```

`npm run timeline` prints the length, words per minute and longest shot.
Aim for 50-60 s, 205-225 wpm, longest shot under 2.2 s. Pick the voice
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
`CartoonPhone` with `focus`, `CaptureCard` for a readable crop of a capture,
`Sign`, `Burst` inside `<Plate>`, `Actor`. Give a recurring location several
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
npm run render && npm run finish                       # out/short_final.mp4, -14 LUFS, -2 dBTP
```

Open every sheet in `out/review/` yourself and walk `references/self-review.md`
before calling it done: hook on frame 0, every app screen readable at phone
size, every bubble and sign whole and inside the frame (`out/bubblecheck/`),
captions clear of platform UI, no framing 3 times, characters moving.
Fix, re-run `npm run review`, repeat. Then check `references/publishing.md`.
A 55 s short renders in about a minute on an Apple Silicon Mac.

### 7. Hand over

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
