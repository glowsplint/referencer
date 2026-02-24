import { Hono } from "hono";
import type { Env } from "../env";
import {
  getUserPreferences,
  upsertUserPreference,
} from "../db/preference-queries";

const preferences = new Hono<Env>();

// GET / - list all preferences for the authenticated user
preferences.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const supabase = c.get("supabase");
    const items = await getUserPreferences(supabase, user.id);
    return c.json(items);
  } catch (err) {
    console.error("GET /api/preferences error:", err);
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

// PUT /:key - upsert a single preference
preferences.put("/:key", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const key = c.req.param("key");
    const body = await c.req.json<{ value: string }>();
    if (typeof body.value !== "string") {
      return c.json({ error: "value is required" }, 400);
    }

    const supabase = c.get("supabase");
    await upsertUserPreference(supabase, user.id, key, body.value);
    return c.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/preferences/:key error:", err);
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

export { preferences };
