---
format: reveal
topic: "Smoke test: a reveal deck from the demo capture"
keyword: "to-do list"
brief: product-brief.md
cover: 1
sound:
  mood: "anything; this deck is never posted"
slides:
  - role: hook
    text: "The one task I could not ignore today"
    screenshot: demo_home_list.png
    crop: { x: 0.03, y: 0.3, w: 0.94, h: 0.125 }
  - role: reveal
    text: "It sits alone at the top of the list"
    screenshot: demo_home_list.png
    crop: { x: 0, y: 0.1, w: 1, h: 0.62 }
  - role: detail
    text: "The header counts what is left"
    screenshot: demo_home_list.png
    crop: { x: 0.1, y: 0.125, w: 0.8, h: 0.075 }
  - role: end
---

# Notes

A smoke test for the engine, not a real post. Run it with:

```bash
SLIDESHOW_DIR="$PWD" node ../bin/slideshow.mjs render
```
