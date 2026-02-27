// Yjs shared types for collaborative annotations.
// Layers, highlights, arrows, and underlines are stored as Y.Array<Y.Map>
// with RelativePosition anchors that survive concurrent text edits.
import * as Y from "yjs";
import {
  absolutePositionToRelativePosition,
  relativePositionToAbsolutePosition,
  ySyncPluginKey,
} from "@tiptap/y-tiptap";
import type { EditorView } from "@tiptap/pm/view";
import type {
  Layer,
  Highlight,
  Arrow,
  LayerUnderline,
  ArrowStyle,
  CommentReply,
} from "@/types/editor";
import { sanitizeHtml } from "@/lib/sanitize";

// ---------------------------------------------------------------------------
// Y.Doc structure for annotations
// ---------------------------------------------------------------------------
// doc.getArray("layers")  →  Y.Array<Y.Map>
//   each Y.Map has:
//     id: string, name: string, color: string, visible: boolean
//     highlights: Y.Array<Y.Map>
//     arrows: Y.Array<Y.Map>
//     underlines: Y.Array<Y.Map>
//
// Highlights/underlines Y.Map:
//   id, editorIndex, fromRel (Uint8Array), toRel (Uint8Array), text, annotation?, type?
//
// Arrows Y.Map:
//   id, fromEditorIndex, fromRel, fromToRel, fromText,
//       toEditorIndex, toRel, toToRel, toText, arrowStyle

/** Optional map of editor index → ProseMirror EditorView for proper position mapping */
export type EditorViewMap = Map<number, EditorView>;

// ---------------------------------------------------------------------------
// RelativePosition helpers
// ---------------------------------------------------------------------------

/**
 * Get the y-prosemirror sync state (type + mapping) from an EditorView.
 * Returns null if the sync plugin is not active.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSyncState(view: EditorView): { type: Y.XmlFragment; mapping: Map<any, any> } | null {
  const syncState = ySyncPluginKey.getState(view.state);
  if (!syncState?.binding?.mapping) return null;
  return { type: syncState.type, mapping: syncState.binding.mapping };
}

/**
 * Encode a ProseMirror position as a Yjs RelativePosition.
 *
 * When an EditorView is provided, uses y-prosemirror's proper position mapping
 * which accounts for the difference between ProseMirror positions (which include
 * structural tokens like paragraph open/close) and Yjs XmlFragment indices.
 * Without an EditorView, falls back to direct index encoding (only correct when
 * the fragment has no structural nesting, e.g. during initial seeding of an
 * empty document).
 */
export function encodeRelativePosition(
  doc: Y.Doc,
  editorIndex: number,
  pos: number,
  editorViews?: EditorViewMap,
): Uint8Array {
  const view = editorViews?.get(editorIndex);
  if (view) {
    const syncState = getSyncState(view);
    if (syncState) {
      const relPos = absolutePositionToRelativePosition(pos, syncState.type, syncState.mapping);
      return Y.encodeRelativePosition(relPos);
    }
  }
  // Fallback: direct index encoding (only correct for flat/empty fragments)
  const fragment = doc.getXmlFragment(`editor-${editorIndex}`);
  const relPos = Y.createRelativePositionFromTypeIndex(fragment, pos);
  return Y.encodeRelativePosition(relPos);
}

/**
 * Decode a Yjs RelativePosition back to an absolute ProseMirror position.
 *
 * When an EditorView is provided, uses y-prosemirror's proper position mapping
 * which accounts for structural differences between ProseMirror and Yjs.
 * Without an EditorView, falls back to raw Yjs index (only correct for flat
 * fragments).
 */
export function decodeRelativePosition(
  doc: Y.Doc,
  encoded: Uint8Array,
  editorIndex?: number,
  editorViews?: EditorViewMap,
): number | null {
  const relPos = Y.decodeRelativePosition(encoded);
  const view = editorIndex !== undefined ? editorViews?.get(editorIndex) : undefined;
  if (view) {
    const syncState = getSyncState(view);
    if (syncState) {
      const pos = relativePositionToAbsolutePosition(
        doc,
        syncState.type,
        relPos,
        syncState.mapping,
      );
      return pos ?? null;
    }
  }
  // Fallback: raw Yjs index (only correct for flat fragments)
  const absPos = Y.createAbsolutePositionFromRelativePosition(relPos, doc);
  return absPos?.index ?? null;
}

