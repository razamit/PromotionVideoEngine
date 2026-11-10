// Cartoon palette. Saturated, flat, one ink colour for every outline.
// Brand colours are only for the app reveal and end card; the world itself
// stays in the cartoon palette so the real app UI reads as "the real thing".

export const INK = "#141414";
export const OUTLINE = 9; // px at 1080 wide; everything shares it

export const palette = {
  ink: INK,
  paper: "#FFFFFF",
  skin: ["#FFE3C4", "#F7C99B", "#D99A6C", "#9C6644"],
  shirts: ["#5B9BFF", "#2ED3B7", "#FFB547", "#B98CFF", "#FF7A9C", "#7BD957"],
  hair: ["#1E1E24", "#5A3B26", "#C9C9C9", "#E8B04A", "#B5482E", "#3B2A6E"],
  wallCool: "#4C86F7",
  wallMint: "#8FD3B6",
  wallWarm: "#F3B562",
  floorBlue: "#2E5BE0",
  floorWood: "#B9763F",
  sunPatch: "#FFE066",
  alarmRed: "#FF3B30",
  alarmYellow: "#FFD60A",
  nightBlue: "#1B2A6B",
  nightPurple: "#5B3FA8",
  /** Face extras drawn by characters/Face.tsx. */
  face: { blush: "#FF8FA3", sweat: "#7FD3FF", tear: "#7FD3FF", anger: "#FF3B30" },
};

// From lib/theme/app_color_tokens.dart. Swap for another app's tokens.
export const brand = {
  accent: "#0E7C70",
  accentBright: "#2FB9A6",
  ink: "#13211E",
  background: "#FBFBFA",
};
