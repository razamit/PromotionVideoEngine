// The two QR packages (uqr to encode, qr to decode) are loaded only by the
// steps that use them, so every other command keeps working in an engine
// whose node_modules predate them. When one is missing, this says how to
// fix it instead of printing a stack trace.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ENGINE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export class QrLibraryMissingError extends Error {}

/** `await import(specifier)`, with a plain message when the package is not installed. */
export async function loadQrLibrary(specifier) {
  try {
    return await import(specifier);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
    throw new QrLibraryMissingError(`the engine has no "${specifier}" package installed; run npm ci in ${ENGINE_DIR} (or the plugin's ensure_engine.sh), then try again`);
  }
}
