// Which shots of a short are worth keeping as caption-free frames for
// slideshows. "A handful" means one frame per distinct scene: the shot of
// that scene with the least text of its own drawn in it (a speech burst or a
// sign would fight the slide's line), and among those the one held longest.

/** How far through a shot its frame is taken: late enough for entrances to have settled. */
export const MOMENT_IN_SHOT = 0.6;
const HANDFUL_LIMIT = 12;

/** A scene parameter that puts words on screen: "LATER.", "8 AM", "I'M DOING IT." (not "sideEye" or "app/home.png"). */
function isOnScreenText(value) {
  if (typeof value !== "string" || value.includes("/")) return false;
  return /\s/.test(value) || (/[A-Z]/.test(value) && !/[a-z]/.test(value));
}

const onScreenTextCount = (shot) => Object.values(shot.params ?? {}).filter(isOnScreenText).length;
const heldSeconds = (shot) => shot.end - shot.start;

/** The quietest, longest-held shot of each scene, in story order, at most a dozen. */
export function handfulOfShots(timeline) {
  const bestByScene = new Map();
  for (const shot of timeline.shots) {
    const best = bestByScene.get(shot.scene);
    const isBetter = !best
      || onScreenTextCount(shot) < onScreenTextCount(best)
      || (onScreenTextCount(shot) === onScreenTextCount(best) && heldSeconds(shot) > heldSeconds(best));
    if (isBetter) bestByScene.set(shot.scene, shot);
  }
  return [...bestByScene.values()].sort((a, b) => a.index - b.index).slice(0, HANDFUL_LIMIT);
}

export function shotsByIndex(timeline, indexes) {
  const unknown = indexes.filter((index) => !timeline.shots.some((shot) => shot.index === index));
  if (unknown.length) throw new Error(`no shot ${unknown.join(", ")} in this short (it has shots 0 to ${timeline.shots.length - 1})`);
  return timeline.shots.filter((shot) => indexes.includes(shot.index));
}

export const frameOfShot = (shot, fps, moment = MOMENT_IN_SHOT) => Math.round((shot.start + moment * (shot.end - shot.start)) * fps);

export const frameFileName = (shot) => `shot-${String(shot.index).padStart(2, "0")}-${shot.scene}.jpg`;

/** The words spoken while the shot is on screen. */
export function spokenDuring(shot, timeline) {
  return (timeline.words ?? []).filter((word) => word.start >= shot.start && word.start < shot.end).map((word) => word.text).join(" ");
}
