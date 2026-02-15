import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { App } from "./App"

// Mock the breakpoint hook for mobile detection
let mockIsMobile = false
vi.mock("./hooks/use-is-breakpoint", () => ({
  useIsBreakpoint: () => mockIsMobile,
}))

// Mock the editor workspace hook
const mockWorkspace = {
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
  layers: [] as { id: string; color: string; name: string; visible: boolean; arrowStyle: string; highlights: { id: string; editorIndex: number; from: number; to: number; text: string; annotation: string; type: string }[]; arrows: unknown[]; underlines: unknown[] }[],
  activeLayerId: null as string | null,
  editorCount: 1,
  activeEditor: null,
  editorWidths: [100],
  isManagementPaneOpen: false,
  toggleDarkMode: vi.fn(),
  toggleLayersOn: vi.fn(),
  toggleMultipleRowsLayout: vi.fn(),
  toggleLocked: vi.fn(),
  toggleShowDrawingToasts: vi.fn(),
  toggleShowCommentsToasts: vi.fn(),
  toggleShowHighlightToasts: vi.fn(),
  setActiveTool: vi.fn(),
  setArrowStylePickerOpen: vi.fn(),
  arrowStylePickerOpen: false,
  activeArrowStyle: "solid" as const,
  setActiveArrowStyle: vi.fn(),
  selectedArrow: null as { layerId: string; arrowId: string } | null,
  setSelectedArrow: vi.fn(),
  updateArrowStyle: vi.fn(),
  readOnly: false,
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
  updateHighlightAnnotation: vi.fn(),
  clearLayerHighlights: vi.fn(),
  addArrow: vi.fn(),
  removeArrow: vi.fn(),
  clearLayerArrows: vi.fn(),
  editorsRef: { current: new Map() },
  sectionVisibility: [true],
  sectionNames: ["Passage 1"],
  editorKeys: [1],
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
}

vi.mock("./hooks/use-editor-workspace", () => ({
  useEditorWorkspace: () => mockWorkspace,
}))

// Mock tiptap
vi.mock("@tiptap/react", () => ({
  useEditor: () => null,
  useCurrentEditor: () => ({ editor: null }),
  EditorContent: (props: Record<string, unknown>) => (
    <div data-testid="editor-content" {...props} />
  ),
  EditorContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}))

// Capture props passed to EditorPane
let capturedEditorPaneProps: Record<string, unknown>[] = []

vi.mock("./components/tiptap-templates/simple", () => ({
  TitleBar: () => <div data-testid="title-bar" />,
  SimpleEditorToolbar: () => <div data-testid="toolbar" />,
  EditorPane: (props: Record<string, unknown>) => {
    capturedEditorPaneProps.push(props)
    return <div data-testid="editor-pane" />
  },
  SIMPLE_EDITOR_CONTENT: {},
}))

// Mock AnnotationPanel
let capturedAnnotationPanelProps: Record<string, unknown> | null = null

vi.mock("./components/AnnotationPanel", () => ({
  AnnotationPanel: (props: Record<string, unknown>) => {
    capturedAnnotationPanelProps = props
    return <div data-testid="annotation-panel" />
  },
}))

beforeEach(() => {
  // Reset mobile mock
  mockIsMobile = false

  // Reset mock state
  mockWorkspace.settings = {
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    isLocked: false,
    showDrawingToasts: true,
    showCommentsToasts: true,
    showHighlightToasts: true,
    overscrollEnabled: false,
  }
  mockWorkspace.layers = []
  mockWorkspace.activeLayerId = null
  mockWorkspace.editorWidths = [100]
  mockWorkspace.isManagementPaneOpen = false
  mockWorkspace.addHighlight = vi.fn()
  mockWorkspace.removeHighlight = vi.fn()
  mockWorkspace.updateHighlightAnnotation = vi.fn()
  mockWorkspace.setArrowStylePickerOpen = vi.fn()
  mockWorkspace.selectedArrow = null
  capturedEditorPaneProps = []
  capturedAnnotationPanelProps = null
})

