// A slide can use a frame from one of the product's cartoon shorts as its
// picture (`scene: { short: <slug>, shot: 7 }`). This finds that frame:
//
//   1. in the short's saved frames/ folder (made by `npm run frames` there,
//      and kept when the short is trimmed after release);
//   2. else, while the short can still be rendered, by having the short add
//      that shot to its frames/ folder, so the next slideshow finds it;
//   3. for an exact moment (`at:` or `frame:`), by rendering it into the
//      slideshow's own cache.
//
// A short that has no saved frame and can no longer be rendered blocks the
// slide with the reason; nothing is substituted.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";
import { ENGINE_DIR } from "./deck_paths.mjs";
import { frameOfShot } from "./scene_frame_picks.mjs";

const SHORT_RUNNER = join(ENGINE_DIR, "bin", "short.mjs");
const NEEDED_TO_RENDER = ["script.json", join("scenes", "registry.ts"), join("generated", "timeline.json")];

/** The short's folder: a path, or a folder name inside one of the product's shorts folders. */
export function findShortDir(shortName, projectDir, shortsDirs) {
  const candidates = isAbsolute(shortName)
    ? [shortName]
    : [...shortsDirs.map((folder) => resolve(projectDir, folder, shortName)), resolve(projectDir, shortName)];
  return candidates.find((folder) => existsSync(join(folder, "script.json")) || existsSync(join(folder, "frames"))) ?? null;
}

function savedFrame(shortDir, shotIndex) {
  const framesDir = join(shortDir, "frames");
  if (!existsSync(framesDir)) return null;
  const prefix = `shot-${String(shotIndex).padStart(2, "0")}-`;
  const name = readdirSync(framesDir).find((file) => file.startsWith(prefix) && file.endsWith(".jpg"));
  return name ? join(framesDir, name) : null;
}

function runShortFrames(shortDir, frameArguments) {
  const result = spawnSync(process.execPath, [SHORT_RUNNER, "frames", ...frameArguments], {
    cwd: shortDir, env: { ...process.env, SHORT_DIR: shortDir }, stdio: ["ignore", "ignore", "inherit"],
  });
  return result.status === 0;
}

const cannotRender = (shortDir) => NEEDED_TO_RENDER.filter((file) => !existsSync(join(shortDir, file)));

/** A frame at an exact moment, rendered into the slideshow's cache. */
function exactFrame(sceneRef, shortDir, cacheDir) {
  const timeline = JSON.parse(readFileSync(join(shortDir, "generated", "timeline.json"), "utf8"));
  const shot = timeline.shots.find((entry) => entry.index === sceneRef.shot);
  if (typeof sceneRef.frame !== "number" && !shot) return { blocked: `shot ${sceneRef.shot} is not in ${basename(shortDir)}` };
  const frame = typeof sceneRef.frame === "number" ? sceneRef.frame : frameOfShot(shot, timeline.fps, sceneRef.at);
  mkdirSync(cacheDir, { recursive: true });
  const cachedFile = join(cacheDir, `${basename(shortDir)}-frame${frame}.png`);
  if (existsSync(cachedFile)) return { file: cachedFile };
  console.log(`scene: rendering frame ${frame} of ${basename(shortDir)} (cached afterwards)`);
  return runShortFrames(shortDir, ["--frame", String(frame), "--out", cachedFile]) && existsSync(cachedFile)
    ? { file: cachedFile }
    : { blocked: `scene from ${basename(shortDir)}: the frame did not render` };
}

/**
 * @param {{ short?: string, shot?: number, at?: number, frame?: number }} sceneRef
 * @param {{ projectDir: string, shortsDirs: string[], cacheDir: string, defaultShort?: string }} context
 * @returns {{ file: string } | { blocked: string }}
 */
export function sceneStillFor(sceneRef, context) {
  const shortName = sceneRef?.short ?? context.defaultShort;
  if (!shortName) return { blocked: "scene needs a short: <slug> and a shot: <number>" };
  const shortDir = findShortDir(shortName, context.projectDir, context.shortsDirs);
  if (!shortDir) return { blocked: `missing short: ${shortName} (looked in ${context.shortsDirs.join(", ")})` };
  const wantsExactMoment = typeof sceneRef.at === "number" || typeof sceneRef.frame === "number";
  const saved = wantsExactMoment ? null : savedFrame(shortDir, sceneRef.shot);
  if (saved) return { file: saved };
  const missing = cannotRender(shortDir);
  if (missing.length) {
    return { blocked: `short ${shortName} has no saved frame for shot ${sceneRef.shot} and cannot be rendered any more (no ${missing.join(", ")})` };
  }
  if (wantsExactMoment) return exactFrame(sceneRef, shortDir, context.cacheDir);
  console.log(`scene: adding shot ${sceneRef.shot} to ${basename(shortDir)}/frames`);
  runShortFrames(shortDir, ["--shots", String(sceneRef.shot)]);
  const added = savedFrame(shortDir, sceneRef.shot);
  return added ? { file: added } : { blocked: `scene from ${shortName}: shot ${sceneRef.shot} did not render` };
}
