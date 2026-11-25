// Writes a derived QR code back into script.json as its first key, so the
// code stays fixed if the folder is renamed later. The edit is a text insert
// right after the opening brace, in the file's own indentation: every other
// byte stays as it was. It is only kept when parsing the result gives the
// original object with "qrCode" added in front; otherwise the file is left
// alone and the caller prints the line to add by hand.

import { readFileSync, writeFileSync } from "node:fs";

const OPENING = /^(﻿?\s*)\{(\s*)/;

/** The line a person would add by hand. */
export const qrCodeLine = (code) => `"qrCode": "${code}",`;

/** Same keys in the same order with the same values. */
function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * @param {string} text script.json as read
 * @param {string} code a valid code (qr_code_name.mjs)
 * @returns {{ ok: true, text: string } | { ok: false, reason: string }}
 */
export function insertQrCodeKey(text, code) {
  let original;
  try {
    original = JSON.parse(text.replace(/^﻿/, ""));
  } catch (error) {
    return { ok: false, reason: `script.json does not parse (${error.message})` };
  }
  if (!original || typeof original !== "object" || Array.isArray(original)) return { ok: false, reason: "script.json is not an object" };
  if (Object.hasOwn(original, "qrCode")) return { ok: false, reason: "script.json already has a qrCode" };
  const match = OPENING.exec(text);
  if (!match) return { ok: false, reason: "script.json does not start with {" };
  const [whole, lead, gap] = match;
  const empty = text.slice(whole.length).startsWith("}");
  const inserted = empty ? `"qrCode": "${code}"${gap}` : `"qrCode": "${code}",${gap || " "}`;
  const updated = `${lead}{${gap}${inserted}${text.slice(whole.length)}`;
  let reparsed;
  try {
    reparsed = JSON.parse(updated.replace(/^﻿/, ""));
  } catch {
    return { ok: false, reason: "the edited file would not parse" };
  }
  if (!sameJson(reparsed, { qrCode: code, ...original })) return { ok: false, reason: "the edited file would not equal the original plus qrCode" };
  return { ok: true, text: updated };
}

/** Inserts the key into the file when that is safe; says what happened either way. */
export function storeQrCode(scriptPath, code, log = console.log) {
  const result = insertQrCodeKey(readFileSync(scriptPath, "utf8"), code);
  if (result.ok) {
    writeFileSync(scriptPath, result.text);
    log(`qr: derived code "${code}" from the folder name and saved it as the first key of script.json`);
    return true;
  }
  log(`qr: derived code "${code}" from the folder name but did not edit script.json (${result.reason}). Add this line at the top of script.json to keep it: ${qrCodeLine(code)}`);
  return false;
}
