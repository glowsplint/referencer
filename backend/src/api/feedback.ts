import type { Context } from "hono";
import type { Env } from "../env";

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

    const body = await c.req.json<{ title: string; description: string }>();
    if (!body.title?.trim()) {
      return c.json({ error: "Title is required" }, 400);
    }
    if (body.title.length > 200) {
      return c.json({ error: "Title must be at most 200 characters" }, 400);
    }
    if (body.description && body.description.length > 5000) {
      return c.json({ error: "Description must be at most 5000 characters" }, 400);
    }

    const ua = c.req.header("user-agent") || "unknown";
    const hashBuf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(user.id),
    );
    const userHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 8);
    const issueBody = [
      body.description || "",
      "",
      "---",
      `**Reported by:** (user ${userHash})`,
      `**User-Agent:** ${ua}`,
      `**Timestamp:** ${new Date().toISOString()}`,
    ].join("\n");

    const githubIssuesUrl =
      c.env.GITHUB_ISSUES_REPO || "https://api.github.com/repos/glowsplint/referencer/issues";

    if (!githubIssuesUrl.startsWith("https://api.github.com/")) {
      log.error("POST /api/feedback misconfigured URL", { url: githubIssuesUrl });
      return c.json({ error: "Misconfigured feedback endpoint" }, 500);
    }

    // Increment rate limit counter BEFORE the API call to prevent TOCTOU bypass
    await kv.put(rateKey, String(current + 1), { expirationTtl: 3600 });

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
          title: body.title.trim(),
          body: issueBody,
          labels: ["bug", "user-reported"],
        }),
      });

      if (!resp.ok) {
        log.error("POST /api/feedback GitHub API error", { userId: user.id, status: resp.status });
        return c.json({ error: "Failed to create issue" }, 502);
      }

      const data = (await resp.json()) as { html_url: string };
      log.info("POST /api/feedback", { userId: user.id });
      return c.json({ ok: true, url: data.html_url });
    } catch (err) {
      log.error("POST /api/feedback failed", { userId: user.id });
      return c.json({ error: "Failed to submit feedback" }, 500);
    }
  };
}
