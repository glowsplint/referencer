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
    isManagementPaneOpen: false,
    toggleManagementPane: vi.fn(),
    toggleDarkMode: vi.fn(),
    toggleEditorLayout: vi.fn(),
    togglePainterMode: vi.fn(),
    toggleLock: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<ButtonPane {...props} />), props }
}

describe("ButtonPane", () => {
  it("renders all toggle buttons", () => {
    renderButtonPane()
    expect(screen.getByTestId("menuButton")).toBeInTheDocument()
    expect(screen.getByTestId("darkModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("editorLayoutButton")).toBeInTheDocument()
    expect(screen.getByTestId("painterModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("lockButton")).toBeInTheDocument()
  })

  it("calls toggleManagementPane when menu button is clicked", () => {
    const { props } = renderButtonPane()
    fireEvent.click(screen.getByTestId("menuButton"))
    expect(props.toggleManagementPane).toHaveBeenCalledOnce()
  })

  it("calls toggleDarkMode when dark mode button is clicked", () => {
    const { props } = renderButtonPane()
    fireEvent.click(screen.getByTestId("darkModeButton"))
    expect(props.toggleDarkMode).toHaveBeenCalledOnce()
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
})
