import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEditors } from "./use-editors";
import { STORAGE_KEYS } from "@/constants/storage-keys";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useEditors", () => {
  it("when initialized, then returns 1 editor at 100% width", () => {
    const { result } = renderHook(() => useEditors());
    expect(result.current.editorCount).toBe(1);
    expect(result.current.editorWidths[0]).toBeCloseTo(100, 0);
    expect(result.current.activeEditor).toBeNull();
  });

  it("when addEditor is called, then increments editor count up to 4", () => {
    const { result } = renderHook(() => useEditors());

    // starts at 1
    expect(result.current.editorCount).toBe(1);

    act(() => {
      result.current.addEditor();
    });
    expect(result.current.editorCount).toBe(2);

    act(() => {
      result.current.addEditor();
    });
    expect(result.current.editorCount).toBe(3);

    act(() => {
      result.current.addEditor();
    });
    expect(result.current.editorCount).toBe(4);

    act(() => {
      result.current.addEditor();
    });
    expect(result.current.editorCount).toBe(4);
  });

  it("when 3 editors exist, then editorWidths are evenly distributed", () => {
    const { result } = renderHook(() => useEditors());

    act(() => {
      result.current.addEditor();
      result.current.addEditor();
    });
    expect(result.current.editorWidths[0]).toBeCloseTo(33.3, 0);
    expect(result.current.editorWidths[1]).toBeCloseTo(33.3, 0);
    expect(result.current.editorWidths[2]).toBeCloseTo(33.3, 0);
  });

  it("when removeEditor is called, then decrements editor count and redistributes widths", () => {
    const { result } = renderHook(() => useEditors());

    act(() => {
      result.current.addEditor();
      result.current.addEditor();
    });
    expect(result.current.editorCount).toBe(3);

    act(() => {
      result.current.removeEditor(1);
    });
    expect(result.current.editorCount).toBe(2);
    expect(result.current.editorWidths[0]).toBeCloseTo(50, 0);
    expect(result.current.editorWidths[1]).toBeCloseTo(50, 0);
  });

  it("when removeEditor is called with only 1 editor, then does not go below 1", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.removeEditor(0);
    });
    expect(result.current.editorCount).toBe(1);
    act(() => {
      result.current.removeEditor(0);
    });
    expect(result.current.editorCount).toBe(1);
  });

  it("when removeEditor is called, then sets activeEditor to first remaining editor", () => {
    const { result } = renderHook(() => useEditors());
    const editor0 = { id: "e0" } as any;
    const editor1 = { id: "e1" } as any;
    const editor2 = { id: "e2" } as any;

    act(() => {
      result.current.addEditor();
      result.current.addEditor();
      result.current.handleEditorMount(0, editor0);
      result.current.handleEditorMount(1, editor1);
      result.current.handleEditorMount(2, editor2);
    });

    act(() => {
      result.current.removeEditor(1);
    });
    expect(result.current.activeEditor).toBe(editor0);
  });

  it("when handleDividerResize is called with 2 editors, then clamps within bounds", () => {
    const { result } = renderHook(() => useEditors());

    act(() => {
      result.current.addEditor();
    });

    act(() => {
      result.current.handleDividerResize(0, 70);
    });
    expect(result.current.editorWidths[0]).toBeCloseTo(70, 0);
    expect(result.current.editorWidths[1]).toBeCloseTo(30, 0);

    // Clamp at max (90%)
    act(() => {
      result.current.handleDividerResize(0, 95);
    });
    expect(result.current.editorWidths[0]).toBe(90);

    // Clamp at min (10%)
    act(() => {
      result.current.handleDividerResize(0, 5);
    });
    expect(result.current.editorWidths[0]).toBe(10);
  });

  it("when handleDividerResize is called with 3 editors, then clamps between adjacent dividers", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
      result.current.addEditor();
    });

    // Move first divider to 20%
    act(() => {
      result.current.handleDividerResize(0, 20);
    });
    // Move second divider to 80%
    act(() => {
      result.current.handleDividerResize(1, 80);
    });

    expect(result.current.editorWidths[0]).toBeCloseTo(20, 0);
    expect(result.current.editorWidths[1]).toBeCloseTo(60, 0);
    expect(result.current.editorWidths[2]).toBeCloseTo(20, 0);

    // Try to move first divider past second divider (should clamp to second - 10%)
    act(() => {
      result.current.handleDividerResize(0, 75);
    });
    expect(result.current.editorWidths[0]).toBe(70);

    // Try to move second divider before first divider (should clamp to first + 10%)
    act(() => {
      result.current.handleDividerResize(1, 25);
    });
    // First divider is at 70, so second clamps to 70 + 10 = 80
    expect(result.current.editorWidths[1]).toBe(10);
  });

  it("when handleEditorMount is called for index 0, then sets activeEditor", () => {
    const { result } = renderHook(() => useEditors());
    const editor = { id: "e0" } as any;

    act(() => {
      result.current.handleEditorMount(0, editor);
    });
    expect(result.current.activeEditor).toBe(editor);
  });

  it("when handleEditorMount is called for non-zero index, then does not set activeEditor", () => {
    const { result } = renderHook(() => useEditors());
    const editor = { id: "e1" } as any;

    act(() => {
      result.current.handleEditorMount(1, editor);
    });
    expect(result.current.activeEditor).toBeNull();
  });

  it("when handlePaneFocus is called, then switches activeEditor", () => {
    const { result } = renderHook(() => useEditors());
    const editor0 = { id: "e0" } as any;
    const editor1 = { id: "e1" } as any;

    act(() => {
      result.current.handleEditorMount(0, editor0);
      result.current.handleEditorMount(1, editor1);
    });
    expect(result.current.activeEditor).toBe(editor0);

    act(() => {
      result.current.handlePaneFocus(1);
    });
    expect(result.current.activeEditor).toBe(editor1);
  });

  it("when handlePaneFocus is called with unmounted index, then does nothing", () => {
    const { result } = renderHook(() => useEditors());
    const editor = { id: "e0" } as any;

    act(() => {
      result.current.handleEditorMount(0, editor);
    });
    act(() => {
      result.current.handlePaneFocus(5);
    });
    expect(result.current.activeEditor).toBe(editor);
  });

  it("when initialized, then editorsRef is exposed as a Map", () => {
    const { result } = renderHook(() => useEditors());
    expect(result.current.editorsRef.current).toBeInstanceOf(Map);
  });

  it("when initialized, then sectionVisibility has one visible section", () => {
    const { result } = renderHook(() => useEditors());
    expect(result.current.sectionVisibility).toEqual([true]);
  });

  it("when addEditor is called, then appends true to sectionVisibility", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
    });
    expect(result.current.sectionVisibility).toEqual([true, true]);
  });

  it("when removeEditor is called, then removes the entry from sectionVisibility", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
      result.current.addEditor();
    });
    act(() => {
      result.current.toggleSectionVisibility(1);
    });
    expect(result.current.sectionVisibility).toEqual([true, false, true]);
    act(() => {
      result.current.removeEditor(1);
    });
    expect(result.current.sectionVisibility).toEqual([true, true]);
  });

  it("when toggleAllSectionVisibility is called and any are visible, then hides all sections", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
    });
    act(() => {
      result.current.toggleSectionVisibility(0);
    });
    // One hidden, one visible
    expect(result.current.sectionVisibility).toEqual([false, true]);

    act(() => {
      result.current.toggleAllSectionVisibility();
    });
    expect(result.current.sectionVisibility).toEqual([false, false]);
  });

  it("when toggleAllSectionVisibility is called and none are visible, then shows all sections", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
    });
    act(() => {
      result.current.toggleSectionVisibility(0);
      result.current.toggleSectionVisibility(1);
    });
    expect(result.current.sectionVisibility).toEqual([false, false]);

    act(() => {
      result.current.toggleAllSectionVisibility();
    });
    expect(result.current.sectionVisibility).toEqual([true, true]);
  });

  it("when toggleSectionVisibility is called, then toggles visibility at the given index", () => {
    const { result } = renderHook(() => useEditors());
    expect(result.current.sectionVisibility).toEqual([true]);

    act(() => {
      result.current.toggleSectionVisibility(0);
    });
    expect(result.current.sectionVisibility).toEqual([false]);

    act(() => {
      result.current.toggleSectionVisibility(0);
    });
    expect(result.current.sectionVisibility).toEqual([true]);
  });

  // --- Section names ---

  it("when initialized, then sectionNames starts with Text 1", () => {
    const { result } = renderHook(() => useEditors());
    expect(result.current.sectionNames).toEqual(["Text 1"]);
  });

  it("when addEditor is called, then appends the correct default name", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
    });
    expect(result.current.sectionNames).toEqual(["Text 1", "Text 2"]);
  });

  it("when addEditor is called in quick succession, then assigns unique names", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
      result.current.addEditor();
    });
    expect(result.current.sectionNames).toEqual(["Text 1", "Text 2", "Text 3"]);
  });

  it("when removeEditor is called, then removes the name at that index", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
      result.current.addEditor();
    });
    act(() => {
      result.current.updateSectionName(1, "Custom");
    });
    expect(result.current.sectionNames).toEqual(["Text 1", "Custom", "Text 3"]);
    act(() => {
      result.current.removeEditor(1);
    });
    expect(result.current.sectionNames).toEqual(["Text 1", "Text 3"]);
  });

  it("when deps are unchanged, then editorWidths is referentially stable", () => {
    const { result, rerender } = renderHook(() => useEditors());
    const first = result.current.editorWidths;
    rerender();
    expect(result.current.editorWidths).toBe(first);
  });

  it("when updateSectionName is called, then updates name at the given index", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
    });
    act(() => {
      result.current.updateSectionName(0, "Intro");
    });
    expect(result.current.sectionNames).toEqual(["Intro", "Text 2"]);
    act(() => {
      result.current.updateSectionName(1, "Body");
    });
    expect(result.current.sectionNames).toEqual(["Intro", "Body"]);
  });

  it("when addEditor is called, then returns the generated name", () => {
    const { result } = renderHook(() => useEditors());
    let name = "";
    act(() => {
      name = result.current.addEditor();
    });
    expect(name).toBe("Text 2");
  });

  it("when addEditor is called with an explicit name, then does not increment counter", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor({ name: "Custom" });
    });
    expect(result.current.sectionNames).toEqual(["Text 1", "Custom"]);
  });

  it("when editors are removed, then text name counter never resets", () => {
    const { result } = renderHook(() => useEditors());
    // Start at 1, add 2 more to get to 3
    act(() => {
      result.current.addEditor();
      result.current.addEditor();
    });
    // Names: ["Text 1", "Text 2", "Text 3"]
    act(() => {
      result.current.removeEditor(1);
    });
    // Names: ["Text 1", "Text 3"]
    act(() => {
      result.current.addEditor();
    });
    // Counter was at 3, so next auto-name is "Text 4"
    expect(result.current.sectionNames).toEqual(["Text 1", "Text 3", "Text 4"]);
  });

  // --- Persistence ---

  it("when documentId is provided, then persists layout to localStorage", () => {
    const docId = "test-doc-1";
    const { result } = renderHook(() => useEditors(docId));

    act(() => {
      result.current.addEditor();
    });

    const stored = JSON.parse(
      localStorage.getItem(`${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}${docId}`) ?? "null",
    );
    expect(stored).toEqual({
      editorCount: 2,
      sectionNames: ["Text 1", "Text 2"],
      sectionVisibility: [true, true],
    });
  });

  it("when documentId is provided and localStorage has data, then restores layout", () => {
    const docId = "test-doc-2";
    localStorage.setItem(
      `${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}${docId}`,
      JSON.stringify({
        editorCount: 3,
        sectionNames: ["Genesis", "Exodus", "Leviticus"],
        sectionVisibility: [true, true, false],
      }),
    );

    const { result } = renderHook(() => useEditors(docId));

    expect(result.current.editorCount).toBe(3);
    expect(result.current.sectionNames).toEqual(["Genesis", "Exodus", "Leviticus"]);
    expect(result.current.sectionVisibility).toEqual([true, true, false]);
  });

  it("when restored from localStorage, then text counter continues from max name", () => {
    const docId = "test-doc-3";
    localStorage.setItem(
      `${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}${docId}`,
      JSON.stringify({
        editorCount: 2,
        sectionNames: ["Text 1", "Text 5"],
        sectionVisibility: [true, true],
      }),
    );

    const { result } = renderHook(() => useEditors(docId));
    let name = "";
    act(() => {
      name = result.current.addEditor();
    });
    // Should continue from 5, so next is "Text 6"
    expect(name).toBe("Text 6");
  });

  it("when no documentId, then does not persist or restore", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
    });
    // No localStorage key should be set with the prefix
    const keys = Object.keys(localStorage);
    const hasEditorLayout = keys.some((k) => k.startsWith(STORAGE_KEYS.EDITOR_LAYOUT_PREFIX));
    expect(hasEditorLayout).toBe(false);
  });

  it("when localStorage has invalid data, then falls back to defaults", () => {
    const docId = "test-doc-bad";
    localStorage.setItem(`${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}${docId}`, "not json");

    const { result } = renderHook(() => useEditors(docId));
    expect(result.current.editorCount).toBe(1);
    expect(result.current.sectionNames).toEqual(["Text 1"]);
  });
});
