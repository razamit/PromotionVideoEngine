# Slideshow mode: TikTok photo posts for any product

A slideshow is 4 to 8 still images uploaded as a native TikTok photo post:
the viewer swipes, one sound loops under it. This mode makes the images and
the post text from a product brief and real screenshots. It never posts.

Invoke it with: **"make a TikTok slideshow for [product] about [topic] in
the [format] format"**. With no format named, propose one (step 2).

It shares the engine with the video Shorts but runs on its own: its own
entry (`engine/src/slideshow/`), its own runner (`engine/bin/slideshow.mjs`),
its own folders. The one thing it borrows is art: a slide can show a frame
from one of the product's shorts or the house character ("The cartoon
look" below). Nothing in it names a product; everything about a product
comes from that product's brief.

Why the defaults are what they are, with sources and how sure each one is:
`references/slideshow-research.md`. Read it once.

## Rules that do not bend

1. **Real screens only.** Every screenshot is a capture of the real product
   (`references/app-footage.md` for how to capture). No drawn UI, no device
   frame, no imitation of another app or of the phone's own chrome. If a
   slide needs a screen that does not exist, the slide stops: it is listed
   in `missing.md` and not rendered. Do not swap in a different product's
   screen or a mock.
2. **Claims come from the brief's claims source** (for an app, usually
   `.cartoon-shorts/app-series.md`). A paid feature is marked `paid: true`
   and says the brief's paid-tier phrase. No health or medical wording
   unless the brief sets `claims.healthClaims: true`.
3. **The last slide shows the product name** from the brief.
4. **Every slide in a post is the same size.** The renderer enforces it.
5. **Post nothing.** No TikTok API, no scheduler. A person uploads.

## Set-up, once per product

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/ensure_engine.sh"
```

**The product brief** is `.cartoon-shorts/product-brief.md` in the product's
repo: Markdown, with the settings in YAML at the top and notes for the
writer below. `new_slideshow.sh` creates it from the template
(`<engine>/slideshow/product-brief.template.md`) the first time and stops so
it can be filled in. A filled-in one: `examples/sticky-tasks.product-brief.md`.
When the user pastes a brief as prose, turn it into this file first and show
it to them. Adding a product is writing this file; no code changes.

| Section | Holds |
|---|---|
| `product` | `name`, one-line `descriptor`, optional real `icon` for the last slide |
| `claims` | `source` (the allowed-claims file), `paidTierPhrase` ("with Pro"), `healthClaims` (default false), `aiGeneratedImages` (default false) |
| `cta` | `lastSlide` (must contain the name), `lastSlideLine` (one plain line under the name, such as "Link in bio"; set it unless the product wants the name alone), `searchPhrase`, `bioLink`, `pinnedCommentPlaceholders` |
| `copyRules` | `tone`, phrases to `use`, phrases to `avoid` (lint blocks these everywhere) |
| `screenshots` | `dirs`: folders of real captures, relative to the repo |
| `shorts` | `dirs`: folders of this product's cartoon shorts, for `scene:` slides. Default: `shortsDir` from `config.json` |
| `cast` | The house characters a slide may show: a name, then `hair`, `hairColor`, `shirt`, `skin` (a position in the engine's palette, or a hex colour). Match the cast in `app-series.md` |
| `hashtags` | `always`: tags every caption carries |
| `output` | Only to override the defaults: `aspect`, `format`, `text`, `safeMargins` |
| `style` | Only to override: `background`, `text`, `outline` colours |
| `test` | `viewsToRepeat` (default 15000) |

`.cartoon-shorts/config.json` may set `slideshowsDir` (default
`slideshows`). A repo with more than one product keeps one brief per product
and passes `--brief <path>`.

## Workflow

Run every script and command below from inside the product's repo; they
find the brief and the folders from there.

### 0. Ask what is open

How many, which format, which look, what about: `references/intake-questions.md`
(read it now; it is short). Only what the request did not say. For a batch,
one plan table and one approval, then steps 2 to 7 for each slideshow.

### 1. Read the brief

The brief's YAML and notes, its claims source, and any other `.md` in
`.cartoon-shorts/`. Check which captures exist in `screenshots.dirs` before
promising a slide.

### 2. Pick the format and write the slide table (stop for approval)

Formats: `references/slideshow-formats.md`. Show a table: slide number,
role, the line, and the screenshot with what it is cropped to. Mark any
screenshot that does not exist yet. Wait for a yes, unless the request gave
the hook and said to build.

Writing rules, from the research:

- Slide 1 is the hook: one line, about 8 words, readable in two seconds, a
  problem the viewer has, not a feature and not the product's name.
- One idea and one short line per slide. Two sentences means two slides.
- The product name goes on the last slide. A list format may also name it
  on the slide that shows it, never on slide 1.
- Soft close. The last slide is the name and at most one plain line.
- Plain words, no hype, no em dashes, the brief's tone.

### 3. Scaffold

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/new_slideshow.sh" --format <format> <slug>
```

