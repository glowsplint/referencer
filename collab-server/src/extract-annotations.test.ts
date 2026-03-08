import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import { extractAnnotations } from "./extract-annotations";

/** Helper: create a Y.Doc with layers structure */
function createDocWithLayers(setup: (doc: Y.Doc, layers: Y.Array<Y.Map<unknown>>) => void): Y.Doc {
  const doc = new Y.Doc();
  const layers = doc.getArray<Y.Map<unknown>>("layers");
  setup(doc, layers);
  return doc;
}

/** Helper: create a layer Y.Map with given fields */
function createLayer(
  doc: Y.Doc,
  id: string,
  name: string,
  opts?: {
    highlights?: Array<Record<string, unknown>>;
    arrows?: Array<Record<string, unknown>>;
    underlines?: Array<Record<string, unknown>>;
  },
): Y.Map<unknown> {
  const layer = new Y.Map<unknown>();
  layer.set("id", id);
  layer.set("name", name);
  layer.set("color", "#ff0000");
  layer.set("visible", true);

  if (opts?.highlights) {
    const highlightsArr = new Y.Array<Y.Map<unknown>>();
    for (const h of opts.highlights) {
      const hMap = new Y.Map<unknown>();
      for (const [k, v] of Object.entries(h)) {
        if (k === "replies" && Array.isArray(v)) {
          const repliesArr = new Y.Array<Y.Map<unknown>>();
          for (const r of v) {
            const rMap = new Y.Map<unknown>();
            for (const [rk, rv] of Object.entries(r as Record<string, unknown>)) {
              rMap.set(rk, rv);
            }
            repliesArr.push([rMap]);
          }
          hMap.set(k, repliesArr);
        } else {
          hMap.set(k, v);
        }
      }
      highlightsArr.push([hMap]);
    }
    layer.set("highlights", highlightsArr);
  }

  if (opts?.arrows) {
    const arrowsArr = new Y.Array<Y.Map<unknown>>();
    for (const a of opts.arrows) {
      const aMap = new Y.Map<unknown>();
      for (const [k, v] of Object.entries(a)) {
        aMap.set(k, v);
      }
      arrowsArr.push([aMap]);
    }
    layer.set("arrows", arrowsArr);
  }

  if (opts?.underlines) {
    const underlinesArr = new Y.Array<Y.Map<unknown>>();
    for (const u of opts.underlines) {
      const uMap = new Y.Map<unknown>();
      for (const [k, v] of Object.entries(u)) {
        uMap.set(k, v);
      }
      underlinesArr.push([uMap]);
    }
    layer.set("underlines", underlinesArr);
  }

  return layer;
}

