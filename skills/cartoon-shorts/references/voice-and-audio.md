# Voice and audio

## The narrator

The reference narrator is one fast, dry, slightly amused voice talking to
"you": about 215 words a minute (201-224), 0.15-0.25 s between sentences and
never more, no dramatic pause before the twist, male-ish around 175-210 Hz
with a wide pitch swing, breaths edited out (format-recipe.md, "Measured").

The series rotates between the voices picked by ear (the roster below). Pick one per episode to suit the story, keep it for the whole
episode, and do not use the same voice two episodes running unless the
story calls for it. Record the pick in the "Built" table in
`.cartoon-shorts/app-series.md`.

`script.json` `voice.engine` decides where the audio comes from. Every
engine produces one file per VO line (`public/vo/line_NN.wav`), which
`build_timeline.mjs` trims, levels, measures, aligns and joins into
`public/vo.wav`.

| Option | Engine | Cost | Notes |
|---|---|---|---|
| **A roster voice** (below) | `mlx` | Free, local | The default for finals. Tested end to end |
| Your own read | `file` | Free | Record each line as its own file (`line_00.wav`...); force-aligned |
| macOS `say` | `say` | Free | Robotic. Timing drafts only, never shipped |
| A paid API (ElevenLabs, OpenAI TTS) | `command` | Paid | Check the plan's commercial terms first; ask before spending money or creating an account |

## The voice roster (picked by ear from a bake-off)

Paste the block as `voice` in `script.json`. All are reproducible: the
same line gives the same audio on every run, except VoxCPM2 (see its row).
`voice/series_narrator.wav` ships in the engine (`engine/voice/`),
so the clone voices work in every short.

| Key | Sounds like | Fits | Watch for |
|---|---|---|---|
| `narrator` | Male-ish, 181 Hz, the widest pitch swing; closest to the reference | Dry, deadpan, "you did this to yourself" stories. Episode 1 | Nothing found; 0 Whisper errors on 25 lines |
| `michael` | Low male, 120 Hz, calm and flatter | Documentary or "nature film" framing, a fake-serious tone | Whisper misheard "dog" as "doll" and "then" as "than"; check the transcript |
| `heart` | Female, 192 Hz, bright and warm | A cheerful narrator against a grim situation, a change of pace | Trails off on some last words (line 5 of the bake-off); keep `"even": true` |
| `turbo` | Lower take on the narrator's timbre, 146-174 Hz, flatter | When the narrator voice feels too bright for the story | Ran compounds together ("trashback"); check the transcript |
| `voxclone` | The narrator's timbre with a different delivery, 190 Hz, flatter | A second take on the narrator for a quieter story | Ignores the seed, so a re-render changes the read; synthesise once and keep the cache |
| `bella` | American woman, 199 Hz, a narrower pitch swing than `heart` (2.1 st) | A second female narrator when `heart` was the last one used | Level drops up to 15 dB on a last word without `"even": true` |
| `emma` | British woman, 184 Hz | A polite British read of a mess; the "nature film" tone in a woman's voice | Nothing found; 0 Whisper errors on 28 lines |
| `isabella` | British woman, 214 Hz, the highest of the British voices | A cheerful British narrator, lighter stories | Whisper heard "done" as "dunn" once; check the transcript |
| `george` | British man, 149 Hz, a 4.3 semitone swing | A dry British storyteller; the closest British voice to `narrator` | Whisper heard "Sticky" as "Tiki": listen to the app name. Above speed 1.3 it drops the first word of a line, so the pace comes from `tempo` |
| `fable` | Low British man, 119 Hz, the widest swing of the presets (5.0 st) | A storybook or fairy-tale framing | Needs `"trimDb": -40`: it leaves 0.45 s of hiss after every line. Whisper heard "then" as "than" once |
| `heart-emma` | `heart` and `emma` averaged, 190 Hz: British pronunciation in a half-American timbre | When `emma` sounds too formal for the story | Nothing found; 0 Whisper errors on 28 lines |
| `bella-isabella` | `bella` and `isabella` averaged, 208 Hz: British pronunciation in a half-American timbre | A voice no other Kokoro user has by default | Whisper heard "done" as "dunn" once without `even` |

