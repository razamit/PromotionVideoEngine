// A slideshow format is data, not code: a Markdown file whose YAML lists the
// slide roles, their layout, their word caps and a starter order. The six
// house formats ship in engine/slideshow/formats/. A product adds its own by
// dropping a file of the same shape into .cartoon-shorts/slideshow-formats/,
// which is looked at first, so no code changes for a new format.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ENGINE_FORMATS_DIR, PROJECT_FORMATS_DIR } from "./deck_paths.mjs";
import { readFrontmatter } from "./frontmatter.mjs";
import { checkFrontmatter, FORMAT_RULES } from "./frontmatter_rules.mjs";

const FORMAT_SECTIONS = ["name", "summary", "slides", "productName", "roles", "starter"];

function formatFolders(projectDir) {
  return [join(projectDir, PROJECT_FORMATS_DIR), ENGINE_FORMATS_DIR].filter(existsSync);
}

export function listFormatNames(projectDir) {
  const names = formatFolders(projectDir).flatMap((folder) =>
    readdirSync(folder).filter((file) => file.endsWith(".md")).map((file) => file.slice(0, -3)));
  return [...new Set(names)].sort();
}

/** The format's settings, its writing notes and where it came from. Throws when the name is unknown or the file is malformed. */
export function loadFormat(formatName, projectDir) {
  const file = formatFolders(projectDir).map((folder) => join(folder, `${formatName}.md`)).find(existsSync);
  if (!file) {
    throw new Error(`unknown format "${formatName}". Available: ${listFormatNames(projectDir).join(", ")}`);
  }
  const { data, body } = readFrontmatter(file);
  const errors = checkFrontmatter(data, FORMAT_RULES, FORMAT_SECTIONS, file).filter((problem) => problem.level === "error");
  if (errors.length) throw new Error(errors.map((problem) => problem.message).join("\n"));
  return { ...data, notes: body, file };
}

/** The role entry a slide belongs to, or undefined when the format has no such role. */
export function roleOf(format, roleName) {
  return format.roles.find((role) => role.role === roleName);
}
