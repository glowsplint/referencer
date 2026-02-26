import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { YjsRoom } from "./durable-object";
import { verifyJwt } from "./jwt";
import { createLogger, type Logger } from "./logger";

// Secrets — set via `wrangler secret put <NAME>` from collab-server/
//
// SUPABASE_URL           — Supabase project URL (e.g. https://xxx.supabase.co)
//                          Also set in: backend
//
// SUPABASE_SERVICE_KEY   — Supabase service-role key (full DB access)
//                          Also set in: backend
//
// WS_JWT_SECRET          — Secret for verifying WebSocket auth JWTs
//                          Also set in: backend (for signing)
//                          Must be the same value in both workers.
//
// WS_JWT_SECRET_PREV     — Previous JWT secret for key rotation (optional)
//                          Also set in: backend
//
// ALLOWED_ORIGIN         — CORS origin for WebSocket connections (optional)
//                          Default: "" (allows all origins)
//
// Bindings — configured in collab-server/wrangler.toml
//
// YJS_ROOM               — Durable Object namespace for Yjs document rooms

type Env = {
  Bindings: {
    YJS_ROOM: DurableObjectNamespace;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    WS_JWT_SECRET: string;
    WS_JWT_SECRET_PREV?: string;
    ALLOWED_ORIGIN?: string;
  };
  Variables: {
    logger: Logger;
  };
};

const app = new Hono<Env>();

// Per-request logger with UUID trace ID
app.use("*", async (c, next) => {
  c.set("logger", createLogger());
  await next();
});

app.use(
  "*",
  cors({
    origin: (origin, c) => c.env.ALLOWED_ORIGIN || "",
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
});

app.get("/health", (c) => {
  c.get("logger").info("GET /health");
  return c.json({ status: "ok" });
});

// WebSocket upgrade for room connections
app.get("/:roomName", async (c) => {
  const log = c.get("logger");
  const roomName = c.req.param("roomName");

  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify JWT signature + expiry (no DB hit)
  const payload = await verifyJwt(token, c.env.WS_JWT_SECRET, c.env.WS_JWT_SECRET_PREV);
  if (!payload) {
    log.warn("GET /:roomName JWT verification failed", { roomName });
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify issuer and audience
  if (payload.iss !== "referencer" || payload.aud !== "collab") {
    log.warn("GET /:roomName invalid JWT claims", { roomName });
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify room binding
  if (payload.room !== roomName) {
    log.warn("GET /:roomName room mismatch", { roomName, tokenRoom: payload.room });
    return c.json({ error: "Forbidden" }, 403);
  }

  // Check workspace permission (DB check)
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  const { data: permission } = await supabase
    .from("workspace_permission")
    .select("role")
    .eq("workspace_id", roomName)
    .eq("user_id", payload.sub)
    .single();

  if (!permission) {
    log.warn("GET /:roomName no permission", { roomName, userId: payload.sub });
    return c.json({ error: "Forbidden" }, 403);
  }

  const id = c.env.YJS_ROOM.idFromName(roomName);
  const stub = c.env.YJS_ROOM.get(id);

  // Forward role to the Durable Object so it can enforce read-only for viewers
  const doUrl = new URL(c.req.url);
  doUrl.searchParams.set("role", permission.role);
  const doRequest = new Request(doUrl.toString(), c.req.raw);

  log.info("GET /:roomName WebSocket upgrade", {
    roomName,
    userId: payload.sub,
    role: permission.role,
  });
  return stub.fetch(doRequest);
});

export default app;
export { YjsRoom };
