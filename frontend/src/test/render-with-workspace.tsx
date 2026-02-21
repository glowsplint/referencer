import { render } from "@testing-library/react";
import { vi } from "vitest";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AuthProvider } from "@/contexts/AuthContext";
import type { WorkspaceContextValue } from "@/contexts/WorkspaceContext";

export function makeMockWorkspace(
  overrides: Partial<WorkspaceContextValue> = {},
): WorkspaceContextValue {
  return {
    settings: {
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: false,
      showDrawingToasts: true,
      showCommentsToasts: true,
      showHighlightToasts: true,
      overscrollEnabled: false,
    },
    annotations: { activeTool: "selection" as const },
    layers: [],
    activeLayerId: null,
    editorCount: 1,
    activeEditor: null,
    editorWidths: [100],
    workspaceId: "test-workspace-id",
    readOnly: false,
    isManagementPaneOpen: false,
    toggleDarkMode: vi.fn(),
    toggleLayersOn: vi.fn(),
    toggleMultipleRowsLayout: vi.fn(),
    toggleLocked: vi.fn(),
    toggleShowDrawingToasts: vi.fn(),
    toggleShowCommentsToasts: vi.fn(),
    activeArrowStyle: "solid" as const,
    setActiveArrowStyle: vi.fn(),
    arrowStylePickerOpen: false,
    setArrowStylePickerOpen: vi.fn(),
    selectedArrow: null,
    setSelectedArrow: vi.fn(),
    updateArrowStyle: vi.fn(),
    setActiveTool: vi.fn(),
    toggleManagementPane: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    setActiveLayer: vi.fn(),
    updateLayerColor: vi.fn(),
    updateLayerName: vi.fn(),
    toggleLayerVisibility: vi.fn(),
    toggleAllLayerVisibility: vi.fn(),
    addHighlight: vi.fn(),
    removeHighlight: vi.fn(),
    removeArrow: vi.fn(),
    clearLayerHighlights: vi.fn(),
    clearLayerArrows: vi.fn(),
    clearLayerUnderlines: vi.fn(),
    addArrow: vi.fn(),
    updateHighlightAnnotation: vi.fn(),
    addUnderline: vi.fn(),
    removeUnderline: vi.fn(),
    updateEditorContent: vi.fn(),
    setActiveLayerId: vi.fn(),
    setLayers: vi.fn(),
    editorKeys: [1],
    editorsRef: { current: new Map() },
    sectionVisibility: [true],
    sectionNames: ["Passage 1"],
    addEditor: vi.fn(),
    removeEditor: vi.fn(),
    reorderEditors: vi.fn(),
    updateSectionName: vi.fn(),
    toggleSectionVisibility: vi.fn(),
    toggleAllSectionVisibility: vi.fn(),
    handleDividerResize: vi.fn(),
    handleEditorMount: vi.fn(),
    handlePaneFocus: vi.fn(),
    history: {
      log: [],
      canUndo: false,
      canRedo: false,
      undo: vi.fn(),
      redo: vi.fn(),
      record: vi.fn(),
    },
    wsConnected: false,
    yjs: {
      provider: null,
      doc: null,
      connected: false,
      getFragment: () => null,
      awareness: null,
    },
    unifiedUndo: {
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
    },
    ...overrides,
  } as WorkspaceContextValue;
}

export function renderWithWorkspace(
  ui: React.ReactElement,
  overrides: Partial<WorkspaceContextValue> = {},
) {
  const workspace = makeMockWorkspace(overrides);
  return {
    ...render(
      <AuthProvider>
        <WorkspaceProvider value={workspace}>{ui}</WorkspaceProvider>
      </AuthProvider>,
    ),
    workspace,
  };
}
