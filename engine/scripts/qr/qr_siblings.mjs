// Two shorts with the same qrCode share one redirect and one scan count, so
// `timeline` and `qr` warn (never stop) when another short in the same
// shorts folder, or in the project's configured shortsDir, uses this code.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { findProjectDir, readProjectConfig } from "../project_paths.mjs";

/** The folders that hold this short's siblings: its parent, and the project's shortsDir when set. */
function shortsFolders(shortDir) {
  const folders = new Set([dirname(resolve(shortDir))]);
  const projectDir = findProjectDir(shortDir);
  try {
    const { shortsDir } = readProjectConfig(projectDir);
    if (typeof shortsDir === "string") folders.add(resolve(projectDir, shortsDir));
  } catch {
    // A config.json that does not parse is reported where it is read; it only narrows this search.
  }
  return [...folders].filter((folder) => existsSync(folder));
}

function isShortFolder(folder) {
  try {
    return statSync(folder).isDirectory() && existsSync(join(folder, "script.json"));
  } catch {
    return false;
  }
}

function qrCodeOf(scriptFile) {
  try {
    return JSON.parse(readFileSync(scriptFile, "utf8")).qrCode;
  } catch {
    return undefined;
  }
}

/** Other shorts whose script.json sets the same qrCode, as absolute folder paths. */
export function shortsWithSameCode(shortDir, code) {
  const self = resolve(shortDir);
  const matches = [];
  for (const folder of shortsFolders(shortDir)) {
    for (const name of readdirSync(folder)) {
      const other = join(folder, name);
      if (other !== self && isShortFolder(other) && qrCodeOf(join(other, "script.json")) === code) matches.push(other);
    }
  }
  return matches;
}

/** The warning lines for duplicates; empty when the code is this short's alone. */
export function duplicateCodeWarnings(shortDir, code) {
  return shortsWithSameCode(shortDir, code).map((other) => `WARNING: qr code "${code}" is also used by ${other}; two shorts would share one redirect and one scan count. Give one of them its own "qrCode".`);
}
