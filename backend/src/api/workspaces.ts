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
import { getPermission, setPermission } from "../db/permission-queries";
import { requirePermission } from "../middleware/require-permission";

const workspaces = new Hono<Env>();

// GET / - list workspaces
workspaces.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const supabase = c.get("supabase");
    const items = await listUserWorkspaces(supabase, user.id);
    return c.json(items);
  } catch (err) {
    console.error("GET /api/workspaces error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST / - create workspace
workspaces.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json<{ workspaceId: string; title?: string }>();
    if (!body.workspaceId) {
      return c.json({ error: "workspaceId is required" }, 400);
    }
    if (body.title && body.title.length > 500) {
      return c.json({ error: "Title must be at most 500 characters" }, 400);
    }

    const supabase = c.get("supabase");
    await createUserWorkspace(supabase, user.id, body.workspaceId, body.title ?? "");
    await setPermission(supabase, body.workspaceId, user.id, "owner");
    return c.json({ ok: true }, 201);
  } catch (err) {
    console.error("POST /api/workspaces error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /:id - get single workspace
workspaces.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    const workspace = await getUserWorkspace(supabase, user.id, workspaceId);
    if (!workspace) return c.json({ error: "Not found" }, 404);
    return c.json(workspace);
  } catch (err) {
    console.error("GET /api/workspaces/:id error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id - rename workspace
workspaces.patch("/:id", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

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
    return c.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/workspaces/:id error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/touch - bump updated_at
workspaces.patch("/:id/touch", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    await touchUserWorkspace(supabase, user.id, workspaceId);
    return c.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/workspaces/:id/touch error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /:id/favorite - toggle favorite
workspaces.patch("/:id/favorite", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const workspaceId = c.req.param("id");
    const body = await c.req.json<{ isFavorite: boolean }>();
    if (typeof body.isFavorite !== "boolean") {
      return c.json({ error: "isFavorite is required" }, 400);
    }

    const supabase = c.get("supabase");
    await toggleFavoriteWorkspace(supabase, user.id, workspaceId, body.isFavorite);
    return c.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/workspaces/:id/favorite error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /:id - delete workspace
workspaces.delete("/:id", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    await deleteUserWorkspace(supabase, user.id, workspaceId);
    return c.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/workspaces/:id error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /:id/duplicate - duplicate workspace
workspaces.post("/:id/duplicate", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const sourceId = c.req.param("id");
    const body = await c.req.json<{ newWorkspaceId: string }>();
    if (!body.newWorkspaceId) {
      return c.json({ error: "newWorkspaceId is required" }, 400);
    }

    const supabase = c.get("supabase");
    await duplicateWorkspace(supabase, user.id, sourceId, body.newWorkspaceId);
    return c.json({ ok: true }, 201);
  } catch (err) {
    console.error("POST /api/workspaces/:id/duplicate error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /:id/permission - get user's role for a workspace
workspaces.get("/:id/permission", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    const role = await getPermission(supabase, workspaceId, user.id);
    if (!role) return c.json({ error: "No permission" }, 404);
    return c.json({ role });
  } catch (err) {
    console.error("GET /api/workspaces/:id/permission error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { workspaces };
