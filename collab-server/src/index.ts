import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { YjsRoom } from "./durable-object";
import { verifyJwt } from "./jwt";

type Env = {
  Bindings: {
    YJS_ROOM: DurableObjectNamespace;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    WS_JWT_SECRET: string;
    WS_JWT_SECRET_PREV?: string;
    ALLOWED_ORIGIN?: string;
  };
};

const app = new Hono<Env>();

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

app.get("/health", (c) => c.json({ status: "ok" }));

// WebSocket upgrade for room connections
app.get("/:roomName", async (c) => {
  const roomName = c.req.param("roomName");

  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify JWT signature + expiry (no DB hit)
  const payload = await verifyJwt(token, c.env.WS_JWT_SECRET, c.env.WS_JWT_SECRET_PREV);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify issuer and audience
  if (payload.iss !== "referencer" || payload.aud !== "collab") {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify room binding
  if (payload.room !== roomName) {
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
    return c.json({ error: "Forbidden" }, 403);
  }

  const id = c.env.YJS_ROOM.idFromName(roomName);
  const stub = c.env.YJS_ROOM.get(id);

  // Forward role to the Durable Object so it can enforce read-only for viewers
  const doUrl = new URL(c.req.url);
  doUrl.searchParams.set("role", permission.role);
  const doRequest = new Request(doUrl.toString(), c.req.raw);
  return stub.fetch(doRequest);
});

export default app;
export { YjsRoom };
