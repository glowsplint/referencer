import { Hono } from "hono";
import type { Env } from "../env";
import {
  listUserWorkspaces,
  getUserWorkspace,
  createUserWorkspace,
  renameUserWorkspace,
  toggleFavoriteWorkspace,
  touchUserWorkspace,
  deleteUserWorkspace,
  duplicateWorkspace,
} from "../db/workspace-queries";
import {
  getPermission,
  setPermission,
  listWorkspaceMembers,
  removePermission,
  type PermissionRole,
} from "../db/permission-queries";
import { listShareLinks, deleteShareLink } from "../db/share-queries";
import { requirePermission } from "../middleware/require-permission";

const WORKSPACE_ID_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-zA-Z]{27})$/i;

const workspaces = new Hono<Env>();

// GET / - list workspaces
workspaces.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const supabase = c.get("supabase");
    const items = await listUserWorkspaces(supabase, user.id);
    log.info("GET /api/workspaces", { userId: user.id, count: items.length });
    return c.json(items);
  } catch (err) {
    log.error("GET /api/workspaces failed", { userId: user.id });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST / - create workspace
workspaces.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const body = await c.req.json<{ workspaceId: string; title?: string }>();
    if (!body.workspaceId) {
      return c.json({ error: "workspaceId is required" }, 400);
    }
    if (!WORKSPACE_ID_RE.test(body.workspaceId)) {
      return c.json({ error: "Invalid workspaceId format" }, 400);
    }
    if (body.title && body.title.length > 500) {
      return c.json({ error: "Title must be at most 500 characters" }, 400);
    }

    const supabase = c.get("supabase");
    const { isNew } = await createUserWorkspace(
      supabase,
      user.id,
      body.workspaceId,
      body.title ?? "",
    );
    // Only grant owner permission if this is a newly created workspace
    if (isNew) {
      await setPermission(supabase, body.workspaceId, user.id, "owner");
    }
    log.info("POST /api/workspaces", { userId: user.id, workspaceId: body.workspaceId });
    return c.json({ ok: true }, 201);
  } catch (err) {
    log.error("POST /api/workspaces failed", { userId: user.id });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /:id - get single workspace
workspaces.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    const workspace = await getUserWorkspace(supabase, user.id, workspaceId);
    if (!workspace) return c.json({ error: "Not found" }, 404);
    log.info("GET /api/workspaces/:id", { userId: user.id, workspaceId });
    return c.json(workspace);
  } catch (err) {
    log.error("GET /api/workspaces/:id failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id - rename workspace
workspaces.patch("/:id", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const workspaceId = c.req.param("id");
    const body = await c.req.json<{ title: string }>();
    if (typeof body.title !== "string") {
      return c.json({ error: "title is required" }, 400);
    }
    if (body.title.length > 500) {
      return c.json({ error: "Title must be at most 500 characters" }, 400);
    }

    const supabase = c.get("supabase");
    await renameUserWorkspace(supabase, user.id, workspaceId, body.title);
    log.info("PATCH /api/workspaces/:id", { userId: user.id, workspaceId });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/workspaces/:id failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/touch - bump updated_at
workspaces.patch("/:id/touch", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    await touchUserWorkspace(supabase, user.id, workspaceId);
    log.info("PATCH /api/workspaces/:id/touch", { userId: user.id, workspaceId });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/workspaces/:id/touch failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/favorite - toggle favorite
workspaces.patch("/:id/favorite", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const workspaceId = c.req.param("id");
    const body = await c.req.json<{ isFavorite: boolean }>();
    if (typeof body.isFavorite !== "boolean") {
      return c.json({ error: "isFavorite is required" }, 400);
    }

    const supabase = c.get("supabase");
    await toggleFavoriteWorkspace(supabase, user.id, workspaceId, body.isFavorite);
    log.info("PATCH /api/workspaces/:id/favorite", {
      userId: user.id,
      workspaceId,
      isFavorite: body.isFavorite,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/workspaces/:id/favorite failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /:id - delete workspace
workspaces.delete("/:id", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    await deleteUserWorkspace(supabase, user.id, workspaceId);
    log.info("DELETE /api/workspaces/:id", { userId: user.id, workspaceId });
    return c.json({ ok: true });
  } catch (err) {
    log.error("DELETE /api/workspaces/:id failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /:id/duplicate - duplicate workspace
workspaces.post("/:id/duplicate", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const sourceId = c.req.param("id");
    const body = await c.req.json<{ newWorkspaceId: string }>();
    if (!body.newWorkspaceId) {
      return c.json({ error: "newWorkspaceId is required" }, 400);
    }
    if (!WORKSPACE_ID_RE.test(body.newWorkspaceId)) {
      return c.json({ error: "Invalid newWorkspaceId format" }, 400);
    }

    const supabase = c.get("supabase");
    await duplicateWorkspace(supabase, user.id, sourceId, body.newWorkspaceId);
    log.info("POST /api/workspaces/:id/duplicate", {
      userId: user.id,
      sourceId,
      newWorkspaceId: body.newWorkspaceId,
    });
    return c.json({ ok: true }, 201);
  } catch (err) {
    log.error("POST /api/workspaces/:id/duplicate failed", {
      userId: user.id,
      sourceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /:id/permission - get user's role for a workspace
workspaces.get("/:id/permission", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    const role = await getPermission(supabase, workspaceId, user.id);
    if (!role) return c.json({ error: "No permission" }, 404);
    log.info("GET /api/workspaces/:id/permission", { userId: user.id, workspaceId, role });
    return c.json({ role });
  } catch (err) {
    log.error("GET /api/workspaces/:id/permission failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /:id/links - list active share links
workspaces.get("/:id/links", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");
  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    const links = await listShareLinks(supabase, workspaceId);
    log.info("GET /api/workspaces/:id/links", {
      userId: user.id,
      workspaceId,
      count: links.length,
    });
    return c.json(links);
  } catch (err) {
    log.error("GET /api/workspaces/:id/links failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /:id/links/:code - revoke a share link
workspaces.delete("/:id/links/:code", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");
  try {
    const workspaceId = c.req.param("id");
    const code = c.req.param("code");
    const supabase = c.get("supabase");
    const deleted = await deleteShareLink(supabase, code, workspaceId);
    if (!deleted) return c.json({ error: "Not found" }, 404);
    log.info("DELETE /api/workspaces/:id/links/:code", { userId: user.id, workspaceId, code });
    return c.json({ ok: true });
  } catch (err) {
    log.error("DELETE /api/workspaces/:id/links/:code failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /:id/members - list workspace members
workspaces.get("/:id/members", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");
  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    const members = await listWorkspaceMembers(supabase, workspaceId);
    log.info("GET /api/workspaces/:id/members", {
      userId: user.id,
      workspaceId,
      count: members.length,
    });
    return c.json(members);
  } catch (err) {
    log.error("GET /api/workspaces/:id/members failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/members/:userId - change member role
workspaces.patch("/:id/members/:userId", requirePermission("owner"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");
  try {
    const workspaceId = c.req.param("id");
    const targetUserId = c.req.param("userId");
    if (targetUserId === user.id) return c.json({ error: "Cannot change your own role" }, 403);
    const supabase = c.get("supabase");
    const targetRole = await getPermission(supabase, workspaceId, targetUserId);
    if (targetRole === "owner") return c.json({ error: "Cannot change an owner's role" }, 403);
    const body = await c.req.json<{ role: string }>();
    if (body.role !== "editor" && body.role !== "viewer") {
      return c.json({ error: "Role must be 'editor' or 'viewer'" }, 400);
    }
    await setPermission(supabase, workspaceId, targetUserId, body.role as PermissionRole);
    log.info("PATCH /api/workspaces/:id/members/:userId", {
      userId: user.id,
      workspaceId,
      targetUserId,
      newRole: body.role,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/workspaces/:id/members/:userId failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /:id/members/:userId - remove a member
workspaces.delete("/:id/members/:userId", requirePermission("owner"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");
  try {
    const workspaceId = c.req.param("id");
    const targetUserId = c.req.param("userId");
    if (targetUserId === user.id) return c.json({ error: "Cannot remove yourself" }, 403);
    const supabase = c.get("supabase");
    const targetRole = await getPermission(supabase, workspaceId, targetUserId);
    if (targetRole === "owner") return c.json({ error: "Cannot remove an owner" }, 403);
    await removePermission(supabase, workspaceId, targetUserId);
    log.info("DELETE /api/workspaces/:id/members/:userId", {
      userId: user.id,
      workspaceId,
      targetUserId,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("DELETE /api/workspaces/:id/members/:userId failed", {
      userId: user.id,
      workspaceId: c.req.param("id"),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { workspaces };
