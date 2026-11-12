---
name: before-after
summary: Before in words or a supplied photo, after in real screenshots
slides: { min: 4, max: 6 }
productName: last-only
roles:
  - { role: hook, layout: text, maxWords: 10 }
  - { role: before, layout: text, maxWords: 14 }
  - { role: turn, layout: text, maxWords: 12 }
  - { role: after, layout: screenshot, maxWords: 14, screenshot: required }
  - { role: end, layout: end }
starter: [hook, before, turn, after, after, end]
---

# Before / after

- **Hook:** the before, as the viewer lives it. "My reminders, before and
  after I stopped trusting myself."
- **Before:** in words, or over a real photo the brief supplies (`photo:`).
  Never a drawn or imitated screen of another app or of the phone's own UI.
  If the before is a real screen of this product, use the `split` layout with
  two real crops and labels.
- **Turn:** one line on what changed.
- **After:** two real screens, one idea each.
- **End:** the product name.

Good for: a visible change. Do not exaggerate the before; a believable mess
beats a cartoon one.
