// The optional `qr` block of a product brief (.cartoon-shorts/product-brief.md):
//
//   qr:
//     baseUrl: https://example.com/st/   # the short's code is appended
//     label: Scan to get the app         # optional
//     socialLine: Scan the code at the end or search Example App
//     minSeconds: 2.5                    # optional, 2.5 to 10
//
// Shorts read it (qr_settings.mjs) and slideshow lint checks it, both with
// these rules, so a brief is judged the same way wherever it is read.

import { qrLabelMaxChars } from "../../src/layout/qrGeometry.ts";

export const QR_DEFAULT_LABEL = "Scan to get the app";
export const QR_MIN_SECONDS_FLOOR = 2.5;
export const QR_MIN_SECONDS_CEILING = 10;
/** One line of at least 30 px on the narrowest card, for all-capital text (src/layout/qrGeometry.ts). */
export const QR_LABEL_MAX_LENGTH = qrLabelMaxChars();

const QR_KEYS = ["baseUrl", "label", "socialLine", "minSeconds"];
const LOCAL_TEST_HOSTS = new Set(["localhost", "127.0.0.1"]);

const isText = (value) => typeof value === "string" && value.trim() !== "";

/** True for a URL on this machine (http or https on localhost or 127.0.0.1): a test address, never one to post. */
export function isLocalTestUrl(url) {
  try {
    return LOCAL_TEST_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** The loud line printed by timeline, render, finish and qr when the QR points at this machine. */
export function localTestWarning(url) {
  return `WARNING: TEST URL. The QR points at ${url}, an address on this machine. Do NOT post this video; set qr.baseUrl to the real https address first.`;
}

/**
 * What a phone camera reads is the text exactly as encoded, so the base URL
 * must already be in the form `new URL` gives back: no spaces, backslashes,
 * missing or extra slashes, user names or passwords, query or fragment.
 */
function canonicalUrlProblem(baseUrl, parsed) {
  if (parsed.href !== baseUrl) return `qr.baseUrl "${baseUrl}" is not written the way browsers read it ("${parsed.href}"); write it exactly like that`;
  if (parsed.username || parsed.password) return `qr.baseUrl "${baseUrl}" must not contain a user name or password (the part before "@")`;
  if (parsed.search || parsed.hash) return `qr.baseUrl "${baseUrl}" must not have a ?query or #fragment; the code is appended to it`;
  return null;
}

/** Why a base URL cannot be used, or null. https only; http just for localhost or 127.0.0.1. */
export function baseUrlProblem(baseUrl) {
  if (!isText(baseUrl)) return "qr.baseUrl must be a URL, for example https://example.com/st/";
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return `qr.baseUrl "${baseUrl}" is not a URL`;
  }
  const localHttp = parsed.protocol === "http:" && LOCAL_TEST_HOSTS.has(parsed.hostname);
  if (parsed.protocol !== "https:" && !localHttp) return `qr.baseUrl "${baseUrl}" must start with https:// (http is only for localhost or 127.0.0.1 tests)`;
  const canonical = canonicalUrlProblem(baseUrl, parsed);
  if (canonical) return canonical;
  if (!baseUrl.endsWith("/")) return `qr.baseUrl "${baseUrl}" must end with "/"; the code is appended to it`;
  return null;
}

function optionalFieldProblems(block) {
  const errors = [];
  if (block.label !== undefined && !isText(block.label)) errors.push("qr.label must be a line of text");
  else if (isText(block.label) && block.label.length > QR_LABEL_MAX_LENGTH) {
    errors.push(`qr.label "${block.label}" is ${block.label.length} characters; keep it to ${QR_LABEL_MAX_LENGTH} so it stays one line of at least 30 px on every card`);
  }
  if (block.minSeconds !== undefined) {
    const value = block.minSeconds;
    const ok = typeof value === "number" && Number.isFinite(value) && value >= QR_MIN_SECONDS_FLOOR && value <= QR_MIN_SECONDS_CEILING;
    if (!ok) errors.push(`qr.minSeconds must be a number from ${QR_MIN_SECONDS_FLOOR} to ${QR_MIN_SECONDS_CEILING}, got ${JSON.stringify(value)}`);
  }
  return errors;
}

/**
 * Problems with a brief's qr block, as { level, message }; an empty list when
 * the block is absent or right. Unknown keys warn, as unknown sections do in
 * the rest of the brief (frontmatter_rules.mjs).
 */
export function qrBlockProblems(block, label = "brief") {
  if (block === undefined || block === null) return [];
  if (typeof block !== "object" || Array.isArray(block)) return [{ level: "error", message: `${label}: qr must be a set of key: value settings` }];
  const errors = [baseUrlProblem(block.baseUrl)].filter(Boolean);
  if (!isText(block.socialLine)) errors.push("qr.socialLine is missing; it is the line every caption carries for people who cannot scan");
  errors.push(...optionalFieldProblems(block));
  const warnings = Object.keys(block).filter((key) => !QR_KEYS.includes(key)).map((key) => `qr.${key} is not a setting this pipeline reads`);
  return [
    ...errors.map((message) => ({ level: "error", message: `${label}: ${message}` })),
    ...warnings.map((message) => ({ level: "warn", message: `${label}: ${message}` })),
  ];
}
