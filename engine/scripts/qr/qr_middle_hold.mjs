// The hold for a QR shot that is not the last shot (qr_shot.mjs chose an
// end card with a loop line after it). Pure: it works on build_timeline's
// shots, words and lines before the timeline is written.
//
// When the shot is too short for the code to be scanned, the missing frames
// go in at its cut: the shot gets longer (Short.tsx freezes its last scene
// frame over them), and every later shot, line and word moves later by the
// same amount. The voice is not cut: the gap after the QR shot's line grows
// by the hold in vo.wav (build_timeline.mjs), so the next line starts at its
// new time. Sound effects are placed from the shots at render time and
// follow them; the music bed plays on under the hold.
//
// A hold needs the QR shot to be the last shot of its line, or the gap would
// land in the middle of a sentence. The automatic choice only picks such a
// shot; a shot marked "qr": true that is not is an error, unless it needs no
// hold.

import { planMidQrWindow } from "./qr_hold.mjs";

/** Why a hold cannot go after this shot, or null when it can. */
function holdProblem(shot, holdFrames, endsLine) {
  if (holdFrames === 0 || endsLine) return null;
  return `the QR shot #${shot.index} (${shot.scene}) needs ${holdFrames} more frames for the code, but it is not the last shot of its line, so the hold would cut into the voice. Give it more weight, put it on its own line, or mark the line's last shot "qr": true instead`;
}

/**
 * Moves everything after the QR shot later by `holdFrames`: the QR shot's
 * end, every later shot, and the words and lines after the QR shot's line.
 * Mutates the arrays it is given.
 */
export function shiftAfterQrShot({ shots, words, lines }, qrShotIndex, holdFrames, fps) {
  if (holdFrames === 0) return 0;
  const seconds = holdFrames / fps;
  const qrShot = shots[qrShotIndex];
  qrShot.end += seconds;
  for (const shot of shots.slice(qrShotIndex + 1)) {
    shot.start += seconds;
    shot.end += seconds;
  }
  for (const word of words) {
    if (word.line <= qrShot.lineIndex) continue;
    word.start += seconds;
    word.end += seconds;
  }
  for (const line of lines) {
    if (line.index <= qrShot.lineIndex) continue;
    line.start += seconds;
    line.end += seconds;
  }
  return seconds;
}

/**
 * Plans the window of a QR shot that is not the last, applies the hold and
 * returns the window, the new length, and where vo.wav gets the extra gap.
 * @param {{ shots: any[], words: any[], lines: any[], fps: number, durationInFrames: number }} laidOut
 * @param {{ index: number, endsLine: boolean }} choice from qr_shot.mjs
 * @returns {{ window: { startFrame: number, fullFrom: number, endFrame: number, holdFrames: number }, durationInFrames: number, voHold: { lineIndex: number, seconds: number } | null } | { error: string }}
 */
export function holdInMiddle(laidOut, choice, minSeconds) {
  const { shots, fps, durationInFrames } = laidOut;
  const shot = shots[choice.index];
  const window = planMidQrWindow({ shotStartSec: shot.start, shotEndSec: shot.end, fps, minSeconds });
  const problem = holdProblem(shot, window.holdFrames, choice.endsLine);
  if (problem) return { error: problem };
  const seconds = shiftAfterQrShot(laidOut, choice.index, window.holdFrames, fps);
  const voHold = seconds > 0 ? { lineIndex: shot.lineIndex, seconds } : null;
  return { window, durationInFrames: durationInFrames + window.holdFrames, voHold };
}
