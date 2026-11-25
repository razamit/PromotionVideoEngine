// Whether a short gets a QR end card, and what it points at. Pure: it takes
// the parsed script.json, the parsed product brief (or null when the project
// has none) and the short's folder name, and touches no files.
//
//   brief has qr.baseUrl        -> on by default
//   script.json "qr": false     -> off
//   script.json "qr": true      -> on, and an error when the brief has no qr.baseUrl
//   no brief, or no qr block    -> off, silently
//   script.json "qrCode": "bin" -> the code; else derived from the folder name
//   a shot with "qr": true       -> that shot carries the card (qr_shot.mjs)

import { deriveQrCode, qrCodeProblem } from "./qr_code_name.mjs";
import { QR_DEFAULT_LABEL, QR_MIN_SECONDS_FLOOR, qrBlockProblems } from "./qr_brief_rules.mjs";
import { chooseQrShot } from "./qr_shot.mjs";

// `silent`: the timeline prints nothing about the QR (no block, no brief, or switched off in script.json).
const off = (reason, silent = false) => ({ status: "off", reason, silent });
const failed = (error) => ({ status: "error", error });

/** The qr switch in script.json: undefined, true or false. Anything else is an error. */
function scriptSwitch(script) {
  const value = script.qr;
  if (value === undefined || typeof value === "boolean") return { value };
  return { error: `script.json "qr" must be true or false, got ${JSON.stringify(value)}` };
}

/** The code from script.json, or one derived from the folder name. */
function codeFor(script, folderName) {
  if (script.qrCode !== undefined) {
    const problem = qrCodeProblem(script.qrCode);
    return problem ? { error: `script.json ${problem}` } : { code: script.qrCode, codeSource: "script" };
  }
  const derived = deriveQrCode(folderName);
  if (!derived) return { error: `no qrCode in script.json and none can be made from the folder name "${folderName}"; add "qrCode": "<a-z, 0-9, ->" to script.json` };
  return { code: derived, codeSource: "derived" };
}

/**
 * @param {{ script: Record<string, any>, brief: Record<string, any> | null, folderName: string }} input
 * @returns {{ status: "off", reason: string, silent: boolean }
 *   | { status: "error", error: string }
 *   | { status: "on", code: string, codeSource: "script" | "derived", url: string, label: string, socialLine: string, minSeconds: number, shot: ReturnType<typeof chooseQrShot> }}
 *   `shot`: the shot that carries the card (qr_shot.mjs).
 */
export function resolveQrSettings({ script, brief, folderName }) {
  const toggle = scriptSwitch(script);
  if (toggle.error) return failed(toggle.error);
  if (toggle.value === false) return off('script.json sets "qr": false', true);
  const block = brief?.qr;
  if (block === undefined || block === null) {
    if (toggle.value === true) return failed('script.json sets "qr": true, but the product brief (.cartoon-shorts/product-brief.md) has no qr block with a baseUrl; add one (see the brief template) or remove "qr"');
    return off(brief ? "the product brief has no qr block" : "the project has no product brief", true);
  }
  const blockErrors = qrBlockProblems(block, "product brief").filter((problem) => problem.level === "error");
  if (blockErrors.length) return failed(blockErrors.map((problem) => problem.message).join("; "));
  const code = codeFor(script, folderName);
  if (code.error) return failed(code.error);
  const shot = chooseQrShot(script.lines);
  if (shot.error) return failed(shot.error);
  return {
    status: "on",
    code: code.code,
    codeSource: code.codeSource,
    url: `${block.baseUrl}${code.code}`,
    label: block.label ?? QR_DEFAULT_LABEL,
    socialLine: block.socialLine,
    minSeconds: block.minSeconds ?? QR_MIN_SECONDS_FLOOR,
    shot,
  };
}

/** One line saying what was resolved, for the timeline log and the qr command. */
export function describeQrSettings(settings) {
  if (settings.status === "off") return `qr: off (${settings.reason})`;
  if (settings.status === "error") return `qr: ERROR ${settings.error}`;
  const source = settings.codeSource === "derived" ? "derived from the folder name" : "from script.json";
  return `qr: on, code "${settings.code}" (${source}), ${settings.url}, held at least ${settings.minSeconds}s`;
}
