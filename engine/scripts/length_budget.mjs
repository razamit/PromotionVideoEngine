// The length a short is written to, and what follows from it.
//
// Each style has a default length, taken from its reference video: bean
// 50-60 s, toy 20-30 s. script.json "targetSeconds" asks for another length.
// The style keeps its own pace and shot rhythm at any length, so what scales
// is the word count and how often a scene or an angle may come back.

const STYLE_DEFAULTS = {
  bean: { minSeconds: 45, maxSeconds: 62, aim: "50-60s", typicalSeconds: 55, minWords: 185, maxWords: 215, minPaceWpm: 205, maxPaceWpm: 225 },
  toy: { minSeconds: 18, maxSeconds: 35, aim: "20-30s", typicalSeconds: 25, minWords: 50, maxWords: 70, minPaceWpm: 130, maxPaceWpm: 160 },
};

/** A requested length is met when the short lands within this share of it. */
const TARGET_TOLERANCE = 0.15;

/** YouTube Shorts takes up to 3 minutes (checked 2026-11-11). Other platforms differ; publishing.md. */
export const LONGEST_SHORT_SECONDS = 180;

const roundToTenth = (seconds) => Math.round(seconds * 10) / 10;

function requestedSeconds(script) {
  const target = script.targetSeconds;
  if (target === undefined || target === null) return null;
  if (typeof target !== "number" || !Number.isFinite(target) || target <= 0) {
    throw new Error(`script.json "targetSeconds" must be a number of seconds above 0, got ${JSON.stringify(target)}`);
  }
  return target;
}

/**
 * The window a short's length should land in, its word budget, and `scale`:
 * how long it is next to the style's usual length (1 when none was asked for).
 */
export function lengthBudget(script) {
  const style = STYLE_DEFAULTS[script.style === "toy" ? "toy" : "bean"];
  const target = requestedSeconds(script);
  if (target === null) {
    const { minSeconds, maxSeconds, aim, minWords, maxWords } = style;
    return { requested: false, targetSeconds: null, minSeconds, maxSeconds, aim, minWords, maxWords, scale: 1 };
  }
  return {
    requested: true,
    targetSeconds: target,
    minSeconds: roundToTenth(target * (1 - TARGET_TOLERANCE)),
    maxSeconds: roundToTenth(target * (1 + TARGET_TOLERANCE)),
    aim: `${target}s`,
    minWords: Math.round((target * style.minPaceWpm) / 60),
    maxWords: Math.round((target * style.maxPaceWpm) / 60),
    scale: target / style.typicalSeconds,
  };
}

/** A repeat limit set for the style's usual length, raised for a longer short and never lowered. */
export function scaledLimit(limit, budget) {
  return Math.max(limit, Math.round(limit * budget.scale));
}
