import { screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
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

  it("calls setActiveTool('arrow') when arrow button is short-pressed", () => {
    const { workspace } = renderButtonPane({ settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true } })
    const btn = screen.getByTestId("arrowToolButton")
    fireEvent.mouseDown(btn)
    fireEvent.mouseUp(btn)
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

  it("shows tooltip with shortcut key on focus for selection tool", async () => {
    renderButtonPane({ settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true } })
    const btn = screen.getByTestId("selectionToolButton")

    await act(async () => { fireEvent.focus(btn) })

    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Selection tool")
    expect(tooltip.querySelector("kbd")).toHaveTextContent("S")
  })

  it("shows tooltip with shortcut key on focus for arrow tool", async () => {
    renderButtonPane({ settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true } })
    const btn = screen.getByTestId("arrowToolButton")

    await act(async () => { fireEvent.focus(btn) })

    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Arrow tool")
    expect(tooltip.querySelector("kbd")).toHaveTextContent("A")
  })

  it("shows tooltip for lock toggle with shortcut", async () => {
    renderButtonPane()
    const btn = screen.getByTestId("lockButton")

    await act(async () => { fireEvent.focus(btn) })

    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Toggle editor lock")
    expect(tooltip.querySelector("kbd")).toHaveTextContent("K")
  })

  it("shows tooltip for menu button with shortcut", async () => {
    renderButtonPane()
    const btn = screen.getByTestId("menuButton")

    await act(async () => { fireEvent.focus(btn) })

    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Toggle management pane")
    expect(tooltip.querySelector("kbd")).toHaveTextContent("M")
  })

  it("shows tooltip without shortcut for keyboard shortcuts button", async () => {
    renderButtonPane()
    const btn = screen.getByTestId("keyboardShortcutsButton")

    await act(async () => { fireEvent.focus(btn) })

    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Keyboard shortcuts")
    expect(tooltip.querySelector("kbd")).not.toBeInTheDocument()
  })

  it("shows arrow style popover when arrowStylePickerOpen is true", () => {
    renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
      arrowStylePickerOpen: true,
    })
    expect(screen.getByTestId("arrowStylePopover")).toBeInTheDocument()
    expect(screen.getByTestId("arrowStylePicker--1")).toBeInTheDocument()
  })

  it("does not show arrow style popover when arrowStylePickerOpen is false", () => {
    renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
      arrowStylePickerOpen: false,
    })
    expect(screen.queryByTestId("arrowStylePopover")).not.toBeInTheDocument()
  })

  it("opens arrow style popover on long press (500ms)", () => {
    vi.useFakeTimers()
    const { workspace } = renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
    })
    const btn = screen.getByTestId("arrowToolButton")

    fireEvent.mouseDown(btn)
    act(() => { vi.advanceTimersByTime(500) })

    expect(workspace.setArrowStylePickerOpen).toHaveBeenCalledWith(true)
    // Long press should NOT activate the tool
    expect(workspace.setActiveTool).not.toHaveBeenCalled()

    fireEvent.mouseUp(btn)
    // After long press fired, mouseUp should not activate tool either
    expect(workspace.setActiveTool).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("does not open popover on short press of arrow button", () => {
    vi.useFakeTimers()
    const { workspace } = renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
    })
    const btn = screen.getByTestId("arrowToolButton")

    fireEvent.mouseDown(btn)
    act(() => { vi.advanceTimersByTime(200) })
    fireEvent.mouseUp(btn)

    expect(workspace.setArrowStylePickerOpen).not.toHaveBeenCalled()
    expect(workspace.setActiveTool).toHaveBeenCalledWith("arrow")

    vi.useRealTimers()
  })

  it("cancels long press when mouse leaves arrow button", () => {
    vi.useFakeTimers()
    const { workspace } = renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
    })
    const btn = screen.getByTestId("arrowToolButton")

    fireEvent.mouseDown(btn)
    act(() => { vi.advanceTimersByTime(200) })
    fireEvent.mouseLeave(btn)
    act(() => { vi.advanceTimersByTime(500) })

    expect(workspace.setArrowStylePickerOpen).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("selecting a style calls setActiveArrowStyle, closes popover, and activates arrow tool", () => {
    const { workspace } = renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
      arrowStylePickerOpen: true,
    })

    fireEvent.click(screen.getByTestId("arrowStyleOption-dashed"))

    expect(workspace.setActiveArrowStyle).toHaveBeenCalledWith("dashed")
    expect(workspace.setArrowStylePickerOpen).toHaveBeenCalledWith(false)
    expect(workspace.setActiveTool).toHaveBeenCalledWith("arrow")
  })

  it("calls updateArrowStyle when a style is selected and an arrow is selected", () => {
    const { workspace } = renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
      arrowStylePickerOpen: true,
      selectedArrow: { layerId: "layer-1", arrowId: "arrow-1" },
    })

    fireEvent.click(screen.getByTestId("arrowStyleOption-dashed"))

    expect(workspace.updateArrowStyle).toHaveBeenCalledWith("layer-1", "arrow-1", "dashed")
    expect(workspace.setActiveArrowStyle).toHaveBeenCalledWith("dashed")
  })

  it("does not call updateArrowStyle when no arrow is selected", () => {
    const { workspace } = renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
      arrowStylePickerOpen: true,
      selectedArrow: null,
    })

    fireEvent.click(screen.getByTestId("arrowStyleOption-dashed"))

    expect(workspace.updateArrowStyle).not.toHaveBeenCalled()
    expect(workspace.setActiveArrowStyle).toHaveBeenCalledWith("dashed")
  })

  it("auto-closes picker when clicking outside", () => {
    const { workspace } = renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
      arrowStylePickerOpen: true,
    })

    // Click somewhere outside the popover and arrow button
    fireEvent.mouseDown(document.body)

    expect(workspace.setArrowStylePickerOpen).toHaveBeenCalledWith(false)
  })

  it("does not auto-close picker when clicking inside the popover", () => {
    const { workspace } = renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
      arrowStylePickerOpen: true,
    })

    const popover = screen.getByTestId("arrowStylePopover")
    fireEvent.mouseDown(popover)

    // setArrowStylePickerOpen should not have been called with false from the auto-close handler
    // (it may be called by the style select handler, but not by the outside click handler)
    const falseCalls = (workspace.setArrowStylePickerOpen as ReturnType<typeof vi.fn>).mock.calls.filter(
      (args: unknown[]) => args[0] === false
    )
    expect(falseCalls).toHaveLength(0)
  })

  it("renders arrow style icon matching activeArrowStyle", () => {
    renderButtonPane({
      settings: { isDarkMode: false, isLayersOn: false, isMultipleRowsLayout: false, isLocked: true, showDrawingToasts: true, showCommentsToasts: true },
      activeArrowStyle: "dashed",
    })
    const btn = screen.getByTestId("arrowToolButton")
    const svg = btn.querySelector("svg")
    expect(svg).toBeInTheDocument()
    // Dashed style uses strokeDasharray
    const line = svg!.querySelector("line")
    expect(line).toHaveAttribute("stroke-dasharray", "4 2.5")
  })
})
