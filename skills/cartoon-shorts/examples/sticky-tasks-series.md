# Example: the Sticky Tasks series file

A filled-in `references/app-series.md`, from the app this skill was built
for (Sticky Tasks, a reminder app that keeps nagging until a task is done).
Use it to see how specific the claims list should be. Source paths point
into that app's own repo and are not part of this one.

## The promise in one line

A reminder that keeps coming back until you mark the task done.

## Claims the script may make

Source: `docs/CURRENT_BEHAVIOR.md` (written from the code). Re-read it
before each short; if behaviour changed, update this list.

| Claim | Fact behind it |
|---|---|
| It keeps reminding you until it's done | The nag repeats at one global interval until the task is completed |
| Swipe it away and it comes back | Swipe-away is not a dismissal; the repeat fires again at the interval |
| You choose how often: every 1 to 30 minutes | Settings > Alerts, default 3 |
| Done, I'm doing it, Snooze, right on the reminder | 2.13.0 buttons on Android and iOS |
| "I'm doing it" gives you a quiet window, then checks back | Default 20 min (10-60 selectable); never completes the task |
| Snooze for 10 minutes | Android 10 min; iOS 10 min or 1 hour |
| Recurring tasks, widgets | Free on both platforms |
| Free on iPhone, iPad, Mac and Android | Sticky reminders, repeat interval and recurring tasks are free |
| No task limit | CURRENT_BEHAVIOR section 2: no count check anywhere, both platforms |
| Search your tasks | Free; the home-screen search filters as you type (300 ms debounce) |
| Dark mode follows your phone | `ThemeMode.system`; there is no in-app toggle, so never say "turn on dark mode in the app" |
| With Pro, a missed call becomes a "Call back <name>" task (Android) | Notification listener reads the dialer's missed-call alert; reminder 15 min, 30 min, 1 hour (default) or 3 hours later; repeat calls merge into one task; declined calls create nothing |
| With Pro, share a link or text into a task (Android) | Shared text lands in the Description, title empty, a bare link gets "Open link"; the nag body shows it |
| With Pro, attach a photo or a voice memo | Attachment sheet: Camera, Gallery, File, Voice memo; the photo shows in the editor, not in the notification |
| With Pro, a month calendar with your tasks (Android and iOS) | Month grid only, at most 3 dots a day, tap a day for its list; moving a task means editing its date |
| With Pro, the full-screen alarm wakes the screen with the task (Android) | Same sound and vibration as set; page has time, title, Done, I'm doing it, Snooze 10, Dismiss |

Pro-only, so say "with Pro" or leave out: full-screen alarm (Android only),
location reminders, checklists, attachments and voice memos, calendar,
streaks, daily recap, custom sound, missed-call tasks (Android), Siri
(iOS), iCloud sync (iOS).

Never claim:

- That it rings through silent mode, Do Not Disturb or Focus. It does not;
  it follows the phone's notification rules.
- Any user count, rating, review quote or statistic that is not sourced.
- Anything medical: no "for ADHD", "treats", "helps your condition".
  A relatable forgetful morning is fine; a diagnosis is not.
- That other named apps fail. "Most reminders ping once" is fine; naming a
  competitor is not.
- That priority sorts or floats tasks up, or makes a nag louder. The list
  sorts by due date (`TaskController._compareTasks`); High / Medium / Low is
  a coloured label only (checked 2026-11-03).
- An "every 2 weeks" option. Weekly repeats on chosen weekdays every week; a
  two-week gap is Custom, "Every 14 days".
- A streak freeze, repair or recovery. Missing a day restarts the streak at
  1 on the next completion; the longest streak is kept.
- A different sound per task on the free tier (per-task sound is a Pro
  setting since 2.14.0).

## The house cast

Drawn with `Bean`; keep these exact settings across episodes so people
recognise them.

| Who | Bean settings | Role |
|---|---|---|
| You | `hair="bowl"`, `hairColor=palette.hair[0]`, `shirt=palette.shirts[1]` (teal, the brand-adjacent colour), `skin=palette.skin[0]` | The viewer. Seen from behind in over-the-shoulder shots |
| The roommate | `hair="messy"` (spiky until episode 1 v1; it read as a crown), `hairColor=palette.hair[3]`, `shirt=palette.shirts[2]` | Judges you silently. Running-gag material |
| Past you / future you | Same as You, `face={{ eyes: "tired" }}` or sunglasses | Time jumps |
| The phone | `CartoonPhone` with the real app, `buzzing` when nagging | The hero of the twist |

## Series backlog (examples, not build orders)

Each: logline, hook, the twist the app makes possible. The channel owner picks.

1. **It won't stop until the trash is out.** One apartment, you, a trash
   bag that grows every day. Hook: "This bag has been by the door since
   Tuesday." Escalation: it gets bigger, flies arrive, the roommate stares,
   you build a productivity system instead of carrying it. Reveal: the
   reminder you swiped away comes back, and back. Twist: you take it out
   just to make the phone stop. Worked script: `examples/take-out-the-trash.script.json`.
2. **Dismissed versus sticky.** Split screen, two of you, same morning. One
   app pings once and is swiped away; the other keeps coming back. Hook:
   "You have dismissed nine hundred reminders this year" (only with a real
   source, otherwise a visual hook). Twist: the version of you with the
   sticky one is the only one who left the house with keys.
3. **The one thing this morning.** A chaotic morning, everything goes wrong,
   one task cannot be missed (passport, bin day, the parcel). Hook: "You
   will forget exactly one thing today, and it will be the important one."
   Twist: "I'm doing it" buys twenty quiet minutes, then it checks back.
4. **The roommate variant.** The trash story told from the roommate's side,
   ending on them installing the app on your phone. Reuses episode 1's
   scenes, which is the point of a series.

Once a short is posted, move it from this list to a "Posted" section with
the date and file path, so the backlog stays honest.

