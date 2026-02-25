import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { WorkspaceProvider, useWorkspace } from "./WorkspaceContext";
import type { WorkspaceContextValue } from "./WorkspaceContext";

function makeMockWorkspace(overrides: Partial<WorkspaceContextValue> = {}): WorkspaceContextValue {
  return {
    settings: {
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: false,
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
  } as unknown as WorkspaceContextValue;
}

describe("WorkspaceContext", () => {
  describe("when used outside WorkspaceProvider", () => {
    it("throws an error", () => {
      expect(() => {
        renderHook(() => useWorkspace());
      }).toThrow("useWorkspace must be used within a WorkspaceProvider");
    });
  });

  describe("when used inside WorkspaceProvider", () => {
    it("provides the workspace settings", () => {
      const mockValue = makeMockWorkspace({
        settings: {
          isDarkMode: true,
          isLayersOn: true,
          isMultipleRowsLayout: false,
          isLocked: false,
        },
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: ({ children }) => (
          <WorkspaceProvider value={mockValue}>{children}</WorkspaceProvider>
        ),
      });

      expect(result.current.settings.isDarkMode).toBe(true);
      expect(result.current.settings.isLayersOn).toBe(true);
      expect(result.current.settings.isMultipleRowsLayout).toBe(false);
    });

    it("provides the layers array and active layer", () => {
      const mockValue = makeMockWorkspace({
        layers: [
          { id: "layer-1", name: "Notes", color: "#ff0000" },
        ] as WorkspaceContextValue["layers"],
        activeLayerId: "layer-1",
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: ({ children }) => (
          <WorkspaceProvider value={mockValue}>{children}</WorkspaceProvider>
        ),
      });

      expect(result.current.layers).toHaveLength(1);
      expect(result.current.activeLayerId).toBe("layer-1");
    });

    it("provides annotation actions as callable functions", () => {
      const mockValue = makeMockWorkspace();

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: ({ children }) => (
          <WorkspaceProvider value={mockValue}>{children}</WorkspaceProvider>
        ),
      });

      expect(result.current.addLayer).toEqual(expect.any(Function));
      expect(result.current.removeLayer).toEqual(expect.any(Function));
      expect(result.current.addHighlight).toEqual(expect.any(Function));
      expect(result.current.removeHighlight).toEqual(expect.any(Function));
    });

    it("provides the editor state", () => {
      const mockValue = makeMockWorkspace({
        editorCount: 2,
        editorWidths: [50, 50],
        isManagementPaneOpen: true,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: ({ children }) => (
          <WorkspaceProvider value={mockValue}>{children}</WorkspaceProvider>
        ),
      });

      expect(result.current.editorCount).toBe(2);
      expect(result.current.editorWidths).toEqual([50, 50]);
      expect(result.current.isManagementPaneOpen).toBe(true);
    });
  });
});
