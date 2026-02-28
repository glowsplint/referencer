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

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };

  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
  }

  return fetch(target.toString(), init);
};
