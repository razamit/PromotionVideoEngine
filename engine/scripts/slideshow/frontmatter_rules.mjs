// What the YAML in a product brief and in a slideshow.md must look like, and
// a small checker that applies those rules. A wrong or missing setting is
// reported with its path (cta.lastSlide), the same way a JSON schema would.

import { ASPECTS, IMAGE_FORMATS } from "./aspects.mjs";

const isText = (value) => typeof value === "string" && value.trim() !== "";
const isMap = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const TYPE_CHECKS = {
  text: isText,
  number: (value) => typeof value === "number" && Number.isFinite(value),
  yesNo: (value) => typeof value === "boolean",
  map: isMap,
  list: (value) => Array.isArray(value) && value.length > 0,
  textList: (value) => Array.isArray(value) && value.every(isText),
};

const TYPE_NAMES = {
  text: "a line of text", number: "a number", yesNo: "true or false",
  map: "a set of key: value settings", list: "a list with at least one item", textList: "a list of text lines",
};

const ASPECT_NAMES = Object.keys(ASPECTS);
const FORMAT_NAMES = Object.keys(IMAGE_FORMATS);

export const BRIEF_RULES = [
  { path: "product.name", type: "text", required: true },
  { path: "product.descriptor", type: "text" },
  { path: "product.icon", type: "text" },
  { path: "claims.source", type: "text" },
  { path: "claims.paidTierPhrase", type: "text" },
  { path: "claims.healthClaims", type: "yesNo" },
  { path: "claims.aiGeneratedImages", type: "yesNo" },
  { path: "cta.lastSlide", type: "text", required: true },
  { path: "cta.lastSlideLine", type: "text" },
  { path: "cta.searchPhrase", type: "text" },
  { path: "cta.bioLink", type: "text" },
  { path: "cta.pinnedCommentPlaceholders", type: "textList" },
  { path: "copyRules.tone", type: "text", required: true },
  { path: "copyRules.use", type: "textList" },
  { path: "copyRules.avoid", type: "textList" },
  { path: "screenshots.dirs", type: "textList", required: true },
  { path: "shorts.dirs", type: "textList" },
  { path: "cast", type: "map" },
  { path: "hashtags.always", type: "textList" },
  { path: "output.aspect", oneOf: ASPECT_NAMES },
  { path: "output.format", oneOf: FORMAT_NAMES },
  { path: "output.text", oneOf: ["baked", "native"] },
  { path: "output.safeMargins", type: "map" },
  { path: "style.background", type: "text" },
  { path: "style.text", type: "text" },
  { path: "style.outline", type: "text" },
  { path: "test.viewsToRepeat", type: "number" },
];

export const BRIEF_SECTIONS = ["product", "claims", "cta", "copyRules", "screenshots", "shorts", "cast", "hashtags", "output", "style", "test"];

export const DECK_RULES = [
  { path: "format", type: "text", required: true },
  { path: "topic", type: "text", required: true },
  { path: "keyword", type: "text" },
  { path: "brief", type: "text" },
  { path: "cover", type: "number" },
  { path: "sound.mood", type: "text" },
  { path: "sound.searchHint", type: "text" },
  { path: "output.aspect", oneOf: ASPECT_NAMES },
  { path: "output.format", oneOf: FORMAT_NAMES },
  { path: "output.text", oneOf: ["baked", "native"] },
  { path: "output.safeMargins", type: "map" },
  { path: "backdrop", type: "text" },
  { path: "fromShort", type: "text" },
  { path: "slides", type: "list", required: true },
];

export const DECK_SECTIONS = ["format", "topic", "keyword", "brief", "cover", "sound", "output", "backdrop", "fromShort", "slides"];

export const FORMAT_RULES = [
  { path: "name", type: "text", required: true },
  { path: "summary", type: "text", required: true },
  { path: "slides.min", type: "number", required: true },
  { path: "slides.max", type: "number", required: true },
  { path: "productName", oneOf: ["last-only", "product-slides"], required: true },
  { path: "roles", type: "list", required: true },
  { path: "starter", type: "textList", required: true },
];

export function valueAt(data, path) {
  return path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), data);
}

function checkOneRule(data, rule, label) {
  const value = valueAt(data, rule.path);
  if (value === undefined || value === null) {
    return rule.required ? `${label}: ${rule.path} is missing` : null;
  }
  if (rule.oneOf && !rule.oneOf.includes(String(value))) {
    return `${label}: ${rule.path} is "${value}", expected one of ${rule.oneOf.join(", ")}`;
  }
  if (rule.type && !TYPE_CHECKS[rule.type](value)) {
    return `${label}: ${rule.path} must be ${TYPE_NAMES[rule.type]}`;
  }
  return null;
}

/** Errors for every rule the frontmatter breaks, plus warnings for top-level keys nobody reads (usually a typo). */
export function checkFrontmatter(data, rules, knownSections, label) {
  const problems = [];
  for (const rule of rules) {
    const message = checkOneRule(data, rule, label);
    if (message) problems.push({ level: "error", message });
  }
  for (const key of Object.keys(data)) {
    if (!knownSections.includes(key)) problems.push({ level: "warn", message: `${label}: "${key}" is not a setting this pipeline reads` });
  }
  return problems;
}
