import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEditors } from "./use-editors";
import { DEFAULT_SECTION_NAMES } from "@/data/default-workspace";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useEditors", () => {
  it("when initialized, then returns 2 editors at 50% width each", () => {
    const { result } = renderHook(() => useEditors());
    expect(result.current.editorCount).toBe(2);
    expect(result.current.editorWidths[0]).toBeCloseTo(50, 0);
    expect(result.current.editorWidths[1]).toBeCloseTo(50, 0);
    expect(result.current.activeEditor).toBeNull();
  });

  it("when addEditor is called, then increments editor count up to 4", () => {
    const { result } = renderHook(() => useEditors());

    // starts at 2
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
    });
    expect(result.current.editorWidths[0]).toBeCloseTo(33.3, 0);
    expect(result.current.editorWidths[1]).toBeCloseTo(33.3, 0);
    expect(result.current.editorWidths[2]).toBeCloseTo(33.3, 0);
  });

  it("when removeEditor is called, then decrements editor count and redistributes widths", () => {
    const { result } = renderHook(() => useEditors());

    act(() => {
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

  it("when initialized, then sectionVisibility has two visible sections", () => {
    const { result } = renderHook(() => useEditors());
    expect(result.current.sectionVisibility).toEqual([true, true]);
  });

  it("when addEditor is called, then appends true to sectionVisibility", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
    });
    expect(result.current.sectionVisibility).toEqual([true, true, true]);
  });

  it("when removeEditor is called, then removes the entry from sectionVisibility", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
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
    expect(result.current.sectionVisibility).toEqual([true, true]);

    act(() => {
      result.current.toggleSectionVisibility(0);
    });
    expect(result.current.sectionVisibility).toEqual([false, true]);

    act(() => {
      result.current.toggleSectionVisibility(0);
    });
    expect(result.current.sectionVisibility).toEqual([true, true]);
  });

  // --- Section names ---

  it("when initialized, then sectionNames starts with DEFAULT_SECTION_NAMES", () => {
    const { result } = renderHook(() => useEditors());
    expect(result.current.sectionNames).toEqual([...DEFAULT_SECTION_NAMES]);
  });

  it("when addEditor is called, then appends the correct default name", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
    });
    expect(result.current.sectionNames).toEqual([...DEFAULT_SECTION_NAMES, "Passage 3"]);
  });

  it("when addEditor is called in quick succession, then assigns unique names", () => {
    const { result } = renderHook(() => useEditors());
    // Already at 2 editors, can only add 1 more
    act(() => {
      result.current.addEditor();
    });
    expect(result.current.sectionNames).toEqual([...DEFAULT_SECTION_NAMES, "Passage 3"]);
  });

  it("when removeEditor is called, then removes the name at that index", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor();
    });
    act(() => {
      result.current.updateSectionName(1, "Custom");
    });
    expect(result.current.sectionNames).toEqual([DEFAULT_SECTION_NAMES[0], "Custom", "Passage 3"]);
    act(() => {
      result.current.removeEditor(1);
    });
    expect(result.current.sectionNames).toEqual([DEFAULT_SECTION_NAMES[0], "Passage 3"]);
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
      result.current.updateSectionName(0, "Intro");
    });
    expect(result.current.sectionNames).toEqual(["Intro", DEFAULT_SECTION_NAMES[1]]);
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
    expect(name).toBe("Passage 3");
  });

  it("when addEditor is called with an explicit name, then does not increment counter", () => {
    const { result } = renderHook(() => useEditors());
    act(() => {
      result.current.addEditor({ name: "Custom" });
    });
    expect(result.current.sectionNames).toEqual([...DEFAULT_SECTION_NAMES, "Custom"]);
  });

  it("when editors are removed, then passage name counter never resets", () => {
    const { result } = renderHook(() => useEditors());
    // Start at 2, add 1 more to get to 3
    act(() => {
      result.current.addEditor();
    });
    // Names: [DEFAULT_SECTION_NAMES[0], DEFAULT_SECTION_NAMES[1], "Passage 3"]
    act(() => {
      result.current.removeEditor(1);
    });
    // Names: [DEFAULT_SECTION_NAMES[0], "Passage 3"]
    act(() => {
      result.current.addEditor();
    });
    // Counter was at 3, so next auto-name is "Passage 4"
    expect(result.current.sectionNames).toEqual([
      DEFAULT_SECTION_NAMES[0],
      "Passage 3",
      "Passage 4",
    ]);
  });
});
