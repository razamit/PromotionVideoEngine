# TikTok photo-mode slideshows: research memo

Checked 2026-11-12. Platform rules move, so re-check the official pages
before the first post of a new product. Each line says how strong its
source is: **official** (TikTok's own docs), **observed** (seen in TikTok
Studio on 2026-11-12 by the channel owner), **data** (a published dataset),
**practice** (what practitioners and vendors say, no data behind it) or
**unverified**.

## 1. The two ways to post stills

| | Native photo post | Video made from stills |
|---|---|---|
| What the viewer gets | Swipes at their own pace, dots under the slide, one sound looping | Autoplay at the editor's pace |
| Upload | Phone app (Photo), or the Photos tab in TikTok Studio on the web | Videos tab, MP4 |
| Signals | Swipes, saves, time on post | Watch time, completion |
| Good for | Lists, steps, before and after, anything worth saving | A cross-post to Shorts and Reels, which have no matching photo format |

Recommendation: native photo posts for the test. The MP4 is a review
preview only, and a fallback for other platforms. Use both only when the
same deck is also going to Shorts or Reels.

Reach is not settled, so do not promise it:

- Buffer, 45M posts, March 2026: TikTok video median engagement 3.39%,
  photos and carousels 1.92% (**data**, read second hand).
- Metricool, 2.3M posts, 2026: video about 5 times the reach of images and
  carousels (**data**, second hand).
- Fanpage Karma, about 700K posts, 2025: carousel reach about level with
  video, engagement rate 81% higher (**data**, second hand).
- viral.app, 3.3M videos: slideshows 1.02 times the median views of the
  same account's videos, 18% more saves per 1,000 views (**data**, second
  hand).

Read together: a slideshow is a cheap, high-volume way to test hooks. No
source shows that it converts to installs better than a product video, and
the only install claims found come from companies selling slideshow tools.

## 2. Specs

| Item | Studio web, Photos tab (**observed**) | Content Posting API (**official**) | Engine default |
|---|---|---|---|
| Photos per post | Up to 35 | Up to 35 | 6 (allowed 4 to 8, lint warns outside, hard stop at 35) |
| Formats | JPG, JPEG, PNG, WebP | WebP, JPEG | JPEG, quality 92. PNG and WebP on request |
| File size | 50 MB per photo | 20 MB per photo | Lint fails over 20 MB |
| Pixel size | Not stated | "Maximum 1080p" | 1080 px wide |
| Aspect | Lists 16:9, 4:3, 3:4 | Not stated | 9:16 (1080x1920); 3:4, 4:3, 16:9, 4:5, 1:1 selectable |
| Title | Not checked | 90 characters, optional | Written, 90 max |
| Description | Not checked | 4,000 characters | 100 to 200 before hashtags |
| Cover | Not checked | `photo_cover_index`, any slide | Slide 1 |
| Sound | Not checked | `auto_add_music` adds a recommended track | Chosen in TikTok at upload |

Notes:

- JPEG is the only format both lists accept, so it is the default.
- **Aspect.** Studio's list has no 9:16. Every third-party guide found, and
  TikTok Seller University as quoted by one of them, says 9:16 fills the
  screen and other shapes sit between bars (**practice**). The API states
  no aspect rule. So the default is 9:16 for feed fill, with the ratios
  Studio lists supported from the same brief. Nobody here has uploaded a
  9:16 photo through the Photos tab yet: the first upload is the test, and
  if Studio crops or refuses it, switch the brief to `3:4` and re-render.
- Every slide in a post is the same pixel size. The renderer enforces it.
- The API route is not used. It needs an audited app (posts from an
  unaudited app are private only), a verified domain to pull images from,
  and only `PULL_FROM_URL` is allowed. That is a build with a review gate
  for something a person can do in a minute.

## 3. Safe margins

TikTok publishes safe zones for ads only. Third-party figures for a
1080x1920 organic post range from 270 to 660 px at the bottom and 100 to
175 px on the right (**practice**). The engine's video safe zone already
sits at the careful end and is reused, with a slightly wider right margin
for the photo dots and buttons:

| Aspect | Top | Bottom | Left | Right |
|---|---|---|---|---|
| 9:16 | 12% | 25% | 6% | 15% |
| 3:4, 4:5, 1:1 | 5% | 8% | 5% | 5% |
| 4:3, 16:9 | 5% | 8% | 5% | 5% |

The shorter shapes are shown between bars, so TikTok's UI sits mostly on
the bars; their margins are a guess until a test post is checked on a
phone. All four are parameters in the brief (`output.safeMargins`), not
constants. `npm run guides` draws them on every slide for review.

## 4. Text: baked or typed in TikTok

There is no data on this, only opinions (**practice**): practitioners say
real cropped screenshots beat designed quote cards, and that decks which
look machine-made get scrolled past. The founder warning about posts that
look automated fits that, but his 100k-download claim could not be found
or checked (**unverified**).

The engine renders both, every time:

- `slides/`: text baked in, set in TikTok Sans (TikTok's own open-licence
  typeface), white with a dark outline, no cards, gradients or logos. It
  reads like text typed in the app.
- `slides-clean/`: the same slides with no text, plus `overlay_text.md`
  with the line for each slide and where to put it, for typing in the
  TikTok editor on a phone.

Default deliverable: baked, because it is the only one that works from
Studio on a computer, and the cover needs the hook on it. A brief can set
`output.text: native` to make the clean set the primary one. Worth testing once
a format has traction: same deck, baked one week, typed the next.

## 5. Sound

