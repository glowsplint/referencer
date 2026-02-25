import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSelectionHighlight } from "./use-selection-highlight";

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
  const dispatched: any[] = [];
  const mockDoc = {};
  return {
    isDestroyed: false,
    state: {
      doc: mockDoc,
      tr: {
        setMeta: vi.fn().mockReturnThis(),
      },
    },
    view: {
      dispatch: vi.fn((tr: any) => dispatched.push(tr)),
    },
    _dispatched: dispatched,
  } as any;
}

describe("useSelectionHighlight", () => {
  it("clears decorations when editor exists but no selection", () => {
    const editor = createMockEditor();

    renderHook(() =>
      useSelectionHighlight(editor, null, 0, true, "#ff0000", false),
    );

    expect(editor.view.dispatch).toHaveBeenCalled();
    expect(editor.state.tr.setMeta).toHaveBeenCalled();
  });

  it("clears decorations when not locked", () => {
    const editor = createMockEditor();
    const selection = { from: 0, to: 5, editorIndex: 0 };

    renderHook(() =>
      useSelectionHighlight(editor, selection, 0, false, "#ff0000", false),
    );

    expect(editor.view.dispatch).toHaveBeenCalled();
  });

  it("clears decorations when selection is for a different editor", () => {
    const editor = createMockEditor();
    const selection = { from: 0, to: 5, editorIndex: 1 };

    renderHook(() =>
      useSelectionHighlight(editor, selection, 0, true, "#ff0000", false),
    );

    expect(editor.view.dispatch).toHaveBeenCalled();
  });

  it("does nothing when editor is null", () => {
    renderHook(() =>
      useSelectionHighlight(null, null, 0, false, null, false),
    );
    // No error thrown
  });

  it("does nothing when editor is destroyed", () => {
    const editor = { isDestroyed: true } as any;

    renderHook(() =>
      useSelectionHighlight(editor, null, 0, false, null, false),
    );
    // No error thrown - dispatch not called on destroyed editor
  });
});