// ---------------------------------------------------------------------------
// Initialize Y.Doc annotation structure
// ---------------------------------------------------------------------------

export function getLayersArray(doc: Y.Doc): Y.Array<Y.Map<unknown>> {
  return doc.getArray("layers");
}

/** Seed default layers into the Y.Doc if the layers array is empty.
 *
 * When EditorViews are provided, uses proper y-prosemirror position mapping
 * to correctly encode ProseMirror positions as Yjs RelativePositions.
 * This requires editors to be mounted with content already loaded.
 */
export function seedDefaultLayers(
  doc: Y.Doc,
  defaultLayers: Layer[],
  editorViews?: EditorViewMap,
): void {
  const yLayers = getLayersArray(doc);
  if (yLayers.length > 0) return; // Already seeded

  doc.transact(() => {
    for (const layer of defaultLayers) {
      const yLayer = new Y.Map<unknown>();
      yLayer.set("id", layer.id);
      yLayer.set("name", layer.name);
      yLayer.set("color", layer.color);
      yLayer.set("visible", layer.visible);

      const yHighlights = new Y.Array<Y.Map<unknown>>();
      for (const h of layer.highlights) {
        const yH = new Y.Map<unknown>();
        yH.set("id", h.id);
        yH.set("editorIndex", h.editorIndex);
        yH.set("fromRel", encodeRelativePosition(doc, h.editorIndex, h.from, editorViews));
        yH.set("toRel", encodeRelativePosition(doc, h.editorIndex, h.to, editorViews));
        yH.set("text", h.text);
        yH.set("annotation", h.annotation);
        yH.set("type", h.type);
        yH.set("visible", h.visible ?? true);
        yHighlights.push([yH]);
      }
      yLayer.set("highlights", yHighlights);

      const yArrows = new Y.Array<Y.Map<unknown>>();
      for (const a of layer.arrows) {
        const yA = new Y.Map<unknown>();
        yA.set("id", a.id);
        yA.set("fromEditorIndex", a.from.editorIndex);
        yA.set(
          "fromRel",
          encodeRelativePosition(doc, a.from.editorIndex, a.from.from, editorViews),
        );
        yA.set(
          "fromToRel",
          encodeRelativePosition(doc, a.from.editorIndex, a.from.to, editorViews),
        );
        yA.set("fromText", a.from.text);
        yA.set("toEditorIndex", a.to.editorIndex);
        yA.set("toRel", encodeRelativePosition(doc, a.to.editorIndex, a.to.from, editorViews));
        yA.set("toToRel", encodeRelativePosition(doc, a.to.editorIndex, a.to.to, editorViews));
        yA.set("toText", a.to.text);
        yA.set("arrowStyle", a.arrowStyle ?? "solid");
        yA.set("visible", a.visible ?? true);
        yArrows.push([yA]);
      }
      yLayer.set("arrows", yArrows);

      const yUnderlines = new Y.Array<Y.Map<unknown>>();
      for (const u of layer.underlines) {
        const yU = new Y.Map<unknown>();
        yU.set("id", u.id);
        yU.set("editorIndex", u.editorIndex);
        yU.set("fromRel", encodeRelativePosition(doc, u.editorIndex, u.from, editorViews));
        yU.set("toRel", encodeRelativePosition(doc, u.editorIndex, u.to, editorViews));
        yU.set("text", u.text);
        yU.set("visible", u.visible ?? true);
        yUnderlines.push([yU]);
      }
      yLayer.set("underlines", yUnderlines);

      yLayers.push([yLayer]);
    }
  });
}

// ---------------------------------------------------------------------------
// Read: Convert Yjs state → plain Layer[] for React rendering
// ---------------------------------------------------------------------------

export function readLayers(doc: Y.Doc, editorViews?: EditorViewMap): Layer[] {
  const yLayers = getLayersArray(doc);
  const layers: Layer[] = [];

  for (let i = 0; i < yLayers.length; i++) {
    const yLayer = yLayers.get(i);
    const layer: Layer = {
      id: yLayer.get("id") as string,
      name: yLayer.get("name") as string,
      color: yLayer.get("color") as string,
      visible: yLayer.get("visible") as boolean,
      highlights: readHighlights(doc, yLayer, editorViews),
      arrows: readArrows(doc, yLayer, editorViews),
      underlines: readUnderlines(doc, yLayer, editorViews),
    };
    layers.push(layer);
  }

  return layers;
}

