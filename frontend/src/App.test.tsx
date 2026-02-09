import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { App } from "./App"

// Mock the editor workspace hook
const mockWorkspace = {
  settings: {
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    isLocked: false,
  },
  annotations: { isPainterMode: false },
  layers: [] as { id: string; color: string; name: string; visible: boolean; highlights: { id: string; editorIndex: number; from: number; to: number; text: string }[] }[],
  activeLayerId: null as string | null,
  editorCount: 1,
  activeEditor: null,
  editorWidths: [100],
  isManagementPaneOpen: false,
  toggleSetting: () => vi.fn(),
  togglePainterMode: vi.fn(),
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

beforeEach(() => {
  // Reset mock state
  mockWorkspace.settings = {
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    isLocked: false,
  }
  mockWorkspace.layers = []
  mockWorkspace.activeLayerId = null
  mockWorkspace.editorWidths = [100]
  mockWorkspace.isManagementPaneOpen = false
  mockWorkspace.addHighlight = vi.fn()
  mockWorkspace.removeHighlight = vi.fn()
  capturedEditorPaneProps = []
})

describe("App", () => {
  it("renders the button pane with expected buttons", () => {
    render(<App />)

    expect(screen.getByTestId("menuButton")).toBeInTheDocument()
    expect(screen.getByTestId("darkModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("lockButton")).toBeInTheDocument()
    expect(screen.getByTestId("addEditorButton")).toBeInTheDocument()
  })

  it("renders the canvas overlay", () => {
    render(<App />)
    expect(screen.getByTestId("canvasOverlay")).toBeInTheDocument()
  })

  it("renders the add layer button", () => {
    render(<App />)
    expect(screen.getByTestId("addLayerButton")).toBeInTheDocument()
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
    render(<App />)
    const panes = screen.getAllByTestId("editor-pane")
    expect(panes).toHaveLength(2)
  })

  it("does not pass onWordClick to EditorPane when not locked", () => {
    mockWorkspace.settings.isLocked = false
    mockWorkspace.settings.isLayersOn = true
    render(<App />)
    expect(capturedEditorPaneProps[0].onWordClick).toBeUndefined()
  })

  it("does not pass onWordClick to EditorPane when layers are off", () => {
    mockWorkspace.settings.isLocked = true
    mockWorkspace.settings.isLayersOn = false
    render(<App />)
    expect(capturedEditorPaneProps[0].onWordClick).toBeUndefined()
  })

  it("passes onWordClick to EditorPane when locked and layers on", () => {
    mockWorkspace.settings.isLocked = true
    mockWorkspace.settings.isLayersOn = true
    render(<App />)
    expect(capturedEditorPaneProps[0].onWordClick).toBeDefined()
  })

  it("handleWordClick does nothing when activeLayerId is null", () => {
    mockWorkspace.settings.isLocked = true
    mockWorkspace.settings.isLayersOn = true
    mockWorkspace.activeLayerId = null
    render(<App />)

    const onWordClick = capturedEditorPaneProps[0].onWordClick as (editorIndex: number, from: number, to: number, text: string) => void
    onWordClick(0, 1, 5, "hello")

    expect(mockWorkspace.addHighlight).not.toHaveBeenCalled()
    expect(mockWorkspace.removeHighlight).not.toHaveBeenCalled()
  })

  it("handleWordClick adds highlight when no matching highlight exists", () => {
    mockWorkspace.settings.isLocked = true
    mockWorkspace.settings.isLayersOn = true
    mockWorkspace.activeLayerId = "layer-1"
    mockWorkspace.layers = [
      { id: "layer-1", name: "Layer 1", color: "#fca5a5", visible: true, highlights: [] },
    ]
    render(<App />)

    const onWordClick = capturedEditorPaneProps[0].onWordClick as (editorIndex: number, from: number, to: number, text: string) => void
    onWordClick(0, 1, 5, "hello")

    expect(mockWorkspace.addHighlight).toHaveBeenCalledWith("layer-1", {
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
    })
  })

  it("handleWordClick removes highlight when matching highlight exists", () => {
    mockWorkspace.settings.isLocked = true
    mockWorkspace.settings.isLayersOn = true
    mockWorkspace.activeLayerId = "layer-1"
    mockWorkspace.layers = [
      {
        id: "layer-1",
        name: "Layer 1",
        color: "#fca5a5",
        visible: true,
        highlights: [
          { id: "h1", editorIndex: 0, from: 1, to: 5, text: "hello" },
        ],
      },
    ]
    render(<App />)

    const onWordClick = capturedEditorPaneProps[0].onWordClick as (editorIndex: number, from: number, to: number, text: string) => void
    onWordClick(0, 1, 5, "hello")

    expect(mockWorkspace.removeHighlight).toHaveBeenCalledWith("layer-1", "h1")
    expect(mockWorkspace.addHighlight).not.toHaveBeenCalled()
  })
})
