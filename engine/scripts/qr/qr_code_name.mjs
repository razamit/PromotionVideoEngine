// The short code at the end of a QR's URL (https://example.com/st/<code>):
// what a valid one looks like, and how one is made from a short's folder name
// when script.json does not set "qrCode". Pure functions, no file system.

export const QR_CODE_PATTERN = /^[a-z0-9-]{1,20}$/;
export const QR_CODE_MAX_LENGTH = 20;

export function isValidQrCode(code) {
  return typeof code === "string" && QR_CODE_PATTERN.test(code);
}

/** Why a code is not valid, or null when it is. */
export function qrCodeProblem(code) {
  if (typeof code !== "string") return `qrCode must be text, got ${JSON.stringify(code)}`;
  if (isValidQrCode(code)) return null;
  return `qrCode "${code}" must be 1 to ${QR_CODE_MAX_LENGTH} characters of a-z, 0-9 and "-"`;
}

/** Lowercase, accents dropped, keep letters, digits and dashes (anything else becomes a dash), collapse and trim dashes. */
function slugOf(folderName) {
  return String(folderName)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Cuts to the limit, at the last dash inside it so a word is not split;
 * but when that would keep less than half the limit, a hard cut at the
 * limit keeps more of the name.
 */
function capAtDash(slug, limit) {
  if (slug.length <= limit) return slug;
  const head = slug.slice(0, limit);
  if (slug[limit] === "-") return head;
  const lastDash = head.lastIndexOf("-");
  return lastDash >= limit / 2 ? head.slice(0, lastDash) : head;
}

/**
 * The code for a short from its folder name, e.g. "Morning_Routine 2" ->
 * "morning-routine-2". Returns null when nothing usable is left.
 */
export function deriveQrCode(folderName) {
  const code = capAtDash(slugOf(folderName), QR_CODE_MAX_LENGTH).replace(/-+$/, "");
  return isValidQrCode(code) ? code : null;
}
