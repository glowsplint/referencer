import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import {
  addLayerToDoc,
  addHighlightToDoc,
  addArrowToDoc,
  addUnderlineToDoc,
  readLayers,
  toggleHighlightVisibilityInDoc,
  toggleArrowVisibilityInDoc,
  toggleUnderlineVisibilityInDoc,
  setAnnotationVisibilityInDoc,
  getLayersArray,
} from "../annotations";

function setupLayerWithAnnotations(doc: Y.Doc) {
  addLayerToDoc(doc, { id: "layer-1", name: "Layer 1", color: "#ff0000" });
  addHighlightToDoc(
    doc,
    "layer-1",
    { editorIndex: 0, from: 0, to: 5, text: "hello", annotation: "test", type: "highlight" },
    "h1",
  );
  addArrowToDoc(
    doc,
    "layer-1",
    {
      from: { editorIndex: 0, from: 0, to: 3, text: "foo" },
      to: { editorIndex: 0, from: 10, to: 13, text: "bar" },
    },
    "a1",
  );
  addUnderlineToDoc(doc, "layer-1", { editorIndex: 0, from: 0, to: 5, text: "hello" }, "u1");
}

describe("when using annotation visibility", () => {
  describe("when using highlights", () => {
    it("then new highlights default to visible: true", () => {
      const doc = new Y.Doc();
      addLayerToDoc(doc, { id: "layer-1", name: "Layer 1", color: "#ff0000" });
      addHighlightToDoc(
        doc,
        "layer-1",
        { editorIndex: 0, from: 0, to: 5, text: "hello", annotation: "", type: "highlight" },
        "h1",
      );

      const layers = readLayers(doc);
      expect(layers[0].highlights[0].visible).toBe(true);
    });

    it("then toggleHighlightVisibilityInDoc toggles visibility", () => {
      const doc = new Y.Doc();
      setupLayerWithAnnotations(doc);

      // Initially true
      let layers = readLayers(doc);
      expect(layers[0].highlights[0].visible).toBe(true);

      // Toggle to false
      toggleHighlightVisibilityInDoc(doc, "layer-1", "h1");
      layers = readLayers(doc);
      expect(layers[0].highlights[0].visible).toBe(false);

      // Toggle back to true
      toggleHighlightVisibilityInDoc(doc, "layer-1", "h1");
      layers = readLayers(doc);
      expect(layers[0].highlights[0].visible).toBe(true);
    });
  });

  describe("when using arrows", () => {
    it("then new arrows default to visible: true", () => {
      const doc = new Y.Doc();
      addLayerToDoc(doc, { id: "layer-1", name: "Layer 1", color: "#ff0000" });
      addArrowToDoc(
        doc,
        "layer-1",
        {
          from: { editorIndex: 0, from: 0, to: 3, text: "foo" },
          to: { editorIndex: 0, from: 10, to: 13, text: "bar" },
        },
        "a1",
      );

      const layers = readLayers(doc);
      expect(layers[0].arrows[0].visible).toBe(true);
    });

    it("then toggleArrowVisibilityInDoc toggles visibility", () => {
      const doc = new Y.Doc();
      setupLayerWithAnnotations(doc);

      let layers = readLayers(doc);
      expect(layers[0].arrows[0].visible).toBe(true);

      toggleArrowVisibilityInDoc(doc, "layer-1", "a1");
      layers = readLayers(doc);
      expect(layers[0].arrows[0].visible).toBe(false);

      toggleArrowVisibilityInDoc(doc, "layer-1", "a1");
      layers = readLayers(doc);
      expect(layers[0].arrows[0].visible).toBe(true);
    });
  });

  describe("when using underlines", () => {
    it("then new underlines default to visible: true", () => {
      const doc = new Y.Doc();
      addLayerToDoc(doc, { id: "layer-1", name: "Layer 1", color: "#ff0000" });
      addUnderlineToDoc(doc, "layer-1", { editorIndex: 0, from: 0, to: 5, text: "hello" }, "u1");

      const layers = readLayers(doc);
      expect(layers[0].underlines[0].visible).toBe(true);
    });

    it("then toggleUnderlineVisibilityInDoc toggles visibility", () => {
      const doc = new Y.Doc();
      setupLayerWithAnnotations(doc);

      let layers = readLayers(doc);
      expect(layers[0].underlines[0].visible).toBe(true);

      toggleUnderlineVisibilityInDoc(doc, "layer-1", "u1");
      layers = readLayers(doc);
      expect(layers[0].underlines[0].visible).toBe(false);

      toggleUnderlineVisibilityInDoc(doc, "layer-1", "u1");
      layers = readLayers(doc);
      expect(layers[0].underlines[0].visible).toBe(true);
    });
  });

  describe("when using setAnnotationVisibilityInDoc", () => {
    it("then sets highlight visibility to a specific value", () => {
      const doc = new Y.Doc();
      setupLayerWithAnnotations(doc);

      setAnnotationVisibilityInDoc(doc, "layer-1", "highlights", "h1", false);
      let layers = readLayers(doc);
      expect(layers[0].highlights[0].visible).toBe(false);

      setAnnotationVisibilityInDoc(doc, "layer-1", "highlights", "h1", true);
      layers = readLayers(doc);
      expect(layers[0].highlights[0].visible).toBe(true);
    });

    it("then sets arrow visibility to a specific value", () => {
      const doc = new Y.Doc();
      setupLayerWithAnnotations(doc);

      setAnnotationVisibilityInDoc(doc, "layer-1", "arrows", "a1", false);
      const layers = readLayers(doc);
      expect(layers[0].arrows[0].visible).toBe(false);
    });

    it("then sets underline visibility to a specific value", () => {
      const doc = new Y.Doc();
      setupLayerWithAnnotations(doc);

      setAnnotationVisibilityInDoc(doc, "layer-1", "underlines", "u1", false);
      const layers = readLayers(doc);
      expect(layers[0].underlines[0].visible).toBe(false);
    });
  });

  describe("when using backward compatibility", () => {
    it("then reading highlights without visible field defaults to true", () => {
      const doc = new Y.Doc();
      addLayerToDoc(doc, { id: "layer-1", name: "Layer 1", color: "#ff0000" });

      // Manually add a highlight Y.Map without the visible field to simulate old data
      const yLayers = getLayersArray(doc);
      const yLayer = yLayers.get(0);
      const yHighlights = yLayer.get("highlights") as Y.Array<Y.Map<unknown>>;

      const fragment = doc.getXmlFragment("editor-0");
      const relPos = Y.createRelativePositionFromTypeIndex(fragment, 0);
      const encodedPos = Y.encodeRelativePosition(relPos);

      const yH = new Y.Map<unknown>();
      yH.set("id", "h-legacy");
      yH.set("editorIndex", 0);
      yH.set("fromRel", encodedPos);
      yH.set("toRel", encodedPos);
      yH.set("text", "legacy");
      yH.set("annotation", "");
      yH.set("type", "highlight");
      // Deliberately NOT setting "visible"
      yHighlights.push([yH]);

      const layers = readLayers(doc);
      const highlight = layers[0].highlights.find((h) => h.id === "h-legacy");
      expect(highlight).toBeDefined();
      expect(highlight!.visible).toBe(true);
    });

    it("then reading arrows without visible field defaults to true", () => {
      const doc = new Y.Doc();
      addLayerToDoc(doc, { id: "layer-1", name: "Layer 1", color: "#ff0000" });

      const yLayers = getLayersArray(doc);
      const yLayer = yLayers.get(0);
      const yArrows = yLayer.get("arrows") as Y.Array<Y.Map<unknown>>;

      const fragment0 = doc.getXmlFragment("editor-0");
      const relPos = Y.createRelativePositionFromTypeIndex(fragment0, 0);
      const encodedPos = Y.encodeRelativePosition(relPos);

      const yA = new Y.Map<unknown>();
      yA.set("id", "a-legacy");
      yA.set("fromEditorIndex", 0);
      yA.set("fromRel", encodedPos);
      yA.set("fromToRel", encodedPos);
      yA.set("fromText", "foo");
      yA.set("toEditorIndex", 0);
      yA.set("toRel", encodedPos);
      yA.set("toToRel", encodedPos);
      yA.set("toText", "bar");
      yA.set("arrowStyle", "solid");
      // Deliberately NOT setting "visible"
      yArrows.push([yA]);

      const layers = readLayers(doc);
      const arrow = layers[0].arrows.find((a) => a.id === "a-legacy");
      expect(arrow).toBeDefined();
      expect(arrow!.visible).toBe(true);
    });

    it("then reading underlines without visible field defaults to true", () => {
      const doc = new Y.Doc();
      addLayerToDoc(doc, { id: "layer-1", name: "Layer 1", color: "#ff0000" });

      const yLayers = getLayersArray(doc);
      const yLayer = yLayers.get(0);
      const yUnderlines = yLayer.get("underlines") as Y.Array<Y.Map<unknown>>;

      const fragment = doc.getXmlFragment("editor-0");
      const relPos = Y.createRelativePositionFromTypeIndex(fragment, 0);
      const encodedPos = Y.encodeRelativePosition(relPos);

      const yU = new Y.Map<unknown>();
      yU.set("id", "u-legacy");
      yU.set("editorIndex", 0);
      yU.set("fromRel", encodedPos);
      yU.set("toRel", encodedPos);
      yU.set("text", "legacy");
      // Deliberately NOT setting "visible"
      yUnderlines.push([yU]);

      const layers = readLayers(doc);
      const underline = layers[0].underlines.find((u) => u.id === "u-legacy");
      expect(underline).toBeDefined();
      expect(underline!.visible).toBe(true);
    });
  });
});
