---
name: qr-end-card
description: "Add or change the QR code on the end card of an existing cartoon short (made with the cartoon-shorts skill), so viewers can scan it to reach the app through a per-short redirect such as https://example.com/st/<code>. Sets the short's code, rebuilds the timeline, checks that the redirect answers 302, renders, finishes, decodes the QR from the file and updates social_text.md. Use when asked to put a QR code on a short, change a short's QR code or link code, re-point a short's QR, or check that a short's QR works. Not for making a new short (use cartoon-shorts) or for slideshows."
argument-hint: "<code>"
---

# QR end card

Puts a QR code on the last shot of a short that already exists, or changes
the one it has. The QR points at `<qr.baseUrl><code>`, where `qr.baseUrl`
comes from the project's product brief and the code is the argument
(1 to 20 characters of `a-z`, `0-9` and `-`). The engine draws the card,
holds the last shot until the code has been fully visible for at least
`minSeconds` (2.5 s unless the brief says more), and checks the result. How it works in detail:
`${CLAUDE_PLUGIN_ROOT}/skills/cartoon-shorts/references/qr-end-card.md`.

## Set-up

The short runs on the shared engine. Install or refresh it first, the same
way the cartoon-shorts skill does:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/cartoon-shorts/scripts/ensure_engine.sh"
ENGINE="$(bash "${CLAUDE_PLUGIN_ROOT}/skills/cartoon-shorts/scripts/ensure_engine.sh" --where)"
```

Work inside the short's folder (the one with `script.json`). A short made
before plugin 1.4.0 has no `npm run qr`; run every step as
`node "$ENGINE/bin/short.mjs" <command>` instead of `npm run <command>`.

## Steps

1. **The brief.** Open `.cartoon-shorts/product-brief.md` at the project's
   root. It needs this block in its YAML:

   ```yaml
   qr:
     baseUrl: https://example.com/st/   # https, ends with "/"
     socialLine: Scan the code at the end or search <App name>
     # label: Scan to get the app       # optional, up to 20 characters
     # minSeconds: 2.5                  # optional, 2.5 to 10
   ```

   If the file or the block is missing, stop and ask the user for the base
   URL and the social line; do not guess a domain. The brief template is
   `$ENGINE/slideshow/product-brief.template.md`. A `baseUrl` on
   `localhost` or `127.0.0.1` is only for tests; every step then prints a
   "Do NOT post this video" warning, and that video must not be posted.
2. **The code.** Check it against `^[a-z0-9-]{1,20}$`. If it fails, say
   why and suggest a fixed one (lowercase, dashes for spaces).
3. **script.json.** Set `"qrCode": "<code>"` (add it as the first key, or
   change the value) and remove `"qr": false` if it is there. Change
   nothing else in the file.
4. **Timeline.** `npm run timeline`. It prints `qr: on, code "<code>"`,
   the QR version and, when the last shot was too short, how many frames
   it was held. Pass on any warning it prints: another short using the
   same code (give one of them its own `qrCode`), or spoken words with
   captions in the last shot.
5. **Look at the last shot.** `npm run still -- out/qr.png --frame=<n>`
   with `<n>` in the middle of the QR window (`qr.startSec` to `qr.endSec`
   in `generated/timeline.json`, times 30). The still shows a grey "QR
   preview" panel where the code goes; that is expected, only the render
   draws the real code. Read the PNG: no words or logo under or touching
   the card, the label readable. Captions in the last shot are moved above
   the card and can land on the end card's own words; if the timeline
   warned about them, set `"hideCaptions": true` on the last shot (or
   ask the user to drop its spoken line) and run the timeline again. A
   short's own end scene that does not move out of the way needs
   `useQrReserve` from `@engine/overlay/qrReserve` and `FitAboveQr` from
   `@engine/overlay/FitAboveQr` (see the reference above).
6. **Render.** `npm run render`, with no extra arguments. It stops first
   if the timeline no longer matches the settings (run step 4 again).
   Then it requests the QR's URL once and goes on only if it answers 302
   with a `Location`. If it stops with "the QR redirect route is not live
   yet", stop here and tell the user exactly that, with the URL and the
   status it printed. Never work around it: no other URL, no skipping, no
   editing the timeline, no env variables or env files. After the render
   it decodes the QR from the file; a failure renames the file to
   `*.QR-FAILED-do-not-post.mp4`.
7. **Finish.** `npm run finish`. It decodes the QR again from
   `out/short_final.mp4`, with the same rename on a failure.
8. **Post text.** Write or update `social_text.md`: a line at the top with
   the code and the full URL, the brief's `socialLine` word for word inside
   each platform's caption or description, and the two TikTok notes below
   (details: `${CLAUDE_PLUGIN_ROOT}/skills/cartoon-shorts/references/publishing.md`,
   "QR code shorts").
9. **Check.** `npm run qr`. It checks that the settings match the
   timeline, that the URL answers 302 with a `Location`, that the QR in
   `out/short_final.mp4` reads back as the URL, and that `social_text.md`
   exists and contains the whole URL and the `socialLine` word for word.
   It does not check where in the file the line sits or the TikTok notes,
   so check those yourself. Report its output and the absolute paths of
   `out/short_final.mp4` and `social_text.md`.

## Platform notes

- **TikTok:** turn on the content disclosure setting ("Your brand"); TikTok
  treats a QR code as a sign of commercial content. Do not boost the video
  with Promote or Spark Ads; TikTok's ad rules ban QR codes.
- Keep the redirect a direct 302 to the store or landing page, with no
  interstitial page.
- Upload the clean render (`out/short_final.mp4`) to each platform, not a
  screen recording or a re-encode.
