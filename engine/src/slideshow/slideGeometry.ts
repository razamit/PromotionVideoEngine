import type { DeckOutput } from "./deckTypes";

// Where things go on a slide of any shape. Layouts place everything inside
// the safe box (the part of the frame TikTok's own buttons, caption and dots
// do not cover) and size type in design units, so one layout serves 9:16,
// 3:4 and the landscape shapes.

export type PixelBox = { left: number; top: number; width: number; height: number };

/** The readable part of the frame, from the deck's margins. */
export function safeBoxOf(output: DeckOutput): PixelBox {
  const { width, height, safeMargins } = output;
  return {
    left: width * safeMargins.left,
    top: height * safeMargins.top,
    width: width * (1 - safeMargins.left - safeMargins.right),
    height: height * (1 - safeMargins.top - safeMargins.bottom),
  };
}

/** 1 on a 1080 px wide portrait slide; type and gaps scale with the shorter side. */
export function designUnit(output: DeckOutput): number {
  return Math.min(output.width, output.height) / 1080;
}

/** Width of an average glyph of the bold face, outline included, as a share of the font size. */
const AVERAGE_GLYPH_WIDTH = 0.56;
/** Lines never fill exactly; leave this much room for ragged wrapping. */
const WRAP_SLACK = 1.12;

/** The largest font size at which `text` wraps into `maxLines` lines of `boxWidth`, between the two limits. */
export function fitFontSize(text: string, boxWidth: number, maxLines: number, maxSize: number, minSize: number): number {
  const characters = Math.max(1, text.length);
  const longestWord = Math.max(1, ...text.split(/\s+/).map((word) => word.length));
  const sizeForLines = (boxWidth * maxLines) / (AVERAGE_GLYPH_WIDTH * characters * WRAP_SLACK);
  const sizeForLongestWord = boxWidth / (AVERAGE_GLYPH_WIDTH * longestWord);
  return Math.max(minSize, Math.min(maxSize, sizeForLines, sizeForLongestWord));
}

/** Line height of slide text, as a multiple of the font size (OutlinedText uses the same). */
export const SLIDE_LINE_HEIGHT = 1.16;
const FONT_SIZE_STEP = 2;

/** The largest font size at which `text` fits a box of this width and height, between the two limits. */
export function fitFontSizeInBox(text: string, boxWidth: number, boxHeight: number, maxSize: number, minSize: number): number {
  const longestWord = Math.max(1, ...text.split(/\s+/).map((word) => word.length));
  for (let size = maxSize; size > minSize; size -= FONT_SIZE_STEP) {
    const charactersPerLine = boxWidth / (AVERAGE_GLYPH_WIDTH * size);
    const lines = Math.ceil((text.length * WRAP_SLACK) / charactersPerLine);
    if (lines * size * SLIDE_LINE_HEIGHT <= boxHeight && longestWord <= charactersPerLine) return size;
  }
  return minSize;
}

/** The largest size with the given width / height ratio that fits the area. */
export function containSize(areaWidth: number, areaHeight: number, widthOverHeight: number) {
  const width = Math.min(areaWidth, areaHeight * widthOverHeight);
  return { width, height: width / widthOverHeight };
}
