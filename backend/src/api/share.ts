import type { Context } from "hono";
import { createShareLink, resolveShareLink } from "../db/share-queries";
import { getPermission, setPermission, hasMinimumRole } from "../db/permission-queries";
import { createUserWorkspace } from "../db/workspace-queries";
import type { ShareRequest, ShareResponse } from "../types";
import type { Env } from "../env";
import type { PermissionRole } from "../db/permission-queries";

export function handleShare() {
  return async (c: Context<Env>) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const req = await c.req.json<ShareRequest>();

    if (req.access !== "edit" && req.access !== "readonly") {
      return c.json({ error: "access must be 'edit' or 'readonly'" }, 400);
    }

    try {
      const supabase = c.get("supabase");

      // Require owner or editor permission to share
      const role = await getPermission(supabase, req.workspaceId, user.id);
      if (!role || !hasMinimumRole(role, "editor")) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const code = await createShareLink(supabase, req.workspaceId, req.access);
      const resp: ShareResponse = {
        code,
        url: "/s/" + code,
      };
      return c.json(resp);
    } catch (err) {
      console.error("POST /api/share error");
      return c.json({ error: "Internal server error" }, 500);
    }
  };
}

export function handleResolveShare() {
  return async (c: Context<Env>) => {
    const code = c.req.param("code");
    if (!code) {
      return c.text("code required", 400);
    }

    const frontendUrl = c.env.FRONTEND_URL ?? "http://localhost:5173";

    const supabase = c.get("supabase");
    const result = await resolveShareLink(supabase, code);
    if (!result) {
      return c.redirect(frontendUrl, 302);
    }

    // Map share access to permission role
    const shareRole: PermissionRole = result.access === "readonly" ? "viewer" : "editor";

    // If user is logged in, grant permission and add to their hub
    const user = c.get("user");
    if (user) {
      const existingRole = await getPermission(supabase, result.workspaceId, user.id);
      // Only set permission if user doesn't already have a higher role
      if (!existingRole || !hasMinimumRole(existingRole, shareRole)) {
        await setPermission(supabase, result.workspaceId, user.id, shareRole);
      }

      // Add workspace to user's hub (ignore if already exists)
      try {
        await createUserWorkspace(supabase, user.id, result.workspaceId, "");
      } catch (err: unknown) {
        const isDuplicate =
          err instanceof Error &&
          (err.message?.includes("23505") || err.message?.includes("unique"));
        if (!isDuplicate) {
          console.error("Failed to add workspace to hub");
          return c.json({ error: "Internal server error" }, 500);
        }
      }
    }

    return c.redirect(`${frontendUrl}/#/${result.workspaceId}`, 302);
  };
}
