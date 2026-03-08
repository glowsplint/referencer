import { Hono } from "hono";
import { cors } from "hono/cors";
import { createSupabaseClient } from "./db/database";
import { createAuthRoutes } from "./auth/handlers";
import { loadAuthConfig } from "./auth/config";
import { optionalAuth } from "./auth/middleware";
import { handleShare, handleResolveShare, handleAcceptShare } from "./api/share";

import { rateLimiter } from "./lib/rate-limit";
import { documents } from "./api/documents";
import { folders } from "./api/folders";
import { tags } from "./api/tags";
import { preferences } from "./api/preferences";
import { search } from "./api/search";
import { cleanExpiredSessions } from "./auth/store";
import { createLogger } from "./lib/logger";
import { createMetrics } from "./lib/metrics";
import { getClientIp } from "./lib/client-ip";
import type { Env } from "./env";

const app = new Hono<Env>();

// Per-request logger with UUID trace ID
app.use("*", async (c, next) => {
  c.set("logger", createLogger());
  c.set("metrics", createMetrics(c.env.METRICS));
  await next();
});

// Response-time tracking
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const durationMs = Date.now() - start;
  const metrics = c.get("metrics");
  metrics.trackRequest(c.req.method, c.req.path, c.res.status, durationMs);
});

const shareResolveLimiter = rateLimiter({
  windowMs: 60_000,
  limit: 20,
  keyGenerator: getClientIp,
});

const crudWriteLimiter = rateLimiter({
  windowMs: 60_000,
  limit: 60,
  keyGenerator: (c) => `crud:${c.get("user")?.id ?? getClientIp(c)}`,
});

// Create Supabase client per-request
app.use("*", async (c, next) => {
  const supabase = createSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  c.set("supabase", supabase);
  await next();
});

// CORS
app.use(
  "*",
  cors({
    origin: (_, c) => c.env.FRONTEND_URL,
    credentials: true,
  }),
);

// CSRF protection: require Content-Type: application/json on state-changing requests
app.use("*", async (c, next) => {
  const method = c.req.method;
  if (method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE") {
    const ct = c.req.header("content-type") ?? "";
    if (!ct.includes("application/json")) {
      const log = c.get("logger");
      log.warn("CSRF rejection: missing application/json content-type", {
        method,
        contentType: ct,
        ip: getClientIp(c),
        endpoint: c.req.path,
      });
      return c.json({ error: "Content-Type must be application/json" }, 415);
    }
  }
  await next();
});

// Security headers
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  c.res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'",
  );
  c.res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
});

// Auth middleware
app.use("*", (c, next) => {
  const config = loadAuthConfig(c.env);
  return optionalAuth(config)(c, next);
});

// Auth routes (mounted directly so they share the main app's middleware context)
app.route("/auth", createAuthRoutes());

// CRUD write rate limiting for document and folder mutations
app.use("/api/documents/*", async (c, next) => {
  const method = c.req.method;
  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    return crudWriteLimiter(c, next);
  }
  await next();
});
app.use("/api/folders/*", async (c, next) => {
  const method = c.req.method;
  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    return crudWriteLimiter(c, next);
  }
  await next();
});
app.use("/api/tags/*", async (c, next) => {
  const method = c.req.method;
  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    return crudWriteLimiter(c, next);
  }
  await next();
});

// Documents API
app.route("/api/documents", documents);

// Folders API
app.route("/api/folders", folders);

// Tags API
app.route("/api/tags", tags);

// Preferences API
app.route("/api/preferences", preferences);

// Search rate limiter (30 req/min per user)
const searchLimiter = rateLimiter({
  windowMs: 60_000,
  limit: 30,
  keyGenerator: (c) => `search:${c.get("user")?.id ?? getClientIp(c)}`,
});
app.use("/api/search/*", searchLimiter);

// Search API
app.route("/api/search", search);

// Share API
app.post("/api/share", handleShare());

// Share link accept (POST with auth + JSON body — resolves share and grants permissions)
app.post("/api/share/accept", handleAcceptShare());

// Share link resolution (GET only redirects to frontend — no state changes)
app.get("/s/:code", shareResolveLimiter, handleResolveShare());

app.onError((err, c) => {
  const log = c.get("logger");
  log.error("Unhandled error", {
    error: String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  const metrics = c.get("metrics");
  metrics.trackError(
    c.req.path,
    c.req.method,
    err instanceof Error ? err.name : "UnknownError",
    500,
  );
  return c.json({ error: "Internal server error" }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env["Bindings"], _ctx: ExecutionContext) {
    const log = createLogger("scheduled");
    const supabase = createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    try {
      await cleanExpiredSessions(supabase);
      log.info("Scheduled session cleanup completed");
    } catch (err) {
      log.error("Scheduled session cleanup failed", {
        error: String(err),
        stack: err instanceof Error ? (err as Error).stack : undefined,
      });
    }
  },
};
