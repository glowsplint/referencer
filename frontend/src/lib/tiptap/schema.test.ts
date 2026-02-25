import { describe, it, expect } from "vitest";
import { isMarkInSchema, isNodeInSchema, isExtensionAvailable } from "./schema";
import type { Editor } from "@tiptap/react";

// Minimal mock editor with schema
function createMockEditor(marks: string[], nodes: string[], extensions: string[] = []): Editor {
  const marksMap = new Map(marks.map((m) => [m, {}]));
  const nodesMap = new Map(nodes.map((n) => [n, {}]));
  return {
    schema: {
      spec: {
        marks: { get: (name: string) => marksMap.get(name) },
        nodes: { get: (name: string) => nodesMap.get(name) },
      },
    },
    extensionManager: {
      extensions: extensions.map((name) => ({ name })),
    },
  } as unknown as Editor;
}

describe("isMarkInSchema", () => {
  describe("when editor is null", () => {
    it("returns false", () => {
      expect(isMarkInSchema("bold", null)).toBe(false);
    });
  });

  describe("when mark exists in schema", () => {
    it("returns true", () => {
      const editor = createMockEditor(["bold", "italic"], []);
      expect(isMarkInSchema("bold", editor)).toBe(true);
    });
  });

  describe("when mark does not exist in schema", () => {
    it("returns false", () => {
      const editor = createMockEditor(["bold"], []);
      expect(isMarkInSchema("underline", editor)).toBe(false);
    });
  });
});

describe("isNodeInSchema", () => {
  describe("when editor is null", () => {
    it("returns false", () => {
      expect(isNodeInSchema("paragraph", null)).toBe(false);
    });
  });

  describe("when node exists in schema", () => {
    it("returns true", () => {
      const editor = createMockEditor([], ["paragraph", "heading"]);
      expect(isNodeInSchema("paragraph", editor)).toBe(true);
    });
  });

  describe("when node does not exist in schema", () => {
    it("returns false", () => {
      const editor = createMockEditor([], ["paragraph"]);
      expect(isNodeInSchema("table", editor)).toBe(false);
    });
  });
});

describe("isExtensionAvailable", () => {
  describe("when editor is null", () => {
    it("returns false", () => {
      expect(isExtensionAvailable(null, "bold")).toBe(false);
    });
  });

  describe("when given a single extension name that exists", () => {
    it("returns true", () => {
      const editor = createMockEditor([], [], ["bold", "italic"]);
      expect(isExtensionAvailable(editor, "bold")).toBe(true);
    });
  });

  describe("when given a single extension name that does not exist", () => {
    it("returns false", () => {
      const editor = createMockEditor([], [], ["bold"]);
      expect(isExtensionAvailable(editor, "table")).toBe(false);
    });
  });

  describe("when given an array with at least one matching extension", () => {
    it("returns true", () => {
      const editor = createMockEditor([], [], ["bold"]);
      expect(isExtensionAvailable(editor, ["table", "bold"])).toBe(true);
    });
  });

  describe("when given an array with no matching extensions", () => {
    it("returns false", () => {
      const editor = createMockEditor([], [], ["bold"]);
      expect(isExtensionAvailable(editor, ["table", "image"])).toBe(false);
    });
  });
});
