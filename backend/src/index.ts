import { Hono } from "hono";
import { cors } from "hono/cors";
import { createSupabaseClient } from "./db/database";
import { createAuthRoutes } from "./auth/handlers";
import { loadAuthConfig } from "./auth/config";
import { optionalAuth } from "./auth/middleware";
import { handleShare, handleResolveShare, handleAcceptShare } from "./api/share";
import { handleFeedback } from "./api/feedback";
import { kvRateLimiter } from "./lib/rate-limit";
import { workspaces } from "./api/workspaces";
import { folders } from "./api/folders";
import { preferences } from "./api/preferences";
import { cleanExpiredSessions } from "./auth/store";
import { createLogger } from "./lib/logger";
import { createMetrics } from "./lib/metrics";
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

const getClientIp = (c: any) =>
  c.req.header("cf-connecting-ip") ??
  c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
  c.req.header("x-real-ip") ??
  "unknown";

const shareResolveLimiter = kvRateLimiter({
  windowMs: 60_000,
  limit: 20,
  keyGenerator: getClientIp,
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
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; frame-ancestors 'none'",
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

// Workspaces API
app.route("/api/workspaces", workspaces);

// Folders API
app.route("/api/folders", folders);

// Preferences API
app.route("/api/preferences", preferences);

// Share API
app.post("/api/share", handleShare());

// Share link accept (POST with auth + JSON body — resolves share and grants permissions)
app.post("/api/share/accept", handleAcceptShare());

// Share link resolution (GET only redirects to frontend — no state changes)
app.get("/s/:code", shareResolveLimiter, handleResolveShare());

// Feedback API
app.post("/api/feedback", handleFeedback());

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
