---
# A made-up product, so the slideshow mode can be smoke-tested without any
# real project. It borrows the demo capture that ships with the video starter.

product:
  name: Demo App
  descriptor: A to-do list used only to test this pipeline.

claims:
  healthClaims: false

cta:
  lastSlide: Demo App
  lastSlideLine: This is a test deck
  pinnedCommentPlaceholders:
    - "{{STORE_URL}}"

copyRules:
  tone: Plain and short.
  avoid:
    - game-changing

screenshots:
  dirs:
    - ../example/public/app

hashtags:
  always: ["#demoapp"]
---

# Notes for the writer

Nothing here is a real claim. Replace this brief with your product's own:
copy `slideshow/product-brief.template.md` to
`.cartoon-shorts/product-brief.md` in the product's repo.
