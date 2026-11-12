// Turns slideshow.md + the product brief + the format into the one JSON file
// the renderer draws from (generated/slideshow.json), and stages the real
// screenshots it names into .public/shots/ so the render can load them.
//
// A screenshot that cannot be found is never replaced or drawn: the slide is
// marked blocked, listed in missing.md, and left out of the render.

import { copyFileSync, existsSync, linkSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { ASPECTS, ENGINE_OUTPUT_DEFAULTS, IMAGE_FORMATS } from "./aspects.mjs";
import { readProjectConfig } from "./deck_paths.mjs";
import { roleOf } from "./formats.mjs";
import { imageSize } from "./image_size.mjs";
import { findShortDir, sceneStillFor } from "./scene_stills.mjs";

/** How much a full-frame picture is darkened so the line stays readable: a photo more, a cartoon frame less. */
const PICTURE_DIM = { photo: 0.38, scene: 0.12 };
const DEFAULT_BACKDROP = "cool";

const DEFAULT_STYLE = { background: "#111214", text: "#ffffff", outline: "#000000" };

export const slugify = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function resolveOutput(brief, deckSource) {
  const merged = { ...ENGINE_OUTPUT_DEFAULTS, ...(brief.output ?? {}), ...(deckSource.output ?? {}) };
  const shape = ASPECTS[merged.aspect];
  const encoding = IMAGE_FORMATS[merged.format];
  if (!shape) throw new Error(`output.aspect "${merged.aspect}" is not one of ${Object.keys(ASPECTS).join(", ")}`);
  if (!encoding) throw new Error(`output.format "${merged.format}" is not one of ${Object.keys(IMAGE_FORMATS).join(", ")}`);
  const safeMargins = { ...shape.safeMargins, ...(brief.output?.safeMargins ?? {}), ...(deckSource.output?.safeMargins ?? {}) };
  return {
    aspect: merged.aspect, width: shape.width, height: shape.height, safeMargins,
    imageFormat: encoding.imageFormat, extension: encoding.extension,
    jpegQuality: merged.jpegQuality, primaryText: merged.text,
  };
}

/** The first existing match for an image named in the brief or a slide: as given, beside the slideshow, in the project, then in each screenshot folder. */
function findImage(imageName, searchDirs) {
  if (isAbsolute(imageName)) return existsSync(imageName) ? imageName : null;
  return searchDirs.map((folder) => resolve(folder, imageName)).find(existsSync) ?? null;
}

/** Hard-links (or copies) a real image into the slideshow's public folder and measures it. */
function stageImage(sourceFile, stagedName, stagedShots) {
  const target = join(stagedShots, stagedName);
  try {
    linkSync(sourceFile, target);
  } catch {
    copyFileSync(sourceFile, target); // the captures are on another volume
  }
  return { src: `shots/${stagedName}`, size: imageSize(sourceFile) };
}

/** A screenshot reference -> staged image, or the reason the slide cannot be made. */
function compileScreenshot(source, stagedPrefix, context) {
  if (!source.screenshot) return {};
  const file = findImage(source.screenshot, context.searchDirs);
  if (!file) return { blocked: `missing screenshot: ${source.screenshot}` };
  const staged = stageImage(file, `${stagedPrefix}-${basename(file)}`, context.stagedShots);
  return { screenshot: { ...staged, crop: source.crop ?? { x: 0, y: 0, w: 1, h: 1 } } };
}

/** The slide's full-frame picture: a frame from one of the product's cartoon shorts, or a real photo the brief supplies. */
function compilePicture(slideSource, stagedPrefix, context) {
  if (slideSource.scene) {
    const still = sceneStillFor(slideSource.scene, context.scenes);
    if (still.blocked) return { blocked: still.blocked };
    const staged = stageImage(still.file, `${stagedPrefix}-scene-${basename(still.file)}`, context.stagedShots);
    return { photo: staged.src, photoDim: slideSource.scene.dim ?? PICTURE_DIM.scene };
  }
  if (!slideSource.photo) return {};
  const file = findImage(slideSource.photo, context.searchDirs);
  if (!file) return { blocked: `missing photo: ${slideSource.photo}` };
  return { photo: stageImage(file, `${stagedPrefix}-bg-${basename(file)}`, context.stagedShots).src, photoDim: PICTURE_DIM.photo };
}

/** A house character on the slide: the cast member's look from the brief plus this slide's mood and gesture. */
function compileCharacter(slideSource, cast) {
  const reference = slideSource.character;
  const look = reference ? cast?.[reference.who] : undefined;
  if (!look) return undefined;
  return { ...look, mood: reference.mood ?? "calm", gesture: reference.gesture ?? "rest", facing: reference.facing ?? "right" };
}

/**
 * The flat cartoon room behind a slide. The slide's own `backdrop` wins, then
 * the slideshow's, and a character always stands in one. `backdrop: none`
 * turns it off. A slide with a picture (scene, photo) never gets one.
 */
function compileBackdrop(slideSource, context) {
  const character = compileCharacter(slideSource, context.cast);
  const asked = slideSource.backdrop ?? context.deckBackdrop ?? (character ? DEFAULT_BACKDROP : undefined);
  const hasPicture = Boolean(slideSource.scene || slideSource.photo);
  const backdrop = hasPicture || asked === "none" ? undefined : asked;
  return { ...(character ? { character } : {}), ...(backdrop ? { backdrop } : {}) };
}

function compilePanels(slideSource, stagedPrefix, context) {
  if (!Array.isArray(slideSource.panels)) return {};
  const panels = slideSource.panels.map((panel, panelIndex) => ({
    label: panel.label, text: panel.text, ...compileScreenshot(panel, `${stagedPrefix}-p${panelIndex + 1}`, context),
  }));
  const blocked = panels.map((panel) => panel.blocked).filter(Boolean).join("; ");
  return blocked ? { panels, blocked } : { panels };
}

function slideId(slideSource, index, total, layoutName) {
  const number = String(index + 1).padStart(2, "0");
  const isLast = index === total - 1;
  if (isLast && layoutName === "end") return `${number}-last-slide`;
  return `${number}-${slugify(slideSource.name ?? slideSource.role ?? "slide")}`;
}

function compileSlide(slideSource, index, total, context) {
  const layoutName = slideSource.layout ?? roleOf(context.format, slideSource.role)?.layout ?? "text";
  const id = slideId(slideSource, index, total, layoutName);
  const stagedPrefix = id.slice(0, 2);
  const parts = [
    compileScreenshot(slideSource, stagedPrefix, context),
    compilePicture(slideSource, stagedPrefix, context),
    compilePanels(slideSource, stagedPrefix, context),
  ];
  const blocked = parts.map((part) => part.blocked).filter(Boolean).join("; ");
  const isEndCard = layoutName === "end";
  return {
    id, role: slideSource.role ?? "slide", layout: layoutName,
    number: slideSource.number === undefined || isEndCard ? undefined : String(slideSource.number),
    text: isEndCard ? context.endCard.name : slideSource.text,
    subtext: isEndCard ? (slideSource.text ?? context.endCard.line) : slideSource.subtext,
    // Over a cartoon frame the line goes to the top, where the sky or wall is, unless the slide says otherwise.
    textPosition: slideSource.textPosition ?? (slideSource.scene ? "top" : undefined),
    screenshot: parts[0].screenshot, photo: parts[1].photo, photoDim: parts[1].photoDim, panels: parts[2].panels,
    ...compileBackdrop(slideSource, context),
    paid: slideSource.paid === true,
    ...(blocked ? { blocked } : {}),
  };
}

function stageProductIcon(brief, context) {
  if (!brief.product?.icon) return undefined;
  const file = findImage(brief.product.icon, context.searchDirs);
  return file ? stageImage(file, `icon-${basename(file)}`, context.stagedShots).src : undefined;
}

function writeMissingReport(file, blockedSlides) {
  if (!blockedSlides.length) { rmSync(file, { force: true }); return; }
  const rows = blockedSlides.map((slide) => `| ${slide.id} | ${slide.blocked} |`);
  writeFileSync(file, [
    "# Missing material", "",
    "These slides were not rendered. Capture the real screen, save it where the",
    "brief's `screenshots.dirs` can find it, and render again. Nothing is drawn",
    "in place of a missing screenshot.", "",
    "| Slide | What is missing |", "|---|---|", ...rows, "",
  ].join("\n"));
}

/**
 * A slideshow made from one short (`fromShort: <slug>`) finds that short's
 * real captures by name and takes its `scene:` frames from it by default.
 */
function sourceShort(deckSource, projectDir, shortsDirs) {
  if (!deckSource.fromShort) return { captureDirs: [] };
  const shortDir = findShortDir(deckSource.fromShort, projectDir, shortsDirs);
  if (!shortDir) return { captureDirs: [], name: deckSource.fromShort };
  return { captureDirs: [join(shortDir, "public"), join(shortDir, "public", "app")], name: deckSource.fromShort };
}

/**
 * @param {ReturnType<typeof import("./deck_sources.mjs").loadDeckSources>} sources
 * @returns {{ deck: Record<string, any>, blockedSlides: Record<string, any>[] }}
 */
export function compileDeck(sources) {
  const { layout, projectDir, brief, deckSource, format } = sources;
  rmSync(layout.stagedShots, { recursive: true, force: true });
  mkdirSync(layout.stagedShots, { recursive: true });
  const screenshotDirs = (brief.screenshots?.dirs ?? []).map((folder) => resolve(projectDir, folder));
  const shortsDirs = brief.shorts?.dirs ?? [readProjectConfig(projectDir).shortsDir ?? "shorts"];
  const fromShort = sourceShort(deckSource, projectDir, shortsDirs);
  const context = {
    format, stagedShots: layout.stagedShots,
    searchDirs: [layout.deckDir, ...fromShort.captureDirs, projectDir, ...screenshotDirs],
    endCard: { name: brief.cta?.lastSlide ?? brief.product?.name ?? "", line: brief.cta?.lastSlideLine },
    cast: brief.cast,
    deckBackdrop: deckSource.backdrop,
    scenes: { projectDir, cacheDir: layout.sceneCache, shortsDirs, defaultShort: fromShort.name },
  };
  const slideSources = Array.isArray(deckSource.slides) ? deckSource.slides : [];
  const slides = slideSources.map((slideSource, index) => compileSlide(slideSource ?? {}, index, slideSources.length, context));
  const deck = {
    product: { name: brief.product?.name ?? "", descriptor: brief.product?.descriptor, icon: stageProductIcon(brief, context) },
    format: format.name, topic: deckSource.topic,
    output: resolveOutput(brief, deckSource),
    style: { ...DEFAULT_STYLE, ...(brief.style ?? {}) },
    slides,
  };
  mkdirSync(dirname(layout.compiledDeck), { recursive: true });
  writeFileSync(layout.compiledDeck, JSON.stringify(deck, null, 2) + "\n");
  const blockedSlides = slides.filter((slide) => slide.blocked);
  writeMissingReport(layout.missingReport, blockedSlides);
  return { deck, blockedSlides };
}
