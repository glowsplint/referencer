import type { Database } from "bun:sqlite";
import type {
  WorkspaceState,
  Layer,
  Highlight,
  Arrow,
  Underline,
  Editor,
} from "../types";

export function ensureWorkspace(db: Database, workspaceId: string): void {
  const row = db
    .query<{ id: string }, [string]>("SELECT id FROM workspace WHERE id = ?")
    .get(workspaceId);

  if (!row) {
    const tx = db.transaction(() => {
      db.run("INSERT INTO workspace (id) VALUES (?)", [workspaceId]);
      db.run(
        "INSERT INTO editor (workspace_id, index_pos, name, visible) VALUES (?, 0, 'Passage 1', 1)",
        [workspaceId],
      );
    });
    tx();
  }
}

interface LayerRow {
  id: string;
  name: string;
  color: string;
  visible: number;
}

interface HighlightRow {
  id: string;
  layer_id: string;
  editor_index: number;
  from: number;
  to: number;
  text: string;
  annotation: string;
  type: string;
}

interface ArrowRow {
  id: string;
  layer_id: string;
  from_editor_index: number;
  from_start: number;
  from_end: number;
  from_text: string;
  to_editor_index: number;
  to_start: number;
  to_end: number;
  to_text: string;
  arrow_style: string;
}

interface UnderlineRow {
  id: string;
  layer_id: string;
  editor_index: number;
  from: number;
  to: number;
  text: string;
}

interface EditorRow {
  index_pos: number;
  name: string;
  visible: number;
  content_json: string | null;
}

export function getWorkspaceState(
  db: Database,
  workspaceId: string,
): WorkspaceState {
  // Load layers ordered by position.
  const layerRows = db
    .query<LayerRow, [string]>(
      "SELECT id, name, color, visible FROM layer WHERE workspace_id = ? ORDER BY position",
    )
    .all(workspaceId);

  // Build annotation maps indexed by layer ID.
  const highlightsByLayer = new Map<string, Highlight[]>();
  const arrowsByLayer = new Map<string, Arrow[]>();
  const underlinesByLayer = new Map<string, Underline[]>();

  if (layerRows.length > 0) {
    // Highlights
    const hRows = db
      .query<HighlightRow, [string]>(
        `SELECT h.id, h.layer_id, h.editor_index, h."from", h."to", h.text, h.annotation, h.type
         FROM highlight h
         JOIN layer l ON h.layer_id = l.id
         WHERE l.workspace_id = ?`,
      )
      .all(workspaceId);

    for (const h of hRows) {
      const highlight: Highlight = {
        id: h.id,
        editorIndex: h.editor_index,
        from: h.from,
        to: h.to,
        text: h.text,
        annotation: h.annotation,
      };
      // omitempty: omit type if empty or default 'highlight'
      if (h.type && h.type !== "highlight") {
        highlight.type = h.type;
      }
      if (!highlightsByLayer.has(h.layer_id)) {
        highlightsByLayer.set(h.layer_id, []);
      }
      highlightsByLayer.get(h.layer_id)!.push(highlight);
    }

    // Arrows
    const aRows = db
      .query<ArrowRow, [string]>(
        `SELECT a.id, a.layer_id,
                a.from_editor_index, a.from_start, a.from_end, a.from_text,
                a.to_editor_index, a.to_start, a.to_end, a.to_text,
                a.arrow_style
         FROM arrow a
         JOIN layer l ON a.layer_id = l.id
         WHERE l.workspace_id = ?`,
      )
      .all(workspaceId);

    for (const a of aRows) {
      const arrow: Arrow = {
        id: a.id,
        from: {
          editorIndex: a.from_editor_index,
          from: a.from_start,
          to: a.from_end,
          text: a.from_text,
        },
        to: {
          editorIndex: a.to_editor_index,
          from: a.to_start,
          to: a.to_end,
          text: a.to_text,
        },
      };
      // omitempty: omit arrowStyle if empty
      if (a.arrow_style && a.arrow_style !== "") {
        arrow.arrowStyle = a.arrow_style;
      }
      if (!arrowsByLayer.has(a.layer_id)) {
        arrowsByLayer.set(a.layer_id, []);
      }
      arrowsByLayer.get(a.layer_id)!.push(arrow);
    }

    // Underlines
    const uRows = db
      .query<UnderlineRow, [string]>(
        `SELECT u.id, u.layer_id, u.editor_index, u."from", u."to", u.text
         FROM underline u
         JOIN layer l ON u.layer_id = l.id
         WHERE l.workspace_id = ?`,
      )
      .all(workspaceId);

    for (const u of uRows) {
      const underline: Underline = {
        id: u.id,
        editorIndex: u.editor_index,
        from: u.from,
        to: u.to,
        text: u.text,
      };
      if (!underlinesByLayer.has(u.layer_id)) {
        underlinesByLayer.set(u.layer_id, []);
      }
      underlinesByLayer.get(u.layer_id)!.push(underline);
    }
  }

  // Assemble layers with empty arrays (never null).
  const layers: Layer[] = layerRows.map((li) => ({
    id: li.id,
    name: li.name,
    color: li.color,
    visible: li.visible !== 0,
    highlights: highlightsByLayer.get(li.id) ?? [],
    arrows: arrowsByLayer.get(li.id) ?? [],
    underlines: underlinesByLayer.get(li.id) ?? [],
  }));

  // Load editors.
  const editorRows = db
    .query<EditorRow, [string]>(
      "SELECT index_pos, name, visible, content_json FROM editor WHERE workspace_id = ? ORDER BY index_pos",
    )
    .all(workspaceId);

  const editors: Editor[] = editorRows.map((e) => {
    let contentJson: unknown = null;
    if (e.content_json) {
      try {
        contentJson = JSON.parse(e.content_json);
      } catch {
        // leave as null
      }
    }
    return {
      index: e.index_pos,
      name: e.name,
      visible: e.visible !== 0,
      contentJson,
    };
  });

  return {
    workspaceId,
    layers,
    editors,
  };
}

