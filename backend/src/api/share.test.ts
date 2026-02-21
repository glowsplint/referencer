import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { Database } from "bun:sqlite";
import { handleShare, handleResolveShare } from "./share";

const schema = `
CREATE TABLE IF NOT EXISTS workspace (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS share_link (
    code TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    access TEXT NOT NULL CHECK (access IN ('edit', 'readonly')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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

const WS_ID = "test-workspace-1";

describe("share API routes", () => {
  let db: Database;

  beforeEach(() => {
    db = createTestDb();
    db.run("INSERT INTO workspace (id) VALUES (?)", [WS_ID]);
  });

  describe("POST /api/share", () => {
    it("creates an edit share link", async () => {
      const app = new Hono();
      app.post("/api/share", handleShare(db));

      const res = await app.request("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WS_ID, access: "edit" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.code).toBeDefined();
      expect(body.code).toHaveLength(6);
      expect(body.url).toBe(`/s/${body.code}`);
    });

    it("creates a readonly share link", async () => {
      const app = new Hono();
      app.post("/api/share", handleShare(db));

      const res = await app.request("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WS_ID, access: "readonly" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.code).toHaveLength(6);
    });

    it("returns 400 for invalid access type", async () => {
      const app = new Hono();
      app.post("/api/share", handleShare(db));

      const res = await app.request("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WS_ID, access: "invalid" }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("access");
    });
  });

  describe("GET /s/:code — share link resolution", () => {
    it("redirects to workspace for valid edit share code", async () => {
      // Create a share link directly in DB
      db.run("INSERT INTO share_link (code, workspace_id, access) VALUES (?, ?, ?)", [
        "ABC123",
        WS_ID,
        "edit",
      ]);

      const app = new Hono();
      app.get("/s/:code", handleResolveShare(db, "/tmp/fake-static"));

      const res = await app.request("/s/ABC123", { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(`/space/${WS_ID}`);
    });

    it("redirects with readonly param for readonly share code", async () => {
      db.run("INSERT INTO share_link (code, workspace_id, access) VALUES (?, ?, ?)", [
        "RDO456",
        WS_ID,
        "readonly",
      ]);

      const app = new Hono();
      app.get("/s/:code", handleResolveShare(db, "/tmp/fake-static"));

      const res = await app.request("/s/RDO456", { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(`/space/${WS_ID}?access=readonly`);
    });
  });
});
