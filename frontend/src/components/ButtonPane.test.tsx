import { screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ButtonPane } from "./ButtonPane"
import { renderWithWorkspace } from "@/test/render-with-workspace"

function renderButtonPane(overrides = {}) {
  return renderWithWorkspace(<ButtonPane />, overrides)
}

describe("ButtonPane", () => {
  it("renders all toggle buttons", () => {
    renderButtonPane()
    expect(screen.getByTestId("keyboardShortcutsButton")).toBeInTheDocument()
    expect(screen.getByTestId("selectionToolButton")).toBeInTheDocument()
    expect(screen.getByTestId("arrowToolButton")).toBeInTheDocument()
    expect(screen.getByTestId("commentsToolButton")).toBeInTheDocument()
    expect(screen.getByTestId("menuButton")).toBeInTheDocument()
    expect(screen.getByTestId("darkModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("editorLayoutButton")).toBeInTheDocument()
    expect(screen.getByTestId("lockButton")).toBeInTheDocument()
  })

  it("calls setActiveTool('selection') when selection button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("selectionToolButton"))
    expect(workspace.setActiveTool).toHaveBeenCalledWith("selection")
  })

  it("calls setActiveTool('arrow') when arrow button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("arrowToolButton"))
    expect(workspace.setActiveTool).toHaveBeenCalledWith("arrow")
  })

  it("calls setActiveTool('comments') when comments button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("commentsToolButton"))
    expect(workspace.setActiveTool).toHaveBeenCalledWith("comments")
  })

  it("shows depressed state on the active tool button", () => {
    renderButtonPane({ annotations: { activeTool: "arrow" } })
    const arrowBtn = screen.getByTestId("arrowToolButton")
    expect(arrowBtn.className.split(" ")).toContain("bg-accent")
    // Non-active buttons should not have bare bg-accent class
    const selBtn = screen.getByTestId("selectionToolButton")
    expect(selBtn.className.split(" ")).not.toContain("bg-accent")
  })

  it("selection tool has depressed state by default", () => {
    renderButtonPane()
    const selBtn = screen.getByTestId("selectionToolButton")
    expect(selBtn.className.split(" ")).toContain("bg-accent")
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

  it("calls toggleLocked when lock button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("lockButton"))
    expect(workspace.toggleLocked).toHaveBeenCalledOnce()
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
