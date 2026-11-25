import type { QrSpec } from "../timeline/types";

// Whether this render may paint the real QR modules. `npm run render`
// (scripts/qr/qr_render_flow.mjs) checks that the QR's URL answers 302 and
// only then starts Remotion with REMOTION_QR_VERIFIED set to that URL and
// its modules. Remotion hands REMOTION_-prefixed variables to the page as
// process.env (@remotion/cli get-env.js, remotion setup-env-variables.js).
// Every other way to draw a frame (Studio and its render button, `still`,
// `review`, `bubbles`, a partial or scaled render, a --props override)
// has no matching value, so QrCard paints a placeholder that no phone can
// scan. bin/short.mjs removes the variable from every other command's
// environment, so one left in a shell does not leak in, and refuses to
// start Remotion when an env file it would load (engine/.env, .env.local,
// --env-file) mentions it (scripts/qr/qr_env_file_guard.mjs).

/** The variable's name; scripts/qr/qr_render_flow.mjs sets it under the same name. */
export const QR_VERIFIED_ENV = "REMOTION_QR_VERIFIED";

/** The value the gate sets for a verified QR: its URL and its modules. */
export function qrVerificationValue(qr: Pick<QrSpec, "url" | "modules">): string {
  return JSON.stringify({ url: qr.url, modules: qr.modules.join(",") });
}

function verifiedValueFromEnv(): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[QR_VERIFIED_ENV];
}

/** True only when the gate verified exactly this URL with exactly these modules for this render. */
export function isQrVerified(qr: Pick<QrSpec, "url" | "modules">, verified = verifiedValueFromEnv()): boolean {
  return verified !== undefined && verified === qrVerificationValue(qr);
}
