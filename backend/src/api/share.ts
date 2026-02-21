import type { Context } from "hono";
import type { Database } from "bun:sqlite";
import { createShareLink, resolveShareLink } from "../db/share-queries";
import type { ShareRequest, ShareResponse } from "../types";

export function handleShare(db: Database) {
  return async (c: Context) => {
    const req = await c.req.json<ShareRequest>();

    if (req.access !== "edit" && req.access !== "readonly") {
      return c.json({ error: "access must be 'edit' or 'readonly'" }, 400);
    }

    try {
      const code = createShareLink(db, req.workspaceId, req.access);
      const resp: ShareResponse = {
        code,
        url: "/s/" + code,
      };
      return c.json(resp);
    } catch (err) {
      return c.text(
        err instanceof Error ? err.message : String(err),
        500,
      );
    }
  };
}

export function handleResolveShare(db: Database, staticDir: string) {
  return async (c: Context) => {
    const code = c.req.param("code");
    if (!code) {
      return c.text("code required", 400);
    }

    const result = resolveShareLink(db, code);
    if (!result) {
      // Share link not found - serve index.html as fallback.
      const html = await Bun.file(`${staticDir}/index.html`).text();
      return c.html(html);
    }

    if (result.access === "readonly") {
      return c.redirect(`/space/${result.workspaceId}?access=readonly`, 302);
    }
    return c.redirect(`/space/${result.workspaceId}`, 302);
  };
}
