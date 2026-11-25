import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { FRAME, safeBox } from "../layout/safeZone";
import type { QrReserve } from "./qrReserve";

// Puts a centred column of an end card into the band between the top of the
// safe zone and the QR card. Text in the column wraps at the safe box's
// width; the column is measured as drawn (after the fonts load) and shrunk
// when it is taller than the band, or when something that cannot wrap is
// wider than the safe box, so nothing runs off the frame. Shrinking for
// height stops at FIT_ABOVE_QR_MIN_SCALE: below that the smallest end-card
// text would be too small to read, so the column is drawn at the floor,
// grows up from the card instead of onto it, and a warning names the end
// card. Shrinking for width has no floor: text inside the frame comes first.

/**
 * 0.8 keeps BrandEndCard's 32 px note at about 26 px, the size of the
 * smallest text people read anywhere else in the engine (FloatingPhone's note).
 */
export const FIT_ABOVE_QR_MIN_SCALE = 0.8;

type Size = { width: number; height: number };

/** The widest column centred on the frame that stays inside the safe box. */
export function centredSafeWidth(): number {
  const box = safeBox();
  return 2 * Math.min(FRAME.width / 2 - box.left, box.right - FRAME.width / 2);
}

/** The element's laid-out size (transforms do not change it), measured again once the fonts are in. */
function useNaturalSize(ref: React.RefObject<HTMLDivElement | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null);
  const [handle] = useState(() => delayRender("FitAboveQr: measuring the column after the fonts load"));
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const next = { width: element.offsetWidth, height: element.offsetHeight };
    setSize((previous) => (previous && previous.width === next.width && previous.height === next.height ? previous : next));
  });
  useLayoutEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      const element = ref.current;
      if (live && element) setSize({ width: element.offsetWidth, height: element.offsetHeight });
      continueRender(handle);
    });
    return () => {
      live = false;
      continueRender(handle);
    };
  }, [ref, handle]);
  return size;
}

function useFloorWarning(name: string, needed: number, minScale: number) {
  useEffect(() => {
    if (needed >= minScale) return;
    console.warn(`[qr-card] ${name}: the content is too big to sit above the QR card at a readable size (it needs scale ${needed.toFixed(2)}, the floor is ${minScale}); it is drawn smaller than is easy to read, or runs up past the safe zone. Shorten its text.`);
  }, [name, needed, minScale]);
}

/** Height ratio floored at minScale, then never wider than maxWidth. */
export function fitScale(size: Size | null, bandHeight: number, maxWidth: number, minScale: number) {
  if (!size) return { scale: 1, needed: 1, atHeightFloor: false };
  const byHeight = bandHeight / Math.max(1, size.height);
  const byWidth = maxWidth / Math.max(1, size.width);
  const needed = Math.min(1, byHeight, byWidth);
  const scale = Math.min(1, byWidth, Math.max(minScale, byHeight));
  // Still taller than the band at the floor: it grows up from the card, never onto it.
  return { scale, needed, atHeightFloor: size.height * scale > bandHeight + 0.5 };
}

export function FitAboveQr({ reserve, name, top = Math.round(safeBox().top), maxWidth = centredSafeWidth(), minScale = FIT_ABOVE_QR_MIN_SCALE, style, children }: {
  reserve: QrReserve;
  /** Named in the warning when the column hits the scale floor, e.g. "BrandEndCard". */
  name: string;
  top?: number;
  /** Widest the column may be drawn; default: centred on the frame inside the safe box. */
  maxWidth?: number;
  minScale?: number;
  /** Extra style for the band, e.g. side padding that shifts the column's centre. */
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const size = useNaturalSize(contentRef);
  const height = Math.max(0, reserve.top - top);
  const { scale, needed, atHeightFloor } = fitScale(size, height, maxWidth, minScale);
  useFloorWarning(name, needed, minScale);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, height, display: "flex", alignItems: atHeightFloor ? "flex-end" : "center", justifyContent: "center", ...style }}>
      <div ref={contentRef} style={{ maxWidth, transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: atHeightFloor ? "center bottom" : "center center", flexShrink: 0 }}>{children}</div>
    </div>
  );
}
