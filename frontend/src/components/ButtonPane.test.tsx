import { screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ButtonPane } from "./ButtonPane"
import { renderWithWorkspace } from "@/test/render-with-workspace"

function renderButtonPane(overrides = {}, props: { isDrawing?: boolean } = {}) {
  return renderWithWorkspace(<ButtonPane {...props} />, overrides)
}

describe("ButtonPane", () => {
  it("renders all toggle buttons", () => {
    renderButtonPane()
    expect(screen.getByTestId("keyboardShortcutsButton")).toBeInTheDocument()
    expect(screen.getByTestId("menuButton")).toBeInTheDocument()
    expect(screen.getByTestId("darkModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("editorLayoutButton")).toBeInTheDocument()
    expect(screen.getByTestId("painterModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("lockButton")).toBeInTheDocument()
  })

  it("calls toggleManagementPane when menu button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("menuButton"))
    expect(workspace.toggleManagementPane).toHaveBeenCalledOnce()
  })

  it("calls toggleDarkMode when dark mode button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("darkModeButton"))
    expect(workspace.toggleDarkMode).toHaveBeenCalledOnce()
  })

  it("calls toggleMultipleRowsLayout when layout button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("editorLayoutButton"))
    expect(workspace.toggleMultipleRowsLayout).toHaveBeenCalledOnce()
  })

  it("calls togglePainterMode when painter button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("painterModeButton"))
    expect(workspace.togglePainterMode).toHaveBeenCalledOnce()
  })

  it("calls toggleLocked when lock button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("lockButton"))
    expect(workspace.toggleLocked).toHaveBeenCalledOnce()
  })

  it("shows arrowhead icon when isDrawing is true", () => {
    renderButtonPane({}, { isDrawing: true })
    const button = screen.getByTestId("painterModeButton")
    expect(button.querySelector("svg")).toBeInTheDocument()
  })

  it("keyboard shortcuts button is the first button in the pane", () => {
    renderButtonPane()
    const pane = screen.getByTestId("keyboardShortcutsButton").parentElement!
    const buttons = pane.querySelectorAll("button")
    expect(buttons[0]).toBe(screen.getByTestId("keyboardShortcutsButton"))
  })

  it("opens keyboard shortcuts dialog when button is clicked", () => {
    renderButtonPane()
    fireEvent.click(screen.getByTestId("keyboardShortcutsButton"))
    expect(screen.getByTestId("keyboardShortcutsDialog")).toBeInTheDocument()
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument()
  })
})
