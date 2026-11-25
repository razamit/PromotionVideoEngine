import { useLayoutEffect } from "react";
import { continueRender, delayRender, getRemotionEnvironment, Internals, useCurrentFrame } from "remotion";
import type { Rect } from "../layout/qrGeometry";

// Render-time check for end scenes the engine cannot rearrange (a short's
// own scenes): on two frames of the QR window it looks at every piece of
// visible text on the page and warns when one intersects the QR card, naming
// the text. The engine's end cards move out of the way themselves
// (useQrReserve); this is the net for the rest. It only runs while
// rendering (render, still), never in the Studio preview, and only on the
// frames it is given, so it costs next to nothing.
// Like textBoxAudit.ts it measures two animation frames after layout.

const SKIPPED_TAGS = new Set(["STYLE", "SCRIPT", "TITLE", "NOSCRIPT"]);

type Overlap = { text: string; box: DOMRect };

const intersects = (box: DOMRect, card: Rect) => box.left < card.right && box.right > card.left && box.top < card.bottom && box.bottom > card.top;

function isVisible(element: Element): boolean {
  const check = (element as Element & { checkVisibility?: (options: object) => boolean }).checkVisibility;
  return check ? check.call(element, { opacityProperty: true, visibilityProperty: true }) : true;
}

/** Text outside the QR card (marked data-qr-card) whose drawn box touches the card. */
export function textOverlappingCard(card: Rect, root: Element = document.body): Overlap[] {
  const overlaps: Overlap[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.replace(/\s+/g, " ").trim();
    const parent = node.parentElement;
    if (!text || !parent || SKIPPED_TAGS.has(parent.tagName) || parent.closest("[data-qr-card]") || !isVisible(parent)) continue;
    range.selectNodeContents(node);
    const box = range.getBoundingClientRect();
    if (box.width > 0 && box.height > 0 && intersects(box, card)) overlaps.push({ text: text.slice(0, 60), box });
  }
  return overlaps;
}

/** Audits the page on the given local frames of the QR card's Sequence. */
export function useQrTextAudit(card: Rect, auditFrames: number[]) {
  const frame = useCurrentFrame();
  const absolute = Internals.useTimelinePosition();
  useLayoutEffect(() => {
    if (!getRemotionEnvironment().isRendering || !auditFrames.includes(frame)) return;
    const handle = delayRender(`qr card text audit, frame ${absolute}`);
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        for (const { text, box } of textOverlappingCard(card)) {
          const r = Math.round;
          console.warn(`[qr-card] text "${text}" overlaps the QR card at frame ${absolute}: text x ${r(box.left)}..${r(box.right)}, y ${r(box.top)}..${r(box.bottom)}; card x ${card.left}..${card.right}, y ${card.top}..${card.bottom}. Move it above the card (useQrReserve).`);
        }
        continueRender(handle);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      continueRender(handle);
    };
  });
}
