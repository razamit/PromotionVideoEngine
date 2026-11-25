// A line that captions keep above from a given time on: in a short with a
// QR end card, the top of the card's reserve (qrGeometry.ts) from the frame
// the card appears. Short.tsx passes it only when the timeline has a qr, so
// captions in a short without one, and before the card, never move.

export type CaptionKeepAbove = { fromSec: number; bottomPx: number };

/** The bottom limit in px at time t, or undefined when captions sit where they always do. */
export function keepAboveAt(keepAbove: CaptionKeepAbove | undefined, t: number): number | undefined {
  return keepAbove && t >= keepAbove.fromSec ? keepAbove.bottomPx : undefined;
}
