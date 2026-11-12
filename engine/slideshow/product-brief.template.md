---
# The product brief: everything the slideshow pipeline needs to know about
# one product. Save it as .cartoon-shorts/product-brief.md in the product's
# repo. Lint checks every setting here; the prose under the YAML is read by
# the skill when it writes copy.

product:
  name: Your Product            # shown on the last slide
  descriptor: What it is, in one plain line.
  # icon: path/to/app-icon.png  # the real icon, for the last slide (optional)

claims:
  source: .cartoon-shorts/app-series.md   # the list of things the copy may claim
  # paidTierPhrase: with Pro    # said on any slide marked paid: true
  healthClaims: false           # health or medical wording stays blocked unless true
  aiGeneratedImages: false      # true only if you supply AI-made photos as backgrounds

cta:
  lastSlide: Your Product       # must contain product.name
  lastSlideLine: Link in bio    # one plain line under the name; delete it to show the name alone
  # searchPhrase: 'Search "Your Product" on the App Store or Google Play.'
  # bioLink: https://example.com
  pinnedCommentPlaceholders:    # filled in by whoever publishes; never real links here
    - "{{APP_STORE_URL}}"
    - "{{PLAY_STORE_URL}}"

copyRules:
  tone: Human, simple and direct.
  use: []                       # phrases to prefer
  avoid: []                     # phrases lint blocks in slides, caption and comment

screenshots:
  dirs:                         # folders of REAL captures, relative to the repo
    - marketing/captures

# The cartoon look (optional). A slide can show a frame from one of this
# product's cartoon shorts, or one of these characters.
# shorts:
#   dirs:                       # where the shorts live; default is shortsDir from config.json
#     - shorts
# cast:                         # a number is a position in the engine's palette, or use a hex colour
#   you: { hair: bowl, hairColor: 0, shirt: 1, skin: 0 }

hashtags:
  always: []                    # for example ["#yourproduct"]

# output:                       # only to override the engine defaults
#   aspect: "9:16"              # 9:16, 3:4, 4:5, 1:1, 4:3, 16:9
#   format: jpeg                # jpeg, jpg, png, webp
#   text: baked                 # baked, or native (type the text in TikTok)
#   safeMargins: { top: 0.12, bottom: 0.25, left: 0.06, right: 0.15 }

# style:
#   background: "#111214"
#   text: "#ffffff"
#   outline: "#000000"

test:
  viewsToRepeat: 15000          # a format that passes this is worth repeating
---

# Notes for the writer

Anything the copy should know that is not a setting: who the product is for,
how people describe the problem in their own words, what the test is trying
to learn, what was tried before.
