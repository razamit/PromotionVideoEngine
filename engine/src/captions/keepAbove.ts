// A line that captions keep above for a stretch of time: in a short with a
// QR end card, the top of the card's reserve (qrGeometry.ts) while the card
// is up, from the frame it appears to the cut out of its shot. Short.tsx
// passes it only when the timeline has a qr, so captions in a short without
// one, before the card and after it, never move.

/** `untilSec`: the card's end; undefined keeps the limit to the end of the short. */
export type CaptionKeepAbove = { fromSec: number; untilSec?: number; bottomPx: number };

/** The bottom limit in px at time t, or undefined when captions sit where they always do. */
export function keepAboveAt(keepAbove: CaptionKeepAbove | undefined, t: number): number | undefined {
  if (!keepAbove || t < keepAbove.fromSec) return undefined;
  if (keepAbove.untilSec !== undefined && t >= keepAbove.untilSec) return undefined;
  return keepAbove.bottomPx;
}
