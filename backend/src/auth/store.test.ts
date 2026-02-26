import { describe, it, expect, beforeEach } from "bun:test";
import {
  upsertUser,
  createSession,
  getSessionUser,
  deleteSession,
  cleanExpiredSessions,
  hashToken,
} from "./store";

// In-memory stores to simulate Supabase tables
let users: Array<Record<string, string>>;
let userProviders: Array<Record<string, string>>;
let sessions: Array<Record<string, string>>;

function createMockSupabase() {
  return {
    from(table: string) {
      function getStore(): Array<Record<string, string>> {
        if (table === "user") return users;
        if (table === "user_provider") return userProviders;
        if (table === "session") return sessions;
        return [];
      }

      return {
        select(_cols: string) {
          return {
            eq(col1: string, val1: string) {
              const filtered = () => getStore().filter((r) => r[col1] === val1);
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
                order(col: string, opts: { ascending: boolean }) {
                  const rows = [...filtered()];
                  rows.sort((a, b) =>
                    opts.ascending ? (a[col] < b[col] ? -1 : 1) : a[col] > b[col] ? -1 : 1,
                  );
                  return Promise.resolve({ data: rows });
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
              const store = getStore();
              for (const row of store) {
                if (row[col] === val) {
                  Object.assign(row, fields);
                }
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
            in(col: string, vals: string[]) {
              const store = getStore();
              for (let i = store.length - 1; i >= 0; i--) {
                if (vals.includes(store[i][col])) {
                  store.splice(i, 1);
                }
              }
              return Promise.resolve({ error: null });
            },
            lt(col: string, val: string) {
              const store = getStore();
              for (let i = store.length - 1; i >= 0; i--) {
                if (store[i][col] < val) {
                  store.splice(i, 1);
                }
              }
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },

    rpc(
      _fn: string,
      params: {
        p_user_id: string;
        p_email: string;
        p_name: string;
        p_avatar_url: string;
        p_provider_id: string;
        p_provider: string;
        p_provider_user_id: string;
      },
    ) {
      users.push({
        id: params.p_user_id,
        email: params.p_email,
        name: params.p_name,
        avatar_url: params.p_avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      userProviders.push({
        id: params.p_provider_id,
        user_id: params.p_user_id,
        provider: params.p_provider,
        provider_user_id: params.p_provider_user_id,
        created_at: new Date().toISOString(),
      });
      return Promise.resolve({ error: null });
    },
  } as any;
}

describe("upsertUser", () => {
  let supabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    users = [];
    userProviders = [];
    sessions = [];
    supabase = createMockSupabase();
  });

  it("creates a new user", async () => {
    const userId = await upsertUser(
      supabase,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "https://example.com/avatar.png",
    );
    expect(typeof userId).toBe("string");
    expect(userId.length).toBeGreaterThan(0);

    // Verify user exists in store
    const user = users.find((u) => u.id === userId);
    expect(user).toBeDefined();
    expect(user!.email).toBe("test@example.com");
    expect(user!.name).toBe("Test User");
    expect(user!.avatar_url).toBe("https://example.com/avatar.png");

    // Verify provider record was created
    const provider = userProviders.find((p) => p.user_id === userId);
    expect(provider).toBeDefined();
    expect(provider!.provider).toBe("google");
    expect(provider!.provider_user_id).toBe("google-123");
  });

  it("finds existing user by provider ID and updates info", async () => {
    const userId1 = await upsertUser(
      supabase,
      "google",
      "google-123",
      "test@example.com",
      "Old Name",
      "",
    );
    const userId2 = await upsertUser(
      supabase,
      "google",
      "google-123",
      "test@example.com",
      "New Name",
      "https://new-avatar.png",
    );
    expect(userId1).toBe(userId2);

    const user = users.find((u) => u.id === userId1);
    expect(user!.name).toBe("New Name");
    expect(user!.avatar_url).toBe("https://new-avatar.png");
  });

  it("links by email when same email with different provider", async () => {
    const userId1 = await upsertUser(
      supabase,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "",
      true,
    );
    const userId2 = await upsertUser(
      supabase,
      "github",
      "github-456",
      "test@example.com",
      "Test User",
      "",
      true,
    );
    expect(userId1).toBe(userId2);

    // Verify two providers linked to the same user
    const providers = userProviders.filter((p) => p.user_id === userId1);
    expect(providers).toHaveLength(2);
    expect(providers.map((p) => p.provider).sort()).toEqual(["github", "google"]);
  });
});

describe("createSession + getSessionUser", () => {
  let supabase: ReturnType<typeof createMockSupabase>;
  let userId: string;

  beforeEach(async () => {
    users = [];
    userProviders = [];
    sessions = [];
    supabase = createMockSupabase();
    userId = await upsertUser(
      supabase,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "https://avatar.png",
    );
  });

  it("creates a session and retrieves the user", async () => {
    const token = await createSession(supabase, userId, 3600); // 1 hour
    expect(typeof token).toBe("string");
    expect(token.length).toBe(64); // 32 bytes hex

    const user = await getSessionUser(supabase, token);
    expect(user).not.toBeNull();
    expect(user!.id).toBe(userId);
    expect(user!.email).toBe("test@example.com");
    expect(user!.name).toBe("Test User");
    expect(user!.avatarUrl).toBe("https://avatar.png");
  });

  it("returns null for expired session", async () => {
    const token = await createSession(supabase, userId, 3600);

    // Manually set expires_at to the past
    const hashedId = await hashToken(token);
    const session = sessions.find((s) => s.id === hashedId);
    session!.expires_at = new Date(Date.now() - 3600 * 1000).toISOString();

    const user = await getSessionUser(supabase, token);
    expect(user).toBeNull();
  });

  it("returns null for unknown token", async () => {
    const user = await getSessionUser(supabase, "nonexistent-token");
    expect(user).toBeNull();
  });
});

describe("deleteSession", () => {
  let supabase: ReturnType<typeof createMockSupabase>;
  let userId: string;

  beforeEach(async () => {
    users = [];
    userProviders = [];
    sessions = [];
    supabase = createMockSupabase();
    userId = await upsertUser(
      supabase,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "",
    );
  });

  it("removes the session so getSessionUser returns null", async () => {
    const token = await createSession(supabase, userId, 3600);
    expect(await getSessionUser(supabase, token)).not.toBeNull();

    await deleteSession(supabase, token);
    expect(await getSessionUser(supabase, token)).toBeNull();
  });
});

describe("cleanExpiredSessions", () => {
  let supabase: ReturnType<typeof createMockSupabase>;
  let userId: string;

  beforeEach(async () => {
    users = [];
    userProviders = [];
    sessions = [];
    supabase = createMockSupabase();
    userId = await upsertUser(
      supabase,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "",
    );
  });

  it("removes expired sessions", async () => {
    const token = await createSession(supabase, userId, 3600);

    // Manually expire the session
    const hashedId = await hashToken(token);
    const session = sessions.find((s) => s.id === hashedId);
    session!.expires_at = new Date(Date.now() - 3600 * 1000).toISOString();

    await cleanExpiredSessions(supabase);

    const remaining = sessions.find((s) => s.id === hashedId);
    expect(remaining).toBeUndefined();
  });

  it("does not remove valid sessions", async () => {
    const token = await createSession(supabase, userId, 3600);
    await cleanExpiredSessions(supabase);

    const hashedId = await hashToken(token);
    const remaining = sessions.find((s) => s.id === hashedId);
    expect(remaining).toBeDefined();
  });
});