function readReactions(
  yReactions: Y.Array<Y.Map<unknown>> | undefined,
): import("@/types/editor").CommentReaction[] {
  if (!yReactions) return [];
  const reactions: import("@/types/editor").CommentReaction[] = [];
  for (let i = 0; i < yReactions.length; i++) {
    const yR = yReactions.get(i);
    reactions.push({
      emoji: yR.get("emoji") as string,
      userName: sanitizeHtml(yR.get("userName") as string),
    });
  }
  return reactions;
}

function readReplies(yReplies: Y.Array<Y.Map<unknown>> | undefined): CommentReply[] {
  if (!yReplies) return [];
  const replies: CommentReply[] = [];
  for (let i = 0; i < yReplies.length; i++) {
    const yReply = yReplies.get(i);
    replies.push({
      id: yReply.get("id") as string,
      text: sanitizeHtml(yReply.get("text") as string),
      userName: sanitizeHtml(yReply.get("userName") as string),
      timestamp: yReply.get("timestamp") as number,
      reactions: readReactions(yReply.get("reactions") as Y.Array<Y.Map<unknown>> | undefined),
    });
  }
  return replies;
}

function readHighlights(
  doc: Y.Doc,
  yLayer: Y.Map<unknown>,
  editorViews?: EditorViewMap,
): Highlight[] {
  const yHighlights = yLayer.get("highlights") as Y.Array<Y.Map<unknown>> | undefined;
  if (!yHighlights) return [];

  const highlights: Highlight[] = [];
  for (let i = 0; i < yHighlights.length; i++) {
    const yH = yHighlights.get(i);
    const id = yH.get("id") as string;
    const editorIndex = yH.get("editorIndex") as number;
    const fromRel = yH.get("fromRel");
    const toRel = yH.get("toRel");
    if (!(fromRel instanceof Uint8Array) || !(toRel instanceof Uint8Array)) {
      console.error("[yjs] highlight has invalid position data:", id);
      continue;
    }
    const from = decodeRelativePosition(doc, fromRel, editorIndex, editorViews);
    const to = decodeRelativePosition(doc, toRel, editorIndex, editorViews);
    if (from === null || to === null) {
      console.warn("[yjs] highlight position lost:", id);
      continue;
    }

    const text = sanitizeHtml(yH.get("text") as string);
    const annotation = sanitizeHtml((yH.get("annotation") as string) ?? "");
    const lastEdited = (yH.get("lastEdited") as number) ?? undefined;
    const rawUserName = (yH.get("userName") as string) ?? undefined;
    const userName = rawUserName ? sanitizeHtml(rawUserName) : undefined;
    highlights.push({
      id,
      editorIndex,
      from,
      to,
      text,
      annotation,
      type: (yH.get("type") as "highlight" | "comment") ?? "highlight",
      lastEdited,
      visible: (yH.get("visible") as boolean) ?? true,
      userName,
      reactions: readReactions(yH.get("reactions") as Y.Array<Y.Map<unknown>> | undefined),
      replies: readReplies(yH.get("replies") as Y.Array<Y.Map<unknown>> | undefined),
    });
  }

  return highlights;
}

