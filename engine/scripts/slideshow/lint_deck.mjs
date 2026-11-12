// Mechanical checks on a slideshow before it is rendered: the brief's and the
// slideshow's YAML, the slide structure the format asks for, real
// screenshots where a slide needs one, the brief's wording rules, and the
// post text. Errors stop a render; warnings are judgement calls to look at.

import { MAX_SLIDES_PER_POST, RECOMMENDED_SLIDE_RANGE } from "./aspects.mjs";
import { checkCopy, countWords, slideLines } from "./copy_checks.mjs";
import { roleOf } from "./formats.mjs";
import { BRIEF_RULES, BRIEF_SECTIONS, checkFrontmatter, DECK_RULES, DECK_SECTIONS } from "./frontmatter_rules.mjs";
import { checkCartoonSlides } from "./cartoon_checks.mjs";
import { checkSocialText } from "./social_text_checks.mjs";

const LAYOUT_NAMES = ["text", "screenshot", "split", "end"];
/** Below this, a screenshot is drawn at under half its captured size and its UI text stops being readable on a phone. */
const MIN_READABLE_SCREENSHOT_SCALE = 0.5;
/** Share of the safe box's height a screenshot can use once the text line is in. */
const SCREENSHOT_HEIGHT_SHARE = 0.7;

const error = (message) => ({ level: "error", message });
const warn = (message) => ({ level: "warn", message });
const includesName = (text, name) => Boolean(name) && String(text ?? "").toLowerCase().includes(name.toLowerCase());

function checkSlideCount(slides, format) {
  const problems = [];
  const count = slides.length;
  if (count > MAX_SLIDES_PER_POST) problems.push(error(`${count} slides; TikTok takes ${MAX_SLIDES_PER_POST} at most`));
  if (count < format.slides.min || count > format.slides.max) {
    problems.push(warn(`${count} slides; the ${format.name} format is written for ${format.slides.min} to ${format.slides.max}`));
  } else if (count < RECOMMENDED_SLIDE_RANGE.min || count > RECOMMENDED_SLIDE_RANGE.max) {
    problems.push(warn(`${count} slides; people tend to finish ${RECOMMENDED_SLIDE_RANGE.min} to ${RECOMMENDED_SLIDE_RANGE.max}`));
  }
  return problems;
}

function checkDeckShape(slides, format, deckSource) {
  const problems = [];
  const last = slides[slides.length - 1];
  if (slides[0] && slides[0].role !== format.roles[0].role) {
    problems.push(warn(`slide 1 is a "${slides[0].role}"; the ${format.name} format opens on a "${format.roles[0].role}"`));
  }
  if (last && last.layout !== "end") problems.push(error("the last slide must use the end layout, which shows the product name"));
  if (deckSource.cover !== undefined && (deckSource.cover < 1 || deckSource.cover > slides.length)) {
    problems.push(error(`cover is ${deckSource.cover}; the slideshow has ${slides.length} slides`));
  }
  return problems;
}

/** How large a screenshot crop ends up on the slide, as a fraction of its captured pixels. */
function screenshotScale(screenshot, output) {
  const { safeMargins, width, height } = output;
  const boxWidth = width * (1 - safeMargins.left - safeMargins.right);
  const boxHeight = height * (1 - safeMargins.top - safeMargins.bottom) * SCREENSHOT_HEIGHT_SHARE;
  const cropWidth = screenshot.crop.w * screenshot.size[0];
  const cropHeight = screenshot.crop.h * screenshot.size[1];
  return Math.min(boxWidth / cropWidth, boxHeight / cropHeight);
}

function checkScreenshot(screenshot, where, output) {
  const { x, y, w, h } = screenshot.crop;
  const insideCapture = [x, y, w, h].every((value) => typeof value === "number") && x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 1.0001 && y + h <= 1.0001;
  if (!insideCapture) return [error(`${where}: crop must be x, y, w, h as fractions of the screenshot, inside 0 to 1`)];
  const scale = screenshotScale(screenshot, output);
  if (scale >= MIN_READABLE_SCREENSHOT_SCALE) return [];
  return [warn(`${where}: the screenshot is drawn at ${Math.round(scale * 100)}% of its size; crop to the element the line talks about so it stays readable`)];
}

function checkSlideStructure(slide, where, format, output) {
  const problems = [];
  const role = roleOf(format, slide.role);
  if (!role) problems.push(error(`${where}: role "${slide.role}" is not in the ${format.name} format (${format.roles.map((entry) => entry.role).join(", ")})`));
  if (!LAYOUT_NAMES.includes(slide.layout)) problems.push(error(`${where}: layout "${slide.layout}" is not one of ${LAYOUT_NAMES.join(", ")}`));
  if (slide.blocked) problems.push(error(`${where}: ${slide.blocked}. The slide will not be rendered`));
  const isSplit = slide.layout === "split";
  const needsScreenshot = !isSplit && (slide.layout === "screenshot" || role?.screenshot === "required");
  if (needsScreenshot && !slide.screenshot && !slide.blocked) problems.push(error(`${where}: needs a real screenshot (screenshot: <file>)`));
  if (isSplit && (slide.panels ?? []).length !== 2) problems.push(error(`${where}: the split layout takes exactly two panels`));
  const emptyPanel = isSplit && !slide.blocked && (slide.panels ?? []).some((panel) => !panel.screenshot && !panel.text);
  if (emptyPanel) problems.push(error(`${where}: each panel needs a real screenshot or a line of text`));
  const screenshots = [slide.screenshot, ...(slide.panels ?? []).map((panel) => panel.screenshot)].filter(Boolean);
  for (const screenshot of screenshots) problems.push(...checkScreenshot(screenshot, where, output));
  if (role?.maxWords && slide.layout !== "end" && countWords(slide.text) > role.maxWords) {
    problems.push(warn(`${where}: ${countWords(slide.text)} words; a ${role.role} slide reads in two seconds at ${role.maxWords} or fewer`));
  }
  if (slide.layout !== "end" && slide.layout !== "split" && !slide.text) problems.push(error(`${where}: has no text`));
  return problems;
}

