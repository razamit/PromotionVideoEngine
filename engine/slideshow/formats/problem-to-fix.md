---
name: problem-to-fix
summary: A first-person story, from the moment it went wrong to the fix
slides: { min: 5, max: 7 }
productName: last-only
roles:
  - { role: hook, layout: text, maxWords: 12 }
  - { role: story, layout: text, maxWords: 16 }
  - { role: fix, layout: screenshot, maxWords: 14, screenshot: required }
  - { role: end, layout: end }
starter: [hook, story, story, fix, fix, end]
---

# A problem-to-fix story

One person, one small disaster, told in the first person and the past tense.

- **Hook:** the moment it went wrong, specific enough to picture. "I paid a
  parking ticket twice as late as I meant to." No lesson yet.
- **Story:** it got worse, then what was tried and did not work. One beat per
  slide. Keep it small and true to life; no invented numbers.
- **Fix:** the real screen that changed it, cropped to the part the line is
  about. Then what is different now, on a second real screen. Say what
  happens, not the feature's name.
- **End:** the product name, the only place it appears.

Good for: watch-through and comments ("this is me"). Every claim in the fix
slides must be on the product's allowed-claims list.