// --- Layer operations ---

export function addLayer(
  db: Database,
  workspaceId: string,
  layerId: string,
  name: string,
  color: string,
): void {
  const row = db
    .query<{ pos: number }, [string]>(
      "SELECT COALESCE(MAX(position), -1) + 1 as pos FROM layer WHERE workspace_id = ?",
    )
    .get(workspaceId);
  const position = row?.pos ?? 0;
  db.run(
    "INSERT INTO layer (id, workspace_id, name, color, visible, position) VALUES (?, ?, ?, ?, 1, ?)",
    [layerId, workspaceId, name, color, position],
  );
}

export function removeLayer(
  db: Database,
  workspaceId: string,
  layerId: string,
): void {
  db.run("DELETE FROM layer WHERE id = ? AND workspace_id = ?", [
    layerId,
    workspaceId,
  ]);
}

export function updateLayerName(
  db: Database,
  workspaceId: string,
  layerId: string,
  name: string,
): void {
  db.run("UPDATE layer SET name = ? WHERE id = ? AND workspace_id = ?", [
    name,
    layerId,
    workspaceId,
  ]);
}

export function updateLayerColor(
  db: Database,
  workspaceId: string,
  layerId: string,
  color: string,
): void {
  db.run("UPDATE layer SET color = ? WHERE id = ? AND workspace_id = ?", [
    color,
    layerId,
    workspaceId,
  ]);
}

export function toggleLayerVisibility(
  db: Database,
  workspaceId: string,
  layerId: string,
): void {
  db.run(
    "UPDATE layer SET visible = NOT visible WHERE id = ? AND workspace_id = ?",
    [layerId, workspaceId],
  );
}

export function reorderLayers(
  db: Database,
  workspaceId: string,
  layerIds: string[],
): void {
  const tx = db.transaction(() => {
    for (let position = 0; position < layerIds.length; position++) {
      db.run(
        "UPDATE layer SET position = ? WHERE id = ? AND workspace_id = ?",
        [position, layerIds[position], workspaceId],
      );
    }
  });
  tx();
}

// --- Highlight operations ---

export function addHighlight(
  db: Database,
  layerId: string,
  highlightId: string,
  editorIndex: number,
  from: number,
  to: number,
  text: string,
  annotation: string,
): void {
  db.run(
    `INSERT INTO highlight (id, layer_id, editor_index, "from", "to", text, annotation) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [highlightId, layerId, editorIndex, from, to, text, annotation],
  );
}

export function removeHighlight(
  db: Database,
  layerId: string,
  highlightId: string,
): void {
  db.run("DELETE FROM highlight WHERE id = ? AND layer_id = ?", [
    highlightId,
    layerId,
  ]);
}

export function updateHighlightAnnotation(
  db: Database,
  layerId: string,
  highlightId: string,
  annotation: string,
): void {
  db.run("UPDATE highlight SET annotation = ? WHERE id = ? AND layer_id = ?", [
    annotation,
    highlightId,
    layerId,
  ]);
}

// --- Arrow operations ---

export function addArrow(
  db: Database,
  layerId: string,
  arrowId: string,
  fromEditorIndex: number,
  fromStart: number,
  fromEnd: number,
  fromText: string,
  toEditorIndex: number,
  toStart: number,
  toEnd: number,
  toText: string,
): void {
  db.run(
    `INSERT INTO arrow (id, layer_id, from_editor_index, from_start, from_end, from_text,
                         to_editor_index, to_start, to_end, to_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      arrowId,
      layerId,
      fromEditorIndex,
      fromStart,
      fromEnd,
      fromText,
      toEditorIndex,
      toStart,
      toEnd,
      toText,
    ],
  );
}

