import { Hono } from "hono";
import type { Env } from "../env";
import {
  listUserWorkspaces,
  createUserWorkspace,
  renameUserWorkspace,
  touchUserWorkspace,
  deleteUserWorkspace,
  duplicateWorkspace,
} from "../db/workspace-queries";

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
    return c.json(
      { error: err instanceof Error ? err.message : String(err) },
      500,
    );
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

    const supabase = c.get("supabase");
    await createUserWorkspace(
      supabase,
      user.id,
      body.workspaceId,
      body.title ?? "",
    );
    return c.json({ ok: true }, 201);
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});

// PATCH /:id - rename workspace
workspaces.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const workspaceId = c.req.param("id");
    const body = await c.req.json<{ title: string }>();
    if (typeof body.title !== "string") {
      return c.json({ error: "title is required" }, 400);
    }

    const supabase = c.get("supabase");
    await renameUserWorkspace(supabase, user.id, workspaceId, body.title);
    return c.json({ ok: true });
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : String(err) },
      500,
    );
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
    return c.json(
      { error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});

// DELETE /:id - delete workspace
workspaces.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const workspaceId = c.req.param("id");
    const supabase = c.get("supabase");
    await deleteUserWorkspace(supabase, user.id, workspaceId);
    return c.json({ ok: true });
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});

// POST /:id/duplicate - duplicate workspace
workspaces.post("/:id/duplicate", async (c) => {
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
    return c.json(
      { error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});

export { workspaces };
