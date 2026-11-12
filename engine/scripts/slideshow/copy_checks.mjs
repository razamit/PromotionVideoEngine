// Wording rules that apply to every line a slideshow puts in front of people:
// slide text, the caption and the pinned comment. The banned phrases come
// from the product brief. Health and medical wording is blocked for every
// product unless its brief opts in (claims.healthClaims: true).

const HEALTH_WORDING = new RegExp([
  "adhd", "autis\\w*", "anxiety", "depress\\w*", "ocd", "dementia", "alzheimer\\w*", "neurodivergent",
  "executive dysfunction", "mental health", "diagnos\\w*", "symptom\\w*", "disorder\\w*", "therap\\w*",
  "medical\\w*", "clinical\\w*", "treats", "treatment\\w*", "cure[sd]?",
].map((word) => `\\b${word}\\b`).join("|"), "i");

const EM_DASH = String.fromCharCode(0x2014);

export const countWords = (text) => String(text ?? "").trim().split(/\s+/).filter(Boolean).length;

/** Every line of text a compiled slide shows. */
export function slideLines(slide) {
  const panelLines = (slide.panels ?? []).flatMap((panel) => [panel.label, panel.text]);
  return [slide.number, slide.text, slide.subtext, ...panelLines].filter((line) => typeof line === "string" && line.trim() !== "");
}

/** Problems with one piece of copy, each tagged with where it was found. */
export function checkCopy(text, where, brief) {
  const problems = [];
  const lowered = text.toLowerCase();
  for (const phrase of brief.copyRules?.avoid ?? []) {
    if (lowered.includes(phrase.toLowerCase())) {
      problems.push({ level: "error", message: `${where}: uses "${phrase}", which the brief's copyRules.avoid bans` });
    }
  }
  if (text.includes(EM_DASH)) problems.push({ level: "error", message: `${where}: has an em dash; rewrite the sentence` });
  const healthMatch = brief.claims?.healthClaims === true ? null : HEALTH_WORDING.exec(text);
  if (healthMatch) {
    problems.push({ level: "error", message: `${where}: "${healthMatch[0]}" reads as a health claim; these are off unless the brief sets claims.healthClaims: true` });
  }
  return problems;
}
