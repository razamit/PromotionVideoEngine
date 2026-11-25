// Before a short with a QR is rendered: does the QR's URL answer with a 302
// redirect? A code that points nowhere must never be published, so anything
// else (another status, a network error, no answer in 10 s) stops the render.
// A 302 counts only with a non-empty Location header (where it sends people).
// There is deliberately no switch to skip this. The only request made is one
// GET to the QR's own URL, with redirects not followed, and with a fixed
// User-Agent naming no version, project or person, so the site owner can
// leave these checks out of the scan counts.

export const REDIRECT_TIMEOUT_MS = 10_000;
export const REDIRECT_CHECK_USER_AGENT = "cartoon-shorts-qr-check";

/** Why a response does not pass, or null when it does. */
function responseProblem(status, location) {
  if (status !== 302) return `status ${status}`;
  if (!location || !location.trim()) return "status 302 without a Location header";
  return null;
}

/**
 * @param {string} url
 * @param {{ fetchImpl?: typeof fetch, timeoutMs?: number }} [options] fetchImpl is injected for tests
 * @returns {Promise<{ ok: boolean, url: string, status: number | null, location: string | null, problem: string | null }>}
 */
export async function checkRedirect(url, { fetchImpl = fetch, timeoutMs = REDIRECT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { "user-agent": REDIRECT_CHECK_USER_AGENT };
    const response = await fetchImpl(url, { method: "GET", redirect: "manual", signal: controller.signal, headers });
    await response.body?.cancel?.().catch(() => {});
    const location = response.headers?.get?.("location") ?? null;
    const problem = responseProblem(response.status, location);
    return { ok: problem === null, url, status: response.status, location, problem };
  } catch (error) {
    const problem = controller.signal.aborted ? `no answer within ${timeoutMs / 1000} s` : `network error (${error?.cause?.code ?? error?.message ?? error})`;
    return { ok: false, url, status: null, location: null, problem };
  } finally {
    clearTimeout(timer);
  }
}

/** What to print for a result. `beforeRender`: the check stopped a render. */
export function describeRedirect(result, { beforeRender = false } = {}) {
  if (result.ok) return `qr redirect: ${result.url} answers 302${result.location ? ` -> ${result.location}` : ""}`;
  const received = result.status === null ? `no answer: ${result.problem}` : result.problem;
  const lines = ["ERROR: the QR redirect route is not live yet.", `  ${result.url} answered: ${received} (expected a 302 redirect with a Location).`];
  lines.push(beforeRender ? "  Nothing was rendered. Make the route answer 302, then run the render again." : "  Do not post this short until the route answers 302.");
  return lines.join("\n");
}
