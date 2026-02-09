import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ButtonPane } from "./ButtonPane"

function renderButtonPane(overrides = {}) {
  const defaults = {
    settings: {
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: false,
    },
    annotations: {
      isPainterMode: false,
    },
    toggleDarkMode: vi.fn(),
    toggleLayers: vi.fn(),
    toggleEditorLayout: vi.fn(),
    togglePainterMode: vi.fn(),
    toggleLock: vi.fn(),
    addEditor: vi.fn(),
    editorCount: 1,
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<ButtonPane {...props} />), props }
}

describe("ButtonPane", () => {
  it("renders all toggle buttons", () => {
    renderButtonPane()
    expect(screen.getByTestId("darkModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("clearLayersButton")).toBeInTheDocument()
    expect(screen.getByTestId("editorLayoutButton")).toBeInTheDocument()
    expect(screen.getByTestId("painterModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("lockButton")).toBeInTheDocument()
  })

  it("calls toggleDarkMode when dark mode button is clicked", () => {
    const { props } = renderButtonPane()
    fireEvent.click(screen.getByTestId("darkModeButton"))
    expect(props.toggleDarkMode).toHaveBeenCalledOnce()
  })

  it("calls toggleLayers when layers button is clicked", () => {
    const { props } = renderButtonPane()
    fireEvent.click(screen.getByTestId("clearLayersButton"))
    expect(props.toggleLayers).toHaveBeenCalledOnce()
  })

  it("calls toggleEditorLayout when layout button is clicked", () => {
    const { props } = renderButtonPane()
    fireEvent.click(screen.getByTestId("editorLayoutButton"))
    expect(props.toggleEditorLayout).toHaveBeenCalledOnce()
  })

  it("calls togglePainterMode when painter button is clicked", () => {
    const { props } = renderButtonPane()
    fireEvent.click(screen.getByTestId("painterModeButton"))
    expect(props.togglePainterMode).toHaveBeenCalledOnce()
  })

  it("calls toggleLock when lock button is clicked", () => {
    const { props } = renderButtonPane()
    fireEvent.click(screen.getByTestId("lockButton"))
    expect(props.toggleLock).toHaveBeenCalledOnce()
  })

  it("renders the add editor button", () => {
    renderButtonPane()
    expect(screen.getByTestId("addEditorButton")).toBeInTheDocument()
  })

  it("calls addEditor when add editor button is clicked", () => {
    const { props } = renderButtonPane()
    fireEvent.click(screen.getByTestId("addEditorButton"))
    expect(props.addEditor).toHaveBeenCalledOnce()
  })

  it("disables add editor button when editorCount is 3", () => {
    renderButtonPane({ editorCount: 3 })
    expect(screen.getByTestId("addEditorButton")).toBeDisabled()
  })

  it("enables add editor button when editorCount is less than 3", () => {
    renderButtonPane({ editorCount: 2 })
    expect(screen.getByTestId("addEditorButton")).not.toBeDisabled()
  })
})
