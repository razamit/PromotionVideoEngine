import type { FaceSpec } from "./Face";

// Named expressions for comedy beats. A Bean's `mood` picks one; a `face`
// prop on top overrides single fields. The first seven names match the
// moods episode 1 defined in its own cast.tsx, so old scenes keep compiling.

export type Mood =
  | "calm"
  | "tired"
  | "sweat"
  | "angry"
  | "panic"
  | "happy"
  | "smug"
  | "panicked"
  | "shocked"
  | "sad"
  | "sideEye"
  | "furious"
  | "bored";

export const MOOD_FACES: Record<Mood, FaceSpec> = {
  calm: { eyes: "dots", mouth: "smile" },
  tired: { eyes: "tired", mouth: "flat" },
  sweat: { eyes: "wide", mouth: "flat", brows: "worried", sweat: true },
  angry: { eyes: "dots", mouth: "frown", brows: "angry" },
  panic: { eyes: "wide", mouth: "scream", brows: "worried", sweat: true },
  happy: { eyes: "happy", mouth: "grin" },
  smug: { eyes: "half", mouth: "smirk", brows: "skeptic" },
  panicked: { eyes: "pin", mouth: "scream", brows: "worried", sweat: true },
  shocked: { eyes: "pin", mouth: "o", brows: "raised" },
  sad: { eyes: "dots", mouth: "wobble", brows: "worried", tear: true },
  sideEye: { eyes: "half", mouth: "flat", brows: "skeptic", look: "right" },
  furious: { eyes: "dots", mouth: "gritted", brows: "angry", anger: true },
  bored: { eyes: "half", mouth: "flat" },
};

/** The face for a mood with `face` fields laid over it. */
export function faceFor(mood: Mood | undefined, face: FaceSpec | undefined): FaceSpec {
  return { ...(mood ? MOOD_FACES[mood] : {}), ...(face ?? {}) };
}
