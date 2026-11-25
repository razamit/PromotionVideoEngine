// The QR checks around rendering and finishing, for bin/short.mjs.
//
// Only a postable render (full length, full size, to a named video file)
// started through `npm run render` or `npm run remotion -- render` is gated:
// the timeline must match the current QR settings, the QR's URL must answer
// 302, and only then does Remotion start with REMOTION_QR_VERIFIED set, the
// one thing that lets QrCard paint the real modules
// (src/overlay/qrVerification.ts). Afterwards the QR is decoded from the
// file; a file that fails is renamed so nobody posts it. Every other render
// (Studio, still, review, bubbles, --frames, --scale) makes no request and
// draws a placeholder in the card. A short without a QR skips all of this
// and renders exactly as before.
//
// `renderWith(remotionArgs, extraEnv)` runs the Remotion CLI and exits on
// failure; it is injected so this file never spawns anything itself.

import { existsSync, renameSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { postableRender } from "../remotion_args.mjs";
import { checkQrInVideo, describeDecode } from "./qr_decode_check.mjs";
import { qrStateOrExit, readShortTimeline } from "./qr_timeline_check.mjs";
import { checkRedirect, describeRedirect } from "./redirect_check.mjs";

/** Same name and value as src/overlay/qrVerification.ts (QR_VERIFIED_ENV, qrVerificationValue). */
export const QR_VERIFIED_ENV = "REMOTION_QR_VERIFIED";
export const qrVerificationValue = (qr) => JSON.stringify({ url: qr.url, modules: qr.modules.join(",") });

/** Stops with exit code 1, before anything is rendered, unless the URL answers 302 with a Location. */
async function redirectGateOrExit(url, fetchImpl) {
  const result = await checkRedirect(url, { fetchImpl });
  if (result.ok) return console.log(describeRedirect(result));
  console.error(describeRedirect(result, { beforeRender: true }));
  process.exit(1);
}

/** The decode check on a written file; on a failure the file is renamed *.QR-FAILED-do-not-post.* and the process exits 1. */
export async function decodeGateOrExit(file, timeline, step) {
  const result = await checkQrInVideo(file, timeline.qr, timeline.fps);
  (result.ok ? console.log : console.error)(describeDecode(result));
  if (result.ok) return;
  if (existsSync(file)) {
    const rejected = join(dirname(file), `${basename(file, extname(file))}.QR-FAILED-do-not-post${extname(file)}`);
    renameSync(file, rejected);
    console.error(`The ${step} file is NOT good to post. It was moved to ${rejected}; fix the QR, then render and finish again.`);
  }
  process.exit(1);
}

function placeholderNote(reason) {
  console.log(`qr: this render draws the QR placeholder, not the code, because ${reason}. No request was made and no decode check runs. Only npm run render to a full-size video file draws the real code.`);
}

/**
 * A render with the QR gate. `remotionArgs` start with "render".
 * `alwaysCheckTimeline`: the `render` command checks the timeline even for a
 * preview render; the pass-through checks it only for a postable one.
 */
export async function renderWithQrGate({ shortDir, remotionArgs, renderWith, alwaysCheckTimeline = false, fetchImpl = fetch }) {
  const timeline = alwaysCheckTimeline ? qrStateOrExit(shortDir).timeline : readShortTimeline(shortDir);
  if (!timeline?.qr) return renderWith(remotionArgs, {});
  const { output, reason } = postableRender(remotionArgs.slice(1));
  if (reason) {
    placeholderNote(reason);
    return renderWith(remotionArgs, {});
  }
  const checked = alwaysCheckTimeline ? timeline : qrStateOrExit(shortDir).timeline;
  await redirectGateOrExit(checked.qr.url, fetchImpl);
  renderWith(remotionArgs, { [QR_VERIFIED_ENV]: qrVerificationValue(checked.qr) });
  await decodeGateOrExit(resolve(shortDir, output), checked, "rendered");
}

/** `finish`: the timeline check first, then finish.sh (`runFinish`), then the decode check on the finished file. */
export async function finishWithQrCheck({ shortDir, files, runFinish }) {
  const { timeline } = qrStateOrExit(shortDir);
  runFinish(files);
  if (!timeline?.qr) return;
  if (!files[1]) return console.log("qr decode: not run, because finish was given no output file");
  await decodeGateOrExit(resolve(shortDir, files[1]), timeline, "finished");
}
