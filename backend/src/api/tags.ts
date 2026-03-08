import { Hono } from "hono";
import type { Env } from "../env";
import { listUserTags, listDocumentTagsForUser, addTag, removeTag } from "../db/tag-queries";
import { getPermission, hasMinimumRole } from "../db/permission-queries";

const tags = new Hono<Env>();

// GET / - list all tags and document-tag mappings
tags.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const supabase = c.get("supabase");
    const [allTags, documentTags] = await Promise.all([
      listUserTags(supabase, user.id),
      listDocumentTagsForUser(supabase, user.id),
    ]);
    log.info("GET /api/tags", { userId: user.id, tagCount: allTags.length });
    return c.json({ allTags, documentTags });
  } catch (err) {
    log.error("GET /api/tags failed", { userId: user.id, error: String(err) });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /:documentId - add tag to document
tags.post("/:documentId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const documentId = c.req.param("documentId");
    const body = await c.req.json<{ tag: string }>();
    if (typeof body.tag !== "string" || !body.tag.trim()) {
      return c.json({ error: "tag is required" }, 400);
    }

    const supabase = c.get("supabase");
    const role = await getPermission(supabase, documentId, user.id);
    if (!role || !hasMinimumRole(role, "viewer")) {
      log.warn("Permission denied for add tag", {
        userId: user.id,
        documentId,
      });
      return c.json({ error: "Forbidden" }, 403);
    }

    await addTag(supabase, user.id, documentId, body.tag);
    log.info("POST /api/tags/:documentId", {
      userId: user.id,
      documentId,
      tag: body.tag,
    });
    return c.json({ ok: true }, 201);
  } catch (err) {
    log.error("POST /api/tags/:documentId failed", {
      userId: user.id,
      documentId: c.req.param("documentId"),
      error: String(err),
    });
    const message = err instanceof Error ? err.message : "";
    if (message.includes("Invalid tag")) {
      return c.json(
        { error: "Invalid tag format. Use lowercase letters, numbers, and hyphens only." },
        400,
      );
    }
    if (message.includes("Maximum")) {
      return c.json({ error: message }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /:documentId/:tag - remove tag from document
tags.delete("/:documentId/:tag", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const documentId = c.req.param("documentId");
    const tag = decodeURIComponent(c.req.param("tag"));
    const supabase = c.get("supabase");

    const role = await getPermission(supabase, documentId, user.id);
    if (!role || !hasMinimumRole(role, "viewer")) {
      log.warn("Permission denied for remove tag", {
        userId: user.id,
        documentId,
      });
      return c.json({ error: "Forbidden" }, 403);
    }

    await removeTag(supabase, user.id, documentId, tag);
    log.info("DELETE /api/tags/:documentId/:tag", {
      userId: user.id,
      documentId,
      tag,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("DELETE /api/tags/:documentId/:tag failed", {
      userId: user.id,
      documentId: c.req.param("documentId"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { tags };
