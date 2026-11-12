# Slideshow formats

Six formats ship with the engine. Each is a data file in
`<engine>/slideshow/formats/<name>.md` (`bash "${CLAUDE_SKILL_DIR}/scripts/ensure_engine.sh" --where`
prints `<engine>`): YAML with the roles, layouts and word caps that lint
enforces, then the writing notes for that format. Read the file of the
format you are writing. `npm run formats` inside any slideshow lists what
the project can use, its own formats included.

| Format | Slides | Use it when | Product name |
|---|---|---|---|
| `things-that-fixed` | 5 to 7 | The product is one of several true answers to a problem people search for | On the product slide and the last |
| `problem-to-fix` | 5 to 7 | There is a small, true, first-person story | Last slide only |
| `reveal` | 4 to 6 | The screen or widget is its own argument | Last slide only |
| `before-after` | 4 to 6 | The change is visible | Last slide only |
| `how-i` | 5 to 7 | The feature has a set-up worth saving | Last slide only |
| `relatable` | 4 to 5 | Reach and comments matter more than installs this week | Last slide only |

## Choosing

- For a test, rotate the formats rather than polishing one. A single post
  says nothing; run each at least twice before judging it.
- When a post passes the brief's `test.viewsToRepeat`, or three times the
  account's median slideshow views, make the same format again with a new
  hook, not a new format.
- When a format underperforms twice, change the hook before dropping it.
- `relatable` is the weakest for installs. Judge it on profile visits.

## Hooks that fit each format

| Format | Hook shape |
|---|---|
| `things-that-fixed` | "3 things that fixed my [problem]" |
| `problem-to-fix` | The moment it went wrong: "I [did the small disaster]" |
| `reveal` | A tight crop and "the [thing] I [do] 20 times a day" |
| `before-after` | "My [thing], before and after [the change]" |
| `how-i` | "How I [outcome]", never "How to use [product]" |
| `relatable` | "POV: you [did the familiar thing]" |

The numbers in a hook must be true of the slides ("3 things" means three
numbered slides).

## Where the cartoon look fits

Slides that say something in words can carry a frame from one of the
product's shorts or the house character: the hook, and the tip, story,
before, turn and beat slides. The exception is the hook of `reveal`, which
is a tight crop of a real screenshot. Slides that show the product (product, fix,
reveal, detail, step, result, after) are real screenshots in every look.
How: slideshow-mode.md, "The cartoon look".

## What every format shares

- The first slide is the hook and never names the product.
- The last slide is the `end` layout: the product name from the brief.
- Screenshot slides need a real capture. No capture, no slide.
- Other apps are never shown or named.