```jsonc
// narrator: Qwen3-TTS 1.7B Base cloning the series clip
{ "engine": "mlx", "model": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16",
  "refAudio": "voice/series_narrator.wav", "lang": "english", "seed": 7, "tempo": 1.05 }
// michael: Kokoro-82M preset, native speed control
{ "engine": "mlx", "model": "mlx-community/Kokoro-82M-bf16", "voice": "am_michael", "lang": "a", "speed": 1.22 }
// heart: Kokoro-82M preset
{ "engine": "mlx", "model": "mlx-community/Kokoro-82M-bf16", "voice": "af_heart", "lang": "a", "speed": 1.16, "even": true }
// turbo: Chatterbox Turbo cloning the series clip
{ "engine": "mlx", "model": "mlx-community/chatterbox-turbo-fp16",
  "refAudio": "voice/series_narrator.wav", "seed": 7, "options": { "sample_rate": 24000 }, "tempo": 1.13 }
// voxclone: VoxCPM2 cloning the series clip
{ "engine": "mlx", "model": "mlx-community/VoxCPM2-bf16", "refAudio": "voice/series_narrator.wav", "seed": 7, "tempo": 1.17 }
// bella: Kokoro-82M preset, American woman
{ "engine": "mlx", "model": "mlx-community/Kokoro-82M-bf16", "voice": "af_bella", "lang": "a", "speed": 1.13, "even": true }
// emma: Kokoro-82M preset, British woman
{ "engine": "mlx", "model": "mlx-community/Kokoro-82M-bf16", "voice": "bf_emma", "lang": "b", "speed": 1.18, "even": true }
// isabella: Kokoro-82M preset, British woman
{ "engine": "mlx", "model": "mlx-community/Kokoro-82M-bf16", "voice": "bf_isabella", "lang": "b", "speed": 1.21, "even": true }
// george: Kokoro-82M preset, British man
{ "engine": "mlx", "model": "mlx-community/Kokoro-82M-bf16", "voice": "bm_george", "lang": "b", "speed": 1.25, "tempo": 1.1 }
// fable: Kokoro-82M preset, British man
{ "engine": "mlx", "model": "mlx-community/Kokoro-82M-bf16", "voice": "bm_fable", "lang": "b", "speed": 1.18, "trimDb": -40, "even": true }
// heart-emma: two Kokoro presets averaged, British pronunciation
{ "engine": "mlx", "model": "mlx-community/Kokoro-82M-bf16", "voice": "af_heart,bf_emma", "lang": "b", "speed": 1.15, "even": true }
// bella-isabella: two Kokoro presets averaged, British pronunciation
{ "engine": "mlx", "model": "mlx-community/Kokoro-82M-bf16", "voice": "af_bella,bf_isabella", "lang": "b", "speed": 1.18, "even": true }
```

### Kokoro accents and blends

A Kokoro voice has two parts. `voice` is the timbre: `af_` and `am_` are
American women and men, `bf_` and `bm_` British. `lang` is the pronunciation:
`"a"` reads the words the American way, `"b"` the British way. Keep them
matched for a plain accent.

Two or more presets joined with a comma (`"af_heart,bf_emma"`) are averaged
into one new timbre. The blend reads with whatever `lang` says, so the two
blends above speak British English in a voice that is half American. Mixing
an `af_` voice into `"lang": "b"` prints a "Language mismatch" warning; that
is expected.

Kokoro's `speed` moves in steps, not smoothly: `bm_george` reads 207 wpm at
1.33 and 226 at 1.36. If no value lands in the 205-225 band, hold `speed`
lower and add a small `tempo`, as `george` does.

