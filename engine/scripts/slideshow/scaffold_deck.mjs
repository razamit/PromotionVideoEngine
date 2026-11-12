#!/usr/bin/env node
// Starts a new slideshow in the current project:
//   scaffold_deck.mjs [--format <name>] [--brief <path>] [--from-short <short>] <slug>
// It reads the product brief (default .cartoon-shorts/product-brief.md),
// creates <slideshowsDir>/<product>/<slug>/ and writes a slideshow.md with
// the format's starter slides, plus the package.json whose npm scripts run
// the engine from its stable home. A missing brief is created from the
// template and the command stops, because a slideshow without a brief has
// nothing true to say.

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { slugify } from "./compile_deck.mjs";
import { BRIEF_TEMPLATE, DECK_FILE, DEFAULT_BRIEF, findProjectDir, readProjectConfig } from "./deck_paths.mjs";
import { loadFormat, roleOf } from "./formats.mjs";
import { readFrontmatter } from "./frontmatter.mjs";

const DEFAULT_FORMAT = "things-that-fixed";
const RUNNER = '"${CARTOON_SHORTS_HOME:-$HOME/.cache/cartoon-shorts}/engine/bin/slideshow.mjs"';
const RUNNER_COMMANDS = ["check", "guides", "render", "preview", "formats"];

function parseArguments(argv) {
  const options = { format: DEFAULT_FORMAT, brief: null, fromShort: null, slug: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--format") options.format = argv[++index];
    else if (argv[index] === "--brief") options.brief = argv[++index];
    else if (argv[index] === "--from-short") options.fromShort = argv[++index];
    else options.slug = argv[index];
  }
  if (!options.slug) throw new Error("usage: new_slideshow.sh [--format <name>] [--brief <path>] [--from-short <short>] <slug>");
  return options;
}

/** The brief to use; creates it from the template (and stops) when the default one does not exist yet. */
function requireBrief(projectDir, namedBrief) {
  const briefFile = namedBrief ? (isAbsolute(namedBrief) ? namedBrief : resolve(namedBrief)) : join(projectDir, DEFAULT_BRIEF);
  if (existsSync(briefFile)) return briefFile;
  if (namedBrief) throw new Error(`no brief at ${briefFile}`);
  mkdirSync(dirname(briefFile), { recursive: true });
  copyFileSync(BRIEF_TEMPLATE, briefFile);
  throw new Error(`created ${briefFile} from the template. Fill it in for this product, then run this again.`);
}

function starterSlide(format, roleName) {
  const role = roleOf(format, roleName) ?? { role: roleName, layout: "text" };
  if (role.layout === "end") return ["  - role: end"];
  const numberHint = role.numbered ? ["    # number: 1                 # its place in the list, drawn large above the line"] : [];
  const lines = [`  - role: ${role.role}`, ...numberHint, `    text: "TODO ${role.role} line${role.maxWords ? `, ${role.maxWords} words at most` : ""}"`];
  if (role.layout === "screenshot") {
    lines.push("    screenshot: TODO-real-capture.png", "    # crop: { x: 0, y: 0.2, w: 1, h: 0.3 }   # fractions of the screenshot; omit to show it whole");
  }
  return lines;
}

function deckMarkdown(format, briefFile, deckDir, usesDefaultBrief, fromShort) {
  const briefLine = usesDefaultBrief ? [] : [`brief: ${relative(deckDir, briefFile)}`];
  const shortLine = fromShort ? [`fromShort: ${fromShort}   # its captures are found by name, and scene: frames come from it`] : [];
  return [
    "---", `format: ${format.name}`, 'topic: "TODO what this slideshow is about, in one line"',
    'keyword: "TODO the search phrase that must sit in the caption\'s first 100 characters"',
    ...briefLine, ...shortLine, "cover: 1", "sound:", '  mood: "TODO the feel of the track to pick in TikTok"',
    "slides:", ...format.starter.flatMap((roleName) => starterSlide(format, roleName)), "---", "",
    "# Notes", "",
    "Where each claim on the slides comes from (the product's allowed-claims", "list), and anything a reviewer should know.", "",
  ].join("\n");
}

function packageJson(slug) {
  const scripts = Object.fromEntries(RUNNER_COMMANDS.map((command) => [command, `node ${RUNNER} ${command}`]));
  return JSON.stringify({
    name: slug, private: true,
    description: "One TikTok photo-mode slideshow. Runs on the shared cartoon-shorts engine (installed by the cartoon-shorts Claude Code plugin).",
    scripts,
  }, null, 2) + "\n";
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const projectDir = findProjectDir(process.cwd());
  const briefFile = requireBrief(projectDir, options.brief);
  const { data: brief } = readFrontmatter(briefFile);
  if (!brief.product?.name) throw new Error(`${briefFile}: product.name is missing`);
  const format = loadFormat(options.format, projectDir);
  const deckDir = join(projectDir, readProjectConfig(projectDir).slideshowsDir ?? "slideshows", slugify(brief.product.name), slugify(options.slug));
  if (existsSync(join(deckDir, DECK_FILE))) throw new Error(`already exists: ${deckDir}`);
  mkdirSync(deckDir, { recursive: true });
  writeFileSync(join(deckDir, DECK_FILE), deckMarkdown(format, briefFile, deckDir, !options.brief, options.fromShort));
  writeFileSync(join(deckDir, "package.json"), packageJson(slugify(options.slug)));
  writeFileSync(join(deckDir, ".gitignore"), "out/\n.public/\n.cache/\ngenerated/\n");
  console.log(`ready: ${deckDir} (${format.name})`);
  console.log(`next: cd ${deckDir}, write slideshow.md, then npm run check && npm run guides && npm run render`);
}

try {
  main();
} catch (error) {
  console.error(`new slideshow: ${error.message}`);
  process.exit(1);
}
