import { Hono } from "hono";
import type { Env } from "../env";
import {
  listUserDocuments,
  getUserDocument,
  createUserDocument,
  renameUserDocument,
  toggleFavoriteDocument,
  touchUserDocument,
  deleteUserDocument,
  deleteDocumentCascade,
  duplicateDocument,
} from "../db/document-queries";
import {
  getPermission,
  setPermission,
  listDocumentMembers,
  removePermission,
  type PermissionRole,
} from "../db/permission-queries";
import { listShareLinks, deleteShareLink } from "../db/share-queries";
import { requirePermission } from "../middleware/require-permission";

const DOCUMENT_ID_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-zA-Z]{27})$/i;

const documents = new Hono<Env>();

// GET / - list documents
documents.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const supabase = c.get("supabase");
    const items = await listUserDocuments(supabase, user.id);
    log.info("GET /api/documents", { userId: user.id, count: items.length });
    return c.json(items);
  } catch (err) {
    log.error("GET /api/documents failed", { userId: user.id, error: String(err) });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST / - create document
documents.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const body = await c.req.json<{ documentId: string; title?: string }>();
    if (!body.documentId) {
      return c.json({ error: "documentId is required" }, 400);
    }
    if (!DOCUMENT_ID_RE.test(body.documentId)) {
      log.warn("Invalid documentId format", {
        userId: user.id,
        documentId: body.documentId,
        endpoint: "POST /api/documents",
      });
      return c.json({ error: "Invalid documentId format" }, 400);
    }
    if (body.title && body.title.length > 500) {
      return c.json({ error: "Title must be at most 500 characters" }, 400);
    }

    const supabase = c.get("supabase");

    // Check if document already exists — if so, require permission before association
    const { data: existing } = await supabase
      .from("document")
      .select("id")
      .eq("id", body.documentId)
      .single();

    if (existing) {
      const role = await getPermission(supabase, body.documentId, user.id);
      if (!role) {
        log.warn("POST /api/documents denied — no permission on existing document", {
          userId: user.id,
          documentId: body.documentId,
        });
        return c.json({ error: "Forbidden" }, 403);
      }
    }

    const { isNew } = await createUserDocument(
      supabase,
      user.id,
      body.documentId,
      body.title ?? "",
    );
    if (isNew) {
      await setPermission(supabase, body.documentId, user.id, "owner");
    }
    log.info("POST /api/documents", { userId: user.id, documentId: body.documentId });
    return c.json({ ok: true }, 201);
  } catch (err) {
    log.error("POST /api/documents failed", { userId: user.id, error: String(err) });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /:id - get single document
documents.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const documentId = c.req.param("id");
    const supabase = c.get("supabase");
    const document = await getUserDocument(supabase, user.id, documentId);
    if (!document) return c.json({ error: "Not found" }, 404);
    log.info("GET /api/documents/:id", { userId: user.id, documentId });
    return c.json(document);
  } catch (err) {
    log.error("GET /api/documents/:id failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id - rename document
documents.patch("/:id", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const documentId = c.req.param("id");
    const body = await c.req.json<{ title: string }>();
    if (typeof body.title !== "string") {
      return c.json({ error: "title is required" }, 400);
    }
    if (body.title.length > 500) {
      return c.json({ error: "Title must be at most 500 characters" }, 400);
    }

    const supabase = c.get("supabase");
    await renameUserDocument(supabase, user.id, documentId, body.title);
    log.info("PATCH /api/documents/:id", { userId: user.id, documentId });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/documents/:id failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/touch - bump updated_at
documents.patch("/:id/touch", requirePermission("viewer"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const documentId = c.req.param("id");
    const supabase = c.get("supabase");
    await touchUserDocument(supabase, user.id, documentId);
    log.info("PATCH /api/documents/:id/touch", { userId: user.id, documentId });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/documents/:id/touch failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/favorite - toggle favorite
documents.patch("/:id/favorite", requirePermission("viewer"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const documentId = c.req.param("id");
    const body = await c.req.json<{ isFavorite: boolean }>();
    if (typeof body.isFavorite !== "boolean") {
      return c.json({ error: "isFavorite is required" }, 400);
    }

    const supabase = c.get("supabase");
    await toggleFavoriteDocument(supabase, user.id, documentId, body.isFavorite);
    log.info("PATCH /api/documents/:id/favorite", {
      userId: user.id,
      documentId,
      isFavorite: body.isFavorite,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/documents/:id/favorite failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /:id - delete document
// Owner: cascade delete (document + share_links + user_document + document_permission + yjs_document)
// Non-owner: just unlink (delete user_document + document_permission for that user)
documents.delete("/:id", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const documentId = c.req.param("id");
    const supabase = c.get("supabase");
    const role = await getPermission(supabase, documentId, user.id);

    if (role === "owner") {
      // Owner: cascade delete everything
      await deleteDocumentCascade(supabase, documentId);
      log.info("DELETE /api/documents/:id (cascade)", { userId: user.id, documentId });
    } else {
      // Non-owner: just unlink this user
      await deleteUserDocument(supabase, user.id, documentId);
      await removePermission(supabase, documentId, user.id);
      log.info("DELETE /api/documents/:id (unlink)", { userId: user.id, documentId });
    }
    return c.json({ ok: true });
  } catch (err) {
    log.error("DELETE /api/documents/:id failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /:id/duplicate - duplicate document
documents.post("/:id/duplicate", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const sourceId = c.req.param("id");
    const body = await c.req.json<{ newDocumentId: string }>();
    if (!body.newDocumentId) {
      return c.json({ error: "newDocumentId is required" }, 400);
    }
    if (!DOCUMENT_ID_RE.test(body.newDocumentId)) {
      log.warn("Invalid newDocumentId format", {
        userId: user.id,
        newDocumentId: body.newDocumentId,
        endpoint: "POST /api/documents/:id/duplicate",
      });
      return c.json({ error: "Invalid newDocumentId format" }, 400);
    }

    const supabase = c.get("supabase");
    await duplicateDocument(supabase, user.id, sourceId, body.newDocumentId);
    await setPermission(supabase, body.newDocumentId, user.id, "owner");
    log.info("POST /api/documents/:id/duplicate", {
      userId: user.id,
      sourceId,
      newDocumentId: body.newDocumentId,
    });
    return c.json({ ok: true }, 201);
  } catch (err) {
    log.error("POST /api/documents/:id/duplicate failed", {
      userId: user.id,
      sourceId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /:id/permission - get user's role for a document
documents.get("/:id/permission", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const documentId = c.req.param("id");
    const supabase = c.get("supabase");
    const role = await getPermission(supabase, documentId, user.id);
    if (!role) return c.json({ error: "No permission" }, 404);
    log.info("GET /api/documents/:id/permission", { userId: user.id, documentId, role });
    return c.json({ role });
  } catch (err) {
    log.error("GET /api/documents/:id/permission failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /:id/links - list active share links
documents.get("/:id/links", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");
  try {
    const documentId = c.req.param("id");
    const supabase = c.get("supabase");
    const links = await listShareLinks(supabase, documentId);
    log.info("GET /api/documents/:id/links", {
      userId: user.id,
      documentId,
      count: links.length,
    });
    return c.json(links);
  } catch (err) {
    log.error("GET /api/documents/:id/links failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /:id/links/:code - revoke a share link
documents.delete("/:id/links/:code", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");
  try {
    const documentId = c.req.param("id");
    const code = c.req.param("code");
    const supabase = c.get("supabase");
    const deleted = await deleteShareLink(supabase, code, documentId);
    if (!deleted) return c.json({ error: "Not found" }, 404);
    log.info("DELETE /api/documents/:id/links/:code", { userId: user.id, documentId, code });
    return c.json({ ok: true });
  } catch (err) {
    log.error("DELETE /api/documents/:id/links/:code failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /:id/members - list document members
documents.get("/:id/members", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");
  try {
    const documentId = c.req.param("id");
    const supabase = c.get("supabase");
    const members = await listDocumentMembers(supabase, documentId);
    log.info("GET /api/documents/:id/members", {
      userId: user.id,
      documentId,
      count: members.length,
    });
    return c.json(members);
  } catch (err) {
    log.error("GET /api/documents/:id/members failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/members/:userId - change member role
documents.patch("/:id/members/:userId", requirePermission("owner"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");
  try {
    const documentId = c.req.param("id");
    const targetUserId = c.req.param("userId");
    if (targetUserId === user.id) return c.json({ error: "Cannot change your own role" }, 403);
    const supabase = c.get("supabase");
    const targetRole = await getPermission(supabase, documentId, targetUserId);
    if (targetRole === "owner") return c.json({ error: "Cannot change an owner's role" }, 403);
    const body = await c.req.json<{ role: string }>();
    if (body.role !== "editor" && body.role !== "viewer") {
      return c.json({ error: "Role must be 'editor' or 'viewer'" }, 400);
    }
    await setPermission(supabase, documentId, targetUserId, body.role as PermissionRole);
    log.info("PATCH /api/documents/:id/members/:userId", {
      userId: user.id,
      documentId,
      targetUserId,
      previousRole: targetRole,
      newRole: body.role,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/documents/:id/members/:userId failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /:id/members/:userId - remove a member
documents.delete("/:id/members/:userId", requirePermission("owner"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");
  try {
    const documentId = c.req.param("id");
    const targetUserId = c.req.param("userId");
    if (targetUserId === user.id) return c.json({ error: "Cannot remove yourself" }, 403);
    const supabase = c.get("supabase");
    const targetRole = await getPermission(supabase, documentId, targetUserId);
    if (targetRole === "owner") return c.json({ error: "Cannot remove an owner" }, 403);
    await removePermission(supabase, documentId, targetUserId);
    log.info("DELETE /api/documents/:id/members/:userId", {
      userId: user.id,
      documentId,
      targetUserId,
      removedRole: targetRole,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("DELETE /api/documents/:id/members/:userId failed", {
      userId: user.id,
      documentId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { documents };
