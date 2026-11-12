---
# A worked example of a product brief for slideshow mode: the one Sticky
# Tasks uses. In a real project this file is .cartoon-shorts/product-brief.md.
# Lint checks every setting here. The allowed claims stay in app-series.md;
# this file adds what a slideshow needs on top.

product:
  name: Sticky Tasks
  descriptor: Reminder app. One-time Pro purchase, not a subscription.
  icon: Art/appicon_new_512.png

claims:
  source: .cartoon-shorts/app-series.md
  paidTierPhrase: with Pro
  healthClaims: false
  aiGeneratedImages: false

cta:
  lastSlide: Sticky Tasks
  lastSlideLine: Link in bio
  searchPhrase: 'Search "Sticky Tasks Repeat Reminders" on the App Store or Google Play.'
  bioLink: https://rzailabs.com/projects/sticky-tasks
  pinnedCommentPlaceholders:
    - "{{APP_STORE_URL_WITH_CT}}"
    - "{{PLAY_URL_WITH_CAMPAIGN}}"

copyRules:
  tone: Human, simple and direct. No corporate explainer tone, no wellness-app look.
  use:
    - with Pro
  avoid:
    - "Links don't work in Shorts"
    - "links don't work"
    - "links aren't clickable"
    - "links are not clickable"
    - "isn't clickable"

screenshots:
  dirs:
    - marketing/captures/notes-2.15

# Cartoon look: the shorts a slide may take a frame from (`scene:`), and the
# house characters a slide may show (`character:`). The cast matches
# app-series.md. Colours are positions in the engine's palette, or a hex colour.
shorts:
  dirs:
    - marketing/unreleased/shorts
    - marketing/released/shorts

cast:
  you: { hair: bowl, hairColor: 0, shirt: 1, skin: 0 }
  roommate: { hair: messy, hairColor: 3, shirt: 2, skin: 0 }

hashtags:
  always: ["#stickytasks"]

test:
  viewsToRepeat: 15000
---

# Notes for the writer

**Screens.** Real Sticky Tasks captures only, from
`marketing/captures/notes-2.15/` (how they were made:
`.cartoon-shorts/capture-notes.md`). Never fake chrome. If a slide needs a
screen that is not there, stop that slide and list it.

**Claims.** Only what `.cartoon-shorts/app-series.md` allows. Say "with Pro"
on any slide that shows a Pro feature, and mark that slide `paid: true` so
lint enforces it. An Android-only feature points to Google Play only.

**Never.** No health or ADHD claims. Do not write that links do not work or
are not clickable anywhere; give the search phrase and leave it at that.

**Search phrase.** `Search "Sticky Tasks Repeat Reminders" on the App Store
or Google Play.` It goes in the caption or the pinned comment, with the
quotes kept. Why this phrase: `marketing/notes/SOCIAL_TEXT_GUIDE.md`.

**Pinned comment.** Keep the two placeholders for the tracked store links
(`ct=` on the App Store link, the Play campaign tokens on the other). Whoever
posts fills them from `docs/CAMPAIGN_LINKS.md`.

**Bio link.** https://rzailabs.com/projects/sticky-tasks
