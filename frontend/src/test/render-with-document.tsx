import { render } from "@testing-library/react";
import { vi } from "vitest";
import { DocumentProvider } from "@/contexts/DocumentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TourProvider } from "@/contexts/TourContext";
import type { DocumentContextValue } from "@/contexts/DocumentContext";

export function makeMockDocument(
  overrides: Partial<DocumentContextValue> = {},
): DocumentContextValue {
  return {
    settings: {
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      lockedPanes: { 0: false, 1: false, 2: false, 3: false },
      hideOffscreenArrows: false,
      showStatusBar: true,
      commentPlacement: "right" as const,
    },
    annotations: { activeTool: "selection" as const },
    layers: [],
    activeLayerId: null,
    editorCount: 1,
    activeEditor: null,
    editorWidths: [100],
    documentId: "test-document-id",
    readOnly: false,
    isManagementPaneOpen: false,
    toggleDarkMode: vi.fn(),
    toggleLayersOn: vi.fn(),
    toggleMultipleRowsLayout: vi.fn(),
    togglePaneLocked: vi.fn(),
    toggleFocusedPaneLocked: vi.fn(),
    isPaneLocked: vi.fn((_index: number) => false),
    isAnyPaneLocked: false,
    activeEditorIndex: 0,
    activeArrowStyle: "solid" as const,
    setActiveArrowStyle: vi.fn(),
    arrowStylePickerOpen: false,
    setArrowStylePickerOpen: vi.fn(),
    selectedArrow: null,
    setSelectedArrow: vi.fn(),
    updateArrowStyle: vi.fn(),
    setActiveTool: vi.fn(),
    toggleManagementPane: vi.fn(),
    toggleHideOffscreenArrows: vi.fn(),
    toggleShowStatusBar: vi.fn(),
    toggleCommentPlacement: vi.fn(),
    columnSplit: 50,
    rowSplit: 50,
    handleColumnResize: vi.fn(),
    handleRowResize: vi.fn(),
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
    addReply: vi.fn(),
    updateReply: vi.fn(),
    removeReply: vi.fn(),
    toggleReactionOnHighlight: vi.fn(),
    toggleReactionOnReply: vi.fn(),
    addUnderline: vi.fn(),
    removeUnderline: vi.fn(),
    toggleHighlightVisibility: vi.fn(),
    toggleArrowVisibility: vi.fn(),
    toggleUnderlineVisibility: vi.fn(),
    setActiveLayerId: vi.fn(),
    editorKeys: [1],
    editorsRef: { current: new Map() },
    sectionVisibility: [true],
    sectionNames: ["Text 1"],
    addEditor: vi.fn(),
    removeEditor: vi.fn(),
    reorderEditors: vi.fn(),
    updateSectionName: vi.fn(),
    toggleSectionVisibility: vi.fn(),
    toggleAllSectionVisibility: vi.fn(),
    loadDemoContent: vi.fn(),
    demoLoaded: false,
    demoLoading: false,
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
      synced: false,
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
  } as DocumentContextValue;
}

export function renderWithDocument(
  ui: React.ReactElement,
  overrides: Partial<DocumentContextValue> = {},
) {
  const docCtx = makeMockDocument(overrides);
  return {
    ...render(
      <AuthProvider>
        <TourProvider>
          <DocumentProvider value={docCtx}>{ui}</DocumentProvider>
        </TourProvider>
      </AuthProvider>,
    ),
    document: docCtx,
  };
}
