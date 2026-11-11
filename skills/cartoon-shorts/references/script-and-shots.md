# Script and shot list

This is the bean style's script guide. A toy short (`"style": "toy"`) has
its own budget, template and caption fields in `toy-style.md`; the
script.json format below is shared.

## Budget

| Item | Target |
|---|---|
| Length | 50-60 s (hard ceiling 62 s) |
| Words | 185-215 (about 215 wpm; the reference measures 201-224) |
| Pace | 205-225 wpm, flat to the end (`npm run timeline` reports it) |
| Pauses | 0.15-0.25 s between sentences, none longer; the twist lands on a short sentence, not a silence |
| VO lines | 28-40, each 3-9 words, one thought each |
| Shots | 35-50, a new setup about every 1.6 s, at least one per line |
| Sound effects | 8-14, on physical beats (format-recipe.md, Measured) |
| Running gag | appears 2-3 times |
| Labelled props | 6-12 across the short |

## Writing the narration

- Second person, present tense: "you swipe it away", not "he swiped it".
- Line 1 is the hook and must work as the first thing heard and read. A flat
  claim, no greeting, no question that can be answered "no".
- Short clauses. A line ends where a breath or a cut would go.
- Asides in the viewer's head: "and you're thinking, fine, later."
- Concrete nouns over adjectives: "the bag", "the flies", "Tuesday".
- One emphasis word per few lines, marked `*like this*`. The default
  caption look shows no colour (as the reference); `"captions": {"style": "pop"}`
  turns emphasis yellow.
- No hype words, no "game-changing", no feature lists. The app's name is
  said at most twice: once at the reveal, once at the end card.
- The last line leads back into line 1 so the loop replays as one sentence.
- Read it aloud at speed. If a line trips, rewrite it.
- Run the humanizer skill over the VO before showing it.

## The six beats as a template

```
HOOK (0-3 s)        One impossible-sounding true claim, or one absurd image.
SETUP (3-15 s)      The normal way. It fails, gently. Introduce the labelled props.
ESCALATION (15-30)  Consequences stack, each funnier. Running gag #1 and #2.
REVEAL (30-45)      The phone. Real app on screen, camera never resting.
TWIST (45-55)       You give in. The punchline is the app's promise, said plainly.
CTA + LOOP (55-60)  App name, "link in bio", last words lead into the hook.
```

## Shot vocabulary

Pick a different one from the last two each time.

| Shot | Use | Camera |
|---|---|---|
| Labelled prop insert | Hook, evidence, jokes | `crash` or `push` |
| Medium on "you" | Reactions | `push`, `hold` with `shake` for panic |
| Over the shoulder | "You" looking at something | `push` toward it |
| Two-shot | Dialogue, the running gag | `panLeft`/`panRight` |
| Extreme close-up face | Peaks, the twist | `crash` |
| Wide establishing | Once, near the middle, as a breather | `pull` |
| Phone in hand / phone fills frame | The reveal | `push`, `tiltDown` with `scrollFrom/To` |
| End card | CTA | `pull`, `hideCaptions` |

Transitions: hard cut by default; `whipLeft`/`whipRight` between places or
time jumps; `zoomBlur` into a punch-in. Light changes (warm to cold) mark the
turn.

## script.json

```json
{
  "title": "It won't stop until the trash is out",
  "fps": 30,
  "voice": { "engine": "say", "voice": "Samantha", "rate": 205 },
  "gapAfterLine": 0.08,
  "tailSeconds": 1.2,
  "music": null,
  "notes": "Sources for any factual claim go here.",
  "lines": [
    {
      "vo": "This bag has been by the door since *Tuesday.*",
      "shots": [
        { "scene": "bagByDoor", "params": { "swell": 1 }, "camera": { "move": "crash", "focusX": 0.3, "focusY": 0.7 } },
        { "scene": "youOnCouch", "camera": { "move": "push" }, "weight": 1.5 }
      ]
    }
  ]
}
```

Fields:

- `lines[].vo`: the narration; `*word*` marks caption emphasis.
- `lines[].shots[]`: shots share the line's time by `weight` (default 1).
- `shot.scene`: a key in the short's `scenes/registry.ts`; `shot.params` are its props.
- `shot.camera`: `move` (hold, push, pull, crash, panLeft, panRight, tiltUp,
  tiltDown), `focusX`/`focusY` (0-1, the zoom target), `amount`, `shake` (px).
- `shot.enter`: cut, whipLeft, whipRight, zoomBlur.
- `shot.captionY`: caption centre, default 0.64; move it off an app screen's
  key UI (0.86 under a phone works).
- `shot.hideCaptions`: for the end card.
- `shot.sfx`: a file under `public/`, played at the shot's start.
- `lines[].gapAfter`: a pause after a line, for a beat that needs to land
  (0.3-0.5 s, rarely).
- `voice`: see voice-and-audio.md.
- `style`: `"bean"` (default) or `"toy"`. Toy switches the lint limits and
  the caption default (toy-style.md).
- `lines[].caption`: serif captions only: `title`, `line` or `none`.

## Review table (what the channel owner sees before anything is built)

| # | Time | VO | Captions | Shot | Camera | Props / labels | App capture |
|---|---|---|---|---|---|---|---|
| 1 | 0.0-1.4 | This bag has been by the door since Tuesday. | This / bag has / been by / the door / since / TUESDAY. | Bag insert, then you on the couch | crash, push | BAG: "TAKE OUT" | none |

`npm run timeline && npm run table` writes this table to `out/review.md`
from the draft voice. Add a props column by hand if the labels matter, and
say which captures already exist.
