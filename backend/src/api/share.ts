import type { Context } from "hono";
import { createShareLink, resolveShareLink } from "../db/share-queries";
import { getPermission, setPermission, hasMinimumRole } from "../db/permission-queries";
import { createUserWorkspace } from "../db/workspace-queries";
import type { ShareRequest, ShareResponse } from "../types";
import type { Env } from "../env";
import type { PermissionRole } from "../db/permission-queries";

const WORKSPACE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function validateWorkspaceId(id: unknown): string | null {
  if (typeof id !== "string" || id.length === 0) {
    return "workspaceId must be a non-empty string";
  }
  if (id.length > 64) {
    return "workspaceId must be at most 64 characters";
  }
  if (!WORKSPACE_ID_PATTERN.test(id)) {
    return "workspaceId must contain only alphanumeric characters, hyphens, and underscores";
  }
  return null;
}

export function handleShare() {
  return async (c: Context<Env>) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const log = c.get("logger");

    const req = await c.req.json<ShareRequest>();

    const idError = validateWorkspaceId(req.workspaceId);
    if (idError) {
      return c.json({ error: idError }, 400);
    }

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
      log.info("POST /api/share", {
        userId: user.id,
        workspaceId: req.workspaceId,
        access: req.access,
      });
      return c.json(resp);
    } catch (err) {
      log.error("POST /api/share failed", { userId: user.id, workspaceId: req.workspaceId });
      return c.json({ error: "Internal server error" }, 500);
    }
  };
}

export function handleResolveShare() {
  return async (c: Context<Env>) => {
    const log = c.get("logger");
    const code = c.req.param("code");
    if (!code) {
      return c.text("code required", 400);
    }

    const frontendUrl = c.env.FRONTEND_URL ?? "http://localhost:5173";

    const supabase = c.get("supabase");
    const result = await resolveShareLink(supabase, code);
    if (!result) {
      log.info("GET /s/:code not found", { code });
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
          log.error("Failed to add workspace to hub", {
            userId: user.id,
            workspaceId: result.workspaceId,
          });
          return c.json({ error: "Internal server error" }, 500);
        }
      }
    }

    log.info("GET /s/:code resolved", {
      code,
      workspaceId: result.workspaceId,
      userId: user?.id ?? null,
    });
    return c.redirect(`${frontendUrl}/#/${result.workspaceId}`, 302);
  };
}
