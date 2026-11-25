// The QR symbol for a URL, as rows of "0" (white) and "1" (black) modules,
// built here in Node so the renderer needs no QR library: the timeline
// carries the matrix and src/overlay/QrCard.tsx only paints it.
// Error correction M (about 15% of the symbol can be lost). No quiet zone in
// the matrix; the card adds four modules of white on every side.
// Encoder: uqr (MIT), a port of Project Nayuki's QR generator, loaded only
// when a short has a QR. The decode check (qr_decode_check.mjs) reads frames
// with a different library, so an encoder bug cannot hide behind a decoder
// with the same bug.

import { QR_MAX_VERSION } from "../../src/layout/qrGeometry.ts";
import { loadQrLibrary } from "./qr_library.mjs";

/** A URL too long for the card: a plain message for the person, not a crash. */
export class QrTooLargeError extends Error {}

/** @returns {Promise<{ version: number, size: number, rows: string[] }>} */
export async function qrMatrix(url) {
  const { encode } = await loadQrLibrary("uqr");
  const symbol = encode(url, { ecc: "M", boostEcc: false, border: 0 });
  if (symbol.version > QR_MAX_VERSION) {
    throw new QrTooLargeError(`the QR for ${url} needs version ${symbol.version}, above the card's limit of ${QR_MAX_VERSION}; shorten qr.baseUrl or the code`);
  }
  const rows = symbol.data.map((row) => row.map((dark) => (dark ? "1" : "0")).join(""));
  return { version: symbol.version, size: symbol.size, rows };
}
