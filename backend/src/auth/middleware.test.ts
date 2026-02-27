import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
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

function seedUser() {
  const userId = "user-1";
  users.push({
    id: userId,
    email: "test@example.com",
    name: "Test User",
    avatar_url: "https://avatar.png",
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  });
  return userId;
}

async function seedSession(
  userId: string,
  token: string,
  opts?: { expired?: boolean; old?: boolean },
) {
  const now = new Date();
  const hashedToken = await hashToken(token);
  sessions.push({
    id: hashedToken,
    user_id: userId,
    created_at: opts?.old
      ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      : now.toISOString(),
    expires_at: opts?.expired
      ? new Date(now.getTime() - 3600 * 1000).toISOString()
      : new Date(now.getTime() + 3600 * 1000).toISOString(),
  });
}

function createApp() {
  const app = new Hono<Env>();

  app.use("*", async (c, next) => {
    c.set("supabase", createMockSupabase());
    await next();
  });

  app.use("*", optionalAuth(testConfig));

  app.get("/test", (c) => {
    const user = c.get("user");
    return c.json({ user });
  });

  return app;
}

describe("optionalAuth middleware", () => {
  beforeEach(() => {
    users = [];
    sessions = [];
  });

  it("sets user to null when no session cookie is present", async () => {
    const app = createApp();

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.user).toBeNull();
  });

  it("sets user when valid session cookie is present", async () => {
    const userId = seedUser();
    await seedSession(userId, "valid-token");

    const app = createApp();

    const res = await app.request("/test", {
      headers: { Cookie: "__session=valid-token" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.user).not.toBeNull();
    expect(body.user.id).toBe("user-1");
    expect(body.user.email).toBe("test@example.com");
  });

  it("sets user to null for invalid session token", async () => {
    const app = createApp();

    const res = await app.request("/test", {
      headers: { Cookie: "__session=nonexistent-token" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.user).toBeNull();
  });

  it("sets user to null for expired session", async () => {
    const userId = seedUser();
    await seedSession(userId, "expired-token", { expired: true });

    const app = createApp();

    const res = await app.request("/test", {
      headers: { Cookie: "__session=expired-token" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.user).toBeNull();
  });

  it("rotates session token when session is older than 24 hours", async () => {
    const userId = seedUser();
    await seedSession(userId, "old-token", { old: true });

    const app = createApp();

    const res = await app.request("/test", {
      headers: { Cookie: "__session=old-token" },
    });

    // Old session should be deleted
    const hashedOldToken = await hashToken("old-token");
    const oldSession = sessions.find((s) => s.id === hashedOldToken);
    expect(oldSession).toBeUndefined();

    // A new session should exist for the same user
    const newSession = sessions.find((s) => s.user_id === userId);
    expect(newSession).toBeDefined();
    expect(newSession!.id).not.toBe(hashedOldToken);

    // Response should set a new cookie
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("__session=");
  });
});
