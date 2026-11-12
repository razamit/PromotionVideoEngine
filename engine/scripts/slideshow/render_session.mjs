// One Remotion bundle and one headless browser for a whole slideshow, so six
// slides in two variants cost one start-up instead of twelve. The bundle is
// built from the slideshow's own entry (src/slideshow/index.ts) and serves
// the slideshow's staged screenshots as its public folder.

import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { join } from "node:path";
import { ENGINE_DIR } from "./deck_paths.mjs";

const SLIDESHOW_ENTRY = join(ENGINE_DIR, "src", "slideshow", "index.ts");

/** @returns {Promise<{ renderSlide: Function, renderPreview: Function, close: () => Promise<void> }>} */
export async function openRenderSession(publicDir) {
  // Remotion keeps its headless browser in the node_modules beside the nearest
  // package.json to the current folder. A slideshow folder has a package.json,
  // so without this each slideshow would download its own 170 MB browser.
  process.chdir(ENGINE_DIR);
  const serveUrl = await bundle({ entryPoint: SLIDESHOW_ENTRY, publicDir });
  const browser = await openBrowser("chrome");

  /** Writes one slide of the deck to `outputFile` in the deck's image format. */
  async function renderSlide(deck, slideIndex, variant, outputFile) {
    const inputProps = { deck, slideIndex, variant };
    const composition = await selectComposition({ serveUrl, id: "Slide", inputProps, puppeteerInstance: browser });
    await renderStill({
      composition, serveUrl, inputProps, output: outputFile, puppeteerInstance: browser,
      imageFormat: deck.output.imageFormat,
      ...(deck.output.imageFormat === "jpeg" ? { jpegQuality: deck.output.jpegQuality } : {}),
      overwrite: true,
    });
  }

  /** Writes the stamped review video. */
  async function renderPreview(deck, secondsPerSlide, outputFile) {
    const inputProps = { deck, secondsPerSlide };
    const composition = await selectComposition({ serveUrl, id: "SlideshowPreview", inputProps, puppeteerInstance: browser });
    await renderMedia({
      composition, serveUrl, inputProps, outputLocation: outputFile, puppeteerInstance: browser,
      codec: "h264", crf: 20, pixelFormat: "yuv420p", muted: true, overwrite: true,
    });
  }

  return { renderSlide, renderPreview, close: () => browser.close({ silent: true }) };
}
