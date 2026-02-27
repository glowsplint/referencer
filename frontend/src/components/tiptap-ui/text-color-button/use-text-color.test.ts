import { describe, it, expect, vi } from "vitest";
import type { Editor } from "@tiptap/react";
import {
  TEXT_COLORS,
  pickTextColorsByValue,
  canSetTextColor,
  getActiveTextColor,
  isTextColorActive,
} from "./use-text-color";

vi.mock("@/lib/tiptap-utils", () => ({
  isMarkInSchema: (type: string, editor: { _schemaMarks?: string[] }) => {
    return editor._schemaMarks?.includes(type) ?? true;
  },
  isNodeTypeSelected: (editor: { _selectedNode?: string }, types: string[]) => {
    return types.includes(editor._selectedNode ?? "");
  },
}));

function createMockEditor(overrides: Record<string, unknown> = {}): Editor {
  return {
    isEditable: true,
    _schemaMarks: ["textStyle"],
    _selectedNode: "",
    can: () => ({
      setMark: () => true,
    }),
    getAttributes: () => ({}),
    ...overrides,
  } as unknown as Editor;
}

describe("TEXT_COLORS", () => {
  it("contains the Default entry with an empty value", () => {
    const defaultColor = TEXT_COLORS.find((c) => c.label === "Default");
    expect(defaultColor).toBeDefined();
    expect(defaultColor!.value).toBe("");
  });

  it("contains 10 color entries", () => {
    expect(TEXT_COLORS).toHaveLength(10);
  });
});

describe("pickTextColorsByValue", () => {
  it("when given known values, then returns matching TextColor objects", () => {
    const result = pickTextColorsByValue(["#6b7280", "#dc2626"]);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Gray");
    expect(result[1].label).toBe("Red");
  });

  it("when given an unknown value, then filters it out", () => {
    const result = pickTextColorsByValue(["#6b7280", "#000000"]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Gray");
  });

  it("when given an empty array, then returns empty array", () => {
    expect(pickTextColorsByValue([])).toEqual([]);
  });

  it("when given the empty-string value, then returns the Default entry", () => {
    const result = pickTextColorsByValue([""]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Default");
  });
});

describe("canSetTextColor", () => {
  it("when editor is null, then returns false", () => {
    expect(canSetTextColor(null)).toBe(false);
  });

  it("when editor is not editable, then returns false", () => {
    const editor = createMockEditor({ isEditable: false });
    expect(canSetTextColor(editor)).toBe(false);
  });

  it("when textStyle mark is not in schema, then returns false", () => {
    const editor = createMockEditor({ _schemaMarks: ["bold"] });
    expect(canSetTextColor(editor)).toBe(false);
  });

  it("when image node is selected, then returns false", () => {
    const editor = createMockEditor({ _selectedNode: "image" });
    expect(canSetTextColor(editor)).toBe(false);
  });

  it("when textStyle is available, then delegates to editor.can().setMark()", () => {
    const setMarkFn = vi.fn().mockReturnValue(true);
    const editor = createMockEditor({ can: () => ({ setMark: setMarkFn }) });
    expect(canSetTextColor(editor)).toBe(true);
    expect(setMarkFn).toHaveBeenCalledWith("textStyle");
  });

  it("when editor.can().setMark() returns false, then returns false", () => {
    const editor = createMockEditor({
      can: () => ({ setMark: () => false }),
    });
    expect(canSetTextColor(editor)).toBe(false);
  });
});

describe("getActiveTextColor", () => {
  it("when editor is null, then returns empty string", () => {
    expect(getActiveTextColor(null)).toBe("");
  });

  it("when no color attribute is set, then returns empty string", () => {
    const editor = createMockEditor({ getAttributes: () => ({}) });
    expect(getActiveTextColor(editor)).toBe("");
  });

  it("when a color attribute is set, then returns that color", () => {
    const editor = createMockEditor({
      getAttributes: (mark: string) => {
        if (mark === "textStyle") return { color: "#dc2626" };
        return {};
      },
    });
    expect(getActiveTextColor(editor)).toBe("#dc2626");
  });
});

describe("isTextColorActive", () => {
  it("when editor is null, then returns false", () => {
    expect(isTextColorActive(null)).toBe(false);
  });

  it("when editor is not editable, then returns false", () => {
    const editor = createMockEditor({ isEditable: false });
    expect(isTextColorActive(editor)).toBe(false);
  });

  it("when no specific color is provided and there is an active color, then returns true", () => {
    const editor = createMockEditor({
      getAttributes: () => ({ color: "#dc2626" }),
    });
    expect(isTextColorActive(editor)).toBe(true);
  });

  it("when no specific color is provided and there is no active color, then returns false", () => {
    const editor = createMockEditor({
      getAttributes: () => ({}),
    });
    expect(isTextColorActive(editor)).toBe(false);
  });

  it("when a specific color matches the active color, then returns true", () => {
    const editor = createMockEditor({
      getAttributes: () => ({ color: "#dc2626" }),
    });
    expect(isTextColorActive(editor, "#dc2626")).toBe(true);
  });

  it("when a specific color does not match the active color, then returns false", () => {
    const editor = createMockEditor({
      getAttributes: () => ({ color: "#dc2626" }),
    });
    expect(isTextColorActive(editor, "#2563eb")).toBe(false);
  });
});
