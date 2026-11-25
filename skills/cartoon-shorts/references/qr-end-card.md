# QR end card

A short can end on a QR code that opens the app's store page through a
redirect on your own site (`https://example.com/st/<code>` answering 302).
The code is per short, so each short's scans can be counted on the
redirect. This page is the engine side; the post text and platform rules
are in publishing.md, "QR code shorts", and the `qr-end-card` skill adds or
changes the QR on an existing short.

## Settings

A project turns it on in its product brief
(`.cartoon-shorts/product-brief.md`, the same file slideshow mode reads):

```yaml
qr:
  baseUrl: https://example.com/st/     # the code is appended
  label: Scan to get the app           # optional, this is the default
  socialLine: Scan the code at the end or search Example App
  minSeconds: 2.5                      # optional, 2.5 to 10
```

- `baseUrl`: https, ending in `/`, written exactly the way a browser reads
  it back (no spaces, no user name or password, no `?query` or
  `#fragment`), because the phone reads the text exactly as encoded. http
  is allowed only for `localhost` or `127.0.0.1`, for tests; see "Test
  addresses" below.
- `label`: one line under the code, at most 20 characters, so it stays at
  least 30 px tall on the narrowest card.
- `socialLine`: required. It goes word for word into every caption.
- `minSeconds`: how long the code is fully visible at least, 2.5 to 10.

Slideshow lint checks the same block with the same rules, so a bad one is
reported there too, even though slideshows draw no QR.

Every short in the project then gets the card unless its script.json says
`"qr": false` (the brief is then not read at all). `"qr": true` only turns
a missing block into an error. The code is `qrCode` in script.json, or the
folder name made into one (lowercase, a-z 0-9 and dashes, at most 20
characters, cut at a dash) and saved as the first key of script.json.
A brief that does not parse stops a short only when its text has a `qr:`
key; otherwise the QR is off and a warning says why.

