// Where a slideshow's files live. DECK_DIR is the slideshow being worked on
// (the folder with slideshow.md; bin/slideshow.mjs runs from inside it).
// PROJECT_DIR is the product's repo: the nearest folder above it that holds
// .cartoon-shorts/, where the product brief and any custom formats are.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ENGINE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DECK_DIR = resolve(process.env.SLIDESHOW_DIR ?? process.cwd());

export const DECK_FILE = "slideshow.md";
export const DEFAULT_BRIEF = join(".cartoon-shorts", "product-brief.md");
export const PROJECT_FORMATS_DIR = join(".cartoon-shorts", "slideshow-formats");
export const ENGINE_FORMATS_DIR = join(ENGINE_DIR, "slideshow", "formats");
export const BRIEF_TEMPLATE = join(ENGINE_DIR, "slideshow", "product-brief.template.md");

/** The nearest folder at or above `start` that has .cartoon-shorts/, else `start` itself. */
export function findProjectDir(start) {
  let folder = resolve(start);
  for (;;) {
    if (existsSync(join(folder, ".cartoon-shorts"))) return folder;
    const parent = dirname(folder);
    if (parent === folder) return resolve(start);
    folder = parent;
  }
}

/** The project's .cartoon-shorts/config.json (shortsDir, slideshowsDir), or {} when there is none. */
export function readProjectConfig(projectDir) {
  const configFile = join(projectDir, ".cartoon-shorts", "config.json");
  return existsSync(configFile) ? JSON.parse(readFileSync(configFile, "utf8")) : {};
}

/** Paths inside one slideshow folder. */
export function deckLayout(deckDir = DECK_DIR) {
  return {
    deckDir,
    deckFile: join(deckDir, DECK_FILE),
    compiledDeck: join(deckDir, "generated", "slideshow.json"),
    publicDir: join(deckDir, ".public"),
    stagedShots: join(deckDir, ".public", "shots"),
    sceneCache: join(deckDir, ".cache", "scenes"),
    bakedSlides: join(deckDir, "slides"),
    cleanSlides: join(deckDir, "slides-clean"),
    guides: join(deckDir, "out", "guides"),
    missingReport: join(deckDir, "missing.md"),
    overlayText: join(deckDir, "overlay_text.md"),
    pack: join(deckDir, "pack.md"),
    socialText: join(deckDir, "social_text.md"),
    preview: join(deckDir, "preview-for-review-only.mp4"),
  };
}
