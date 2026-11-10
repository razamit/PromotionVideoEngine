# Your app's series file: what a short may claim, the cast, the backlog

Fill this in once per app before the first episode. Every script is checked
against it (`npm run lint` warns on claim words and points here). A filled-in
example: `examples/sticky-tasks-series.md` in the skill.

## The promise in one line

One sentence: what the app does that the story will pay off. Example: "A
reminder that keeps coming back until you mark the task done."

## Claims the script may make

Write each from the app's code or docs, not from memory or marketing copy,
and keep the source next to it. Re-check before each short; if behaviour
changed, update this list first.

| Claim | Fact behind it (file, setting, default) |
|---|---|
| _It does X_ | _Where in the code or docs this is true, and any limits_ |

Paid-tier features: list them, and say "with Pro" (or your tier's name) in
the VO whenever one appears.

Never claim:

- Behaviour the app does not have, even as a joke that sounds literal.
- Any user count, rating, review quote or statistic you cannot source.
- Medical, legal or financial outcomes.
- That a named competitor fails. "Most apps do Y once" is fine; naming one is not.
- _App-specific traps: features people assume exist but don't._

## The house cast

Drawn with `Bean`; keep the exact settings across episodes so people
recognise them. The look is the channel's logo.

| Who | Bean settings | Role |
|---|---|---|
| You | `hair="bowl"`, `hairColor=palette.hair[0]`, `shirt=palette.shirts[1]`, `skin=palette.skin[0]` | The viewer. Seen from behind in over-the-shoulder shots |
| The roommate | `hair="messy"`, `hairColor=palette.hair[3]`, `shirt=palette.shirts[2]` | Judges you silently. Running-gag material |
| Past you / future you | Same as You, `face={{ eyes: "tired" }}` or sunglasses | Time jumps |
| The phone | `CartoonPhone` with the real app | The hero of the twist |

## Series backlog

Each item: logline (one place, one person, one absurd problem), the hook
line, and the twist the app makes possible.

1. _..._

## Built

Record the voice and the music bed of every episode so the next one can
rotate.

| Episode | Folder | Voice | Music bed (prompt, key, bpm, seed, take) | State |
|---|---|---|---|---|