`npm run timeline` resolves all this before any voice is made, so a bad
block, or a URL too long for the card (above QR version 10), stops it
early. It builds the matrix in Node (error correction M, the `uqr` package)
and writes it into the timeline as `qr`: `{ code, url, label, version,
modules, startSec, endSec, enterFrames, holdFrames }`, plus `shotIndex`
when the card is not on the last shot (see "Which shot"). It prints
`qr: on, code "<code>" ...`, which shot carries the card and why, and the
version and window. It warns, without stopping, when another short in the
same shorts folder (or the project's `shortsDir`) has the same `qrCode`:
two shorts would share one redirect and one scan count.

## Which shot

One shot carries the card (`scripts/qr/qr_shot.mjs`):

1. A shot with `"qr": true` in script.json. At most one shot may say so;
   two or more stop the timeline with an error naming them. (This is the
   shot's own `qr`, inside `lines[].shots[]`; the top-level `"qr"` still
   switches the whole QR on or off.)
2. Otherwise the last shot, when it is an end card (scene `endCard`, bean
   or toy), or when no shot is.
3. Otherwise, when the last shot is not an end card but an earlier shot is
   (a "link in bio" card followed by a loop line), the last `endCard` shot
   that is the last shot of its line. An `endCard` shot that shares its
   line with a later shot is never chosen this way, since a hold after it
   would cut into the sentence; the card then stays on the last shot, as
   in 1.4.0, and the timeline says why.

The timeline prints the choice, for example `qr: card on shot #46 endCard
(line 27, "Sticky Tasks. Free. Link in bio."): the last shot (#47
questCard) is not an end card, so the last endCard shot that ends its line
carries the card`. A short whose card was already on its last shot builds
the same timeline as in 1.4.0.

## The card

- **Where.** `src/overlay/QrCard.tsx` draws it over the whole QR shot
  (`qr.shotIndex`, else the last shot), outside every CameraRig, at the
  caption level: black modules on a white
  rounded card, whole pixels per module, a quiet zone of 4 modules, the
  label under it in Inter. It is centred on x = 540, ends at y = 1424, and
  the symbol stays left of x = 780 where TikTok's buttons start
  (`src/layout/qrGeometry.ts`). It fades in over 5 frames, then holds
  still. It goes with the cut out of its shot, with no fade.
- **Hold.** Only fully visible frames count. When the QR shot gives fewer
  than `minSeconds` of them, the short grows by the missing frames and the
  scene's last frame is frozen over them (Remotion `<Freeze>`); a fixed
  music bed that ends earlier fades out at its own end. A long enough shot
  is left alone. Lint counts the held frames toward the short's length but
  not toward its words-per-minute pace, and does not call the QR shot a
  long shot.
- **Hold before a loop line.** When the QR shot is not the last, the held
  frames go in at its cut and everything after it starts later by exactly
  as many frames: the later shots (and so their sound effects, which are
  placed from the shots), the lines, the word times and the captions. The
  voice is not cut and no line is synthesised again: in `vo.wav` the
  silence after the QR shot's line grows by the hold, so the next line
  starts on its new frame. The music bed plays on under the hold. The hold
  needs the QR shot to end its line; a shot marked `"qr": true` that does
  not, and is too short, stops the timeline with a message (give it more
  weight, put it on its own line, or mark the line's last shot).
- **Preview or real.** Only `npm run render` draws the real code (see
  "Checks"). Studio, `still`, `review`, `bubbles`, a partial render
  (`--frames`) and a scaled one show a grey-blue "QR preview" panel of the
  same size in its place, with the short's code and "The real code is
  drawn only by npm run render" on it. No phone can
  scan that panel, and none of these make a network request. Layout checks
  on stills are still valid, since everything around the card is the same.

## Keeping the end scene clear

The QR shot's scene can call `useQrReserve()`: the card's rectangle plus
a 24 px margin, in px of the 1080x1920 frame, or null without a QR and in
every other shot.
`EndCard` and `BrandEndCard` use it to put their words and logo above the
card through `<FitAboveQr>`. With no QR they render as before.

A short's own end scene should do the same. Import from these two paths,
never from `src/index.ts` (that file registers the root, and a scene that
imports it loops back into itself):

```tsx
import { useQrReserve } from "@engine/overlay/qrReserve";
import { FitAboveQr } from "@engine/overlay/FitAboveQr";

const reserve = useQrReserve();
return reserve ? <FitAboveQr reserve={reserve} name="MyEndCard">{column}</FitAboveQr> : column;
```

`FitAboveQr` centres the column in the band between the top of the safe
zone and the card. Text wraps at the safe zone's width. The column is
measured as drawn, after the fonts load, and shrunk when it is taller than
the band or wider than the safe zone. Shrinking for height stops at 0.8;
past that the column is drawn at 0.8 and grows up from the card instead
of onto it, and the render log warns `[qr-card] <name>: ...`. Optional
props: `top`, `maxWidth`, `minScale`, `style`. During a render,
`qrTextAudit.ts` also warns (`[qr-card] text "..." overlaps the QR card`)
for any text that touches the card. Stills do not print these warnings; a
render does, so read the render log.

**Captions in the QR shot.** While the card is up, from the frame it
appears to the cut out of its shot, captions are moved above it. That is
usually where the end scene's own words are, so they can land on top of
them. The timeline warns when the QR shot has a spoken, captioned line.
Give it no spoken line, or set `"hideCaptions": true` on it. Captions in
the shots after it sit where they always do.

## Checks

Every check below exists so a code that points nowhere, or at the wrong
place, is never posted. There is no switch to skip any of them.

- **Stale timeline.** `render` and `finish` first compare the timeline's
  `qr` with the current settings (on or off, code, URL, label, the shot
  that carries the card, and the fully visible time against `minSeconds`).
  A timeline without `qr.shotIndex` (every 1.4.0 timeline) has the card on
  its last shot, so it still passes while script.json also puts it there;
  a 1.4.0 timeline of a short whose card now moves to an earlier end card
  is out of date. If they differ, they stop
  before doing anything and say to run `npm run timeline`. `render` does
  this even for a preview render.
- **Redirect.** A full render to a video file (`npm run render`, or
  `npm run remotion -- render` at full size to a .mp4, .mov, .webm or
  .mkv) first requests the QR's URL once: one GET, redirects not followed,
  a 10 s timeout, User-Agent `cartoon-shorts-qr-check`. It renders only on
  a 302 with a non-empty `Location` header. Anything else (another status,
  a 302 without `Location`, a network error, no answer) stops it with "the
  QR redirect route is not live yet", and nothing is written. Only then
  does Remotion start with the one value that lets `QrCard` paint the real
  modules (`src/overlay/qrVerification.ts`).
- **Decode.** After that render, and again after `finish`, one frame from
  the middle of the card's fully visible window (wherever in the short
  that window is) is decoded (ffmpeg, then
  the `qr` package, which is separate from the encoder). It reads the
  card's own rectangle first and the whole frame only when that finds
  nothing. The text must equal the URL exactly. A file that fails is
  renamed `*.QR-FAILED-do-not-post.mp4` and the command exits 1. A frame
  showing the preview panel fails with a message saying so.
- **`npm run qr`** runs the last step before posting, all in one go: the
  settings against the timeline, the redirect (the same single request),
  the decode of `out/short_final.mp4` (else `out/short.mp4`, or a file
  given as the argument), and `social_text.md`. That file must exist and
  contain the full URL as a whole (`.../st/ep1` is not found inside
  `.../st/ep10`) and the brief's `socialLine` word for word, somewhere in
  the file. It does not check which platform's part the line is in, or
  the TikTok notes; those are for the person writing it (publishing.md).
  It prints `qr: all checks passed` and exits 0 only when all four pass.

**Test addresses.** A `baseUrl` on `localhost` or `127.0.0.1` is for
testing the pipeline against a local server. Every step that reads it
(`timeline`, `render`, `finish`, `qr`) prints `WARNING: TEST URL ... Do
NOT post this video`.

**Missing packages.** The two QR packages (`uqr`, `qr`) load only in the
steps that use them, so an engine installed before they were added still
runs every other command. A step that needs one stops with a message to
run `npm ci` in the engine (or `ensure_engine.sh`).

## Known limits

- **A flag's value read as the output path.** The engine reads an argument
  after a `--flag` written without `=` as that flag's value. So
  `npm run render -- --concurrency 4` names no output file: Remotion writes
  `out/Short.mp4` inside the engine, as it always has, and with a QR that
  render shows the preview panel and prints why. A boolean flag before a
  path (`--muted out/x.mp4`) has the same effect. Write the path first
  (`npm run render -- out/short.mp4 --concurrency 4`) or use `=`
  (`--concurrency=4`).
- **Env files.** The Remotion CLI loads `engine/.env` (or `.env.local`, or
  a file passed with `--env-file`) and its values win over the
  environment, so a line setting `REMOTION_QR_VERIFIED` there would skip
  the redirect check. Never create one. Every command that starts Remotion
  refuses to run while such a file mentions that name. A file created
  while Studio is already open is not caught (Studio reloads env files),
  so do not create one then either.
