import type { Context, MiddlewareHandler } from "hono";
import { log } from "./logger";
import type { Metrics } from "./metrics";

interface RateLimitOptions {
  windowMs: number;
  limit: number;
  keyGenerator: (c: Context) => string;
}

/**
 * SECURITY NOTE: This rate limiter uses Cloudflare KV which has eventual consistency.
 * Two near-simultaneous requests may both read the old counter before either write completes,
 * allowing slightly more requests than the configured limit. For stricter enforcement,
 * consider Durable Objects or Workers KV with compare-and-swap (when available).
 */
export function kvRateLimiter(options: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const kv = (c.env as any).RATE_LIMIT_KV;
    if (!kv) {
      log.warn("rate_limit_kv_unavailable");
      return c.json({ error: "Service temporarily unavailable" }, 503);
    }

    const key = `rl:${options.keyGenerator(c)}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    const raw = (await kv.get(key, "json")) as { timestamps: number[] } | null;
    const timestamps = (raw?.timestamps ?? []).filter((t: number) => t > windowStart);

    if (timestamps.length >= options.limit) {
      // Logger may not be available if this runs before the logger middleware,
      // but in our setup the logger middleware runs first on "*".
      try {
        const reqLog = (c as any).get("logger");
        reqLog?.warn("Rate limit exceeded", {
          endpoint: c.req.path,
          method: c.req.method,
          limit: options.limit,
        });
        const metrics: Metrics | undefined = (c as any).get("metrics");
        metrics?.trackRateLimit(c.req.path, c.req.method);
      } catch {
        // Logger/metrics not available — fall through
      }
      return c.json({ error: "Too many requests" }, 429);
    }

    timestamps.push(now);
    try {
      await kv.put(key, JSON.stringify({ timestamps }), {
        expirationTtl: Math.ceil(options.windowMs / 1000),
      });
    } catch {
      log.warn("rate_limit_kv_put_failed", { key });
    }

    await next();
  };
}
