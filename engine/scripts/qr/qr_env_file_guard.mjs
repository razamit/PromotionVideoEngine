// The Remotion CLI reads an env file before it starts (engine/.env, else
// engine/.env.local, or the file named by --env-file), and the values in it
// win over the environment bin/short.mjs passes in. A file that sets
// REMOTION_QR_VERIFIED would therefore let any render paint the real QR
// modules without the redirect check (src/overlay/qrVerification.ts). So
// bin/short.mjs asks this file, before every Remotion command, which of
// those files mention the variable at all, and refuses to start when any do.
// It reads the files only; it changes nothing.

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { flagValue } from "../remotion_args.mjs";

/** Same name as QR_VERIFIED_ENV in qr_render_flow.mjs and src/overlay/qrVerification.ts. */
const GUARDED_NAME = "REMOTION_QR_VERIFIED";
const DEFAULT_ENV_FILES = [".env", ".env.local"];

/**
 * Every env file the Remotion CLI could load for these arguments. It runs
 * with the engine as its working folder, so --env-file is taken from there.
 */
export function remotionEnvFiles(engineDir, remotionArgs) {
  const files = DEFAULT_ENV_FILES.map((name) => join(engineDir, name));
  const named = flagValue(remotionArgs, "env-file");
  if (typeof named === "string") files.push(resolve(engineDir, named));
  return files;
}

/** The env files among those that mention REMOTION_QR_VERIFIED; empty when none do. */
export function envFilesSettingQrVerified(engineDir, remotionArgs) {
  return remotionEnvFiles(engineDir, remotionArgs).filter((file) => existsSync(file) && readFileSync(file, "utf8").includes(GUARDED_NAME));
}

export function describeEnvFileRefusal(files) {
  return [
    `ERROR: ${files.join(", ")} mentions ${GUARDED_NAME}.`,
    "  Only npm run render may set it, after the QR redirect check; a value in an env file would skip that check.",
    "  Nothing was rendered. Remove that line from the file, then run the command again.",
  ].join("\n");
}
