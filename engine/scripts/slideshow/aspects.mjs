// Output shapes a slideshow can be rendered in, and the margins TikTok's own
// UI covers on each. Sources and how sure each number is:
// skills/cartoon-shorts/references/slideshow-research.md, sections 2 and 3.
// 9:16 fills the feed. The shorter shapes are the ones TikTok Studio's
// Photos tab lists (3:4, 4:3, 16:9) plus 4:5 and 1:1; they sit between bars,
// so their margins are small and still unverified on a phone.
// Every margin can be overridden per product or per slideshow
// (output.safeMargins), so none of this is a fixed rule of the engine.

const FULL_SCREEN_MARGINS = { top: 0.12, bottom: 0.25, left: 0.06, right: 0.15 };
const BARRED_MARGINS = { top: 0.05, bottom: 0.08, left: 0.05, right: 0.05 };

export const ASPECTS = {
  "9:16": { width: 1080, height: 1920, safeMargins: FULL_SCREEN_MARGINS },
  "3:4": { width: 1080, height: 1440, safeMargins: BARRED_MARGINS },
  "4:5": { width: 1080, height: 1350, safeMargins: BARRED_MARGINS },
  "1:1": { width: 1080, height: 1080, safeMargins: BARRED_MARGINS },
  "4:3": { width: 1440, height: 1080, safeMargins: BARRED_MARGINS },
  "16:9": { width: 1920, height: 1080, safeMargins: BARRED_MARGINS },
};

// What the brief may ask for -> what the renderer writes. "jpg" and "jpeg"
// are the same encoding under two file extensions; TikTok lists both.
export const IMAGE_FORMATS = {
  jpeg: { imageFormat: "jpeg", extension: "jpg" },
  jpg: { imageFormat: "jpeg", extension: "jpg" },
  png: { imageFormat: "png", extension: "png" },
  webp: { imageFormat: "webp", extension: "webp" },
};

export const ENGINE_OUTPUT_DEFAULTS = { aspect: "9:16", format: "jpeg", text: "baked", jpegQuality: 92 };

/** The Content Posting API's per-image limit, the stricter of TikTok's two published limits. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** TikTok's own ceiling for photos in one post. */
export const MAX_SLIDES_PER_POST = 35;

/** The range practitioners report people finish; outside it lint warns. */
export const RECOMMENDED_SLIDE_RANGE = { min: 4, max: 8 };