function checkSlideWording(slide, where, index, brief, format) {
  const problems = slideLines(slide).flatMap((line) => checkCopy(line, where, brief));
  const paidPhrase = brief.claims?.paidTierPhrase;
  if (slide.paid && !paidPhrase) problems.push(error(`${where}: marked paid, but the brief has no claims.paidTierPhrase to say`));
  if (slide.paid && paidPhrase && !slideLines(slide).some((line) => includesName(line, paidPhrase))) {
    problems.push(error(`${where}: shows a paid feature, so its text must say "${paidPhrase}"`));
  }
  const namesProduct = slide.layout !== "end" && slideLines(slide).some((line) => includesName(line, brief.product?.name));
  if (namesProduct && index === 0) problems.push(warn(`${where}: the product name on slide 1 reads as an ad; open on the problem`));
  else if (namesProduct && format.productName === "last-only") {
    problems.push(warn(`${where}: the ${format.name} format keeps the product name for the last slide`));
  }
  return problems;
}

/** A numbered list must count 1, 2, 3 in order, match the count its hook promises, and keep the number out of the line. */
function checkNumbering(slides) {
  const problems = [];
  const numbers = slides.filter((slide) => slide.number !== undefined).map((slide) => slide.number);
  const inOrder = numbers.every((number, index) => number === String(index + 1));
  if (!inOrder) problems.push(warn(`numbered slides read ${numbers.join(", ")}; a list counts 1, 2, 3 in order`));
  const promised = /^\s*(\d+)\s/.exec(slides[0]?.text ?? "");
  if (promised && numbers.length && Number(promised[1]) !== numbers.length) {
    problems.push(error(`slide 1 promises ${promised[1]} things; ${numbers.length} slides are numbered`));
  }
  slides.forEach((slide, index) => {
    if (index > 0 && /^\s*\d+[.)]\s/.test(slide.text ?? "")) {
      problems.push(warn(`slide ${index + 1}: the line starts with a number; put it in number: so it is drawn above the line`));
    }
  });
  return problems;
}

/** Starter placeholders (new_slideshow.sh writes "TODO ...") must not reach a render. */
function checkPlaceholders(deck, deckSource) {
  const fields = [["topic", deckSource.topic], ["keyword", deckSource.keyword], ["sound.mood", deckSource.sound?.mood]];
  deck.slides.forEach((slide, index) => slideLines(slide).forEach((line) => fields.push([`slide ${index + 1}`, line])));
  return fields
    .filter(([, value]) => typeof value === "string" && value.includes("TODO"))
    .map(([where]) => error(`${where}: still has the starter's TODO text`));
}

function checkEndCard(brief, deck) {
  const problems = [];
  if (!includesName(brief.cta?.lastSlide, brief.product?.name)) {
    problems.push(error(`brief: cta.lastSlide ("${brief.cta?.lastSlide}") must contain the product name ("${brief.product?.name}")`));
  }
  if (brief.product?.icon && !deck.product.icon) problems.push(warn(`brief: product.icon "${brief.product.icon}" was not found; the last slide will have no icon`));
  return problems;
}

/**
 * @param {ReturnType<typeof import("./deck_sources.mjs").loadDeckSources>} sources
 * @param {Record<string, any>} deck the compiled deck
 * @returns {{ level: "error" | "warn", message: string }[]}
 */
export function lintDeck(sources, deck) {
  const { brief, deckSource, format, layout } = sources;
  const problems = [
    ...checkFrontmatter(brief, BRIEF_RULES, BRIEF_SECTIONS, "brief"),
    ...checkFrontmatter(deckSource, DECK_RULES, DECK_SECTIONS, "slideshow.md"),
    ...checkSlideCount(deck.slides, format),
    ...checkDeckShape(deck.slides, format, deckSource),
    ...checkEndCard(brief, deck),
    ...checkPlaceholders(deck, deckSource),
    ...checkNumbering(deck.slides),
    ...checkCartoonSlides(deckSource.slides ?? [], deck.slides, brief, deckSource.backdrop),
  ];
  deck.slides.forEach((slide, index) => {
    const where = `slide ${index + 1}`;
    problems.push(...checkSlideStructure(slide, where, format, deck.output));
    problems.push(...checkSlideWording(slide, where, index, brief, format));
  });
  problems.push(...checkSocialText(layout.socialText, brief, deckSource));
  return problems;
}

/** Prints the problems and returns how many are errors. */
export function reportProblems(problems) {
  for (const problem of problems) console.log(`${problem.level === "error" ? "ERROR" : "warn "}  ${problem.message}`);
  const errorCount = problems.filter((problem) => problem.level === "error").length;
  console.log(errorCount ? `lint: ${errorCount} error(s), ${problems.length - errorCount} warning(s)` : `lint: ok (${problems.length} warning(s))`);
  return errorCount;
}