Creates `<slideshowsDir>/<product>/<slug>/` with a starter `slideshow.md`.

### 4. Write slideshow.md

```yaml
---
format: things-that-fixed
topic: "What this slideshow is about, one line"
keyword: "reminder app"          # must sit in the caption's first 100 characters
cover: 1
sound:
  mood: "calm, no vocals fighting the text"
slides:
  - role: hook
    text: "3 things that fixed my \"I'll do it later\" habit"
  - role: product
    number: 2                                  # its place in the list, drawn large above the line
    text: "A reminder that keeps coming back until I tap Done"
    screenshot: nag_parking_shade.png          # found in the brief's screenshots.dirs
    crop: { x: 0.02, y: 0.225, w: 0.96, h: 0.17 }
    # paid: true                               # then the text must say the paid-tier phrase
  - role: end
---
Notes: which allowed claim each product slide rests on.
```

For the whole slideshow: `backdrop` (`cool`, `mint`, `warm`, `night`) puts
the flat cartoon room behind every slide that has no picture of its own, so
a cartoon deck does not jump between colourful and plain slides.

`fromShort: <slug>` names a short as the slideshow's source ("From a
short", below).

Per slide: `role` (one of the format's), `text`, `number` (a list position,
drawn large above the line and above the screenshot; never write "1." into
the line itself), optional `subtext`,
`textPosition` (`top`, `middle`, `bottom`), `screenshot` + `crop`, `photo`
(a real photo the brief supplies, as the background), `scene`, `character`
and `backdrop` (the cartoon look, below), `paid`, `layout` to override the
role's layout, `name` to change the file name.

| Layout | Shows |
|---|---|
| `text` | One line on the background colour, or over `photo` |
| `screenshot` | One line and a real screenshot, whole or cropped |
| `split` | Two `panels`, each a `label` over a screenshot crop or a line of `text` |
| `end` | The product name, the brief's optional line, the icon |

**Crops** are fractions of the screenshot: `x`, `y` of the top-left corner,
`w`, `h`. Crop to the element the line talks about; a whole 1080x2400 screen
on a 9:16 slide is drawn at about a third of its size and lint warns. Look
at the screenshot, estimate, then check the result in `npm run guides`.

### The cartoon look

Two ways to put the videos' art behind the words. Both are for the slides
that say something in words (hook, tip, story, beat); a slide that shows the
product stays a real screenshot.

```yaml
  - role: hook
    text: "3 things that fixed my \"I'll do it later\" habit"
    scene: { short: dry-cleaner-suit, shot: 2 }      # a frame from one of the product's shorts
  - role: tip
    number: 1
    text: "If it takes two minutes, I do it right now"
    character: { who: you, mood: happy, gesture: armsUp }   # the house character from the brief's cast
```

**`scene`** takes a frame from a short in the brief's `shorts.dirs`, drawn
without the video's captions, as the slide's whole picture. `shot` is the
shot's number in that short, **counted from 0**: use the number in the
frame's file name (`shot-05-spice.jpg` is `shot: 5`), not the position in
`script.json`. The short's `frames/` folder (made by `npm run frames`
there) holds the saved ones: look at its `sheet.jpg` and `index.md` to
choose.

Caption-free is not sign-free. A frame still shows what the scene itself
draws: signs, labels, score bars, the app on a phone. Choose from the sheet
by eye and prefer a frame with none. A sign that belongs to the short's
joke and not to the slide's line is a reason to pick another frame; a frame
that shows the app is never used as a `scene:` (the product is shown by a
real screenshot slide).

