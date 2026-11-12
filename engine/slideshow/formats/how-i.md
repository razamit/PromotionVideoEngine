---
name: how-i
summary: How I [outcome] in three steps, one real screen per step
slides: { min: 5, max: 7 }
productName: last-only
roles:
  - { role: hook, layout: text, maxWords: 10 }
  - { role: step, layout: screenshot, maxWords: 12, screenshot: required, numbered: true }
  - { role: result, layout: screenshot, maxWords: 12, screenshot: required }
  - { role: end, layout: end }
starter: [hook, step, step, step, result, end]
---

# How I [outcome] in 3 steps

A walkthrough people save for later.

- **Hook:** the outcome, not the tool. "How I stopped forgetting bin day."
- **Steps:** one per slide, each a crop of the real screen where the step
  happens. Give the step its `number:` (drawn large above the line) and
  start the line with a verb.
- **Result:** the real screen that shows it worked.
- **End:** the product name.

Good for: features with a visible set-up. Needs one current capture per
step; a missing capture stops that slide, so check the captures first.