function readArrows(doc: Y.Doc, yLayer: Y.Map<unknown>, editorViews?: EditorViewMap): Arrow[] {
  const yArrows = yLayer.get("arrows") as Y.Array<Y.Map<unknown>> | undefined;
  if (!yArrows) return [];

  const arrows: Arrow[] = [];
  for (let i = 0; i < yArrows.length; i++) {
    const yA = yArrows.get(i);
    const id = yA.get("id") as string;
    const fromEditorIndex = yA.get("fromEditorIndex") as number;
    const toEditorIndex = yA.get("toEditorIndex") as number;
    const fromRel = yA.get("fromRel");
    const fromToRel = yA.get("fromToRel");
    const toRel = yA.get("toRel");
    const toToRel = yA.get("toToRel");
    if (
      !(fromRel instanceof Uint8Array) ||
      !(fromToRel instanceof Uint8Array) ||
      !(toRel instanceof Uint8Array) ||
      !(toToRel instanceof Uint8Array)
    ) {
      console.error("[yjs] arrow has invalid position data:", id);
      continue;
    }
    const fromFrom = decodeRelativePosition(doc, fromRel, fromEditorIndex, editorViews);
    const fromTo = decodeRelativePosition(doc, fromToRel, fromEditorIndex, editorViews);
    const toFrom = decodeRelativePosition(doc, toRel, toEditorIndex, editorViews);
    const toTo = decodeRelativePosition(doc, toToRel, toEditorIndex, editorViews);
    if (fromFrom === null || fromTo === null || toFrom === null || toTo === null) {
      console.warn("[yjs] arrow position lost:", id);
      continue;
    }

    arrows.push({
      id,
      from: {
        editorIndex: fromEditorIndex,
        from: fromFrom,
        to: fromTo,
        text: sanitizeHtml(yA.get("fromText") as string),
      },
      to: {
        editorIndex: toEditorIndex,
        from: toFrom,
        to: toTo,
        text: sanitizeHtml(yA.get("toText") as string),
      },
      arrowStyle: (yA.get("arrowStyle") as ArrowStyle) ?? "solid",
      visible: (yA.get("visible") as boolean) ?? true,
    });
  }

  return arrows;
}

function readUnderlines(
  doc: Y.Doc,
  yLayer: Y.Map<unknown>,
  editorViews?: EditorViewMap,
): LayerUnderline[] {
  const yUnderlines = yLayer.get("underlines") as Y.Array<Y.Map<unknown>> | undefined;
  if (!yUnderlines) return [];

  const underlines: LayerUnderline[] = [];
  for (let i = 0; i < yUnderlines.length; i++) {
    const yU = yUnderlines.get(i);
    const id = yU.get("id") as string;
    const editorIndex = yU.get("editorIndex") as number;
    const fromRel = yU.get("fromRel");
    const toRel = yU.get("toRel");
    if (!(fromRel instanceof Uint8Array) || !(toRel instanceof Uint8Array)) {
      console.error("[yjs] underline has invalid position data:", id);
      continue;
    }
    const from = decodeRelativePosition(doc, fromRel, editorIndex, editorViews);
    const to = decodeRelativePosition(doc, toRel, editorIndex, editorViews);
    if (from === null || to === null) {
      console.warn("[yjs] underline position lost:", id);
      continue;
    }

    underlines.push({
      id,
      editorIndex,
      from,
      to,
      text: sanitizeHtml(yU.get("text") as string),
      visible: (yU.get("visible") as boolean) ?? true,
    });
  }

  return underlines;
}

// ---------------------------------------------------------------------------
// Write: Mutation helpers for Yjs annotations
// ---------------------------------------------------------------------------

function findYLayer(doc: Y.Doc, layerId: string): { yLayer: Y.Map<unknown>; index: number } | null {
  const yLayers = getLayersArray(doc);
  for (let i = 0; i < yLayers.length; i++) {
    const yLayer = yLayers.get(i);
    if (yLayer.get("id") === layerId) return { yLayer, index: i };
  }
  return null;
}

export function addLayerToDoc(doc: Y.Doc, opts: { id: string; name: string; color: string }): void {
  const yLayers = getLayersArray(doc);
  const yLayer = new Y.Map<unknown>();
  yLayer.set("id", opts.id);
  yLayer.set("name", opts.name);
  yLayer.set("color", opts.color);
  yLayer.set("visible", true);
  yLayer.set("highlights", new Y.Array<Y.Map<unknown>>());
  yLayer.set("arrows", new Y.Array<Y.Map<unknown>>());
  yLayer.set("underlines", new Y.Array<Y.Map<unknown>>());
  yLayers.push([yLayer]);
}

export function removeLayerFromDoc(doc: Y.Doc, layerId: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  getLayersArray(doc).delete(result.index);
}

export function updateLayerNameInDoc(doc: Y.Doc, layerId: string, name: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  result.yLayer.set("name", name);
}

export function updateLayerColorInDoc(doc: Y.Doc, layerId: string, color: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  result.yLayer.set("color", color);
}

