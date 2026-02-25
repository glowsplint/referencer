import { describe, it, expect, vi } from "vitest";
import * as Y from "yjs";
import {
  addLayerToDoc,
  removeLayerFromDoc,
  updateLayerNameInDoc,
  updateLayerColorInDoc,
  toggleLayerVisibilityInDoc,
  toggleAllLayerVisibilityInDoc,
  addHighlightToDoc,
  removeHighlightFromDoc,
  updateHighlightAnnotationInDoc,
  clearLayerHighlightsInDoc,
  addArrowToDoc,
  removeArrowFromDoc,
  updateArrowStyleInDoc,
  clearLayerArrowsInDoc,
  addUnderlineToDoc,
  removeUnderlineFromDoc,
  clearLayerUnderlinesInDoc,
  addReplyToDoc,
  updateReplyInDoc,
  removeReplyFromDoc,
  toggleReactionOnHighlightInDoc,
  toggleReactionOnReplyInDoc,
  readLayers,
  seedDefaultLayers,
  getLayersArray,
  encodeRelativePosition,
  decodeRelativePosition,
  setAnnotationVisibilityInDoc,
} from "../annotations";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDoc(): Y.Doc {
  return new Y.Doc();
}

function addTestLayer(doc: Y.Doc, id = "layer-1", name = "Layer 1", color = "#ff0000") {
  addLayerToDoc(doc, { id, name, color });
}

function addTestHighlight(
  doc: Y.Doc,
  layerId = "layer-1",
  highlightId = "h1",
  opts?: Partial<{ editorIndex: number; from: number; to: number; text: string; annotation: string; type: "highlight" | "comment" }>,
) {
  addHighlightToDoc(
    doc,
    layerId,
    {
      editorIndex: opts?.editorIndex ?? 0,
      from: opts?.from ?? 0,
      to: opts?.to ?? 5,
      text: opts?.text ?? "hello",
      annotation: opts?.annotation ?? "test note",
      type: opts?.type ?? "highlight",
    },
    highlightId,
  );
}

// ---------------------------------------------------------------------------
// Layer operations
// ---------------------------------------------------------------------------

