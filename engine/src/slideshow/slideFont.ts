import { loadFont } from "@remotion/google-fonts/TikTokSans";

// TikTok Sans is TikTok's own typeface, published under the Open Font
// License. Slide text is set in it so baked text reads like text typed in the
// app instead of a designed card.

export const slideFontFamily = loadFont("normal", { weights: ["500", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const SLIDE_FONT_WEIGHT = { line: 800, note: 500 } as const;
