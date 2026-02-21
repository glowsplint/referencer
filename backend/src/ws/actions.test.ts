import { describe, it, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { actionHandlers } from "./actions";
import { ensureWorkspace, getWorkspaceState } from "../db/workspace-queries";

const schema = `
CREATE TABLE IF NOT EXISTS workspace (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS layer (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    visible INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS highlight (
    id TEXT PRIMARY KEY,
    layer_id TEXT NOT NULL REFERENCES layer(id) ON DELETE CASCADE,
    editor_index INTEGER NOT NULL,
    "from" INTEGER NOT NULL,
    "to" INTEGER NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    annotation TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'highlight'
);

CREATE TABLE IF NOT EXISTS arrow (
    id TEXT PRIMARY KEY,
    layer_id TEXT NOT NULL REFERENCES layer(id) ON DELETE CASCADE,
    from_editor_index INTEGER NOT NULL,
    from_start INTEGER NOT NULL,
    from_end INTEGER NOT NULL,
    from_text TEXT NOT NULL DEFAULT '',
    to_editor_index INTEGER NOT NULL,
    to_start INTEGER NOT NULL,
    to_end INTEGER NOT NULL,
    to_text TEXT NOT NULL DEFAULT '',
    arrow_style TEXT NOT NULL DEFAULT 'solid'
);

CREATE TABLE IF NOT EXISTS underline (
    id TEXT PRIMARY KEY,
    layer_id TEXT NOT NULL REFERENCES layer(id) ON DELETE CASCADE,
    editor_index INTEGER NOT NULL,
    "from" INTEGER NOT NULL,
    "to" INTEGER NOT NULL,
    text TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS editor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    index_pos INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT 'Passage',
    visible INTEGER NOT NULL DEFAULT 1,
    content_json TEXT
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

const WS_ID = "test-ws-actions";

describe("action handlers", () => {
  let db: Database;

  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
  });

  describe("handleAddLayer", () => {
    it("adds a layer and verifies via getWorkspaceState", () => {
      actionHandlers.addLayer(db, WS_ID, {
        id: "l1",
        name: "Test Layer",
        color: "#abcdef",
      });
      const state = getWorkspaceState(db, WS_ID);
      expect(state.layers).toHaveLength(1);
      expect(state.layers[0].id).toBe("l1");
      expect(state.layers[0].name).toBe("Test Layer");
      expect(state.layers[0].color).toBe("#abcdef");
    });
  });

  describe("handleAddHighlight", () => {
    it("adds a highlight to an existing layer", () => {
      actionHandlers.addLayer(db, WS_ID, {
        id: "l1",
        name: "Layer",
        color: "#000",
      });
      actionHandlers.addHighlight(db, WS_ID, {
        layerId: "l1",
        highlight: {
          id: "h1",
          editorIndex: 0,
          from: 5,
          to: 10,
          text: "hello",
          annotation: "a note",
        },
      });
      const state = getWorkspaceState(db, WS_ID);
      expect(state.layers[0].highlights).toHaveLength(1);
      expect(state.layers[0].highlights[0].id).toBe("h1");
      expect(state.layers[0].highlights[0].from).toBe(5);
      expect(state.layers[0].highlights[0].annotation).toBe("a note");
    });
  });

  describe("handleAddArrow", () => {
    it("adds an arrow to an existing layer", () => {
      actionHandlers.addLayer(db, WS_ID, {
        id: "l1",
        name: "Layer",
        color: "#000",
      });
      actionHandlers.addArrow(db, WS_ID, {
        layerId: "l1",
        arrow: {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 3, text: "src" },
          to: { editorIndex: 1, from: 5, to: 8, text: "dst" },
        },
      });
      const state = getWorkspaceState(db, WS_ID);
      expect(state.layers[0].arrows).toHaveLength(1);
      const arrow = state.layers[0].arrows[0];
      expect(arrow.id).toBe("a1");
      expect(arrow.from.text).toBe("src");
      expect(arrow.to.text).toBe("dst");
    });
  });

  describe("handleUpdateEditorContent", () => {
    it("updates editor content with JSON", () => {
      const content = { type: "doc", content: [{ type: "paragraph" }] };
      actionHandlers.updateEditorContent(db, WS_ID, {
        editorIndex: 0,
        contentJson: content,
      });
      const state = getWorkspaceState(db, WS_ID);
      expect(state.editors[0].contentJson).toEqual(content);
    });

    it("throws when contentJson is missing", () => {
      expect(() =>
        actionHandlers.updateEditorContent(db, WS_ID, { editorIndex: 0 }),
      ).toThrow('key "contentJson": missing');
    });
  });
});
