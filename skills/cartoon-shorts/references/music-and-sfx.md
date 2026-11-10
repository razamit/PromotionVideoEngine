# Music and sound effects

The short has four audio layers, mixed in `src/short/Short.tsx`:

| Layer | Where it comes from | Level |
|---|---|---|
| Narration | `public/vo.wav` from `npm run timeline` | Every line levelled to -20 LUFS |
| Sound effects | `public/sfx/` house kit, placed per shot | Short-term peaks 5-10 dB under the voice |
| Music bed | `npm run music`, composed per episode | 18 dB under the voice, steady, no ducking (the reference) |
| Platform sound | Added in the app at upload, optional | Set in the app |

`npm run finish` then brings the whole mix to -14 LUFS, so only the
balance between layers matters here, not the absolute level.

## The rule

No copyrighted songs, no ripped sounds (TikTok sounds, YouTube clips, game
or film audio), and no other app's or phone's notification sounds, not even
"close enough" imitations. Every effect in the kit is synthesised by our own
script; every music bed has a written licence that covers commercial use on
every platform the short goes to.

## The house SFX kit

`engine/scripts/make_sfx.py` builds every file from oscillators, filtered
noise and envelopes, with fixed seeds, so the project owns them and a rerun
is identical. `public/sfx/SOURCES.md` says so per file. Rebuild with:

```bash
python3.12 -m venv ~/.cache/cartoon-shorts/venv-sfx   # once
~/.cache/cartoon-shorts/venv-sfx/bin/pip install numpy scipy
~/.cache/cartoon-shorts/venv-sfx/bin/python scripts/make_sfx.py
```

All 48 kHz mono, peak -6 dBFS. The default gain per file is in
`KIT_LEVELS` in `src/short/sfx.ts`.