describe("layer operations", () => {
  it("addLayerToDoc creates a layer with id, name, color, visible=true, and empty annotation arrays", () => {
    const doc = createDoc();
    addTestLayer(doc, "L1", "My Layer", "#00ff00");

    const layers = readLayers(doc);
    expect(layers).toHaveLength(1);
    expect(layers[0]).toMatchObject({
      id: "L1",
      name: "My Layer",
      color: "#00ff00",
      visible: true,
    });
    expect(layers[0].highlights).toEqual([]);
    expect(layers[0].arrows).toEqual([]);
    expect(layers[0].underlines).toEqual([]);
  });

  it("addLayerToDoc can add multiple layers", () => {
    const doc = createDoc();
    addTestLayer(doc, "L1", "First", "#ff0000");
    addTestLayer(doc, "L2", "Second", "#00ff00");
    addTestLayer(doc, "L3", "Third", "#0000ff");

    const layers = readLayers(doc);
    expect(layers).toHaveLength(3);
    expect(layers.map((l) => l.id)).toEqual(["L1", "L2", "L3"]);
  });

  it("removeLayerFromDoc deletes the correct layer", () => {
    const doc = createDoc();
    addTestLayer(doc, "L1", "First", "#ff0000");
    addTestLayer(doc, "L2", "Second", "#00ff00");

    removeLayerFromDoc(doc, "L1");

    const layers = readLayers(doc);
    expect(layers).toHaveLength(1);
    expect(layers[0].id).toBe("L2");
  });

  it("removeLayerFromDoc is a no-op for missing id", () => {
    const doc = createDoc();
    addTestLayer(doc);

    removeLayerFromDoc(doc, "nonexistent");

    const layers = readLayers(doc);
    expect(layers).toHaveLength(1);
  });

  it("updateLayerNameInDoc updates the name", () => {
    const doc = createDoc();
    addTestLayer(doc, "L1", "Original");

    updateLayerNameInDoc(doc, "L1", "Renamed");

    const layers = readLayers(doc);
    expect(layers[0].name).toBe("Renamed");
  });

  it("updateLayerColorInDoc updates the color", () => {
    const doc = createDoc();
    addTestLayer(doc, "L1", "Layer", "#ff0000");

    updateLayerColorInDoc(doc, "L1", "#0000ff");

    const layers = readLayers(doc);
    expect(layers[0].color).toBe("#0000ff");
  });

  it("toggleLayerVisibilityInDoc flips the visible boolean", () => {
    const doc = createDoc();
    addTestLayer(doc);

    let layers = readLayers(doc);
    expect(layers[0].visible).toBe(true);

    toggleLayerVisibilityInDoc(doc, "layer-1");
    layers = readLayers(doc);
    expect(layers[0].visible).toBe(false);

    toggleLayerVisibilityInDoc(doc, "layer-1");
    layers = readLayers(doc);
    expect(layers[0].visible).toBe(true);
  });

  it("toggleAllLayerVisibilityInDoc hides all when any are visible", () => {
    const doc = createDoc();
    addTestLayer(doc, "L1");
    addTestLayer(doc, "L2");

    // Make L2 hidden, L1 still visible
    toggleLayerVisibilityInDoc(doc, "L2");

    toggleAllLayerVisibilityInDoc(doc);

    const layers = readLayers(doc);
    expect(layers.every((l) => l.visible === false)).toBe(true);
  });

  it("toggleAllLayerVisibilityInDoc shows all when all are hidden", () => {
    const doc = createDoc();
    addTestLayer(doc, "L1");
    addTestLayer(doc, "L2");

    // Hide both
    toggleLayerVisibilityInDoc(doc, "L1");
    toggleLayerVisibilityInDoc(doc, "L2");

    toggleAllLayerVisibilityInDoc(doc);

    const layers = readLayers(doc);
    expect(layers.every((l) => l.visible === true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Highlight operations
// ---------------------------------------------------------------------------

describe("highlight operations", () => {
  it("addHighlightToDoc stores a highlight with visible=true and encoded positions", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestHighlight(doc, "layer-1", "h1", { text: "world", annotation: "my note", type: "comment" });

    const layers = readLayers(doc);
    const h = layers[0].highlights[0];
    expect(h.id).toBe("h1");
    expect(h.editorIndex).toBe(0);
    expect(h.text).toBe("world");
    expect(h.annotation).toBe("my note");
    expect(h.type).toBe("comment");
    expect(h.visible).toBe(true);
    expect(typeof h.from).toBe("number");
    expect(typeof h.to).toBe("number");
    expect(h.lastEdited).toBeDefined();
    expect(h.reactions).toEqual([]);
    expect(h.replies).toEqual([]);
  });

  it("removeHighlightFromDoc removes by id", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestHighlight(doc, "layer-1", "h1");
    addTestHighlight(doc, "layer-1", "h2", { text: "second" });

    removeHighlightFromDoc(doc, "layer-1", "h1");

    const layers = readLayers(doc);
    expect(layers[0].highlights).toHaveLength(1);
    expect(layers[0].highlights[0].id).toBe("h2");
  });

  it("removeHighlightFromDoc is a no-op for missing id", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestHighlight(doc);

    removeHighlightFromDoc(doc, "layer-1", "nonexistent");

    expect(readLayers(doc)[0].highlights).toHaveLength(1);
  });

  it("updateHighlightAnnotationInDoc updates annotation text and sets lastEdited", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestHighlight(doc);

    const before = Date.now();
    updateHighlightAnnotationInDoc(doc, "layer-1", "h1", "updated note");
    const after = Date.now();

    const h = readLayers(doc)[0].highlights[0];
    expect(h.annotation).toBe("updated note");
    expect(h.lastEdited).toBeGreaterThanOrEqual(before);
    expect(h.lastEdited).toBeLessThanOrEqual(after);
  });

  it("clearLayerHighlightsInDoc removes all highlights from a layer", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestHighlight(doc, "layer-1", "h1");
    addTestHighlight(doc, "layer-1", "h2");
    addTestHighlight(doc, "layer-1", "h3");

    clearLayerHighlightsInDoc(doc, "layer-1");

    expect(readLayers(doc)[0].highlights).toHaveLength(0);
  });

  it("clearLayerHighlightsInDoc is safe on empty highlights", () => {
    const doc = createDoc();
    addTestLayer(doc);

    clearLayerHighlightsInDoc(doc, "layer-1");

    expect(readLayers(doc)[0].highlights).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Arrow operations
// ---------------------------------------------------------------------------

describe("arrow operations", () => {
  function addTestArrow(
    doc: Y.Doc,
    layerId = "layer-1",
    arrowId = "a1",
    arrowStyle?: "solid" | "dashed" | "dotted" | "double",
  ) {
    addArrowToDoc(
      doc,
      layerId,
      {
        from: { editorIndex: 0, from: 0, to: 3, text: "foo" },
        to: { editorIndex: 0, from: 10, to: 13, text: "bar" },
        arrowStyle,
      },
      arrowId,
    );
  }

  it("addArrowToDoc stores from/to positions with default arrowStyle 'solid'", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestArrow(doc);

    const layers = readLayers(doc);
    const a = layers[0].arrows[0];
    expect(a.id).toBe("a1");
    expect(a.from.editorIndex).toBe(0);
    expect(a.from.text).toBe("foo");
    expect(a.to.editorIndex).toBe(0);
    expect(a.to.text).toBe("bar");
    expect(a.arrowStyle).toBe("solid");
    expect(a.visible).toBe(true);
  });

  it("addArrowToDoc respects explicit arrowStyle", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestArrow(doc, "layer-1", "a1", "dashed");

    const a = readLayers(doc)[0].arrows[0];
    expect(a.arrowStyle).toBe("dashed");
  });

  it("removeArrowFromDoc removes by id", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestArrow(doc, "layer-1", "a1");
    addTestArrow(doc, "layer-1", "a2");

    removeArrowFromDoc(doc, "layer-1", "a1");

    const arrows = readLayers(doc)[0].arrows;
    expect(arrows).toHaveLength(1);
    expect(arrows[0].id).toBe("a2");
  });

  it("removeArrowFromDoc is a no-op for missing id", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestArrow(doc);

    removeArrowFromDoc(doc, "layer-1", "nonexistent");

    expect(readLayers(doc)[0].arrows).toHaveLength(1);
  });

  it("updateArrowStyleInDoc changes the arrowStyle", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestArrow(doc);

    updateArrowStyleInDoc(doc, "layer-1", "a1", "dotted");

    expect(readLayers(doc)[0].arrows[0].arrowStyle).toBe("dotted");
  });

  it("clearLayerArrowsInDoc removes all arrows from a layer", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestArrow(doc, "layer-1", "a1");
    addTestArrow(doc, "layer-1", "a2");

    clearLayerArrowsInDoc(doc, "layer-1");

    expect(readLayers(doc)[0].arrows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Underline operations
// ---------------------------------------------------------------------------

describe("underline operations", () => {
  function addTestUnderline(doc: Y.Doc, layerId = "layer-1", id = "u1") {
    addUnderlineToDoc(doc, layerId, { editorIndex: 0, from: 0, to: 5, text: "hello" }, id);
  }

  it("addUnderlineToDoc stores underline with visible=true", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestUnderline(doc);

    const u = readLayers(doc)[0].underlines[0];
    expect(u.id).toBe("u1");
    expect(u.editorIndex).toBe(0);
    expect(u.text).toBe("hello");
    expect(u.visible).toBe(true);
    expect(typeof u.from).toBe("number");
    expect(typeof u.to).toBe("number");
  });

  it("removeUnderlineFromDoc removes by id", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestUnderline(doc, "layer-1", "u1");
    addTestUnderline(doc, "layer-1", "u2");

    removeUnderlineFromDoc(doc, "layer-1", "u1");

    const underlines = readLayers(doc)[0].underlines;
    expect(underlines).toHaveLength(1);
    expect(underlines[0].id).toBe("u2");
  });

  it("removeUnderlineFromDoc is a no-op for missing id", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestUnderline(doc);

    removeUnderlineFromDoc(doc, "layer-1", "nonexistent");

    expect(readLayers(doc)[0].underlines).toHaveLength(1);
  });

  it("clearLayerUnderlinesInDoc removes all underlines from a layer", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestUnderline(doc, "layer-1", "u1");
    addTestUnderline(doc, "layer-1", "u2");

    clearLayerUnderlinesInDoc(doc, "layer-1");

    expect(readLayers(doc)[0].underlines).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Reply operations
// ---------------------------------------------------------------------------

describe("reply operations", () => {
  function setupHighlightWithReply(doc: Y.Doc) {
    addTestLayer(doc);
    addTestHighlight(doc, "layer-1", "h1", { type: "comment" });
    addReplyToDoc(doc, "layer-1", "h1", {
      id: "r1",
      text: "first reply",
      userName: "Alice",
      timestamp: 1000,
      reactions: [],
    });
  }

  it("addReplyToDoc adds a reply to a highlight", () => {
    const doc = createDoc();
    setupHighlightWithReply(doc);

    const h = readLayers(doc)[0].highlights[0];
    expect(h.replies).toHaveLength(1);
    expect(h.replies![0]).toMatchObject({
      id: "r1",
      text: "first reply",
      userName: "Alice",
      timestamp: 1000,
    });
    expect(h.replies![0].reactions).toEqual([]);
  });

  it("addReplyToDoc appends multiple replies", () => {
    const doc = createDoc();
    setupHighlightWithReply(doc);
    addReplyToDoc(doc, "layer-1", "h1", {
      id: "r2",
      text: "second reply",
      userName: "Bob",
      timestamp: 2000,
      reactions: [],
    });

    const replies = readLayers(doc)[0].highlights[0].replies!;
    expect(replies).toHaveLength(2);
    expect(replies[1].id).toBe("r2");
  });

  it("updateReplyInDoc changes text and updates timestamp", () => {
    const doc = createDoc();
    setupHighlightWithReply(doc);

    const before = Date.now();
    updateReplyInDoc(doc, "layer-1", "h1", "r1", "edited reply");
    const after = Date.now();

    const reply = readLayers(doc)[0].highlights[0].replies![0];
    expect(reply.text).toBe("edited reply");
    expect(reply.timestamp).toBeGreaterThanOrEqual(before);
    expect(reply.timestamp).toBeLessThanOrEqual(after);
  });

  it("removeReplyFromDoc removes a reply by id", () => {
    const doc = createDoc();
    setupHighlightWithReply(doc);
    addReplyToDoc(doc, "layer-1", "h1", {
      id: "r2",
      text: "second",
      userName: "Bob",
      timestamp: 2000,
      reactions: [],
    });

    removeReplyFromDoc(doc, "layer-1", "h1", "r1");

    const replies = readLayers(doc)[0].highlights[0].replies!;
    expect(replies).toHaveLength(1);
    expect(replies[0].id).toBe("r2");
  });

  it("removeReplyFromDoc is a no-op for missing reply id", () => {
    const doc = createDoc();
    setupHighlightWithReply(doc);

    removeReplyFromDoc(doc, "layer-1", "h1", "nonexistent");

    expect(readLayers(doc)[0].highlights[0].replies).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Reaction operations
// ---------------------------------------------------------------------------

describe("reaction operations", () => {
  it("toggleReactionOnHighlightInDoc adds a reaction on first call", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestHighlight(doc, "layer-1", "h1");

    toggleReactionOnHighlightInDoc(doc, "layer-1", "h1", "👍", "Alice");

    const reactions = readLayers(doc)[0].highlights[0].reactions!;
    expect(reactions).toHaveLength(1);
    expect(reactions[0]).toEqual({ emoji: "👍", userName: "Alice" });
  });

  it("toggleReactionOnHighlightInDoc removes the same reaction on second call", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestHighlight(doc, "layer-1", "h1");

    toggleReactionOnHighlightInDoc(doc, "layer-1", "h1", "👍", "Alice");
    toggleReactionOnHighlightInDoc(doc, "layer-1", "h1", "👍", "Alice");

    const reactions = readLayers(doc)[0].highlights[0].reactions!;
    expect(reactions).toHaveLength(0);
  });

  it("toggleReactionOnHighlightInDoc keeps different user reactions separate", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestHighlight(doc, "layer-1", "h1");

    toggleReactionOnHighlightInDoc(doc, "layer-1", "h1", "👍", "Alice");
    toggleReactionOnHighlightInDoc(doc, "layer-1", "h1", "👍", "Bob");

    const reactions = readLayers(doc)[0].highlights[0].reactions!;
    expect(reactions).toHaveLength(2);
  });

  it("toggleReactionOnReplyInDoc adds then removes reaction on a reply", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestHighlight(doc, "layer-1", "h1");
    addReplyToDoc(doc, "layer-1", "h1", {
      id: "r1",
      text: "a reply",
      userName: "Alice",
      timestamp: 1000,
      reactions: [],
    });

    // Add
    toggleReactionOnReplyInDoc(doc, "layer-1", "h1", "r1", "❤️", "Bob");
    let reply = readLayers(doc)[0].highlights[0].replies![0];
    expect(reply.reactions).toHaveLength(1);
    expect(reply.reactions[0]).toEqual({ emoji: "❤️", userName: "Bob" });

    // Remove (toggle off)
    toggleReactionOnReplyInDoc(doc, "layer-1", "h1", "r1", "❤️", "Bob");
    reply = readLayers(doc)[0].highlights[0].replies![0];
    expect(reply.reactions).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Read operations (round-trips)
// ---------------------------------------------------------------------------

describe("read operations", () => {
  it("readLayers returns correct plain objects after adding layers with annotations", () => {
    const doc = createDoc();
    addTestLayer(doc, "L1", "Layer One", "#ff0000");
    addTestHighlight(doc, "L1", "h1", { text: "highlighted" });
    addArrowToDoc(
      doc,
      "L1",
      {
        from: { editorIndex: 0, from: 0, to: 3, text: "src" },
        to: { editorIndex: 0, from: 10, to: 13, text: "dst" },
      },
      "a1",
    );
    addUnderlineToDoc(doc, "L1", { editorIndex: 0, from: 2, to: 4, text: "ul" }, "u1");

    const layers = readLayers(doc);
    expect(layers).toHaveLength(1);
    expect(layers[0].id).toBe("L1");
    expect(layers[0].highlights).toHaveLength(1);
    expect(layers[0].arrows).toHaveLength(1);
    expect(layers[0].underlines).toHaveLength(1);
  });

  it("readLayers returns empty array for empty doc", () => {
    const doc = createDoc();
    expect(readLayers(doc)).toEqual([]);
  });

  it("highlights with invalid position data (non-Uint8Array) are skipped", () => {
    const doc = createDoc();
    addTestLayer(doc);

    // Manually inject a highlight with string positions instead of Uint8Array
    const yLayers = getLayersArray(doc);
    const yLayer = yLayers.get(0);
    const yHighlights = yLayer.get("highlights") as Y.Array<Y.Map<unknown>>;

    const yH = new Y.Map<unknown>();
    yH.set("id", "h-bad");
    yH.set("editorIndex", 0);
    yH.set("fromRel", "not-a-uint8array");
    yH.set("toRel", "not-a-uint8array");
    yH.set("text", "bad");
    yH.set("annotation", "");
    yH.set("type", "highlight");
    yH.set("visible", true);
    yHighlights.push([yH]);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const layers = readLayers(doc);
    expect(layers[0].highlights).toHaveLength(0);
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// seedDefaultLayers
// ---------------------------------------------------------------------------

describe("seedDefaultLayers", () => {
  it("populates an empty doc with default layers", () => {
    const doc = createDoc();
    seedDefaultLayers(doc, [
      {
        id: "default-1",
        name: "Default",
        color: "#aabbcc",
        visible: true,
        highlights: [],
        arrows: [],
        underlines: [],
      },
    ]);

    const layers = readLayers(doc);
    expect(layers).toHaveLength(1);
    expect(layers[0].id).toBe("default-1");
    expect(layers[0].name).toBe("Default");
  });

  it("skips seeding if doc already has layers", () => {
    const doc = createDoc();
    addTestLayer(doc, "existing");

    seedDefaultLayers(doc, [
      {
        id: "default-1",
        name: "Default",
        color: "#aabbcc",
        visible: true,
        highlights: [],
        arrows: [],
        underlines: [],
      },
    ]);

    const layers = readLayers(doc);
    expect(layers).toHaveLength(1);
    expect(layers[0].id).toBe("existing");
  });

  it("seeds layers with highlights, arrows, and underlines", () => {
    const doc = createDoc();
    seedDefaultLayers(doc, [
      {
        id: "L1",
        name: "Seeded",
        color: "#112233",
        visible: true,
        highlights: [
          { id: "sh1", editorIndex: 0, from: 0, to: 2, text: "hi", annotation: "", type: "highlight", visible: true },
        ],
        arrows: [
          {
            id: "sa1",
            from: { editorIndex: 0, from: 0, to: 1, text: "a" },
            to: { editorIndex: 0, from: 3, to: 4, text: "b" },
            arrowStyle: "dashed",
            visible: true,
          },
        ],
        underlines: [
          { id: "su1", editorIndex: 0, from: 0, to: 3, text: "und", visible: true },
        ],
      },
    ]);

    const layers = readLayers(doc);
    expect(layers[0].highlights).toHaveLength(1);
    expect(layers[0].highlights[0].id).toBe("sh1");
    expect(layers[0].arrows).toHaveLength(1);
    expect(layers[0].arrows[0].id).toBe("sa1");
    expect(layers[0].arrows[0].arrowStyle).toBe("dashed");
    expect(layers[0].underlines).toHaveLength(1);
    expect(layers[0].underlines[0].id).toBe("su1");
  });
});

// ---------------------------------------------------------------------------
// setAnnotationVisibilityInDoc
// ---------------------------------------------------------------------------

describe("setAnnotationVisibilityInDoc", () => {
  it("sets visibility for highlights", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addTestHighlight(doc);

    setAnnotationVisibilityInDoc(doc, "layer-1", "highlights", "h1", false);
    expect(readLayers(doc)[0].highlights[0].visible).toBe(false);

    setAnnotationVisibilityInDoc(doc, "layer-1", "highlights", "h1", true);
    expect(readLayers(doc)[0].highlights[0].visible).toBe(true);
  });

  it("sets visibility for arrows", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addArrowToDoc(
      doc,
      "layer-1",
      {
        from: { editorIndex: 0, from: 0, to: 3, text: "foo" },
        to: { editorIndex: 0, from: 10, to: 13, text: "bar" },
      },
      "a1",
    );

    setAnnotationVisibilityInDoc(doc, "layer-1", "arrows", "a1", false);
    expect(readLayers(doc)[0].arrows[0].visible).toBe(false);
  });

  it("sets visibility for underlines", () => {
    const doc = createDoc();
    addTestLayer(doc);
    addUnderlineToDoc(doc, "layer-1", { editorIndex: 0, from: 0, to: 5, text: "hello" }, "u1");

    setAnnotationVisibilityInDoc(doc, "layer-1", "underlines", "u1", false);
    expect(readLayers(doc)[0].underlines[0].visible).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Position encoding (fallback path - no EditorView)
// ---------------------------------------------------------------------------

describe("position encoding (fallback path)", () => {
  it("encodeRelativePosition without EditorView produces a Uint8Array", () => {
    const doc = createDoc();
    const encoded = encodeRelativePosition(doc, 0, 5);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBeGreaterThan(0);
  });

  it("decodeRelativePosition without EditorView resolves back to a number", () => {
    const doc = createDoc();
    const encoded = encodeRelativePosition(doc, 0, 5);
    const decoded = decodeRelativePosition(doc, encoded, 0);
    expect(typeof decoded).toBe("number");
  });

  it("round-trip: encode then decode returns original position for position 0", () => {
    const doc = createDoc();
    // The fallback path uses createRelativePositionFromTypeIndex on an XmlFragment.
    // Without actual XmlText children, only position 0 round-trips reliably.
    const encoded = encodeRelativePosition(doc, 0, 0);
    const decoded = decodeRelativePosition(doc, encoded, 0);
    expect(decoded).toBe(0);
  });

  it("round-trip works with XmlText content in the fragment", () => {
    const doc = createDoc();
    const fragment = doc.getXmlFragment("editor-0");
    // Yjs XmlText positions are indexed within the text content.
    // Insert text so positions within the text length resolve correctly.
    const text = new Y.XmlText("some sample text here");
    fragment.insert(0, [text]);

    // Position 0 always works (before the XmlText element)
    const enc0 = encodeRelativePosition(doc, 0, 0);
    const dec0 = decodeRelativePosition(doc, enc0, 0);
    expect(dec0).toBe(0);

    // Position 1 (the XmlText element itself) should round-trip
    const enc1 = encodeRelativePosition(doc, 0, 1);
    const dec1 = decodeRelativePosition(doc, enc1, 0);
    expect(dec1).toBe(1);
  });
});
