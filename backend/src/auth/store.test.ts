import { describe, it, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import {
  upsertUser,
  createSession,
  getSessionUser,
  deleteSession,
  cleanExpiredSessions,
} from "./store";

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

describe("upsertUser", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
  });

  it("creates a new user", () => {
    const userId = upsertUser(
      db,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "https://example.com/avatar.png",
    );
    expect(typeof userId).toBe("string");
    expect(userId.length).toBeGreaterThan(0);

    // Verify user exists in DB
    const row = db
      .query<{ email: string }, [string]>(
        "SELECT email FROM user WHERE id = ?",
      )
      .get(userId);
    expect(row?.email).toBe("test@example.com");
  });

  it("finds existing user by provider ID and updates info", () => {
    const userId1 = upsertUser(
      db,
      "google",
      "google-123",
      "test@example.com",
      "Old Name",
      "",
    );
    const userId2 = upsertUser(
      db,
      "google",
      "google-123",
      "test@example.com",
      "New Name",
      "https://new-avatar.png",
    );
    expect(userId1).toBe(userId2);

    const row = db
      .query<{ name: string; avatar_url: string }, [string]>(
        "SELECT name, avatar_url FROM user WHERE id = ?",
      )
      .get(userId1);
    expect(row?.name).toBe("New Name");
    expect(row?.avatar_url).toBe("https://new-avatar.png");
  });

  it("links by email when same email with different provider", () => {
    const userId1 = upsertUser(
      db,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "",
    );
    const userId2 = upsertUser(
      db,
      "apple",
      "apple-456",
      "test@example.com",
      "Test User",
      "",
    );
    expect(userId1).toBe(userId2);

    // Verify two providers linked to the same user
    const providers = db
      .query<{ provider: string }, [string]>(
        "SELECT provider FROM user_provider WHERE user_id = ?",
      )
      .all(userId1);
    expect(providers).toHaveLength(2);
    expect(providers.map((p) => p.provider).sort()).toEqual(["apple", "google"]);
  });
});

describe("createSession + getSessionUser", () => {
  let db: Database;
  let userId: string;

  beforeEach(() => {
    db = createTestDb();
    userId = upsertUser(
      db,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "https://avatar.png",
    );
  });

  it("creates a session and retrieves the user", () => {
    const token = createSession(db, userId, 3600); // 1 hour
    expect(typeof token).toBe("string");
    expect(token.length).toBe(64); // 32 bytes hex

    const user = getSessionUser(db, token);
    expect(user).not.toBeNull();
    expect(user!.id).toBe(userId);
    expect(user!.email).toBe("test@example.com");
    expect(user!.name).toBe("Test User");
    expect(user!.avatarUrl).toBe("https://avatar.png");
  });

  it("returns null for expired session", () => {
    // Create a session that expires immediately (0 seconds)
    const token = createSession(db, userId, 0);

    // Manually set expires_at to the past
    db.run("UPDATE session SET expires_at = datetime('now', '-1 hour') WHERE id = ?", [token]);

    const user = getSessionUser(db, token);
    expect(user).toBeNull();
  });

  it("returns null for unknown token", () => {
    const user = getSessionUser(db, "nonexistent-token");
    expect(user).toBeNull();
  });
});

describe("deleteSession", () => {
  let db: Database;
  let userId: string;

  beforeEach(() => {
    db = createTestDb();
    userId = upsertUser(
      db,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "",
    );
  });

  it("removes the session so getSessionUser returns null", () => {
    const token = createSession(db, userId, 3600);
    expect(getSessionUser(db, token)).not.toBeNull();

    deleteSession(db, token);
    expect(getSessionUser(db, token)).toBeNull();
  });
});

describe("cleanExpiredSessions", () => {
  let db: Database;
  let userId: string;

  beforeEach(() => {
    db = createTestDb();
    userId = upsertUser(
      db,
      "google",
      "google-123",
      "test@example.com",
      "Test User",
      "",
    );
  });

  it("removes expired sessions", () => {
    const token = createSession(db, userId, 3600);

    // Manually expire the session
    db.run(
      "UPDATE session SET expires_at = datetime('now', '-1 hour') WHERE id = ?",
      [token],
    );

    cleanExpiredSessions(db);

    const row = db
      .query<{ id: string }, [string]>("SELECT id FROM session WHERE id = ?")
      .get(token);
    expect(row).toBeNull();
  });

  it("does not remove valid sessions", () => {
    const token = createSession(db, userId, 3600);
    cleanExpiredSessions(db);

    const row = db
      .query<{ id: string }, [string]>("SELECT id FROM session WHERE id = ?")
      .get(token);
    expect(row).not.toBeNull();
  });
});