describe("extractAnnotations", () => {
  it("returns empty array for doc with no layers", () => {
    const doc = new Y.Doc();
    // getArray("layers") returns an empty array
    const rows = extractAnnotations(doc);
    expect(rows).toEqual([]);
    doc.destroy();
  });

  it("extracts highlight with correct field mapping", () => {
    const doc = createDocWithLayers((_doc, layers) => {
      const layer = createLayer(_doc, "layer-1", "My Layer", {
        highlights: [
          {
            id: "h-1",
            text: "selected text",
            annotation: "my annotation",
            type: "highlight",
            userName: "Alice",
          },
        ],
      });
      layers.push([layer]);
    });

    const rows = extractAnnotations(doc);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id: "h-1",
      layer_id: "layer-1",
      layer_name: "My Layer",
      annotation_type: "highlight",
      selected_text: "selected text",
      annotation_text: "my annotation",
      reply_texts: "",
      user_name: "Alice",
    });
    doc.destroy();
  });

  it("extracts highlight with replies joined by newline", () => {
    const doc = createDocWithLayers((_doc, layers) => {
      const layer = createLayer(_doc, "layer-1", "Layer", {
        highlights: [
          {
            id: "h-2",
            text: "some text",
            annotation: "note",
            type: "highlight",
            userName: "Bob",
            replies: [{ text: "reply one" }, { text: "reply two" }, { text: "reply three" }],
          },
        ],
      });
      layers.push([layer]);
    });

    const rows = extractAnnotations(doc);
    expect(rows).toHaveLength(1);
    expect(rows[0].reply_texts).toBe("reply one\nreply two\nreply three");
    doc.destroy();
  });

  it("sets annotation_type to comment when type is comment", () => {
    const doc = createDocWithLayers((_doc, layers) => {
      const layer = createLayer(_doc, "layer-1", "Layer", {
        highlights: [
          {
            id: "c-1",
            text: "commented text",
            annotation: "a comment",
            type: "comment",
            userName: "Carol",
          },
        ],
      });
      layers.push([layer]);
    });

    const rows = extractAnnotations(doc);
    expect(rows).toHaveLength(1);
    expect(rows[0].annotation_type).toBe("comment");
    doc.destroy();
  });

  it("extracts arrow with fromText -> toText concatenation", () => {
    const doc = createDocWithLayers((_doc, layers) => {
      const layer = createLayer(_doc, "layer-1", "Layer", {
        arrows: [{ id: "a-1", fromText: "source", toText: "target" }],
      });
      layers.push([layer]);
    });

    const rows = extractAnnotations(doc);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id: "a-1",
      layer_id: "layer-1",
      layer_name: "Layer",
      annotation_type: "arrow",
      selected_text: "source -> target",
      annotation_text: "",
      reply_texts: "",
      user_name: "",
    });
    doc.destroy();
  });

  it("extracts underline text", () => {
    const doc = createDocWithLayers((_doc, layers) => {
      const layer = createLayer(_doc, "layer-1", "Layer", {
        underlines: [{ id: "u-1", text: "underlined passage" }],
      });
      layers.push([layer]);
    });

    const rows = extractAnnotations(doc);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id: "u-1",
      layer_id: "layer-1",
      layer_name: "Layer",
      annotation_type: "underline",
      selected_text: "underlined passage",
      annotation_text: "",
      reply_texts: "",
      user_name: "",
    });
    doc.destroy();
  });

  it("extracts mixed annotations across multiple layers", () => {
    const doc = createDocWithLayers((_doc, layers) => {
      const layer1 = createLayer(_doc, "l-1", "Layer A", {
        highlights: [
          {
            id: "h-1",
            text: "highlight text",
            annotation: "note",
            type: "highlight",
            userName: "Alice",
          },
        ],
        arrows: [{ id: "a-1", fromText: "from", toText: "to" }],
      });
      const layer2 = createLayer(_doc, "l-2", "Layer B", {
        underlines: [{ id: "u-1", text: "underlined" }],
        highlights: [
          {
            id: "c-1",
            text: "comment text",
            annotation: "comment note",
            type: "comment",
            userName: "Bob",
          },
        ],
      });
      layers.push([layer1, layer2]);
    });

    const rows = extractAnnotations(doc);
    expect(rows).toHaveLength(4);

    const types = rows.map((r) => r.annotation_type);
    expect(types).toContain("highlight");
    expect(types).toContain("arrow");
    expect(types).toContain("underline");
    expect(types).toContain("comment");

    const layerIds = rows.map((r) => r.layer_id);
    expect(layerIds).toContain("l-1");
    expect(layerIds).toContain("l-2");
    doc.destroy();
  });

  it("handles missing/null Y.Map keys gracefully", () => {
    const doc = createDocWithLayers((_doc, layers) => {
      const layer = createLayer(_doc, "layer-1", "Layer", {
        highlights: [
          {
            id: "h-missing",
            // text, annotation, type, userName all missing
          },
        ],
      });
      layers.push([layer]);
    });

    // The highlight has no text fields, so it should be skipped
    const rows = extractAnnotations(doc);
    expect(rows).toHaveLength(0);
    doc.destroy();
  });

  it("skips entries where all text fields are empty after stripping", () => {
    const doc = createDocWithLayers((_doc, layers) => {
      const layer = createLayer(_doc, "layer-1", "Layer", {
        highlights: [
          {
            id: "h-empty",
            text: "<p></p>",
            annotation: "<br/>",
            type: "highlight",
            userName: "Alice",
          },
        ],
        arrows: [{ id: "a-empty", fromText: "", toText: "" }],
        underlines: [{ id: "u-empty", text: "<span></span>" }],
      });
      layers.push([layer]);
    });

    const rows = extractAnnotations(doc);
    expect(rows).toHaveLength(0);
    doc.destroy();
  });
});
