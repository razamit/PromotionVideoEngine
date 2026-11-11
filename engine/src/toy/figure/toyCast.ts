// What a toy figure looks like and how its face is set. A cast member is one
// ToyCast object kept in the project's scenes, so the character is the same
// in every shot and every episode: it is code, it cannot drift.

export type ToyHairStyle = "short" | "bun" | "long" | "beanie" | "bald";

export type ToyCast = {
  skin: string;
  hair: ToyHairStyle;
  /** Hair colour, or the wool colour of a beanie. */
  hairColor: string;
  /** hoodie: long sleeves, hood, front pocket. tee: short sleeves. */
  top: "hoodie" | "tee";
  topColor: string;
  legColor: string;
  shoeColor: string;
};

export const toySkins = ["#F2C9A4", "#D9A273", "#B67A4E", "#8A5A3C", "#5E3B28"];

/** "You": the default lead. Copy and change it per series. */
export const defaultCast: ToyCast = {
  skin: toySkins[2], hair: "short", hairColor: "#1F1B24",
  top: "hoodie", topColor: "#3F4A8A", legColor: "#23263A", shoeColor: "#F26A2E",
};

export type ToyFace = {
  /** open, wide (shock), closed. Blinks are added on top. */
  eyes: "open" | "wide" | "closed";
  /** Upper eyelid: 0 none, 0.5 half-lidded (tired), 1 shut. */
  lid: number;
  mouth: "flat" | "smile" | "frown" | "open" | "none";
  brows: "none" | "worried" | "angry" | "raised";
};

export type ToyFaceMood = "neutral" | "tired" | "asleep" | "happy" | "shocked" | "sad" | "determined";

export const toyFaces: Record<ToyFaceMood, ToyFace> = {
  neutral: { eyes: "open", lid: 0, mouth: "flat", brows: "none" },
  tired: { eyes: "open", lid: 0.5, mouth: "flat", brows: "none" },
  asleep: { eyes: "closed", lid: 0, mouth: "flat", brows: "none" },
  happy: { eyes: "open", lid: 0, mouth: "smile", brows: "none" },
  shocked: { eyes: "wide", lid: 0, mouth: "open", brows: "raised" },
  sad: { eyes: "open", lid: 0.3, mouth: "frown", brows: "worried" },
  determined: { eyes: "open", lid: 0.15, mouth: "flat", brows: "angry" },
};
