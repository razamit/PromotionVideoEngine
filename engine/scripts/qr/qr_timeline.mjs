// The QR part of `npm run timeline` (build_timeline.mjs calls these):
// before any voice is made, resolve the settings and build and check the
// QR (so a bad brief or a URL too long for the card stops it early) and
// say which shot carries it (qr_shot.mjs); once the shots are timed, add
// `qr` to the timeline and hold that shot if it is too short (at the end
// for the last shot, at its cut for an earlier one: qr_middle_hold.mjs).
// A short without a QR prints nothing here.

import { existsSync } from "node:fs";
import { qrCardLayout, qrLayoutProblems } from "../../src/layout/qrGeometry.ts";
import { publicFile } from "../paths.mjs";
import { durationOf } from "../voice_engines.mjs";
import { isLocalTestUrl, localTestWarning } from "./qr_brief_rules.mjs";
import { planQrWindow, QR_ENTER_FRAMES } from "./qr_hold.mjs";
import { QrLibraryMissingError } from "./qr_library.mjs";
import { qrMatrix, QrTooLargeError } from "./qr_matrix.mjs";
import { holdInMiddle } from "./qr_middle_hold.mjs";
import { resolveShortQr } from "./qr_project.mjs";
import { describeQrSettings } from "./qr_settings.mjs";
import { describeQrShot, qrShotIndexOf } from "./qr_shot.mjs";
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
  console.log(describeQrShot(settings.shot, script.lines));
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

/** The last shot carries the card: the window and hold of 1.4.0, frames added at the end. */
function holdAtEnd({ shots, fps, durationInFrames }, minSeconds) {
  const last = shots[shots.length - 1];
  const window = planQrWindow({ lastShotStartSec: last.start, lastShotEndSec: last.end, durationInFrames, fps, minSeconds });
  last.end = window.lastShotEndSec;
  return { window, durationInFrames: window.durationInFrames, voHold: null };
}

function describeWindow(matrix, window, fps, settings, isLast) {
  const fullSeconds = (window.endFrame - window.fullFrom) / fps;
  const held = !window.holdFrames ? ""
    : isLast ? `, last shot held ${window.holdFrames} frames to reach ${settings.minSeconds}s`
      : `, QR shot held ${window.holdFrames} frames at its cut to reach ${settings.minSeconds}s; every later shot, line and word starts ${(window.holdFrames / fps).toFixed(3)}s later`;
  return `qr: version ${matrix.version} (${matrix.size} modules), on screen ${(window.startFrame / fps).toFixed(2)}-${(window.endFrame / fps).toFixed(2)}s, fully visible ${fullSeconds.toFixed(2)}s${held}`;
}

/**
 * @param {{ settings: Record<string, any>, matrix: { version: number, size: number, rows: string[] } | null }} plan from qrPlanOrExit
 * @param {{ shots: any[], words: any[], lines: any[], fps: number, durationInFrames: number, music: Record<string, unknown> | null }} laidOut
 * @returns {{ qr: Record<string, unknown> | null, durationInFrames: number, music: Record<string, unknown> | null, voHold: { lineIndex: number, seconds: number } | null }}
 * Moves the QR shot's end, and for an earlier shot everything after it, when the hold applies.
 * `qr.shotIndex` is written only when the card is not on the last shot, so a 1.4.0 timeline reads the same.
 */
export function addQrToTimeline({ settings, matrix }, laidOut, secondsOf = musicFileSeconds) {
  const { fps, durationInFrames, music } = laidOut;
  if (settings.status !== "on") return { qr: null, durationInFrames, music, voHold: null };
  const isLast = settings.shot.index === laidOut.shots.length - 1;
  const placed = isLast ? holdAtEnd(laidOut, settings.minSeconds) : holdInMiddle(laidOut, settings.shot, settings.minSeconds);
  if (placed.error) exitWith(placed.error);
  const { window } = placed;
  console.log(describeWindow(matrix, window, fps, settings, isLast));
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
    ...(isLast ? {} : { shotIndex: settings.shot.index }),
  };
  const heldMusic = musicForHold(music, window.holdFrames, placed.durationInFrames / fps, secondsOf);
  return { qr, durationInFrames: placed.durationInFrames, music: heldMusic, voHold: placed.voHold };
}

/**
 * The QR shot of a short, with spoken words and captions on: the captions
 * are moved above the card while it is up (src/captions/keepAbove.ts); say so.
 */
export function qrShotCaptionWarning(timeline) {
  const { qr, shots, words, lines = [] } = timeline;
  if (!qr) return null;
  const qrShot = shots[qrShotIndexOf(timeline)];
  if (qrShot.hideCaptions) return null;
  const captioned = (word) => (lines[word.line]?.caption ?? "line") !== "none";
  const spoken = words.filter((word) => word.end > qr.startSec && word.start < qr.endSec && captioned(word));
  if (spoken.length === 0) return null;
  const which = qr.shotIndex === undefined ? "the last shot" : `the QR shot #${qrShot.index} (${qrShot.scene})`;
  return `WARNING: ${which} has spoken words ("${spoken.map((word) => word.text).join(" ").slice(0, 60)}") and shows captions; they were moved above the QR card, where the end scene's own words usually are. Set "hideCaptions": true on that shot unless the scene leaves room there.`;
}
