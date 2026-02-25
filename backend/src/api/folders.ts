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

  try {
    const supabase = c.get("supabase");
    const items = await listUserFolders(supabase, user.id);
    return c.json(items);
  } catch (err) {
    console.error("GET /api/folders error:", err);
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

// POST / - create folder
folders.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json<{ id: string; parentId?: string; name: string }>();
    if (!body.id) {
      return c.json({ error: "id is required" }, 400);
    }
    if (typeof body.name !== "string") {
      return c.json({ error: "name is required" }, 400);
    }

    const supabase = c.get("supabase");
    await createFolder(supabase, body.id, user.id, body.parentId ?? null, body.name);
    return c.json({ ok: true }, 201);
  } catch (err) {
    console.error("POST /api/folders error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("depth limit") ? 400 : 500;
    return c.json({ error: message }, status);
  }
});

// PATCH /:id/favorite - toggle folder favorite
folders.patch("/:id/favorite", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const folderId = c.req.param("id");
    const body = await c.req.json<{ isFavorite: boolean }>();
    if (typeof body.isFavorite !== "boolean") {
      return c.json({ error: "isFavorite is required" }, 400);
    }

    const supabase = c.get("supabase");
    await toggleFavoriteFolder(supabase, user.id, folderId, body.isFavorite);
    return c.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/folders/:id/favorite error:", err);
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

// PATCH /:id/move - move folder to new parent
folders.patch("/:id/move", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const folderId = c.req.param("id");
    const body = await c.req.json<{ parentId: string | null }>();
    const supabase = c.get("supabase");
    await moveFolderToFolder(supabase, user.id, folderId, body.parentId);
    return c.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/folders/:id/move error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("depth limit") || message.includes("cycle") || message.includes("Cannot move") ? 400 : 500;
    return c.json({ error: message }, status);
  }
});

// PATCH /:id - rename folder
folders.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const folderId = c.req.param("id");
    const body = await c.req.json<{ name: string }>();
    if (typeof body.name !== "string") {
      return c.json({ error: "name is required" }, 400);
    }

    const supabase = c.get("supabase");
    await renameFolder(supabase, user.id, folderId, body.name);
    return c.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/folders/:id error:", err);
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

// DELETE /:id - delete folder
folders.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const folderId = c.req.param("id");
    const supabase = c.get("supabase");
    await deleteFolder(supabase, user.id, folderId);
    return c.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/folders/:id error:", err);
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

// PATCH /:id/move-workspace - move workspace into folder
folders.patch("/:id/move-workspace", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const folderId = c.req.param("id");
    const body = await c.req.json<{ workspaceId: string }>();
    if (!body.workspaceId) {
      return c.json({ error: "workspaceId is required" }, 400);
    }

    const supabase = c.get("supabase");
    await moveWorkspaceToFolder(supabase, user.id, body.workspaceId, folderId);
    return c.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/folders/:id/move-workspace error:", err);
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

// POST /unfile-workspace - remove workspace from folder
folders.post("/unfile-workspace", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json<{ workspaceId: string }>();
    if (!body.workspaceId) {
      return c.json({ error: "workspaceId is required" }, 400);
    }

    const supabase = c.get("supabase");
    await unfileWorkspace(supabase, user.id, body.workspaceId);
    return c.json({ ok: true });
  } catch (err) {
    console.error("POST /api/folders/unfile-workspace error:", err);
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

export { folders };
