// social_text.md for a short with a QR must exist and carry the QR's URL
// and the brief's qr.socialLine (people who cannot scan the code need the
// line, and the person posting needs the URL). The file is written by hand
// from references/publishing.md; this checks only those two things, word
// for word: the URL as a whole (not followed by a letter, digit or dash, so
// .../st/ep1 is not found inside .../st/ep10) and the social line.

import { existsSync, readFileSync } from "node:fs";

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** True when `url` appears in `text` and is not the start of a longer code. */
export function containsWholeUrl(text, url) {
  return new RegExp(`${escapeRegExp(url)}(?![A-Za-z0-9-])`).test(text);
}

/**
 * Pure check on the file's text (null when there is no file yet).
 * @returns {{ status: "no-file" } | { status: "ok" } | { status: "missing", missing: string[] }}
 */
export function checkQrSocialText(text, { url, socialLine }) {
  if (text === null) return { status: "no-file" };
  const missing = [];
  if (!containsWholeUrl(text, url)) missing.push(`the QR URL ${url}`);
  if (!text.includes(socialLine)) missing.push(`the brief's qr.socialLine "${socialLine}"`);
  return missing.length ? { status: "missing", missing } : { status: "ok" };
}

export function checkQrSocialFile(file, expected) {
  const text = existsSync(file) ? readFileSync(file, "utf8") : null;
  const result = checkQrSocialText(text, expected);
  return { file, ok: result.status === "ok", ...result };
}

export function describeSocialCheck(result) {
  if (result.status === "no-file") return `ERROR: ${result.file} does not exist. Write it first (the URL and the social line, references/publishing.md), then run npm run qr again.`;
  if (result.status === "ok") return `qr social text: ${result.file} has the URL and the social line`;
  return `ERROR: ${result.file} is missing ${result.missing.join(" and ")}`;
}