export function toggleLayerVisibilityInDoc(doc: Y.Doc, layerId: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  result.yLayer.set("visible", !(result.yLayer.get("visible") as boolean));
}

export function toggleAllLayerVisibilityInDoc(doc: Y.Doc): void {
  const yLayers = getLayersArray(doc);
  let anyVisible = false;
  for (let i = 0; i < yLayers.length; i++) {
    if (yLayers.get(i).get("visible") as boolean) {
      anyVisible = true;
      break;
    }
  }
  doc.transact(() => {
    for (let i = 0; i < yLayers.length; i++) {
      yLayers.get(i).set("visible", !anyVisible);
    }
  });
}

export function addHighlightToDoc(
  doc: Y.Doc,
  layerId: string,
  highlight: Omit<Highlight, "id" | "visible">,
  id: string,
  editorViews?: EditorViewMap,
): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yHighlights = result.yLayer.get("highlights") as Y.Array<Y.Map<unknown>>;
  const yH = new Y.Map<unknown>();
  yH.set("id", id);
  yH.set("editorIndex", highlight.editorIndex);
  yH.set(
    "fromRel",
    encodeRelativePosition(doc, highlight.editorIndex, highlight.from, editorViews),
  );
  yH.set("toRel", encodeRelativePosition(doc, highlight.editorIndex, highlight.to, editorViews));
  yH.set("text", highlight.text);
  yH.set("annotation", highlight.annotation);
  yH.set("type", highlight.type);
  yH.set("lastEdited", Date.now());
  yH.set("visible", true);
  if ((highlight as { userName?: string }).userName) {
    yH.set("userName", (highlight as { userName?: string }).userName);
  }
  yH.set("reactions", new Y.Array<Y.Map<unknown>>());
  yH.set("replies", new Y.Array<Y.Map<unknown>>());
  yHighlights.push([yH]);
}

export function removeHighlightFromDoc(doc: Y.Doc, layerId: string, highlightId: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yHighlights = result.yLayer.get("highlights") as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yHighlights.length; i++) {
    if (yHighlights.get(i).get("id") === highlightId) {
      yHighlights.delete(i);
      return;
    }
  }
}

function findYHighlight(doc: Y.Doc, layerId: string, highlightId: string): Y.Map<unknown> | null {
  const result = findYLayer(doc, layerId);
  if (!result) return null;
  const yHighlights = result.yLayer.get("highlights") as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yHighlights.length; i++) {
    const yH = yHighlights.get(i);
    if (yH.get("id") === highlightId) return yH;
  }
  return null;
}

function getOrCreateYArray(yMap: Y.Map<unknown>, key: string): Y.Array<Y.Map<unknown>> {
  let arr = yMap.get(key) as Y.Array<Y.Map<unknown>> | undefined;
  if (!arr) {
    arr = new Y.Array<Y.Map<unknown>>();
    yMap.set(key, arr);
  }
  return arr;
}

export function addReplyToDoc(
  doc: Y.Doc,
  layerId: string,
  highlightId: string,
  reply: CommentReply,
): void {
  const yH = findYHighlight(doc, layerId, highlightId);
  if (!yH) return;
  const yReplies = getOrCreateYArray(yH, "replies");
  const yReply = new Y.Map<unknown>();
  yReply.set("id", reply.id);
  yReply.set("text", reply.text);
  yReply.set("userName", reply.userName);
  yReply.set("timestamp", reply.timestamp);
  yReply.set("reactions", new Y.Array<Y.Map<unknown>>());
  yReplies.push([yReply]);
}

export function updateReplyInDoc(
  doc: Y.Doc,
  layerId: string,
  highlightId: string,
  replyId: string,
  text: string,
): void {
  const yH = findYHighlight(doc, layerId, highlightId);
  if (!yH) return;
  const yReplies = yH.get("replies") as Y.Array<Y.Map<unknown>> | undefined;
  if (!yReplies) return;
  for (let i = 0; i < yReplies.length; i++) {
    const yReply = yReplies.get(i);
    if (yReply.get("id") === replyId) {
      yReply.set("text", text);
      yReply.set("timestamp", Date.now());
      return;
    }
  }
}