`tempo` is the pace knob for the clones (ffmpeg `atempo`, pitch kept);
Kokoro uses its own `speed` (`george` uses both). Tune it until `npm run timeline` reports
205-225 wpm. Keep `tempo` at 1.17 or under: the variants rejected by ear
were mostly pushed to 1.2-1.35.

### Rejected by ear (do not use)

| Variant | Model and settings |
|---|---|
| `chatterbox-clone-v2_ex0.4-cfg0.5_tempo1.32` | Chatterbox clone, exaggeration 0.4, cfg 0.5, tempo 1.32 |
| `chatterbox-clone-v2_ex0.7-cfg0.3` | Chatterbox clone, exaggeration 0.7, cfg 0.3 |
| `chatterbox-clone-v2_ex0.7-cfg0.3_tempo1.35` | The same at tempo 1.35 |
| `voxcpm2-design_dry-male_tempo1.2` | VoxCPM2 voice design, tempo 1.2 |
| `kokoro_af-heart_line5` | One line only: its level sagged (other `heart` lines were fine). Fixed by per-line levelling plus `even` |

### Liked but not usable yet

Qwen3-TTS VoiceDesign `dry-male`, `sarcastic-male` and `dry-female`,
Chatterbox at exaggeration 0.4 at its own pace, and VoxCPM2 `dry-male`
design at its own pace. Each reads at 140-180 wpm, too slow for the format.
The design voices also change from line to line unless they are first
frozen into a reference clip, the way the narrator was. To add one, design a
fast take, save it as `voice/<name>.wav` plus `.txt`, clone it with
Qwen3-TTS Base, and listen to a full episode in it before it joins the
roster.

### Levelling

Every synthesised line is levelled to -20 LUFS on its way into
`public/vo/`, so no line jumps out. `"even": true` adds a gentle
compressor before the levelling for voices whose level sags inside a line.
On the sagging `heart` line it halved the drop on the last words, from
about 12 dB under the rest of the line to about 7 dB. The compressor takes
about 12 dB off a Kokoro line, so the levelling gain is capped at 24 dB, not
12 (a 12 dB cap left `heart` lines at -25.9 LUFS and the effects 6 dB too
loud). Neither setting
re-synthesises anything: the cache holds the raw read. `engine: "file"`
reads are used as they are.

## The series narrator clip

`refAudio` is relative to `script.json`, falling back to the engine. The
engine ships the clip in `engine/voice/`, so every short finds `voice/series_narrator.wav`
without its own copy; a short's own `voice/` file of the same name wins. The clip's transcript is read
from the sibling `series_narrator.txt`. The clip is a voice that Qwen3-TTS
1.7B VoiceDesign made from a text description (`voice/narrator.json` holds
the description, seed and metrics); it is not anyone's real voice. Never point
`refAudio` at a recording of a real person without that person's explicit
consent; your own voice is fine.

On episode 1 the `narrator` voice gives 210 wpm with the v2 script's 0.4 s
tail, zero Whisper errors over all lines, pitch median 181 Hz with a 4.6
semitone spread. All 28 lines synthesise in 20-35 s.

## Bake-off (2026-11-03)

The samples are not shipped. Summary at the target pace:

| Candidate | Licence | Script wpm | WER, 25 lines | F0 spread | Verdict |
|---|---|---|---|---|---|
| Qwen3-TTS 1.7B Base, clone of the locked clip, tempo 1.1 | Apache-2.0 | 212 | 0.000 | 4.6 st, 181 Hz | Roster: `narrator` |
| Chatterbox, clone, exaggeration 0.4, tempo 1.32 | MIT | 207 | 0.006 | 5.2 st, 207 Hz | Rejected by ear |
| Kokoro-82M am_michael, speed 1.22 | Apache-2.0 | 213 | 0.012 | 3.2 st, 116 Hz | Roster: `michael` |
| Chatterbox Turbo, clone, tempo 1.13 | MIT | about 210 | 0.07 on 3 lines | 2.2 st | Roster: `turbo` |
| VoxCPM2, voice design or clone | Apache-2.0 | about 210 | 0 on 3 lines | 2.4-2.7 st | Clone is roster `voxclone`; design at tempo 1.2 rejected |

