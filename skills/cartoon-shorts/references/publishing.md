# Before handing a short over

## Checklist

Picture and sound:

- [ ] 1080x1920, 30 fps, H.264 + AAC, `out/short_final.mp4` from `npm run finish`.
- [ ] The length the style or `targetSeconds` asks for (bean 50-60 s, toy 20-30 s). Loudness printed by finish near -14 LUFS, peak near -2 dBTP. Finish fails on its own above -1 dBTP.
- [ ] Frame 0 is the hook image with the first caption (it doubles as the
      thumbnail on most feeds). No black or blank first frame.
- [ ] No shot longer than about 2 s; no static app screen over 2 s.
- [ ] Captions stay clear of the platform UI: nothing important in the
      bottom 20% or the right-hand 15% of the frame, where TikTok and Shorts
      put the description and buttons. Default caption height 0.64 is safe.
- [ ] Every caption matches the spoken word; emphasis words are yellow.
- [ ] Watch it muted: the story still reads from captions and signs.
- [ ] The last line and frame lead back into the first.

Truth and privacy:

- [ ] Every app screen is a real capture of the current build (app-footage.md).
- [ ] Every claim is on the allowed list in `.cartoon-shorts/app-series.md`, and any
      factual hook has its source in `script.json` `notes`.
- [ ] No personal data, real names, real phone numbers or other apps' private content.
- [ ] Nothing still on draft assets (voice, old captures) unless the
      hand-over says so.

Slideshow material:

- [ ] `frames/` exists (`npm run frames`): caption-free frames of the scenes,
      so this short can feed slideshows, also after it is trimmed.

Post text:

- [ ] `social_text.md` exists beside `script.json` and matches this render
      (see "Links and copy" below). Re-write it if the VO or a claim changed.

QR end card (only when the timeline has a `qr`; see "QR code shorts" below):

- [ ] `npm run qr` passes: the settings match the timeline, the URL
      answers 302 with a `Location`, the QR in `out/short_final.mp4` reads
      back as that URL, and `social_text.md` exists and has the whole URL
      and the brief's `qr.socialLine`. It fails while the file is missing.
- [ ] The file posted came from `npm run render` and `npm run finish`.
      Anything else (a still, Studio, `review`, a partial render) shows a
      grey "QR preview" panel, not a code.
- [ ] No "WARNING: TEST URL" line: a QR on `localhost` or `127.0.0.1` is
      for tests only.

## Platform settings when posting (a person does the posting)

- **TikTok**: turn on the commercial content disclosure and choose "Your
  brand", the setting for promoting your own business
  (ads.tiktok.com help, "How to turn on the Commercial Content Disclosure
  setting"). TikTok's AI-generated label is required for realistic AI
  content; a code-drawn cartoon is not realistic, but secondary sources
  disagree on how far the rule reaches, so whether to tick it (for example
  when the voice is synthetic) is the channel owner's call.
- **YouTube Shorts**: YouTube does not require the altered or synthetic
  content disclosure for clearly unrealistic content such as animation
  (blog.youtube, "Disclosing AI-generated content", 2024). Cloning a real
  person's voice would change that. Check the paid-promotion setting's help
  text at upload; it is aimed at third-party sponsorship.
- **Instagram Reels**: no extra rule found for animated self-promotion;
  check at upload.

These were checked on 2026-11-03. Platform rules move, so re-check the
official help pages before the first post of a new series.

A short with a QR end card adds two TikTok rules (see "QR code shorts"):
the content disclosure setting must be on, and the video must not be
boosted.

## Links and copy

- Link in bio. Give each platform its own tracked store link (App Store
  `ct=tiktok|youtube|instagram`; Play `utm_source=<same>`,
  `utm_medium=social`, `utm_campaign=shorts`) so installs can be traced
  back to a platform. Keep the links in one file and reuse them.
- Write `social_text.md` in the short's folder (beside `script.json`, not in
  `out/`), every time a short is rendered as final and before hand-over. It
  holds the paste-ready TikTok caption, Instagram caption, YouTube Shorts
  title and description, and a pinned first comment for each. Links in
  TikTok and Instagram captions and Shorts descriptions are not clickable,
  so also give the exact phrase to type into the store search (test which
  phrase puts your app first), point Android-only features to Google Play
  only, and keep the free/paid wording exact. Take the claims
  from the script's `notes` and VO, not from memory. Plain words, no hype,
  no em dashes; vary the hook and the question from the other files.

## QR code shorts

When the project's product brief has a `qr` block, every short gets a QR
end card that points at `<qr.baseUrl><code>` (references/qr-end-card.md).
Its `social_text.md` then also carries:

- **A line with the code and the full URL**, at the top, for whoever posts:
  `QR code: bin -> https://example.com/st/bin`.
- **The brief's `qr.socialLine`, word for word, inside each platform's
  caption or description** (TikTok caption, Instagram caption, YouTube
  Shorts description). It is the way in for people who watch on the phone
  they would scan with.
- **Under the TikTok part, two notes:**
  - Turn on the content disclosure setting and choose "Your brand": TikTok
    treats a QR code in a video as a sign of commercial content.
  - Do not boost this video with Promote or Spark Ads: TikTok's ad rules
    ban QR codes, so a boosted copy would be rejected. Boost a version
    without the QR (`"qr": false`) instead.

Keep the redirect a direct 302 to the store or landing page, with no
interstitial page in between. Upload the clean render
(`out/short_final.mp4`) to each platform; never a screen recording or a
re-encode, which can blur the modules. `npm run qr` checks the URL, the
QR in the file, and that this file has the URL and the social line. It
does not check which part of the file the social line is in, or the
TikTok notes, so read those over before posting. If it warns that another
short uses the same code, give one of them its own `qrCode` first, or the
two will share one scan count.
