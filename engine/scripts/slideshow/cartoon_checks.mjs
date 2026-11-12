// Checks on slides that use the cartoon look: a house character
// (`character:`) or a frame from one of the product's shorts (`scene:`).
// The names a slide may use are read from where they are defined, so this
// never keeps its own copy: gestures and backdrops from
// slideshow/cartoon-options.json, moods and hair styles from the character
// source files.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ENGINE_DIR } from "./deck_paths.mjs";

const error = (message) => ({ level: "error", message });

const cartoonOptions = JSON.parse(readFileSync(join(ENGINE_DIR, "slideshow", "cartoon-options.json"), "utf8"));

/** Names quoted in a TypeScript union such as `export type Mood = | "calm" | "tired"`. Empty when the source cannot be read that way. */
function unionNames(sourceFile, typeName) {
  const source = readFileSync(join(ENGINE_DIR, "src", "characters", sourceFile), "utf8");
  const declaration = new RegExp(`export type ${typeName} =([^;]+);`).exec(source);
  return declaration ? [...declaration[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]) : [];
}

const KNOWN = {
  mood: unionNames("moods.ts", "Mood"),
  hair: unionNames("Hair.tsx", "HairStyle"),
  gesture: Object.keys(cartoonOptions.gestures),
  backdrop: Object.keys(cartoonOptions.backdrops),
};

/** An error when `value` is set and not one of the known names (skipped when the list could not be read). */
function checkName(kind, value, where) {
  if (value === undefined || (kind === "backdrop" && value === "none") || KNOWN[kind].length === 0 || KNOWN[kind].includes(value)) return [];
  return [error(`${where}: ${kind} "${value}" is not one of ${KNOWN[kind].join(", ")}`)];
}

function checkCharacter(slideSource, compiledSlide, where, brief) {
  const reference = slideSource.character;
  if (!reference) return [];
  const look = brief.cast?.[reference.who];
  if (!look) {
    const castNames = Object.keys(brief.cast ?? {});
    return [error(`${where}: character "${reference.who}" is not in the brief's cast (${castNames.join(", ") || "the brief has no cast"})`)];
  }
  const problems = [
    ...checkName("mood", reference.mood, where),
    ...checkName("gesture", reference.gesture, where),
    ...checkName("hair", look.hair, `brief cast.${reference.who}`),
  ];
  if (compiledSlide.layout !== "text") problems.push(error(`${where}: a character is drawn on the text layout only`));
  if (slideSource.scene || slideSource.photo) problems.push(error(`${where}: use a character or a picture (scene, photo), not both`));
  return problems;
}

/**
 * @param {Record<string, any>[]} slideSources the slides as written in slideshow.md
 * @param {Record<string, any>[]} compiledSlides the same slides after compiling
 */
export function checkCartoonSlides(slideSources, compiledSlides, brief, deckBackdrop) {
  return [...checkName("backdrop", deckBackdrop, "slideshow.md backdrop"), ...slideSources.flatMap((slideSource, index) => {
    const where = `slide ${index + 1}`;
    const source = slideSource ?? {};
    return [
      ...checkCharacter(source, compiledSlides[index], where, brief),
      ...checkName("backdrop", source.backdrop, where),
    ];
  })];
}
