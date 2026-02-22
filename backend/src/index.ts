import { Hono } from "hono";
import { cors } from "hono/cors";
import { createSupabaseClient } from "./db/database";
import { createAuthRoutes } from "./auth/handlers";
import { loadAuthConfig } from "./auth/config";
import { optionalAuth } from "./auth/middleware";
import { handleShare, handleResolveShare } from "./api/share";
import { cleanExpiredSessions } from "./auth/store";
import type { Env } from "./env";

const app = new Hono<Env>();

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

// Auth middleware
app.use("*", (c, next) => {
  const config = loadAuthConfig(c.env);
  return optionalAuth(config)(c, next);
});

// Auth routes (mounted directly so they share the main app's middleware context)
app.route("/auth", createAuthRoutes());

// Share API
app.post("/api/share", handleShare());

// Share link resolution
app.get("/s/:code", handleResolveShare());

export default {
  fetch: app.fetch,
  async scheduled(
    _event: ScheduledEvent,
    env: Env["Bindings"],
    _ctx: ExecutionContext,
  ) {
    const supabase = createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    await cleanExpiredSessions(supabase);
  },
};