A photo post plays one sound across all slides (**practice**, consistent
across sources). Images carry no audio, so the pipeline ships none. TikTok
adds the sound itself: in the app it picks a recommended track when the
photos are selected, and the publisher can swap it (**practice**; guides
disagree on whether a carousel can be posted with none). The API has the
same thing as a flag, `auto_add_music` (**official**). Whether the web
uploader in Studio offers a sound for photos has not been checked
(**unverified**).
`pack.md` gives a mood and a search hint, and the publisher picks the
track in TikTok. A Business account is limited to the Commercial Music
Library, which rules out most trending sounds; check which account type
the product posts from. No study isolates the effect of sound on photo
posts (**unverified**), so this is a habit, not a finding.

## 6. Uploading, scheduling, disclosure

- **Computer upload**: Photos tab in TikTok Studio (**observed**; the
  publish step itself has not been run).
- **Phone upload**: plus button, Photo, pick the slides in order. Photos
  sent through the video flow can turn into an autoplay video, so start
  from Photo. The files are named so they sort in order in any gallery.
- **Scheduling photo posts in Studio**: vendor guides contradict each
  other (**unverified**). Check whether the schedule option shows on the
  first upload. The pipeline does not depend on it.
- **API posting flagged**: the only source is a scheduling vendor
  (**unverified**). The pipeline builds no poster either way.
- **Commercial content**: promoting your own product requires the
  disclosure setting with "Your brand"; the post is labelled "Promotional
  content", it cannot be changed after posting, and undisclosed posts can
  be removed or kept off the For You feed (**official**, TikTok support
  and ads help).
- **AI label**: required for AI-generated or heavily edited content that
  shows realistic scenes or people (**official**, community guidelines).
  Real screenshots with typed text are neither. The pipeline generates no
  photos; a brief that supplies AI-made backgrounds must say so, and
  `pack.md` then tells the publisher to tick the label.
- **Hashtags**: 3 to 5 (**practice**).

## 7. What works

- **Hook on slide 1**, one line, about 8 words, readable in two seconds,
  top two thirds of the frame. A problem the viewer has beats a feature.
  When a deck underperforms, change the hook first: add a number, open a
  loop, or name the annoyance (**practice**).
- **Length**: TikTok Seller University suggests 5 to 7 photos,
  Socialinsider 5 to 10 (**practice**). Default 6. One idea and one short
  line per slide; a slide that needs two sentences becomes two slides.
- **Product name**: last slide always. In a list it may also sit on the
  one slide that shows it, as item 2 or 3 rather than item 1. In a story
  or a relatable deck, last slide only.
- **CTA**: soft. Name, one plain line, and the search phrase or "link in
  bio" from the brief. Hard-sell last slides are the usual way to look
  like an ad.
- **Faceless is fine for reach.** A real demo video still shows the
  product working, which stills cannot. Keep the daily video running next
  to the slideshows and compare installs, not views.
- **Volume**: one slideshow says nothing. Run each format at least twice
  before judging it.
- **Traction rule**: keep "about 15,000 views, repeat it". Add a second
  rule so a small account still gets a signal: repeat any format whose
  post does three times the account's median slideshow views. One founder
  (Cal AI) tiers by views: under 300 an account problem, 300 to 1,000 weak
  content, 1,000 to 5,000 keep iterating, over 5,000 the hook works
  (**practice**, one person, read second hand). Track profile visits and
  installs per 1,000 views per format; views alone do not pay.
- **Pitfalls**: looking like an ad, mixed aspect ratios in one post,
  watermarks, text that looks generated, decks over 10 slides, office
  slide layouts, and health or medical claims. Health claims are off
  unless the brief sets `claims.healthClaims: true`; lint blocks the
  wording otherwise.

## 8. Formats the pipeline ships

Each is a list of slide roles with word caps, kept as a data file in the
engine (`engine/slideshow/formats/`). A product adds its own in
`.cartoon-shorts/slideshow-formats/` from the same layouts, without code.
How to use them: `references/slideshow-formats.md`.

| Format | Slides | Shape |
|---|---|---|
| `things-that-fixed` | 5 to 7 | Hook "things that fixed [problem]", three or four true tips one per slide, the product as tip 2 or 3 with its screenshot, name. The other tips are habits, never other apps' screens |
| `problem-to-fix` | 5 to 7 | First person: the moment it went wrong, it got worse, what did not work, the fix (screenshot), what is different now (screenshot), name |
| `reveal` | 4 to 6 | Hook with a tight crop of one detail, pull back to the whole screen or widget, two details one per slide, name |
| `before-after` | 4 to 6 | Before in words or a photo the brief supplies, the turn, after in two screenshots, name. No drawn "before" UI |
| `how-i` | 5 to 7 | "How I [outcome] in 3 steps": hook, one step per slide with the real screen, result, name |
| `relatable` | 4 to 5 | "POV" or "me when": mostly text, the product on one screenshot slide, name. Built for reach and comments, weakest for installs |

## Sources

Official:
- https://developers.tiktok.com/doc/content-posting-api-reference-photo-post
- https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide
- https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/promoting-a-brand-product-or-service
- https://ads.tiktok.com/help/article/about-the-commercial-content-disclosure-setting-for-advertisers
- https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content
- https://www.tiktok.com/community-guidelines/en/integrity-authenticity

Data and practice (several are vendors with something to sell):
- https://buffer.com/resources/data-best-content-format-social-media/
- https://viral.app/blog/insights/short-form-video-trends
- https://www.showfolk.ai/blog/how-to-make-a-tiktok-slideshow
- https://reelflood.com/blog/tiktok-slideshow-ideas-for-apps-2026
- https://x.com/jakecastilloooo/status/2112196010537562120
- https://www.aicarousels.com/free-tools/tiktok-safe-zone-checker
- https://skedsocial.com/blog/schedule-tiktok-photo-carousels
- https://postiz.com/blog/automate-tiktok-slideshow-marketing-ai-agents-postiz
