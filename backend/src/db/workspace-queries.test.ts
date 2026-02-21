import { describe, it, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import {
  ensureWorkspace,
  getWorkspaceState,
  addLayer,
  removeLayer,
  toggleLayerVisibility,
  reorderLayers,
  addHighlight,
  removeHighlight,
  updateHighlightAnnotation,
  addArrow,
  removeArrow,
  updateArrowStyle,
  addUnderline,
  removeUnderline,
  addEditor,
  removeEditor,
  reorderEditors,
  updateEditorContent,
  toggleSectionVisibility,
} from "./workspace-queries";

// Schema copied from database.ts to initialize in-memory DB without filesystem.
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

const WS_ID = "test-ws-1";

describe("ensureWorkspace", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
  });

  it("creates workspace with a default editor", () => {
    ensureWorkspace(db, WS_ID);
    const state = getWorkspaceState(db, WS_ID);
    expect(state.workspaceId).toBe(WS_ID);
    expect(state.editors).toHaveLength(1);
    expect(state.editors[0].name).toBe("Passage 1");
    expect(state.editors[0].index).toBe(0);
    expect(state.editors[0].visible).toBe(true);
    expect(state.layers).toHaveLength(0);
  });

  it("is idempotent", () => {
    ensureWorkspace(db, WS_ID);
    ensureWorkspace(db, WS_ID);
    const state = getWorkspaceState(db, WS_ID);
    expect(state.editors).toHaveLength(1);
  });
});

describe("getWorkspaceState", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
  });

  it("returns empty arrays for a new workspace", () => {
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers).toEqual([]);
    expect(state.editors).toHaveLength(1);
  });

  it("returns all annotations correctly", () => {
    addLayer(db, WS_ID, "layer-1", "Layer 1", "#ff0000");
    addHighlight(db, "layer-1", "h1", 0, 5, 10, "hello", "note");
    addArrow(db, "layer-1", "a1", 0, 1, 3, "from", 0, 5, 8, "to");
    addUnderline(db, "layer-1", "u1", 0, 2, 7, "text");

    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers).toHaveLength(1);

    const layer = state.layers[0];
    expect(layer.highlights).toHaveLength(1);
    expect(layer.highlights[0]).toEqual({
      id: "h1",
      editorIndex: 0,
      from: 5,
      to: 10,
      text: "hello",
      annotation: "note",
    });

    expect(layer.arrows).toHaveLength(1);
    expect(layer.arrows[0].id).toBe("a1");
    expect(layer.arrows[0].from.editorIndex).toBe(0);
    expect(layer.arrows[0].to.editorIndex).toBe(0);
    expect(layer.arrows[0].arrowStyle).toBe("solid");

    expect(layer.underlines).toHaveLength(1);
    expect(layer.underlines[0]).toEqual({
      id: "u1",
      editorIndex: 0,
      from: 2,
      to: 7,
      text: "text",
    });
  });
});

describe("layer CRUD", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
  });

  it("addLayer adds a layer", () => {
    addLayer(db, WS_ID, "l1", "Layer 1", "#ff0000");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers).toHaveLength(1);
    expect(state.layers[0].id).toBe("l1");
    expect(state.layers[0].name).toBe("Layer 1");
    expect(state.layers[0].color).toBe("#ff0000");
    expect(state.layers[0].visible).toBe(true);
  });

  it("removeLayer removes a layer", () => {
    addLayer(db, WS_ID, "l1", "Layer 1", "#ff0000");
    removeLayer(db, WS_ID, "l1");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers).toHaveLength(0);
  });

  it("removeLayer cascades to annotations", () => {
    addLayer(db, WS_ID, "l1", "Layer 1", "#ff0000");
    addHighlight(db, "l1", "h1", 0, 1, 5, "txt", "");
    addArrow(db, "l1", "a1", 0, 1, 3, "", 0, 5, 8, "");
    addUnderline(db, "l1", "u1", 0, 2, 7, "");
    removeLayer(db, WS_ID, "l1");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers).toHaveLength(0);
  });
});

describe("highlight CRUD", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
    addLayer(db, WS_ID, "l1", "Layer 1", "#ff0000");
  });

  it("addHighlight adds a highlight", () => {
    addHighlight(db, "l1", "h1", 0, 5, 10, "hello", "my note");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].highlights).toHaveLength(1);
    expect(state.layers[0].highlights[0].annotation).toBe("my note");
  });

  it("removeHighlight removes a highlight", () => {
    addHighlight(db, "l1", "h1", 0, 5, 10, "hello", "");
    removeHighlight(db, "l1", "h1");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].highlights).toHaveLength(0);
  });

  it("updateHighlightAnnotation updates annotation", () => {
    addHighlight(db, "l1", "h1", 0, 5, 10, "hello", "old");
    updateHighlightAnnotation(db, "l1", "h1", "new annotation");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].highlights[0].annotation).toBe("new annotation");
  });
});

