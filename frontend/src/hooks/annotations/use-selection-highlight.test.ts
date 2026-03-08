import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSelectionHighlight } from "./use-selection-highlight";
import { asEditor, createMockEditor as createBaseMockEditor } from "@/test/mocks";

// Mock the plugin key and DecorationSet
vi.mock("@/lib/tiptap/extensions/word-selection", () => ({
  wordSelectionPluginKey: { key: "wordSelection$" },
}));

vi.mock("@/lib/color", () => ({
  blendWithBackground: vi.fn(
    (color: string, _opacity: number, _isDark: boolean) => `blended-${color}`,
  ),
}));

vi.mock("@/constants/colors", () => ({
  DEFAULT_LAYER_COLOR: "#4488ff",
}));

function createMockEditor() {
  const mock = createBaseMockEditor();
  return asEditor(mock);
}

describe("useSelectionHighlight", () => {
  it("when editor exists but there is no selection, then clears decorations", () => {
    const editor = createMockEditor();

    renderHook(() => useSelectionHighlight(editor, null, 0, true, "#ff0000", false));

    expect(editor.view.dispatch).toHaveBeenCalled();
    expect(editor.state.tr.setMeta).toHaveBeenCalled();
  });

  it("when selection is not locked, then clears decorations", () => {
    const editor = createMockEditor();
    const selection = { from: 0, to: 5, editorIndex: 0 };

    renderHook(() => useSelectionHighlight(editor, selection, 0, false, "#ff0000", false));

    expect(editor.view.dispatch).toHaveBeenCalled();
  });

  it("when selection is for a different editor, then clears decorations", () => {
    const editor = createMockEditor();
    const selection = { from: 0, to: 5, editorIndex: 1 };

    renderHook(() => useSelectionHighlight(editor, selection, 0, true, "#ff0000", false));

    expect(editor.view.dispatch).toHaveBeenCalled();
  });

  it("when editor is null, then does nothing", () => {
    renderHook(() => useSelectionHighlight(null, null, 0, false, null, false));
    // No error thrown
  });

  it("when editor is destroyed, then does nothing", () => {
    const editor = asEditor(createBaseMockEditor({ isDestroyed: true }));

    renderHook(() => useSelectionHighlight(editor, null, 0, false, null, false));
    // No error thrown - dispatch not called on destroyed editor
  });
});
