// Where things live now that one engine serves every short.
//
// ENGINE is this folder (engine): the Remotion code, these
// scripts, the shared sound kit and voice reference, and the one
// node_modules. SHORT is the short being worked on: its script.json, scenes,
// captures, voice-over, music, generated timeline and out/. bin/short.mjs
// sets SHORT_DIR; run from inside a short, the current folder is used.

import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ENGINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SHORT = resolve(process.env.SHORT_DIR ?? process.cwd());
export const TIMELINE_FILE = join(SHORT, "generated", "timeline.json");

/** A path relative to the short, falling back to the engine (shared voice reference, sound kit). */
export function shortOrEngine(path) {
  if (isAbsolute(path)) return path;
  const inShort = join(SHORT, path);
  return existsSync(inShort) ? inShort : join(ENGINE, path);
}

/** A file under public/: the short's own, else the engine's shared one. */
export function publicFile(path) {
  return shortOrEngine(join("public", path));
}
