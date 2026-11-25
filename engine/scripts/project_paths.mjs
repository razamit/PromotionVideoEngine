// Where a product's own settings live, for shorts and slideshows alike: the
// nearest folder at or above the work that holds .cartoon-shorts/. The
// product brief (.cartoon-shorts/product-brief.md) sits there; slideshows
// read all of it, shorts read only its qr block (scripts/qr/).

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const DEFAULT_BRIEF = join(".cartoon-shorts", "product-brief.md");

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
