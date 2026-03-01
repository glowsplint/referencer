import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { createAuthRoutes } from "./handlers";
import { optionalAuth } from "./middleware";
import { hashToken } from "./store";
import type { AuthConfig } from "./config";
import type { Env } from "../env";

const testConfig: AuthConfig = {
  baseUrl: "http://localhost:5000",
  cookieSecure: false,
  sessionMaxAge: 3600,
  google: null,
  github: null,
};

function createMockKV() {
  const store = new Map<string, string>();
  return {
    get(key: string, _type?: string) {
      const val = store.get(key);
      return Promise.resolve(val ? JSON.parse(val) : null);
    },
    put(key: string, value: string, _opts?: any) {
      store.set(key, value);
      return Promise.resolve();
    },
    delete(key: string) {
      store.delete(key);
      return Promise.resolve();
    },
  };
}

// Minimal env bindings so loadAuthConfig(c.env) works.
const testEnv = {
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_SERVICE_KEY: "test-key",
  FRONTEND_URL: "http://localhost:5173",
  BASE_URL: "http://localhost:5000",
  RATE_LIMIT_KV: createMockKV(),
} as Env["Bindings"];

// In-memory stores for mock Supabase
let users: Array<Record<string, string>>;
let sessions: Array<Record<string, string>>;

