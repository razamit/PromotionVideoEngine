---
name: reveal
summary: A tight crop of one detail, then the whole screen or widget
slides: { min: 4, max: 6 }
productName: last-only
roles:
  - { role: hook, layout: screenshot, maxWords: 10, screenshot: required }
  - { role: reveal, layout: screenshot, maxWords: 12, screenshot: required }
  - { role: detail, layout: screenshot, maxWords: 12, screenshot: required }
  - { role: end, layout: end }
starter: [hook, reveal, detail, detail, end]
---

# A product or widget reveal

Curiosity first: the hook shows a small, odd-looking piece of the real screen
and a line that makes people want the rest.

- **Hook:** a tight crop of one element (a button, a counter, a row) with a
  line such as "the button I press 20 times a day". The crop must still be
  readable; lint warns when it is drawn too small.
- **Reveal:** pull back to the whole screen or the home-screen widget.
- **Detail:** one detail per slide, each a crop of the same real screens.
- **End:** the product name.

Good for: a product whose screen is its own argument (a widget, a
dashboard). Weak when the screen needs explaining.
