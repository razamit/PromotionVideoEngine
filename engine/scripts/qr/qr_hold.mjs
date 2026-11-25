// When the QR card is on screen, and how much the last shot is held so the
// code can be scanned. Pure frame arithmetic, no files.
//
// The card shows for the whole last shot. It takes QR_ENTER_FRAMES to come
// in (src/overlay/QrCard.tsx); only the frames after that, fully opaque and
// full size, count toward minSeconds. When the last shot is shorter, the
// short grows by the missing frames and the scene's last frame is repeated
// over them (Short.tsx freezes it). A last shot that is already long enough
// is left alone, so the short never grows without need.

export const QR_ENTER_FRAMES = 5;

/**
 * @param {{ lastShotStartSec: number, lastShotEndSec: number, durationInFrames: number, fps: number, minSeconds: number, enterFrames?: number }} input
 * @returns {{ startFrame: number, fullFrom: number, endFrame: number, holdFrames: number, durationInFrames: number, lastShotEndSec: number }}
 *   startFrame: the card appears; fullFrom: first fully visible frame; endFrame: one past the last frame;
 *   holdFrames: frames at the end that repeat the scene's last original frame (0 when nothing was added).
 */
export function planQrWindow({ lastShotStartSec, lastShotEndSec, durationInFrames, fps, minSeconds, enterFrames = QR_ENTER_FRAMES }) {
  const startFrame = Math.round(lastShotStartSec * fps);
  const fullFrom = startFrame + enterFrames;
  const neededFrames = Math.ceil(minSeconds * fps - 1e-9);
  if (durationInFrames - fullFrom >= neededFrames) {
    // The short's length is rounded up and the shot's end to the nearest frame, which can
    // leave the final frame with no scene (black behind the card); the shot then runs to it.
    const reachesEnd = Math.round(lastShotEndSec * fps) >= durationInFrames;
    return { startFrame, fullFrom, endFrame: durationInFrames, holdFrames: 0, durationInFrames, lastShotEndSec: reachesEnd ? lastShotEndSec : durationInFrames / fps };
  }
  const grown = fullFrom + neededFrames;
  // The scene's own frames end where its Sequence ends (Short.tsx rounds the shot's end).
  const sceneEndFrame = Math.round(lastShotEndSec * fps);
  return { startFrame, fullFrom, endFrame: grown, holdFrames: grown - sceneEndFrame, durationInFrames: grown, lastShotEndSec: grown / fps };
}

/** The time to sample for the decode check: the middle of the fully visible window, inside a frame. */
export function qrCheckSeconds(qr, fps) {
  const fullFrom = Math.round(qr.startSec * fps) + qr.enterFrames;
  const endFrame = Math.round(qr.endSec * fps);
  const middle = Math.floor((fullFrom + endFrame) / 2);
  return (middle + 0.5) / fps;
}
