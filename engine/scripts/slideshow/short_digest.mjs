#!/usr/bin/env node
// Everything a finished short offers a slideshow, on one page:
//   short_digest.mjs <short folder or slug>
// its hook and spoken script, the notes its claims rest on, the real
// captures it used (with the crops its scenes already measured, ready to
// paste into a slide), and its saved caption-free frames. The skill reads
// this before proposing slideshows "from the short".

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { DEFAULT_BRIEF, findProjectDir, readProjectConfig } from "./deck_paths.mjs";
import { readFrontmatter } from "./frontmatter.mjs";
import { findShortDir } from "./scene_stills.mjs";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const spokenText = (line) => String(line.vo ?? line.text ?? "").replace(/\*/g, "");

function locateShort(shortName) {
  const projectDir = findProjectDir(process.cwd());
  const briefFile = join(projectDir, DEFAULT_BRIEF);
  const brief = existsSync(briefFile) ? readFrontmatter(briefFile).data : {};
  const shortsDirs = brief.shorts?.dirs ?? [readProjectConfig(projectDir).shortsDir ?? "shorts"];
  const shortDir = findShortDir(shortName, projectDir, shortsDirs);
  if (!shortDir) throw new Error(`no short "${shortName}" in ${shortsDirs.join(", ")}`);
  return shortDir;
}

/** Each real capture the short's shots show, with the crops its scenes used. */
function capturesUsed(script, shortDir) {
  const uses = new Map();
  for (const line of script.lines ?? []) {
    for (const shot of line.shots ?? []) {
      const source = shot.params?.src;
      if (typeof source !== "string") continue;
      const entry = uses.get(source) ?? { crops: new Set(), scenes: new Set() };
      if (shot.params.crop) entry.crops.add(JSON.stringify(shot.params.crop).replace(/"/g, "").replace(/,/g, ", ").replace(/:/g, ": "));
      entry.scenes.add(shot.scene);
      uses.set(source, entry);
    }
  }
  return [...uses.entries()].map(([source, entry]) => {
    const isRecording = /\.(mp4|mov|webm)$/i.test(source);
    const state = existsSync(join(shortDir, "public", source)) ? (isRecording ? "recording" : "screenshot") : "FILE MISSING";
    return `| \`${source}\` | ${state} | ${[...entry.crops].map((crop) => `\`${crop}\``).join("<br>") || "whole screen"} |`;
  });
}

function framesSection(shortDir) {
  const framesDir = join(shortDir, "frames");
  const saved = existsSync(framesDir) ? readdirSync(framesDir).filter((name) => name.startsWith("shot-")).sort() : [];
  if (!saved.length) return ["None saved yet. Run `npm run frames` in the short (it must still have its scenes)."];
  return [
    `${saved.length} saved in \`${framesDir}\`. Look at \`sheet.jpg\` before choosing: a frame has no captions, but it`,
    "still shows whatever signs, labels and app screens the scene itself draws. `index.md` says what each shows.",
    "Shots count from 0, so the number to write is the one in the file name.", "",
    ...saved.map((name) => `- \`${name}\`: \`scene: { shot: ${Number(/^shot-(\d+)/.exec(name)?.[1] ?? 0)} }\``),
  ];
}

function digestMarkdown(shortDir) {
  const script = readJson(join(shortDir, "script.json"));
  const spokenLines = (script.lines ?? []).map(spokenText).filter(Boolean);
  const captureRows = capturesUsed(script, shortDir);
  return [
    `# What the short "${basename(shortDir)}" offers a slideshow`, "",
    `Folder: \`${shortDir}\``, `Title: ${script.title ?? "(none)"}`, `Hook (first spoken line): ${spokenLines[0] ?? "(none)"}`, "",
    "## Spoken script", "", ...spokenLines.map((text, index) => `${index + 1}. ${text}`), "",
    "## Notes (what its claims rest on)", "", String(script.notes ?? "(none)"), "",
    "## Real captures it used", "",
    "A screenshot goes straight into a slide (`screenshot: <file>`). The crops were measured for the video's",
    "phone card, so use one as a starting point and tighten it on the guides. A recording needs one still",
    "taken from it first (ffmpeg, at the moment the scene shows); the still is a real capture too.", "",
    "| Capture | Kind | Crops its scenes used |", "|---|---|---|", ...(captureRows.length ? captureRows : ["| (none) | | |"]), "",
    "## Caption-free frames", "", ...framesSection(shortDir), "",
  ].join("\n");
}

try {
  const shortName = process.argv[2];
  if (!shortName) throw new Error("usage: short_digest.mjs <short folder or slug>");
  console.log(digestMarkdown(locateShort(shortName)));
} catch (error) {
  console.error(`short digest: ${error.message}`);
  process.exit(1);
}