What the numbers said before listening (the roster above is the result of listening):

- Qwen3-TTS VoiceDesign gives a different voice on every line unless the
  voice is frozen into a reference clip; that is why the series clones a clip.
- The pace of a clone follows the pace of its reference clip. The first
  locked clip read at 175 wpm and its clones came out at 173; the current
  clip reads at 227 and its clones need only a 1.1 tempo push.
- `atempo` keeps pitch and stays intelligible up to at least 1.35 here, but
  less push sounds more natural. Prefer a faster clip over a bigger tempo.
- F0 spread is a crude proxy. Listening decided the roster.

## Bake-off 2 (2026-11-11): British voices, more women, blends

Seven Kokoro-82M voices, picked by ear from one-paragraph samples, then
run over all 28 lines of episode 1 at the settings in the roster. Whisper
large-v3-turbo transcribed every line.

| Key | Script wpm | Whisper errors, 195 words | F0 median | F0 spread | Kokoro's own grade |
|---|---|---|---|---|---|
| `bella` | 214 | 0 | 199 Hz | 2.1 st | A- |
| `emma` | 216 | 0 | 184 Hz | 2.5 st | B- |
| `isabella` | 214 | 1 | 214 Hz | 2.2 st | C |
| `george` | 209 | 1 | 149 Hz | 4.3 st | C |
| `fable` | 215 | 1 | 119 Hz | 5.0 st | C |
| `heart-emma` | 215 | 0 | 190 Hz | 2.8 st | blend |
| `bella-isabella` | 212 | 0 | 208 Hz | 2.1 st | blend |

What it found:

- Every woman's voice sags on last words. `even` took the worst drop from
  8-15 dB to 4-5 dB on all five, so all five carry it. `fable` carries it
  too (12 dB to 3 dB once the hiss is trimmed).
- `bm_fable` read at 169 wpm at speed 1.18 because each line ended in 0.45 s
  of hiss at -44 dB, just over the -45 dB trim. With `"trimDb": -40` the same
  speed gives 215 wpm and the gaps match the other voices.
