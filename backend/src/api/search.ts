import { Hono } from "hono";
import type { Env } from "../env";

const search = new Hono<Env>();

// GET / — search annotations across documents
search.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const rawQuery = c.req.query("q") ?? "";
    const q = rawQuery.trim();
    if (q.length < 2 || q.length > 200) {
      return c.json({ error: "Query must be between 2 and 200 characters" }, 400);
    }

    const rawLimit = parseInt(c.req.query("limit") ?? "20", 10);
    const limit = Math.max(1, Math.min(100, isNaN(rawLimit) ? 20 : rawLimit));
    const rawOffset = parseInt(c.req.query("offset") ?? "0", 10);
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);

    const supabase = c.get("supabase");
    const { data, error } = await supabase.rpc("search_annotations", {
      p_user_id: user.id,
      p_query: q,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      log.error("search_annotations RPC failed", { userId: user.id, error: error.message });
      return c.json({ error: "Internal server error" }, 500);
    }

    // RPC returns array of results with a total_count field on each row
    const results = data ?? [];
    const total = results.length > 0 ? (results[0].total_count ?? results.length) : 0;

    // Strip total_count from individual results
    const cleaned = results.map(({ total_count, ...rest }: any) => rest);

    log.info("GET /api/search", { userId: user.id, query: q, resultCount: cleaned.length });
    return c.json({ results: cleaned, total });
  } catch (err) {
    log.error("GET /api/search failed", { userId: user.id, error: String(err) });
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { search };
