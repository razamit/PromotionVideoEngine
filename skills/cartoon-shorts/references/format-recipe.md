# Format recipe: what the reference does

This is the bean style's reference. The toy style has its own, measured
from a different viral format: `toy-style.md`.

Source: an X post by @zeuuss_01 (2026-11-03,
https://x.com/zeuuss_01/status/2117380789608272078) about the YouTube
Shorts channel **Ricks Clips**. Three of its cartoon shorts reached 30M, 16M
and 11M views. The post embeds the 16M one ("career development room",
Japan, 60 s) and a screenshot of the channel grid: a dozen shorts in one
house style, nearly all between 3M and 11M views. The post's own recipe:

- One strange true fact turned into a 60-second script with a twist at the end.
- 2D characters in a colourful 3D world, built with Claude's three.js and
  Remotion skills.
- One fast narrator and one-word captions.

Replies worth keeping:

- All three hits share **one location, one person, one absurd rule they have
  to live with**. Cheap to animate, easy to follow with the sound off. That
  structure explains the views more than the art does.
- Pacing and topic matter more than budget; the cartoon look only lowers the
  production cost.
- Someone asked how the characters stay consistent across shots. Answer here:
  the characters are code (`Bean.tsx`), so they cannot drift.

The quoted article (same author, about the "Jean Phil" AI character) adds
one lesson that transfers: a recognisable face works like a logo. Keep one
cast and one look across every episode, start with one character and ten
clips, and only add a second once people ask for more.

## Second-by-second map of the 60 s reference

Studied frame by frame from the post's video and its auto-captions
(about 170 words, 34 caption lines). Paraphrased, not quoted.

| Time | Beat | What is on screen | Camera |
|---|---|---|---|
| 0-2 | **Hook**: a bold claim stated as fact | A big red "FIRE EMPLOYEE" button under glass, then the sweating protagonist in a chair | Close insert, then medium |
| 2-4 | **Turn**: "but they found something worse" | Smiling boss at his desk, dangles a key tagged STORAGE | Push in on the grin |
| 4-13 | **Setup** in second person ("imagine your boss walks you...") | Walk through the office, a door with a taped "CAREER DEVELOPMENT ROOM" sign, an empty desk with a cobwebbed TO DO tray and an OUT OF ORDER printer, a wall clock, a guy with his feet up on his phone | A new angle every 1-1.5 s: tracking, door insert, high-angle desk, clock, two-shot |
| 13-20 | **Ironic upside**: you get paid for nothing | Boss in the doorway, a calendar, a phone screen showing a payroll deposit | Over-the-shoulder from behind "you", insert on the phone |
| 20-28 | **Escalation** through small social details | You in sunglasses (paradise), coworkers staring, emails stopping, your old desk with a stranger's family photos | Whip pan with motion blur, extreme close-ups |
| 29-33 | **Running gag** | Boss pops his head in every Friday with a huge smile | Same framing each time, push to his face |
| 33-38 | **Counterpoint** | The corner guy has done this for three years and is happiest of all; wide night exterior of the tower, one warm lit window | The only wide establishing shot, a breather |
| 38-43 | **Acceptance** | You put your feet up beside him, drinks with straws | Two-shot, push in |
| 43-49 | **Dread** | One Monday he is gone: chair pushed in, desk cleared down to coffee rings, nobody says where | Empty-desk inserts, colour cooling |
| 49-55 | **Reveal** of the true fact | Lighting flips to night blue and purple; a fire alarm padlocked with a "LABOR LAW" lock; the boss beside an electrical panel | Slow push, heavy mood light |
| 55-60 | **Punchline and loop** | They take your work and your friends and wait; last shot is YOU in the room, seen through the door's window | Push into the window; the last line flows back into the hook |

## Rules taken from it

**Story**

- One place, one person, one absurd rule. "You" is the protagonist; the
  narrator talks to the viewer the whole time.
- Hook in the first second, as a flat claim that sounds impossible. The
  first frame already shows a labelled prop that literalises it.
- Six beats: hook, setup, escalation, turn, reveal, punchline. The second
  half recolours the first (the happy guy was a warning).
- A running gag that recurs two or three times.
- The ending puts the viewer in the opening's situation and the last line
  leads back into the first, so the loop replays cleanly.

**Picture**

- Characters: a big round head (about a third of the height), pill body,
  stick limbs, dot eyes, simple mouths, sweat drops, a teeth grin for the
  villain. Told apart by hair, shirt colour and one accessory (tie, lanyard,
  sunglasses). One black outline weight on everything.
- World: 3D rooms with flat toon shading and ink outlines, saturated walls
  (office blue, mint), yellow sunlight patches, a few labelled props per
  room. Place details (a kanji scroll, a lucky cat) say where we are.
- Every prop the story depends on has a short upper-case label on a taped
  sign: TO DO, STORAGE, OUT OF ORDER. That is what makes it work muted.
- Colour tells the story: warm and bright while it is fun, cold blue and
  purple at the reveal.
- Shot length 1-2 s, a camera move in every shot: push-ins, crash zooms on
  faces, over-the-shoulder from behind "you", prop inserts, one wide
  establishing shot near the middle. Cuts are hard or whip pans with blur.

**Words**

- About 215 words a minute (measured; see the Measured section, which
  replaces an earlier estimate of 170), second person, present tense, short clauses,
  conversational asides ("and you're thinking, wait...").
- Captions are one or two words at a time, heavy white sans with a black
  outline and drop shadow, centred in the lower middle (about 63-70% down),
  punctuation kept.

## Translating it to an app promo

The reference sells nothing, which is why people finish it. An app short
keeps the story and lets the app be the twist:

1. **Hook** (0-3 s): a bold, true claim or an absurd situation everyone
   knows ("this trash bag has been by the door since Tuesday").
2. **Setup** (3-15 s): the old way fails. A normal reminder fires once, you
   swipe it away, life moves on.
3. **Escalation** (15-30 s): absurd consequences pile up, one labelled prop
   at a time, with a running gag.
4. **Reveal** (30-45 s): the phone. Push into the cartoon phone and the
   real Sticky Tasks nag: it fires, you dismiss it, it comes back. Real
   captures only, with camera moves.
5. **Twist** (45-55 s): you do the task just to make it stop. The app's
   promise lands as the punchline, not as a feature list.
6. **Soft CTA and loop** (55-60 s): app name and "link in bio" on the end
   card, last line leading back into the hook.

## Measured: audio, captions and pacing (2026-11-03)

Measured from the channel's three highest-viewed cartoon shorts, downloaded
at 720x1280 and deleted afterwards. The 15M "He Was A Genius" short ties for
third but is a live-action film clip, not this format, so it was left out.
Speech numbers come from mlx-whisper word timestamps and a demucs vocal
stem; music and effects from the demucs accompaniment stem; loudness from
ffmpeg ebur128; captions from pixel measurement on frames every 0.5 s (and
every frame for a 4 s stretch).

- A: [The Ancient Jar That Warned an Empire](https://www.youtube.com/shorts/VS1Z_Q-Klt8), 31M views
- B: [The Job Nobody Wants in Japan](https://www.youtube.com/shorts/0m6G8pDtzNs), 16M views (the "career development room" short)
- C: [Why Perfect Railroads Don't Work](https://www.youtube.com/shorts/7xS87iActkU), 15M views

| Measure | A (31M) | B (16M) | C (15M) | Average |
|---|---|---|---|---|
| Length | 64.9 s | 60.6 s | 65.2 s | 63.6 s |
| Words | 235 | 225 | 218 | 226 |
| Pace | 218 wpm | 224 wpm | 201 wpm | **214 wpm** |
| Words per 5 s (range) | 15-20 | 16-25 | 13-21 | about 18 |
| Share of runtime the voice is sounding | 93% | 94% | 95% | 94% |
| Gap between sentences, median / p90 | 0.16 / 0.22 s | 0.17 / 0.28 s | 0.21 / 0.24 s | 0.18 / 0.25 s |
| Longest true silence (vocal stem), where | 0.20 s at 62% | 0.16 s at 33% | 0.13 s at 88% | about 0.16 s |
| Mean sentence length, overall / last 20% | 10.7 / 11.0 words | 11.8 / 9.2 words | 11.5 / 11.3 words | 11.3 / 10.5 |
| Narrator median pitch, p10-p90 spread | 174 Hz, 14 st | 184 Hz, 14 st | 209 Hz, 14 st | about 190 Hz |
| Narration starts / ends | 0.00 s / 0.1 s before end | 0.00 s / 0.4 s before end | 0.00 s / 0.3 s before end | wall to wall |
| Integrated loudness | -14.1 LUFS | -14.1 LUFS | -14.1 LUFS | -14.1 LUFS |
| True peak | -2.2 dBTP | -2.1 dBTP | -2.2 dBTP | -2.2 dBTP |
| Loudness range | 2.1 LU | 1.8 LU | 3.2 LU | 2.4 LU |
| Voice stem / bed stem (music plus effects) | -14.2 / -29.5 LUFS | -14.2 / -33.2 LUFS | -14.1 / -32.7 LUFS | bed **about 18 LU under the voice** |
| Bed level in speech gaps vs under words | +0.7 dB | +0.6 dB | +0.8 dB | no ducking |
| Bed tempo (estimate) | about 96 bpm | about 103 bpm | about 117 bpm | about 105 bpm |
| Clearly audible sound effects | about 14 | about 10 | about 8 | about 11 per short |
| Caption x-height / full height (asc. to desc.), share of frame height | 2.1% / 3.4% | 2.1% / 3.6% | 2.1% / 3.4% | 2.1% / 3.5% |
| Caption vertical centre (p10-p90) | 70.6% (70.3-70.7) | 70.4% (70.1-70.7) | 70.4% (70.2-70.9) | **70.5% down** |
| Caption width, median (p90), share of frame width | 19% (32%) | 19% (33%) | 22% (32%) | about 20% |
| Words per caption group | 1.28 | 1.00 | 1.22 | 1.2 |
| Time each caption is on screen, median (p90) | 0.40 (0.53) s | 0.27 (0.53) s | 0.40 (0.53) s | about 0.35 s |
| Distinct camera setups (counted by eye) | about 39 | about 38 | about 41 | **one every 1.6 s** |
| Hard cuts found by ffmpeg scene > 0.3 | 1 | 0 | 1 | almost none |
| Frames where the camera holds still | 4-7% | 1-2% | 1-2% | camera nearly always moving |

What the numbers say, beyond the table:

- **Voice.** One bright, very animated narrator (median pitch around
  175-210 Hz, a wide 14-semitone swing) with breaths and pauses edited out.
  There is no dramatic silence before the twist in any of the three; the
  longest gap anywhere is 0.2 s. Pace stays flat to the last line. Only B
  shortens its sentences at the end (12.5 words down to 9).
- **Music.** A real music bed runs under every second (the mix never drops
  below -50 dBFS, and the bed stem does not follow the voice envelope, so it
  is not separation leakage). It is a light, bouncy instrumental: 52-66% of
  its energy is below 300 Hz (bass and a soft kick pulse about every 1.15 s
  in B) with a plucked, step-wise lead melody around 400-1,000 Hz on top.
  It sits about 18 LU (about 21 dB RMS) under the voice, never ducks and
  never builds. In B the texture turns darker and more sustained at the
  reveal (night-blue section) while the level stays the same.
- **Sound effects.** Roughly 8-14 clearly audible effects per short, about
  one every 4-8 s, placed on physical action beats rather than on cuts: a
  broadband smash or whoosh of 0.2-0.4 s (B's button smash at 1.2 s is the
  loudest event in that bed), short low thumps for impacts and landings, and
  quick clicks and ticks. They rise 25-40 dB over the bed in the highs but
  stay under the voice. Types are inferred from spectra, not by ear.
- **Captions.** Pure white heavy sans (Arial Black class), sentence case,
  punctuation kept, no colour emphasis anywhere in about 390 sampled
  frames. Black outline about 3 px at 1280 tall, plus a hard black drop
  shadow offset about 2 px down and right (the dark edge measures 3 px
  above, 4 px left, 5-6 px right and below). No pop, scale or bounce: the
  size is constant from the first frame a word appears, and words switch on
  a hard cut. Centred horizontally on a fixed line at 70.5% down. This
  narrows the earlier "about 63-70% down" note above.
- **Pictures.** The earlier note of 1-2 s shots holds (a new setup about
  every 1.6 s), but they are rarely hard cuts. Setups change through quick
  camera flights, whip moves with blur, or cross-dissolves of about 5 frames
  (0.15 s), and inside a setup the camera keeps pushing, drifting or
  tracking. On frame 0 the subject or the labelled prop fills the centre
  third (B's FIRE button spans about 75% of the width) with the first
  caption over it, and the narrator is already talking.

### Rules for our shorts, from these numbers

1. Write about 215 words a minute, so about 215-225 words for a 60 s short.
   This replaces the 170 wpm figure above. Keep the pace flat to the end.
2. Cut breaths and tighten pauses so the voice sounds for about 94% of the
   runtime: 0.15-0.25 s between sentences and nothing longer than 0.25 s.
   Land the twist with a short sentence, not a silence.
3. Start talking at 0.00 s with the first caption on frame 0, and run the
   narration to within 0.3 s of the last frame so the loop has no dead air.
4. Lay one light, bouncy instrumental bed (about 95-120 bpm, bass plus a
   plucked melody) under the whole short at about 18 LU below the voice:
   with the voice at -14 LUFS, the bed alone measures about -32 LUFS. No
   ducking, no build. A darker variant of the same bed may take over at the
   reveal, at the same level.
5. Use about 8-14 sound effects per short, one every 4-8 s, only on
   physical beats (smash, launch, impact, whoosh on a camera flight). Keep
   every effect below the voice.
6. Master to -14 LUFS integrated, true peak at or under -2 dBTP, and
   compress until the loudness range is about 2-3 LU.
7. Captions at 1080x1920: white heavy sans, sentence case with punctuation,
   font size about 70-75 px (about 3.7% of frame height; x-height about
   40 px, full ascender-to-descender height about 66 px), a black outline of
   about 4-5 px plus a hard black shadow offset about 3 px down-right,
   centred on a fixed line 70.5% down (y about 1355 px).
8. Show one word per caption most of the time and two at most (average
   1.2), switch on every word with a hard cut, about 0.35 s each. No pop,
   bounce, scale or colour emphasis.
9. New camera setup about every 1.6 s (about 38 per minute), changed by a
   camera move or a 0.15 s dissolve more often than by a hard cut, and never
   a locked-off camera for more than a beat.
10. On frame 0, put the subject or the labelled prop big in the centre third
    of the frame, with the first caption sitting over it.
