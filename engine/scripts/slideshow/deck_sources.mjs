// Everything a slideshow is made from, loaded once: its own slideshow.md, the
// product brief it points at, and the format it follows. Nothing here knows
// about any one product; the brief carries all of that.

import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { DEFAULT_BRIEF, deckLayout, findProjectDir } from "./deck_paths.mjs";
import { loadFormat } from "./formats.mjs";
import { readFrontmatter } from "./frontmatter.mjs";

/** The brief named in slideshow.md (relative to the slideshow), else the project's .cartoon-shorts/product-brief.md. */
function briefPathFor(deckDir, projectDir, namedBrief) {
  if (!namedBrief) return join(projectDir, DEFAULT_BRIEF);
  return isAbsolute(namedBrief) ? namedBrief : resolve(deckDir, namedBrief);
}

/**
 * @returns {{ layout: ReturnType<typeof deckLayout>, projectDir: string, briefFile: string,
 *   deckSource: Record<string, any>, deckNotes: string, brief: Record<string, any>, briefNotes: string, format: Record<string, any> }}
 */
export function loadDeckSources(deckDir) {
  const layout = deckLayout(deckDir);
  if (!existsSync(layout.deckFile)) throw new Error(`${deckDir} has no slideshow.md; run this from inside a slideshow folder`);
  const { data: deckSource, body: deckNotes } = readFrontmatter(layout.deckFile);
  const briefFile = briefPathFor(deckDir, findProjectDir(deckDir), deckSource.brief);
  if (!existsSync(briefFile)) {
    throw new Error(`no product brief at ${briefFile}. Create one from the template (references/slideshow-mode.md, "The product brief").`);
  }
  // The brief's own paths (screenshot folders, icon, custom formats) belong to
  // the product's repo, which is where the brief lives, not where the slideshow is.
  const projectDir = findProjectDir(dirname(briefFile));
  const { data: brief, body: briefNotes } = readFrontmatter(briefFile);
  if (typeof deckSource.format !== "string") throw new Error(`${layout.deckFile}: format is missing`);
  const format = loadFormat(deckSource.format, projectDir);
  return { layout, projectDir, briefFile, deckSource, deckNotes, brief, briefNotes, format };
}
