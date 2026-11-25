// The file-system side of the QR settings: find the short's project, read
// its product brief, and resolve (qr_settings.mjs) for this short.
//
// A short with "qr": false never reads the brief. A brief that does not
// parse only stops a short when its text has a `qr:` key (the QR may be
// meant to be on); otherwise the QR is off and a one-line warning says why.

import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { DEFAULT_BRIEF, findProjectDir } from "../project_paths.mjs";
import { readFrontmatter } from "../slideshow/frontmatter.mjs";
import { resolveQrSettings } from "./qr_settings.mjs";

const QR_KEY_LINE = /^\s*qr\s*:/m;

/** The project's product brief, parsed, or null when the project has none. Throws when it does not parse. */
export function loadProjectBrief(shortDir) {
  const briefFile = join(findProjectDir(shortDir), DEFAULT_BRIEF);
  if (!existsSync(briefFile)) return { briefFile, brief: null };
  return { briefFile, brief: readFrontmatter(briefFile).data };
}

/** A brief that does not parse: an error when it mentions qr, else QR off with a warning. */
function unreadableBrief(shortDir, problem) {
  const briefFile = join(findProjectDir(shortDir), DEFAULT_BRIEF);
  const text = existsSync(briefFile) ? readFileSync(briefFile, "utf8") : "";
  if (QR_KEY_LINE.test(text)) return { status: "error", error: problem.message, briefFile };
  const warning = `WARNING: the product brief could not be read (${problem.message.split("\n")[0]}); it has no qr: key, so this short has no QR card`;
  return { status: "off", reason: "the product brief could not be read", silent: true, warning, briefFile };
}

/** QR settings for the short in `shortDir` with its parsed script.json. */
export function resolveShortQr(shortDir, script) {
  if (script.qr === false) return resolveQrSettings({ script, brief: null, folderName: basename(shortDir) });
  let loaded;
  try {
    loaded = loadProjectBrief(shortDir);
  } catch (problem) {
    return unreadableBrief(shortDir, problem);
  }
  return { ...resolveQrSettings({ script, brief: loaded.brief, folderName: basename(shortDir) }), briefFile: loaded.briefFile };
}