describe("arrow CRUD", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
    addLayer(db, WS_ID, "l1", "Layer 1", "#ff0000");
  });

  it("addArrow adds an arrow", () => {
    addArrow(db, "l1", "a1", 0, 1, 3, "from-text", 1, 5, 8, "to-text");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].arrows).toHaveLength(1);
    const arrow = state.layers[0].arrows[0];
    expect(arrow.id).toBe("a1");
    expect(arrow.from).toEqual({
      editorIndex: 0,
      from: 1,
      to: 3,
      text: "from-text",
    });
    expect(arrow.to).toEqual({
      editorIndex: 1,
      from: 5,
      to: 8,
      text: "to-text",
    });
  });

  it("removeArrow removes an arrow", () => {
    addArrow(db, "l1", "a1", 0, 1, 3, "", 0, 5, 8, "");
    removeArrow(db, "l1", "a1");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].arrows).toHaveLength(0);
  });

  it("updateArrowStyle updates arrow style", () => {
    addArrow(db, "l1", "a1", 0, 1, 3, "", 0, 5, 8, "");
    updateArrowStyle(db, "l1", "a1", "dashed");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].arrows[0].arrowStyle).toBe("dashed");
  });
});

describe("underline CRUD", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
    addLayer(db, WS_ID, "l1", "Layer 1", "#ff0000");
  });

  it("addUnderline adds an underline", () => {
    addUnderline(db, "l1", "u1", 0, 2, 7, "underlined");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].underlines).toHaveLength(1);
    expect(state.layers[0].underlines[0].text).toBe("underlined");
  });

  it("removeUnderline removes an underline", () => {
    addUnderline(db, "l1", "u1", 0, 2, 7, "");
    removeUnderline(db, "l1", "u1");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].underlines).toHaveLength(0);
  });
});

describe("editor CRUD", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
  });

  it("addEditor adds an editor at the specified index", () => {
    addEditor(db, WS_ID, 1, "Passage 2");
    const state = getWorkspaceState(db, WS_ID);
    expect(state.editors).toHaveLength(2);
    expect(state.editors[1].name).toBe("Passage 2");
    expect(state.editors[1].index).toBe(1);
  });

  it("removeEditor removes and re-indexes", () => {
    addEditor(db, WS_ID, 1, "Passage 2");
    addEditor(db, WS_ID, 2, "Passage 3");
    // Remove the middle editor (index 1)
    removeEditor(db, WS_ID, 1);
    const state = getWorkspaceState(db, WS_ID);
    expect(state.editors).toHaveLength(2);
    expect(state.editors[0].index).toBe(0);
    expect(state.editors[0].name).toBe("Passage 1");
    expect(state.editors[1].index).toBe(1);
    expect(state.editors[1].name).toBe("Passage 3");
  });
});

describe("reorderLayers", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
    addLayer(db, WS_ID, "l1", "Layer 1", "#ff0000");
    addLayer(db, WS_ID, "l2", "Layer 2", "#00ff00");
    addLayer(db, WS_ID, "l3", "Layer 3", "#0000ff");
  });

  it("reorders layers by id list", () => {
    reorderLayers(db, WS_ID, ["l3", "l1", "l2"]);
    const state = getWorkspaceState(db, WS_ID);
    expect(state.layers.map((l) => l.id)).toEqual(["l3", "l1", "l2"]);
  });
});

describe("reorderEditors", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
    addEditor(db, WS_ID, 1, "Passage 2");
    addEditor(db, WS_ID, 2, "Passage 3");
  });

  it("reorders editors by permutation", () => {
    reorderEditors(db, WS_ID, [2, 0, 1]);
    const state = getWorkspaceState(db, WS_ID);
    expect(state.editors.map((e) => e.name)).toEqual([
      "Passage 3",
      "Passage 1",
      "Passage 2",
    ]);
  });
});

describe("updateEditorContent", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
  });

  it("stores and retrieves JSON content", () => {
    const content = { type: "doc", content: [{ type: "paragraph" }] };
    updateEditorContent(db, WS_ID, 0, content);
    const state = getWorkspaceState(db, WS_ID);
    expect(state.editors[0].contentJson).toEqual(content);
  });
});

describe("toggleLayerVisibility", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
    addLayer(db, WS_ID, "l1", "Layer 1", "#ff0000");
  });

  it("toggles layer visibility", () => {
    let state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].visible).toBe(true);

    toggleLayerVisibility(db, WS_ID, "l1");
    state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].visible).toBe(false);

    toggleLayerVisibility(db, WS_ID, "l1");
    state = getWorkspaceState(db, WS_ID);
    expect(state.layers[0].visible).toBe(true);
  });
});

describe("toggleSectionVisibility", () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
    ensureWorkspace(db, WS_ID);
  });

  it("toggles editor/section visibility", () => {
    let state = getWorkspaceState(db, WS_ID);
    expect(state.editors[0].visible).toBe(true);

    toggleSectionVisibility(db, WS_ID, 0);
    state = getWorkspaceState(db, WS_ID);
    expect(state.editors[0].visible).toBe(false);

    toggleSectionVisibility(db, WS_ID, 0);
    state = getWorkspaceState(db, WS_ID);
    expect(state.editors[0].visible).toBe(true);
  });
});
