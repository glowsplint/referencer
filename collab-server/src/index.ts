import { Hono } from "hono";
import { cors } from "hono/cors";
import { YjsRoom } from "./durable-object";

type Env = {
  Bindings: {
    YJS_ROOM: DurableObjectNamespace;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    ALLOWED_ORIGIN?: string;
  };
};

const app = new Hono<Env>();

app.use(
  "*",
  cors({
    origin: (origin, c) => c.env.ALLOWED_ORIGIN || origin || "*",
    credentials: true,
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

// WebSocket upgrade for room connections
app.get("/:roomName", async (c) => {
  const roomName = c.req.param("roomName");
  const id = c.env.YJS_ROOM.idFromName(roomName);
  const stub = c.env.YJS_ROOM.get(id);
  // Forward the request to the Durable Object for WebSocket handling
  return stub.fetch(c.req.raw);
});

export default app;
export { YjsRoom };
