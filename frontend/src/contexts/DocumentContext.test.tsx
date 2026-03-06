import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { DocumentProvider, useDocument } from "./DocumentContext";
import type { DocumentContextValue } from "./DocumentContext";

function makeMockDocument(overrides: Partial<DocumentContextValue> = {}): DocumentContextValue {
  return {
    settings: {
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      lockedPanes: { 0: false, 1: false, 2: false, 3: false },
    },
    annotations: { activeTool: "selection" as const },
    layers: [],
    activeLayerId: null,
    editorCount: 1,
    activeEditor: null,
    editorWidths: [100],
    isManagementPaneOpen: false,
    toggleSetting: () => vi.fn(),
    setActiveTool: vi.fn(),
    toggleManagementPane: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    setActiveLayer: vi.fn(),
    updateLayerColor: vi.fn(),
    updateLayerName: vi.fn(),
    toggleLayerVisibility: vi.fn(),
    addHighlight: vi.fn(),
    removeHighlight: vi.fn(),
    clearLayerHighlights: vi.fn(),
    editorsRef: { current: new Map() },
    addEditor: vi.fn(),
    removeEditor: vi.fn(),
    handleDividerResize: vi.fn(),
    handleEditorMount: vi.fn(),
    handlePaneFocus: vi.fn(),
    ...overrides,
  } as unknown as DocumentContextValue;
}

describe("DocumentContext", () => {
  describe("when used outside DocumentProvider", () => {
    it("then throws an error", () => {
      expect(() => {
        renderHook(() => useDocument());
      }).toThrow("useDocument must be used within a DocumentProvider");
    });
  });

  describe("when used inside DocumentProvider", () => {
    it("then provides the document settings", () => {
      const mockValue = makeMockDocument({
        settings: {
          isDarkMode: true,
          isLayersOn: true,
          isMultipleRowsLayout: false,
          lockedPanes: { 0: false, 1: false, 2: false, 3: false },
        },
      });

      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => (
          <DocumentProvider value={mockValue}>{children}</DocumentProvider>
        ),
      });

      expect(result.current.settings.isDarkMode).toBe(true);
      expect(result.current.settings.isLayersOn).toBe(true);
      expect(result.current.settings.isMultipleRowsLayout).toBe(false);
    });

    it("then provides the layers array and active layer", () => {
      const mockValue = makeMockDocument({
        layers: [
          { id: "layer-1", name: "Notes", color: "#ff0000" },
        ] as DocumentContextValue["layers"],
        activeLayerId: "layer-1",
      });

      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => (
          <DocumentProvider value={mockValue}>{children}</DocumentProvider>
        ),
      });

      expect(result.current.layers).toHaveLength(1);
      expect(result.current.activeLayerId).toBe("layer-1");
    });

    it("then provides annotation actions as callable functions", () => {
      const mockValue = makeMockDocument();

      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => (
          <DocumentProvider value={mockValue}>{children}</DocumentProvider>
        ),
      });

      expect(result.current.addLayer).toEqual(expect.any(Function));
      expect(result.current.removeLayer).toEqual(expect.any(Function));
      expect(result.current.addHighlight).toEqual(expect.any(Function));
      expect(result.current.removeHighlight).toEqual(expect.any(Function));
    });

    it("then provides the editor state", () => {
      const mockValue = makeMockDocument({
        editorCount: 2,
        editorWidths: [50, 50],
        isManagementPaneOpen: true,
      });

      const { result } = renderHook(() => useDocument(), {
        wrapper: ({ children }) => (
          <DocumentProvider value={mockValue}>{children}</DocumentProvider>
        ),
      });

      expect(result.current.editorCount).toBe(2);
      expect(result.current.editorWidths).toEqual([50, 50]);
      expect(result.current.isManagementPaneOpen).toBe(true);
    });
  });
});
