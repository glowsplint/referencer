import { render } from "@testing-library/react"
import { vi } from "vitest"
import { WorkspaceProvider } from "@/contexts/WorkspaceContext"
import type { WorkspaceContextValue } from "@/contexts/WorkspaceContext"

export function makeMockWorkspace(overrides: Partial<WorkspaceContextValue> = {}): WorkspaceContextValue {
  return {
    settings: {
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: false,
    },
    annotations: { isPainterMode: false },
    layers: [],
    activeLayerId: null,
    editorCount: 1,
    activeEditor: null,
    editorWidths: [100],
    isManagementPaneOpen: false,
    toggleDarkMode: vi.fn(),
    toggleLayersOn: vi.fn(),
    toggleMultipleRowsLayout: vi.fn(),
    toggleLocked: vi.fn(),
    togglePainterMode: vi.fn(),
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
    clearLayerHighlights: vi.fn(),
    editorsRef: { current: new Map() },
    sectionVisibility: [true],
    sectionNames: ["Passage 1"],
    addEditor: vi.fn(),
    removeEditor: vi.fn(),
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
    ...overrides,
  } as WorkspaceContextValue
}

export function renderWithWorkspace(
  ui: React.ReactElement,
  overrides: Partial<WorkspaceContextValue> = {}
) {
  const workspace = makeMockWorkspace(overrides)
  return {
    ...render(
      <WorkspaceProvider value={workspace}>{ui}</WorkspaceProvider>
    ),
    workspace,
  }
}