export function removeReplyFromDoc(
  doc: Y.Doc,
  layerId: string,
  highlightId: string,
  replyId: string,
): void {
  const yH = findYHighlight(doc, layerId, highlightId);
  if (!yH) return;
  const yReplies = yH.get("replies") as Y.Array<Y.Map<unknown>> | undefined;
  if (!yReplies) return;
  for (let i = 0; i < yReplies.length; i++) {
    if (yReplies.get(i).get("id") === replyId) {
      yReplies.delete(i);
      return;
    }
  }
}

export function toggleReactionOnHighlightInDoc(
  doc: Y.Doc,
  layerId: string,
  highlightId: string,
  emoji: string,
  userName: string,
): void {
  const yH = findYHighlight(doc, layerId, highlightId);
  if (!yH) return;
  const yReactions = getOrCreateYArray(yH, "reactions");
  for (let i = 0; i < yReactions.length; i++) {
    const yR = yReactions.get(i);
    if (yR.get("emoji") === emoji && yR.get("userName") === userName) {
      yReactions.delete(i);
      return;
    }
  }
  const yR = new Y.Map<unknown>();
  yR.set("emoji", emoji);
  yR.set("userName", userName);
  yReactions.push([yR]);
}

export function toggleReactionOnReplyInDoc(
  doc: Y.Doc,
  layerId: string,
  highlightId: string,
  replyId: string,
  emoji: string,
  userName: string,
): void {
  const yH = findYHighlight(doc, layerId, highlightId);
  if (!yH) return;
  const yReplies = yH.get("replies") as Y.Array<Y.Map<unknown>> | undefined;
  if (!yReplies) return;
  for (let i = 0; i < yReplies.length; i++) {
    const yReply = yReplies.get(i);
    if (yReply.get("id") === replyId) {
      const yReactions = getOrCreateYArray(yReply, "reactions");
      for (let j = 0; j < yReactions.length; j++) {
        const yR = yReactions.get(j);
        if (yR.get("emoji") === emoji && yR.get("userName") === userName) {
          yReactions.delete(j);
          return;
        }
      }
      const yR = new Y.Map<unknown>();
      yR.set("emoji", emoji);
      yR.set("userName", userName);
      yReactions.push([yR]);
      return;
    }
  }
}

export function updateHighlightAnnotationInDoc(
  doc: Y.Doc,
  layerId: string,
  highlightId: string,
  annotation: string,
): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yHighlights = result.yLayer.get("highlights") as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yHighlights.length; i++) {
    const yH = yHighlights.get(i);
    if (yH.get("id") === highlightId) {
      doc.transact(() => {
        yH.set("annotation", annotation);
        yH.set("lastEdited", Date.now());
      });
      return;
    }
  }
}

export function clearLayerHighlightsInDoc(doc: Y.Doc, layerId: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yHighlights = result.yLayer.get("highlights") as Y.Array<Y.Map<unknown>>;
  if (yHighlights.length > 0) {
    yHighlights.delete(0, yHighlights.length);
  }
}

export function addArrowToDoc(
  doc: Y.Doc,
  layerId: string,
  arrow: Omit<Arrow, "id" | "visible">,
  id: string,
  editorViews?: EditorViewMap,
): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yArrows = result.yLayer.get("arrows") as Y.Array<Y.Map<unknown>>;
  const yA = new Y.Map<unknown>();
  yA.set("id", id);
  yA.set("fromEditorIndex", arrow.from.editorIndex);
  yA.set(
    "fromRel",
    encodeRelativePosition(doc, arrow.from.editorIndex, arrow.from.from, editorViews),
  );
  yA.set(
    "fromToRel",
    encodeRelativePosition(doc, arrow.from.editorIndex, arrow.from.to, editorViews),
  );
  yA.set("fromText", arrow.from.text);
  yA.set("toEditorIndex", arrow.to.editorIndex);
  yA.set("toRel", encodeRelativePosition(doc, arrow.to.editorIndex, arrow.to.from, editorViews));
  yA.set("toToRel", encodeRelativePosition(doc, arrow.to.editorIndex, arrow.to.to, editorViews));
  yA.set("toText", arrow.to.text);
  yA.set("arrowStyle", arrow.arrowStyle ?? "solid");
  yA.set("visible", true);
  yArrows.push([yA]);
}

