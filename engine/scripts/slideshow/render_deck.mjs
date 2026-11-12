// Renders a compiled slideshow to image files: slides/ with the text baked in
// and slides-clean/ without it, named in upload order. Afterwards it proves
// what TikTok requires of a photo post: every slide the same pixel size, and
// each file under the size limit.

import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { MAX_IMAGE_BYTES } from "./aspects.mjs";
import { imageSize } from "./image_size.mjs";
import { openRenderSession } from "./render_session.mjs";

const emptyFolder = (folder) => { rmSync(folder, { recursive: true, force: true }); mkdirSync(folder, { recursive: true }); };

export const slideFileName = (deck, slide) => `${slide.id}.${deck.output.extension}`;

async function renderVariant(session, deck, variant, folder) {
  emptyFolder(folder);
  for (const [slideIndex, slide] of deck.slides.entries()) {
    if (slide.blocked) continue;
    await session.renderSlide(deck, slideIndex, variant, join(folder, slideFileName(deck, slide)));
  }
}

/** Throws unless every image in the folder is the deck's size and under TikTok's per-image limit. Returns the largest file's bytes. */
export function verifySlideFiles(folder, deck) {
  let largestBytes = 0;
  for (const name of readdirSync(folder).sort()) {
    const file = join(folder, name);
    const [width, height] = imageSize(file);
    if (width !== deck.output.width || height !== deck.output.height) {
      throw new Error(`${file} is ${width}x${height}; every slide must be ${deck.output.width}x${deck.output.height}`);
    }
    const bytes = statSync(file).size;
    if (bytes > MAX_IMAGE_BYTES) throw new Error(`${file} is ${(bytes / 1e6).toFixed(1)} MB; TikTok takes 20 MB per image at most`);
    largestBytes = Math.max(largestBytes, bytes);
  }
  return largestBytes;
}

/** Renders both deliverable sets. @returns {Promise<{ largestBytes: number }>} */
export async function renderDeliverables(deck, layout) {
  const session = await openRenderSession(layout.publicDir);
  try {
    await renderVariant(session, deck, "baked", layout.bakedSlides);
    await renderVariant(session, deck, "clean", layout.cleanSlides);
  } finally {
    await session.close();
  }
  const largestBytes = Math.max(verifySlideFiles(layout.bakedSlides, deck), verifySlideFiles(layout.cleanSlides, deck));
  return { largestBytes };
}

/** Renders every slide with the covered margins drawn on it, for review only. */
export async function renderGuides(deck, layout) {
  const session = await openRenderSession(layout.publicDir);
  try {
    await renderVariant(session, deck, "guides", layout.guides);
  } finally {
    await session.close();
  }
}

/** Renders the stamped preview video from the same deck. */
export async function renderPreviewVideo(deck, layout, secondsPerSlide) {
  const session = await openRenderSession(layout.publicDir);
  try {
    await session.renderPreview(deck, secondsPerSlide, layout.preview);
  } finally {
    await session.close();
  }
}