export function removeArrow(
  db: Database,
  layerId: string,
  arrowId: string,
): void {
  db.run("DELETE FROM arrow WHERE id = ? AND layer_id = ?", [arrowId, layerId]);
}

export function updateArrowStyle(
  db: Database,
  layerId: string,
  arrowId: string,
  arrowStyle: string,
): void {
  db.run("UPDATE arrow SET arrow_style = ? WHERE id = ? AND layer_id = ?", [
    arrowStyle,
    arrowId,
    layerId,
  ]);
}

// --- Underline operations ---

export function addUnderline(
  db: Database,
  layerId: string,
  underlineId: string,
  editorIndex: number,
  from: number,
  to: number,
  text: string,
): void {
  db.run(
    `INSERT INTO underline (id, layer_id, editor_index, "from", "to", text) VALUES (?, ?, ?, ?, ?, ?)`,
    [underlineId, layerId, editorIndex, from, to, text],
  );
}

export function removeUnderline(
  db: Database,
  layerId: string,
  underlineId: string,
): void {
  db.run("DELETE FROM underline WHERE id = ? AND layer_id = ?", [
    underlineId,
    layerId,
  ]);
}

// --- Editor operations ---

export function addEditor(
  db: Database,
  workspaceId: string,
  index: number,
  name: string,
): void {
  db.run(
    "INSERT INTO editor (workspace_id, index_pos, name, visible) VALUES (?, ?, ?, 1)",
    [workspaceId, index, name],
  );
}

export function removeEditor(
  db: Database,
  workspaceId: string,
  index: number,
): void {
  const tx = db.transaction(() => {
    db.run("DELETE FROM editor WHERE workspace_id = ? AND index_pos = ?", [
      workspaceId,
      index,
    ]);

    // Re-index remaining editors.
    const rows = db
      .query<{ id: number }, [string]>(
        "SELECT id FROM editor WHERE workspace_id = ? ORDER BY index_pos",
      )
      .all(workspaceId);

    for (let newIndex = 0; newIndex < rows.length; newIndex++) {
      db.run("UPDATE editor SET index_pos = ? WHERE id = ?", [
        newIndex,
        rows[newIndex].id,
      ]);
    }
  });
  tx();
}

export function updateSectionName(
  db: Database,
  workspaceId: string,
  index: number,
  name: string,
): void {
  db.run(
    "UPDATE editor SET name = ? WHERE workspace_id = ? AND index_pos = ?",
    [name, workspaceId, index],
  );
}

export function toggleSectionVisibility(
  db: Database,
  workspaceId: string,
  index: number,
): void {
  db.run(
    "UPDATE editor SET visible = NOT visible WHERE workspace_id = ? AND index_pos = ?",
    [workspaceId, index],
  );
}

export function reorderEditors(
  db: Database,
  workspaceId: string,
  editorIndices: number[],
): void {
  const tx = db.transaction(() => {
    // Fetch all editors for this workspace ordered by current index.
    const rows = db
      .query<{ id: number; index_pos: number }, [string]>(
        "SELECT id, index_pos FROM editor WHERE workspace_id = ? ORDER BY index_pos",
      )
      .all(workspaceId);

    const editorByIndex = new Map<number, number>();
    for (const row of rows) {
      editorByIndex.set(row.index_pos, row.id);
    }

    for (let newPos = 0; newPos < editorIndices.length; newPos++) {
      const oldIndex = editorIndices[newPos];
      const id = editorByIndex.get(oldIndex);
      if (id === undefined) continue;
      db.run("UPDATE editor SET index_pos = ? WHERE id = ?", [newPos, id]);
    }
  });
  tx();
}

export function updateEditorContent(
  db: Database,
  workspaceId: string,
  editorIndex: number,
  contentJson: unknown,
): void {
  const jsonStr = JSON.stringify(contentJson);
  db.run(
    "UPDATE editor SET content_json = ? WHERE workspace_id = ? AND index_pos = ?",
    [jsonStr, workspaceId, editorIndex],
  );
}
