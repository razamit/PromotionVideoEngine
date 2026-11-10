# Putting the real app on screen

The cartoon is the wrapper; the app is the proof. Viewers who tap through
should find exactly what the short showed.

## Rules

- **Captures only.** Every app screen, notification, widget, lock screen
  and settings page comes from a real capture of the live build. Do not draw, mock, re-type or retouch UI, and never draw OS chrome
  (status bars, notification shades, dynamic islands) that is not in a capture.
- **No burned text.** Captures for shorts are clean: no overlay captions, no
  "1 min later" cards. The short's own captions and signs do that job.
- **No personal data.** Invented content only ("Take out the trash"), demo
  status bar, never a personal phone's notification shade (set-up below).
- **Real timing.** A swiped nag comes back at the repeat interval (1-30 min,
  default 3). Compress time with a cut and a time-skip sign ("3 MINUTES
  LATER" taped on the wall, a clock jumping), never by implying it returns
  instantly or by speeding up a recording without saying so.
- **Match the platform.** An iOS capture already has its own dynamic island
  and status bar; the cartoon bezel draws neither. For Android captures, crop
  the nav bar out of the bottom if it adds nothing (store tooling uses
  `CROP_BOTTOM = 2170` on 1080x2316 Android shots).
- **Keep it moving.** A capture on screen longer than 2 s gets a camera
  `push`, a `tiltDown` with `scrollFrom`/`scrollTo`, or a cut to a closer
  crop. Push toward the thing the VO is talking about (`focusX`/`focusY`).

## Before capturing

Check what you already have (old screen recordings, store screenshots,
press images). A recording with burned captions or "1 min later" cards can
still give clean windows; make a strip of any clip before using it:

```bash
ffmpeg -v error -y -i clip.mp4 -vf "fps=1,scale=150:-1,tile=10x2" -frames:v 1 strip.png
```

Store panels that are already framed with headlines are not usable.

## A clean capture set-up

- **Android emulator.** Turn on SystemUI demo mode for a clean status bar
  (`adb shell settings put global sysui_demo_allowed 1`, then
  `am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0815`
  and `-e command notifications -e visible false`). Send the notifications
  command again after opening the shade; it resets. Record with
  `adb shell screenrecord --bit-rate 12000000`. With more than one device
  attached, pass `-s <serial>` on every call.
- **iOS Simulator.** `xcrun simctl status_bar booted override --time 9:41`
  and record with `xcrun simctl io booted recordVideo`.
- **Seed demo data** through a debug-only entry point or the app's own UI.
  Invented tasks, names and numbers only (555-01xx phone numbers are
  reserved for fiction). Never capture a personal device.
- **The emulator's own notifications** ("Set a screen lock" and the like)
  show in the shade; snooze them before a shade shot (`cmd notification
  snooze`), and swipe away any snackbar.
- **Real timing.** Move the clock with `adb shell cmd alarm set-time <epoch
  ms>` (turn `auto_time` back on after) so an alarm fires on cue, or read the
  next alarm from `dumpsys alarm` and start recording shortly before it.
  Never speed up a recording without saying so on screen.
- **Typing.** `adb shell input text` (spaces as `%s`) fires the field's
  change callbacks; some test drivers' type commands do not.
- **Host load.** A debug build can stall (ANR) on keyboard events while
  renders hog the machine; capture with nothing else rendering.

## Captures an app short usually needs

Name them by what they show and save into the short's `public/app/`. For
a reminder app, for example:

| File | Shot |
|---|---|
| `nag_banner.mp4` | The notification arriving over the home screen |
| `nag_banner.png` + `nag_banner_crop.png` | Still of the banner, and the banner alone for `NotificationDrop` |
| `nag_actions.png` | The expanded notification with its buttons |
| `nag_returns.mp4` | Swipe away, it comes back (record across one real interval, clock visible) |
| `done_stops.mp4` | Pressing Done, the reminder stops |
| `home_list.png` | The task in the list |
| `settings.png` | The setting the story is about |

Normalise every recording before Remotion sees it:

```bash
bash <skill>/scripts/clip_normalise.sh raw.mp4 public/app/nag_banner.mp4
```

Crop a notification out of a real screenshot (find the box on a still first):

```bash
ffmpeg -v error -y -i nag_banner.png -vf "crop=iw*0.96:ih*0.075:iw*0.02:ih*0.045" public/app/nag_banner_crop.png
```

## Lessons that apply to any app

- Tap positions: measure them on the capture and use `TapRing
  coords="capture"` (below); a screen-fraction rule of thumb is only right
  for an unzoomed, top-anchored phone.
- The full phone at 60% of the frame width was not readable on a phone;
  the cropped notification card was. Zoom or crop every capture the VO
  talks about.
- Recording audio on an emulator with the host mic can freeze it; start
  it with `-no-audio` when a capture involves recording.
- Home-screen widgets: the launcher decides the default size from the
  widget's resize limits, so check how it lands on a stock launcher before
  planning a full-width widget shot.

## In the engine

Everything about a capture is measured in **capture fractions** (0..1 of
the screenshot's own width and height): open the PNG or a still of the
recording, read the pixel, divide by 1080 and 2400. The capture's pixel
size is read from the file, so iOS (1080x2348) and cropped captures work
the same way; pass `captureSize` only to skip the lookup.

### Make it readable

Rule of thumb: app body text at least about 28 px tall in the final
1080x1920 frame. In a 1420 px phone a 1080-wide capture shows at 0.55x, so
36 px body text becomes 20 px: too small. Zoom 2 makes it about 40 px.

```tsx
// Zoom into the task row: (x, y) goes to the screen centre, zoom 1 = whole screen.
<CartoonPhone src="app/home_list.png" height={1420} focus={{ x: 0.3, y: 0.36, zoom: 2 }} />
// Animate it: eased over the first 80% of the shot, then held for reading.
<CartoonPhone src="app/home_list.png" focus={{ x: 0.5, y: 0.4, zoom: 1.4 }} focusTo={{ x: 0.3, y: 0.36, zoom: 2 }} />
// A tap measured on the capture lands right under any zoom, scroll or crop.
<CartoonPhone src="app/banner.mp4" videoStart={13.2} focus={{ x: 0.4, y: 0.12, zoom: 1.8 }}>
  <TapRing coords="capture" x={0.2} y={0.164} delayFrames={15} />
</CartoonPhone>
// The readable insert: one region of the capture, big, with the house outline.
<CaptureCard src="app/banner.mp4" videoStart={15} crop={{ x: 0.03, y: 0.058, w: 0.94, h: 0.14 }} width={880} entrance="pop" wiggle />
```

- At zoom 2 the screen shows about half the capture's width; centre `x`
  on what must be read (a task title starting at x 0.09 needs x about 0.3).
- Start a `focusTo` move already part-zoomed (1.4 or more): the shot is
  only readable once the zoom lands, and shots are 2 s.
- `CaptureCard` crop: frame it tight on the content (the banner, one task
  row) so its text gets big; `CardReveal`'s default 820 px keeps a full
  push clear of the frame edge and the platforms' right-hand buttons
  (`src/layout/safeZone.ts`).
  `width` is the outer width, outline included; the crop fills the box
  inside the 9 px outline, so letters at the crop edge no longer touch it.
- Size the card for the camera move's peak scale, not for the frame the
  text check samples (70% into the shot): a push peaks at 1.16x (1.22x at
  `amount` 1.4), a pan at 1.14x plus a 5% shift, a crash at 1.5x, and
  `wiggle` adds plus or minus 2.5 degrees. The table is in
  remotion-engine.md under "Camera moves". `cardReveal`'s `width` param
  sets it per shot.
  Entrances: `pop` (default), `drop`, `slideUp`, `none`; `delayFrames`,
  `tilt` (default -3), `wiggle` for a nagging banner. Children are
  overlays in capture space (a `TapRing coords="capture"`).
- Demo scenes: `phoneFocus` (params `src`, `videoStart`, `focus`, `focusTo`,
  `tap: {x, y, at}` in capture fractions and seconds, `colors`) and
  `cardReveal` (`src`, `crop`, `videoStart`, `tap`, `entrance`, `y`, `width`). The
  engine's example short ships `public/app/demo_home_list.png` and `demo_banner.mp4`
  so they render.

### Other phone uses

```tsx
<CartoonPhone src="app/nag_banner.mp4" videoStart={1.5} height={1350} buzzing tilt={-4} />
<CartoonPhone src="app/home_list.png" scrollFrom={0} scrollTo={30} />
<CartoonPhone src="app/home_list.png">
  <NotificationDrop src="app/nag_banner_crop.png" delayFrames={8} />
</CartoonPhone>
```

`NotificationDrop` is only for a crop of a real banner placed over the same
app's real screen; it adds motion, not content. Prefer a recording of the
real banner arriving when one exists.

Phone on a `Burst` backdrop is the reveal look; phone held by a Bean in a
room works for setup beats (place the phone in the 2D layer next to the
hand, `height` about 500).
