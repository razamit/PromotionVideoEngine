import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// The two sans faces of the toy overlays: a tall condensed display face for
// stamps, readouts and the end card, and Inter for small labels. Captions
// use the serif in captions/SerifCaptions.tsx.

export const displayFont = loadAnton("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const labelFont = loadInter("normal", { weights: ["500", "700", "800"], subsets: ["latin"] }).fontFamily;

/** 0 -> 1 with a quick ease-out, for overlay entrances that should not bounce. */
export function easeIn(frame: number, frames = 8) {
  const t = Math.min(1, Math.max(0, frame / frames));
  return 1 - Math.pow(1 - t, 3);
}
