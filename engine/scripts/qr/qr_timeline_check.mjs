// Is generated/timeline.json still right about the QR? The settings (the
// brief's qr block plus script.json "qr" and "qrCode") can change after the
// timeline was built; rendering or posting that timeline would put the
// wrong code, or a code that should not be there, in the video. `render`,
// `finish` and `qr` all ask this one question the same way.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isLocalTestUrl, localTestWarning } from "./qr_brief_rules.mjs";
import { resolveShortQr } from "./qr_project.mjs";

export const REBUILD_HINT = "rebuild the timeline (npm run timeline), then render again";

/** The short's generated timeline, or null before `npm run timeline`. */
export function readShortTimeline(shortDir) {
  const file = join(shortDir, "generated", "timeline.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

/** Seconds the card is fully visible in a timeline's qr. */
function fullyVisibleSeconds(qr, fps) {
  const fullFrom = Math.round(qr.startSec * fps) + qr.enterFrames;
  return (Math.round(qr.endSec * fps) - fullFrom) / fps;
}

/**
 * Why the timeline's QR does not match the settings ("on" or "off"), or null
 * when it does. Settings with status "error" are the caller's to report.
 */
export function qrTimelineMismatch(settings, timeline) {
  const qr = timeline?.qr;
  if (settings.status === "off") return qr ? `the QR is off now (${settings.reason}) but the timeline still has one for ${qr.url}` : null;
  if (!qr) return `the QR is on now (${settings.url}) but the timeline has none`;
  if (qr.code !== settings.code) return `the timeline's QR code is "${qr.code}" but the settings say "${settings.code}"`;
  if (qr.url !== settings.url) return `the timeline's QR is ${qr.url} but the settings say ${settings.url}`;
  if (qr.label !== settings.label) return `the timeline's QR label is "${qr.label}" but the settings say "${settings.label}"`;
  if (fullyVisibleSeconds(qr, timeline.fps) + 1e-9 < settings.minSeconds) return `the timeline shows the QR for ${fullyVisibleSeconds(qr, timeline.fps).toFixed(2)} s but qr.minSeconds is ${settings.minSeconds}`;
  return null;
}

/**
 * For `render` and `finish`: the settings and the timeline when they agree;
 * prints why and exits 1 when they do not, or when the settings have an error.
 */
export function qrStateOrExit(shortDir) {
  const script = JSON.parse(readFileSync(join(shortDir, "script.json"), "utf8"));
  const settings = resolveShortQr(shortDir, script);
  if (settings.warning) console.log(settings.warning);
  if (settings.status === "error") {
    console.error(`ERROR: ${settings.error}`);
    process.exit(1);
  }
  const timeline = readShortTimeline(shortDir);
  const mismatch = qrTimelineMismatch(settings, timeline);
  if (mismatch) {
    console.error(`ERROR: the timeline is out of date: ${mismatch}. Nothing was done; ${REBUILD_HINT}.`);
    process.exit(1);
  }
  if (timeline?.qr && isLocalTestUrl(timeline.qr.url)) console.log(localTestWarning(timeline.qr.url));
  return { settings, timeline };
}
