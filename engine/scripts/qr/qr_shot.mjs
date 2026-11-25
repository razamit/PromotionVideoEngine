// Which shot of a short carries the QR card. Pure: it takes script.json's
// lines and touches no files.
//
//   a shot with "qr": true       -> that shot (at most one may say so)
//   the last shot is an end card -> the last shot (as in 1.4.0)
//   an earlier shot is an end card, and it ends its line
//                                -> the last such shot (the "link in bio"
//                                   card before a loop line)
//   anything else                -> the last shot (as in 1.4.0)
//
// The automatic choice takes only an end card that is the last shot of its
// line: a hold has to go after the line's voice, never into the middle of a
// sentence (qr_middle_hold.mjs). The timeline, render, finish and qr all
// resolve the shot here, so a script changed after the timeline was built
// is caught as a stale timeline (qr_timeline_check.mjs).

/** The engine's end card scene, in bean and toy shorts alike (src/scenes/demoScenes.tsx, src/toy/demoScenes.tsx). */
export const END_CARD_SCENE = "endCard";

/** Every shot of the script in order, with its line and whether it is the line's last shot. */
export function flatShots(lines) {
  return (lines ?? []).flatMap((line, lineIndex) => (line.shots ?? []).map((shot, i, shots) => ({
    shot,
    lineIndex,
    endsLine: i === shots.length - 1,
  })));
}

const describe = (entry, index) => `#${index} ${entry.shot.scene}`;

/** Shots that say "qr": true, or an error for a value that is not a boolean. */
function markedShots(flat) {
  const marked = [];
  for (const [index, entry] of flat.entries()) {
    const value = entry.shot.qr;
    if (value === undefined || value === false) continue;
    if (value !== true) return { error: `script.json shot ${describe(entry, index)} has "qr": ${JSON.stringify(value)}; a shot's "qr" must be true or false` };
    marked.push(index);
  }
  return { marked };
}

function lastEndCardEndingLine(flat) {
  for (let index = flat.length - 1; index >= 0; index -= 1) {
    if (flat[index].shot.scene === END_CARD_SCENE && flat[index].endsLine) return index;
  }
  return -1;
}

function lastEndCardIndex(flat) {
  return flat.findLastIndex((entry) => entry.shot.scene === END_CARD_SCENE);
}

/** Why the last shot was kept when it is not an end card. */
function lastShotReason(flat, lastIndex) {
  const card = lastEndCardIndex(flat);
  if (card === -1) return "the last shot (no shot uses the endCard scene)";
  return `the last shot (the last endCard shot, ${describe(flat[card], card)}, does not end its line, so a hold after it would cut into the voice)`;
}

/**
 * @param {Array<{ shots: Array<Record<string, any>> }>} lines script.json lines
 * @returns {{ index: number, lineIndex: number, endsLine: boolean, isLast: boolean, source: "flag" | "endCard" | "last", reason: string } | { error: string }}
 */
export function chooseQrShot(lines) {
  const flat = flatShots(lines);
  if (flat.length === 0) return { error: "script.json has no shots to put the QR card on" };
  const { marked, error } = markedShots(flat);
  if (error) return { error };
  if (marked.length > 1) {
    return { error: `script.json marks ${marked.length} shots with "qr": true (${marked.map((i) => describe(flat[i], i)).join(", ")}); only one shot can carry the QR card` };
  }
  const lastIndex = flat.length - 1;
  const pick = (index, source, reason) => ({ index, lineIndex: flat[index].lineIndex, endsLine: flat[index].endsLine, isLast: index === lastIndex, source, reason });
  if (marked.length === 1) return pick(marked[0], "flag", 'the shot is marked "qr": true');
  if (flat[lastIndex].shot.scene === END_CARD_SCENE) return pick(lastIndex, "last", "the last shot (an end card)");
  const card = lastEndCardEndingLine(flat);
  if (card !== -1) {
    return pick(card, "endCard", `the last shot (${describe(flat[lastIndex], lastIndex)}) is not an end card, so the last endCard shot that ends its line carries the card; mark a shot "qr": true to choose another`);
  }
  return pick(lastIndex, "last", lastShotReason(flat, lastIndex));
}

/** One line for the timeline log. */
export function describeQrShot(choice, lines) {
  const flat = flatShots(lines);
  const entry = flat[choice.index];
  const vo = String(lines[entry.lineIndex]?.vo ?? "").replace(/\*/g, "");
  return `qr: card on shot ${describe(entry, choice.index)} (line ${entry.lineIndex}, "${vo.slice(0, 50)}"): ${choice.reason}`;
}

/** The shot that carries a timeline's QR card: qr.shotIndex, or the last shot (every 1.4.0 timeline). */
export function qrShotIndexOf(timeline) {
  return timeline.qr?.shotIndex ?? timeline.shots.length - 1;
}
