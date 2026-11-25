// After a render (and again after finish): take one frame from the middle of
// the QR's fully visible window, as raw RGBA from ffmpeg, decode the QR in it
// and compare the text with the timeline's qr.url. This catches anything
// between the matrix and the file: the overlay, the encoder's compression,
// a stale timeline, a render that drew the placeholder instead of the code.
// The decoder reads the card's own rectangle first (src/layout/qrGeometry.ts,
// scaled to the video's width), so a busy scene around it cannot confuse it,
// and the whole frame only when that finds nothing. Decoder: qr (paulmillr,
// MIT or Apache-2.0), loaded only when a check runs, independent of the
// encoder that built the matrix (uqr).

import { execFileSync } from "node:child_process";
import { QR_PLACEHOLDER_FILL, qrCardLayout } from "../../src/layout/qrGeometry.ts";
import { qrCheckSeconds } from "./qr_hold.mjs";
import { loadQrLibrary } from "./qr_library.mjs";

const FRAME_BYTES_LIMIT = 256 * 1024 * 1024;
const DESIGN_WIDTH = 1080;
/** Retries the decoder may spend on one image; the default is one 60 fps frame. */
const DECODE_TIME_LIMIT_MS = 2000;
/** Channel distance from QR_PLACEHOLDER_FILL that still counts as the placeholder panel after compression. */
const PLACEHOLDER_TOLERANCE = 24;
/** Share of the symbol's rectangle in the placeholder colour that marks a placeholder render (its text covers the rest). */
const PLACEHOLDER_SHARE = 0.5;

/** Width and height of the first video stream. */
export function videoSize(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", file], { encoding: "utf8" });
  const [width, height] = out.trim().split("x").map(Number);
  return { width, height };
}

/** One frame at `seconds` as RGBA bytes. */
export function frameRgba(file, seconds) {
  const { width, height } = videoSize(file);
  const args = ["-v", "error", "-ss", seconds.toFixed(4), "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-"];
  const pixels = execFileSync("ffmpeg", args, { maxBuffer: FRAME_BYTES_LIMIT });
  if (pixels.length !== width * height * 4) throw new Error(`ffmpeg returned ${pixels.length} bytes for a ${width}x${height} frame`);
  return { width, height, data: new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.length) };
}

/** A rectangle of the design frame (1080 wide) in this image's pixels, clipped to the image. */
export function scaledRect(rect, image) {
  const k = image.width / DESIGN_WIDTH;
  const left = Math.max(0, Math.floor(rect.left * k));
  const top = Math.max(0, Math.floor(rect.top * k));
  return { left, top, right: Math.min(image.width, Math.ceil(rect.right * k)), bottom: Math.min(image.height, Math.ceil(rect.bottom * k)) };
}

/** The pixels inside `rect` as an image of their own. */
export function cropImage(image, rect) {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const from = ((rect.top + y) * image.width + rect.left) * 4;
    data.set(image.data.subarray(from, from + width * 4), y * width * 4);
  }
  return { width, height, data };
}

/** True when most of `rect` is the placeholder panel's colour: the frame came from a render that was not verified. */
export function looksLikePlaceholder(image, rect) {
  const [r, g, b] = QR_PLACEHOLDER_FILL.rgb;
  let inside = 0;
  let matching = 0;
  for (let y = rect.top; y < rect.bottom; y += 2) {
    for (let x = rect.left; x < rect.right; x += 2) {
      const i = (y * image.width + x) * 4;
      inside += 1;
      const near = Math.abs(image.data[i] - r) <= PLACEHOLDER_TOLERANCE && Math.abs(image.data[i + 1] - g) <= PLACEHOLDER_TOLERANCE && Math.abs(image.data[i + 2] - b) <= PLACEHOLDER_TOLERANCE;
      if (near) matching += 1;
    }
  }
  return inside > 0 && matching / inside >= PLACEHOLDER_SHARE;
}

/** The decoded text of the one QR in an RGBA image, or null when none is found. */
export function decodeImage(image, decode) {
  try {
    return decode(image, { format: "RGBA", timeLimit: DECODE_TIME_LIMIT_MS });
  } catch {
    return null;
  }
}

/** The card first, the whole frame only when the card gives nothing. */
export function decodeFrame(image, qr, decode) {
  const layout = qrCardLayout(qr.modules.length, qr.label);
  const fromCard = decodeImage(cropImage(image, scaledRect(layout.card, image)), decode);
  if (fromCard !== null) return { read: fromCard, region: "card" };
  const fromFrame = decodeImage(image, decode);
  if (fromFrame !== null) return { read: fromFrame, region: "frame" };
  return { read: null, region: null, placeholder: looksLikePlaceholder(image, scaledRect(layout.symbol, image)) };
}

/**
 * @param {string} file the video
 * @param {{ url: string, label: string, modules: string[], startSec: number, endSec: number, enterFrames: number }} qr the timeline's qr
 * @param {number} fps
 */
export async function checkQrInVideo(file, qr, fps) {
  const seconds = qrCheckSeconds(qr, fps);
  let found = { read: null, region: null, placeholder: false };
  let problem = null;
  try {
    const { decodeQR } = await loadQrLibrary("qr/decode.js");
    found = decodeFrame(frameRgba(file, seconds), qr, decodeQR);
  } catch (error) {
    problem = `could not check the frame (${error.message})`;
  }
  return { ok: found.read === qr.url, file, seconds, expected: qr.url, problem, ...found };
}

export function describeDecode(result) {
  const where = `${result.file} at ${result.seconds.toFixed(2)} s`;
  if (result.ok) return `qr decode: ${where} reads ${result.read}`;
  if (result.placeholder) {
    return `ERROR: QR decode check failed for ${where}: the frame shows the QR placeholder, not the code. This video was not rendered through npm run render, or not for this short's own timeline (Studio, review, bubbles, a partial or scaled render and a --props override all draw the placeholder). Render it with npm run render.`;
  }
  const read = result.problem ?? (result.read === null ? "no QR code could be decoded" : `read "${result.read}"`);
  return `ERROR: QR decode check failed for ${where}: ${read}; expected "${result.expected}".`;
}
