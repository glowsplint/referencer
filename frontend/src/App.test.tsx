import { describe, it, expect, vi } from "vitest"
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
  editorCount: 1,
  activeEditor: null,
  editorWidths: [100],
  toggleSetting: () => vi.fn(),
  togglePainterMode: vi.fn(),
  addEditor: vi.fn(),
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

    expect(screen.getByTestId("darkModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("lockButton")).toBeInTheDocument()
    expect(screen.getByTestId("addEditorButton")).toBeInTheDocument()
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
})