| File | Default gain | Fires on | Episode 1 beat it fits |
|---|---|---|---|
| `whoosh_a.wav`, `whoosh_b.wav` | 0.45 | Auto: `whipLeft` / `whipRight` enters (alternating by shot index), `crashOut` uses b | Every whip cut |
| `zoom_whoosh.wav` | 0.5 | Auto: `zoomBlur` enter, `crash` and `snapZoom` moves | Crash on the bag, calendar flip |
| `pop.wav` | 0.5 | A `Sign` or big caption landing | "TAKE OUT" sign |
| `phone_buzz.wav` (loop, 1 s) | 0.45 | A ringing or buzzing phone, `"loop": true` | The nag going off |
| `buzz_once.wav` | 0.5 | One "BZZT!" accent | "BZZT!" burst |
| `ding.wav` | 0.6 | A generic notification (rising E5 to C#6 glockenspiel, deliberately not any real phone's sound) | "ding." speech burst, the old polite ping |
| `swat.wav` | 0.7 | A swipe-away played as a slap | "SWAT" |
| `fly_loop.wav` (loop, 2 s) | 0.25 | Flies around the bag, `"loop": true` | Thursday flies |
| `tap.wav` | 0.6 | A finger on a real capture (`TapRing`) | The tap on Done |
| `boing.wav` | 0.55 | The twist, a comic reversal | Bag the size of a dog |
| `record_scratch.wav` | 0.55 | "Wait, what?" stop before a reveal | Roommate looks at you |
| `time_skip.wav` | 0.5 | A time card | "3 MINUTES LATER" |
| `tada.wav` | 0.55 | End card | Logo and "link in bio" |
| `honk.wav` | 0.5 | A car horn outside, someone waiting on you | search-tasks: the taxi honks |

A whoosh is texture and should feel felt, not heard; a ding or a swat is a
story beat and can sit nearer the voice. Never put a loud effect on top of
an emphasis word: move it with `offset` to the gap before or after.

## Automatic effects

With nothing set, every shot gets one cue from its enter or camera move:

| Shot has | Cue | Offset |
|---|---|---|
| `enter: whipLeft` / `whipRight` | `whoosh_a` / `whoosh_b`, alternating | -0.15 s (peak on the cut) |
| `enter: zoomBlur` | `zoom_whoosh` | -0.18 s (peak on the cut) |
| `camera.move: crash` or `snapZoom` | `zoom_whoosh` | -0.10 s (hit lands mid-punch) |
| `camera.move: crashOut` | `whoosh_b` | -0.05 s |
| anything else | nothing | |

The enter wins over the move, so a whip into a crash shot gets one whoosh,
not two. Negative offsets start the sound in the previous shot; at frame 0
the lead-in is trimmed rather than shifted.

## Shot `sfx` syntax

```jsonc
// unset: the automatic cue above, if the shot has one
{ "scene": "bagByDoor", "enter": "whipLeft" }

// a path: plays at the shot's first frame, at the kit's default gain,
// and REPLACES the automatic cue
{ "scene": "swatAway", "enter": "whipRight", "sfx": "sfx/swat.wav" }

// a cue object: volume (linear), offset (s into the shot, may be negative),
// loop, duration (s; a loop defaults to the rest of the shot)
{ "scene": "phoneBuzzing", "sfx": { "file": "sfx/phone_buzz.wav", "loop": true, "volume": 0.4 } }

// an array: several sounds on one shot; "auto" keeps the automatic whoosh
{ "scene": "phoneReveal", "enter": "whipLeft",
  "sfx": ["auto",
          { "file": "sfx/phone_buzz.wav", "loop": true, "offset": 0.2 },
          { "file": "sfx/ding.wav", "offset": 0.9 }] }

// silence, including no automatic cue
{ "scene": "endCard", "enter": "whipLeft", "sfx": "none" }   // or "sfx": null
```

Script level:

```jsonc
"autoSfx": false   // no automatic cues; a shot can still ask with "auto"
```

`autoSfx` defaults to true. `scripts/build_timeline.mjs` must copy it into
`timeline.json` (`autoSfx: script.autoSfx ?? true`) for `false` to take
effect; if a render still has whooshes after setting it, check that line.
Shot fields, including every `sfx` shape above, pass through the builder
unchanged.

A cue cut short by `duration` or the shot end fades over 3 frames, so loops
never click when they stop. Any file under `public/` works as a cue, but
only kit files have a default gain; others play at 1 unless `volume` is set.

## A music bed per episode

Every episode gets its own bed, composed locally by ACE-Step 1.5 to the
episode's exact length, so it ends with the short instead of looping.
The first three test beds were judged by ear before this became the default.

```jsonc
"music": {
  "file": "music/bed.wav",
  "volume": 0.126,    // linear gain under the voice: 0.126 = -18 dB, the reference
  "loop": false,      // the bed is generated to length
  "fadeIn": 0,
  "fadeOut": 0.6,
  "generate": {
    "prompt": "sneaky lazy comedic cartoon underscore, plucky pizzicato strings, bassoon and tuba, ...",
    "seed": 5101,     // take N uses seed + N - 1
    "bpm": 108,
    "key": "D minor",
    "takes": 3,       // how many to generate
    "pick": 2         // which one becomes music.file
  }
}
```

```bash
npm run timeline     # first: the bed needs the length and public/vo.wav
npm run music        # ACE-Step: about 25 s to load, 12-40 s per take
npm run music -- --pick 3   # swap the take without regenerating
```

`scripts/make_music.mjs` runs `scripts/music_acestep.py` with ACE-Step's
own interpreter, caches each raw take in `.cache/music/` (keyed on prompt,
seed, bpm, key and length), levels every take to the narration's loudness
into `public/music/takes/take_N.wav`, and copies the picked one to
`music.file`. Takes are asked for 5 s longer than the short, because
ACE-Step writes its own ending 1.5-3 s before the requested length. Because
the bed sits at the voice's loudness, `volume` reads
as dB under the voice. Change the script's length and the next `npm run
music` composes new takes at the new length.

### Setting up ACE-Step (once per Mac)

```bash
mkdir -p ~/.cache/cartoon-shorts/acestep && cd ~/.cache/cartoon-shorts/acestep
git clone --depth 1 https://github.com/ACE-Step/ACE-Step-1.5.git
python3.12 -m venv uvtool && ./uvtool/bin/pip install uv
cd ACE-Step-1.5
UV_PYTHON=$(which python3.12) UV_CACHE_DIR=../uv-cache ../uvtool/bin/uv sync
.venv/bin/acestep-download        # 9.4 GB: turbo DiT, 1.7B LM, embedding, VAE
```

Tested at commit `ca1e85f` (2026-08-29). Set `CARTOON_SHORTS_ACESTEP` to
use a checkout somewhere else. The generator settings (turbo DiT, 8 steps,
shift 3.0, the LM rewriting the caption first) are in
`scripts/music_acestep.py`.

### Writing the prompt

Write the prompt from the story's mood, not the genre of the app: what the
"you" in the story is doing (procrastinating, sneaking, panicking,
pretending). Name 3-4 instruments, a feel, "steady groove" and always end
with "instrumental, no vocals". Never name an artist, a song, a film or a
game. Vary the palette between episodes so the series does not get one
theme tune by accident; record the prompt in the "Built" table in
`.cartoon-shorts/app-series.md`.

| Story mood | Starting palette |
|---|---|
| Lazy, sneaky, avoiding a chore | Pizzicato strings, bassoon, tuba, finger snaps, D minor, 100-112 bpm |
| Cheerful denial | Ukulele, marimba, glockenspiel, handclaps, C or F major, 112-124 bpm |
| Chill, late night | Lo-fi drums, warm electric piano, plucked bass, 80-90 bpm |
| Rising panic, a deadline | Staccato strings, woodblock, pizzicato bass, faster 128-140 bpm |
| Silly tech | Square-wave synth lead, bouncy bass, handclaps, 120-128 bpm |

### Picking a take

Nobody can listen inside the session, so pick by measurement and leave the
other takes to compare by ear:

```bash
for f in public/music/takes/take_*.wav; do echo $f
  ffmpeg -hide_banner -i $f -af "asetnsamples=n=192000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level" -f null - 2>&1 \
    | grep RMS_level | awk -F= '{printf "%.0f ", $2}'; echo; done      # RMS every 4 s
```

Prefer the take whose level stays flat to the last 4 s. On episode 1 take 1
faded from 44 s (it would have died under the end card) and take 3 was
silent for its last 4 s; take 2 held to the end. A stray-vocal check:
Whisper (`mlx-community/whisper-large-v3-turbo-asr-fp16` in the audio venv)
on each take should return nothing but its usual "Thank you." on music; real
words mean the take sang. `mlx_whisper` is not installed in the audio venv;
run the model through `mlx_audio.stt` instead:

```bash
~/.cache/cartoon-shorts/venv-audio/bin/python -c "
import sys; from mlx_audio.stt.utils import load_model
model = load_model('mlx-community/whisper-large-v3-turbo-asr-fp16')
for f in sys.argv[1:]: print(f, repr(model.generate(f).text))" public/music/takes/take_*.wav
```

### No ducking

The reference never dips the music under the words, so `DEFAULT_DUCK_DB`
in `src/short/musicDuck.ts` is 0. `"duckDb": -8` still works for a bed that
fights the voice: the bed then ramps down over 0.12 s before each phrase
(words closer than 0.35 s merge into one) and back up over 0.4 s after.

### A bed from somewhere else

Level it to the narration first, so `volume` means "dB under the voice":

```bash
ffmpeg -hide_banner -i public/vo.wav -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tail -1   # e.g. -20.4 LUFS
ffmpeg -y -i ~/Downloads/track.wav -af loudnorm=I=-20.4:TP=-2:LRA=11 -ar 48000 public/music/bed.wav
```

and drop `generate` from the block (or never run `npm run music`).

## Where music comes from, ranked

1. **ACE-Step 1.5, composed per episode** (above). MIT-licensed model,
   approved by ear. The rights caveat stays: the Hugging Face model card
   says generated music can be used for commercial purposes, but GitHub
   discussion #1256 asking the maintainers to confirm output rights
   (publication, monetisation, any "Proof of Human Creation" requirement)
   had no maintainer answer as of 2026-11-03. Re-check it now and then.
   Audio from it is not ours the way the SFX kit is: anyone else can
   generate something similar, and Content ID systems may still match it.
   Install notes: "Setting up ACE-Step" above.
2. **The platform's library, added at upload.** No file to license, and the
   platform tracks the rights. The catch on TikTok: a post with the
   commercial content disclosure on (which ours need, see publishing.md),
   or posted from a Business account, can only use the Commercial Music
   Library, and CML tracks are licensed for use on TikTok only. Secondary
   sources (Soundstripe, AspireIQ help, checked 2026-11-03) disagree on
   whether the toggle or the account type triggers the limit. Pick the
   sound in the app and render the file with `"music": null`.
3. **Licensed libraries.** YouTube Audio Library (free; check each track's
   attribution requirement and whether its terms reach TikTok and Reels),
   Pixabay Music (free under the Pixabay Content License; check the track
   page for Content ID notes), Epidemic Sound or Artlist (paid; check that
   the plan covers commercial social posts). Read the current licence
   before using a track and save it next to the file, e.g.
   `public/music/LICENSE-<track>.txt`.

Whichever route: write the source of the bed into `script.json` `notes`,
and say in the hand-over whether music is in the file or left for upload.

## Checking a render

Audio stems from the same timeline, without touching the episode, through
`--props` (the config's `crf` blocks `--codec=wav`, so render a small mp4
and pull the audio):

```bash
python3 - <<'EOF'
import json
t = json.load(open("generated/timeline.json"))
json.dump({"timeline": dict(t, voFile=None, music=None)}, open("out/props_sfx.json", "w"))
json.dump({"timeline": dict(t, voFile=None, autoSfx=False,
           shots=[dict(s, sfx="none") for s in t["shots"]])}, open("out/props_music.json", "w"))
EOF
for k in sfx music; do
  npm run remotion -- render Short out/stem_$k.mp4 --props=out/props_$k.json --scale=0.25
  ffmpeg -v error -y -i out/stem_$k.mp4 -vn -ac 1 out/stem_$k.wav
  ffmpeg -hide_banner -i out/stem_$k.wav -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tail -1
done
```

Check that every SFX onset sits where the shot list says, and that the
music stem stays level to the end. Listen once with headphones as well:
the numbers do not catch a whoosh that feels late.
