import type { Context } from "hono";
import { createShareLink, resolveShareLink } from "../db/share-queries";
import type { ShareRequest, ShareResponse } from "../types";
import type { Env } from "../env";

export function handleShare() {
  return async (c: Context<Env>) => {
    const req = await c.req.json<ShareRequest>();

    if (req.access !== "edit" && req.access !== "readonly") {
      return c.json({ error: "access must be 'edit' or 'readonly'" }, 400);
    }

    try {
      const supabase = c.get("supabase");
      const code = await createShareLink(supabase, req.workspaceId, req.access);
      const resp: ShareResponse = {
        code,
        url: "/s/" + code,
      };
      return c.json(resp);
    } catch (err) {
      return c.text(err instanceof Error ? err.message : String(err), 500);
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

    if (result.access === "readonly") {
      return c.redirect(`${frontendUrl}/#/${result.workspaceId}?access=readonly`, 302);
    }
    return c.redirect(`${frontendUrl}/#/${result.workspaceId}`, 302);
  };
}