- `bm_george` at speed 1.33 dropped the first word of three lines ("It
  pings" became "pings") and changed it on two more. At 1.25 with tempo 1.1
  it dropped none.
- The other British and American presets (`bf_alice`, `bf_lily`,
  `bm_daniel`, `bm_lewis`, `af_nicole` and the rest) were not tried. Kokoro
  grades most of them D; `af_nicole` (B-) is the next to try.

## The `mlx` engine

`scripts/tts_mlx.py` runs inside the audio venv and loads the model once for
all lines that are not cached. Keys in the `voice` block:

| Key | Goes to | Notes |
|---|---|---|
| `model` | `load_model()` | Any mlx-audio TTS repo id |
| `refAudio`, `refText` | `ref_audio`, `ref_text` | Clone a clip; `refText` defaults to the clip's `.txt` |
| `instruct` | `instruct` | Voice description (Qwen VoiceDesign, VoxCPM2) |
| `voice`, `speed`, `lang` | `voice`, `speed`, `lang_code` | Presets and native speed (Kokoro: `voice: "am_michael"`, `lang: "a"`) |
| `exaggeration`, `cfgWeight`, `temperature` | same, snake_case | Chatterbox |
| `seed` | `mx.random.seed` before each line | Same line, same audio. VoxCPM2 ignores it |
| `options` | passed as is | Any other generate() keyword |
| `tempo` | ffmpeg `atempo` after trimming | Works for every engine except `file` |
| `trimDb` | silence trim threshold, default -45 | Raise it (for example -40) for a voice that leaves hiss after each line; `fable` needs it |
| `even` | compressor before levelling | Not part of the cache key; see "Levelling" |

Lines are cached in `.cache/vo/<hash>.wav` (gitignored), keyed on the text,
every voice setting and the reference clip's bytes. Editing one VO line
re-synthesises that line only; re-locking the clip re-synthesises all.

### Setting up the venv (once per Mac)

```bash
python3 -m venv ~/.cache/cartoon-shorts/venv-audio
~/.cache/cartoon-shorts/venv-audio/bin/pip install mlx-audio==0.6.4 "misaki[en]" librosa
```

`misaki` is only for Kokoro, `librosa` only for the bake-off's pitch
measure. Weights download into the Hugging Face cache on first use (Qwen3-TTS
Base about 4 GB, the aligner under 1 GB). Use another venv with
`CARTOON_SHORTS_PY=/path/to/python npm run timeline`.

## Word timing and forced alignment

With `voice.align` on (default for `mlx` and `file`), `scripts/align_words.py`
runs Qwen3-ForcedAligner 0.6B (`voice.aligner` to change it) on each line's
audio with the script's own words. Captions keep the script's spelling,
punctuation and `*emphasis*`; only the start and end times come from the
audio. Results are cached next to the audio in `.cache/vo/`.

On episode 1 the aligned starts sit a median 37 ms (90th percentile 95 ms)
from Whisper's own word timestamps; the length-spread estimate sits 68 ms
(140 ms) away. If the venv is missing, the aligner fails, or its times look
wrong (out of order, or not covering the line), `build_timeline` prints a
WARNING and uses the estimate for that line. `timeline.json` records which
was used in `wordTiming` ("aligned", "estimated" or "mixed").

For `engine: "file"`, the files are used as they are (not trimmed): cut the
silence yourself, then run `npm run timeline`; alignment works on any read.

## `command` engine

Any CLI that reads a text file and writes audio:

```json
"voice": { "engine": "command", "command": "my-tts --in {text_file} --out {out}" }
```

`{text_file}` is the line's text with the emphasis stars removed; `{out}`
must be written as any format ffmpeg reads. The plugin never handles API
keys. A paid CLI signs in through its own login or config, which the user
sets up themselves; never put a key in `script.json`, and never look one up
on the user's machine.

## Licences

| Model | Licence | Status |
|---|---|---|
| Qwen3-TTS 12Hz 1.7B VoiceDesign and Base | Apache-2.0 | Roster `narrator` |
| Qwen3-ForcedAligner 0.6B | Apache-2.0 | Word alignment |
| Chatterbox, Chatterbox Turbo (Resemble AI) | MIT | OK to use |
| Kokoro-82M | Apache-2.0 | OK to use |
| VoxCPM2 | Apache-2.0 | OK to use |
| MOSS-TTS v1.5 | Apache-2.0 | OK, untested |
| Voxtral 4B TTS | CC-BY-NC-4.0 | Not for promos |
| Higgs TTS 2 and 3 (Boson AI) | Custom, research and non-commercial | Not for promos |

Checked on each Hugging Face model card on 2026-11-03. Re-check before
adding a model; skip gated models.

## Music and sound effects

See `references/music-and-sfx.md`.

## Loudness

`npm run finish` runs a gentle compressor, then two-pass loudnorm to -14
LUFS integrated, -2 dBTP, which matches the reference and where TikTok,
Shorts and Reels normalise. It prints the measured result; episode 1 v3
came out at -14.0 LUFS, -2.0 dBTP.

The peak is measured on the encoded AAC, because the encoder can add
peaks the levelled audio does not have. A short with a square-wave music
bed was levelled to -2.0 dBTP and came out of the 192k encode at +0.3 dBTP
(2026-11-11). So finish encodes the audio on its own and measures it. Over
-1.7 dBTP it encodes again at 256k, then at 256k and 320k under a limiter,
and keeps the first one that holds; the printed line names the setting it
used. When no attempt gets under -1 dBTP it writes nothing and exits with
an error: lower the bed or the effects in the mix and render again.