describe("App", () => {
  it("renders the button pane with expected buttons", () => {
    render(<App />)

    expect(screen.getByTestId("menuButton")).toBeInTheDocument()
    expect(screen.getByTestId("settingsButton")).toBeInTheDocument()
    expect(screen.getByTestId("lockButton")).toBeInTheDocument()
  })

  it("renders the title bar and toolbar", () => {
    render(<App />)

    expect(screen.getByTestId("title-bar")).toBeInTheDocument()
    expect(screen.getByTestId("toolbar")).toBeInTheDocument()
  })

  it("renders editor panes based on editorWidths", () => {
    render(<App />)

    const panes = screen.getAllByTestId("editor-pane")
    expect(panes).toHaveLength(1)
  })

  it("does not render management pane when closed", () => {
    render(<App />)
    expect(screen.queryByTestId("managementPane")).not.toBeInTheDocument()
  })

  it("renders management pane when open", () => {
    mockWorkspace.isManagementPaneOpen = true
    render(<App />)
    expect(screen.getByTestId("managementPane")).toBeInTheDocument()
  })

  it("renders multiple editor panes when editorWidths has multiple entries", () => {
    mockWorkspace.editorWidths = [50, 50]
    mockWorkspace.editorKeys = [1, 2]
    render(<App />)
    const panes = screen.getAllByTestId("editor-pane")
    expect(panes).toHaveLength(2)
  })

  it("does not pass mouse handlers to EditorPane when not locked", () => {
    mockWorkspace.settings.isLocked = false
    render(<App />)
    expect(capturedEditorPaneProps[0].onMouseDown).toBeUndefined()
    expect(capturedEditorPaneProps[0].onMouseMove).toBeUndefined()
    expect(capturedEditorPaneProps[0].onMouseUp).toBeUndefined()
  })

  it("passes mouse handlers to EditorPane when locked", () => {
    mockWorkspace.settings.isLocked = true
    render(<App />)
    expect(capturedEditorPaneProps[0].onMouseDown).toBeDefined()
    expect(capturedEditorPaneProps[0].onMouseMove).toBeDefined()
    expect(capturedEditorPaneProps[0].onMouseUp).toBeDefined()
  })

  it("passes layers and selection props to EditorPane", () => {
    mockWorkspace.layers = [
      { id: "layer-1", name: "Layer 1", color: "#fca5a5", visible: true, arrowStyle: "solid", highlights: [], arrows: [], underlines: [] },
    ]
    render(<App />)

    expect(capturedEditorPaneProps[0].layers).toEqual(mockWorkspace.layers)
    expect(capturedEditorPaneProps[0].selection).toBeNull()
  })

  it("does not render AnnotationPanel when not locked", () => {
    mockWorkspace.settings.isLocked = false
    mockWorkspace.layers = [
      { id: "layer-1", name: "Layer 1", color: "#fca5a5", visible: true, arrowStyle: "solid", highlights: [{ id: "h1", editorIndex: 0, from: 0, to: 5, text: "hello", annotation: "note", type: "comment" }], arrows: [], underlines: [] },
    ]
    render(<App />)
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument()
  })

  it("does not render AnnotationPanel when locked but no annotations", () => {
    mockWorkspace.settings.isLocked = true
    mockWorkspace.layers = []
    render(<App />)
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument()
  })

  it("renders AnnotationPanel when locked with annotations", () => {
    mockWorkspace.settings.isLocked = true
    mockWorkspace.layers = [
      { id: "layer-1", name: "Layer 1", color: "#fca5a5", visible: true, arrowStyle: "solid", highlights: [{ id: "h1", editorIndex: 0, from: 0, to: 5, text: "hello", annotation: "note", type: "comment" }], arrows: [], underlines: [] },
    ]
    render(<App />)
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument()
  })

  it("passes annotation handlers to AnnotationPanel", () => {
    mockWorkspace.settings.isLocked = true
    mockWorkspace.layers = [
      { id: "layer-1", name: "Layer 1", color: "#fca5a5", visible: true, arrowStyle: "solid", highlights: [{ id: "h1", editorIndex: 0, from: 0, to: 5, text: "hello", annotation: "note", type: "comment" }], arrows: [], underlines: [] },
    ]
    render(<App />)

    expect(capturedAnnotationPanelProps).not.toBeNull()
    expect(capturedAnnotationPanelProps!.onAnnotationChange).toBeDefined()
    expect(capturedAnnotationPanelProps!.onAnnotationBlur).toBeDefined()
    expect(capturedAnnotationPanelProps!.onAnnotationClick).toBeDefined()
  })

  it("does not render AnnotationPanel when all annotated passages are hidden", () => {
    mockWorkspace.settings.isLocked = true
    mockWorkspace.sectionVisibility = [false]
    mockWorkspace.layers = [
      { id: "layer-1", name: "Layer 1", color: "#fca5a5", visible: true, arrowStyle: "solid", highlights: [{ id: "h1", editorIndex: 0, from: 0, to: 5, text: "hello", annotation: "note", type: "comment" }], arrows: [], underlines: [] },
    ]
    render(<App />)
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument()
  })

  it("passes sectionVisibility to AnnotationPanel", () => {
    mockWorkspace.settings.isLocked = true
    mockWorkspace.sectionVisibility = [true]
    mockWorkspace.layers = [
      { id: "layer-1", name: "Layer 1", color: "#fca5a5", visible: true, arrowStyle: "solid", highlights: [{ id: "h1", editorIndex: 0, from: 0, to: 5, text: "hello", annotation: "note", type: "comment" }], arrows: [], underlines: [] },
    ]
    render(<App />)
    expect(capturedAnnotationPanelProps).not.toBeNull()
    expect(capturedAnnotationPanelProps!.sectionVisibility).toEqual([true])
  })

  it("does not pass annotation props to EditorPane", () => {
    mockWorkspace.settings.isLocked = true
    render(<App />)

    expect(capturedEditorPaneProps[0].editingAnnotation).toBeUndefined()
    expect(capturedEditorPaneProps[0].onAnnotationChange).toBeUndefined()
    expect(capturedEditorPaneProps[0].onAnnotationBlur).toBeUndefined()
    expect(capturedEditorPaneProps[0].onAnnotationClick).toBeUndefined()
  })

  describe("mobile read-only mode", () => {
    beforeEach(() => {
      mockIsMobile = true
    })

    it("hides ButtonPane on mobile", () => {
      render(<App />)
      expect(screen.queryByTestId("buttonPane")).not.toBeInTheDocument()
    })

    it("shows MobileInfoDialog on mobile", () => {
      render(<App />)
      expect(screen.getByTestId("mobileInfoDialog")).toBeInTheDocument()
      expect(screen.getByText("Best on Desktop")).toBeInTheDocument()
    })

    it("does not show MobileInfoDialog on desktop", () => {
      mockIsMobile = false
      render(<App />)
      expect(screen.queryByTestId("mobileInfoDialog")).not.toBeInTheDocument()
    })

    it("dismisses MobileInfoDialog when button is clicked", async () => {
      const user = userEvent.setup()
      render(<App />)

      expect(screen.getByTestId("mobileInfoDialog")).toBeInTheDocument()
      await user.click(screen.getByTestId("mobileInfoDismissButton"))
      expect(screen.queryByTestId("mobileInfoDialog")).not.toBeInTheDocument()
    })

    it("passes isLocked=true to EditorPane on mobile (read-only)", () => {
      mockWorkspace.settings.isLocked = false
      render(<App />)
      expect(capturedEditorPaneProps[0].isLocked).toBe(true)
    })

    it("does not pass mouse handlers to EditorPane on mobile even when locked", () => {
      mockWorkspace.settings.isLocked = true
      render(<App />)
      expect(capturedEditorPaneProps[0].onMouseDown).toBeUndefined()
      expect(capturedEditorPaneProps[0].onMouseMove).toBeUndefined()
      expect(capturedEditorPaneProps[0].onMouseUp).toBeUndefined()
    })

    it("does not pass onContentUpdate to EditorPane on mobile", () => {
      render(<App />)
      expect(capturedEditorPaneProps[0].onContentUpdate).toBeUndefined()
    })

    it("hides StatusBar on mobile", () => {
      render(<App />)
      expect(screen.queryByTestId("status-bar")).not.toBeInTheDocument()
    })
  })
})
