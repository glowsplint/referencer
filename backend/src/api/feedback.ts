import type { Context } from "hono";
import type { Env } from "../env";
import { parseUserAgent } from "../lib/ua-parser";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function handleFeedback() {
  return async (c: Context<Env>) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const log = c.get("logger");

    const token = c.env.GITHUB_ISSUES_TOKEN;
    if (!token) return c.json({ error: "Feedback not configured" }, 503);

    // Rate limit: 3 per hour per user
    const kv = c.env.RATE_LIMIT_KV;
    const rateKey = `feedback:${user.id}`;
    const current = parseInt((await kv.get(rateKey)) || "0", 10);
    if (current >= 3) {
      return c.json({ error: "Rate limit exceeded. Try again later." }, 429);
    }

    const form = await c.req.parseBody();
    const title = typeof form.title === "string" ? form.title : "";
    const description = typeof form.description === "string" ? form.description : "";
    const viewport = typeof form.viewport === "string" ? form.viewport : "";
    const appVersion = typeof form.appVersion === "string" ? form.appVersion : "";
    const image = form.image instanceof File ? form.image : null;

    if (!title.trim()) {
      return c.json({ error: "Title is required" }, 400);
    }
    if (title.length > 200) {
      return c.json({ error: "Title must be at most 200 characters" }, 400);
    }
    if (description && description.length > 5000) {
      return c.json({ error: "Description must be at most 5000 characters" }, 400);
    }

    // Validate and upload image if provided
    let screenshotUrl: string | null = null;
    if (image && image.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
        return c.json({ error: "Image must be PNG, JPEG, WebP, or GIF" }, 400);
      }
      if (image.size > MAX_IMAGE_SIZE) {
        return c.json({ error: "Image must be at most 5MB" }, 400);
      }

      const r2 = c.env.BUG_REPORT_IMAGES;
      const r2PublicUrl = c.env.R2_PUBLIC_URL;
      if (r2 && r2PublicUrl) {
        const ext = image.type.split("/")[1] === "jpeg" ? "jpg" : image.type.split("/")[1];
        const random = crypto.randomUUID().slice(0, 8);
        const key = `bug-reports/${user.id}/${Date.now()}-${random}.${ext}`;

        try {
          await r2.put(key, await image.arrayBuffer(), {
            httpMetadata: { contentType: image.type },
          });
          screenshotUrl = `${r2PublicUrl.replace(/\/$/, "")}/${key}`;
        } catch (err) {
          log.error("R2 upload failed", { userId: user.id });
          // Continue without screenshot — graceful degradation
        }
      }
    }

    const ua = c.req.header("user-agent") || "unknown";
    const browserInfo = parseUserAgent(ua);
    const timestamp = new Date().toISOString();

    const bodyParts: string[] = [];
    if (description) {
      bodyParts.push(description);
      bodyParts.push("");
    }

    if (screenshotUrl) {
      bodyParts.push("**Screenshot:**");
      bodyParts.push(`![screenshot](${screenshotUrl})`);
      bodyParts.push("");
    }

    bodyParts.push("---");
    bodyParts.push("| Field | Value |");
    bodyParts.push("|---|---|");
    bodyParts.push(`| Browser | ${browserInfo} |`);
    if (viewport) {
      bodyParts.push(`| Viewport | ${viewport} |`);
    }
    if (appVersion) {
      bodyParts.push(`| App Version | \`${appVersion}\` |`);
    }
    bodyParts.push(`| User-Agent | \`${ua}\` |`);
    bodyParts.push(`| Reported by | user ${user.id} |`);
    bodyParts.push(`| Timestamp | ${timestamp} |`);

    const issueBody = bodyParts.join("\n");

    const githubIssuesUrl =
      c.env.GITHUB_ISSUES_REPO || "https://api.github.com/repos/glowsplint/referencer/issues";

    try {
      const resp = await fetch(githubIssuesUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "referencer-backend",
        },
        body: JSON.stringify({
          title: title.trim(),
          body: issueBody,
          labels: ["bug", "user-reported"],
        }),
      });

      if (!resp.ok) {
        log.error("POST /api/feedback GitHub API error", { userId: user.id, status: resp.status });
        return c.json({ error: "Failed to create issue" }, 502);
      }

      // Increment rate limit counter
      await kv.put(rateKey, String(current + 1), { expirationTtl: 3600 });

      const data = (await resp.json()) as { html_url: string };
      log.info("POST /api/feedback", { userId: user.id });
      return c.json({ ok: true, url: data.html_url });
    } catch (err) {
      log.error("POST /api/feedback failed", { userId: user.id });
      return c.json({ error: "Failed to submit feedback" }, 500);
    }
  };
}
