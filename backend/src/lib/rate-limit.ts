import type { Context, MiddlewareHandler } from "hono";

interface RateLimitOptions {
  windowMs: number;
  limit: number;
  keyGenerator: (c: Context) => string;
}

export function kvRateLimiter(options: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const kv = (c.env as any).RATE_LIMIT_KV;
    if (!kv) return next(); // Skip if KV not available (local dev)

    const key = `rl:${options.keyGenerator(c)}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    const raw = (await kv.get(key, "json")) as { timestamps: number[] } | null;
    const timestamps = (raw?.timestamps ?? []).filter((t: number) => t > windowStart);

    if (timestamps.length >= options.limit) {
      return c.json({ error: "Too many requests" }, 429);
    }

    timestamps.push(now);
    await kv.put(key, JSON.stringify({ timestamps }), {
      expirationTtl: Math.ceil(options.windowMs / 1000),
    });

    await next();
  };
}
