/**
 * Smart Format proxies to an Ollama instance that defaults to localhost, so
 * it only works where such an instance is actually reachable. A hosted
 * deployment has none, and every click there would 502, so the feature is
 * hidden rather than offered and broken.
 *
 * Precedence:
 * 1. An explicit SMART_FORMAT flag always wins (escape hatch either way).
 * 2. Otherwise it is off on a hosted deployment, unless OLLAMA_HOST names a
 *    non-local instance that the deployment could genuinely reach.
 * 3. Otherwise on, which is the local-development case.
 *
 * Server-only: this reads process.env, so call it from a Server Component or
 * route handler and pass the result down rather than importing it in client
 * code.
 */
export function isSmartFormatEnabled(): boolean {
  const flag = process.env.SMART_FORMAT;
  if (flag !== undefined && flag !== "") {
    return flag === "1" || flag.toLowerCase() === "true";
  }

  if (!isHostedDeployment()) return true;

  return hasNonLocalOllamaHost();
}

function isHostedDeployment(): boolean {
  return Boolean(process.env.VERCEL);
}

function hasNonLocalOllamaHost(): boolean {
  const host = process.env.OLLAMA_HOST;
  if (!host) return false;

  try {
    const { hostname } = new URL(host);
    return !["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(hostname);
  } catch {
    return false;
  }
}
