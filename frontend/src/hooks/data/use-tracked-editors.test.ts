import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTrackedEditors } from "./use-tracked-editors";
import type { useEditors } from "./use-editors";
import type { useActionHistory } from "./use-action-history";

type EditorsHook = ReturnType<typeof useEditors>;
type History = ReturnType<typeof useActionHistory>;

function createMockEditors(overrides: Partial<EditorsHook> = {}): EditorsHook {
  return {
    editorCount: 2,
    editorWidths: [50, 50],
    activeEditor: null,
    editorsRef: { current: new Map() },
    sectionVisibility: [true, true],
    sectionNames: ["Passage 1", "Passage 2"],
    addEditor: vi.fn(() => "Passage 3"),
    removeEditor: vi.fn(),
    handleDividerResize: vi.fn(),
    handleEditorMount: vi.fn(),
    handlePaneFocus: vi.fn(),
    toggleSectionVisibility: vi.fn(),
    toggleAllSectionVisibility: vi.fn(),
    setSectionVisibility: vi.fn(),
    updateSectionName: vi.fn(),
    ...overrides,
  };
}

function createMockHistory(): History {
  return {
    record: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    logOnly: vi.fn(),
    canUndo: false,
    canRedo: false,
    log: [],
  };
}

describe("useTrackedEditors", () => {
  it("when addEditor is called, then records in history with undo/redo", () => {
    const raw = createMockEditors();
    const history = createMockHistory();

    const { result } = renderHook(() => useTrackedEditors(raw, history));

    act(() => {
      result.current.addEditor();
    });

    expect(raw.addEditor).toHaveBeenCalled();
    expect(history.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "addEditor",
        description: expect.stringContaining("Passage 3"),
      }),
    );

    // Verify undo calls removeEditor
    const recordCall = vi.mocked(history.record).mock.calls[0][0];
    recordCall.undo();
    expect(raw.removeEditor).toHaveBeenCalledWith(2); // prevCount = 2

    // Verify redo calls addEditor with name
    recordCall.redo();
    expect(raw.addEditor).toHaveBeenCalledWith({ name: "Passage 3" });
  });

  it("when addEditor is called at max (3 editors), then does nothing", () => {
    const raw = createMockEditors({ editorCount: 3 });
    const history = createMockHistory();

    const { result } = renderHook(() => useTrackedEditors(raw, history));

    act(() => {
      result.current.addEditor();
    });

    expect(raw.addEditor).not.toHaveBeenCalled();
    expect(history.record).not.toHaveBeenCalled();
  });

  it("when removeEditor is called, then records with rollback", () => {
    const raw = createMockEditors();
    const history = createMockHistory();

    const { result } = renderHook(() => useTrackedEditors(raw, history));

    act(() => {
      result.current.removeEditor(0);
    });

    expect(raw.removeEditor).toHaveBeenCalledWith(0);
    expect(history.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "removeEditor",
        description: expect.stringContaining("Passage 1"),
        details: [{ label: "name", before: "Passage 1" }],
      }),
    );

    // Undo should re-add the editor
    const recordCall = vi.mocked(history.record).mock.calls[0][0];
    recordCall.undo();
    expect(raw.addEditor).toHaveBeenCalledWith({ name: "Passage 1" });
  });

  it("when removeEditor is called with only 1 editor, then does nothing", () => {
    const raw = createMockEditors({ editorCount: 1 });
    const history = createMockHistory();

    const { result } = renderHook(() => useTrackedEditors(raw, history));

    act(() => {
      result.current.removeEditor(0);
    });

    expect(raw.removeEditor).not.toHaveBeenCalled();
    expect(history.record).not.toHaveBeenCalled();
  });

  it("when updateSectionName is called, then records old to new name change", () => {
    const raw = createMockEditors();
    const history = createMockHistory();

    const { result } = renderHook(() => useTrackedEditors(raw, history));

    act(() => {
      result.current.updateSectionName(0, "Intro");
    });

    expect(raw.updateSectionName).toHaveBeenCalledWith(0, "Intro");
    expect(history.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "updateSectionName",
        description: "Renamed passage 'Passage 1' to 'Intro'",
        details: [{ label: "name", before: "Passage 1", after: "Intro" }],
      }),
    );

    // Undo restores old name
    const recordCall = vi.mocked(history.record).mock.calls[0][0];
    recordCall.undo();
    expect(raw.updateSectionName).toHaveBeenCalledWith(0, "Passage 1");

    // Redo sets new name again
    recordCall.redo();
    expect(raw.updateSectionName).toHaveBeenCalledWith(0, "Intro");
  });

  it("when toggleAllSectionVisibility is called, then records the inverse", () => {
    const raw = createMockEditors({ sectionVisibility: [true, false] });
    const history = createMockHistory();

    const { result } = renderHook(() => useTrackedEditors(raw, history));

    act(() => {
      result.current.toggleAllSectionVisibility();
    });

    expect(raw.toggleAllSectionVisibility).toHaveBeenCalled();
    // anyVisible is true, so type should be "hideAllPassages"
    expect(history.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "hideAllPassages",
        description: "Hid all passages",
      }),
    );
  });

  it("when toggleAllSectionVisibility is called with all hidden, then records showAllPassages", () => {
    const raw = createMockEditors({ sectionVisibility: [false, false] });
    const history = createMockHistory();

    const { result } = renderHook(() => useTrackedEditors(raw, history));

    act(() => {
      result.current.toggleAllSectionVisibility();
    });

    expect(history.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "showAllPassages",
        description: "Showed all passages",
      }),
    );
  });

  it("when accessed, then spreads raw properties through to return value", () => {
    const raw = createMockEditors();
    const history = createMockHistory();

    const { result } = renderHook(() => useTrackedEditors(raw, history));

    expect(result.current.editorCount).toBe(2);
    expect(result.current.editorWidths).toEqual([50, 50]);
    expect(result.current.sectionNames).toEqual(["Passage 1", "Passage 2"]);
  });
});
