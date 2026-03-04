import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { rateLimiter, _resetStoreForTesting } from "./rate-limit";

function createApp(options: { windowMs: number; limit: number }) {
  const app = new Hono();

  app.use("*", async (c, next) => {
    c.set("logger", { info: () => {}, error: () => {}, warn: () => {} });
    c.set("metrics", {
      trackRequest: () => {},
      trackAuthEvent: () => {},
      trackRateLimit: () => {},
      trackError: () => {},
    });
    await next();
  });

  const limiter = rateLimiter({
    windowMs: options.windowMs,
    limit: options.limit,
    keyGenerator: (c) => c.req.header("x-test-key") ?? "default",
  });

  app.get("/test", limiter, (c) => c.json({ ok: true }));
  return app;
}

describe("rateLimiter", () => {
  beforeEach(() => {
    _resetStoreForTesting();
  });

  it("allows requests under limit", async () => {
    const app = createApp({ windowMs: 60_000, limit: 3 });

    for (let i = 0; i < 3; i++) {
      const res = await app.request("/test");
      expect(res.status).toBe(200);
    }
  });

  it("returns 429 when limit exceeded", async () => {
    const app = createApp({ windowMs: 60_000, limit: 2 });

    await app.request("/test");
    await app.request("/test");
    const res = await app.request("/test");

    expect(res.status).toBe(429);
    const body = (await res.json()) as any;
    expect(body.error).toBe("Too many requests");
  });

  it("includes Retry-After header on 429", async () => {
    const app = createApp({ windowMs: 60_000, limit: 1 });

    await app.request("/test");
    const res = await app.request("/test");

    expect(res.status).toBe(429);
    const retryAfter = res.headers.get("Retry-After");
    expect(retryAfter).toBeTruthy();
    expect(Number(retryAfter)).toBeGreaterThan(0);
    expect(Number(retryAfter)).toBeLessThanOrEqual(60);
  });

  it("resets after window expires", async () => {
    const realDateNow = Date.now;
    let fakeNow = realDateNow.call(Date);
    Date.now = () => fakeNow;

    try {
      const app = createApp({ windowMs: 1_000, limit: 1 });

      const res1 = await app.request("/test");
      expect(res1.status).toBe(200);

      const res2 = await app.request("/test");
      expect(res2.status).toBe(429);

      // Advance time past the window
      fakeNow += 1_100;

      const res3 = await app.request("/test");
      expect(res3.status).toBe(200);
    } finally {
      Date.now = realDateNow;
    }
  });

  it("tracks multiple keys independently", async () => {
    const app = createApp({ windowMs: 60_000, limit: 1 });

    const res1 = await app.request("/test", {
      headers: { "x-test-key": "user-a" },
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request("/test", {
      headers: { "x-test-key": "user-b" },
    });
    expect(res2.status).toBe(200);

    // user-a is now rate limited
    const res3 = await app.request("/test", {
      headers: { "x-test-key": "user-a" },
    });
    expect(res3.status).toBe(429);

    // user-b is also rate limited
    const res4 = await app.request("/test", {
      headers: { "x-test-key": "user-b" },
    });
    expect(res4.status).toBe(429);
  });
});
