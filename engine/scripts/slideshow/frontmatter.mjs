// Slideshow settings are written as Markdown with a YAML block at the top
// (the product brief, each slideshow, each format). This reads one such file:
// the YAML as an object, the rest as prose for a person or the skill to read.

import { readFileSync } from "node:fs";
import yaml from "js-yaml";

const FRONTMATTER_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** @returns {{ data: Record<string, any>, body: string }} */
export function readFrontmatter(file) {
  const text = readFileSync(file, "utf8");
  const match = FRONTMATTER_BLOCK.exec(text);
  if (!match) throw new Error(`${file}: no YAML frontmatter. The file must start with a --- block.`);
  let data;
  try {
    data = yaml.load(match[1]);
  } catch (error) {
    throw new Error(`${file}: YAML error: ${error.message}`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${file}: the frontmatter must be a set of key: value settings`);
  }
  return { data, body: match[2].trim() };
}
