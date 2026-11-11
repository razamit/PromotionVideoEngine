import type { Vec3 } from "../shapes";

// The toy style is mostly light: one soft key with shadows, a two-colour
// sky fill, fog that pulls the far wall toward the sky colour, and a dark
// vignette. A "mood" is one preset of those. Colour tells the story the same
// way it does in the bean style: cold and dim while the problem stands,
// warm once the app has turned it.

export type ToyLook = {
  /** CSS background behind the canvas: the sky, or the dark beyond a room. */
  backdrop: string;
  /** Sky light from above and bounce from below. */
  skyColor: string;
  groundColor: string;
  skyStrength: number;
  /** The one shadow-casting light: the moon, the sun, a ceiling panel. */
  keyColor: string;
  keyStrength: number;
  keyFrom: Vec3;
  /** A soft shadowless light from the camera side so faces never go black. */
  fillColor: string;
  fillStrength: number;
  /** Distance fog; near and far in world units from the camera. */
  fogColor: string;
  fogNear: number;
  fogFar: number;
  /** 0 none, 1 heavy darkening toward the corners. */
  vignette: number;
  /** Colour of the vignette; near-black with a tint of the mood. */
  vignetteColor: string;
  exposure: number;
};

export type ToyMood = "night" | "dawn" | "day" | "dusk" | "lamp" | "terminal";

export const toyLooks: Record<ToyMood, ToyLook> = {
  /** Before sunrise: deep blue room, moonlight from the window side. Pair with a warm practical (a lamp, a clock). */
  night: {
    backdrop: "linear-gradient(180deg, #0B1238 0%, #141C52 60%, #1B2260 100%)",
    skyColor: "#7C86E0", groundColor: "#3A2A55", skyStrength: 1.35,
    keyColor: "#9DB0FF", keyStrength: 2.0, keyFrom: [-3.5, 5, 3],
    fillColor: "#C9B8FF", fillStrength: 0.85,
    fogColor: "#141C52", fogNear: 7, fogFar: 22, vignette: 0.7, vignetteColor: "8, 10, 40", exposure: 1.15,
  },
  /** Sunrise outdoors: low orange sun, long shadows, peach sky. The payoff light. */
  dawn: {
    backdrop: "linear-gradient(180deg, #F6B26B 0%, #FAD3A0 45%, #FCE6C8 100%)",
    skyColor: "#FFD9A8", groundColor: "#C97B4A", skyStrength: 1.5,
    keyColor: "#FFB36B", keyStrength: 3.4, keyFrom: [5, 3.2, 3.5],
    fillColor: "#FFE2C4", fillStrength: 0.7,
    fogColor: "#F9CE9C", fogNear: 9, fogFar: 30, vignette: 0.35, vignetteColor: "120, 50, 10", exposure: 1.0,
  },
  /** Plain daylight, for neutral beats. */
  day: {
    backdrop: "linear-gradient(180deg, #8EC9FF 0%, #CFE9FF 70%, #EAF6FF 100%)",
    skyColor: "#DCEBFF", groundColor: "#9AA7B8", skyStrength: 1.7,
    keyColor: "#FFF3DC", keyStrength: 3.0, keyFrom: [4, 6, 4],
    fillColor: "#FFFFFF", fillStrength: 0.6,
    fogColor: "#CFE9FF", fogNear: 12, fogFar: 40, vignette: 0.25, vignetteColor: "20, 30, 60", exposure: 1.0,
  },
  /** After sunset: purple sky, pink rim light. */
  dusk: {
    backdrop: "linear-gradient(180deg, #2B1E5C 0%, #7B3F8C 55%, #E0787A 100%)",
    skyColor: "#9C7BE0", groundColor: "#3A2350", skyStrength: 1.2,
    keyColor: "#FF9E8A", keyStrength: 2.2, keyFrom: [-5, 2.6, 2],
    fillColor: "#FFC2D0", fillStrength: 0.7,
    fogColor: "#6B3C80", fogNear: 8, fogFar: 26, vignette: 0.6, vignetteColor: "25, 8, 45", exposure: 1.0,
  },
  /** A warm interior lit by its own lamps: evening on the couch. */
  lamp: {
    backdrop: "linear-gradient(180deg, #2A1A12 0%, #3A2418 100%)",
    skyColor: "#FFC48A", groundColor: "#4A2A1A", skyStrength: 0.9,
    keyColor: "#FFD2A0", keyStrength: 1.8, keyFrom: [2.5, 4.5, 3.5],
    fillColor: "#FFD9B0", fillStrength: 0.7,
    fogColor: "#3A2418", fogNear: 8, fogFar: 24, vignette: 0.7, vignetteColor: "30, 12, 4", exposure: 1.0,
  },
  /** A big public interior under ceiling panels: an airport gate, an office floor. */
  terminal: {
    backdrop: "linear-gradient(180deg, #C9CEDA 0%, #E6E8EE 100%)",
    skyColor: "#F2F4FA", groundColor: "#A8A39A", skyStrength: 1.6,
    keyColor: "#FFF6E6", keyStrength: 2.4, keyFrom: [1.5, 7, 3],
    fillColor: "#FFFFFF", fillStrength: 0.6,
    fogColor: "#D9DCE4", fogNear: 10, fogFar: 34, vignette: 0.3, vignetteColor: "20, 22, 30", exposure: 1.0,
  },
};

export function resolveLook(mood: ToyMood, overrides?: Partial<ToyLook>): ToyLook {
  return { ...toyLooks[mood], ...(overrides ?? {}) };
}
