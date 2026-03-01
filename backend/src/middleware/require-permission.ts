import type { Context, Next } from "hono";
import type { Env } from "../env";
import { getPermission, hasMinimumRole, type PermissionRole } from "../db/permission-queries";

export function requirePermission(minimumRole: PermissionRole) {
  return async (c: Context<Env>, next: Next) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const workspaceId = c.req.param("id");
    if (!workspaceId) return c.json({ error: "Workspace ID required" }, 400);

    let role: PermissionRole | null;
    try {
      const supabase = c.get("supabase");
      role = await getPermission(supabase, workspaceId, user.id);
    } catch {
      const log = c.get("logger");
      log.error("Permission check failed", { userId: user.id, workspaceId });
      return c.json({ error: "Internal server error" }, 500);
    }

    if (!role || !hasMinimumRole(role, minimumRole)) {
      const log = c.get("logger");
      log.warn("Permission denied", {
        userId: user.id,
        workspaceId,
        requiredRole: minimumRole,
        userRole: role ?? "none",
        endpoint: c.req.path,
      });
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  };
}
