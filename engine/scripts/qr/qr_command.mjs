// `npm run qr [file]` inside a short: every QR check in one go, the last
// step before a short with a QR is handed over for posting.
//   1. the settings (brief qr block, script.json qr / qrCode) agree with the
//      timeline (qr_timeline_check.mjs, the same test render and finish use)
//   2. the redirect: one GET to the QR's URL answers 302 with a Location
//   3. the decode: the QR in out/short_final.mp4 (else out/short.mp4, or
//      [file]) reads back as the URL; a placeholder render fails here
//   4. social_text.md exists and carries the URL (as a whole) and the
//      brief's socialLine word for word
// It also warns when the URL is a local test address or another short in
// the shorts folder uses the same code. Exit code 1 when any check fails;
// "all checks passed" only when all four ran and passed.

import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { isLocalTestUrl, localTestWarning } from "./qr_brief_rules.mjs";
import { checkQrInVideo, describeDecode } from "./qr_decode_check.mjs";
import { resolveShortQr } from "./qr_project.mjs";
import { describeQrSettings } from "./qr_settings.mjs";
import { duplicateCodeWarnings } from "./qr_siblings.mjs";
import { checkQrSocialFile, describeSocialCheck } from "./qr_social_check.mjs";
import { qrTimelineMismatch, readShortTimeline, REBUILD_HINT } from "./qr_timeline_check.mjs";
import { checkRedirect, describeRedirect } from "./redirect_check.mjs";

/** Step 1. Returns { off } for a short without a QR, { failed } on a problem, else { timeline, settings }. */
function settingsStep(shortDir) {
  const script = JSON.parse(readFileSync(join(shortDir, "script.json"), "utf8"));
  const settings = resolveShortQr(shortDir, script);
  if (settings.warning) console.log(settings.warning);
  console.log(describeQrSettings(settings));
  if (settings.status === "error") return { failed: true };
  const timeline = readShortTimeline(shortDir);
  const mismatch = qrTimelineMismatch(settings, timeline);
  if (mismatch) {
    console.error(`ERROR: the timeline is out of date: ${mismatch}; ${REBUILD_HINT}.`);
    return { failed: true };
  }
  return settings.status === "off" ? { off: true } : { timeline, settings };
}

function videoToCheck(shortDir, fileArg) {
  if (fileArg) return isAbsolute(fileArg) ? fileArg : resolve(shortDir, fileArg);
  const finished = join(shortDir, "out", "short_final.mp4");
  return existsSync(finished) ? finished : join(shortDir, "out", "short.mp4");
}

/** Step 3. */
async function decodeStep(shortDir, fileArg, timeline) {
  const file = videoToCheck(shortDir, fileArg);
  if (!existsSync(file)) {
    console.error(`ERROR: ${file} does not exist; render it with npm run render first`);
    return false;
  }
  const result = await checkQrInVideo(file, timeline.qr, timeline.fps);
  (result.ok ? console.log : console.error)(describeDecode(result));
  return result.ok;
}

function printWarnings(shortDir, qr) {
  if (isLocalTestUrl(qr.url)) console.log(localTestWarning(qr.url));
  for (const warning of duplicateCodeWarnings(shortDir, qr.code)) console.log(warning);
}

/** @returns {Promise<number>} the exit code */
export async function runQrCommand(shortDir, fileArg, fetchImpl = fetch) {
  const step = settingsStep(shortDir);
  if (step.off) {
    console.log("qr: this short has no QR card; nothing to check");
    return 0;
  }
  if (step.failed) return 1;
  printWarnings(shortDir, step.timeline.qr);
  const redirect = await checkRedirect(step.timeline.qr.url, { fetchImpl });
  (redirect.ok ? console.log : console.error)(describeRedirect(redirect));
  const decoded = await decodeStep(shortDir, fileArg, step.timeline);
  const social = checkQrSocialFile(join(shortDir, "social_text.md"), step.settings);
  (social.ok ? console.log : console.error)(describeSocialCheck(social));
  const passed = redirect.ok && decoded && social.ok;
  console.log(passed ? "qr: all checks passed (settings, redirect, decode, social_text.md)" : "qr: FAILED; do not post this short until the errors above are fixed");
  return passed ? 0 : 1;
}