A shot that is not saved yet is added to the short's `frames/` folder the
first time a slideshow asks for it, as long as the short can still be
rendered. That also happens when you only try a shot in `npm run guides`,
so a frame you tried and dropped stays in the pack; that is harmless. `at`
moves the moment inside the shot (0 to 1, default 0.6) and `frame` names an
exact frame; those are rendered into the slideshow's own `.cache/`.

The line goes to the top by default and is kept to the upper part of the
frame, so pick a shot whose subject sits low and whose top is sky or wall,
and check the guides: the line must not sit on a face or on a sign in the
scene. The frame is darkened a little (12%) so the white line reads, in
both `slides/` and `slides-clean/`; `scene: { ..., dim: 0 }` turns that
off. A short that was trimmed after release can only give the frames saved
in its `frames/` folder; a slide that asks for another is listed in
`missing.md` like a missing screenshot.

**`character`** stands a cast member under the line, in a flat cartoon
room. `who` is a name from the brief's `cast`. `mood`: calm, tired, sweat,
angry, panic, happy, smug, panicked, shocked, sad, sideEye, furious, bored.
`gesture`: rest, armsUp, shrug, wave, point, slump, handsOnHead. `facing`:
left or right. Text layout only, and not together with a picture.

Keep one look per slideshow. In a cartoon deck, set `backdrop:` for the
whole slideshow so the screenshot slides and the last slide sit in the same
room as the character.

### From a short

"Make a slideshow from the short [slug]" uses a finished short as the
material: its claims are already checked, its captures are real, and its
frames exist. One slideshow per short is the default; make two or three
only for a short, or a first slideshow, that passed the traction bar.

1. Read what the short offers:

   ```bash
   bash "${CLAUDE_SKILL_DIR}/scripts/short_digest.sh" <slug>
   ```

   It prints the hook and the spoken script, the notes its claims rest on,
   each real capture with the crops its scenes already measured, and the
   saved frames. If it says no frames are saved, run `npm run frames` in
   the short first. Open the short's `frames/sheet.jpg`.
2. Choose the angle. A short gives three, each a different format:
   - **The story**, `problem-to-fix`: the short retold in five or six
     slides. Works as a teaser before the short is posted.
   - **The product**, `how-i` or `reveal`: built from the short's captures
     and their crops. `how-i` can open on a cartoon frame; `reveal` cannot,
     its hook is a tight crop of a real screenshot.
   - **The moment**, `relatable`: the funniest frame, a "POV" line, the
     product on one slide.

   This is the only stop, and it replaces the format question of the
   intake. Show a full slide table for each slideshow you were asked for
   (one unless the person said more), then one line each for the angles you
   did not table, so they can swap. Say which you would make if only one.
   Wait for a yes.
3. Scaffold each with the short as its source:

   ```bash
   bash "${CLAUDE_SKILL_DIR}/scripts/new_slideshow.sh" --from-short <slug> --format <format> <slideshow-slug>
   ```

   `fromShort:` in `slideshow.md` then finds the short's captures by file
   name (`screenshot: loc_shade.png`) and makes `scene: { shot: 2 }` mean a
   shot of that short. A recording is not a screenshot: take one still from
   it with ffmpeg at the moment the scene shows, save it beside
   `slideshow.md`, and use that. A file name is looked for beside
   `slideshow.md` first, then in the short's captures, then in the repo and
   the brief's `screenshots.dirs`; give the still its own name so it cannot
   be mistaken for another capture.
4. Write, check and render as in steps 4 to 7.

Rules for the pair:

- **Not the video again in stills.** Apart from the story format, a
  slideshow takes a different angle from its short.
- **Not the same day.** Tell the publisher in the hand-over to post the
  slideshow a few days away from its short, so they do not compete.
- **Same claims.** The slides may claim only what the short's notes and the
  product's claims source allow; a paid feature is still `paid: true`.
- Text on a slide is the viewer's own voice ("my suit", "I walk past"), not
  the short's second-person narration copied over.
