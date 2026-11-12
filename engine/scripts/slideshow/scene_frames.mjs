#!/usr/bin/env node
// Saves caption-free frames of a short's scenes, for slideshows to use as
// slide pictures. Run through the short's runner, from inside the short:
//
//   npm run frames                      a handful (one per scene) into frames/
//   npm run frames -- --all             one per shot
//   npm run frames -- --shots 2,7,12    add these shots to frames/
//   npm run frames -- --frame 306 --out /abs/file.png    one exact frame, anywhere
//
// frames/ holds the JPEGs, an index.md that says what each one shows, and a
// contact sheet. It is meant to be kept when the short is trimmed after
// release, so a posted short can still feed slideshows.

import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { ENGINE_DIR } from "./deck_paths.mjs";
import { frameFileName, frameOfShot, handfulOfShots, shotsByIndex, spokenDuring } from "./scene_frame_picks.mjs";

const SHORT_DIR = resolve(process.env.SHORT_DIR ?? process.cwd());
const SCENE_STILL_ENTRY = join(ENGINE_DIR, "src", "slideshow", "sceneStill", "index.ts");
const FRAMES_DIR = join(SHORT_DIR, "frames");
const JPEG_QUALITY = 88;
const SHEET_COLUMNS = 6;
// three.js scenes need a real GL backend in headless Chrome, as in remotion.config.ts.
const CHROMIUM_OPTIONS = { gl: "angle" };

function parseArguments(argv) {
  const options = { publicDir: null, all: false, shots: null, frame: null, out: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument.startsWith("--public-dir=")) options.publicDir = argument.slice("--public-dir=".length);
    else if (argument === "--all") options.all = true;
    else if (argument === "--shots") options.shots = argv[++index].split(",").map(Number);
    else if (argument === "--frame") options.frame = Number(argv[++index]);
    else if (argument === "--out") options.out = resolve(SHORT_DIR, argv[++index]);
  }
  return options;
}

/** The same "@short" and "@engine" wiring the video render uses (remotion.config.ts), for a bundle made in code. */
function wireShortIntoBundle(config) {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: { ...(config.resolve?.alias ?? {}), "@short": SHORT_DIR, "@engine": join(ENGINE_DIR, "src") },
      modules: [...(config.resolve?.modules ?? ["node_modules"]), join(ENGINE_DIR, "node_modules")],
    },
  };
}

/** Renders each { frame, file } with one bundle and one browser. */
async function renderFrames(jobs, publicDir) {
  process.chdir(ENGINE_DIR); // Remotion looks for its browser beside the nearest package.json
  const serveUrl = await bundle({ entryPoint: SCENE_STILL_ENTRY, publicDir, webpackOverride: wireShortIntoBundle });
  const browser = await openBrowser("chrome", { chromiumOptions: CHROMIUM_OPTIONS });
  try {
    const composition = await selectComposition({ serveUrl, id: "SceneStill", puppeteerInstance: browser, chromiumOptions: CHROMIUM_OPTIONS });
    for (const job of jobs) {
      const isJpeg = /\.jpe?g$/i.test(job.file);
      await renderStill({
        composition, serveUrl, frame: job.frame, output: job.file, puppeteerInstance: browser, chromiumOptions: CHROMIUM_OPTIONS,
        imageFormat: isJpeg ? "jpeg" : "png", ...(isJpeg ? { jpegQuality: JPEG_QUALITY } : {}), overwrite: true,
      });
    }
  } finally {
    await browser.close({ silent: true });
  }
}

function writeIndex(timeline) {
  const saved = readdirSync(FRAMES_DIR).filter((name) => /^shot-\d+-.*\.jpg$/.test(name)).sort();
  const rows = saved.map((name, position) => {
    const shot = timeline.shots.find((entry) => frameFileName(entry) === name);
    if (!shot) return `| ${position + 1} | \`${name}\` | | | | (shot no longer in the timeline) |`;
    const params = JSON.stringify(shot.params ?? {}).replace(/\|/g, "/");
    return `| ${position + 1} | \`${name}\` | ${shot.index} | ${shot.scene} | ${spokenDuring(shot, timeline)} | \`${params}\` |`;
  });
  writeFileSync(join(FRAMES_DIR, "index.md"), [
    `# Frames from ${basename(SHORT_DIR)}`, "",
    "Frames of this short's scenes with no captions on them, for slideshows",
    "(`scene: { short: <this folder>, shot: <number> }`). Made by `npm run frames`.",
    "Keep this folder when the short is trimmed after release: without it a",
    `posted short cannot feed a slideshow. \`sheet.jpg\` shows them in this order, ${SHEET_COLUMNS} to a row.`, "",
    "| # | File | Shot | Scene | Spoken during the shot | Scene settings |", "|---|---|---|---|---|---|", ...rows, "",
  ].join("\n"));
  return saved.length;
}

function writeContactSheet(frameCount) {
  const rows = Math.ceil(frameCount / SHEET_COLUMNS);
  spawnSync("ffmpeg", [
    "-v", "error", "-y", "-pattern_type", "glob", "-i", join(FRAMES_DIR, "shot-*.jpg"),
    "-vf", `scale=270:-1,tile=${SHEET_COLUMNS}x${rows}`, "-frames:v", "1", join(FRAMES_DIR, "sheet.jpg"),
  ], { stdio: "ignore" }); // the sheet is a convenience; without ffmpeg the frames and the index are still written
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const timelineFile = join(SHORT_DIR, "generated", "timeline.json");
  if (!existsSync(timelineFile)) throw new Error("no generated/timeline.json; run npm run timeline first");
  if (!options.publicDir) throw new Error("run this through the short's runner: npm run frames");
  const timeline = JSON.parse(readFileSync(timelineFile, "utf8"));
  if (options.frame !== null) {
    if (!options.out) throw new Error("--frame needs --out <file>");
    await renderFrames([{ frame: options.frame, file: options.out }], options.publicDir);
    return;
  }
  const shots = options.shots ? shotsByIndex(timeline, options.shots) : options.all ? timeline.shots : handfulOfShots(timeline);
  mkdirSync(FRAMES_DIR, { recursive: true });
  await renderFrames(shots.map((shot) => ({ frame: frameOfShot(shot, timeline.fps), file: join(FRAMES_DIR, frameFileName(shot)) })), options.publicDir);
  const frameCount = writeIndex(timeline);
  writeContactSheet(frameCount);
  console.log(`frames: ${shots.length} rendered, ${frameCount} in ${FRAMES_DIR}`);
}

main().catch((error) => {
  console.error(`frames: ${error.message}`);
  process.exit(1);
});
