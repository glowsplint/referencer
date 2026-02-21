import { describe, it, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { createShareLink, resolveShareLink } from "./share-queries";

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
`;

function createTestDb(): Database {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  db.exec(schema);
  return db;
}

describe("share-queries", () => {
  let db: Database;
  const WS_ID = "test-ws-share";

  beforeEach(() => {
    db = createTestDb();
    db.run("INSERT INTO workspace (id) VALUES (?)", [WS_ID]);
  });

  describe("createShareLink", () => {
    it("generates a 6-character code", () => {
      const code = createShareLink(db, WS_ID, "edit");
      expect(code).toHaveLength(6);
      expect(typeof code).toBe("string");
    });

    it("creates different codes for multiple calls", () => {
      const code1 = createShareLink(db, WS_ID, "edit");
      const code2 = createShareLink(db, WS_ID, "readonly");
      expect(code1).not.toBe(code2);
    });
  });

  describe("resolveShareLink", () => {
    it("returns correct workspace and access for valid code", () => {
      const code = createShareLink(db, WS_ID, "edit");
      const result = resolveShareLink(db, code);
      expect(result).not.toBeNull();
      expect(result!.workspaceId).toBe(WS_ID);
      expect(result!.access).toBe("edit");
    });

    it("returns correct access for readonly link", () => {
      const code = createShareLink(db, WS_ID, "readonly");
      const result = resolveShareLink(db, code);
      expect(result).not.toBeNull();
      expect(result!.access).toBe("readonly");
    });

    it("returns null for unknown code", () => {
      const result = resolveShareLink(db, "ZZZZZZ");
      expect(result).toBeNull();
    });
  });
});