function createMockSupabase() {
  return {
    from(table: string) {
      function getStore() {
        if (table === "user") return users;
        if (table === "session") return sessions;
        return [];
      }

      return {
        select(_cols: string) {
          return {
            eq(col1: string, val1: string) {
              return {
                eq(col2: string, val2: string) {
                  return {
                    single() {
                      const found = getStore().find((r) => r[col1] === val1 && r[col2] === val2);
                      return Promise.resolve({ data: found ?? null });
                    },
                  };
                },
                single() {
                  const found = getStore().find((r) => r[col1] === val1);
                  return Promise.resolve({ data: found ?? null });
                },
              };
            },
          };
        },
        insert(row: Record<string, string>) {
          getStore().push({ ...row });
          return Promise.resolve({ error: null });
        },
        update(fields: Record<string, string>) {
          return {
            eq(col: string, val: string) {
              for (const row of getStore()) {
                if (row[col] === val) Object.assign(row, fields);
              }
              return Promise.resolve({ error: null });
            },
          };
        },
        delete() {
          return {
            eq(col: string, val: string) {
              const store = getStore();
              const idx = store.findIndex((r) => r[col] === val);
              if (idx !== -1) store.splice(idx, 1);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  } as any;
}

async function seedUserAndSession() {
  const userId = "user-1";
  const token = "valid-session-token";
  const hashedToken = await hashToken(token);
  users.push({
    id: userId,
    email: "test@example.com",
    name: "Test User",
    avatar_url: "https://avatar.png",
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  });
  sessions.push({
    id: hashedToken,
    user_id: userId,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  });
  return { userId, token };
}

function createApp() {
  const app = new Hono<Env>();

  // Provide env bindings and supabase in context.
  app.use("*", async (c, next) => {
    (c.env as any) = { ...testEnv, ...c.env };
    c.set("supabase", createMockSupabase());
    c.set("logger", { info: () => {}, error: () => {}, warn: () => {} });
    c.set("metrics", {
      trackRequest: () => {},
      trackAuthEvent: () => {},
      trackRateLimit: () => {},
      trackError: () => {},
    });
    await next();
  });

  app.use("*", optionalAuth(testConfig));
  app.route("/auth", createAuthRoutes());
  return app;
}

function request(app: Hono<Env>, path: string, init?: RequestInit) {
  return app.request(path, init, testEnv);
}

describe("auth routes", () => {
  beforeEach(() => {
    users = [];
    sessions = [];
  });

  describe("GET /auth/:provider — unknown provider", () => {
    it("returns 404 for unknown provider", async () => {
      const app = createApp();
      const res = await request(app, "/auth/unknown");
      expect(res.status).toBe(404);
      const body = (await res.json()) as any;
      expect(body.error).toContain("Unknown provider");
    });
  });

  describe("GET /auth/:provider — unconfigured provider", () => {
    it("returns 404 when google is not configured", async () => {
      const app = createApp();
      const res = await request(app, "/auth/google");
      // No providers configured, so getProviderFromMap returns null
      expect(res.status).toBe(404);
    });

    it("returns 404 when github is not configured", async () => {
      const app = createApp();
      const res = await request(app, "/auth/github");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /auth/:provider/callback — error cases", () => {
    it("returns 404 for unknown provider callback", async () => {
      const app = createApp();
      const res = await request(app, "/auth/unknown/callback?code=abc&state=xyz");
      expect(res.status).toBe(404);
      const body = (await res.json()) as any;
      expect(body.error).toContain("Unknown provider");
    });

    it("returns 400 when missing auth state cookie", async () => {
      // Provide google config so the provider is found.
      const appWithGoogle = new Hono<Env>();
      const envWithGoogle = {
        ...testEnv,
        GOOGLE_CLIENT_ID: "test-id",
        GOOGLE_CLIENT_SECRET: "test-secret",
      };
      appWithGoogle.use("*", async (c, next) => {
        (c.env as any) = { ...envWithGoogle, ...c.env };
        c.set("supabase", createMockSupabase());
        c.set("logger", { info: () => {}, error: () => {}, warn: () => {} });
        c.set("metrics", {
          trackRequest: () => {},
          trackAuthEvent: () => {},
          trackRateLimit: () => {},
          trackError: () => {},
        });
        await next();
      });
      appWithGoogle.use("*", optionalAuth(testConfig));
      appWithGoogle.route("/auth", createAuthRoutes());

      const res = await appWithGoogle.request(
        "/auth/google/callback?code=abc&state=xyz",
        undefined,
        envWithGoogle as any,
      );
      expect(res.status).toBe(400);
      const body = (await res.json()) as any;
      expect(body.error).toContain("Missing auth state");
    });
  });

  describe("GET /auth/me", () => {
    it("returns unauthenticated when no session cookie", async () => {
      const app = createApp();
      const res = await request(app, "/auth/me");
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.authenticated).toBe(false);
    });

    it("returns unauthenticated for invalid session token", async () => {
      const app = createApp();
      const res = await request(app, "/auth/me", {
        headers: { Cookie: "__session=invalid-token" },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.authenticated).toBe(false);
    });

    it("returns authenticated user with valid session", async () => {
      const { token } = await seedUserAndSession();

      const app = createApp();
      const res = await request(app, "/auth/me", {
        headers: { Cookie: `__session=${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.authenticated).toBe(true);
      expect(body.user.id).toBe("user-1");
      expect(body.user.email).toBe("test@example.com");
      expect(body.user.name).toBe("Test User");
    });

    it("returns unauthenticated for expired session", async () => {
      const userId = "user-1";
      const hashedExpired = await hashToken("expired-token");
      users.push({
        id: userId,
        email: "test@example.com",
        name: "Test User",
        avatar_url: "",
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      sessions.push({
        id: hashedExpired,
        user_id: userId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      });

      const app = createApp();
      const res = await request(app, "/auth/me", {
        headers: { Cookie: "__session=expired-token" },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.authenticated).toBe(false);
    });
  });

  describe("POST /auth/logout", () => {
    it("returns ok when no session exists", async () => {
      const app = createApp();
      const res = await request(app, "/auth/logout", { method: "POST" });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.ok).toBe(true);
    });

    it("deletes session and returns ok", async () => {
      const { token } = await seedUserAndSession();

      const app = createApp();
      const res = await request(app, "/auth/logout", {
        method: "POST",
        headers: { Cookie: `__session=${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.ok).toBe(true);

      // Verify the session is deleted from the in-memory store
      const hashedToken = await hashToken(token);
      const remaining = sessions.find((s) => s.id === hashedToken);
      expect(remaining).toBeUndefined();
    });

    it("clears the session cookie", async () => {
      const app = createApp();
      const res = await request(app, "/auth/logout", { method: "POST" });
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("__session=");
    });
  });
});
