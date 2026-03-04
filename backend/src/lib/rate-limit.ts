import type { Context, MiddlewareHandler } from "hono";
import { log } from "./logger";
import type { Metrics } from "./metrics";

interface RateLimitOptions {
  windowMs: number;
  limit: number;
  keyGenerator: (c: Context) => string;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * SECURITY NOTE: This rate limiter uses an in-memory Map scoped to a single
 * Cloudflare Worker isolate. State resets on isolate recycle and there is no
 * cross-isolate or cross-PoP coordination. This is acceptable because:
 *   (a) the previous KV solution already had eventual consistency gaps,
 *   (b) this is a small personal app (not a high-value target),
 *   (c) Cloudflare's built-in DDoS protection and WAF provide the first line of defense.
 * If stricter auth rate limiting is needed, Cloudflare WAF custom rules (free tier)
 * can be added at the edge.
 */

const store = new Map<string, RateLimitEntry>();

const SWEEP_INTERVAL_MS = 60_000;
const MAX_WINDOW_MS = 3_600_000; // 1 hour — covers all configured limiters
let lastSweep = Date.now();

function lazySweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of store) {
    if (now - entry.windowStart > MAX_WINDOW_MS) {
      store.delete(key);
    }
  }
}

export function rateLimiter(options: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const key = `rl:${options.keyGenerator(c)}`;
    const now = Date.now();

    lazySweep(now);

    const entry = store.get(key);

    if (entry && now - entry.windowStart < options.windowMs) {
      if (entry.count >= options.limit) {
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
        const retryAfter = Math.ceil((options.windowMs - (now - entry.windowStart)) / 1000);
        c.header("Retry-After", String(retryAfter));
        return c.json({ error: "Too many requests" }, 429);
      }
      entry.count++;
    } else {
      store.set(key, { count: 1, windowStart: now });
    }

    await next();
  };
}

/** Reset the in-memory store. For test isolation only. */
export function _resetStoreForTesting() {
  store.clear();
  lastSweep = Date.now();
}
