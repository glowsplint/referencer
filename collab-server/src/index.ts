import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { YjsRoom } from "./durable-object";

type Env = {
  Bindings: {
    YJS_ROOM: DurableObjectNamespace;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    ALLOWED_ORIGIN?: string;
  };
};

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const app = new Hono<Env>();

app.use(
  "*",
  cors({
    origin: (origin, c) => c.env.ALLOWED_ORIGIN || origin,
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

// WebSocket upgrade for room connections
app.get("/:roomName", async (c) => {
  const roomName = c.req.param("roomName");

  // Authenticate via session token in query params
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);

  // Hash the token before looking it up (matches backend session storage)
  const hashedToken = await hashToken(token);
  const { data: session } = await supabase
    .from("session")
    .select("user_id, expires_at")
    .eq("id", hashedToken)
    .single();

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    return c.json({ error: "Session expired" }, 401);
  }

  // Check workspace permission
  const { data: permission } = await supabase
    .from("workspace_permission")
    .select("role")
    .eq("workspace_id", roomName)
    .eq("user_id", session.user_id)
    .single();

  if (!permission) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const id = c.env.YJS_ROOM.idFromName(roomName);
  const stub = c.env.YJS_ROOM.get(id);
  // Forward the request to the Durable Object for WebSocket handling
  return stub.fetch(c.req.raw);
});

export default app;
export { YjsRoom };
