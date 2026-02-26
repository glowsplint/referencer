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

app.get("/health", (c) => c.json({ status: "ok" }));

// WebSocket upgrade for room connections
app.get("/:roomName", async (c) => {
  const roomName = c.req.param("roomName");

  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify JWT signature + expiry (no DB hit)
  const payload = await verifyJwt(token, c.env.WS_JWT_SECRET);
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
  return stub.fetch(c.req.raw);
});

export default app;
export { YjsRoom };
