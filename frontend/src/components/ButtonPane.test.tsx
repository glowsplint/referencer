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
    expect(screen.getByTestId("faqButton")).toBeInTheDocument()
    expect(screen.getByTestId("settingsButton")).toBeInTheDocument()
    expect(screen.getByTestId("selectionToolButton")).toBeInTheDocument()
    expect(screen.getByTestId("arrowToolButton")).toBeInTheDocument()
    expect(screen.getByTestId("commentsToolButton")).toBeInTheDocument()
    expect(screen.getByTestId("menuButton")).toBeInTheDocument()
    expect(screen.getByTestId("editorLayoutButton")).toBeInTheDocument()
    expect(screen.getByTestId("lockButton")).toBeInTheDocument()
  })

  it("tool buttons are disabled when editor is not locked", () => {
    renderButtonPane({ settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: false, showDrawingToasts: true, showCommentsToasts: true } })
    expect(screen.getByTestId("selectionToolButton")).toBeDisabled()
    expect(screen.getByTestId("arrowToolButton")).toBeDisabled()
    expect(screen.getByTestId("commentsToolButton")).toBeDisabled()
  })

  it("tool buttons are enabled when editor is locked", () => {
    renderButtonPane({ settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true } })
    expect(screen.getByTestId("selectionToolButton")).toBeEnabled()
    expect(screen.getByTestId("arrowToolButton")).toBeEnabled()
    expect(screen.getByTestId("commentsToolButton")).toBeEnabled()
  })

  it("calls setActiveTool('selection') when selection button is clicked", () => {
    const { workspace } = renderButtonPane({ settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true } })
    fireEvent.click(screen.getByTestId("selectionToolButton"))
    expect(workspace.setActiveTool).toHaveBeenCalledWith("selection")
  })

  it("calls setActiveTool('arrow') when arrow button is clicked", () => {
    const { workspace } = renderButtonPane({ settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true } })
    fireEvent.click(screen.getByTestId("arrowToolButton"))
    expect(workspace.setActiveTool).toHaveBeenCalledWith("arrow")
  })

  it("calls setActiveTool('comments') when comments button is clicked", () => {
    const { workspace } = renderButtonPane({ settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true } })
    fireEvent.click(screen.getByTestId("commentsToolButton"))
    expect(workspace.setActiveTool).toHaveBeenCalledWith("comments")
  })

  it("shows depressed state on the active tool button when locked", () => {
    renderButtonPane({ settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true }, annotations: { activeTool: "arrow" } })
    const arrowBtn = screen.getByTestId("arrowToolButton")
    expect(arrowBtn.className.split(" ")).toContain("bg-accent")
    // Non-active buttons should not have bare bg-accent class
    const selBtn = screen.getByTestId("selectionToolButton")
    expect(selBtn.className.split(" ")).not.toContain("bg-accent")
  })

  it("does not show depressed state on active tool button when unlocked", () => {
    renderButtonPane({ settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: false, showDrawingToasts: true, showCommentsToasts: true }, annotations: { activeTool: "arrow" } })
    const arrowBtn = screen.getByTestId("arrowToolButton")
    expect(arrowBtn.className.split(" ")).not.toContain("bg-accent")
  })

  it("calls toggleManagementPane when menu button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("menuButton"))
    expect(workspace.toggleManagementPane).toHaveBeenCalledOnce()
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

  it("menu button is the first button in the pane", () => {
    renderButtonPane()
    const pane = screen.getByTestId("menuButton").parentElement!
    const buttons = pane.querySelectorAll("button")
    expect(buttons[0]).toBe(screen.getByTestId("menuButton"))
  })

  it("renders dividers between button groups", () => {
    renderButtonPane()
    const pane = screen.getByTestId("menuButton").parentElement!
    const separators = pane.querySelectorAll('[role="separator"]')
    expect(separators).toHaveLength(2)
  })

  it("opens keyboard shortcuts dialog when button is clicked", () => {
    renderButtonPane()
    fireEvent.click(screen.getByTestId("keyboardShortcutsButton"))
    expect(screen.getByTestId("keyboardShortcutsDialog")).toBeInTheDocument()
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument()
  })

  it("opens FAQ dialog when help button is clicked", () => {
    renderButtonPane()
    fireEvent.click(screen.getByTestId("faqButton"))
    expect(screen.getByTestId("faqDialog")).toBeInTheDocument()
    expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument()
  })

  it("opens settings dialog when settings button is clicked", () => {
    renderButtonPane()
    fireEvent.click(screen.getByTestId("settingsButton"))
    expect(screen.getByTestId("settingsDialog")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })
})
