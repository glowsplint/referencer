/**
 * Shared cookie-domain helpers for cross-subdomain auth on Cloudflare Pages.
 * When the request originates from a preview deployment (e.g. 52604946.referencer.pages.dev),
 * cookies are scoped to the parent domain (referencer.pages.dev) so they are
 * available on both the preview AND the production callback URL.
 */

/** Hostname of the FRONTEND_URL env var, or null. */
function frontendHost(env: Record<string, unknown>): string | null {
  const raw = env.FRONTEND_URL;
  if (typeof raw !== "string") return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

/** Strip optional port from a host string. */
function bare(host: string): string {
  return host.split(":")[0];
}

/**
 * Returns the cookie `domain` value to set when the request comes from
 * FRONTEND_URL or one of its subdomains (preview deployments).
 * Returns `undefined` otherwise (local dev, unknown hosts) so the
 * cookie defaults to the exact response origin.
 */
export function getCookieDomain(c: {
  req: { header(name: string): string | undefined };
  env: Record<string, unknown>;
}): string | undefined {
  const fh = frontendHost(c.env);
  if (!fh) return undefined;

  const reqHost = bare(c.req.header("x-forwarded-host") ?? c.req.header("host") ?? "");

  if (reqHost === fh || reqHost.endsWith(`.${fh}`)) {
    return fh;
  }
  return undefined;
}

/**
 * If the request was forwarded from a *preview* subdomain of FRONTEND_URL,
 * returns its full `https://` origin (e.g. `https://abc123.referencer.pages.dev`).
 * Returns `null` for production or non-Pages requests.
 */
export function getPreviewOrigin(c: {
  req: { header(name: string): string | undefined };
  env: Record<string, unknown>;
}): string | null {
  const fh = frontendHost(c.env);
  if (!fh) return null;

  const forwarded = c.req.header("x-forwarded-host");
  if (!forwarded) return null;

  const host = bare(forwarded);
  // Only true subdomains count as previews — not the production host itself.
  if (host !== fh && host.endsWith(`.${fh}`)) {
    return `https://${host}`;
  }
  return null;
}

/**
 * Validates that `origin` is the FRONTEND_URL or a direct subdomain of it.
 * Used to prevent open-redirect via the stored preview origin.
 */
export function isAllowedOrigin(origin: string, env: Record<string, unknown>): boolean {
  const fh = frontendHost(env);
  if (!fh) return false;
  try {
    const host = new URL(origin).hostname;
    return host === fh || host.endsWith(`.${fh}`);
  } catch {
    return false;
  }
}
