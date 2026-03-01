import { Hono } from "hono";
import type { Env } from "../env";
import { getUserPreferences, upsertUserPreference } from "../db/preference-queries";

const preferences = new Hono<Env>();

// GET / - list all preferences for the authenticated user
preferences.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const supabase = c.get("supabase");
    const items = await getUserPreferences(supabase, user.id);
    log.info("GET /api/preferences", { userId: user.id, count: items.length });
    return c.json(items);
  } catch (err) {
    log.error("GET /api/preferences failed", { userId: user.id, error: String(err) });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PUT /:key - upsert a single preference
preferences.put("/:key", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const key = c.req.param("key");
    if (key.length > 100) {
      return c.json({ error: "Preference key must be at most 100 characters" }, 400);
    }
    const body = await c.req.json<{ value: string }>();
    if (typeof body.value !== "string") {
      return c.json({ error: "value is required" }, 400);
    }
    if (body.value.length > 10000) {
      return c.json({ error: "Preference value must be at most 10000 characters" }, 400);
    }

    const supabase = c.get("supabase");
    await upsertUserPreference(supabase, user.id, key, body.value);
    log.info("PUT /api/preferences/:key", { userId: user.id, key });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PUT /api/preferences/:key failed", {
      userId: user.id,
      key: c.req.param("key"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { preferences };
