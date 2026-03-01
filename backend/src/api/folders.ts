import { Hono } from "hono";
import type { Env } from "../env";
import {
  listUserFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  moveWorkspaceToFolder,
  unfileWorkspace,
  toggleFavoriteFolder,
  moveFolderToFolder,
} from "../db/folder-queries";

const folders = new Hono<Env>();

// GET / - list folders
folders.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const supabase = c.get("supabase");
    const items = await listUserFolders(supabase, user.id);
    log.info("GET /api/folders", { userId: user.id, count: items.length });
    return c.json(items);
  } catch (err) {
    log.error("GET /api/folders failed", { userId: user.id, error: String(err) });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST / - create folder
folders.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const body = await c.req.json<{ id: string; parentId?: string; name: string }>();
    if (!body.id) {
      return c.json({ error: "id is required" }, 400);
    }
    if (typeof body.name !== "string") {
      return c.json({ error: "name is required" }, 400);
    }
    if (body.name.length > 200) {
      return c.json({ error: "Folder name must be at most 200 characters" }, 400);
    }

    const supabase = c.get("supabase");
    await createFolder(supabase, body.id, user.id, body.parentId ?? null, body.name);
    log.info("POST /api/folders", {
      userId: user.id,
      folderId: body.id,
      parentId: body.parentId ?? null,
    });
    return c.json({ ok: true }, 201);
  } catch (err) {
    log.error("POST /api/folders failed", { userId: user.id, error: String(err) });
    const message = err instanceof Error ? err.message : "";
    if (message.includes("depth limit")) {
      log.warn("Folder depth limit exceeded", { userId: user.id });
      return c.json({ error: "Folder nesting limit reached" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/favorite - toggle folder favorite
folders.patch("/:id/favorite", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const folderId = c.req.param("id");
    const body = await c.req.json<{ isFavorite: boolean }>();
    if (typeof body.isFavorite !== "boolean") {
      return c.json({ error: "isFavorite is required" }, 400);
    }

    const supabase = c.get("supabase");
    await toggleFavoriteFolder(supabase, user.id, folderId, body.isFavorite);
    log.info("PATCH /api/folders/:id/favorite", {
      userId: user.id,
      folderId,
      isFavorite: body.isFavorite,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/folders/:id/favorite failed", {
      userId: user.id,
      folderId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/move - move folder to new parent
folders.patch("/:id/move", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const folderId = c.req.param("id");
    const body = await c.req.json<{ parentId: string | null }>();
    const supabase = c.get("supabase");
    await moveFolderToFolder(supabase, user.id, folderId, body.parentId);
    log.info("PATCH /api/folders/:id/move", { userId: user.id, folderId, parentId: body.parentId });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/folders/:id/move failed", {
      userId: user.id,
      folderId: c.req.param("id"),
      error: String(err),
    });
    const message = err instanceof Error ? err.message : "";
    if (message.includes("depth limit")) {
      log.warn("Folder move depth limit exceeded", {
        userId: user.id,
        folderId: c.req.param("id"),
      });
      return c.json({ error: "Folder nesting limit reached" }, 400);
    }
    if (message.includes("cycle")) {
      log.warn("Folder move cycle detected", { userId: user.id, folderId: c.req.param("id") });
      return c.json({ error: "Cannot create circular folder structure" }, 400);
    }
    if (message.includes("Cannot move")) {
      log.warn("Folder move into self", { userId: user.id, folderId: c.req.param("id") });
      return c.json({ error: "Cannot move folder into itself" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id - rename folder
folders.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const folderId = c.req.param("id");
    const body = await c.req.json<{ name: string }>();
    if (typeof body.name !== "string") {
      return c.json({ error: "name is required" }, 400);
    }
    if (body.name.length > 200) {
      return c.json({ error: "Folder name must be at most 200 characters" }, 400);
    }

    const supabase = c.get("supabase");
    await renameFolder(supabase, user.id, folderId, body.name);
    log.info("PATCH /api/folders/:id", { userId: user.id, folderId });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/folders/:id failed", {
      userId: user.id,
      folderId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /:id - delete folder
folders.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const folderId = c.req.param("id");
    const supabase = c.get("supabase");
    await deleteFolder(supabase, user.id, folderId);
    log.info("DELETE /api/folders/:id", { userId: user.id, folderId });
    return c.json({ ok: true });
  } catch (err) {
    log.error("DELETE /api/folders/:id failed", {
      userId: user.id,
      folderId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/move-workspace - move workspace into folder
folders.patch("/:id/move-workspace", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const folderId = c.req.param("id");
    const body = await c.req.json<{ workspaceId: string }>();
    if (!body.workspaceId) {
      return c.json({ error: "workspaceId is required" }, 400);
    }

    const supabase = c.get("supabase");
    await moveWorkspaceToFolder(supabase, user.id, body.workspaceId, folderId);
    log.info("PATCH /api/folders/:id/move-workspace", {
      userId: user.id,
      folderId,
      workspaceId: body.workspaceId,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("PATCH /api/folders/:id/move-workspace failed", {
      userId: user.id,
      folderId: c.req.param("id"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /unfile-workspace - remove workspace from folder
folders.post("/unfile-workspace", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const body = await c.req.json<{ workspaceId: string }>();
    if (!body.workspaceId) {
      return c.json({ error: "workspaceId is required" }, 400);
    }

    const supabase = c.get("supabase");
    await unfileWorkspace(supabase, user.id, body.workspaceId);
    log.info("POST /api/folders/unfile-workspace", {
      userId: user.id,
      workspaceId: body.workspaceId,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("POST /api/folders/unfile-workspace failed", { userId: user.id, error: String(err) });
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { folders };
