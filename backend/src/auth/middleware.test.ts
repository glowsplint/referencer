import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { Database } from "bun:sqlite";
import { optionalAuth } from "./middleware";
import type { AuthConfig } from "./config";
import { upsertUser, createSession } from "./store";
import type { User } from "../types";

const schema = `
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON user(email);

CREATE TABLE IF NOT EXISTS user_provider (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON session(expires_at);
`;

function createTestDb(): Database {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  db.exec(schema);
  return db;
}

const testConfig: AuthConfig = {
  baseUrl: "http://localhost:5000",
  cookieSecure: false,
  sessionMaxAge: 3600,
  google: null,
  github: null,
};

describe("optionalAuth middleware", () => {
  let db: Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("sets user to null when no session cookie is present", async () => {
    const app = new Hono();
    app.use("*", optionalAuth(db, testConfig));
    app.get("/test", (c) => {
      const user = c.get("user");
      return c.json({ user });
    });

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it("sets user when valid session cookie is present", async () => {
    const userId = upsertUser(
      db,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "https://avatar.png",
    );
    const token = createSession(db, userId, 3600);

    const app = new Hono();
    app.use("*", optionalAuth(db, testConfig));
    app.get("/test", (c) => {
      const user = c.get("user");
      return c.json({ user });
    });

    const res = await app.request("/test", {
      headers: { Cookie: `__session=${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).not.toBeNull();
    expect(body.user.id).toBe(userId);
    expect(body.user.email).toBe("test@example.com");
  });

  it("sets user to null for invalid session token", async () => {
    const app = new Hono();
    app.use("*", optionalAuth(db, testConfig));
    app.get("/test", (c) => {
      const user = c.get("user");
      return c.json({ user });
    });

    const res = await app.request("/test", {
      headers: { Cookie: "__session=nonexistent-token" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it("sets user to null for expired session", async () => {
    const userId = upsertUser(db, "google", "google-123", "test@example.com", "Test User", "");
    const token = createSession(db, userId, 0);
    db.run("UPDATE session SET expires_at = datetime('now', '-1 hour') WHERE id = ?", [token]);

    const app = new Hono();
    app.use("*", optionalAuth(db, testConfig));
    app.get("/test", (c) => {
      const user = c.get("user");
      return c.json({ user });
    });

    const res = await app.request("/test", {
      headers: { Cookie: `__session=${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it("refreshes session that is older than 24 hours", async () => {
    const userId = upsertUser(db, "google", "google-123", "test@example.com", "Test User", "");
    const token = createSession(db, userId, 3600);

    // Set created_at to 2 days ago
    db.run("UPDATE session SET created_at = datetime('now', '-2 days') WHERE id = ?", [token]);

    const oldRow = db
      .query<{ created_at: string }, [string]>("SELECT created_at FROM session WHERE id = ?")
      .get(token);

    const app = new Hono();
    app.use("*", optionalAuth(db, testConfig));
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test", {
      headers: { Cookie: `__session=${token}` },
    });

    const newRow = db
      .query<{ created_at: string }, [string]>("SELECT created_at FROM session WHERE id = ?")
      .get(token);

    // created_at should have been updated (refreshed)
    expect(newRow!.created_at).not.toBe(oldRow!.created_at);
  });
});
