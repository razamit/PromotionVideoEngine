Real app captures for this short go here: screenshots (PNG) and screen
recordings (MP4, normalised with the skill's `scripts/clip_normalise.sh`).
Never drawn or mocked UI. See the cartoon-shorts skill, references/app-footage.md.

The two `demo_` files are real captures of Sticky Tasks (the app this
engine was built for) from an Android emulator at 1080x2400, here so the
toy demo scenes render (`demo_banner.mp4` is spare, for trying a video capture in the floating phone). `demo_banner.mp4` is
4.2 s long: the reminder banner fades in at about 0.5 s and is settled by
1.0 s. Replace them with your own app's captures in a real short.

The phone shot shows `demo_home_list.png` whole and lifts the task row out
as a callout (`params.callout`), cropped on the row's own edges: x 0.0389,
y 0.3075, w 0.9222, h 0.1146 in capture fractions (the card's border is at
42 to 1037 px across and 738 to 1012 px down). Measure a new capture the
same way; `npm run lint` fails a shot that cuts its element.