export function removeArrowFromDoc(doc: Y.Doc, layerId: string, arrowId: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yArrows = result.yLayer.get("arrows") as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yArrows.length; i++) {
    if (yArrows.get(i).get("id") === arrowId) {
      yArrows.delete(i);
      return;
    }
  }
}

export function updateArrowStyleInDoc(
  doc: Y.Doc,
  layerId: string,
  arrowId: string,
  arrowStyle: ArrowStyle,
): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yArrows = result.yLayer.get("arrows") as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yArrows.length; i++) {
    const yA = yArrows.get(i);
    if (yA.get("id") === arrowId) {
      yA.set("arrowStyle", arrowStyle);
      return;
    }
  }
}

export function clearLayerArrowsInDoc(doc: Y.Doc, layerId: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yArrows = result.yLayer.get("arrows") as Y.Array<Y.Map<unknown>>;
  if (yArrows.length > 0) {
    yArrows.delete(0, yArrows.length);
  }
}

export function addUnderlineToDoc(
  doc: Y.Doc,
  layerId: string,
  underline: Omit<LayerUnderline, "id" | "visible">,
  id: string,
  editorViews?: EditorViewMap,
): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yUnderlines = result.yLayer.get("underlines") as Y.Array<Y.Map<unknown>>;
  const yU = new Y.Map<unknown>();
  yU.set("id", id);
  yU.set("editorIndex", underline.editorIndex);
  yU.set(
    "fromRel",
    encodeRelativePosition(doc, underline.editorIndex, underline.from, editorViews),
  );
  yU.set("toRel", encodeRelativePosition(doc, underline.editorIndex, underline.to, editorViews));
  yU.set("text", underline.text);
  yU.set("visible", true);
  yUnderlines.push([yU]);
}

export function removeUnderlineFromDoc(doc: Y.Doc, layerId: string, underlineId: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yUnderlines = result.yLayer.get("underlines") as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yUnderlines.length; i++) {
    if (yUnderlines.get(i).get("id") === underlineId) {
      yUnderlines.delete(i);
      return;
    }
  }
}

export function clearLayerUnderlinesInDoc(doc: Y.Doc, layerId: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yUnderlines = result.yLayer.get("underlines") as Y.Array<Y.Map<unknown>>;
  if (yUnderlines.length > 0) {
    yUnderlines.delete(0, yUnderlines.length);
  }
}

// ---------------------------------------------------------------------------
// Annotation visibility toggles
// ---------------------------------------------------------------------------

export function toggleHighlightVisibilityInDoc(
  doc: Y.Doc,
  layerId: string,
  highlightId: string,
): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yHighlights = result.yLayer.get("highlights") as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yHighlights.length; i++) {
    const yH = yHighlights.get(i);
    if (yH.get("id") === highlightId) {
      yH.set("visible", !((yH.get("visible") as boolean) ?? true));
      return;
    }
  }
}

export function toggleArrowVisibilityInDoc(doc: Y.Doc, layerId: string, arrowId: string): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yArrows = result.yLayer.get("arrows") as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yArrows.length; i++) {
    const yA = yArrows.get(i);
    if (yA.get("id") === arrowId) {
      yA.set("visible", !((yA.get("visible") as boolean) ?? true));
      return;
    }
  }
}

export function toggleUnderlineVisibilityInDoc(
  doc: Y.Doc,
  layerId: string,
  underlineId: string,
): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yUnderlines = result.yLayer.get("underlines") as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yUnderlines.length; i++) {
    const yU = yUnderlines.get(i);
    if (yU.get("id") === underlineId) {
      yU.set("visible", !((yU.get("visible") as boolean) ?? true));
      return;
    }
  }
}

export function setAnnotationVisibilityInDoc(
  doc: Y.Doc,
  layerId: string,
  annotationType: "highlights" | "arrows" | "underlines",
  annotationId: string,
  visible: boolean,
): void {
  const result = findYLayer(doc, layerId);
  if (!result) return;
  const yArray = result.yLayer.get(annotationType) as Y.Array<Y.Map<unknown>>;
  if (!yArray) return;
  for (let i = 0; i < yArray.length; i++) {
    const yItem = yArray.get(i);
    if (yItem.get("id") === annotationId) {
      yItem.set("visible", visible);
      return;
    }
  }
}
