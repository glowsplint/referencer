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
    const log = c.get("logger");

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

    // Only redirect to the frontend — no state changes on GET
    log.info("GET /s/:code redirect", { code });
    return c.redirect(`${frontendUrl}/#/share/${code}`, 302);
  };
}

export function handleAcceptShare() {
  return async (c: Context<Env>) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const log = c.get("logger");

    const body = await c.req.json<{ code: string }>();
    if (!body.code || typeof body.code !== "string") {
      return c.json({ error: "code is required" }, 400);
    }

    try {
      const supabase = c.get("supabase");
      const result = await resolveShareLink(supabase, body.code);
      if (!result) {
        log.info("POST /api/share/accept not found", { code: body.code });
        return c.json({ error: "Invalid or expired share link" }, 404);
      }

      // Map share access to permission role
      const shareRole: PermissionRole = result.access === "readonly" ? "viewer" : "editor";

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

      log.info("POST /api/share/accept resolved", {
        code: body.code,
        workspaceId: result.workspaceId,
        userId: user.id,
      });
      return c.json({ workspaceId: result.workspaceId });
    } catch (err) {
      log.error("POST /api/share/accept failed", { userId: user.id, code: body.code });
      return c.json({ error: "Internal server error" }, 500);
    }
  };
}