- **Numbers.** A number about the product (an interval, a limit, a price)
  must match the claims source. A number that is part of the short's own
  story ("eight months") may be kept as the short tells it. Do not add new
  ones; that is what a format's "no invented numbers" means.

### 5. Check, look, render

```bash
cd <slideshowsDir>/<product>/<slug>
npm run check      # the brief's YAML, slideshow.md, wording rules, screenshots
npm run guides     # out/guides/: every slide with TikTok's covered margins tinted
npm run render     # slides/, slides-clean/, pack.md, overlay_text.md
npm run preview    # preview-for-review-only.mp4 (optional)
```

Open every image in `out/guides/` and then in `slides/` yourself: text
inside the safe box, nothing cut, each screenshot readable at phone size
and showing its element whole, no leftover status-bar clutter or personal
data in a capture. Fix and render again.

A missing screenshot does not stop the other slides. `render` exits with an
error, writes `missing.md`, and the hand-over must say which slides are
missing and which captures to make.

### 6. Write social_text.md

Beside `slideshow.md`, in this fixed shape (lint checks it):

- `## Title`: a fenced block, 90 characters at most.
- `## Caption`: a fenced block too. Hook on the first line, the `keyword`
  in the first 100 characters as a normal sentence, how to find the
  product (the brief's search phrase word for word, or "link in bio"), 3
  to 5 hashtags including the brief's `hashtags.always`.
- `## Pinned comment`: a fenced block with every placeholder from
  `cta.pinnedCommentPlaceholders` left as is, for the publisher to fill
  with tracked links.
- `## Disclosure`: tick commercial content, "Your brand".

Apply the brief's copy rules and the project's own post-text notes. Then
`npm run check` again until it is clean.

### 7. Hand over

Report the absolute paths of `slides/`, `social_text.md` and `pack.md`,
which set is the primary one, any missing slides, and what is still
unverified for this account (the first 9:16 upload, sound, scheduling).

## What lands in the folder

```
<slideshowsDir>/<product>/<slug>/
  slideshow.md                    the source
  slides/01-hook.jpg ... NN-last-slide.jpg     text baked in (upload these by default)
  slides-clean/                   same slides, no text
  overlay_text.md                 the lines to type in TikTok over the clean set
  social_text.md                  title, caption, pinned comment, disclosure
  pack.md                         order, format, sizes, cover, sound, upload steps
  preview-for-review-only.mp4     optional, never uploaded
  missing.md                      only when a screenshot was missing
  out/guides/, generated/, .public/, .cache/   working files, ignored by git
```

## Defaults and how to change them

| Setting | Default | Change it with |
|---|---|---|
| Aspect | 9:16, 1080x1920 | `output.aspect`: `3:4`, `4:5`, `1:1`, `4:3`, `16:9` |
| File format | JPEG (`.jpg`), quality 92 | `output.format`: `png`, `webp` |
| Text | Baked, clean set alongside | `output.text: native` makes the clean set the primary |
| Slides | The format's range, 4 to 8 overall | Add or remove slides in `slideshow.md` |
| Safe margins | By aspect (`engine/scripts/slideshow/aspects.mjs`) | `output.safeMargins` |
| Sound | None in the files; TikTok adds one at upload and the publisher swaps it | `sound.mood`, `sound.searchHint` in `slideshow.md` |

`output` can sit in the brief (every slideshow of that product) or in one
`slideshow.md` (that slideshow only). If the first 9:16 upload is cropped or
shown between bars, set `output.aspect: "3:4"` in the brief and re-render.

## Adding a format

A format is a Markdown file with YAML: the roles, each role's layout and
word cap, and a starter order. Copy one from `<engine>/slideshow/formats/`
into the product's `.cartoon-shorts/slideshow-formats/<name>.md` and edit
it; that folder is read first. A format the whole plugin should have goes
into the engine folder (only on a developer link, see SKILL.md).

## Traps

- The first render downloads fonts (TikTok Sans) from Google; it needs a
  network connection, like the video captions.
- The landscape shapes (4:3, 16:9) stack text over the screenshot like the
  portrait ones. A phone screen is small on them; prefer portrait.
- `slides/` and `slides-clean/` are emptied at every render. Keep nothing
  hand-made in them.
