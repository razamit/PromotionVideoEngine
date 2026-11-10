// Run one of the engine's Python helpers (tts_mlx.py, align_words.py) with
// the audio venv, plus the hashing the per-line caches are keyed on.
//
// The venv lives outside the repo; set CARTOON_SHORTS_PY to use another one.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PY = join(homedir(), ".cache", "cartoon-shorts", "venv-audio", "bin", "python");

export function pythonPath() {
  return process.env.CARTOON_SHORTS_PY || DEFAULT_PY;
}

/** Short stable hash of any JSON-able value. */
export function hashKey(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 20);
}

/** Content hash of a file, so a re-recorded take or a new reference clip busts the cache. */
export function fileHash(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 20);
}

/**
 * Write `job` as JSON, run scripts/<scriptName> on it and return the JSON
 * objects it printed, one per stdout line. Throws with the helper's stderr
 * tail when it fails.
 */
export function runPythonJob(scriptName, job, workDir) {
  const python = pythonPath();
  if (!existsSync(python)) {
    throw new Error(`${python} not found. Create the audio venv (references/voice-and-audio.md) or set CARTOON_SHORTS_PY`);
  }
  mkdirSync(workDir, { recursive: true });
  const jobFile = join(workDir, `job_${process.pid}_${Date.now()}.json`);
  writeFileSync(jobFile, JSON.stringify(job));
  try {
    const out = execFileSync(python, [join(SCRIPTS_DIR, scriptName), jobFile], {
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
    return out.toString().split("\n").filter((row) => row.startsWith("{")).map((row) => JSON.parse(row));
  } catch (error) {
    const tail = (error.stderr?.toString() ?? "").trim().split("\n").slice(-12).join("\n");
    throw new Error(`${scriptName} failed: ${error.message.split("\n")[0]}\n${tail}`);
  } finally {
    rmSync(jobFile, { force: true });
  }
}
