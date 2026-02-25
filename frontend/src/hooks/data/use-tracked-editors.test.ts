import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTrackedEditors } from "./use-tracked-editors";

function makeRawEditors(overrides: Record<string, any> = {}) {
  return {
    editorCount: 2,
    sectionNames: ["Passage 1", "Passage 2"],
    sectionVisibility: [true, true],
    addEditor: vi.fn(() => "Passage 3"),
    removeEditor: vi.fn(),
    updateSectionName: vi.fn(),
    toggleAllSectionVisibility: vi.fn(),
    setSectionVisibility: vi.fn(),
    ...overrides,
  };
}

function makeHistory() {
  return {
    record: vi.fn(),
    entries: [],
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
    markLastUndone: vi.fn(),
    markLastRedone: vi.fn(),
    clear: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTrackedEditors", () => {
  describe("when addEditor is called", () => {
    it("delegates to raw.addEditor and records history", () => {
      const raw = makeRawEditors();
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.addEditor();
      });

      expect(raw.addEditor).toHaveBeenCalled();
      expect(history.record).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "addEditor",
          description: "Added passage 'Passage 3'",
        }),
      );
    });

    it("does not add when already at 3 editors", () => {
      const raw = makeRawEditors({ editorCount: 3 });
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.addEditor();
      });

      expect(raw.addEditor).not.toHaveBeenCalled();
      expect(history.record).not.toHaveBeenCalled();
    });

    it("provides working undo callback that calls removeEditor", () => {
      const raw = makeRawEditors();
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.addEditor();
      });

      const recordCall = history.record.mock.calls[0][0];
      recordCall.undo();
      expect(raw.removeEditor).toHaveBeenCalledWith(2); // prevCount
    });

    it("provides working redo callback that calls addEditor with name", () => {
      const raw = makeRawEditors();
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.addEditor();
      });

      const recordCall = history.record.mock.calls[0][0];
      recordCall.redo();
      expect(raw.addEditor).toHaveBeenCalledWith({ name: "Passage 3" });
    });
  });

  describe("when removeEditor is called", () => {
    it("delegates to raw.removeEditor and records history", () => {
      const raw = makeRawEditors();
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.removeEditor(0);
      });

      expect(raw.removeEditor).toHaveBeenCalledWith(0);
      expect(history.record).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "removeEditor",
          description: "Removed passage 'Passage 1'",
        }),
      );
    });

    it("does not remove when only 1 editor remains", () => {
      const raw = makeRawEditors({ editorCount: 1 });
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.removeEditor(0);
      });

      expect(raw.removeEditor).not.toHaveBeenCalled();
      expect(history.record).not.toHaveBeenCalled();
    });

    it("undo restores the editor with its name", () => {
      const raw = makeRawEditors();
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.removeEditor(0);
      });

      const recordCall = history.record.mock.calls[0][0];
      recordCall.undo();
      expect(raw.addEditor).toHaveBeenCalledWith({ name: "Passage 1" });
    });

    it("undo restores hidden visibility if the section was hidden", () => {
      const raw = makeRawEditors({ sectionVisibility: [false, true] });
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.removeEditor(0);
      });

      const recordCall = history.record.mock.calls[0][0];
      recordCall.undo();
      expect(raw.setSectionVisibility).toHaveBeenCalled();
    });
  });

  describe("when updateSectionName is called", () => {
    it("delegates to raw.updateSectionName and records history", () => {
      const raw = makeRawEditors();
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.updateSectionName(0, "New Name");
      });

      expect(raw.updateSectionName).toHaveBeenCalledWith(0, "New Name");
      expect(history.record).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "updateSectionName",
          description: "Renamed passage 'Passage 1' to 'New Name'",
        }),
      );
    });

    it("undo restores the old name", () => {
      const raw = makeRawEditors();
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.updateSectionName(0, "New Name");
      });

      const recordCall = history.record.mock.calls[0][0];
      recordCall.undo();
      expect(raw.updateSectionName).toHaveBeenCalledWith(0, "Passage 1");
    });
  });

  describe("when toggleAllSectionVisibility is called", () => {
    it("records 'hideAllPassages' when any are visible", () => {
      const raw = makeRawEditors({ sectionVisibility: [true, false] });
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      act(() => {
        result.current.toggleAllSectionVisibility();
      });

      expect(raw.toggleAllSectionVisibility).toHaveBeenCalled();
      expect(history.record).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "hideAllPassages",
          description: "Hid all passages",
        }),
      );
    });

    it("records 'showAllPassages' when none are visible", () => {
      const raw = makeRawEditors({ sectionVisibility: [false, false] });
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

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
  });

  describe("when passthrough properties are accessed", () => {
    it("exposes raw editor properties", () => {
      const raw = makeRawEditors();
      const history = makeHistory();
      const { result } = renderHook(() => useTrackedEditors(raw as any, history as any));

      expect(result.current.editorCount).toBe(2);
      expect(result.current.sectionNames).toEqual(["Passage 1", "Passage 2"]);
      expect(result.current.sectionVisibility).toEqual([true, true]);
    });
  });
});
