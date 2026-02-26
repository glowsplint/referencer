import { Hono } from "hono";
import { cors } from "hono/cors";
import { createSupabaseClient } from "./db/database";
import { createAuthRoutes } from "./auth/handlers";
import { loadAuthConfig } from "./auth/config";
import { optionalAuth } from "./auth/middleware";
import { handleShare, handleResolveShare } from "./api/share";
import { handleFeedback } from "./api/feedback";
import { kvRateLimiter } from "./lib/rate-limit";
import { workspaces } from "./api/workspaces";
import { folders } from "./api/folders";
import { preferences } from "./api/preferences";
import { cleanExpiredSessions } from "./auth/store";
import type { Env } from "./env";

const app = new Hono<Env>();

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

// Share link resolution
app.get("/s/:code", shareResolveLimiter, handleResolveShare());

// Feedback API
app.post("/api/feedback", handleFeedback());

app.onError((_err, c) => {
  return c.json({ error: "Internal server error" }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env["Bindings"], _ctx: ExecutionContext) {
    const supabase = createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    await cleanExpiredSessions(supabase);
  },
};
