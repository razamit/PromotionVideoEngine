#!/usr/bin/env node
// One command for every slideshow: `npm run <command>` inside a slideshow
// folder calls this (its package.json maps each script here), with that
// folder as the current directory. Separate from bin/short.mjs, which runs
// the video Shorts and is not involved.
//
//   node engine/bin/slideshow.mjs <command>     (from inside a slideshow)
//
// Commands:
//   check     compile slideshow.md + the brief, then lint (alias: lint)
//   guides    render every slide with TikTok's covered margins drawn on it (out/guides/)
//   render    check, then render slides/ and slides-clean/, pack.md and overlay_text.md
//   preview   render preview-for-review-only.mp4 (not the deliverable)
//   formats   list the formats this project can use

import { compileDeck } from "../scripts/slideshow/compile_deck.mjs";
import { DECK_DIR, findProjectDir } from "../scripts/slideshow/deck_paths.mjs";
import { loadDeckSources } from "../scripts/slideshow/deck_sources.mjs";
import { listFormatNames, loadFormat } from "../scripts/slideshow/formats.mjs";
import { lintDeck, reportProblems } from "../scripts/slideshow/lint_deck.mjs";
import { renderDeliverables, renderGuides, renderPreviewVideo } from "../scripts/slideshow/render_deck.mjs";
import { writePublisherFiles } from "../scripts/slideshow/write_pack.mjs";

const PREVIEW_SECONDS_PER_SLIDE = 2.5;

/** Loads, compiles and lints the slideshow in the current folder. */
function checkedDeck() {
  const sources = loadDeckSources(DECK_DIR);
  const { deck, blockedSlides } = compileDeck(sources);
  const errorCount = reportProblems(lintDeck(sources, deck));
  return { sources, deck, blockedSlides, errorCount };
}

function check() {
  if (checkedDeck().errorCount) process.exit(1);
}

async function guides() {
  const { sources, deck } = checkedDeck();
  await renderGuides(deck, sources.layout);
  console.log(`guides: ${sources.layout.guides}`);
}

async function render() {
  const { sources, deck, blockedSlides, errorCount } = checkedDeck();
  const onlyBlockedSlides = errorCount > 0 && errorCount === blockedSlides.length;
  if (errorCount && !onlyBlockedSlides) {
    console.error("render: fix the lint errors first");
    process.exit(1);
  }
  const { largestBytes } = await renderDeliverables(deck, sources.layout);
  writePublisherFiles({ deck, deckSource: sources.deckSource, brief: sources.brief, layout: sources.layout }, largestBytes);
  console.log(`slides: ${sources.layout.bakedSlides}\nclean:  ${sources.layout.cleanSlides}\npack:   ${sources.layout.pack}`);
  if (blockedSlides.length) {
    console.error(`render: ${blockedSlides.length} slide(s) were not rendered; see ${sources.layout.missingReport}`);
    process.exit(1);
  }
}

async function preview() {
  const { sources, deck } = checkedDeck();
  await renderPreviewVideo(deck, sources.layout, PREVIEW_SECONDS_PER_SLIDE);
  console.log(`preview (review only, not the photo post): ${sources.layout.preview}`);
}

function formats() {
  const projectDir = findProjectDir(DECK_DIR);
  for (const name of listFormatNames(projectDir)) {
    const format = loadFormat(name, projectDir);
    console.log(`${name.padEnd(20)} ${format.slides.min}-${format.slides.max} slides  ${format.summary}`);
  }
}

const commands = { check, lint: check, guides, render, preview, formats };
const command = process.argv[2];
if (!commands[command]) {
  console.error(`usage: slideshow.mjs <${Object.keys(commands).join("|")}>`);
  process.exit(2);
}
try {
  await commands[command]();
} catch (error) {
  console.error(`slideshow: ${error.message}`);
  process.exit(1);
}
