/**
 * Cloudflare Pages middleware that proxies API requests to the backend worker.
 * Routes are gated by _routes.json so this only runs for /auth/*, /api/*, /s/*.
 * Cookies stay same-origin (pages.dev) — no third-party cookie issues.
 */

const WORKER_URL = "https://referencer-api.elurion.workers.dev";

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const target = new URL(url.pathname + url.search, WORKER_URL);

  const headers = new Headers(context.request.headers);
  headers.set("x-forwarded-host", url.host);
  headers.set("host", target.host);

  // Explicitly preserve the cookie header — the Headers constructor or
  // Cloudflare's CDN layer can strip it during cross-origin subrequests.
  const cookie = context.request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };

  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
  }

  // Bypass Cloudflare CDN cache — the CDN layer can strip cookies from
  // subrequests, which breaks auth flows that rely on cookie state.
  // @ts-expect-error — `cf` is a Cloudflare-specific RequestInit extension
  return fetch(target.toString(), { ...init, cf: { cacheTtl: 0 } });
};
