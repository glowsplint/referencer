import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
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
  layers: [] as { id: string; color: string }[],
  editorCount: 1,
  activeEditor: null,
  editorWidths: [100],
  isManagementPaneOpen: false,
  toggleSetting: () => vi.fn(),
  togglePainterMode: vi.fn(),
  toggleManagementPane: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  updateLayerColor: vi.fn(),
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

// Mock the simple editor components
vi.mock("./components/tiptap-templates/simple", () => ({
  TitleBar: () => <div data-testid="title-bar" />,
  SimpleEditorToolbar: () => <div data-testid="toolbar" />,
  EditorPane: () => <div data-testid="editor-pane" />,
  SIMPLE_EDITOR_CONTENT: {},
}))

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
    mockWorkspace.isManagementPaneOpen = false
  })
})
