import type { Database } from "bun:sqlite";
import { assertString, assertNumber, assertMap, assertSlice } from "../lib/assert";
import { stringOrDefault } from "../lib/utils";
import * as wq from "../db/workspace-queries";

type ActionHandler = (
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
) => void;

function handleAddLayer(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const id = assertString(payload, "id");
  const name = assertString(payload, "name");
  const color = assertString(payload, "color");
  wq.addLayer(db, workspaceId, id, name, color);
}

function handleRemoveLayer(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const id = assertString(payload, "id");
  wq.removeLayer(db, workspaceId, id);
}

function handleUpdateLayerName(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const id = assertString(payload, "id");
  const name = assertString(payload, "name");
  wq.updateLayerName(db, workspaceId, id, name);
}

function handleUpdateLayerColor(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const id = assertString(payload, "id");
  const color = assertString(payload, "color");
  wq.updateLayerColor(db, workspaceId, id, color);
}

function handleToggleLayerVisibility(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const id = assertString(payload, "id");
  wq.toggleLayerVisibility(db, workspaceId, id);
}

function handleReorderLayers(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const raw = assertSlice(payload, "layerIds");
  const ids = raw.map((v, i) => {
    if (typeof v !== "string") {
      throw new Error(`layerIds[${i}]: expected string, got ${typeof v}`);
    }
    return v;
  });
  wq.reorderLayers(db, workspaceId, ids);
}

function handleAddHighlight(
  db: Database,
  _workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const layerId = assertString(payload, "layerId");
  const h = assertMap(payload, "highlight");
  const id = assertString(h, "id");
  const editorIndex = assertNumber(h, "editorIndex");
  const from = assertNumber(h, "from");
  const to = assertNumber(h, "to");
  wq.addHighlight(
    db,
    layerId,
    id,
    editorIndex,
    from,
    to,
    stringOrDefault(h, "text", ""),
    stringOrDefault(h, "annotation", ""),
  );
}

function handleRemoveHighlight(
  db: Database,
  _workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const layerId = assertString(payload, "layerId");
  const highlightId = assertString(payload, "highlightId");
  wq.removeHighlight(db, layerId, highlightId);
}

function handleUpdateHighlightAnnotation(
  db: Database,
  _workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const layerId = assertString(payload, "layerId");
  const highlightId = assertString(payload, "highlightId");
  const annotation = assertString(payload, "annotation");
  wq.updateHighlightAnnotation(db, layerId, highlightId, annotation);
}

function handleAddArrow(
  db: Database,
  _workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const layerId = assertString(payload, "layerId");
  const arrow = assertMap(payload, "arrow");
  const id = assertString(arrow, "id");
  const fromEndpoint = assertMap(arrow, "from");
  const toEndpoint = assertMap(arrow, "to");

  wq.addArrow(
    db,
    layerId,
    id,
    assertNumber(fromEndpoint, "editorIndex"),
    assertNumber(fromEndpoint, "from"),
    assertNumber(fromEndpoint, "to"),
    stringOrDefault(fromEndpoint, "text", ""),
    assertNumber(toEndpoint, "editorIndex"),
    assertNumber(toEndpoint, "from"),
    assertNumber(toEndpoint, "to"),
    stringOrDefault(toEndpoint, "text", ""),
  );
}

function handleRemoveArrow(
  db: Database,
  _workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const layerId = assertString(payload, "layerId");
  const arrowId = assertString(payload, "arrowId");
  wq.removeArrow(db, layerId, arrowId);
}

function handleUpdateArrowStyle(
  db: Database,
  _workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const layerId = assertString(payload, "layerId");
  const arrowId = assertString(payload, "arrowId");
  const arrowStyle = assertString(payload, "arrowStyle");
  wq.updateArrowStyle(db, layerId, arrowId, arrowStyle);
}

function handleAddUnderline(
  db: Database,
  _workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const layerId = assertString(payload, "layerId");
  const u = assertMap(payload, "underline");
  const id = assertString(u, "id");
  const editorIndex = assertNumber(u, "editorIndex");
  const from = assertNumber(u, "from");
  const to = assertNumber(u, "to");
  wq.addUnderline(
    db,
    layerId,
    id,
    editorIndex,
    from,
    to,
    stringOrDefault(u, "text", ""),
  );
}

function handleRemoveUnderline(
  db: Database,
  _workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const layerId = assertString(payload, "layerId");
  const underlineId = assertString(payload, "underlineId");
  wq.removeUnderline(db, layerId, underlineId);
}

function handleAddEditor(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const index = assertNumber(payload, "index");
  const name = assertString(payload, "name");
  wq.addEditor(db, workspaceId, index, name);
}

function handleRemoveEditor(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const index = assertNumber(payload, "index");
  wq.removeEditor(db, workspaceId, index);
}

function handleUpdateSectionName(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const index = assertNumber(payload, "index");
  const name = assertString(payload, "name");
  wq.updateSectionName(db, workspaceId, index, name);
}

function handleToggleSectionVisibility(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const index = assertNumber(payload, "index");
  wq.toggleSectionVisibility(db, workspaceId, index);
}

function handleReorderEditors(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const raw = assertSlice(payload, "permutation");
  const indices = raw.map((v, i) => {
    if (typeof v !== "number") {
      throw new Error(`permutation[${i}]: expected number, got ${typeof v}`);
    }
    return v;
  });
  wq.reorderEditors(db, workspaceId, indices);
}

function handleUpdateEditorContent(
  db: Database,
  workspaceId: string,
  payload: Record<string, unknown>,
): void {
  const editorIndex = assertNumber(payload, "editorIndex");
  if (payload.contentJson === undefined || payload.contentJson === null) {
    throw new Error(`key "contentJson": missing`);
  }
  wq.updateEditorContent(db, workspaceId, editorIndex, payload.contentJson);
}

export const actionHandlers: Record<string, ActionHandler> = {
  addLayer: handleAddLayer,
  removeLayer: handleRemoveLayer,
  updateLayerName: handleUpdateLayerName,
  updateLayerColor: handleUpdateLayerColor,
  toggleLayerVisibility: handleToggleLayerVisibility,
  reorderLayers: handleReorderLayers,
  addHighlight: handleAddHighlight,
  removeHighlight: handleRemoveHighlight,
  updateHighlightAnnotation: handleUpdateHighlightAnnotation,
  addArrow: handleAddArrow,
  removeArrow: handleRemoveArrow,
  updateArrowStyle: handleUpdateArrowStyle,
  addUnderline: handleAddUnderline,
  removeUnderline: handleRemoveUnderline,
  addEditor: handleAddEditor,
  removeEditor: handleRemoveEditor,
  updateSectionName: handleUpdateSectionName,
  toggleSectionVisibility: handleToggleSectionVisibility,
  reorderEditors: handleReorderEditors,
  updateEditorContent: handleUpdateEditorContent,
};
