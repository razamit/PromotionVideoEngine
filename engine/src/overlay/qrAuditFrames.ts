import type { QrSpec, TimedWord } from "../timeline/types";

// Which frames of the QR card's Sequence the text audit (qrTextAudit.ts)
// looks at. Pure arithmetic, so it can be checked without rendering.

/**
 * Local frames of the card's Sequence that the text audit looks at: the
 * middle and the last frame, and the middle of the first word spoken while
 * the card is up (captions of a QR shot with a spoken line).
 */
export function qrAuditFrames(qr: QrSpec, words: TimedWord[], fps: number, windowFrames: number): number[] {
  const from = Math.round(qr.startSec * fps);
  const frames = [Math.floor((qr.enterFrames + windowFrames) / 2), windowFrames - 1];
  const spoken = words.find((word) => word.end > qr.startSec && word.start < qr.endSec);
  if (spoken) {
    const middle = (Math.max(spoken.start, qr.startSec) + Math.min(spoken.end, qr.endSec)) / 2;
    frames.push(Math.min(windowFrames - 1, Math.max(0, Math.round(middle * fps) - from)));
  }
  return frames;
}
