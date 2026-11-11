# Cartoon Engine

Make vertical cartoon shorts (TikTok, YouTube Shorts, Instagram Reels,
1080x1920) that promote an app, with the real app on screen, from real
screenshots and screen recordings. Two house styles:

- **Bean** (45 to 60 s): bean characters with thick outlines in a
  cel-shaded three.js world, a camera that moves every second or two, one
  fast second-person narrator, one-or-two-word captions, a music bed, sound
  effects, a twist and a loop. The app shows up inside a cartoon phone.
- **Toy** (20 to 30 s): soft 3D toy figures in a lit set with shadows, a
  serif title and one caption line per thought, an analogy instead of a
  plot, the app on a phone floating over the figure, stamps and readouts,
  and an end card with a button. Ask for "a toy-style short".

This 60-second short is about the plugin, and the plugin made it:

https://github.com/user-attachments/assets/9539f62e-52ba-4a17-adec-a7b30ab1adae

And a 25-second short in the toy style, made for Sticky Tasks. Four of the
roster's twelve voices read it in turn (`fable`, `emma`, `george` and the
`bella-isabella` blend):

https://github.com/user-attachments/assets/14a7e5a4-eb1c-4a88-bcdf-51f20693dc6d

It's a [Claude Code](https://claude.com/claude-code) plugin with two parts:

- **The engine** (`engine/`): a Remotion 4 + three.js project that renders
  every short. Characters, rooms and props, camera moves, the cartoon phone,
  captions, local text-to-speech with forced word alignment, music and
  sound-effect mixing, lint and review sheets, and loudness finishing.
- **The skill** (`skills/cartoon-shorts/`): walks Claude through a whole
  episode: three story pitches, the script and shot list, timing, captures,
  scenes, self-review, render and the post text for each platform.

It was built to make the shorts for Sticky Tasks, a reminder app (search
"Sticky Tasks Repeat Reminders" on the App Store or Google Play). About 20
episodes have been made with it so far.

## Install

In Claude Code:

```
/plugin marketplace add razamit/PromotionVideoEngine
/plugin install cartoon-shorts@razamit
```

On Claude Code 2.1.275 or later, one line does both:

```
/plugin install cartoon-shorts --marketplace razamit/PromotionVideoEngine
```

Updates: third-party plugins don't auto-update by default. Turn it on once
in `/plugin` > Marketplaces > razamit > Enable auto-update, or run
`/plugin marketplace update razamit` when you want the latest.

## Requirements

- macOS on Apple Silicon for the voice. Synthesis and word alignment run
  locally through [mlx-audio](https://github.com/Blaizzy/mlx-audio). Without
  it the timeline falls back to macOS `say`, which is fine for timing drafts
  only. Rendering itself runs anywhere Remotion runs.
- Node.js (tested on 26), Python 3.12, ffmpeg, rsync.
- About 5 GB of disk for the voice models. Composing music with ACE-Step
  needs about 10 GB more (optional).

Local voice and alignment, once per machine:

```bash
python3.12 -m venv ~/.cache/cartoon-shorts/venv-audio
~/.cache/cartoon-shorts/venv-audio/bin/pip install mlx-audio==0.6.4 "misaki[en]" librosa
```

## Use

Open your app's repo in Claude Code and ask for something like "make a
cartoon short for this app about <feature>". On first use in a project the
skill:

1. installs the engine to `~/.cache/cartoon-shorts/engine` (one `npm ci`,
   shared by every project; refreshed after each plugin update),
2. creates `.cartoon-shorts/` in your repo with `app-series.md`: what your
   app does and the claims a script may make, each with its source, plus the
   cast, a story backlog and the episodes built so far. Claude fills it in
   from your code and you check it. `config.json` sets where shorts go
   (`shorts/` by default).

Then each episode is a folder with `script.json`, its scenes, your app's
captures (`public/app/`, from an emulator or simulator with invented data),
the voice and the music. The usual commands inside a short:

```bash
npm run timeline   # voice per line, word times, generated/timeline.json
npm run check      # typecheck + lint
npm run review     # contact sheets every 0.5 s
npm run bubbles    # no speech bubble or sign cut off by the camera
npm run render && npm run finish   # out/short_final.mp4 at -14 LUFS
```

`npm run music` composes a bed with ACE-Step (setup in
`skills/cartoon-shorts/references/music-and-sfx.md`) and `npm run studio`
opens Remotion Studio.

The skill's rules: the app on screen is always real (the phone bezel is
drawn, the screen never is), every claim is true, the story comes first and
the app is the payoff, nothing sits still for more than about 2 s, and the
captions carry the story with the sound off.

## Layout

```
.claude-plugin/             plugin.json and marketplace.json
engine/                     the Remotion project (installed to ~/.cache/cartoon-shorts/engine)
  bin/short.mjs             what each short's npm scripts call
  src/                      characters, world, camera, phone, captions, scenes, toy (the 3D style)
  scripts/                  timeline, TTS, alignment, music, lint, review, finish
  public/sfx/               generated sound-effect kit
  voice/                    the narrator reference clip (a designed voice)
  example/                  the starter short new_short.sh copies
  example-toy/              the toy-style starter (new_short.sh --style toy)
skills/cartoon-shorts/
  SKILL.md                  the workflow
  references/               format recipe, script rules, engine guide, audio, review, publishing
  examples/                 a full worked script, its review table, a filled-in app-series.md
  scripts/                  ensure_engine.sh, init_project.sh, new_short.sh, clip_normalise.sh, app_text_frames.py
```

The references sometimes cite episodes of the original Sticky Tasks series
(the trash bag, the split screen) as examples. Those episodes aren't in this
repo; the lessons still apply.

## Working on the engine

Clone this repo, then point the engine home at your checkout so edits apply
straight away to every short on your machine:

```bash
bash skills/cartoon-shorts/scripts/ensure_engine.sh --link "$PWD/engine"
```

To ship a change, bump `version` in `.claude-plugin/plugin.json` and push.
Users get it on their next update. `--unlink` goes back to the installed
copy. Keep engine changes backward compatible: every existing short renders
on the new engine.

## Rights and licences

- **Sound effects** in `engine/public/sfx/` are synthesised from oscillators
  and noise by `engine/scripts/make_sfx.py`. No samples or third-party packs.
- **The narrator voice** (`engine/voice/series_narrator.wav`) was designed by
  Qwen3-TTS VoiceDesign from a text description (`voice/narrator.json`). It
  is not a clone of a real person. Don't point the cloning engines at
  someone's recording without their consent.
- **Music** from ACE-Step: the model is MIT-licensed and its model card
  allows commercial use, but check the current terms yourself before you
  publish. Or skip it and add a platform sound at upload.
- **Remotion** has its own licence: free for individuals and companies of
  up to three people, a paid company licence above that
  (remotion.dev/docs/license).
- **TTS and alignment models** download from Hugging Face on first use under
  their own licences (Kokoro, Qwen3-TTS: Apache-2.0; Chatterbox: MIT).
- The demo captures in `engine/example/public/app/` and the icon in
  `engine/public/brand/` are from Sticky Tasks. Replace them with your own.

## Credits

The format follows viral cartoon story Shorts, as broken down in an X post
by @zeuuss_01 (November 2026). `references/format-recipe.md` has the
second-by-second measurements the engine's defaults come from.

The toy style follows the 3D reels of the running app Renno, as shared in
an X post by @cesaralvarezll quoting @jacobrodri_ (November 2026).
`references/toy-style.md` has the breakdown.
