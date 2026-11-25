// The QR part of `npm run timeline` (build_timeline.mjs calls these):
// before any voice is made, resolve the settings and build and check the
// QR (so a bad brief or a URL too long for the card stops it early); once
// the shots are timed, add `qr` to the timeline and hold the last shot if
// it is too short. A short without a QR prints nothing here.

import { existsSync } from "node:fs";
import { qrCardLayout, qrLayoutProblems } from "../../src/layout/qrGeometry.ts";
import { publicFile } from "../paths.mjs";
import { durationOf } from "../voice_engines.mjs";
import { isLocalTestUrl, localTestWarning } from "./qr_brief_rules.mjs";
import { planQrWindow, QR_ENTER_FRAMES } from "./qr_hold.mjs";
import { QrLibraryMissingError } from "./qr_library.mjs";
import { qrMatrix, QrTooLargeError } from "./qr_matrix.mjs";
import { resolveShortQr } from "./qr_project.mjs";
import { describeQrSettings } from "./qr_settings.mjs";
import { duplicateCodeWarnings } from "./qr_siblings.mjs";
import { storeQrCode } from "./script_code_insert.mjs";

function exitWith(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

/** The matrix for the URL and the card it makes, or a plain error and exit 1. */
async function checkedMatrix(settings) {
  let matrix;
  try {
    matrix = await qrMatrix(settings.url);
  } catch (problem) {
    if (problem instanceof QrTooLargeError || problem instanceof QrLibraryMissingError) exitWith(problem.message);
    throw problem;
  }
  const problems = qrLayoutProblems(qrCardLayout(matrix.size, settings.label), settings.label);
  if (problems.length) exitWith(`the QR card for ${settings.url} does not fit its limits: ${problems.join("; ")}`);
  return matrix;
}

/**
 * Resolves and prints the QR settings, saves a derived code, warns about a
 * test URL or a code another short uses, and builds the matrix. Stops the
 * timeline on any error. Returns { settings, matrix } (matrix null when off).
 */
export async function qrPlanOrExit(shortDir, script, scriptPath) {
  const settings = resolveShortQr(shortDir, script);
  if (settings.warning) console.log(settings.warning);
  if (settings.status === "error") exitWith(settings.error);
  if (settings.status === "off") {
    if (!settings.silent) console.log(describeQrSettings(settings));
    return { settings, matrix: null };
  }
  console.log(describeQrSettings(settings));
  if (settings.codeSource === "derived") storeQrCode(scriptPath, settings.code);
  if (isLocalTestUrl(settings.url)) console.log(localTestWarning(settings.url));
  for (const warning of duplicateCodeWarnings(shortDir, settings.code)) console.log(warning);
  return { settings, matrix: await checkedMatrix(settings) };
}

/** Length of the music file in seconds, or null when it is not there yet. */
function musicFileSeconds(file) {
  const path = publicFile(file);
  return existsSync(path) ? durationOf(path) : null;
}

/**
 * A fixed (non-looping) bed shorter than the held short would stop dead
 * before the end; its length goes in the timeline so the fade-out lands on
 * the file's end instead (src/short/musicDuck.ts).
 */
function musicForHold(music, holdFrames, totalSeconds, secondsOf) {
  if (!music || music.loop || holdFrames === 0) return music;
  const fileSeconds = secondsOf(music.file);
  return fileSeconds !== null && fileSeconds < totalSeconds ? { ...music, fileSeconds } : music;
}

/**
 * @param {{ settings: Record<string, any>, matrix: { version: number, size: number, rows: string[] } | null }} plan from qrPlanOrExit
 * @returns {{ qr: Record<string, unknown> | null, durationInFrames: number, music: Record<string, unknown> | null }}
 * Moves the last shot's end when the hold applies.
 */
export function addQrToTimeline({ settings, matrix }, { shots, fps, durationInFrames, music }, secondsOf = musicFileSeconds) {
  if (settings.status !== "on") return { qr: null, durationInFrames, music };
  const last = shots[shots.length - 1];
  const window = planQrWindow({ lastShotStartSec: last.start, lastShotEndSec: last.end, durationInFrames, fps, minSeconds: settings.minSeconds });
  last.end = window.lastShotEndSec;
  const fullSeconds = (window.endFrame - window.fullFrom) / fps;
  const held = window.holdFrames ? `, last shot held ${window.holdFrames} frames to reach ${settings.minSeconds}s` : "";
  console.log(`qr: version ${matrix.version} (${matrix.size} modules), on screen ${(window.startFrame / fps).toFixed(2)}-${(window.endFrame / fps).toFixed(2)}s, fully visible ${fullSeconds.toFixed(2)}s${held}`);
  const qr = {
    code: settings.code,
    url: settings.url,
    label: settings.label,
    version: matrix.version,
    modules: matrix.rows,
    startSec: window.startFrame / fps,
    endSec: window.endFrame / fps,
    enterFrames: QR_ENTER_FRAMES,
    holdFrames: window.holdFrames,
  };
  const heldMusic = musicForHold(music, window.holdFrames, window.durationInFrames / fps, secondsOf);
  return { qr, durationInFrames: window.durationInFrames, music: heldMusic };
}

/**
 * The last shot of a QR short with spoken words and captions on: the
 * captions are moved above the card (src/captions/keepAbove.ts); say so.
 */
export function lastShotCaptionWarning(timeline) {
  const { qr, shots, words, lines = [] } = timeline;
  if (!qr) return null;
  const last = shots[shots.length - 1];
  if (last.hideCaptions) return null;
  const captioned = (word) => (lines[word.line]?.caption ?? "line") !== "none";
  const spoken = words.filter((word) => word.end > qr.startSec && word.start < qr.endSec && captioned(word));
  if (spoken.length === 0) return null;
  return `WARNING: the last shot has spoken words ("${spoken.map((word) => word.text).join(" ").slice(0, 60)}") and shows captions; they were moved above the QR card, where the end scene's own words usually are. Set "hideCaptions": true on that shot unless the scene leaves room there.`;
}
